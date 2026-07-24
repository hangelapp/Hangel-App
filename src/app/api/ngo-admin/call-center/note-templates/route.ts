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
    const d = snap.data() as { role?: string; managedNgoId?: string; managedBrandId?: string; managedClubId?: string };
    if (!d) return null;
    if (d.role !== 'ngo-admin' && d.role !== 'super-admin') return null;
    // Aktif kurum: üst switcher x-org-id + x-org-kind header'ıyla gelir (çoklu
    // kurum yöneten kullanıcı için kritik). Header varsa caller'ın o kuruma
    // üyeliği (ilgili managed* alanı) ya da super-admin doğrulanır; yoksa eski
    // davranış: managedNgoId → managedBrandId → managedClubId ilk dolu olan.
    const hdrOrgId = req.headers.get('x-org-id') || undefined;
    const hdrKindRaw = req.headers.get('x-org-kind');
    const hdrKind = (hdrKindRaw === 'ngo' || hdrKindRaw === 'brand' || hdrKindRaw === 'club') ? hdrKindRaw : undefined;
    const isSuper = d.role === 'super-admin';
    let __activeNgoId = '';
    if (hdrOrgId && hdrKind) {
      const owns = (hdrKind === 'ngo' && d.managedNgoId === hdrOrgId)
        || (hdrKind === 'brand' && d.managedBrandId === hdrOrgId)
        || (hdrKind === 'club' && d.managedClubId === hdrOrgId);
      if (!isSuper && !owns) return null;
      __activeNgoId = hdrOrgId;
    } else {
      __activeNgoId = d.managedNgoId || d.managedBrandId || d.managedClubId || '';
    }
    if (!__activeNgoId) return null;
    return { uid: decoded.uid, ngoId: __activeNgoId };
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
