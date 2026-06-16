/**
 * GET /api/ngo-admin/call-center/lists
 *
 * STK çağrı merkezi panelindeki kişi listelerini döner. Yalnızca caller'ın
 * tenant'ı (ctx.ngoId) sorgulanır; status='archived' olanlar gizlenir.
 *
 * Yanıt: { lists: [{ id, name, description, totalContacts, importedAt, status }] }
 * Sıralama: importedAt DESC.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { COLLECTIONS } from '@/firebase/collections';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface CallerContext {
  uid: string;
  ngoId: string;
}

interface ListRow {
  id: string;
  name: string;
  description: string;
  totalContacts: number;
  importedAt: string | null;
  status: string;
}

async function authorize(req: NextRequest): Promise<CallerContext | null> {
  const authHeader = req.headers.get('authorization') || '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!idToken) return null;
  try {
    const decoded = await getAdminAuth().verifyIdToken(idToken) as { uid: string };
    const snap = await getAdminFirestore().collection(COLLECTIONS.users).doc(decoded.uid).get();
    if (!snap.exists) return null;
    const d = snap.data() as { role?: string; managedNgoId?: string } | undefined;
    if (!d?.managedNgoId) return null;
    if (d.role !== 'ngo-admin' && d.role !== 'super-admin') return null;
    return { uid: decoded.uid, ngoId: d.managedNgoId };
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

export async function GET(req: NextRequest) {
  const ctx = await authorize(req);
  if (!ctx) {
    return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'NGO admin yetkisi gerekli.' }, { status: 403 });
  }

  const db = getAdminFirestore();
  // Firestore '!=' tüm dokümanlarda alan var olmalı zorunluluğu getirdiği için
  // archived'ı uygulama tarafında filtreliyoruz; index ihtiyacını da azaltır.
  let snap: FirebaseFirestore.QuerySnapshot;
  try {
    snap = await db
      .collection(COLLECTIONS.santralContactLists)
      .where('ngoId', '==', ctx.ngoId)
      .orderBy('importedAt', 'desc')
      .get();
  } catch (e) {
    return NextResponse.json(
      { errorCode: 'QUERY_FAILED', message: e instanceof Error ? e.message : 'Liste sorgusu başarısız.' },
      { status: 500 },
    );
  }

  const lists: ListRow[] = [];
  for (const doc of snap.docs) {
    const d = doc.data() as Record<string, unknown>;
    const status = typeof d.status === 'string' ? d.status : 'active';
    if (status === 'archived') continue;
    lists.push({
      id: doc.id,
      name: typeof d.name === 'string' ? d.name : '',
      description: typeof d.description === 'string' ? d.description : '',
      totalContacts: typeof d.totalContacts === 'number' ? d.totalContacts : 0,
      importedAt: toIso(d.importedAt),
      status,
    });
  }

  return NextResponse.json({ lists });
}
