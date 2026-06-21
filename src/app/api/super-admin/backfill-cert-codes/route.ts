/**
 * POST /api/super-admin/backfill-cert-codes
 *
 * gcloud/terminal GEREKMEDEN, App Hosting içinde Admin SDK (ADC) ile çalışan
 * tek-tık "TÜM sertifikaları geriye dönük üret + yayınla" aksiyonu. Kurum
 * (STK/marka/kulüp), etkinlik, gönüllülük ve kan sertifikalarını üretir,
 * doğrulanabilir (kod + /c) hale getirir. Her şey AYNI sıralı sayaçları +
 * üretim akışlarını (complete / impact / donor-status) kullanır → yeni
 * sertifikalarla ASLA çakışmaz.
 *
 * FAZLAR (her biri idempotent — yapılmış olan atlanır):
 *  1. org-impact : ngos + brands + clubs döngüsü → upsertOrgImpactCerts
 *                  (toplam + aylık). Kod: orgImpactCertCode (deterministik).
 *                  İdempotent anahtar: certId org-impact-{kind}-{orgId}-{total|ym}.
 *  2. event      : code'u OLMAYAN type==='event' sertifikalarına yapısal kod.
 *                  Sayaç: counters/cert-act-event-{yıl}. İdempotent: code varsa atla.
 *  3. volunteer  : onaylı volunteerCompletions (ngoApproved===true) için
 *                  type==='volunteer' sertifikası ÜRET (önceden saklanmıyordu).
 *                  certId vcert-{completionId}. Sayaç: counters/cert-act-volunteer-{yıl}.
 *                  İdempotent: vcert dokümanı varsa atla.
 *  4. blood      : type==='blood' olup code'u OLMAYAN sertifikalara yapısal kod.
 *                  Sayaç: counters/cert-act-blood-{yıl}. İdempotent: code varsa atla.
 *
 * Yetki: yalnız super-admin (Bearer ID token).
 * Tek çağrıda en çok PER_CALL_CAP yazma işlenir; remaining>0 ise buton tekrar basılır.
 *
 * Body/query:
 *   { dry?: boolean }            dry=true → tarar + sayar + örnek döner, HİÇ yazmaz.
 *   ?scope=all|org-impact|event|volunteer|blood   (default all)
 *
 * Dönüş: {
 *   ok, dry, scope,
 *   phases: { 'org-impact':{scanned,updated}, event:{scanned,updated},
 *             volunteer:{scanned,updated}, blood:{scanned,updated} },
 *   remaining, sample
 * }
 * Raw error.message ASLA sızdırılmaz.
 */
import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';
import { buildCertCode } from '@/lib/certificate-code';
import {
  computeOrgImpact,
  fetchOrgName,
  orgImpactPeriods,
  upsertOrgImpactCerts,
  ORG_ENTITY_COLLECTION,
  type OrgKind,
} from '@/lib/org-impact';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CERT_COUNTRY = '90'; // TR — üretim akışlarıyla aynı.
const PER_CALL_CAP = 500; // Tek çağrıda toplam yazma tavanı (timeout'tan kaçınmak için).
const DRY_SAMPLE = 10;

type Scope = 'all' | 'org-impact' | 'event' | 'volunteer' | 'blood';
const SCOPES: readonly Scope[] = ['all', 'org-impact', 'event', 'volunteer', 'blood'];
const ORG_KINDS: readonly OrgKind[] = ['ngo', 'brand', 'club'];

interface PhaseCount {
  scanned: number;
  updated: number;
}
interface Phases {
  'org-impact': PhaseCount;
  event: PhaseCount;
  volunteer: PhaseCount;
  blood: PhaseCount;
}

function emptyPhases(): Phases {
  return {
    'org-impact': { scanned: 0, updated: 0 },
    event: { scanned: 0, updated: 0 },
    volunteer: { scanned: 0, updated: 0 },
    blood: { scanned: 0, updated: 0 },
  };
}

function errJson(errorCode: string, message: string, status: number) {
  return NextResponse.json({ errorCode, message }, { status });
}

