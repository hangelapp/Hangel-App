import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore, getAdminAuth } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { COLLECTIONS } from '@/firebase/collections';

export const runtime = 'nodejs';

type EntityKind = 'STK' | 'Marka' | 'Öğrenci Kulübü';
type EntityCol = 'ngo' | 'brand' | 'club';

interface InviteBody {
  inviteeUserId: string;
  role: string;
}

const KIND_TO_COL: Record<EntityCol, string> = {
  ngo: COLLECTIONS.ngos,
  brand: COLLECTIONS.brands,
  club: COLLECTIONS.clubs,
};
const KIND_TO_MANAGED: Record<EntityCol, 'managedNgoId' | 'managedBrandId' | 'managedClubId'> = {
  ngo: 'managedNgoId',
  brand: 'managedBrandId',
  club: 'managedClubId',
};
const KIND_TO_ROLE_TITLE: Record<EntityCol, 'ngoRoleTitle' | 'brandRoleTitle' | 'clubRoleTitle'> = {
  ngo: 'ngoRoleTitle',
  brand: 'brandRoleTitle',
  club: 'clubRoleTitle',
};
const COL_TO_LABEL: Record<EntityCol, EntityKind> = {
  ngo: 'STK',
  brand: 'Marka',
  club: 'Öğrenci Kulübü',
};
const COL_TO_ACCUSATIVE: Record<EntityCol, string> = {
  ngo: "STK'yı",
  brand: 'markayı',
  club: 'öğrenci kulübünü',
};

