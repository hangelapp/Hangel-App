/**
 * GET /api/ngo-admin/users/managers
 * Çağıranın yönettiği kuruluşun yetkililerini rolleriyle listeler (Admin SDK →
 * Firestore rules'tan bağımsız; Genel Yönetici de güvenle görebilir).
 *
 * Yanıt: { managers: AdminRow[], viewer: { uid, isGeneral, ownerUserId, kind, orgName } }
 */
import { NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';
import { resolveOrgAdminCtx, KIND_TO_MANAGED, KIND_TO_ROLE_TITLE, KIND_TO_INVITE_ID, type OrgKind } from '@/lib/ngo-admin/org-admin-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface AdminRow {
  userId: string;
  name: string;
  avatarUrl: string | null;
  role: string;
  since: number;
  invitationId?: string;
  isPrimary: boolean;
  isOwner: boolean;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const r = await resolveOrgAdminCtx(req, {
    orgId: searchParams.get('orgId'),
    kind: searchParams.get('kind') as OrgKind | null,
  });
  if (!r.ok) return NextResponse.json({ errorCode: 'FORBIDDEN', message: r.error }, { status: r.status });
  const { ctx } = r;

  const db = getAdminFirestore();
  const managedField = KIND_TO_MANAGED[ctx.kind];
  const roleField = KIND_TO_ROLE_TITLE[ctx.kind];
  const inviteIdField = KIND_TO_INVITE_ID[ctx.kind];

  const [mgrSnap, invSnap] = await Promise.all([
    db.collection(COLLECTIONS.users).where(managedField, '==', ctx.orgId).limit(200).get().catch(() => null),
    db.collection(COLLECTIONS.userInvitations).where(inviteIdField, '==', ctx.orgId).limit(300).get().catch(() => null),
  ]);

  const rows = new Map<string, AdminRow>();

  mgrSnap?.docs.forEach((d) => {
    const u = d.data() as Record<string, unknown>;
    const name = (u.name as string) || (u.displayName as string)
      || `${(u.firstName as string) || ''} ${(u.lastName as string) || ''}`.trim() || 'Üye';
    rows.set(d.id, {
      userId: d.id,
      name,
      avatarUrl: (u.avatarUrl as string) || null,
      role: (u[roleField] as string) || (u.roleTitle as string) || 'Yönetici',
      since: 0,
      isPrimary: true,
      isOwner: d.id === ctx.ownerUserId,
    });
  });

  invSnap?.docs.forEach((d) => {
    const inv = d.data() as Record<string, unknown>;
    if (inv.status === 'revoked') return;
    const uid = inv.inviteeUserId as string | undefined;
    if (!uid) return;
    let since = 0;
    const ts = inv.invitedAt as { toMillis?: () => number } | undefined;
    if (ts?.toMillis) { try { since = ts.toMillis(); } catch { /* ignore */ } }
    const ex = rows.get(uid);
    if (ex) {
      ex.invitationId = d.id;
      if (inv.role) ex.role = inv.role as string;
      if (since) ex.since = since;
      return;
    }
    rows.set(uid, {
      userId: uid,
      name: (inv.inviteeName as string) || 'Üye',
      avatarUrl: null,
      role: (inv.role as string) || 'Yönetici',
      since,
      invitationId: d.id,
      isPrimary: false,
      isOwner: uid === ctx.ownerUserId,
    });
  });

  // Kuruluş sahibi (adminUserId) listede yoksa ekle — managedId/davet kaydı olmasa
  // bile sahip her zaman görünmeli (eski kurumlarda sahip yalnız adminUserId ile bağlı).
  if (ctx.ownerUserId && !rows.has(ctx.ownerUserId)) {
    const oSnap = await db.collection(COLLECTIONS.users).doc(ctx.ownerUserId).get().catch(() => null);
    if (oSnap?.exists) {
      const u = oSnap.data() as Record<string, unknown>;
      rows.set(ctx.ownerUserId, {
        userId: ctx.ownerUserId,
        name: (u.name as string) || (u.displayName as string)
          || `${(u.firstName as string) || ''} ${(u.lastName as string) || ''}`.trim() || 'Üye',
        avatarUrl: (u.avatarUrl as string) || null,
        role: (u[roleField] as string) || (u.roleTitle as string) || 'Genel Yönetici',
        since: 0,
        isPrimary: true,
        isOwner: true,
      });
    }
  }

  const managers = Array.from(rows.values()).sort(
    (a, b) => (b.isOwner ? 1 : 0) - (a.isOwner ? 1 : 0) || b.since - a.since,
  );

  return NextResponse.json({
    managers,
    viewer: { uid: ctx.uid, isGeneral: ctx.isGeneral, isSuperAdmin: ctx.isSuperAdmin, ownerUserId: ctx.ownerUserId, kind: ctx.kind, orgName: ctx.orgName },
  });
}
