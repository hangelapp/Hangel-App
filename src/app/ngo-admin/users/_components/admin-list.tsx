'use client';

import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { User, Trash2, Loader2, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { useActiveEntity, useActiveEntityDoc } from '@/app/ngo-admin/active-entity-context';
import { collection, query, where, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { COLLECTIONS } from '@/firebase/collections';

type EntityKind = 'ngo' | 'brand' | 'club';

const ROLE_OPTIONS = [
  'Genel Yönetici',
  'Finans Yöneticisi',
  'Gönüllü Yöneticisi',
  'Mini Blog Yöneticisi',
] as const;

const invitationIdFieldByKind: Record<EntityKind, 'ngoId' | 'brandId' | 'clubId'> = {
  ngo: 'ngoId',
  brand: 'brandId',
  club: 'clubId',
};
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
interface AdminRow {
  userId: string;
  name: string;
  avatarUrl?: string;
  role: string;
  since: number;
  invitationId?: string;
  isPrimary: boolean;
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

export function AdminList() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user: authUser } = useUser();

  const { id: activeIdFromCtx, kind: activeKindFromCtx } = useActiveEntity();
  const { data: activeDoc } = useActiveEntityDoc<ManagedEntityDoc>();

  const activeEntity = useMemo<{ kind: EntityKind; data: ManagedEntityDoc } | null>(() => {
    if (!activeIdFromCtx || !activeKindFromCtx || !activeDoc) return null;
    return { kind: activeKindFromCtx, data: activeDoc };
  }, [activeIdFromCtx, activeKindFromCtx, activeDoc]);

  const authUserDocRef = useMemoFirebase(
    () => (firestore && authUser?.uid ? doc(firestore, COLLECTIONS.users, authUser.uid) : null),
    [firestore, authUser?.uid],
  );
  const { data: userData } = useDoc<UserDocData>(authUserDocRef);

  const entityId = activeEntity?.data?.id || null;
  const entityKind = activeEntity?.kind || null;
  const invitationIdField = entityKind ? invitationIdFieldByKind[entityKind] : null;
  const managedIdField = entityKind ? managedIdFieldByKind[entityKind] : null;
  const ownerUserId = activeEntity?.data?.adminUserId || null;

  const isGeneralAdmin = !!authUser?.uid && (
    (ownerUserId !== null && ownerUserId === authUser.uid)
    || userData?.roleTitle === 'Genel Yönetici'
    || userData?.role === 'super-admin'
  );

  const invitationsQuery = useMemoFirebase(
    () => (firestore && entityId && invitationIdField
      ? query(collection(firestore, COLLECTIONS.userInvitations), where(invitationIdField, '==', entityId))
      : null),
    [firestore, entityId, invitationIdField],
  );
  const { data: invitations, isLoading: invitationsLoading } = useCollection<InvitationDoc>(invitationsQuery);

  const managedUsersQuery = useMemoFirebase(
    () => (firestore && entityId && managedIdField
      ? query(collection(firestore, COLLECTIONS.users), where(managedIdField, '==', entityId))
      : null),
    [firestore, entityId, managedIdField],
  );
  const { data: managedUsers, isLoading: managedUsersLoading } = useCollection<UserDocData>(managedUsersQuery);

  const allUsersQuery = useMemoFirebase(
    () => (firestore && entityId ? collection(firestore, COLLECTIONS.users) : null),
    [firestore, entityId],
  );
  const { data: allUsers } = useCollection<UserDocData>(allUsersQuery);

  const isLoading = invitationsLoading || managedUsersLoading;

  const adminRows = useMemo<AdminRow[]>(() => {
    if (!entityId) return [];
    const usersById = new Map<string, UserDocData>((allUsers || []).map(u => [u.id, u]));
    const byUserId = new Map<string, AdminRow>();

    const resolveName = (uid: string | undefined, fallback?: string): string => {
      const u = uid ? usersById.get(uid) : undefined;
      return u?.name || u?.displayName || fallback || 'Üye';
    };

    for (const u of managedUsers || []) {
      byUserId.set(u.id, {
        userId: u.id,
        name: u.name || u.displayName || 'Üye',
        avatarUrl: u.avatarUrl,
        role: u.roleTitle || 'Genel Yönetici',
        since: 0,
        isPrimary: true,
      });
    }

    for (const inv of invitations || []) {
      if (inv.status === 'revoked') continue;
      const uid = inv.inviteeUserId;
      if (!uid) continue;
      const existing = byUserId.get(uid);
      const since = toMillis(inv.invitedAt);
      if (existing) {
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
        role: inv.role || 'Yönetici',
        since,
        invitationId: inv.id,
        isPrimary: false,
      });
    }

    return Array.from(byUserId.values()).sort((a, b) => b.since - a.since);
  }, [entityId, managedUsers, invitations, allUsers]);

  const [revoking, setRevoking] = useState<string | null>(null);
  const [roleEdits, setRoleEdits] = useState<Record<string, string>>({});
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);

  const canManageRow = (row: AdminRow): boolean =>
    isGeneralAdmin
    && row.userId !== ownerUserId
    && row.userId !== authUser?.uid;

  const handleUpdateRole = async (row: AdminRow, newRole: string) => {
    if (!firestore || !entityId || !managedIdField) return;
    if (!canManageRow(row)) return;
    setUpdatingRole(row.userId);
    try {
      if (row.invitationId) {
        await updateDoc(doc(firestore, COLLECTIONS.userInvitations, row.invitationId), { role: newRole });
      }
      await updateDoc(doc(firestore, COLLECTIONS.users, row.userId), { roleTitle: newRole });

      try {
        const entityName = activeEntity?.data?.name || 'Kuruluş';
        await addDoc(collection(firestore, COLLECTIONS.notifications), {
          userId: row.userId,
          type: 'authorization',
          title: 'Yetkilendirildiniz',
          body: `${entityName} için ${newRole} olarak yetkilendirildiniz.`,
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
        title: 'Rol Güncellendi',
        description: `${row.name} kullanıcısının rolü "${newRole}" olarak güncellendi.`,
      });
    } catch (error) {
      const err = error as { code?: string; message?: string };
      toast({
        variant: 'destructive',
        title: 'Rol güncellenemedi',
        description: err?.code === 'permission-denied'
          ? 'Bu işlem için yeterli yetkiniz yok.'
          : (err?.message || 'Beklenmeyen bir hata oluştu.'),
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
      if (row.invitationId) {
        await updateDoc(doc(firestore, COLLECTIONS.userInvitations, row.invitationId), { status: 'revoked' });
      }
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
        title: 'Yetkili Kaldırıldı',
        description: `${row.name} kullanıcısının panel erişimi sonlandırıldı.`,
      });
    } catch (error) {
      const err = error as { code?: string; message?: string };
      toast({
        variant: 'destructive',
        title: 'Yetki kaldırılamadı',
        description: err?.code === 'permission-denied'
          ? 'Bu işlem için yeterli yetkiniz yok.'
          : (err?.message || 'Beklenmeyen bir hata oluştu.'),
      });
    } finally {
      setRevoking(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mevcut Yetkililer</CardTitle>
        <CardDescription className="flex items-center gap-1.5">
          {isGeneralAdmin ? (
            <>
              <ShieldCheck className="h-3.5 w-3.5 text-primary shrink-0" />
              Genel Yönetici olarak diğer yetkililerin rolünü değiştirebilir veya yetkilerini kaldırabilirsiniz.
            </>
          ) : (
            'Kuruluşunuza yetkili kullanıcılar ve rolleri.'
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!authUser ? (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <User className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">Yetkilileri görüntülemek için oturum açın.</p>
          </div>
        ) : !activeEntity ? (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <User className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">Yönettiğiniz bir kuruluş bulunamadı.</p>
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
                            Kuruluş Sahibi
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
                          <SelectTrigger className="h-8 w-auto min-w-[150px] text-xs font-bold" aria-label="Rol seç">
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
                          Güncelle
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
                            aria-label="Yetkiyi kaldır"
                          >
                            {isRowRevoking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Yetkiyi kaldırmak istediğinizden emin misiniz?</AlertDialogTitle>
                            <AlertDialogDescription>
                              <span className="font-bold">{row.name}</span> kullanıcısının {activeEntity.data.name || 'kuruluşunuz'} için panel erişimi sonlandırılacak. Bu işlem geri alınabilir; kullanıcıyı tekrar davet edebilirsiniz.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Vazgeç</AlertDialogCancel>
                            <AlertDialogAction
                              className={cn(buttonVariants({ variant: "destructive" }))}
                              onClick={() => handleRevoke(row)}>
                              Evet, Kaldır
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
                <p className="text-muted-foreground">Kayıtlı yetkili bulunmuyor.</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
