/**
 * GET /api/admin/contracts/list
 *
 * Super-admin için tüm contracts dokümanlarını döner. Public read'e açık
 * (firestore.rules) olduğundan istemci de useCollection ile çekebilir ancak
 * yönetim panelinin server-side kontrolden geçmesi gereken durumlar için
 * (audit log birleştirme, jurisdiction matrix) tek seferlik snapshot endpoint'i.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';

export const runtime = 'nodejs';

interface DecodedToken {
  uid: string;
  role?: string;
  superAdminPermissions?: unknown;
}

async function isSuperAdmin(req: NextRequest): Promise<boolean> {
  const authHeader = req.headers.get('authorization') || '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!idToken) return false;
  try {
    const decoded = await getAdminAuth().verifyIdToken(idToken) as DecodedToken;
    if (decoded.role === 'super-admin' || !!decoded.superAdminPermissions) return true;
    const snap = await getAdminFirestore().collection(COLLECTIONS.users).doc(decoded.uid).get();
    const d = snap.data();
    return d?.role === 'super-admin' || (Array.isArray(d?.superAdminPermissions) && d.superAdminPermissions.length > 0);
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  if (!(await isSuperAdmin(req))) {
    return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'Super-admin yetkisi gerekli.' }, { status: 403 });
  }

  const fs = getAdminFirestore();
  const snap = await fs.collection(COLLECTIONS.contracts).get();
  const items = snap.docs.map(d => {
    const data = d.data() as Record<string, unknown>;
    // İçerik (content) bu listede gönderilmez — boyut için. Detay edit dialog
    // zaten useDoc ile tek doc çeker.
    const { content: _content, ...meta } = data;
    void _content;
    return { id: d.id, ...meta };
  });

  return NextResponse.json({ ok: true, items, count: items.length });
}