async function isSuperAdmin(req: NextRequest): Promise<boolean> {
  const authHeader = req.headers.get('authorization') || '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!idToken) return false;
  try {
    const decoded = (await getAdminAuth().verifyIdToken(idToken)) as {
      uid: string;
      role?: string;
      superAdminPermissions?: unknown;
    };
    if (decoded.role === 'super-admin' || !!decoded.superAdminPermissions) return true;
    const snap = await getAdminFirestore().collection(COLLECTIONS.users).doc(decoded.uid).get();
    const d = snap.data();
    return (
      d?.role === 'super-admin' ||
      (Array.isArray(d?.superAdminPermissions) && d.superAdminPermissions.length > 0)
    );
  } catch {
    return false;
  }
}

// Atomik sıralı sayaç (counters/{name}.next) — complete/donor-status route ile AYNI helper.
async function nextSeq(db: FirebaseFirestore.Firestore, name: string, start: number): Promise<number> {
  const ref = db.collection('counters').doc(name);
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const cur = snap.exists ? ((snap.data() as { next?: number }).next ?? start) : start;
    tx.set(ref, { next: cur + 1 }, { merge: true });
    return cur;
  });
}

// Yılı startDate / sertifika date / completedAt adaylarından çıkar.
function yearOf(...candidates: unknown[]): number {
  for (const c of candidates) {
    if (!c) continue;
    let d: Date | null = null;
    if (typeof c === 'string') {
      d = new Date(c);
    } else if (typeof c === 'object') {
      const obj = c as { seconds?: number; toDate?: () => Date };
      if (typeof obj.seconds === 'number') {
        d = new Date(obj.seconds * 1000);
      } else if (typeof obj.toDate === 'function') {
        try {
          d = obj.toDate();
        } catch {
          d = null;
        }
      }
    }
    if (d && !Number.isNaN(d.getTime())) return d.getFullYear();
  }
  return new Date().getFullYear();
}

