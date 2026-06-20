/**
 * Kurumsal yetkili atama — paylaşılan Admin SDK yardımcıları.
 * SUNUCU tarafı (firebase-admin). Kullanım: onay route'u (assign-or-claim) ve
 * kayıt/giriş route'u (claim-org-roles).
 *
 * Akış: kurumsal başvuru yetkili kişisi telefonu/e-postası kayıtlı bir kullanıcıya
 * aitse o kişi anında kuruluşun yetkilisi (Genel Yönetici / Kulüp Başkanı) yapılır;
 * değilse pendingOrgClaims'e yazılır ve kişi telefonuyla kayıt/giriş yaptığında
 * otomatik atanır.
 */
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { COLLECTIONS } from '@/firebase/collections';
import { type OrgKind, KIND_TO_COL, KIND_TO_MANAGED, KIND_TO_ROLE_TITLE, KIND_TO_INVITE_ID } from './org-admin-auth';
import { toE164, phoneMatchCandidates } from '@/lib/phone-normalize';

const OWNER_ROLES = new Set(['Genel Yönetici', 'Kulüp Başkanı']);

/** Telefon / e-posta / mevcut uid'den kayıtlı kullanıcıyı bul (yoksa null). */
export async function resolveUserByContact(opts: {
  phone?: string | null;
  phoneCountryCode?: string | null;
  email?: string | null;
  existingUserId?: string | null;
}): Promise<string | null> {
  const db = getAdminFirestore();
  const auth = getAdminAuth();

  if (opts.existingUserId) {
    const s = await db.collection(COLLECTIONS.users).doc(opts.existingUserId).get().catch(() => null);
    if (s?.exists) return opts.existingUserId;
  }

  // Telefon — önce Auth (E.164), sonra Firestore aday formları.
  if (opts.phone) {
    const e164 = toE164(opts.phone, opts.phoneCountryCode || '+90');
    if (e164) {
      try { const u = await auth.getUserByPhoneNumber(e164); if (u?.uid) return u.uid; } catch { /* yok */ }
    }
    const cands = phoneMatchCandidates(opts.phone, opts.phoneCountryCode || '+90').slice(0, 10);
    if (cands.length) {
      for (const field of ['personalInfo.phone', 'phone', 'phoneNumber']) {
        const snap = await db.collection(COLLECTIONS.users).where(field, 'in', cands).limit(1).get().catch(() => null);
        if (snap && !snap.empty) return snap.docs[0].id;
      }
    }
  }

  // E-posta — Auth, sonra Firestore.
  if (opts.email) {
    const email = opts.email.trim().toLowerCase();
    if (email) {
      try { const u = await auth.getUserByEmail(email); if (u?.uid) return u.uid; } catch { /* yok */ }
      const snap = await db.collection(COLLECTIONS.users).where('personalInfo.email', '==', email).limit(1).get().catch(() => null);
      if (snap && !snap.empty) return snap.docs[0].id;
    }
  }

  return null;
}

