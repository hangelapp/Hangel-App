/**
 * POST /api/ngo-admin/users/set-role  { targetUserId, role }
 * Genel Yönetici, kuruluşun bir yetkilisinin rolünü değiştirir (Admin SDK).
 * Kuruluş sahibinin (adminUserId) rolü bu uçtan değiştirilemez.
 */
import { NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { COLLECTIONS } from '@/firebase/collections';
import { resolveOrgAdminCtx, KIND_TO_MANAGED, KIND_TO_ROLE_TITLE, KIND_TO_INVITE_ID, KIND_TO_ACCUSATIVE, type OrgKind } from '@/lib/ngo-admin/org-admin-auth';
import { isValidRoleForKind } from '@/lib/ngo-admin/roles';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  let body: { targetUserId?: string; role?: string; orgId?: string; kind?: OrgKind };
  try { body = await req.json(); } catch { return NextResponse.json({ errorCode: 'BAD_JSON', message: 'Geçersiz istek.' }, { status: 400 }); }

  const r = await resolveOrgAdminCtx(req, { orgId: body.orgId, kind: body.kind });
  if (!r.ok) return NextResponse.json({ errorCode: 'FORBIDDEN', message: r.error }, { status: r.status });
  const { ctx } = r;
  if (!ctx.isGeneral) {
    return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'Yalnızca Genel Yönetici rol değiştirebilir.' }, { status: 403 });
  }
  const targetUserId = (body.targetUserId || '').trim();
  const role = (body.role || '').trim();
  if (!targetUserId) return NextResponse.json({ errorCode: 'BAD_REQUEST', message: 'targetUserId zorunlu.' }, { status: 400 });
  // Rol doğrulaması KIND'a duyarlı: isteğin kuruluş türü (ngo/brand/club) için
  // tanımlı rol listesine göre doğrula — yoksa marka/kulübe özel roller (örn.
  // "Marka Yöneticisi", "Kulüp Başkanı") hep NGO listesiyle reddedilirdi.
  if (!isValidRoleForKind(ctx.kind, role)) return NextResponse.json({ errorCode: 'BAD_ROLE', message: 'Geçersiz rol.' }, { status: 400 });
  // Sahibin rolünü yalnız super-admin değiştirebilir (org Genel Yönetici değil).
  if (targetUserId === ctx.ownerUserId && !ctx.isSuperAdmin) {
    return NextResponse.json({ errorCode: 'OWNER_PROTECTED', message: 'Kuruluş sahibinin rolü değiştirilemez.' }, { status: 400 });
  }

  const db = getAdminFirestore();
  const managedField = KIND_TO_MANAGED[ctx.kind];
  const roleField = KIND_TO_ROLE_TITLE[ctx.kind];
  const inviteIdField = KIND_TO_INVITE_ID[ctx.kind];

  const tSnap = await db.collection(COLLECTIONS.users).doc(targetUserId).get();
  if (!tSnap.exists) return NextResponse.json({ errorCode: 'NOT_FOUND', message: 'Kullanıcı bulunamadı.' }, { status: 404 });
  const t = tSnap.data() as Record<string, unknown>;
  // Sahip (adminUserId) managedField'siz olabilir — ona izin ver; diğerleri için üyelik şart.
  if (t[managedField] !== ctx.orgId && targetUserId !== ctx.ownerUserId) {
    return NextResponse.json({ errorCode: 'NOT_MEMBER', message: 'Bu kullanıcı kuruluşun yöneticisi değil.' }, { status: 400 });
  }

  const batch = db.batch();
  // 1) Hedef kullanıcı: kind-özel rol başlığı + generic roleTitle eşitle + (sahip
  //    managedField'siz olabilir) managedField'i da set et → düzgün üye olarak görünür.
  batch.update(db.collection(COLLECTIONS.users).doc(targetUserId), { [roleField]: role, roleTitle: role, [managedField]: ctx.orgId });

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
