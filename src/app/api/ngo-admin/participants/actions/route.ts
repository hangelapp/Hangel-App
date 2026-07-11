/**
 * POST /api/ngo-admin/participants/actions
 *
 * Katılımcılar üzerinde toplu/tekil aksiyonlar:
 *   - action='attendance': { ids: string[], value: 'attended'|'absent'|'clear' }
 *       Manuel yoklama işareti (attendanceManual). Yönetici override — otomatik
 *       check-in yoklamasının üstündedir.
 *   - action='broadcast':  { ids: string[], channel: 'sms'|'mail', message, subject? }
 *       Seçili katılımcılara toplu SMS/e-posta — mevcut messaging/send (kotalı)
 *       altyapısına proxy'ler.
 *   - action='assign':     { ids: string[], assignedToUid: string|null, assignedToName?: string }
 *       "Bu kişiyi ara" sorumlusu — ekip üyesini katılımcıya atar (null = kaldır).
 *
 * KVKK: yalnız caller'ın managedNgoId'sine ait santralContacts kayıtları.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { COLLECTIONS } from '@/firebase/collections';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CONTACTS = 'santralContacts';
const MAX_IDS = 2000;

interface CallerContext { uid: string; ngoId: string; token: string; }

async function authorize(req: NextRequest): Promise<CallerContext | null> {
  const authHeader = req.headers.get('authorization') || '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!idToken) return null;
  try {
    const decoded = await getAdminAuth().verifyIdToken(idToken);
    const snap = await getAdminFirestore().collection(COLLECTIONS.users).doc(decoded.uid).get();
    if (!snap.exists) return null;
    const d = snap.data() as { role?: string; managedNgoId?: string };
    if (!d?.managedNgoId) return null;
    if (d.role !== 'ngo-admin' && d.role !== 'super-admin') return null;
    return { uid: decoded.uid, ngoId: d.managedNgoId, token: idToken };
  } catch {
    return null;
  }
}

/** Verilen id'lerin bu STK'ya ait olduğunu doğrula + doc verilerini döndür. */
async function loadOwnedContacts(ngoId: string, ids: string[]) {
  const db = getAdminFirestore();
  const refs = ids.slice(0, MAX_IDS).map((id) => db.collection(CONTACTS).doc(id));
  const docs = await db.getAll(...refs);
  return docs.filter((d) => d.exists && (d.data() as { ngoId?: string }).ngoId === ngoId);
}

