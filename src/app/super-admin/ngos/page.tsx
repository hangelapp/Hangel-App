'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import Link from 'next/link';
import React, { useMemo, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, updateDoc, deleteDoc, query, where, addDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { NgoListItem } from '@/components/shared/ngo-list-item';
import { useNgoRealtimeStats } from '@/hooks/use-ngo-stats';
import {
  Loader2, Trash2, Edit3, Power, PowerOff, UserCog, CheckCircle,
  XCircle, Search, X, ArrowDownUp,
} from 'lucide-react';
import type { NGO } from '@/lib/types';
import { normalizePhone } from '@/lib/messaging/phone';
import { COLLECTIONS } from '@/firebase/collections';

type NgoItem = (NGO & { id: string }) & {
  source: 'ngos' | 'applications';
  status: string;
  __raw?: unknown;
};

interface SimpleNgoUser {
  id: string;
  name?: string;
  displayName?: string;
  avatarUrl?: string;
  phone?: string;
  phoneNumber?: string;
  personalInfo?: { phone?: string; email?: string };
  [key: string]: unknown;
}

interface NgoApplication {
  id: string;
  name?: string;
  shortName?: string;
  sector?: string;
  status?: string;
  [key: string]: unknown;
}

const NGO_ROLE_OPTIONS = [
  'Genel Yönetici',
  'Finans Yöneticisi',
  'Gönüllü Yöneticisi',
  'İçerik Yöneticisi',
  'Proje Yöneticisi',
] as const;
type NgoRole = typeof NGO_ROLE_OPTIONS[number];

interface NgoInvitation {
  id: string;
  ngoId?: string;
  inviteeUserId?: string;
  inviteeName?: string;
  role?: string;
  status?: string;
  invitedAt?: { toDate?: () => Date } | Date | null;
}

const TransferAdminDialog = ({ ngo, allUsers, onAssign, onRevoke, onChangeRole }: {
  ngo: NgoItem;
  allUsers: SimpleNgoUser[] | null;
  onAssign: (ngoId: string, newUserId: string, newUserName: string, role: NgoRole) => Promise<void>;
  onRevoke: (invitationId: string, inviteeName: string) => Promise<void>;
  onChangeRole: (ngoId: string, invitationId: string, userId: string | undefined, newRole: NgoRole, name: string) => Promise<void>;
}) => {
  const db = useFirestore();
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<NgoRole>('Genel Yönetici');
  const [submitting, setSubmitting] = useState(false);
  const [roleEdits, setRoleEdits] = useState<Record<string, NgoRole>>({});
  const [updatingInv, setUpdatingInv] = useState<string | null>(null);

  const isEmailSearch = searchTerm.includes('@');
  const normalizedSearch = isEmailSearch ? searchTerm.trim().toLowerCase() : normalizePhone(searchTerm);

  const matchedUser = useMemo(() => {
    if (!allUsers) return null;
    if (isEmailSearch) {
      if (normalizedSearch.length < 3) return null;
      return allUsers.find(u => {
        const email = (u.personalInfo?.email || (u as { email?: string }).email || '').toLowerCase();
        return email && email.includes(normalizedSearch);
      }) || null;
    }
    if (normalizedSearch.length < 3) return null;
    return allUsers.find(u => {
      const cands = ([u.personalInfo?.phone, u.phoneNumber, u.phone].filter(Boolean) as string[]).map(normalizePhone);
      return cands.some(c => c.endsWith(normalizedSearch) || normalizedSearch.endsWith(c));
    }) || null;
  }, [allUsers, normalizedSearch, isEmailSearch]);

  // Daha önce yetkilendirilenleri listele
  const invitationsQuery = useMemoFirebase(
    () => open ? query(collection(db, COLLECTIONS.userInvitations), where('ngoId', '==', ngo.id)) : null,
    [db, ngo.id, open],
  );
  const { data: invitations } = useCollection<NgoInvitation>(invitationsQuery);

  const activeInvitations = useMemo(
    () => (invitations || []).filter(i => i.status !== 'revoked'),
    [invitations],
  );

  const handleAssign = async () => {
    if (!matchedUser) return;
    setSubmitting(true);
    try {
      await onAssign(ngo.id, matchedUser.id, matchedUser.name || matchedUser.displayName || 'Üye', selectedRole);
      setOpen(false);
      setSearchTerm('');
      setSelectedRole('Genel Yönetici');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (raw: NgoInvitation['invitedAt']): string => {
    if (!raw) return '';
    try {
      let d: Date | null = null;
      if (raw instanceof Date) d = raw;
      else if (typeof (raw as { toDate?: () => Date }).toDate === 'function') d = (raw as { toDate: () => Date }).toDate();
      if (!d) return '';
      return d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch { return ''; }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="rounded-xl font-bold h-10 px-4">
          <UserCog className="mr-2 h-4 w-4" /> Yetkili
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-2xl sm:max-w-[560px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-bold">Yetkili Kişi Yönetimi</DialogTitle>
          <DialogDescription>
            <strong>{ngo.name}</strong> için telefon veya e-posta ile kullanıcı bulup rol atayın.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Daha önce yetkilendirilenler */}
          {activeInvitations.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Mevcut Yetkililer</p>
              <div className="space-y-1.5 rounded-2xl border border-black/5 bg-muted/20 p-2">
                {activeInvitations.map(inv => {
                  const userInfo = (allUsers || []).find(u => u.id === inv.inviteeUserId);
                  const displayName = inv.inviteeName || userInfo?.name || userInfo?.displayName || 'Üye';
                  const currentRole = (inv.role || 'Yönetici') as NgoRole;
                  const editedRole = roleEdits[inv.id] ?? currentRole;
                  const isKnownRole = (NGO_ROLE_OPTIONS as readonly string[]).includes(editedRole);
                  const isUpdatingThis = updatingInv === inv.id;
                  return (
                    <div key={inv.id} className="flex items-center gap-2 p-2 rounded-xl bg-white flex-wrap">
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarImage src={userInfo?.avatarUrl} />
                        <AvatarFallback className="text-xs font-bold">{displayName.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-[140px]">
                        <p className="font-bold text-sm truncate">{displayName}</p>
                        {inv.invitedAt && (
                          <span className="text-[10px] text-muted-foreground">{formatDate(inv.invitedAt)}</span>
                        )}
                      </div>
                      <Select
                        value={isKnownRole ? editedRole : undefined}
                        onValueChange={(v) => setRoleEdits(prev => ({ ...prev, [inv.id]: v as NgoRole }))}>
                        <SelectTrigger className="h-8 w-auto min-w-[150px] text-xs font-bold rounded-lg" aria-label="Rol değiştir">
                          <SelectValue placeholder={currentRole} />
                        </SelectTrigger>
                        <SelectContent>
                          {NGO_ROLE_OPTIONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-2.5 text-xs font-bold rounded-lg"
                        disabled={isUpdatingThis || editedRole === currentRole}
                        onClick={async () => {
                          setUpdatingInv(inv.id);
                          try {
                            await onChangeRole(ngo.id, inv.id, inv.inviteeUserId, editedRole, displayName);
                            setRoleEdits(prev => { const n = { ...prev }; delete n[inv.id]; return n; });
                          } finally { setUpdatingInv(null); }
                        }}>
                        {isUpdatingThis ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : null}
                        Güncelle
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:bg-destructive/10 rounded-lg shrink-0"
                        aria-label="Yetkiyi Kaldır"
                        onClick={() => onRevoke(inv.id, displayName)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label>Telefon veya E-posta</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="5XX XXX XX XX veya ornek@mail.com"
                className="pl-10 rounded-xl"
                autoFocus
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {isEmailSearch ? 'E-posta ile aranıyor.' : 'Telefonla aranıyor. E-posta için "@" karakteri içeren değer girin.'}
            </p>
          </div>

          <div className="space-y-2">
            <Label>Rol</Label>
            <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as NgoRole)}>
              <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                {NGO_ROLE_OPTIONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {normalizedSearch.length >= 3 && matchedUser && (
            <div className="flex items-center gap-3 p-3 border-2 border-green-500/30 bg-green-500/5 rounded-2xl">
              <Avatar className="h-10 w-10">
                <AvatarImage src={matchedUser.avatarUrl} />
                <AvatarFallback>{(matchedUser.name || 'U').charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-sm">{matchedUser.name || matchedUser.displayName || 'Üye'}</p>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {matchedUser.personalInfo?.email || ''}
                </p>
              </div>
            </div>
          )}

          {normalizedSearch.length >= 3 && !matchedUser && (
            <div className="flex items-center gap-2 p-3 border border-destructive/30 bg-destructive/5 rounded-2xl text-sm text-destructive">
              <XCircle className="h-4 w-4" />
              <span>{isEmailSearch ? 'Bu e-posta ile kayıtlı üye bulunamadı.' : 'Bu telefon numarasıyla kayıtlı üye bulunamadı.'}</span>
            </div>
          )}

          <p className="text-xs text-muted-foreground leading-relaxed">
            Atanan kullanıcı seçili rol ile yetkilendirilir ve bu STK için NGO yönetim panelini kullanabilir.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" className="rounded-xl font-bold" onClick={() => setOpen(false)}>İptal</Button>
          <Button className="rounded-xl font-bold" disabled={!matchedUser || submitting} onClick={handleAssign}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Yetki Ata
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default function NgosPage() {
  const { toast } = useToast();
  const db = useFirestore();
  const _router = useRouter();
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'pending' | 'passive' | 'rejected'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'Dernek' | 'Vakıf' | 'Spor Kulübü' | 'Özel İzinli'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'nameAsc'>('newest');

  const ngosQuery = useMemoFirebase(() => collection(db, COLLECTIONS.ngos), [db]);
  const { data: rawNgos, isLoading: ngosLoading } = useCollection<NGO>(ngosQuery);
  const { enrich: enrichNgoStats } = useNgoRealtimeStats();
  const ngos = useMemo(() => enrichNgoStats(rawNgos), [enrichNgoStats, rawNgos]);

  const applicationsQuery = useMemoFirebase(() =>
    query(collection(db, COLLECTIONS.applications), where('entityType', '==', 'NGO')),
    [db],
  );
  const { data: applications, isLoading: appsLoading } = useCollection<NgoApplication>(applicationsQuery);

  const usersQuery = useMemoFirebase(() => collection(db, COLLECTIONS.users), [db]);
  const { data: allUsers } = useCollection<SimpleNgoUser>(usersQuery);

  const items = useMemo<NgoItem[]>(() => {
    const list: NgoItem[] = [];

    (ngos || []).forEach((n) => {
      const ngoWithStatus = n as NGO & { id: string; status?: string };
      list.push({
        ...ngoWithStatus,
        id: ngoWithStatus.id,
        source: 'ngos',
        status: ngoWithStatus.status || 'Aktif',
      });
    });

    (applications || []).forEach((app) => {
      if (app.status === 'Onaylandı') return; // ngos koleksiyonunda zaten var
      const appWithExtras = app as NgoApplication & { orgSubType?: string };
      list.push({
        id: app.id,
        name: app.name || 'İsimsiz',
        slug: app.name?.toLowerCase().replace(/\s+/g, '-') || '',
        avatarUrl: '',
        coverPhotoUrl: '',
        type: appWithExtras.orgSubType || 'Dernek',
        category: app.sector || '',
        transparencyScore: 0,
        source: 'applications',
        status: app.status || 'Beklemede',
        __raw: app,
      } as unknown as NgoItem);
    });

    return list;
  }, [ngos, applications]);

  const filteredItems = useMemo(() => {
    let list = items;

    if (statusFilter === 'approved') list = list.filter(i => i.source === 'ngos' && i.status === 'Aktif');
    else if (statusFilter === 'pending') list = list.filter(i => i.status === 'Beklemede');
    else if (statusFilter === 'passive') list = list.filter(i => i.source === 'ngos' && i.status === 'Pasif');
    else if (statusFilter === 'rejected') list = list.filter(i => i.status === 'Reddedildi');

    if (typeFilter !== 'all') list = list.filter(i => i.type === typeFilter);

    const lower = searchTerm.trim().toLowerCase();
    if (lower) {
      list = list.filter(i =>
        (i.name || '').toLowerCase().includes(lower) ||
        (i.category || '').toLowerCase().includes(lower),
      );
    }

    const joinTs = (i: NgoItem): number => {
      const t = Date.parse((i as NgoItem & { joinDate?: string }).joinDate || '');
      return Number.isNaN(t) ? 0 : t;
    };

    const sorted = [...list];
    if (sortBy === 'nameAsc') {
      sorted.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'tr'));
    } else {
      sorted.sort((a, b) => joinTs(b) - joinTs(a));
    }
    return sorted;
  }, [items, statusFilter, typeFilter, searchTerm, sortBy]);

  const stats = useMemo(() => {
    const approved = (ngos || []).filter((n) => ((n as NGO & { status?: string }).status || 'Aktif') === 'Aktif').length;
    const passive = (ngos || []).filter((n) => (n as NGO & { status?: string }).status === 'Pasif').length;
    const pending = (applications || []).filter((a) => a.status === 'Beklemede').length;
    const rejected = (applications || []).filter((a) => a.status === 'Reddedildi').length;
    return { total: approved + passive + pending + rejected, approved, pending, passive, rejected };
  }, [ngos, applications]);

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const isPassive = currentStatus === 'Pasif';
    try {
      await updateDoc(doc(db, COLLECTIONS.ngos, id), { status: isPassive ? 'Aktif' : 'Pasif' });
      toast({
        title: isPassive ? 'Kuruluş Aktifleştirildi' : 'Kuruluş Pasife Alındı',
        description: isPassive
          ? 'STK platformdaki tüm listelerde tekrar görünür olacak.'
          : 'STK artık platformdaki public listelerde görünmeyecek.',
      });
    } catch (e) {
      const code = (e as { code?: string } | null)?.code;
      const message = e instanceof Error ? e.message : 'Beklenmeyen bir hata oluştu.';
      toast({
        variant: 'destructive',
        title: 'Durum güncellenemedi',
        description: code === 'permission-denied'
          ? 'Bu işlem için super-admin yetkisi gerekli.'
          : message,
      });
    }
  };

  const handleRemove = async (id: string, name: string) => {
    try {
      await deleteDoc(doc(db, COLLECTIONS.ngos, id));
      toast({
        variant: 'destructive',
        title: 'Kuruluş Kaldırıldı',
        description: `${name} platformdan kalıcı olarak silindi.`,
      });
    } catch (e) {
      const code = (e as { code?: string } | null)?.code;
      const message = e instanceof Error ? e.message : 'Beklenmeyen bir hata oluştu.';
      toast({
        variant: 'destructive',
        title: 'Silme başarısız',
        description: code === 'permission-denied'
          ? 'Bu işlem için super-admin yetkisi gerekli.'
          : message,
      });
    }
  };

  const handleAssignAdmin = async (ngoId: string, newUserId: string, newUserName: string, role: NgoRole) => {
    try {
      // 1. NGO doc'una yetkili kullanıcıyı işaretle (yalnızca Genel Yönetici ana yetkili olarak kaydedilir)
      if (role === 'Genel Yönetici') {
        await updateDoc(doc(db, COLLECTIONS.ngos, ngoId), { adminUserId: newUserId });
      }

      // 2. Kullanıcıya ngo-admin rolü ver + bağlı STK ID'sini sakla
      //    AMA super-admin'ler için role'u DEĞİŞTİRME (yetkisini kaybetmesin)
      const userSnap = await getDoc(doc(db, COLLECTIONS.users, newUserId));
      const currentRole = userSnap.exists() ? (userSnap.data() as { role?: string }).role : null;
      const updatePayload: Record<string, unknown> = { managedNgoId: ngoId, ngoRoleTitle: role };
      if (currentRole !== 'super-admin') {
        updatePayload.role = 'ngo-admin';
      }
      await updateDoc(doc(db, COLLECTIONS.users, newUserId), updatePayload);

      // 3. Davet kaydı (audit + bildirim için)
      await addDoc(collection(db, COLLECTIONS.userInvitations), {
        ngoId,
        inviteeUserId: newUserId,
        inviteeName: newUserName,
        role,
        status: 'accepted',
        invitedBy: 'super-admin',
        invitedAt: serverTimestamp(),
        autoAcceptedBy: 'super-admin',
      });

      toast({
        title: 'Yetkili Atandı',
        description: `${newUserName} bu STK için "${role}" olarak yetkilendirildi.`,
      });
    } catch (e) {
      console.error('Admin transfer failed:', e);
      const code = (e as { code?: string } | null)?.code;
      const message = e instanceof Error ? e.message : 'Beklenmeyen bir hata oluştu.';
      toast({
        variant: 'destructive',
        title: 'Yetki ataması başarısız',
        description: code === 'permission-denied'
          ? 'Bu işlem için super-admin yetkisi gerekli.'
          : message,
      });
    }
  };

  const handleChangeAdminRole = async (
    ngoId: string,
    invitationId: string,
    userId: string | undefined,
    newRole: NgoRole,
    inviteeName: string,
  ) => {
    try {
      await updateDoc(doc(db, COLLECTIONS.userInvitations, invitationId), {
        role: newRole,
        roleChangedAt: serverTimestamp(),
        roleChangedBy: 'super-admin',
      });
      if (userId) {
        const patch: Record<string, unknown> = { ngoRoleTitle: newRole, roleTitle: newRole };
        if (newRole === 'Genel Yönetici') {
          await updateDoc(doc(db, COLLECTIONS.ngos, ngoId), { adminUserId: userId });
        }
        await updateDoc(doc(db, COLLECTIONS.users, userId), patch);

        try {
          const ngoSnap = await getDoc(doc(db, COLLECTIONS.ngos, ngoId));
          const ngoName = ngoSnap.exists() ? ((ngoSnap.data() as { name?: string }).name || 'STK') : 'STK';
          await addDoc(collection(db, COLLECTIONS.notifications), {
            userId,
            type: 'authorization',
            title: 'Rolünüz Güncellendi',
            body: `${ngoName} için rolünüz "${newRole}" olarak güncellendi.`,
            data: { entityId: ngoId, entityType: 'ngo', role: newRole },
            read: false,
            createdAt: serverTimestamp(),
            createdBy: 'super-admin',
          });
        } catch { /* bildirim zorunlu değil */ }
      }
      toast({
        title: 'Rol Güncellendi',
        description: `${inviteeName} kullanıcısının rolü "${newRole}" olarak güncellendi.`,
      });
    } catch (e) {
      console.error('Change role failed:', e);
      const code = (e as { code?: string } | null)?.code;
      const message = e instanceof Error ? e.message : 'Beklenmeyen bir hata oluştu.';
      toast({
        variant: 'destructive',
        title: 'Rol güncellenemedi',
        description: code === 'permission-denied'
          ? 'Bu işlem için super-admin yetkisi gerekli.'
          : message,
      });
    }
  };

  const handleRevokeAdmin = async (invitationId: string, inviteeName: string) => {
    try {
      await updateDoc(doc(db, COLLECTIONS.userInvitations, invitationId), {
        status: 'revoked',
        revokedAt: serverTimestamp(),
        revokedBy: 'super-admin',
      });
      toast({
        title: 'Yetki Kaldırıldı',
        description: `${inviteeName} için yetkilendirme iptal edildi.`,
      });
    } catch (e) {
      console.error('Revoke failed:', e);
      const code = (e as { code?: string } | null)?.code;
      const message = e instanceof Error ? e.message : 'Beklenmeyen bir hata oluştu.';
      toast({
        variant: 'destructive',
        title: 'Yetki kaldırılamadı',
        description: code === 'permission-denied'
          ? 'Bu işlem için super-admin yetkisi gerekli.'
          : message,
      });
    }
  };

  if (ngosLoading || appsLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">STK Listesi Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in-0">
      <div className="space-y-1">
        <h1 className="text-3xl font-black tracking-tighter text-[#1d1d1f]">STK Yönetimi</h1>
        <p className="text-muted-foreground text-sm font-medium">
          Yayında olan ve başvuru sürecindeki tüm STK'ları görüntüleyin, yönetin, yetkili kişi atayın.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="rounded-2xl cursor-pointer hover:shadow-md transition" onClick={() => setStatusFilter('all')}>
          <CardContent className="p-4">
            <p className="text-2xl font-black">{stats.total}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">Tümü</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-green-500/30 cursor-pointer hover:shadow-md transition" onClick={() => setStatusFilter('approved')}>
          <CardContent className="p-4">
            <p className="text-2xl font-black text-green-600">{stats.approved}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">Yayında</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-amber-500/30 cursor-pointer hover:shadow-md transition" onClick={() => setStatusFilter('pending')}>
          <CardContent className="p-4">
            <p className="text-2xl font-black text-amber-600">{stats.pending}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">Onay Bekliyor</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl cursor-pointer hover:shadow-md transition" onClick={() => setStatusFilter('passive')}>
          <CardContent className="p-4">
            <p className="text-2xl font-black text-muted-foreground">{stats.passive}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">Pasif</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-destructive/30 cursor-pointer hover:shadow-md transition" onClick={() => setStatusFilter('rejected')}>
          <CardContent className="p-4">
            <p className="text-2xl font-black text-destructive">{stats.rejected}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">Reddedildi</p>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl border-black/5">
        <CardContent className="p-4 flex items-center gap-3 flex-wrap">
          <Label className="text-sm font-semibold">Durum:</Label>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as 'all' | 'approved' | 'pending' | 'passive' | 'rejected')}>
            <SelectTrigger className="h-9 w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tümü</SelectItem>
              <SelectItem value="approved">Yayında (Aktif)</SelectItem>
              <SelectItem value="pending">Onay Bekleyen</SelectItem>
              <SelectItem value="passive">Pasif</SelectItem>
              <SelectItem value="rejected">Reddedildi</SelectItem>
            </SelectContent>
          </Select>
          <Label className="text-sm font-semibold">Tür:</Label>
          <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as 'all' | 'Dernek' | 'Vakıf' | 'Spor Kulübü' | 'Özel İzinli')}>
            <SelectTrigger className="h-9 w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tümü</SelectItem>
              <SelectItem value="Dernek">Dernek</SelectItem>
              <SelectItem value="Vakıf">Vakıf</SelectItem>
              <SelectItem value="Spor Kulübü">Spor Kulübü</SelectItem>
              <SelectItem value="Özel İzinli">Özel İzinli</SelectItem>
            </SelectContent>
          </Select>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Kuruluş adı veya kategori..."
              className="pl-9 h-9 rounded-xl"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-9 w-9 shrink-0 rounded-xl" aria-label="Sırala">
                <ArrowDownUp className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setSortBy('nameAsc')} className={sortBy === 'nameAsc' ? 'font-bold text-primary' : ''}>Ada göre (A-Z)</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('newest')} className={sortBy === 'newest' ? 'font-bold text-primary' : ''}>En yeni</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <p className="text-xs text-muted-foreground ml-auto"><strong>{filteredItems.length}</strong> kuruluş gösteriliyor</p>
        </CardContent>
      </Card>

      <Card className="rounded-[2rem] border-black/5 shadow-xl overflow-hidden">
        <CardHeader className="bg-muted/30 border-b p-6">
          <CardTitle className="text-xl font-bold">Kuruluş Listesi</CardTitle>
          <CardDescription>Yayında olan ve başvuru sürecindeki STK'lar.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y border-black/5">
            {filteredItems.length > 0 ? filteredItems.map(ngo => {
              const isPassive = ngo.status === 'Pasif';
              const isPending = ngo.status === 'Beklemede';
              const isRejected = ngo.status === 'Reddedildi';
              const isApproved = ngo.source === 'ngos' && ngo.status === 'Aktif';
              const statusBadge = isApproved ? <Badge className="bg-green-600 text-white text-[9px] font-black uppercase">YAYINDA</Badge>
                : isPending ? <Badge className="bg-amber-500 text-white text-[9px] font-black uppercase">ONAY BEKLİYOR</Badge>
                : isPassive ? <Badge variant="secondary" className="text-[9px] font-black uppercase">PASİF</Badge>
                : isRejected ? <Badge variant="destructive" className="text-[9px] font-black uppercase">REDDEDİLDİ</Badge>
                : null;
              return (
                <div key={ngo.id} className={cn('p-3 space-y-3', (isPassive || isRejected) && 'opacity-60')}>
                  {/* Standart STK kartı + status badge sağ üstte */}
                  <NgoListItem
                    ngo={ngo as unknown as Parameters<typeof NgoListItem>[0]['ngo']}
                    href={null}
                    rightSlot={statusBadge}
                  />
                  {/* Aksiyon butonları — kartın altında */}
                  <div className="flex items-center gap-2 flex-wrap pl-2" onClick={e => e.stopPropagation()}>
                    {ngo.source === 'ngos' && (
                      <>
                        <Button variant="outline" size="sm" className="rounded-xl font-bold h-9 px-3" asChild>
                          <Link href={`/ngos/${ngo.id}`}>Profili Gör</Link>
                        </Button>
                        <Button variant="outline" size="sm" className="rounded-xl font-bold h-9 px-3" asChild>
                          <Link href={`/super-admin/ngos/${ngo.id}/edit`}><Edit3 className="mr-1.5 h-3.5 w-3.5" />Düzelt</Link>
                        </Button>
                        <TransferAdminDialog ngo={ngo} allUsers={allUsers || null} onAssign={handleAssignAdmin} onRevoke={handleRevokeAdmin} onChangeRole={handleChangeAdminRole} />
                        <Button variant="outline" size="sm" className="rounded-xl font-bold h-9 px-3"
                                onClick={() => handleToggleStatus(ngo.id, ngo.status)}>
                          {isPassive ? <><Power className="mr-1.5 h-3.5 w-3.5" /> Aktif</> : <><PowerOff className="mr-1.5 h-3.5 w-3.5" /> Pasife</>}
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive hover:bg-destructive/10 rounded-xl" aria-label="Sil">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="rounded-[2rem]">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-xl font-bold">{ngo.name} kuruluşunu silmek istiyor musunuz?</AlertDialogTitle>
                              <AlertDialogDescription className="text-base font-medium">
                                Bu işlem geri alınamaz. Kuruluş ve ilişkili tüm veriler platformdan kalıcı olarak silinecektir.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="gap-2">
                              <AlertDialogCancel className="rounded-xl font-bold">Vazgeç</AlertDialogCancel>
                              <AlertDialogAction
                                className={cn(buttonVariants({ variant: 'destructive' }), 'rounded-xl font-bold')}
                                onClick={() => handleRemove(ngo.id, ngo.name)}>
                                Evet, Kalıcı Olarak Sil
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </>
                    )}
                    {ngo.source === 'applications' && (
                      <Button variant="outline" size="sm" className="rounded-xl font-bold h-9 px-3" asChild>
                        <Link href="/super-admin/applications">Başvuru Yönetimine Git</Link>
                      </Button>
                    )}
                  </div>
                </div>
              );
            }) : (
              <div className="p-16 text-center text-muted-foreground italic">Bu filtreyle eşleşen kuruluş bulunmuyor.</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
