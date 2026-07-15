/**
 * POST /api/ngo-admin/participants/sync
 *
 * STK yöneticisinin kendi kuruluşuna ait KATILIMCILARINI santral rehberine
 * (santralContacts) idempotent olarak senkronlar. Böylece etkinlik/gönüllü
 * katılımcıları, mevcut çağrı/not/durum/WhatsApp altyapısını olduğu gibi
 * kullanır (yeni arama motoru yazmadan).
 *
 * İki kaynak:
 *   - source='event'    : STK'nın etkinliklerine 'going' RSVP veren kullanıcılar
 *   - source='volunteer': STK'ya yapılmış type='Gönüllülük' başvuruları
 *
 * Eşleştirme: aynı (ngoId, phone) → aynı santralContacts doc. Telefon yoksa
 * (ör. RSVP kullanıcısının profilinde telefon yok) contact YAZILMAZ ama
 * skipped sayılır (UI "telefonsuz N kişi" uyarısı gösterebilir). Var olan
 * kişinin NOTU / DURUMU / attempts alanı KORUNUR — yalnız kaynak etiketleri
 * (participantSources) ve ad/mail güncellenir.
 *
 * KVKK: yalnız caller'ın managedNgoId'sine ait veri; cross-tenant erişim yok.
 * Body: { source: 'event' | 'volunteer' }
 * Yanıt: { synced, matched, created, skippedNoPhone }
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';
import { FieldValue } from 'firebase-admin/firestore';
import { normalizePhoneTr } from '@/lib/santral/normalize-phone';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CONTACTS = 'santralContacts';
const CALL_SESSIONS = 'callSessions';
const BATCH_SIZE = 400;

const OWNER_EMAIL = 'ismailhilmi@hangel.org';

interface Identity { uid: string; managedNgoId?: string; role?: string; email?: string; }
interface CallerContext {
  uid: string;
  ngoId: string;
}

async function identify(req: NextRequest): Promise<Identity | null> {
  const authHeader = req.headers.get('authorization') || '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!idToken) return null;
  try {
    const decoded = (await getAdminAuth().verifyIdToken(idToken)) as { uid: string; email?: string };
    const snap = await getAdminFirestore().collection(COLLECTIONS.users).doc(decoded.uid).get();
    if (!snap.exists) return null;
    const d = snap.data() as { role?: string; managedNgoId?: string };
    return { uid: decoded.uid, managedNgoId: d?.managedNgoId, role: d?.role, email: decoded.email };
  } catch {
    return null;
  }
}

// super-admin/sahip body'deki ngoId'yi kullanır; ngo-admin kendi managedNgoId'sine sabit.
function resolveNgo(id: Identity, requestedNgoId: string | null): CallerContext | null {
  const isOwner = id.role === 'super-admin' || id.email === OWNER_EMAIL;
  if (isOwner) {
    const target = (requestedNgoId || '').trim() || id.managedNgoId;
    if (!target) return null;
    return { uid: id.uid, ngoId: target };
  }
  if (id.role !== 'ngo-admin' || !id.managedNgoId) return null;
  if (requestedNgoId && requestedNgoId.trim() && requestedNgoId.trim() !== id.managedNgoId) return null;
  return { uid: id.uid, ngoId: id.managedNgoId };
}

type Person = {
  name: string;
  phone: string;         // E.164
  email: string | null;
  sourceLabel: string;   // hangi etkinlik/görev
  sourceRefId: string;   // eventId veya applicationId
  when: string;          // tarih (görsel)
  attended?: boolean;    // check-in yaptı mı (etkinlik yoklaması)
};

/** STK'nın etkinliklerindeki 'going' RSVP'lerden telefonlu katılımcıları topla. */
async function collectEventParticipants(ngoId: string): Promise<Person[]> {
  const db = getAdminFirestore();
  // Bu STK'nın etkinlikleri (organizerId ya da ngoId ile).
  const [byOrg, byNgo] = await Promise.all([
    db.collection(COLLECTIONS.events).where('organizerId', '==', ngoId).get(),
    db.collection(COLLECTIONS.events).where('ngoId', '==', ngoId).get(),
  ]);
  const eventsById = new Map<string, FirebaseFirestore.QueryDocumentSnapshot>();
  for (const d of [...byOrg.docs, ...byNgo.docs]) eventsById.set(d.id, d);

  const people: Person[] = [];
  const seenUidPerEvent = new Set<string>();
  for (const [eventId, evSnap] of eventsById) {
    const ev = evSnap.data() as { name?: string; startDate?: string; date?: string };
    const [rsvps, checkins] = await Promise.all([
      evSnap.ref.collection(COLLECTIONS.eventRsvps).where('status', '==', 'going').get(),
      evSnap.ref.collection(COLLECTIONS.eventCheckins).get(),
    ]);
    // Bu etkinliğe check-in yapmış uid'ler → "geldi" yoklaması (otomatik).
    const checkedInUids = new Set(checkins.docs.map((c) => (c.data() as { uid?: string }).uid || c.id));
    const uids = rsvps.docs.map((r) => r.id);
    if (uids.length === 0) continue;
    // users docs → name/phone/email
    const refs = uids.map((u) => db.collection(COLLECTIONS.users).doc(u));
    const userDocs = await db.getAll(...refs);
    for (const ud of userDocs) {
      const key = `${eventId}:${ud.id}`;
      if (seenUidPerEvent.has(key)) continue;
      seenUidPerEvent.add(key);
      const u = ud.data() as
        | { name?: string; personalInfo?: { email?: string; phone?: string } }
        | undefined;
      const phone = normalizePhoneTr(u?.personalInfo?.phone || '');
      const attended = checkedInUids.has(ud.id);
      if (!phone) { people.push({ name: (u?.name || '').trim(), phone: '', email: (u?.personalInfo?.email || '').trim() || null, sourceLabel: ev.name || 'Etkinlik', sourceRefId: eventId, when: ev.startDate || ev.date || '', attended }); continue; }
      people.push({
        name: (u?.name || '').trim() || 'Katılımcı',
        phone,
        email: (u?.personalInfo?.email || '').trim() || null,
        sourceLabel: ev.name || 'Etkinlik',
        sourceRefId: eventId,
        when: ev.startDate || ev.date || '',
        attended,
      });
    }
  }
  return people;
}

