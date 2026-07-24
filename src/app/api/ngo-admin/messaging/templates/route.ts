/**
 * GET / POST /api/ngo-admin/messaging/templates
 *
 * STK admin'in kendi şablonlarını yönetir. messageTemplates client-read super-admin
 * scoped (firestore.rules:565) olduğundan ngo-admin için bu route Admin SDK kullanır.
 *
 * GET → { templates: [{ id, name, body, category, createdAt }] }
 * POST { name, body, category? } → { id }
 *
 * scope: ngoId — sadece caller'ın yönettiği kurum için.
 * Hata format: { errorCode, message }.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { COLLECTIONS } from '@/firebase/collections';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface Caller {
  uid: string;
  ngoId: string;
}

async function authorize(req: NextRequest): Promise<Caller | null> {
  const idToken = (req.headers.get('authorization') || '').replace(/^Bearer /, '');
  if (!idToken) return null;
  try {
    const decoded = (await getAdminAuth().verifyIdToken(idToken)) as { uid: string };
    const userSnap = await getAdminFirestore().collection(COLLECTIONS.users).doc(decoded.uid).get();
    const d = userSnap.data() as { role?: string; managedNgoId?: string } | undefined;
    if (!d) return null;
    if (d.role !== 'ngo-admin' && d.role !== 'super-admin') return null;
    // Aktif kurum: üst switcher x-org-id header'ıyla gelir (çoklu kurum yöneten
    // kullanıcı için kritik). Caller onu yönetiyorsa (managedNgoId==header) ya da
    // super-admin ise header'daki STK kullanılır; yoksa managedNgoId'ye düşer.
    const __hdrId = (req.headers.get('x-org-id') || '').trim();
    const __hdrKind = (req.headers.get('x-org-kind') || '').trim().toLowerCase();
    const __activeNgoId = (__hdrId && __hdrKind === 'ngo' && (d.role === 'super-admin' || d.managedNgoId === __hdrId))
      ? __hdrId
      : (d.managedNgoId || '');
    if (!__activeNgoId) return null;
    return { uid: decoded.uid, ngoId: __activeNgoId };
  } catch {
    return null;
  }
}

function toIso(v: unknown): string | null {
  if (!v) return null;
  if (v instanceof Timestamp) return v.toDate().toISOString();
  if (typeof v === 'object' && v !== null && '_seconds' in (v as Record<string, unknown>)) {
    const seconds = (v as { _seconds: number })._seconds;
    return new Date(seconds * 1000).toISOString();
  }
  if (v instanceof Date) return v.toISOString();
  if (typeof v === 'string') return v;
  return null;
}

const ALLOWED_CATEGORIES = ['transactional', 'marketing', 'volunteer', 'donation', 'other'] as const;
type Category = (typeof ALLOWED_CATEGORIES)[number];
const DEFAULT_CATEGORY: Category = 'other';

export async function GET(req: NextRequest) {
  const ctx = await authorize(req);
  if (!ctx) {
    return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'NGO admin yetkisi gerekli.' }, { status: 403 });
  }
  const db = getAdminFirestore();
  let snap: FirebaseFirestore.QuerySnapshot;
  try {
    snap = await db
      .collection(COLLECTIONS.messageTemplates)
      .where('ngoId', '==', ctx.ngoId)
      .orderBy('createdAt', 'desc')
      .limit(100)
      .get();
  } catch (e) {
    return NextResponse.json(
      { errorCode: 'QUERY_FAILED', message: e instanceof Error ? e.message : 'Sorgu başarısız.' },
      { status: 500 },
    );
  }
  const templates = snap.docs.map((doc) => {
    const d = doc.data() as Record<string, unknown>;
    return {
      id: doc.id,
      name: typeof d.name === 'string' ? d.name : '',
      body: typeof d.body === 'string' ? d.body : '',
      category: typeof d.category === 'string' ? d.category : DEFAULT_CATEGORY,
      createdAt: toIso(d.createdAt),
    };
  });
  return NextResponse.json({ templates });
}

interface CreateBody {
  name?: unknown;
  body?: unknown;
  category?: unknown;
}

export async function POST(req: NextRequest) {
  const ctx = await authorize(req);
  if (!ctx) {
    return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'NGO admin yetkisi gerekli.' }, { status: 403 });
  }
  let body: CreateBody;
  try {
    body = (await req.json()) as CreateBody;
  } catch {
    return NextResponse.json({ errorCode: 'BAD_JSON', message: 'Geçersiz JSON.' }, { status: 400 });
  }
  const name = typeof body.name === 'string' ? body.name.trim().slice(0, 80) : '';
  const tmplBody = typeof body.body === 'string' ? body.body.trim().slice(0, 1000) : '';
  const rawCategory = typeof body.category === 'string' ? body.category : DEFAULT_CATEGORY;
  const category: Category = (ALLOWED_CATEGORIES as readonly string[]).includes(rawCategory)
    ? (rawCategory as Category)
    : DEFAULT_CATEGORY;

  if (!name || !tmplBody) {
    return NextResponse.json({ errorCode: 'BAD_INPUT', message: 'Ad ve içerik zorunludur.' }, { status: 400 });
  }

  const db = getAdminFirestore();
  const ref = await db.collection(COLLECTIONS.messageTemplates).add({
    ngoId: ctx.ngoId,
    name,
    body: tmplBody,
    category,
    channel: 'sms',
    createdBy: ctx.uid,
    createdAt: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({ id: ref.id });
}
