/**
 * POST /api/super-admin/org/assign-or-claim
 * Kurumsal başvuru onayında çağrılır. Yetkili kişiyi (telefon/e-posta/uid) çözer:
 *  - Kayıtlı kullanıcıysa → anında kuruluşun yetkilisi yapar (wireOrgManager).
 *  - Değilse → telefon-bazlı bekleyen talep oluşturur (kayıt olunca otomatik atanır).
 * Yalnız super-admin.
 */
import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';
import { type OrgKind, FOUNDER_EMAIL } from '@/lib/ngo-admin/org-admin-auth';
import { resolveUserByContact, wireOrgManager, createPendingClaim } from '@/lib/ngo-admin/org-manager';

export const runtime = 'nodejs';

const VALID_KINDS: OrgKind[] = ['ngo', 'brand', 'club'];

async function isSuperAdmin(req: Request): Promise<boolean> {
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!token) return false;
  try {
    const decoded = (await getAdminAuth().verifyIdToken(token)) as { uid: string; role?: string; email?: string };
    if (decoded.role === 'super-admin' || (decoded.email || '').toLowerCase() === FOUNDER_EMAIL) return true;
    const snap = await getAdminFirestore().collection(COLLECTIONS.users).doc(decoded.uid).get();
    return snap.exists && (snap.data() as { role?: string }).role === 'super-admin';
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  if (!(await isSuperAdmin(req))) {
    return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'Super-admin yetkisi gerekli.' }, { status: 403 });
  }

  let body: {
    entityId?: string; entityKind?: string; role?: string;
    phone?: string; phoneCountryCode?: string; email?: string; name?: string;
    existingUserId?: string; entityName?: string;
  };
  try { body = await req.json(); } catch { return NextResponse.json({ errorCode: 'BAD_JSON', message: 'Geçersiz istek.' }, { status: 400 }); }

  const entityId = (body.entityId || '').trim();
  const kind = (body.entityKind || '').trim() as OrgKind;
  const role = (body.role || 'Genel Yönetici').trim();
  if (!entityId || !VALID_KINDS.includes(kind)) {
    return NextResponse.json({ errorCode: 'BAD_REQUEST', message: 'entityId/entityKind zorunlu.' }, { status: 400 });
  }

  const uid = await resolveUserByContact({
    phone: body.phone, phoneCountryCode: body.phoneCountryCode, email: body.email, existingUserId: body.existingUserId,
  });

  if (uid) {
    await wireOrgManager({ uid, entityId, kind, role, entityName: body.entityName, invitedBy: 'system-approval' });
    return NextResponse.json({ assigned: true, uid });
  }

  if (body.phone) {
    const claimed = await createPendingClaim({ phone: body.phone, phoneCountryCode: body.phoneCountryCode, entityId, kind, role, entityName: body.entityName });
    return NextResponse.json({ assigned: false, claimed });
  }

  return NextResponse.json({ assigned: false, claimed: false, message: 'Yetkili çözülemedi (telefon/e-posta yok).' });
}