// ---------------------------------------------------------------------------
// FAZ 1 — org-impact (kurum etki sertifikaları: ngo + brand + club)
// ---------------------------------------------------------------------------
async function phaseOrgImpact(
  db: FirebaseFirestore.Firestore,
  dry: boolean,
  budget: number,
  sample: string[],
): Promise<PhaseCount> {
  const out: PhaseCount = { scanned: 0, updated: 0 };
  for (const kind of ORG_KINDS) {
    let snap: FirebaseFirestore.QuerySnapshot;
    try {
      snap = await db.collection(ORG_ENTITY_COLLECTION[kind]).get();
    } catch {
      continue; // koleksiyon yoksa atla
    }
    for (const orgDoc of snap.docs) {
      out.scanned += 1;
      if (out.updated >= budget) continue; // bütçe doldu — kalanı say (remaining için)
      const orgId = orgDoc.id;
      const { orgName } = await fetchOrgName(db, kind, orgId);
      const impact = await computeOrgImpact(db, orgId);
      if (dry) {
        for (const p of orgImpactPeriods(kind, orgId, orgName, impact)) {
          if (sample.length < DRY_SAMPLE) sample.push(p.code);
        }
        out.updated += 1; // dry'da "işlenecek kurum" sayısı
        continue;
      }
      try {
        await upsertOrgImpactCerts(db, kind, orgId, orgName, impact);
        out.updated += 1;
      } catch {
        /* tek kurum yazılamazsa diğerleri devam etsin */
      }
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// FAZ 2 — event (kodsuz etkinlik sertifikalarına yapısal kod)
// ---------------------------------------------------------------------------
interface PendingEventCert {
  id: string;
  userId?: string;
  date?: unknown;
  completedAt?: unknown;
}

async function phaseEvent(
  db: FirebaseFirestore.Firestore,
  dry: boolean,
  budget: number,
  sample: string[],
): Promise<PhaseCount> {
  const out: PhaseCount = { scanned: 0, updated: 0 };
  const groups = new Map<string, PendingEventCert[]>();

  const snap = await db.collection(COLLECTIONS.certificates).get();
  for (const doc of snap.docs) {
    out.scanned += 1;
    const d = doc.data() as {
      code?: unknown; type?: unknown; eventId?: unknown; userId?: unknown; date?: unknown; completedAt?: unknown;
    };
    if (d.code) continue; // idempotent — zaten kodu var.
    const type = typeof d.type === 'string' && d.type ? d.type : doc.id.startsWith('evt-') ? 'event' : '';
    if (type !== 'event' || typeof d.eventId !== 'string' || !d.eventId) continue;
    const list = groups.get(d.eventId) ?? [];
    list.push({
      id: doc.id,
      userId: typeof d.userId === 'string' ? d.userId : undefined,
      date: d.date,
      completedAt: d.completedAt,
    });
    groups.set(d.eventId, list);
  }

  if (dry) {
    for (const [eventId, certs] of groups) {
      const evSnap = await db.collection(COLLECTIONS.events).doc(eventId).get();
      const ev = (evSnap.exists ? evSnap.data() : {}) as { startDate?: unknown; certActivityNo?: number; certPersonSeq?: number };
      const year = yearOf(ev.startDate, certs[0]?.date, certs[0]?.completedAt);
      const activityNo = ev.certActivityNo && ev.certActivityNo >= 1 ? ev.certActivityNo : 1;
      let personSeq = ev.certPersonSeq ?? 0;
      const sorted = [...certs].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
      for (const _c of sorted) {
        personSeq += 1;
        out.updated += 1;
        if (sample.length < DRY_SAMPLE) {
          sample.push(buildCertCode({ kind: 'event', country: CERT_COUNTRY, year, activityNo, personNo: personSeq }));
        }
      }
    }
    return out;
  }

  for (const [eventId, certs] of groups) {
    if (out.updated >= budget) {
      out.updated += certs.length; // bütçe doldu — kalanı say
      continue;
    }
    const evRef = db.collection(COLLECTIONS.events).doc(eventId);
    const evSnap = await evRef.get();
    const ev = (evSnap.exists ? evSnap.data() : {}) as { startDate?: unknown; certActivityNo?: number; certPersonSeq?: number };
    const year = yearOf(ev.startDate, certs[0]?.date, certs[0]?.completedAt);

    // Faaliyet no — complete route ile AYNI: doc'ta ≥1 varsa onu kullan, yoksa sayaçtan al.
    let activityNo = ev.certActivityNo ?? 0;
    if (!(activityNo >= 1)) {
      activityNo = await nextSeq(db, `cert-act-event-${year}`, 1);
      if (evSnap.exists) await evRef.set({ certActivityNo: activityNo }, { merge: true }).catch(() => undefined);
    }
    let personSeq = ev.certPersonSeq ?? 0;

    const sorted = [...certs].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
    const batch = db.batch();
    for (const c of sorted) {
      if (out.updated >= budget) break;
      personSeq += 1;
      const code = buildCertCode({ kind: 'event', country: CERT_COUNTRY, year, activityNo, personNo: personSeq });
      const patch = {
        code, certCountry: CERT_COUNTRY, certYear: year, certActivityNo: activityNo, certPersonNo: personSeq,
      };
      batch.set(db.collection(COLLECTIONS.certificates).doc(c.id), patch, { merge: true });
      if (c.userId) {
        batch.set(
          db.collection(COLLECTIONS.users).doc(c.userId).collection(COLLECTIONS.certificates).doc(c.id),
          patch,
          { merge: true },
        );
      }
      out.updated += 1;
    }
    if (evSnap.exists) batch.set(evRef, { certPersonSeq: personSeq }, { merge: true });
    await batch.commit();
  }
  return out;
}

// ---------------------------------------------------------------------------
// FAZ 3 — volunteer (onaylı tamamlamalardan sertifika ÜRET)
// ---------------------------------------------------------------------------
async function phaseVolunteer(
  db: FirebaseFirestore.Firestore,
  dry: boolean,
  budget: number,
  sample: string[],
): Promise<PhaseCount> {
  const out: PhaseCount = { scanned: 0, updated: 0 };

  let snap: FirebaseFirestore.QuerySnapshot;
  try {
    snap = await db.collection(COLLECTIONS.volunteerCompletions).where('ngoApproved', '==', true).get();
  } catch {
    return out; // koleksiyon/index yoksa faz 0
  }

  // Görev başlıklarını dön-başına tek çek (cache).
  const taskCache = new Map<string, { title: string; ngoName: string }>();
  const getTask = async (taskId: string): Promise<{ title: string; ngoName: string }> => {
    const cached = taskCache.get(taskId);
    if (cached) return cached;
    let info = { title: 'Gönüllülük', ngoName: 'STK' };
    try {
      const t = await db.collection(COLLECTIONS.volunteering).doc(taskId).get();
      const d = t.data() as { title?: string; ngoName?: string } | undefined;
      if (d) info = { title: d.title ?? 'Gönüllülük', ngoName: d.ngoName ?? 'STK' };
    } catch {
      /* best-effort */
    }
    taskCache.set(taskId, info);
    return info;
  };

  for (const doc of snap.docs) {
    out.scanned += 1;
    const certId = `vcert-${doc.id}`;
    if ((await db.collection(COLLECTIONS.certificates).doc(certId).get()).exists) continue; // idempotent
    if (out.updated >= budget) {
      out.updated += 1; // bütçe doldu — kalanı say
      continue;
    }

    const d = doc.data() as {
      userId?: string; taskId?: string; ngoId?: string;
      hoursLogged?: number; adjustedHours?: number; impactValueTRY?: number; professionLabel?: string;
      approvedAt?: unknown; completedAt?: unknown; createdAt?: unknown;
    };
    const userId = typeof d.userId === 'string' ? d.userId : '';
    const taskId = typeof d.taskId === 'string' ? d.taskId : '';
    if (!userId || !taskId) continue;

    const year = yearOf(d.approvedAt, d.completedAt, d.createdAt);
    const hours = d.adjustedHours !== undefined ? d.adjustedHours : (d.hoursLogged ?? 0);
    const impactValueTRY = typeof d.impactValueTRY === 'number' ? d.impactValueTRY : 0;

    if (dry) {
      // Sayaç dokunulmadan, yapı örneği üret (faaliyet 1 placeholder).
      out.updated += 1;
      if (sample.length < DRY_SAMPLE) {
        sample.push(buildCertCode({ kind: 'volunteer', country: CERT_COUNTRY, year, activityNo: 1, personNo: out.updated }));
      }
      continue;
    }

    // Faaliyet no — yıl bazında sıralı; her gönüllülük sertifikası ayrı faaliyet sayar
    // (kişi başı 1 → blood/event ile aynı sayaç mantığı, çakışmaz).
    const activityNo = await nextSeq(db, `cert-act-volunteer-${year}`, 1);

    const task = await getTask(taskId);
    const code = buildCertCode({ kind: 'volunteer', country: CERT_COUNTRY, year, activityNo, personNo: 1 });
    const cert = {
      id: certId, userId, taskId, ngoId: typeof d.ngoId === 'string' ? d.ngoId : '',
      type: 'volunteer', title: task.title, role: 'volunteer', ngoName: task.ngoName,
      date: new Date(year, 0, 1).toISOString().slice(0, 10),
      hoursLogged: hours, impactValueTRY,
      ...(d.professionLabel ? { professionLabel: d.professionLabel } : {}),
      code, certCountry: CERT_COUNTRY, certYear: year, certActivityNo: activityNo, certPersonNo: 1,
      completedAt: FieldValue.serverTimestamp(), issuedBy: 'super-admin-backfill',
    };
    const batch = db.batch();
    batch.set(db.collection(COLLECTIONS.certificates).doc(certId), cert);
    batch.set(db.collection(COLLECTIONS.users).doc(userId).collection(COLLECTIONS.certificates).doc(certId), cert);
    await batch.commit();
    out.updated += 1;
  }
  return out;
}

// ---------------------------------------------------------------------------
// FAZ 4 — blood (kodsuz kan sertifikalarına yapısal kod)
// ---------------------------------------------------------------------------
async function phaseBlood(
  db: FirebaseFirestore.Firestore,
  dry: boolean,
  budget: number,
  sample: string[],
): Promise<PhaseCount> {
  const out: PhaseCount = { scanned: 0, updated: 0 };

  let snap: FirebaseFirestore.QuerySnapshot;
  try {
    snap = await db.collection(COLLECTIONS.certificates).where('type', '==', 'blood').get();
  } catch {
    return out;
  }

  for (const doc of snap.docs) {
    out.scanned += 1;
    const d = doc.data() as { code?: unknown; userId?: unknown; date?: unknown; completedAt?: unknown };
    if (d.code) continue; // idempotent

    const year = yearOf(d.date, d.completedAt);
    if (dry) {
      out.updated += 1;
      if (sample.length < DRY_SAMPLE) {
        sample.push(buildCertCode({ kind: 'blood', country: CERT_COUNTRY, year, activityNo: 1, personNo: out.updated }));
      }
      continue;
    }
    if (out.updated >= budget) {
      out.updated += 1; // bütçe doldu — kalanı say
      continue;
    }

    // Kodsuz (legacy) blood cert: talep no'su bilinmiyor → yıl bazında yeni faaliyet+kişi sırası.
    const activityNo = await nextSeq(db, `cert-act-blood-${year}`, 1);

    const code = buildCertCode({ kind: 'blood', country: CERT_COUNTRY, year, activityNo, personNo: 1 });
    const patch = { code, certCountry: CERT_COUNTRY, certYear: year, certActivityNo: activityNo, certPersonNo: 1 };
    const batch = db.batch();
    batch.set(db.collection(COLLECTIONS.certificates).doc(doc.id), patch, { merge: true });
    const userId = typeof d.userId === 'string' ? d.userId : '';
    if (userId) {
      batch.set(
        db.collection(COLLECTIONS.users).doc(userId).collection(COLLECTIONS.certificates).doc(doc.id),
        patch,
        { merge: true },
      );
    }
    await batch.commit();
    out.updated += 1;
  }
  return out;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!(await isSuperAdmin(req))) {
    return errJson('forbidden', 'Super-admin yetkisi gerekli.', 403);
  }

  // dry — body veya query'den.
  let dry = false;
  try {
    const body = (await req.json().catch(() => null)) as { dry?: unknown } | null;
    if (body && typeof body.dry === 'boolean') dry = body.dry;
  } catch {
    // body opsiyonel.
  }
  if (req.nextUrl.searchParams.get('dry') === 'true') dry = true;

  const scopeParam = req.nextUrl.searchParams.get('scope');
  const scope: Scope = scopeParam && (SCOPES as readonly string[]).includes(scopeParam) ? (scopeParam as Scope) : 'all';
  const runs = (p: Exclude<Scope, 'all'>) => scope === 'all' || scope === p;

  const db = getAdminFirestore();
  const phases = emptyPhases();
  const sample: string[] = [];

  try {
    // Bütçe: tek çağrıda toplam yazma tavanı. Fazlar sırayla kalan bütçeden harcar.
    const used = () =>
      phases['org-impact'].updated + phases.event.updated + phases.volunteer.updated + phases.blood.updated;

    if (runs('org-impact')) {
      phases['org-impact'] = await phaseOrgImpact(db, dry, PER_CALL_CAP, sample);
    }
    if (runs('event')) {
      phases.event = await phaseEvent(db, dry, Math.max(0, PER_CALL_CAP - used()), sample);
    }
    if (runs('volunteer')) {
      phases.volunteer = await phaseVolunteer(db, dry, Math.max(0, PER_CALL_CAP - used()), sample);
    }
    if (runs('blood')) {
      phases.blood = await phaseBlood(db, dry, Math.max(0, PER_CALL_CAP - used()), sample);
    }
  } catch {
    return errJson('backfill_failed', 'Sertifika üretimi başarısız.', 500);
  }

  // remaining: bu çağrıda işlenenler arasında bütçe aşımı/sonradan kalan tahmini.
  // dry'da updated = "işlenecek toplam" (yazma yok) → remaining = updated.
  // apply'da: cap'i aşan say → remaining = max(0, toplam - cap).
  const total = phases['org-impact'].updated + phases.event.updated + phases.volunteer.updated + phases.blood.updated;
  const remaining = dry ? total : Math.max(0, total - PER_CALL_CAP);

  return NextResponse.json({ ok: true, dry, scope, phases, remaining, sample });
}