/** STK'ya yapılmış gönüllü başvurularından telefonlu katılımcıları topla. */
async function collectVolunteerParticipants(ngoId: string): Promise<Person[]> {
  const db = getAdminFirestore();
  // applications: type='Gönüllülük' + entityId==ngoId. entityId yoksa org adıyla
  // eşleşme güvenilmez olduğu için entityId'li kayıtlar hedeflenir.
  const appsSnap = await db
    .collection(COLLECTIONS.applications)
    .where('entityId', '==', ngoId)
    .where('type', '==', 'Gönüllülük')
    .get();

  const people: Person[] = [];
  // Başvuran kullanıcıların profil telefonlarını topluca çek.
  const uids = Array.from(new Set(appsSnap.docs.map((d) => (d.data() as { userId?: string }).userId).filter((x): x is string => !!x)));
  const userById = new Map<string, { name?: string; email?: string; phone?: string }>();
  for (let i = 0; i < uids.length; i += 100) {
    const chunk = uids.slice(i, i + 100).map((u) => db.collection(COLLECTIONS.users).doc(u));
    const docs = await db.getAll(...chunk);
    for (const d of docs) {
      const u = d.data() as { name?: string; personalInfo?: { email?: string; phone?: string } } | undefined;
      userById.set(d.id, { name: u?.name, email: u?.personalInfo?.email, phone: u?.personalInfo?.phone });
    }
  }
  for (const d of appsSnap.docs) {
    const a = d.data() as { userId?: string; userName?: string; title?: string; date?: string };
    const u = a.userId ? userById.get(a.userId) : undefined;
    const phone = normalizePhoneTr(u?.phone || '');
    const name = (u?.name || a.userName || '').trim() || 'Gönüllü';
    const email = (u?.email || '').trim() || null;
    if (!phone) { people.push({ name, phone: '', email, sourceLabel: a.title || 'Gönüllülük', sourceRefId: d.id, when: a.date || '' }); continue; }
    people.push({ name, phone, email, sourceLabel: a.title || 'Gönüllülük', sourceRefId: d.id, when: a.date || '' });
  }
  return people;
}

