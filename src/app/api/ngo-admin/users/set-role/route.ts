/**
 * POST /api/ngo-admin/users/set-role  { targetUserId, role }
 * Genel Yönetici, kuruluşun bir yetkilisinin rolünü değiştirir (Admin SDK).
 * Kuruluş sahibinin (adminUserId) rolü bu uçtan değiştirilemez.
 */
import { NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { COLLECTIONS } from '@/firebase/collections';
import { resolveOrgAdminCtx, KIND_TO_MANAGED, KIND_TO_ROLE_TITLE, KIND_TO_INVITE_ID, KIND_TO_ACCUSATIVE } from '@/lib/ngo-admin/org-admin-auth';
import { isValidOrgRole } from '@/lib/ngo-admin/roles';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const r = await resolveOrgAdminCtx(req);
  if (!r.ok) return NextResponse.json({ errorCode: 'FORBIDDEN', message: r.error }, { status: r.status });
  const { ctx } = r;
  if (!ctx.isGeneral) {
    return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'Yalnızca Genel Yönetici rol değiştirebilir.' }, { status: 403 });
  }

  let body: { targetUserId?: string; role?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ errorCode: 'BAD_JSON', message: 'Geçersiz istek.' }, { status: 400 }); }
  const targetUserId = (body.targetUserId || '').trim();
  const role = (body.role || '').trim();
  if (!targetUserId) return NextResponse.json({ errorCode: 'BAD_REQUEST', message: 'targetUserId zorunlu.' }, { status: 400 });
  if (!isValidOrgRole(role)) return NextResponse.json({ errorCode: 'BAD_ROLE', message: 'Geçersiz rol.' }, { status: 400 });
  if (targetUserId === ctx.ownerUserId) {
    return NextResponse.json({ errorCode: 'OWNER_PROTECTED', message: 'Kuruluş sahibinin rolü değiştirilemez.' }, { status: 400 });
  }

  const db = getAdminFirestore();
  const managedField = KIND_TO_MANAGED[ctx.kind];
  const roleField = KIND_TO_ROLE_TITLE[ctx.kind];
  const inviteIdField = KIND_TO_INVITE_ID[ctx.kind];

  const tSnap = await db.collection(COLLECTIONS.users).doc(targetUserId).get();
  if (!tSnap.exists) return NextResponse.json({ errorCode: 'NOT_FOUND', message: 'Kullanıcı bulunamadı.' }, { status: 404 });
  const t = tSnap.data() as Record<string, unknown>;
  if (t[managedField] !== ctx.orgId) {
    return NextResponse.json({ errorCode: 'NOT_MEMBER', message: 'Bu kullanıcı kuruluşun yöneticisi değil.' }, { status: 400 });
  }

  const batch = db.batch();
  // 1) Hedef kullanıcı: kind-özel rol başlığı + generic roleTitle eşitle.
  batch.update(db.collection(COLLECTIONS.users).doc(targetUserId), { [roleField]: role, roleTitle: role });

  // 2) Bu kuruluşa ait, hedefe ait, revoke edilmemiş davet kayıtlarının rolünü güncelle (audit + liste tutarlılığı).
  const invs = await db.collection(COLLECTIONS.userInvitations)
    .where(inviteIdField, '==', ctx.orgId)
    .where('inviteeUserId', '==', targetUserId)
    .limit(20).get().catch(() => null);
  invs?.docs.forEach((d) => {
    if ((d.data() as { status?: string }).status === 'revoked') return;
    batch.update(d.ref, { role });
  });

  // 3) Bildirim
  const notifRef = db.collection(COLLECTIONS.notifications).doc();
  batch.set(notifRef, {
    userId: targetUserId,
    type: 'authorization',
    title: 'Yetki Güncellendi',
    body: `${ctx.orgName} ${KIND_TO_ACCUSATIVE[ctx.kind]} yönetiminde rolünüz "${role}" olarak güncellendi.`,
    data: { entityId: ctx.orgId, entityType: ctx.kind, role },
    read: false,
    createdAt: FieldValue.serverTimestamp(),
    createdBy: ctx.uid,
  });

  await batch.commit();
  return NextResponse.json({ ok: true });
}
