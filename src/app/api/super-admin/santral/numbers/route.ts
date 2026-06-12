/**
 * GET  /api/super-admin/santral/numbers
 * POST /api/super-admin/santral/numbers
 *
 * Sanal santral numara havuzu (santralNumberPool) yönetimi. hangel iç ekibi
 * provider'lardan satın aldığı numaraları havuza ekler; STK aktivasyonunda
 * havuzdan tahsis edilir.
 *
 * GET — havuzu listele.
 *   Query: providerId?, status?, assignedToNgoId?, limit (max 500, default 100)
 *   Response: { numbers: NumberRow[] }
 *
 * POST — yeni numara ekle.
 *   Body: { providerId, number (E.164), label?, monthlyCost? }
 *   Response: { ok, numberId }
 *
 * KVKK: numara havuzu kurumsal envanter — kişisel veri değil. Yine de her
 * mutasyon callAuditLog'a düşer.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { COLLECTIONS } from '@/firebase/collections';
import { logAuditEvent, clientIpFromRequest } from '@/lib/santral/audit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const NUMBER_POOL = 'santralNumberPool';
const PROVIDERS = 'santralProviders';
const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 500;

const VALID_STATUSES = ['available', 'reserved', 'assigned', 'suspended', 'released'] as const;
type NumberStatus = typeof VALID_STATUSES[number];

interface NumberRow {
  id: string;
  providerId: string;
  number: string;
  status: NumberStatus | string;
  assignedToNgoId?: string | null;
  assignedAt?: string | null;
  label?: string | null;
  monthlyCost?: number | null;
  createdAt?: string | null;
}

interface AuthResult { ok: boolean; uid?: string }

async function isSuperAdmin(req: NextRequest): Promise<AuthResult> {
  const authHeader = req.headers.get('authorization') || '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!idToken) return { ok: false };
  try {
    const decoded = await getAdminAuth().verifyIdToken(idToken) as {
      uid: string; role?: string; superAdminPermissions?: unknown;
    };
    if (decoded.role === 'super-admin' || !!decoded.superAdminPermissions) {
      return { ok: true, uid: decoded.uid };
    }
    const snap = await getAdminFirestore().collection(COLLECTIONS.users).doc(decoded.uid).get();
    const d = snap.data();
    const ok = d?.role === 'super-admin' || (Array.isArray(d?.superAdminPermissions) && d.superAdminPermissions.length > 0);
    return { ok, uid: ok ? decoded.uid : undefined };
  } catch {
    return { ok: false };
  }
}

function normalizePhone(raw: string): string | null {
  const trimmed = raw.replace(/\s+/g, '');
  if (!trimmed) return null;
  if (!/^\+?[0-9]{10,15}$/.test(trimmed)) return null;
  return trimmed.startsWith('+') ? trimmed : `+${trimmed}`;
}

function toIso(v: unknown): string | null {
  if (!v) return null;
  if (typeof v === 'object' && v !== null) {
    const obj = v as { toDate?: () => Date; _seconds?: number };
    if (typeof obj.toDate === 'function') return obj.toDate().toISOString();
    if (typeof obj._seconds === 'number') return new Date(obj._seconds * 1000).toISOString();
  }
  if (v instanceof Date) return v.toISOString();
  if (typeof v === 'string') return v;
  return null;
}

function normalize(doc: FirebaseFirestore.QueryDocumentSnapshot): NumberRow {
  const d = doc.data();
  return {
    id: doc.id,
    providerId: typeof d.providerId === 'string' ? d.providerId : '',
    number: typeof d.number === 'string' ? d.number : '',
    status: typeof d.status === 'string' ? d.status : 'available',
    assignedToNgoId: typeof d.assignedToNgoId === 'string' ? d.assignedToNgoId : null,
    assignedAt: toIso(d.assignedAt),
    label: typeof d.label === 'string' ? d.label : null,
    monthlyCost: typeof d.monthlyCost === 'number' ? d.monthlyCost : null,
    createdAt: toIso(d.createdAt),
  };
}

export async function GET(req: NextRequest) {
  const auth = await isSuperAdmin(req);
  if (!auth.ok || !auth.uid) {
    return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'Super-admin yetkisi gerekli.' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const providerId = searchParams.get('providerId');
  const statusParam = searchParams.get('status');
  const assignedToNgoId = searchParams.get('assignedToNgoId');
  const limitNum = Math.min(MAX_LIMIT, Math.max(1, parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT), 10)));

  if (statusParam && !VALID_STATUSES.includes(statusParam as NumberStatus)) {
    return NextResponse.json({ errorCode: 'BAD_STATUS', message: 'status geçersiz.' }, { status: 400 });
  }

  const db = getAdminFirestore();
  let q: FirebaseFirestore.Query = db.collection(NUMBER_POOL);
  if (providerId) q = q.where('providerId', '==', providerId);
  if (statusParam) q = q.where('status', '==', statusParam);
  if (assignedToNgoId) q = q.where('assignedToNgoId', '==', assignedToNgoId);
  q = q.orderBy('createdAt', 'desc').limit(limitNum);

  let numbers: NumberRow[];
  try {
    const snap = await q.get();
    numbers = snap.docs.map(normalize);
  } catch (e) {
    return NextResponse.json(
      { errorCode: 'QUERY_FAILED', message: e instanceof Error ? e.message : 'Sorgu hatası' },
      { status: 500 },
    );
  }

  await logAuditEvent({
    actorUid: auth.uid,
    action: 'santral.numbers.list',
    resourceType: 'santralNumberPool',
    resourceId: null,
    ipAddress: clientIpFromRequest(req),
    details: {
      filters: { providerId, status: statusParam, assignedToNgoId },
      returnedCount: numbers.length,
    },
  });

  return NextResponse.json({ numbers });
}

interface PostBody {
  providerId?: unknown;
  number?: unknown;
  label?: unknown;
  monthlyCost?: unknown;
}

export async function POST(req: NextRequest) {
  const auth = await isSuperAdmin(req);
  if (!auth.ok || !auth.uid) {
    return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'Super-admin yetkisi gerekli.' }, { status: 403 });
  }

  let body: PostBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ errorCode: 'BAD_JSON', message: 'Geçersiz JSON.' }, { status: 400 });
  }

  const providerId = typeof body.providerId === 'string' ? body.providerId.trim() : '';
  const rawNumber = typeof body.number === 'string' ? body.number.trim() : '';
  const label = typeof body.label === 'string' ? body.label.slice(0, 120) : null;
  const monthlyCost = typeof body.monthlyCost === 'number' && body.monthlyCost >= 0 ? body.monthlyCost : null;

  if (!providerId || !rawNumber) {
    return NextResponse.json(
      { errorCode: 'BAD_INPUT', message: 'providerId ve number zorunlu.' },
      { status: 400 },
    );
  }
  const number = normalizePhone(rawNumber);
  if (!number) {
    return NextResponse.json({ errorCode: 'BAD_PHONE', message: 'Telefon numarası geçersiz.' }, { status: 400 });
  }

  const db = getAdminFirestore();

  // Provider config var mı?
  const providerSnap = await db.collection(PROVIDERS).doc(providerId).get();
  if (!providerSnap.exists) {
    return NextResponse.json({ errorCode: 'UNKNOWN_PROVIDER', message: 'Provider bulunamadı.' }, { status: 404 });
  }

  // Duplicate guard — aynı numara aynı provider'da zaten var mı?
  const dupSnap = await db.collection(NUMBER_POOL)
    .where('providerId', '==', providerId)
    .where('number', '==', number)
    .limit(1)
    .get();
  if (!dupSnap.empty) {
    return NextResponse.json(
      { errorCode: 'DUPLICATE', message: 'Bu numara bu sağlayıcıda zaten kayıtlı.' },
      { status: 409 },
    );
  }

  const ref = db.collection(NUMBER_POOL).doc();
  await ref.set({
    providerId,
    number,
    status: 'available',
    assignedToNgoId: null,
    assignedAt: null,
    label,
    monthlyCost,
    createdAt: FieldValue.serverTimestamp(),
    createdBy: auth.uid,
  });

  await logAuditEvent({
    actorUid: auth.uid,
    action: 'santral.numbers.create',
    resourceType: 'santralNumberPool',
    resourceId: ref.id,
    ipAddress: clientIpFromRequest(req),
    details: { providerId, number, label, monthlyCost },
  });

  return NextResponse.json({ ok: true, numberId: ref.id });
}