export async function POST(req: NextRequest) {
  const ctx = await authorize(req);
  if (!ctx) {
    return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'NGO admin yetkisi gerekli.' }, { status: 403 });
  }
  let body: { action?: string; ids?: unknown; value?: string; channel?: string; message?: string; subject?: string; assignedToUid?: string | null; assignedToName?: string };
  try { body = await req.json(); } catch { body = {}; }

  const ids = Array.isArray(body.ids) ? body.ids.filter((x): x is string => typeof x === 'string' && !!x) : [];
  if (ids.length === 0) {
    return NextResponse.json({ errorCode: 'NO_IDS', message: 'En az bir katılımcı seçilmeli.' }, { status: 400 });
  }

  const db = getAdminFirestore();

  // ── Yoklama ──────────────────────────────────────────────────────────────
  if (body.action === 'attendance') {
    const value = body.value;
    if (value !== 'attended' && value !== 'absent' && value !== 'clear') {
      return NextResponse.json({ errorCode: 'BAD_VALUE', message: "value 'attended' | 'absent' | 'clear' olmalı." }, { status: 400 });
    }
    const owned = await loadOwnedContacts(ctx.ngoId, ids);
    let updated = 0;
    for (let i = 0; i < owned.length; i += 400) {
      const batch = db.batch();
      for (const d of owned.slice(i, i + 400)) {
        batch.set(d.ref, {
          attendanceManual: value === 'clear' ? FieldValue.delete() : value,
          updatedAt: FieldValue.serverTimestamp(),
        }, { merge: true });
        updated++;
      }
      await batch.commit();
    }
    return NextResponse.json({ updated });
  }

  // ── Toplu mesaj (SMS/mail) ────────────────────────────────────────────────
  if (body.action === 'broadcast') {
    const channel = body.channel === 'mail' ? 'mail' : body.channel === 'sms' ? 'sms' : null;
    const message = typeof body.message === 'string' ? body.message.trim() : '';
    if (!channel) return NextResponse.json({ errorCode: 'BAD_CHANNEL', message: "channel 'sms' veya 'mail' olmalı." }, { status: 400 });
    if (!message) return NextResponse.json({ errorCode: 'EMPTY_MESSAGE', message: 'Mesaj boş olamaz.' }, { status: 400 });

    const owned = await loadOwnedContacts(ctx.ngoId, ids);
    const recipients = owned
      .map((d) => {
        const data = d.data() as { phone?: string; email?: string };
        return channel === 'sms' ? (data.phone || '') : (data.email || '');
      })
      .filter(Boolean);
    if (recipients.length === 0) {
      return NextResponse.json({ errorCode: 'NO_RECIPIENTS', message: channel === 'sms' ? 'Telefonu olan katılımcı yok.' : 'E-postası olan katılımcı yok.' }, { status: 400 });
    }

    // Mevcut kotalı gönderim API'sine proxy — kota/audit/sağlayıcı tek yerde.
    const origin = new URL(req.url).origin;
    const res = await fetch(`${origin}/api/ngo-admin/messaging/send`, {
      method: 'POST',
      headers: { authorization: `Bearer ${ctx.token}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        ngoId: ctx.ngoId,
        channel,
        recipients,
        message,
        ...(channel === 'mail' && body.subject ? { subject: String(body.subject) } : {}),
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json({ errorCode: data.errorCode || 'SEND_FAILED', message: data.message || 'Gönderim başarısız.', recipientsTargeted: recipients.length }, { status: res.status });
    }
    return NextResponse.json({ ...data, recipientsTargeted: recipients.length });
  }

  // ── Sorumlu atama ─────────────────────────────────────────────────────────
  if (body.action === 'assign') {
    const assignedToUid = typeof body.assignedToUid === 'string' && body.assignedToUid ? body.assignedToUid : null;
    const assignedToName = typeof body.assignedToName === 'string' ? body.assignedToName.trim() : '';
    // assignedToUid verildiyse gerçekten bu STK'nın ekip üyesi mi? (yetki sızıntısı önle)
    if (assignedToUid) {
      const memberSnap = await db.collection(COLLECTIONS.users).doc(assignedToUid).get();
      const m = memberSnap.data() as { managedNgoId?: string } | undefined;
      const ownsOrg = m?.managedNgoId === ctx.ngoId;
      let invited = ownsOrg;
      if (!invited) {
        const inv = await db.collection(COLLECTIONS.userInvitations)
          .where('inviteeUserId', '==', assignedToUid)
          .where('ngoId', '==', ctx.ngoId)
          .limit(1).get();
        invited = !inv.empty && inv.docs[0].data().status !== 'revoked';
      }
      if (!invited) {
        return NextResponse.json({ errorCode: 'NOT_TEAM_MEMBER', message: 'Sorumlu bu kuruluşun ekip üyesi olmalı.' }, { status: 400 });
      }
    }
    const owned = await loadOwnedContacts(ctx.ngoId, ids);
    let updated = 0;
    for (let i = 0; i < owned.length; i += 400) {
      const batch = db.batch();
      for (const d of owned.slice(i, i + 400)) {
        batch.set(d.ref, {
          assignedToUid: assignedToUid ?? FieldValue.delete(),
          assignedToName: assignedToUid ? (assignedToName || 'Ekip üyesi') : FieldValue.delete(),
          updatedAt: FieldValue.serverTimestamp(),
        }, { merge: true });
        updated++;
      }
      await batch.commit();
    }
    return NextResponse.json({ updated });
  }

  return NextResponse.json({ errorCode: 'BAD_ACTION', message: 'Bilinmeyen aksiyon.' }, { status: 400 });
}