export async function POST(req: NextRequest) {
  const id = await identify(req);
  if (!id) {
    return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'Oturum gerekli.' }, { status: 403 });
  }
  let body: { source?: string; ngoId?: string };
  try { body = await req.json(); } catch { body = {}; }
  const ctx = resolveNgo(id, body.ngoId ?? null);
  if (!ctx) {
    return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'Bu STK için yetkiniz yok.' }, { status: 403 });
  }
  const source = body.source === 'volunteer' ? 'volunteer' : body.source === 'event' ? 'event' : null;
  if (!source) {
    return NextResponse.json({ errorCode: 'BAD_INPUT', message: "source 'event' veya 'volunteer' olmalı." }, { status: 400 });
  }

  const db = getAdminFirestore();
  const people = source === 'event'
    ? await collectEventParticipants(ctx.ngoId)
    : await collectVolunteerParticipants(ctx.ngoId);

  const withPhone = people.filter((p) => p.phone);
  const skippedNoPhone = people.length - withPhone.length;

  // Telefona göre tekilleştir; aynı kişi birden çok etkinlikten gelirse
  // kaynaklar birleştirilir. attendedAuto: kişi HERHANGİ bir etkinliğe
  // check-in yaptıysa true (otomatik yoklama).
  const byPhone = new Map<string, Person & { sources: { label: string; refId: string; when: string; attended: boolean }[]; attendedAuto: boolean }>();
  for (const p of withPhone) {
    const cur = byPhone.get(p.phone);
    const srcEntry = { label: p.sourceLabel, refId: p.sourceRefId, when: p.when, attended: !!p.attended };
    if (cur) {
      cur.sources.push(srcEntry);
      if (p.attended) cur.attendedAuto = true;
      if (!cur.email && p.email) cur.email = p.email;
    } else {
      byPhone.set(p.phone, { ...p, sources: [srcEntry], attendedAuto: !!p.attended });
    }
  }

  // Mevcut kişileri telefonla eşle (bu STK'nın rehberi).
  const existingByPhone = new Map<string, { id: string }>();
  const existingSnap = await db.collection(CONTACTS).where('ngoId', '==', ctx.ngoId).get();
  for (const d of existingSnap.docs) {
    const ph = (d.data() as { phone?: string }).phone;
    if (ph) existingByPhone.set(ph, { id: d.id });
  }

  let matched = 0;
  let created = 0;
  const entries = Array.from(byPhone.values());
  for (let i = 0; i < entries.length; i += BATCH_SIZE) {
    const slice = entries.slice(i, i + BATCH_SIZE);
    const batch = db.batch();
    for (const p of slice) {
      const existing = existingByPhone.get(p.phone);
      const sourcesPayload = p.sources.slice(0, 50); // makul sınır
      // Otomatik yoklama: check-in varsa attendance='attended' yazılır. Manuel
      // işaret (attendanceManual) varsa ONA dokunulmaz (yönetici override üstün).
      const autoAttendance = source === 'event' && p.attendedAuto ? { attendance: 'attended' } : {};
      if (existing) {
        // NOT/DURUM/attempts/attendanceManual KORUNUR — yalnız kaynak + iletişim
        // + otomatik yoklama tazelenir.
        const ref = db.collection(CONTACTS).doc(existing.id);
        batch.set(ref, {
          name: p.name,
          ...(p.email ? { email: p.email } : {}),
          participantSources: FieldValue.arrayUnion(source),
          [`participantRefs.${source}`]: sourcesPayload,
          ...autoAttendance,
          updatedAt: FieldValue.serverTimestamp(),
        }, { merge: true });
        matched++;
      } else {
        const ref = db.collection(CONTACTS).doc();
        batch.set(ref, {
          ngoId: ctx.ngoId,
          listIds: [],
          name: p.name,
          phone: p.phone,
          ...(p.email ? { email: p.email } : {}),
          customFields: {},
          attempts: 0,
          participantSources: [source],
          participantRefs: { [source]: sourcesPayload },
          ...autoAttendance,
          createdAt: FieldValue.serverTimestamp(),
        });
        created++;
      }
    }
    await batch.commit();
  }
  void CALL_SESSIONS;

  return NextResponse.json({
    synced: matched + created,
    matched,
    created,
    skippedNoPhone,
  });
}
