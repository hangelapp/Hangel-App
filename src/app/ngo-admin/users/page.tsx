'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { User, Plus, Trash2, ArrowLeft, Loader2, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useUser } from '@/firebase';
import { useActiveEntity, useActiveEntityDoc } from '@/app/ngo-admin/active-entity-context';
import { useTranslation } from '@/components/providers/language-provider';
import { ORG_ROLE_OPTIONS as ROLE_OPTIONS } from '@/lib/ngo-admin/roles';

interface ManagedEntityDoc {
  id: string;
  name?: string;
  shortName?: string;
  adminUserId?: string;
}

// Server route'tan gelen yetkili satırı (Admin SDK — rules'tan bağımsız).
interface AdminRow {
  userId: string;
  name: string;
  avatarUrl?: string | null;
  role: string;
  since: number; // epoch ms; 0 = bilinmiyor
  invitationId?: string;
  isPrimary: boolean;
  isOwner: boolean;
}

interface ViewerInfo {
  uid: string;
  isGeneral: boolean;
  isSuperAdmin?: boolean;
  ownerUserId: string | null;
  orgName?: string;
}

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
  const { user: authUser } = useUser();
  const { t } = useTranslation();

  // Aktif kuruluş (banner ile aynı kaynak) — yalnız başlık/isim ve gating için.
  const { id: activeId, kind: activeKind } = useActiveEntity();
  const { data: activeDoc } = useActiveEntityDoc<ManagedEntityDoc>();
  const activeEntity = useMemo(
    () => (activeId && activeKind && activeDoc ? { kind: activeKind, data: activeDoc } : null),
    [activeId, activeKind, activeDoc],
  );

  const [adminRows, setAdminRows] = useState<AdminRow[]>([]);
  const [viewer, setViewer] = useState<ViewerInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);
  const [roleEdits, setRoleEdits] = useState<Record<string, string>>({});

  // Yetkilileri Admin SDK route'undan çek (Genel Yönetici de güvenle görür).
  const fetchManagers = useCallback(async () => {
    if (!authUser) { setIsLoading(false); return; }
    setIsLoading(true);
    try {
      const token = await authUser.getIdToken();
      // Aktif kuruluşu gönder — çoklu kurum yöneten kullanıcıda doğru liste gelsin.
      const params = new URLSearchParams();
      if (activeId && activeKind) { params.set('orgId', activeId); params.set('kind', activeKind); }
      const qs = params.toString();
      const res = await fetch(`/api/ngo-admin/users/managers${qs ? `?${qs}` : ''}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error(`list ${res.status}`);
      const data = (await res.json()) as { managers?: AdminRow[]; viewer?: ViewerInfo };
      setAdminRows(Array.isArray(data.managers) ? data.managers : []);
      setViewer(data.viewer ?? null);
    } catch (e) {
      console.error('Yöneticiler yüklenemedi:', e);
      setAdminRows([]);
      setViewer(null);
    } finally {
      setIsLoading(false);
    }
  }, [authUser, activeId, activeKind]);

  useEffect(() => { void fetchManagers(); }, [fetchManagers]);

  const isGeneralAdmin = !!viewer?.isGeneral;
  const ownerUserId = viewer?.ownerUserId ?? null;
  const orgName = viewer?.orgName || activeEntity?.data?.name || t('ngo_admin_users.revokeConfirmEntityFallback');

  // Super-admin HERKESİ yönetir (sahip + kendisi dahil). Normal Genel Yönetici'de
  // sahip ve kendi satırı korunur (super-admin / org-panel ayrımı).
  const isSuperAdmin = !!viewer?.isSuperAdmin;
  const canManageRow = (row: AdminRow): boolean =>
    isGeneralAdmin && (isSuperAdmin || (!row.isOwner && row.userId !== authUser?.uid));

  const callRoute = async (path: string, payload: Record<string, unknown>) => {
    if (!authUser) throw new Error('Oturum bulunamadı.');
    const token = await authUser.getIdToken();
    const res = await fetch(path, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error((data as { message?: string })?.message || `Hata (${res.status})`);
    return data;
  };

  const handleUpdateRole = async (row: AdminRow, newRole: string) => {
    if (!canManageRow(row)) return;
    setUpdatingRole(row.userId);
    try {
      await callRoute('/api/ngo-admin/users/set-role', { targetUserId: row.userId, role: newRole, orgId: activeId, kind: activeKind });
      setRoleEdits(prev => { const next = { ...prev }; delete next[row.userId]; return next; });
      toast({
        title: t('ngo_admin_users.toastRoleUpdatedTitle'),
        description: `${row.name} ${t('ngo_admin_users.toastRoleUpdatedDescPrefix')} "${newRole}" ${t('ngo_admin_users.toastRoleUpdatedDescSuffix')}`,
      });
      await fetchManagers();
    } catch (error) {
      const message = error instanceof Error ? error.message : t('ngo_admin_users.toastUnexpected');
      toast({ variant: 'destructive', title: t('ngo_admin_users.toastRoleFailedTitle'), description: message });
    } finally {
      setUpdatingRole(null);
    }
  };

  const handleRevoke = async (row: AdminRow) => {
    if (!canManageRow(row)) return;
    setRevoking(row.userId);
    try {
      await callRoute('/api/ngo-admin/users/remove', { targetUserId: row.userId, orgId: activeId, kind: activeKind });
      toast({
        variant: 'destructive',
        title: t('ngo_admin_users.toastRevokedTitle'),
        description: `${row.name} ${t('ngo_admin_users.toastRevokedDescSuffix')}`,
      });
      await fetchManagers();
    } catch (error) {
      const message = error instanceof Error ? error.message : t('ngo_admin_users.toastUnexpected');
      toast({ variant: 'destructive', title: t('ngo_admin_users.toastRevokeFailedTitle'), description: message });
    } finally {
      setRevoking(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in-0 p-3 sm:p-4 md:p-6">
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
                <div className="text-center py-12 border-2 border-dashed border-border rounded-2xl">
                    <User className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-muted-foreground">{t('ngo_admin_users.authRequired')}</p>
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
                    const isOwnerRow = row.isOwner || row.userId === ownerUserId;
                    const editedRole = roleEdits[row.userId] ?? row.role;
                    const isKnownRole = (ROLE_OPTIONS as readonly string[]).includes(editedRole);
                    return (
                    <div key={row.userId} className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 p-3 border border-border rounded-2xl hover:bg-accent/50 transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                            <Avatar className="h-9 w-9 border">
                                <AvatarImage src={row.avatarUrl || undefined} alt={row.name} />
                                <AvatarFallback className="text-xs font-bold">{(row.name || '?').charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    <p className="font-medium truncate">{row.name}</p>
                                    {isOwnerRow && (
                                        <Badge variant="outline" className="text-xs font-bold px-2 py-0 bg-amber-100 text-amber-800 border-amber-300/50 dark:bg-amber-900/40 dark:text-amber-300">
                                            {t('ngo_admin_users.ownerBadge')}
                                        </Badge>
                                    )}
                                </div>
                                {since && <p className="text-xs text-muted-foreground">{since}</p>}
                            </div>
                        </div>
                        <div className="flex items-center justify-end gap-2 shrink-0">
                            {manageable ? (
                                <div className="flex items-center gap-1.5 min-w-0">
                                    <Select
                                        value={isKnownRole ? editedRole : undefined}
                                        onValueChange={(v) => setRoleEdits(prev => ({ ...prev, [row.userId]: v }))}>
                                        <SelectTrigger className="h-11 w-auto max-w-[120px] sm:max-w-none sm:min-w-[150px] text-xs font-bold" aria-label={t('ngo_admin_users.selectRoleAria')}>
                                            <SelectValue placeholder={row.role} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {ROLE_OPTIONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-11 px-2.5 text-xs font-bold"
                                        disabled={isRowUpdating || editedRole === row.role}
                                        onClick={() => { void handleUpdateRole(row, editedRole); }}>
                                        {isRowUpdating && <Loader2 className="mr-1 h-3 w-3 animate-spin" />}
                                        {t('ngo_admin_users.updateBtn')}
                                    </Button>
                                </div>
                            ) : (
                                <Badge variant="outline" className={cn("text-xs font-bold px-2 py-0 whitespace-nowrap", row.isPrimary && "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 border-purple-300/50")}>
                                    {row.role}
                                </Badge>
                            )}
                            {manageable && (
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-11 w-11 text-muted-foreground hover:text-destructive"
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
                                                <span className="font-bold">{row.name}</span> {t('ngo_admin_users.revokeConfirmDescPrefix')} {orgName} {t('ngo_admin_users.revokeConfirmDescSuffix')}
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
                    <div className="text-center py-12 border-2 border-dashed border-border rounded-2xl">
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
