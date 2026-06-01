'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import React, { useMemo, useState } from 'react';
import { User, Plus, Trash2, ArrowLeft, Loader2, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useFirestore, useUser, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { useActiveEntity, useActiveEntityDoc } from '@/app/ngo-admin/active-entity-context';
import { collection, query, where, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { COLLECTIONS } from '@/firebase/collections';
import { useTranslation } from '@/components/providers/language-provider';

type EntityKind = 'ngo' | 'brand' | 'club';

// Atanabilir yetkili rolleri — new/page.tsx ile birebir aynı liste.
const ROLE_OPTIONS = [
  'Genel Yönetici',
  'Finans Yöneticisi',
  'Gönüllü Yöneticisi',
  'Mini Blog Yöneticisi',
] as const;

// userInvitations'da kuruluş referansı kind'a göre farklı alanda tutulur.
const invitationIdFieldByKind: Record<EntityKind, 'ngoId' | 'brandId' | 'clubId'> = {
  ngo: 'ngoId',
  brand: 'brandId',
  club: 'clubId',
};
// users dokümanındaki tek-değerli managed alanı.
const managedIdFieldByKind: Record<EntityKind, 'managedNgoId' | 'managedBrandId' | 'managedClubId'> = {
  ngo: 'managedNgoId',
  brand: 'managedBrandId',
  club: 'managedClubId',
};

interface ManagedEntityDoc {
  id: string;
  name?: string;
  shortName?: string;
  adminUserId?: string;
}
interface UserDocData {
  id: string;
  name?: string;
  displayName?: string;
  avatarUrl?: string;
  role?: 'super-admin' | 'ngo-admin' | 'user';
  roleTitle?: string | null;
  managedNgoId?: string | null;
  managedBrandId?: string | null;
  managedClubId?: string | null;
}
interface InvitationDoc {
  id: string;
  inviteeUserId?: string;
  inviteeName?: string;
  role?: string;
  status?: string;
  invitedAt?: { toDate?: () => Date } | Date | null;
}

// Listede gösterilecek tekilleştirilmiş yetkili satırı.
interface AdminRow {
  userId: string;
  name: string;
  avatarUrl?: string;
  role: string;
  since: number; // epoch ms; 0 = bilinmiyor
  invitationId?: string; // revoke için (primary-only admin'lerde olmayabilir)
  isPrimary: boolean; // managed{X}Id == entityId
}

const toMillis = (raw: InvitationDoc['invitedAt']): number => {
  if (!raw) return 0;
  try {
    if (raw instanceof Date) return raw.getTime();
    const d = (raw as { toDate?: () => Date }).toDate;
    if (typeof d === 'function') return d.call(raw).getTime();
  } catch { /* ignore */ }
  return 0;
};

const formatDate = (ms: number): string => {
  if (!ms) return '';
  try {
    return new Date(ms).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return '';
  }
};

export default function UsersPage() {
  const { toast } = useToast();
  const router = useRouter();
  const firestore = useFirestore();
  const { user: authUser } = useUser();
  const { t } = useTranslation();

  // Aktif kuruluş (ActiveEntityProvider) — banner ve sayfa içeriği tek kaynak.
  const { id: activeIdFromCtx, kind: activeKindFromCtx } = useActiveEntity();
  const { data: activeDoc } = useActiveEntityDoc<ManagedEntityDoc>();

  const activeEntity = useMemo<{ kind: EntityKind; data: ManagedEntityDoc } | null>(() => {
    if (!activeIdFromCtx || !activeKindFromCtx || !activeDoc) return null;
    return { kind: activeKindFromCtx, data: activeDoc };
  }, [activeIdFromCtx, activeKindFromCtx, activeDoc]);

  // Auth user'ın kendi doc'u — sadece role/roleTitle alanları (isGeneralAdmin kontrolü için).
  const authUserDocRef = useMemoFirebase(
    () => (firestore && authUser?.uid ? doc(firestore, COLLECTIONS.users, authUser.uid) : null),
    [firestore, authUser?.uid],
  );
  const { data: userData } = useDoc<UserDocData>(authUserDocRef);

  const entityId = activeEntity?.data?.id || null;
  const entityKind = activeEntity?.kind || null;
  const invitationIdField = entityKind ? invitationIdFieldByKind[entityKind] : null;
  const managedIdField = entityKind ? managedIdFieldByKind[entityKind] : null;

  // Kuruluşun sahibi (ana yetkili) — bu kullanıcının rolü/erişimi kaldırılamaz.
  const ownerUserId = activeEntity?.data?.adminUserId || null;

  // Yalnızca "Genel Yönetici" başkalarının rolünü değiştirebilir veya yetkisini kaldırabilir.
  // Sinyaller: kuruluş sahibi olmak, roleTitle === 'Genel Yönetici', veya super-admin.
  const isGeneralAdmin = !!authUser?.uid && (
    (ownerUserId !== null && ownerUserId === authUser.uid)
    || userData?.roleTitle === 'Genel Yönetici'
    || userData?.role === 'super-admin'
  );

  // ---- Bu kuruluşun gerçek yetkilileri ----
  // 1) userInvitations (kind'a göre ngoId/brandId/clubId == entityId), revoke edilmemiş.
  const invitationsQuery = useMemoFirebase(
    () => (firestore && entityId && invitationIdField
      ? query(collection(firestore, COLLECTIONS.userInvitations), where(invitationIdField, '==', entityId))
      : null),
    [firestore, entityId, invitationIdField],
  );
  const { data: invitations, isLoading: invitationsLoading } = useCollection<InvitationDoc>(invitationsQuery);

  // 2) managed{X}Id == entityId olan kullanıcılar (birincil yönetici).
  const managedUsersQuery = useMemoFirebase(
    () => (firestore && entityId && managedIdField
      ? query(collection(firestore, COLLECTIONS.users), where(managedIdField, '==', entityId))
      : null),
    [firestore, entityId, managedIdField],
  );
  const { data: managedUsers, isLoading: managedUsersLoading } = useCollection<UserDocData>(managedUsersQuery);

  // 3) Davet kayıtlarındaki kullanıcıların isim/avatar bilgisini çözmek için tüm üyeler.
  const allUsersQuery = useMemoFirebase(
    () => (firestore && entityId ? collection(firestore, COLLECTIONS.users) : null),
    [firestore, entityId],
  );
  const { data: allUsers } = useCollection<UserDocData>(allUsersQuery);

  const isLoading = invitationsLoading || managedUsersLoading;

  // Merge + dedupe: birincil yöneticiler (managed alanından) + revoke edilmemiş davetler.
  const adminRows = useMemo<AdminRow[]>(() => {
    if (!entityId) return [];
    const usersById = new Map<string, UserDocData>((allUsers || []).map(u => [u.id, u]));
    const byUserId = new Map<string, AdminRow>();

    const resolveName = (uid: string | undefined, fallback?: string): string => {
      const u = uid ? usersById.get(uid) : undefined;
      return u?.name || u?.displayName || fallback || t('ngo_admin_users.memberFallback');
    };

    // Birincil yöneticiler önce (revoke davranışında managed alanı temizlenir).
    for (const u of managedUsers || []) {
      byUserId.set(u.id, {
        userId: u.id,
        name: u.name || u.displayName || t('ngo_admin_users.memberFallback'),
        avatarUrl: u.avatarUrl,
        role: u.roleTitle || t('ngo_admin_users.defaultPrimaryRole'),
        since: 0,
        isPrimary: true,
      });
    }

    // Davetler (revoke edilmiş olanlar hariç).
    for (const inv of invitations || []) {
      if (inv.status === 'revoked') continue;
      const uid = inv.inviteeUserId;
      if (!uid) continue;
      const existing = byUserId.get(uid);
      const since = toMillis(inv.invitedAt);
      if (existing) {
        // Birincil satırı davet kaydıyla zenginleştir (revoke için invitationId + tarih).
        existing.invitationId = inv.id;
        if (inv.role) existing.role = inv.role;
        if (since) existing.since = since;
        continue;
      }
      const u = usersById.get(uid);
      byUserId.set(uid, {
        userId: uid,
        name: resolveName(uid, inv.inviteeName),
        avatarUrl: u?.avatarUrl,
        role: inv.role || t('ngo_admin_users.defaultInviteRole'),
        since,
        invitationId: inv.id,
        isPrimary: false,
      });
    }

    return Array.from(byUserId.values()).sort((a, b) => b.since - a.since);
  }, [entityId, managedUsers, invitations, allUsers, t]);

  const [revoking, setRevoking] = useState<string | null>(null);
  const [roleEdits, setRoleEdits] = useState<Record<string, string>>({});
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);

  // Bir satır üzerinde rol değişikliği / yetki kaldırma kontrollerinin gösterilip gösterilmeyeceği.
  // Sahip ve oturum açan kullanıcının kendi satırı korunur.
  const canManageRow = (row: AdminRow): boolean =>
    isGeneralAdmin
    && row.userId !== ownerUserId
    && row.userId !== authUser?.uid;

  const handleUpdateRole = async (row: AdminRow, newRole: string) => {
    if (!firestore || !entityId || !managedIdField) return;
    if (!canManageRow(row)) return;
    setUpdatingRole(row.userId);
    try {
      // 1) Davet kaydı varsa rolünü güncelle (audit + liste kaynağı).
      if (row.invitationId) {
        await updateDoc(doc(firestore, COLLECTIONS.userInvitations, row.invitationId), { role: newRole });
      }
      // 2) Kullanıcının roleTitle alanını eşitle (panel rol kapsamı buradan okunur).
      await updateDoc(doc(firestore, COLLECTIONS.users, row.userId), { roleTitle: newRole });

      // 3) Rolü değiştirilen kullanıcıya uygulama içi bildirim gönder.
      //    Bildirim oluşturulamasa bile rol güncellemesi geri alınmaz.
      try {
        const entityName = activeEntity?.data?.name || t('ngo_admin_users.notifEntityFallback');
        await addDoc(collection(firestore, COLLECTIONS.notifications), {
          userId: row.userId,
          type: 'authorization',
          title: t('ngo_admin_users.notifTitle'),
          body: `${entityName} ${t('ngo_admin_users.notifBodyMiddle')} ${newRole} ${t('ngo_admin_users.notifBodySuffix')}`,
          data: { entityId, entityType: entityKind, role: newRole },
          read: false,
          createdAt: serverTimestamp(),
          createdBy: authUser?.uid || null,
        });
      } catch (notifErr) {
        console.warn('Yetkilendirme bildirimi oluşturulamadı:', notifErr);
      }

      setRoleEdits(prev => {
        const next = { ...prev };
        delete next[row.userId];
        return next;
      });
      toast({
        title: t('ngo_admin_users.toastRoleUpdatedTitle'),
        description: `${row.name} ${t('ngo_admin_users.toastRoleUpdatedDescPrefix')} "${newRole}" ${t('ngo_admin_users.toastRoleUpdatedDescSuffix')}`,
      });
    } catch (error) {
      console.error('Update role failed:', error);
      const err = error as { code?: string; message?: string };
      toast({
        variant: 'destructive',
        title: t('ngo_admin_users.toastRoleFailedTitle'),
        description: err?.code === 'permission-denied'
          ? t('ngo_admin_users.toastPermissionDenied')
          : (err?.message || t('ngo_admin_users.toastUnexpected')),
      });
    } finally {
      setUpdatingRole(null);
    }
  };

  const handleRevoke = async (row: AdminRow) => {
    if (!firestore || !entityId || !managedIdField) return;
    if (!canManageRow(row)) return;
    setRevoking(row.userId);
    try {
      // 1) Davet kaydı varsa revoke et.
      if (row.invitationId) {
        await updateDoc(doc(firestore, COLLECTIONS.userInvitations, row.invitationId), { status: 'revoked' });
      }

      // 2) Kullanıcının managed{X}Id'si bu kuruluşsa temizle (super-admin hariç role'ü indir).
      const target = (allUsers || []).find(u => u.id === row.userId);
      const targetManagedId = target ? target[managedIdField] : undefined;
      if (row.isPrimary || targetManagedId === entityId) {
        const userPatch: Record<string, unknown> = { [managedIdField]: null, roleTitle: null };
        if (target?.role !== 'super-admin') {
          userPatch.role = 'user';
        }
        await updateDoc(doc(firestore, COLLECTIONS.users, row.userId), userPatch);
      }

      toast({
        variant: 'destructive',
        title: t('ngo_admin_users.toastRevokedTitle'),
        description: `${row.name} ${t('ngo_admin_users.toastRevokedDescSuffix')}`,
      });
    } catch (error) {
      console.error('Revoke failed:', error);
      const err = error as { code?: string; message?: string };
      toast({
        variant: 'destructive',
        title: t('ngo_admin_users.toastRevokeFailedTitle'),
        description: err?.code === 'permission-denied'
          ? t('ngo_admin_users.toastPermissionDenied')
          : (err?.message || t('ngo_admin_users.toastUnexpected')),
      });
    } finally {
      setRevoking(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in-0">
      <div className="flex items-center gap-2">
        <Button onClick={() => router.back()} variant="ghost" size="icon" className="-ml-2" aria-label={t('ngo_admin_users.backAria')}>
            <ArrowLeft className="h-6 w-6" />
        </Button>
        <div>
            <h1 className="text-2xl font-bold font-headline">{t('ngo_admin_users.pageTitle')}</h1>
            <p className="text-muted-foreground text-sm">
              {t('ngo_admin_users.pageSubtitle')}
            </p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{t('ngo_admin_users.cardTitle')}</CardTitle>
            <CardDescription className="flex items-center gap-1.5">
              {isGeneralAdmin ? (
                <>
                  <ShieldCheck className="h-3.5 w-3.5 text-primary shrink-0" />
                  {t('ngo_admin_users.descGeneralAdmin')}
                </>
              ) : (
                t('ngo_admin_users.descMember')
              )}
            </CardDescription>
          </div>
          {isGeneralAdmin && (
            <Button asChild size="sm">
              <Link href="/ngo-admin/users/new">
                  <Plus className="mr-2 h-4 w-4"/> {t('ngo_admin_users.addNew')}
              </Link>
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
            {!authUser ? (
                <div className="text-center py-12 border-2 border-dashed rounded-lg">
                    <User className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-muted-foreground">{t('ngo_admin_users.authRequired')}</p>
                </div>
            ) : !activeEntity ? (
                <div className="text-center py-12 border-2 border-dashed rounded-lg">
                    <User className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-muted-foreground">{t('ngo_admin_users.noEntity')}</p>
                </div>
            ) : isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : (
            <div className="space-y-3">
                {adminRows.length > 0 ? adminRows.map(row => {
                    const since = formatDate(row.since);
                    const isRowRevoking = revoking === row.userId;
                    const isRowUpdating = updatingRole === row.userId;
                    const manageable = canManageRow(row);
                    const isOwnerRow = row.userId === ownerUserId;
                    const editedRole = roleEdits[row.userId] ?? row.role;
                    const isKnownRole = (ROLE_OPTIONS as readonly string[]).includes(editedRole);
                    return (
                    <div key={row.userId} className="flex justify-between items-center gap-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                            <Avatar className="h-9 w-9 border">
                                <AvatarImage src={row.avatarUrl} alt={row.name} />
                                <AvatarFallback className="text-xs font-bold">{(row.name || '?').charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    <p className="font-medium truncate">{row.name}</p>
                                    {isOwnerRow && (
                                        <Badge variant="outline" className="text-[10px] font-bold px-2 py-0 bg-amber-100 text-amber-800 border-amber-300/50 dark:bg-amber-900/40 dark:text-amber-300">
                                            {t('ngo_admin_users.ownerBadge')}
                                        </Badge>
                                    )}
                                </div>
                                {since && <p className="text-xs text-muted-foreground">{since}</p>}
                            </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            {manageable ? (
                                <div className="flex items-center gap-1.5">
                                    <Select
                                        value={isKnownRole ? editedRole : undefined}
                                        onValueChange={(v) => setRoleEdits(prev => ({ ...prev, [row.userId]: v }))}>
                                        <SelectTrigger className="h-8 w-auto min-w-[150px] text-xs font-bold" aria-label={t('ngo_admin_users.selectRoleAria')}>
                                            <SelectValue placeholder={row.role} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {ROLE_OPTIONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-8 px-2.5 text-xs font-bold"
                                        disabled={isRowUpdating || editedRole === row.role}
                                        onClick={() => { void handleUpdateRole(row, editedRole); }}>
                                        {isRowUpdating && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                                        {t('ngo_admin_users.updateBtn')}
                                    </Button>
                                </div>
                            ) : (
                                <Badge variant="outline" className={cn("text-[10px] font-bold px-2 py-0", row.isPrimary && "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border-purple-300/50")}>
                                    {row.role}
                                </Badge>
                            )}
                            {manageable && (
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                            disabled={isRowRevoking}
                                            aria-label={t('ngo_admin_users.revokeAria')}
                                        >
                                            {isRowRevoking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>{t('ngo_admin_users.revokeConfirmTitle')}</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                <span className="font-bold">{row.name}</span> {t('ngo_admin_users.revokeConfirmDescPrefix')} {activeEntity.data.name || t('ngo_admin_users.revokeConfirmEntityFallback')} {t('ngo_admin_users.revokeConfirmDescSuffix')}
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>{t('ngo_admin_users.revokeCancel')}</AlertDialogCancel>
                                            <AlertDialogAction
                                                className={cn(buttonVariants({ variant: "destructive" }))}
                                                onClick={() => handleRevoke(row)}>
                                                {t('ngo_admin_users.revokeConfirm')}
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            )}
                        </div>
                    </div>
                    );
                }) : (
                    <div className="text-center py-12 border-2 border-dashed rounded-lg">
                        <User className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                        <p className="text-muted-foreground">{t('ngo_admin_users.noAdmins')}</p>
                    </div>
                )}
            </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
