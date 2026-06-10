/**
 * POST /api/super-admin/messaging/quota
 *
 * Süper-admin SMS/Mail adet-kotası yönetimi (Admin SDK — ngoMessagingWallets ve
 * messagingPackages client'tan yazılamaz). Aksiyonlar:
 *  - addPool:   bayilik havuzuna SMS/mail ekle (siteSettings/messagingBulkPool).
 *  - allocate:  bir NGO'ya ücretsiz SMS/mail kotası tanımla (havuzdan düşülür).
 *  - savePackage: bir paketi düzenle/oluştur (messagingPackages, kind:'unit').
 *
 * Body: { action, ... }
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { COLLECTIONS } from '@/firebase/collections';
import { normalizePool, poolRemaining } from '@/lib/messaging-quota';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const POOL_DOC = 'messagingBulkPool';

async function isSuperAdmin(req: NextRequest): Promise<boolean> {
  const authHeader = req.headers.get('authorization') || '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!idToken) return false;
  try {
    const decoded = await getAdminAuth().verifyIdToken(idToken) as { uid: string; role?: string; superAdminPermissions?: unknown };
    if (decoded.role === 'super-admin' || !!decoded.superAdminPermissions) return true;
    const snap = await getAdminFirestore().collection(COLLECTIONS.users).doc(decoded.uid).get();
    const d = snap.data();
    return d?.role === 'super-admin' || (Array.isArray(d?.superAdminPermissions) && d.superAdminPermissions.length > 0);
  } catch { return false; }
}

const n = (v: unknown): number => {
  const x = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(x) && x >= 0 ? Math.floor(x) : 0;
};

export async function POST(req: NextRequest) {
  if (!(await isSuperAdmin(req))) {
    return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'Super-admin yetkisi gerekli.' }, { status: 403 });
  }
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ errorCode: 'BAD_JSON', message: 'Geçersiz JSON' }, { status: 400 }); }

  const db = getAdminFirestore();
  const action = body.action;

  try {
    // ── Havuza SMS/mail ekle ────────────────────────────────────────────────
    if (action === 'addPool') {
      const addSms = n(body.sms);
      const addMail = n(body.mail);
      await db.collection(COLLECTIONS.siteSettings).doc(POOL_DOC).set({
        smsTotal: FieldValue.increment(addSms),
        mailTotal: FieldValue.increment(addMail),
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
      const snap = await db.collection(COLLECTIONS.siteSettings).doc(POOL_DOC).get();
      return NextResponse.json({ ok: true, pool: normalizePool(snap.data() as never) });
    }

    // ── NGO'ya kota tanımla (havuzdan düş) ──────────────────────────────────
    if (action === 'allocate') {
      const ngoId = typeof body.ngoId === 'string' ? body.ngoId : '';
      const addSms = n(body.sms);
      const addMail = n(body.mail);
      if (!ngoId) return NextResponse.json({ errorCode: 'BAD_INPUT', message: 'ngoId gerekli.' }, { status: 400 });

      const poolRef = db.collection(COLLECTIONS.siteSettings).doc(POOL_DOC);
      const walletRef = db.collection(COLLECTIONS.ngoMessagingWallets).doc(ngoId);
      const result = await db.runTransaction(async (tx) => {
        const poolSnap = await tx.get(poolRef);
        const pool = normalizePool(poolSnap.data() as never);
        const rem = poolRemaining(pool);
        if (addSms > rem.sms || addMail > rem.mail) {
          return { error: `Havuzda yeterli adet yok. Kalan: ${rem.sms} SMS / ${rem.mail} mail.` };
        }
        tx.set(poolRef, { smsUsed: FieldValue.increment(addSms), mailUsed: FieldValue.increment(addMail), updatedAt: FieldValue.serverTimestamp() }, { merge: true });
        tx.set(walletRef, { ngoId, smsQuota: FieldValue.increment(addSms), mailQuota: FieldValue.increment(addMail), updatedAt: FieldValue.serverTimestamp() }, { merge: true });
        return { ok: true };
      });
      if ('error' in result) return NextResponse.json({ errorCode: 'POOL_EMPTY', message: result.error }, { status: 409 });
      return NextResponse.json({ ok: true });
    }

    // ── Paket düzenle/oluştur ───────────────────────────────────────────────
    if (action === 'savePackage') {
      const id = typeof body.id === 'string' && body.id ? body.id : `pkg-${Date.now()}`;
      const pkg = {
        name: typeof body.name === 'string' ? body.name : id,
        iconKey: typeof body.iconKey === 'string' ? body.iconKey : 'community',
        smsUnits: n(body.smsUnits),
        mailUnits: n(body.mailUnits),
        priceTRY: n(body.priceTRY),
        active: body.active !== false,
        order: n(body.order),
        kind: 'unit',
        updatedAt: FieldValue.serverTimestamp(),
      };
      await db.collection(COLLECTIONS.messagingPackages).doc(id).set(pkg, { merge: true });
      return NextResponse.json({ ok: true, id });
    }

    // ── Sipariş onayla → kota yükle (POS callback'i de bunu çağıracak) ──────
    if (action === 'confirmOrder') {
      const orderId = typeof body.orderId === 'string' ? body.orderId : '';
      if (!orderId) return NextResponse.json({ errorCode: 'BAD_INPUT', message: 'orderId gerekli.' }, { status: 400 });
      const orderRef = db.collection(COLLECTIONS.paymentOrders).doc(orderId);
      const poolRef = db.collection(COLLECTIONS.siteSettings).doc(POOL_DOC);
      const out = await db.runTransaction(async (tx) => {
        const oSnap = await tx.get(orderRef);
        if (!oSnap.exists) return { error: 'Sipariş bulunamadı.' };
        const o = oSnap.data() as { ngoId?: string; kind?: string; status?: string; smsUnits?: number; mailUnits?: number };
        if (o.kind !== 'unit-package') return { error: 'Bu sipariş bir kontör paketi değil.' };
        if (o.status === 'paid') return { error: 'Sipariş zaten onaylandı.' };
        const ngoId = o.ngoId || '';
        const sms = n(o.smsUnits); const mail = n(o.mailUnits);
        if (!ngoId) return { error: 'Sipariş NGO bilgisi eksik.' };
        const poolSnap = await tx.get(poolRef);
        const pool = normalizePool(poolSnap.data() as never);
        const rem = poolRemaining(pool);
        if (sms > rem.sms || mail > rem.mail) return { error: `Havuzda yeterli adet yok. Kalan: ${rem.sms} SMS / ${rem.mail} mail.` };
        tx.set(poolRef, { smsUsed: FieldValue.increment(sms), mailUsed: FieldValue.increment(mail), updatedAt: FieldValue.serverTimestamp() }, { merge: true });
        tx.set(db.collection(COLLECTIONS.ngoMessagingWallets).doc(ngoId), { ngoId, smsQuota: FieldValue.increment(sms), mailQuota: FieldValue.increment(mail), updatedAt: FieldValue.serverTimestamp() }, { merge: true });
        tx.update(orderRef, { status: 'paid', paidAt: FieldValue.serverTimestamp() });
        return { ok: true, sms, mail, ngoId };
      });
      if ('error' in out) return NextResponse.json({ errorCode: 'CONFIRM_FAILED', message: out.error }, { status: 409 });
      return NextResponse.json({ ok: true, credited: out });
    }

    return NextResponse.json({ errorCode: 'BAD_ACTION', message: 'Bilinmeyen aksiyon.' }, { status: 400 });
  } catch (err) {
    console.error('[messaging/quota] failed', err);
    return NextResponse.json({ errorCode: 'INTERNAL', message: 'İşlem başarısız.' }, { status: 500 });
  }
}
