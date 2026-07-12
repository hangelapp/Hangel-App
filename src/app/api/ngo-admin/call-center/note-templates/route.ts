/**
 * GET / POST /api/ngo-admin/call-center/note-templates
 *
 * STK'nın sık kullandığı görüşme notu şablonları (operatör çağrı ekranında
 * hazır notlardan seçer, zaman kazanır). ngoCallCenter/{ngoId}.noteTemplates.
 *
 * GET  → { templates: string[] }
 * POST { templates: string[] } → tümünü değiştirir (maks 30, her biri ≤200 char)
 * KVKK: yalnız caller'ın managedNgoId'si.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { COLLECTIONS } from '@/firebase/collections';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const NGO_CALL_CENTER = 'ngoCallCenter';

interface CallerContext { uid: string; ngoId: string; }

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
    return { uid: decoded.uid, ngoId: d.managedNgoId };
  } catch {
    return null;
  }
}

// İlk kurulumda öneri şablonlar (STK isterse değiştirir/siler).
const DEFAULT_TEMPLATES = [
  'Bağış sözü verdi, hatırlatma yapılacak.',
  'İlgilenmedi, bir daha aranmasın.',
  'Etkinliğe katılacağını belirtti.',
  'Numarası yanlış / ulaşılamadı.',
  'Bilgi verildi, düşünecek.',
];

export async function GET(req: NextRequest) {
  const ctx = await authorize(req);
  if (!ctx) return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'NGO admin yetkisi gerekli.' }, { status: 403 });
  const db = getAdminFirestore();
  const snap = await db.collection(NGO_CALL_CENTER).doc(ctx.ngoId).get();
  const data = snap.data() as { noteTemplates?: unknown } | undefined;
  const templates = Array.isArray(data?.noteTemplates)
    ? (data!.noteTemplates as unknown[]).filter((t): t is string => typeof t === 'string')
    : DEFAULT_TEMPLATES;
  return NextResponse.json({ templates });
}

export async function POST(req: NextRequest) {
  const ctx = await authorize(req);
  if (!ctx) return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'NGO admin yetkisi gerekli.' }, { status: 403 });
  let body: { templates?: unknown };
  try { body = await req.json(); } catch { body = {}; }
  const templates = Array.isArray(body.templates)
    ? body.templates.filter((t): t is string => typeof t === 'string' && t.trim().length > 0).map((t) => t.trim().slice(0, 200)).slice(0, 30)
    : [];
  const db = getAdminFirestore();
  await db.collection(NGO_CALL_CENTER).doc(ctx.ngoId).set(
    { noteTemplates: templates, noteTemplatesUpdatedAt: FieldValue.serverTimestamp() },
    { merge: true },
  );
  return NextResponse.json({ ok: true, templates });
}
