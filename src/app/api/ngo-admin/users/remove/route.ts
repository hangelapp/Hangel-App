/**
 * POST /api/ngo-admin/users/remove  { targetUserId }
 * Genel Yönetici, bir yetkilinin kuruluş yetkisini kaldırır (Admin SDK).
 * Kuruluş sahibi (adminUserId) ve çağıranın kendisi kaldırılamaz.
 */
import { NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { COLLECTIONS } from '@/firebase/collections';
import { resolveOrgAdminCtx, KIND_TO_MANAGED, KIND_TO_ROLE_TITLE, KIND_TO_INVITE_ID, KIND_TO_ACCUSATIVE, type OrgKind } from '@/lib/ngo-admin/org-admin-auth';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  let body: { targetUserId?: string; orgId?: string; kind?: OrgKind };
  try { body = await req.json(); } catch { return NextResponse.json({ errorCode: 'BAD_JSON', message: 'Geçersiz istek.' }, { status: 400 }); }

  const r = await resolveOrgAdminCtx(req, { orgId: body.orgId, kind: body.kind });
  if (!r.ok) return NextResponse.json({ errorCode: 'FORBIDDEN', message: r.error }, { status: r.status });
  const { ctx } = r;
  if (!ctx.isGeneral) {
    return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'Yalnızca Genel Yönetici yetki kaldırabilir.' }, { status: 403 });
  }
  const targetUserId = (body.targetUserId || '').trim();
  if (!targetUserId) return NextResponse.json({ errorCode: 'BAD_REQUEST', message: 'targetUserId zorunlu.' }, { status: 400 });
  if (targetUserId === ctx.ownerUserId) {
    return NextResponse.json({ errorCode: 'OWNER_PROTECTED', message: 'Kuruluş sahibinin yetkisi kaldırılamaz.' }, { status: 400 });
  }
  if (targetUserId === ctx.uid) {
    return NextResponse.json({ errorCode: 'SELF', message: 'Kendi yetkinizi bu ekrandan kaldıramazsınız.' }, { status: 400 });
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
  // 1) Kullanıcının bu kuruluşa dair yönetim alanlarını temizle.
  const userPatch: Record<string, unknown> = { [managedField]: null, [roleField]: null, roleTitle: null };
  // Başka kuruluş yönetmiyorsa ve super-admin değilse normal kullanıcıya indir.
  const managesOther = (ctx.kind !== 'ngo' && t.managedNgoId) || (ctx.kind !== 'brand' && t.managedBrandId) || (ctx.kind !== 'club' && t.managedClubId);
  if (t.role !== 'super-admin' && !managesOther) userPatch.role = 'user';
  batch.update(db.collection(COLLECTIONS.users).doc(targetUserId), userPatch);

  // 2) Bu kuruluşa ait, hedefe ait davet kayıtlarını revoke et.
  const invs = await db.collection(COLLECTIONS.userInvitations)
    .where(inviteIdField, '==', ctx.orgId)
    .where('inviteeUserId', '==', targetUserId)
    .limit(20).get().catch(() => null);
  invs?.docs.forEach((d) => batch.update(d.ref, { status: 'revoked' }));

  // 3) Bildirim
  const notifRef = db.collection(COLLECTIONS.notifications).doc();
  batch.set(notifRef, {
    userId: targetUserId,
    type: 'authorization',
    title: 'Yetki Kaldırıldı',
    body: `${ctx.orgName} ${KIND_TO_ACCUSATIVE[ctx.kind]} yönetim yetkiniz kaldırıldı.`,
    data: { entityId: ctx.orgId, entityType: ctx.kind },
    read: false,
    createdAt: FieldValue.serverTimestamp(),
    createdBy: ctx.uid,
  });

  await batch.commit();
  return NextResponse.json({ ok: true });
}
