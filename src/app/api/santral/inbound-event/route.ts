/**
 * POST /api/santral/inbound-event
 *
 * Asterisk geçidi GELEN arama bitince (server-to-server) buraya POST eder.
 * Amaç: atanmış kişi OFFLINE iken (tarayıcı açık değil → client originate
 * çağrısı hiç çalışmadı) gelen aramayı SUNUCU tarafında "cevapsız" olarak
 * loglamak. Kişi online olunca dashboard'daki "Cevapsız Aramalar" bölümünde
 * görür.
 *
 * Auth: BASİT bearer secret (HMAC değil — Asterisk dialplan'dan kolay olsun).
 *   Header: Authorization: Bearer <SANTRAL_GATEWAY_SECRET>
 *
 * Body (JSON):
 *   - callerNumber:  string            (zorunlu — arayan numara)
 *   - calledNumber?: string            (aranan/STK hat numarası — ngoId çözümü)
 *   - ngoId?:        string            (verilirse calledNumber çözümü atlanır)
 *   - status?:       string            ('no-answer'|'missed'|'answered'|'busy'…)
 *
 * Davranış:
 *   - status 'answered' → hiçbir şey yapma (client zaten loglar).
 *   - ngoId çözülemezse → sessiz geç (skipped:'ngo-not-resolved').
 *   - son ~2 dk içinde aynı inbound varsa → çift yazma (skipped:'duplicate').
 *   - aksi → callSessions doc oluştur (status 'no-answer', missed:true).
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CALL_SESSIONS = 'callSessions';
const NUMBER_POOL = 'santralNumberPool';
const NGO_CALL_CENTER = 'ngoCallCenter';
const DEDUP_WINDOW_SECONDS = 120;

interface InboundEventBody {
  callerNumber?: unknown;
  calledNumber?: unknown;
  ngoId?: unknown;
  status?: unknown;
}

/** Sadece rakam — numara biçim farklarını (boşluk, +, 0, ülke kodu) eşleştirmek için. */
function digitsOnly(raw: string): string {
  return raw.replace(/\D/g, '');
}

/**
 * calledNumber'dan STK (ngoId) çöz.
 *  1) santralNumberPool: önce tam alan eşleşmesi (e164 / number), olmazsa
 *     digit-normalize karşılaştırma → assignedToNgoId.
 *  2) Tek-kiracı fallback: ngoCallCenter.callerIdNumber eşleşmesi.
 * Bulunamazsa null.
 */
async function resolveNgoId(
  db: FirebaseFirestore.Firestore,
  calledNumber: string,
): Promise<string | null> {
  const wantDigits = digitsOnly(calledNumber);
  if (!wantDigits) return null;

  // 1a) Tam alan eşleşmesi — şema farklarına karşı hem 'e164' hem 'number'.
  for (const field of ['e164', 'number'] as const) {
    const snap = await db
      .collection(NUMBER_POOL)
      .where(field, '==', calledNumber)
      .limit(1)
      .get();
    if (!snap.empty) {
      const assigned = snap.docs[0].data().assignedToNgoId;
      if (typeof assigned === 'string' && assigned) return assigned;
    }
  }

  // 1b) Digit-normalize taraması (kayıttaki biçim farklıysa: +, boşluk, 0…).
  const poolSnap = await db.collection(NUMBER_POOL).get();
  for (const doc of poolSnap.docs) {
    const d = doc.data() as { e164?: string; number?: string; assignedToNgoId?: string | null };
    const candidate = d.e164 ?? d.number ?? '';
    if (candidate && digitsOnly(candidate) === wantDigits) {
      if (typeof d.assignedToNgoId === 'string' && d.assignedToNgoId) return d.assignedToNgoId;
    }
  }

  // 2) Tek-kiracı fallback: ngoCallCenter.callerIdNumber.
  const ccExact = await db
    .collection(NGO_CALL_CENTER)
    .where('callerIdNumber', '==', calledNumber)
    .limit(1)
    .get();
  if (!ccExact.empty) return ccExact.docs[0].id;

  // Digit-normalize fallback ngoCallCenter için de.
  const ccSnap = await db.collection(NGO_CALL_CENTER).get();
  for (const doc of ccSnap.docs) {
    const d = doc.data() as { callerIdNumber?: string };
    if (d.callerIdNumber && digitsOnly(d.callerIdNumber) === wantDigits) return doc.id;
  }

  return null;
}

