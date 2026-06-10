/**
 * POST /api/ngo-admin/messaging/quota/purchase
 *
 * STK admin'i bir adet-paketi (messagingPackages, kind:'unit') seçip satın alır.
 * Bir paymentOrder (kind:'unit-package', status:'pending') oluşturulur ve N-Kolay
 * sanal POS ödeme akışına yönlendirilir. POS entegrasyonu tamamlanınca callback
 * /api/super-admin/messaging/quota (action:'confirmOrder') ile kota havuzdan düşülüp
 * NGO'ya işlenir. (POS anahtarları bağlanana dek redirect yerine pending döner;
 * süper-admin siparişi manuel onaylayarak kotayı yükleyebilir.)
 *
 * Body: { ngoId, packageId }
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { COLLECTIONS } from '@/firebase/collections';
import { normalizePool, poolRemaining, normalizePackage } from '@/lib/messaging-quota';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function authorize(req: NextRequest, ngoId: string): Promise<boolean> {
  const authHeader = req.headers.get('authorization') || '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!idToken) return false;
  try {
    const decoded = await getAdminAuth().verifyIdToken(idToken) as { uid: string; role?: string };
    const snap = await getAdminFirestore().collection(COLLECTIONS.users).doc(decoded.uid).get();
    const d = snap.data() as { role?: string; managedNgoId?: string; managedBrandId?: string; managedClubId?: string } | undefined;
    if (d?.role === 'super-admin') return true;
    return d?.managedNgoId === ngoId || d?.managedBrandId === ngoId || d?.managedClubId === ngoId;
  } catch { return false; }
}

export async function POST(req: NextRequest) {
  let body: { ngoId?: string; packageId?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ errorCode: 'BAD_JSON', message: 'Geçersiz JSON' }, { status: 400 }); }
  const ngoId = typeof body.ngoId === 'string' ? body.ngoId : '';
  const packageId = typeof body.packageId === 'string' ? body.packageId : '';
  if (!ngoId || !packageId) return NextResponse.json({ errorCode: 'BAD_INPUT', message: 'ngoId + packageId gerekli.' }, { status: 400 });
  if (!(await authorize(req, ngoId))) return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'Yetkiniz yok.' }, { status: 403 });

  const db = getAdminFirestore();
  const pkgSnap = await db.collection(COLLECTIONS.messagingPackages).doc(packageId).get();
  if (!pkgSnap.exists) return NextResponse.json({ errorCode: 'NOT_FOUND', message: 'Paket bulunamadı.' }, { status: 404 });
  const pkg = normalizePackage(pkgSnap.id, pkgSnap.data() as Record<string, unknown>);
  if (!pkg.active) return NextResponse.json({ errorCode: 'INACTIVE', message: 'Paket pasif.' }, { status: 409 });

  // Havuzda yeterli adet var mı (bilgi amaçlı; asıl düşüm onayda yapılır).
  const poolSnap = await db.collection(COLLECTIONS.siteSettings).doc('messagingBulkPool').get();
  const rem = poolRemaining(normalizePool(poolSnap.data() as never));
  const poolSufficient = pkg.smsUnits <= rem.sms && pkg.mailUnits <= rem.mail;

  const orderRef = await db.collection(COLLECTIONS.paymentOrders).add({
    ngoId,
    kind: 'unit-package',
    packageId,
    packageName: pkg.name,
    smsUnits: pkg.smsUnits,
    mailUnits: pkg.mailUnits,
    amount: pkg.priceTRY,
    currency: 'TRY',
    status: 'pending',
    poolSufficient,
    createdAt: FieldValue.serverTimestamp(),
  });

  // N-Kolay POS anahtarları bağlanana dek redirect üretemiyoruz — pending sipariş
  // döner; süper-admin onaylayınca (veya POS callback) kota yüklenir.
  return NextResponse.json({
    ok: true,
    orderId: orderRef.id,
    posConfigured: false,
    message: 'Siparişiniz oluşturuldu. Ödeme onaylanınca kontörler hesabınıza yüklenecek.',
  });
}
