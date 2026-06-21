/**
 * POST /api/super-admin/backfill-cert-codes
 *
 * gcloud/terminal GEREKMEDEN, App Hosting içinde Admin SDK (ADC) ile çalışan
 * tek-tık backfill. scripts/backfill-certificate-codes.mjs ile AYNI mantık:
 * `code`'u OLMAYAN type==='event' + eventId sertifikalarına, etkinlik tamamlama
 * akışıyla (api/events/[id]/complete) AYNI sıralı sayaçları kullanarak yapısal
 * kod üretir → yeni sertifikalarla çakışmaz.
 *
 *   - Sayaç doc adı:  counters/cert-act-event-{yıl}  (nextSeq transaction, start=1)
 *   - activityNo:     ev.certActivityNo ≥1 ise o, değilse nextSeq
 *   - personSeq:      ev.certPersonSeq ?? 0 — her sertifikada +1
 *   - kod:            buildCertCode({ kind:'event', country:'90', year, activityNo, personNo })
 *   - yazılan alanlar: code, certCountry, certYear, certActivityNo, certPersonNo
 *     (hem certificates/{id} hem users/{uid}/certificates/{id})
 *
 * Yetki: yalnız super-admin (backfill-impact ile aynı desen — Bearer ID token).
 * İdempotent: `code`'u olan sertifika atlanır → tekrar tekrar basılabilir.
 * Tek çağrıda en çok 500 sertifika işlenir; kalan>0 ise buton tekrar basılır.
 *
 * Body/query: { dry?: boolean }
 *   dry=true  → tarar + sayar + yazılacak kodlardan küçük örnek döner, HİÇBİR ŞEY yazmaz.
 *   dry=false → uygular.
 *
 * Dönüş: { ok, scanned, updated, remaining, sample: string[] }
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';
import { buildCertCode } from '@/lib/certificate-code';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CERT_COUNTRY = '90'; // TR — complete route ile aynı.
const PER_CALL_CAP = 500; // Tek çağrıda işlenecek sertifika tavanı (timeout'tan kaçınmak için).
const DRY_SAMPLE = 10;
const WRITE_BATCH_LIMIT = 400; // Firestore batch tavanı 500; güvenli marj.

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

// Atomik sıralı sayaç (counters/{name}.next) — complete route ile AYNI helper.
async function nextSeq(db: FirebaseFirestore.Firestore, name: string, start: number): Promise<number> {
  const ref = db.collection('counters').doc(name);
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const cur = snap.exists ? ((snap.data() as { next?: number }).next ?? start) : start;
    tx.set(ref, { next: cur + 1 }, { merge: true });
    return cur;
  });
}

// Etkinlik yılını startDate / sertifika date / completedAt adaylarından çıkar (script ile aynı).
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

interface PendingCert {
  id: string;
  userId?: string;
  date?: unknown;
  completedAt?: unknown;
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

  const db = getAdminFirestore();

  // 1) Tüm sertifikaları tara; code'u OLMAYAN etkinlik sertifikalarını eventId'ye göre grupla.
  let scanned = 0;
  const groups = new Map<string, PendingCert[]>();
  let totalPending = 0;
  try {
    const snap = await db.collection(COLLECTIONS.certificates).get();
    for (const doc of snap.docs) {
      scanned++;
      const d = doc.data() as {
        code?: unknown;
        type?: unknown;
        eventId?: unknown;
        userId?: unknown;
        date?: unknown;
        completedAt?: unknown;
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
      totalPending++;
    }
  } catch {
    return errJson('read_failed', 'Sertifikalar okunamadı.', 500);
  }

  // 2) DRY — yazmadan, üretilecek kodlardan örnek hazırla.
  if (dry) {
    const sample: string[] = [];
    try {
      for (const [eventId, certs] of groups) {
        if (sample.length >= DRY_SAMPLE) break;
        const evSnap = await db.collection(COLLECTIONS.events).doc(eventId).get();
        const ev = (evSnap.exists ? evSnap.data() : {}) as {
          startDate?: unknown;
          certActivityNo?: number;
          certPersonSeq?: number;
        };
        const year = yearOf(ev.startDate, certs[0]?.date, certs[0]?.completedAt);
        const activityNo = ev.certActivityNo && ev.certActivityNo >= 1 ? ev.certActivityNo : 0;
        let personSeq = ev.certPersonSeq ?? 0;
        const sorted = [...certs].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
        for (const _c of sorted) {
          if (sample.length >= DRY_SAMPLE) break;
          personSeq += 1;
          // activityNo dry'da bilinmiyorsa (henüz atanmamış) örnekte yine year+person yapısını gösterir.
          sample.push(
            buildCertCode({ kind: 'event', country: CERT_COUNTRY, year, activityNo: activityNo || 1, personNo: personSeq }),
          );
        }
      }
    } catch {
      return errJson('read_failed', 'Önizleme hesaplanamadı.', 500);
    }
    return NextResponse.json({ ok: true, scanned, updated: 0, remaining: totalPending, sample });
  }

  // 3) UYGULA — en çok PER_CALL_CAP sertifika işle; kalan döner.
  let updated = 0;
  try {
    let batch = db.batch();
    let pending = 0;

    const flush = async () => {
      if (pending > 0) {
        await batch.commit();
        batch = db.batch();
        pending = 0;
      }
    };

    for (const [eventId, certs] of groups) {
      if (updated >= PER_CALL_CAP) break;

      const evRef = db.collection(COLLECTIONS.events).doc(eventId);
      const evSnap = await evRef.get();
      const ev = (evSnap.exists ? evSnap.data() : {}) as {
        startDate?: unknown;
        certActivityNo?: number;
        certPersonSeq?: number;
      };
      const year = yearOf(ev.startDate, certs[0]?.date, certs[0]?.completedAt);

      // Faaliyet no — complete route ile AYNI: doc'ta ≥1 varsa onu kullan, yoksa sayaçtan al.
      let activityNo = ev.certActivityNo ?? 0;
      if (!(activityNo >= 1)) {
        activityNo = await nextSeq(db, `cert-act-event-${year}`, 1);
        if (evSnap.exists) await evRef.set({ certActivityNo: activityNo }, { merge: true }).catch(() => undefined);
      }
      let personSeq = ev.certPersonSeq ?? 0;

      const sorted = [...certs].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
      for (const c of sorted) {
        if (updated >= PER_CALL_CAP) break;
        personSeq += 1;
        const code = buildCertCode({ kind: 'event', country: CERT_COUNTRY, year, activityNo, personNo: personSeq });
        const patch = {
          code,
          certCountry: CERT_COUNTRY,
          certYear: year,
          certActivityNo: activityNo,
          certPersonNo: personSeq,
        };
        batch.set(db.collection(COLLECTIONS.certificates).doc(c.id), patch, { merge: true });
        pending++;
        if (c.userId) {
          batch.set(
            db
              .collection(COLLECTIONS.users)
              .doc(c.userId)
              .collection(COLLECTIONS.certificates)
              .doc(c.id),
            patch,
            { merge: true },
          );
          pending++;
        }
        updated++;
        if (pending >= WRITE_BATCH_LIMIT) await flush();
      }

      // Etkinliğin kişi sayacını güncelle (sonraki çağrı/yeni sertifika devam etsin).
      if (evSnap.exists) {
        batch.set(evRef, { certPersonSeq: personSeq }, { merge: true });
        pending++;
        if (pending >= WRITE_BATCH_LIMIT) await flush();
      }
    }

    await flush();
  } catch {
    return errJson('write_failed', 'Backfill başarısız.', 500);
  }

  const remaining = Math.max(0, totalPending - updated);
  return NextResponse.json({ ok: true, scanned, updated, remaining, sample: [] });
}
