/**
 * GET /api/ngo-admin/messaging/jobs?limit=50
 *
 * STK admin'in geçmiş toplu SMS gönderim job'larını döner. Yalnızca caller'ın
 * managedNgoId == ngoId olan job'lar gösterilir. messageJobs koleksiyonu server-only
 * (firestore.rules:704) olduğu için bu route Admin SDK üzerinden çeker.
 *
 * Yanıt: { jobs: [{ id, channel, status, total, sent, failed, bodySnippet, createdAt }] }
 * Sıralama: createdAt DESC.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
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

export async function GET(req: NextRequest) {
  const ctx = await authorize(req);
  if (!ctx) {
    return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'NGO admin yetkisi gerekli.' }, { status: 403 });
  }

  const url = new URL(req.url);
  const rawLimit = Number(url.searchParams.get('limit'));
  const lim = Number.isFinite(rawLimit) && rawLimit > 0 && rawLimit <= 200 ? Math.floor(rawLimit) : 50;

  const db = getAdminFirestore();
  let snap: FirebaseFirestore.QuerySnapshot;
  try {
    snap = await db
      .collection(COLLECTIONS.messageJobs)
      .where('ngoId', '==', ctx.ngoId)
      .orderBy('createdAt', 'desc')
      .limit(lim)
      .get();
  } catch (e) {
    return NextResponse.json(
      { errorCode: 'QUERY_FAILED', message: e instanceof Error ? e.message : 'Sorgu başarısız.' },
      { status: 500 },
    );
  }

  const jobs = snap.docs.map((doc) => {
    const d = doc.data() as Record<string, unknown>;
    return {
      id: doc.id,
      channel: typeof d.channel === 'string' ? d.channel : 'sms',
      status: typeof d.status === 'string' ? d.status : 'unknown',
      total: typeof d.total === 'number' ? d.total : 0,
      sent: typeof d.sent === 'number' ? d.sent : 0,
      failed: typeof d.failed === 'number' ? d.failed : 0,
      bodySnippet: typeof d.bodySnippet === 'string' ? d.bodySnippet : '',
      segments: typeof d.segments === 'number' ? d.segments : 1,
      actualCostTry: typeof d.actualCostTry === 'number' ? d.actualCostTry : 0,
      createdAt: toIso(d.createdAt),
    };
  });

  return NextResponse.json({ jobs });
}