/**
 * NGO/Marka/Kulüp adminin co-admin davet endpoint'i. SEC-2026-05-25 hardened
 * rules sonrası `managedClubId`/`managedNgoId`/`managedBrandId` yalnızca
 * super-admin veya Admin SDK ile yazılabilir; bu route Admin SDK kullanarak
 * davetli kullanıcının org-membership alanlarını yetkilendirme anında set
 * eder. Önceki "pending invitation, asla accept edilmiyor" deadlock'unu
 * kırar — davetli artık anında kuruluşun kullanıcısı olur ve gerekli sayfalara
 * (etkinlik oluştur vb.) erişebilir.
 */
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization') ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!token) {
    return NextResponse.json({ error: 'Token gerekli' }, { status: 401 });
  }
  let decoded: { uid: string; email?: string; role?: string };
  try {
    decoded = (await getAdminAuth().verifyIdToken(token)) as typeof decoded;
  } catch {
    return NextResponse.json({ error: 'Geçersiz token' }, { status: 401 });
  }

  let body: InviteBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Geçersiz JSON' }, { status: 400 });
  }
  const { inviteeUserId, role } = body;
  if (!inviteeUserId || typeof inviteeUserId !== 'string') {
    return NextResponse.json({ error: 'inviteeUserId zorunlu' }, { status: 400 });
  }
  if (!role || typeof role !== 'string') {
    return NextResponse.json({ error: 'role zorunlu' }, { status: 400 });
  }
  if (inviteeUserId === decoded.uid) {
    return NextResponse.json({ error: 'Kendine davet gönderilemez' }, { status: 400 });
  }

  const db = getAdminFirestore();

  // Caller'ın hangi kuruluşu yönettiğini çöz: ngo/brand/club priority
  const callerSnap = await db.collection(COLLECTIONS.users).doc(decoded.uid).get();
  if (!callerSnap.exists) {
    return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 });
  }
  const callerData = callerSnap.data() as Record<string, string | undefined>;
  const isSuperAdmin = decoded.role === 'super-admin';

  let kind: EntityCol | null = null;
  let entityId: string | null = null;
  if (callerData.managedNgoId) { kind = 'ngo'; entityId = callerData.managedNgoId; }
  else if (callerData.managedBrandId) { kind = 'brand'; entityId = callerData.managedBrandId; }
  else if (callerData.managedClubId) { kind = 'club'; entityId = callerData.managedClubId; }

  if (!isSuperAdmin && (!kind || !entityId)) {
    return NextResponse.json({ error: 'Kuruluş yönetici yetkiniz yok' }, { status: 403 });
  }
  if (!kind || !entityId) {
    // Super-admin için targetEntity body parametresi gerekirdi — basitlik için
    // şimdilik super-admin kendi yönettiği orgu yoksa /super-admin/clubs vs.
    // direkt flow'larını kullanmalı.
    return NextResponse.json({ error: 'Yönetilen kuruluş çözümlenemedi' }, { status: 400 });
  }

  // Kuruluş bilgilerini al (mesaj/audit için)
  const entitySnap = await db.collection(KIND_TO_COL[kind]).doc(entityId).get();
  if (!entitySnap.exists) {
    return NextResponse.json({ error: 'Kuruluş bulunamadı' }, { status: 404 });
  }
  const entityName = (entitySnap.data() as { name?: string }).name || COL_TO_LABEL[kind];

  // Caller "Genel Yönetici" olmalı (entity.adminUserId == caller.uid) — yoksa
  // managed*Id'si olsa bile co-admin atama yetkisi yok. Super-admin atlanır.
  if (!isSuperAdmin) {
    const entityAdminUid = (entitySnap.data() as { adminUserId?: string }).adminUserId;
    if (entityAdminUid && entityAdminUid !== decoded.uid) {
      return NextResponse.json({ error: 'Yalnızca Genel Yönetici yetkili davet edebilir' }, { status: 403 });
    }
  }

  // Invitee'nin user docunu doğrula
  const inviteeSnap = await db.collection(COLLECTIONS.users).doc(inviteeUserId).get();
  if (!inviteeSnap.exists) {
    return NextResponse.json({ error: 'Davet edilen kullanıcı bulunamadı' }, { status: 404 });
  }
  const inviteeData = inviteeSnap.data() as Record<string, unknown>;
  const inviteeName = (inviteeData.name as string) || (inviteeData.displayName as string) || 'Üye';
  const inviteeEmail = ((inviteeData.personalInfo as { email?: string } | undefined)?.email) || null;
  const inviteePhone = ((inviteeData.personalInfo as { phone?: string } | undefined)?.phone) || null;

  // Eğer invitee zaten farklı bir org yönetiyorsa hata ver (çakışmayı önle).
  // Aynı kuruluşa zaten atanmışsa idempotent — başarılı dön.
  const existingManagedSame =
    (kind === 'ngo' && inviteeData.managedNgoId === entityId) ||
    (kind === 'brand' && inviteeData.managedBrandId === entityId) ||
    (kind === 'club' && inviteeData.managedClubId === entityId);
  const existingManagedOther =
    !existingManagedSame &&
    (inviteeData.managedNgoId || inviteeData.managedBrandId || inviteeData.managedClubId);
  if (existingManagedOther) {
    return NextResponse.json({
      error: 'Bu kullanıcı zaten başka bir kuruluşa atanmış. Önce o atamayı kaldırın.',
    }, { status: 409 });
  }

  const managedField = KIND_TO_MANAGED[kind];
  const roleTitleField = KIND_TO_ROLE_TITLE[kind];

  // Atomik batch: user doc + invitations + notification.
  const batch = db.batch();

  // 1) Invitee user doc → managed*Id + roleTitle + (yükselt) role
  const userUpdate: Record<string, unknown> = {
    [managedField]: entityId,
    [roleTitleField]: role,
  };
  // Henüz 'super-admin' değilse 'ngo-admin' rolüne yükselt; panellere erişebilsin.
  if (inviteeData.role !== 'super-admin') {
    userUpdate.role = 'ngo-admin';
  }
  batch.update(db.collection(COLLECTIONS.users).doc(inviteeUserId), userUpdate);

  // 2) userInvitations doc → status='accepted' (audit trail). Kind'a göre
  //    entityId alanı: ngoId/brandId/clubId (legacy şema ile uyumlu).
  const invitationIdField = kind === 'ngo' ? 'ngoId' : kind === 'brand' ? 'brandId' : 'clubId';
  const invitationRef = db.collection(COLLECTIONS.userInvitations).doc();
  const invitationMessage = `Sizi ${entityName} ${COL_TO_ACCUSATIVE[kind]} ${role} olarak yönetmek üzere yetkilendirdik.`;
  batch.set(invitationRef, {
    [invitationIdField]: entityId,
    entityKind: COL_TO_LABEL[kind],
    entityName,
    inviteeUserId,
    inviteeName,
    inviteePhone,
    inviteeEmail,
    role,
    status: 'accepted',
    invitedBy: decoded.uid,
    invitedAt: FieldValue.serverTimestamp(),
    acceptedAt: FieldValue.serverTimestamp(),
    message: invitationMessage,
  });

  // 3) Notification — uygulama-içi bildirim (invitee zile gözüksün)
  const notifRef = db.collection(COLLECTIONS.notifications).doc();
  batch.set(notifRef, {
    userId: inviteeUserId,
    type: 'invitation',
    title: `🤝 ${entityName} Yetkili Daveti`,
    body: invitationMessage,
    data: { invitationId: invitationRef.id, entityKind: COL_TO_LABEL[kind], entityName, role },
    read: false,
    createdAt: FieldValue.serverTimestamp(),
    createdBy: decoded.uid,
  });

  // 4) Eğer rol "Genel Yönetici" ise kuruluşun adminUserId'sini bu kişiye devret
  //    (önceki adminUserId override). Sadece super-admin veya mevcut adminUserId
  //    bu transfer'i yapabilir.
  if (role === 'Genel Yönetici') {
    batch.update(db.collection(KIND_TO_COL[kind]).doc(entityId), { adminUserId: inviteeUserId });
  }

  await batch.commit();

  return NextResponse.json({
    ok: true,
    invitationId: invitationRef.id,
    inviteeUserId,
    role,
    entityKind: COL_TO_LABEL[kind],
    entityId,
  });
}