export async function POST(req: NextRequest) {
  const secret = process.env.SANTRAL_GATEWAY_SECRET;
  if (!secret) {
    return NextResponse.json(
      { errorCode: 'NOT_CONFIGURED', message: 'Santral geçit sırrı yapılandırılmamış.' },
      { status: 503 },
    );
  }

  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (token !== secret) {
    return NextResponse.json(
      { errorCode: 'UNAUTHORIZED', message: 'Geçersiz geçit anahtarı.' },
      { status: 401 },
    );
  }

  let body: InboundEventBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { errorCode: 'BAD_JSON', message: 'Geçersiz JSON gövdesi.' },
      { status: 400 },
    );
  }

  try {
    const callerNumber =
      typeof body.callerNumber === 'string' && body.callerNumber.trim()
        ? body.callerNumber.trim()
        : '';
    if (!callerNumber) {
      return NextResponse.json(
        { errorCode: 'BAD_INPUT', message: 'callerNumber zorunlu.' },
        { status: 400 },
      );
    }
    const calledNumber =
      typeof body.calledNumber === 'string' && body.calledNumber.trim()
        ? body.calledNumber.trim()
        : null;
    const status = typeof body.status === 'string' ? body.status.trim() : '';

    // Cevaplanan aramayı client zaten loglar → sunucu tarafı atlar.
    if (status === 'answered') {
      return NextResponse.json({ ok: true, skipped: 'answered' });
    }

    const db = getAdminFirestore();

    // ngoId çözümü — body.ngoId verildiyse onu kullan, yoksa calledNumber'dan çöz.
    let ngoId =
      typeof body.ngoId === 'string' && body.ngoId.trim() ? body.ngoId.trim() : null;
    if (!ngoId && calledNumber) {
      ngoId = await resolveNgoId(db, calledNumber);
    }
    if (!ngoId) {
      // Hata değil — sessiz geç (numara henüz bir STK'ya atanmamış olabilir).
      return NextResponse.json({ ok: true, skipped: 'ngo-not-resolved' });
    }

    // Dedup — son ~2 dk içinde aynı STK + inbound + arayan numara var mı?
    // callerNumber + ngoId + direction where, startedAt zaman filtresi.
    // Composite index yoksa (FAILED_PRECONDITION) dedup'ı ATLA, cevapsız doc'u yine de
    // oluştur — özellik index deploy edilmeden de çalışsın (en fazla nadir çift kayıt).
    const cutoff = Timestamp.fromMillis(Date.now() - DEDUP_WINDOW_SECONDS * 1000);
    try {
      const dupSnap = await db
        .collection(CALL_SESSIONS)
        .where('ngoId', '==', ngoId)
        .where('direction', '==', 'inbound')
        .where('callerNumber', '==', callerNumber)
        .where('startedAt', '>', cutoff)
        .limit(1)
        .get();
      if (!dupSnap.empty) {
        // Client zaten logladı (kişi online'dı) — çift yazma.
        return NextResponse.json({ ok: true, skipped: 'duplicate' });
      }
    } catch (dedupErr) {
      console.warn('[inbound-event] dedup sorgusu atlandı (index olmayabilir)', dedupErr instanceof Error ? dedupErr.message : 'unknown');
    }

    const ref = db.collection(CALL_SESSIONS).doc();
    await ref.set({
      ngoId,
      direction: 'inbound',
      callerNumber,
      calledNumber: calledNumber || null,
      status: 'no-answer',
      missed: true,
      startedAt: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
      source: 'gateway-missed',
      seenAt: null,
    });

    return NextResponse.json({ ok: true, callSessionId: ref.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Bilinmeyen hata.';
    return NextResponse.json(
      { errorCode: 'INTERNAL', message },
      { status: 500 },
    );
  }
}
