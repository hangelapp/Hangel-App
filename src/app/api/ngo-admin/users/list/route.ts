/**
 * GET /api/ngo-admin/users/list?q=<query>
 *
 * STK'nın yetkili kullanıcılarını listele — managedNgoId match.
 * Onboarding wizard'da "İletişim Sorumlusu" SearchableSelect için kullanılır.
 *
 * Auth: ngo-admin token (kendi STK'sının kullanıcılarını görür).
 * Search: name + email substring (case-insensitive).
 * Limit: 50.
 *
 * Yanıt: { users: [{ uid, name, email, phone, role }] }
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function authorize(req: NextRequest): Promise<{ uid: string; ngoId: string } | null> {
  const authHeader = req.headers.get('authorization') || '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!idToken) return null;
  try {
    const decoded = await getAdminAuth().verifyIdToken(idToken) as { uid: string };
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

export async function GET(req: NextRequest) {
  const ctx = await authorize(req);
  if (!ctx) {
    return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'Yetki gerekli' }, { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get('q') || '').toLocaleLowerCase('tr').trim();

  const db = getAdminFirestore();
  // STK'nın yetkili kullanıcıları: users where managedNgoId == ctx.ngoId
  // VEYA users where ngoId == ctx.ngoId (üye olmuş ama yönetici değil)
  const [admins, members] = await Promise.all([
    db.collection(COLLECTIONS.users).where('managedNgoId', '==', ctx.ngoId).limit(100).get().catch(() => null),
    db.collection(COLLECTIONS.users).where('ngoId', '==', ctx.ngoId).limit(100).get().catch(() => null),
  ]);

  const seen = new Set<string>();
  const users: Array<{ uid: string; name: string; email: string; phone: string; role: string }> = [];

  function pushUser(snap: FirebaseFirestore.QueryDocumentSnapshot) {
    if (seen.has(snap.id)) return;
    seen.add(snap.id);
    const d = snap.data() as {
      displayName?: string; name?: string; firstName?: string; lastName?: string;
      email?: string; phone?: string; phoneNumber?: string; role?: string;
    };
    const name = d.displayName || d.name || `${d.firstName || ''} ${d.lastName || ''}`.trim() || '(isimsiz)';
    const email = d.email || '';
    const phone = d.phone || d.phoneNumber || '';
    if (q) {
      const hay = `${name} ${email} ${phone}`.toLocaleLowerCase('tr');
      if (!hay.includes(q)) return;
    }
    users.push({ uid: snap.id, name, email, phone, role: d.role || 'member' });
  }

  admins?.docs.forEach(pushUser);
  members?.docs.forEach(pushUser);

  // Sort: önce yöneticiler, sonra üyeler; sonra ad
  users.sort((a, b) => {
    const aRole = a.role === 'ngo-admin' ? 0 : 1;
    const bRole = b.role === 'ngo-admin' ? 0 : 1;
    if (aRole !== bRole) return aRole - bRole;
    return a.name.localeCompare(b.name, 'tr');
  });

  return NextResponse.json({ users: users.slice(0, 50), totalCount: users.length });
}