/** Kullanıcıyı kuruluşun yetkilisi yap (managed*Id + rol başlığı + davet + bildirim). Idempotent. */
export async function wireOrgManager(opts: {
  uid: string;
  entityId: string;
  kind: OrgKind;
  role: string;
  entityName?: string;
  invitedBy?: string;
}): Promise<void> {
  const { uid, entityId, kind, role } = opts;
  const db = getAdminFirestore();
  const managedField = KIND_TO_MANAGED[kind];
  const roleField = KIND_TO_ROLE_TITLE[kind];
  const inviteIdField = KIND_TO_INVITE_ID[kind];
  const entityName = opts.entityName || 'Kuruluş';
  const invitedBy = opts.invitedBy || 'system';

  const userRef = db.collection(COLLECTIONS.users).doc(uid);
  const userSnap = await userRef.get();
  if (!userSnap.exists) return;
  const cur = userSnap.data() as Record<string, unknown>;

  const batch = db.batch();

  const userPatch: Record<string, unknown> = { [managedField]: entityId, [roleField]: role, roleTitle: role };
  if (cur.role !== 'super-admin') userPatch.role = 'ngo-admin';
  batch.set(userRef, userPatch, { merge: true });

  // Sahip rolü ise kuruluşun adminUserId'sini bu kişiye ata.
  if (OWNER_ROLES.has(role)) {
    batch.set(db.collection(KIND_TO_COL[kind]).doc(entityId), { adminUserId: uid }, { merge: true });
  }

  // Davet kaydı (audit) — varsa güncelle, yoksa oluştur.
  const existing = await db.collection(COLLECTIONS.userInvitations)
    .where(inviteIdField, '==', entityId).where('inviteeUserId', '==', uid).limit(1).get().catch(() => null);
  const inviteeName = (cur.name as string) || (cur.displayName as string) || 'Üye';
  if (existing && !existing.empty) {
    batch.update(existing.docs[0].ref, { role, status: 'accepted' });
  } else {
    batch.set(db.collection(COLLECTIONS.userInvitations).doc(), {
      [inviteIdField]: entityId,
      inviteeUserId: uid,
      inviteeName,
      role,
      status: 'accepted',
      invitedBy,
      invitedAt: FieldValue.serverTimestamp(),
      autoAcceptedBy: invitedBy,
    });
  }

  // Bildirim
  batch.set(db.collection(COLLECTIONS.notifications).doc(), {
    userId: uid,
    type: 'authorization',
    title: '🤝 Yetkilendirildiniz',
    body: `${entityName} için "${role}" olarak yetkilendirildiniz. Yönetim paneline erişebilirsiniz.`,
    data: { entityId, entityType: kind, role },
    read: false,
    createdAt: FieldValue.serverTimestamp(),
    createdBy: invitedBy,
  });

  await batch.commit();
}

/** Kayıtlı kullanıcı yoksa telefon-bazlı bekleyen yetkilendirme talebi oluştur (dedupe). */
export async function createPendingClaim(opts: {
  phone: string;
  phoneCountryCode?: string | null;
  entityId: string;
  kind: OrgKind;
  role: string;
  entityName?: string;
}): Promise<boolean> {
  const db = getAdminFirestore();
  const e164 = toE164(opts.phone, opts.phoneCountryCode || '+90');
  if (!e164) return false;

  const dup = await db.collection(COLLECTIONS.pendingOrgClaims)
    .where('phoneE164', '==', e164).where('entityId', '==', opts.entityId).limit(1).get().catch(() => null);
  const payload = { phoneE164: e164, entityId: opts.entityId, entityKind: opts.kind, role: opts.role, entityName: opts.entityName || 'Kuruluş', status: 'pending' as const };
  if (dup && !dup.empty) {
    await dup.docs[0].ref.set(payload, { merge: true });
  } else {
    await db.collection(COLLECTIONS.pendingOrgClaims).add({ ...payload, createdAt: FieldValue.serverTimestamp() });
  }
  return true;
}

/** Kullanıcının telefonlarına eşleşen bekleyen talepleri çöz (kayıt/giriş anında). */
export async function resolvePendingClaimsForUser(opts: { uid: string; phones: (string | null | undefined)[] }): Promise<number> {
  const db = getAdminFirestore();
  const e164s = Array.from(new Set(opts.phones.map(p => (p ? toE164(p) : '')).filter(Boolean)));
  if (!e164s.length) return 0;

  let count = 0;
  for (const e164 of e164s.slice(0, 10)) {
    const snap = await db.collection(COLLECTIONS.pendingOrgClaims).where('phoneE164', '==', e164).limit(25).get().catch(() => null);
    if (!snap) continue;
    for (const d of snap.docs) {
      const c = d.data() as { entityId?: string; entityKind?: OrgKind; role?: string; entityName?: string; status?: string };
      if (c.status === 'resolved' || !c.entityId || !c.entityKind) continue;
      try {
        await wireOrgManager({ uid: opts.uid, entityId: c.entityId, kind: c.entityKind, role: c.role || 'Genel Yönetici', entityName: c.entityName, invitedBy: 'system-claim' });
        await d.ref.set({ status: 'resolved', resolvedUserId: opts.uid, resolvedAt: FieldValue.serverTimestamp() }, { merge: true });
        count++;
      } catch (e) {
        console.error('pendingOrgClaim çözülemedi:', d.id, e);
      }
    }
  }
  return count;
}
