/**
 * GET /api/ngo-admin/call-center/pipeline
 *
 * Bağış hunisi panosu verisi. STK'nın tüm kişilerini aşamalarına göre gruplar:
 *   - her aşamada kaç kişi
 *   - her aşamada toplam söz verilen TL (pledgeAmount)
 *   - genel: toplam söz verilen, "bağış yaptı" aşamasındaki kişi sayısı
 *
 * Yanıt: { stages: [{key,label,count,pledgeTotal}], totals: {...} }
 * KVKK: yalnız caller'ın kendi tenant'ı.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';
import { DEFAULT_STAGES, DEFAULT_STAGE_KEY } from '@/lib/santral/pipeline';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface Ctx { uid: string; ngoId: string; }

async function authorize(req: NextRequest): Promise<Ctx | null> {
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

export async function GET(req: NextRequest) {
  const ctx = await authorize(req);
  if (!ctx) return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'Yetki gerekli.' }, { status: 403 });

  const db = getAdminFirestore();
  const snap = await db.collection(COLLECTIONS.santralContacts)
    .where('ngoId', '==', ctx.ngoId)
    .limit(5000)
    .get()
    .catch(() => null);

  // key → { count, pledgeTotal }
  const acc = new Map<string, { count: number; pledgeTotal: number }>();
  for (const s of DEFAULT_STAGES) acc.set(s.key, { count: 0, pledgeTotal: 0 });

  let pledgeGrand = 0;
  let totalContacts = 0;

  if (snap) {
    for (const doc of snap.docs) {
      const d = doc.data() as { stage?: string; pledgeAmount?: number };
      const key = d.stage && acc.has(d.stage) ? d.stage : DEFAULT_STAGE_KEY;
      const bucket = acc.get(key)!;
      bucket.count += 1;
      totalContacts += 1;
      const pledge = typeof d.pledgeAmount === 'number' && d.pledgeAmount > 0 ? d.pledgeAmount : 0;
      bucket.pledgeTotal += pledge;
      pledgeGrand += pledge;
    }
  }

  const stages = DEFAULT_STAGES.map((s) => ({
    key: s.key,
    label: s.label,
    tone: s.tone,
    won: !!s.won,
    lost: !!s.lost,
    count: acc.get(s.key)!.count,
    pledgeTotal: acc.get(s.key)!.pledgeTotal,
  }));

  const wonStage = stages.find((s) => s.won);

  return NextResponse.json({
    stages,
    totals: {
      contacts: totalContacts,
      pledgeTotal: pledgeGrand,
      donatedCount: wonStage?.count ?? 0,
    },
  });
}
