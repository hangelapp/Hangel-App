'use client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, ShieldAlert, Loader2, Trash2, Pencil, Eye, Mail, Phone, MapPin, Cake, Globe } from 'lucide-react';
import React, { useState, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import type { User } from '@/lib/types';

type UserRow = User & { id: string; status?: string };

const roleLabel: Record<string, string> = {
  'super-admin': 'SÜPER ADMİN',
  'ngo-admin': 'YÖNETİCİ',
  'user': 'KULLANICI',
};

// View (read-only) dialog
const ProfileViewDialog = ({ user, open, onOpenChange }: { user: UserRow | null; open: boolean; onOpenChange: (o: boolean) => void; }) => {
  if (!user) return null;
  const pi = (user.personalInfo || {}) as Partial<{
    email: string;
    phone: string;
    birthDate: string;
    gender: string;
    nationality: string;
    bloodType: string;
    website: string;
    address: Record<string, string | undefined>;
  }>;
  const addr = (pi.address || {}) as Record<string, string | undefined>;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-[2rem] max-w-lg">
        <DialogHeader className="space-y-3">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-white shadow">
              <AvatarImage src={user.avatarUrl} />
              <AvatarFallback className="text-xl font-black">{(user.name || '?').charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <DialogTitle>{user.name || 'İsimsiz'}</DialogTitle>
              <div className="flex items-center gap-2">
                <Badge variant={user.role === 'super-admin' ? 'default' : user.role === 'ngo-admin' ? 'secondary' : 'outline'} className="text-[9px] uppercase tracking-widest">
                  {roleLabel[user.role || 'user']}
                </Badge>
                {user.username && <span className="text-xs text-muted-foreground">{user.username}</span>}
              </div>
            </div>
          </div>
          <DialogDescription className="text-xs">UID: <code className="text-[10px] bg-muted px-1.5 py-0.5 rounded">{user.id}</code></DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-4 max-h-[60vh] overflow-y-auto">
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">İletişim</p>
            {pi.email && <div className="flex items-center gap-2 text-sm"><Mail className="h-4 w-4 text-muted-foreground" /> {pi.email}</div>}
            {pi.phone && <div className="flex items-center gap-2 text-sm"><Phone className="h-4 w-4 text-muted-foreground" /> {pi.phone}</div>}
            {pi.website && <div className="flex items-center gap-2 text-sm"><Globe className="h-4 w-4 text-muted-foreground" /> <a href={pi.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{pi.website}</a></div>}
          </div>
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Demografi</p>
            {pi.birthDate && <div className="flex items-center gap-2 text-sm"><Cake className="h-4 w-4 text-muted-foreground" /> {pi.birthDate}</div>}
            {pi.gender && <div className="flex items-center gap-2 text-sm"><span className="text-xs text-muted-foreground">Cinsiyet:</span> {pi.gender}</div>}
            {pi.bloodType && <div className="flex items-center gap-2 text-sm"><span className="text-xs text-muted-foreground">Kan Grubu:</span> {pi.bloodType}</div>}
            {pi.nationality && <div className="flex items-center gap-2 text-sm"><span className="text-xs text-muted-foreground">Uyruk:</span> {pi.nationality}</div>}
          </div>
          {(addr.country || addr.city || addr.district) && (
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Adres</p>
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  {[addr.neighborhood, addr.district, addr.city, addr.country].filter(Boolean).join(', ')}
                </div>
              </div>
            </div>
          )}
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">İstatistikler</p>
            <div className="grid grid-cols-3 gap-2">
              <div className="p-3 bg-muted/40 rounded-lg text-center">
                <p className="text-lg font-black">{user.impactScore?.toLocaleString('tr-TR') || 0}</p>
                <p className="text-[9px] uppercase tracking-widest text-muted-foreground mt-0.5">Etki Puanı</p>
              </div>
              <div className="p-3 bg-muted/40 rounded-lg text-center">
                <p className="text-lg font-black">{((user as UserRow & { inviteCount?: number }).inviteCount) || 0}</p>
                <p className="text-[9px] uppercase tracking-widest text-muted-foreground mt-0.5">Davet</p>
              </div>
              <div className="p-3 bg-muted/40 rounded-lg text-center">
                <p className="text-lg font-black">{Array.isArray(user.supportedNgos) ? user.supportedNgos.length : 0}</p>
                <p className="text-[9px] uppercase tracking-widest text-muted-foreground mt-0.5">Destek</p>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Kapat</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Edit dialog (name, email, phone, username, role)
const EditUserDialog = ({ user, open, onOpenChange, onSave }: {
  user: UserRow | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSave: (id: string, patch: Record<string, unknown>) => Promise<void>;
}) => {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'user' | 'ngo-admin' | 'super-admin'>('user');
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    if (user) {
       
      setName(user.name || '');
      setUsername(user.username || '');
      setEmail(user.personalInfo?.email || '');
      setPhone(user.personalInfo?.phone || '');
      setRole((user.role as 'user' | 'ngo-admin' | 'super-admin') || 'user');
    }
  }, [user]);

  if (!user) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(user.id, {
        name: name.trim(),
        username: username.trim(),
        role,
        personalInfo: {
          ...(user.personalInfo || {}),
          email: email.trim(),
          phone: phone.trim(),
        },
      });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-[2rem] max-w-lg">
        <DialogHeader>
          <DialogTitle>Kullanıcı Bilgilerini Düzenle</DialogTitle>
          <DialogDescription>{user.name} kullanıcısının bilgilerini ve yetki seviyesini güncelleyin.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2 max-h-[60vh] overflow-y-auto">
          <div className="space-y-2">
            <Label>Ad Soyad</Label>
            <Input value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Kullanıcı Adı</Label>
            <Input value={username} onChange={e => setUsername(e.target.value)} placeholder="@kullaniciadi" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>E-posta</Label>
              <Input type="email" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Telefon</Label>
              <Input type="tel" value={phone} onChange={e => setPhone(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Platform Yetkisi</Label>
            <Select value={role} onValueChange={(v) => setRole(v as 'user' | 'ngo-admin' | 'super-admin')}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="user">Standart Kullanıcı</SelectItem>
                <SelectItem value="ngo-admin">Yönetici (Kurumsal)</SelectItem>
                <SelectItem value="super-admin">Süper Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {role === 'super-admin' && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
              <ShieldAlert className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
              <p className="text-xs text-red-800 leading-relaxed font-medium">
                Süper Admin yetkisi, kullanıcının bu paneli ve tüm sistem ayarlarını yönetmesini sağlar.
              </p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>İptal</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Kaydet
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default function UsersPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState<UserRow | null>(null);
  const [viewingUser, setViewingUser] = useState<UserRow | null>(null);

  const usersQuery = useMemoFirebase(() => collection(db, 'users'), [db]);
  const { data: users, isLoading } = useCollection<UserRow>(usersQuery);

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    const lower = searchTerm.toLowerCase();
    const matched = !searchTerm
      ? [...users]
      : users.filter(u =>
        (u.name || '').toLowerCase().includes(lower) ||
        (u.personalInfo?.email || '').toLowerCase().includes(lower) ||
        (u.username || '').toLowerCase().includes(lower) ||
        (u.personalInfo?.phone || '').includes(lower),
      );

    // En yeni kullanıcı en üstte: createdAt → joinDate → fallback (eklenme sırası)
    const ts = (u: UserRow): number => {
      const c = (u as UserRow & { createdAt?: unknown }).createdAt;
      const maybeDate = c as { toDate?: () => Date } | null;
      if (maybeDate?.toDate) {
        try { return maybeDate.toDate().getTime(); } catch { /* ignore */ }
      }
      if (typeof c === 'string') {
        const t = Date.parse(c);
        if (!Number.isNaN(t)) return t;
      }
      const joinDate = (u as UserRow & { joinDate?: unknown }).joinDate;
      if (typeof joinDate === 'string') {
        const t = Date.parse(joinDate);
        if (!Number.isNaN(t)) return t;
      }
      return 0;
    };
    return matched.sort((a, b) => ts(b) - ts(a));
  }, [searchTerm, users]);

  const handleToggleStatus = async (userId: string, name: string, currentStatus: string) => {
    const newStatus = currentStatus === 'Aktif' ? 'Askıda' : 'Aktif';
    try {
      await updateDoc(doc(db, 'users', userId), { status: newStatus });
      toast({
        title: 'Kullanıcı Durumu Güncellendi',
        description: `${name} → ${newStatus.toLowerCase()}.`,
      });
    } catch (e) {
      console.error('Toggle status failed:', e);
      const code = (e as { code?: string } | null)?.code;
      const message = e instanceof Error ? e.message : 'Beklenmeyen bir hata oluştu.';
      toast({
        variant: 'destructive',
        title: 'Güncelleme başarısız',
        description: code === 'permission-denied'
          ? 'Bu işlem için super-admin yetkisi gerekli.'
          : message,
      });
    }
  };

  const handleDelete = async (user: UserRow) => {
    try {
      await deleteDoc(doc(db, 'users', user.id));
      toast({
        variant: 'destructive',
        title: 'Kullanıcı Silindi',
        description: `${user.name || 'Kullanıcı'} kaydı silindi. Not: Firebase Auth hesabı ayrıca silinmelidir.`,
      });
    } catch (e) {
      console.error('Delete failed:', e);
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

  const [bulkEmail, setBulkEmail] = useState('');
  const [bulkProgress, setBulkProgress] = useState<{ deleted: number; failed: number } | null>(null);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const matchingByEmail = useMemo(() => {
    if (!users || !bulkEmail.trim()) return [];
    const target = bulkEmail.trim().toLowerCase();
    return users.filter(u => (u.personalInfo?.email || '').toLowerCase() === target);
  }, [users, bulkEmail]);

  const handleBulkDelete = async () => {
    setBulkDeleting(true);
    let deleted = 0;
    let failed = 0;
    for (const u of matchingByEmail) {
      try {
        await deleteDoc(doc(db, 'users', u.id));
        deleted++;
      } catch (e) {
        console.error(`Bulk delete failed for ${u.id}:`, e);
        failed++;
      }
    }
    setBulkProgress({ deleted, failed });
    setBulkDeleting(false);
    toast({
      variant: failed > 0 ? 'destructive' : 'default',
      title: 'Toplu silme tamamlandı',
      description: `${deleted} kayıt silindi${failed > 0 ? `, ${failed} hata` : ''}. Firebase Auth hesapları ayrıca silinmelidir.`,
    });
  };

  const handleSaveUser = async (userId: string, patch: Record<string, unknown>) => {
    try {
      await updateDoc(doc(db, 'users', userId), patch);
      toast({ title: 'Bilgiler Güncellendi', description: 'Kullanıcı bilgileri kaydedildi.' });
    } catch (e) {
      console.error('Save user failed:', e);
      const code = (e as { code?: string } | null)?.code;
      const message = e instanceof Error ? e.message : 'Beklenmeyen bir hata oluştu.';
      toast({
        variant: 'destructive',
        title: 'Kaydedilemedi',
        description: code === 'permission-denied'
          ? 'Bu işlem için super-admin yetkisi gerekli.'
          : message,
      });
      throw e;
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Kullanıcılar Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in-0">
      <div className="space-y-1">
        <h1 className="text-3xl font-black tracking-tighter text-[#1d1d1f]">Kullanıcı Yönetimi</h1>
        <p className="text-muted-foreground text-sm font-medium">Platformdaki tüm kullanıcıları görüntüleyin, düzenleyin, yetki ve durumunu yönetin.</p>
      </div>

      {/* E-postaya göre toplu silme — mükerrer profil temizliği için */}
      <Card className="rounded-[2rem] border-amber-200 bg-amber-50/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Trash2 className="h-4 w-4 text-amber-600" /> E-postaya Göre Toplu Sil
          </CardTitle>
          <CardDescription className="text-xs">
            Aynı e-posta ile oluşturulmuş tüm mükerrer Firestore user kayıtlarını siler. Auth hesapları Console'dan ayrıca silinmelidir.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Input
              type="email"
              placeholder="ornek@hangel.org"
              value={bulkEmail}
              onChange={e => { setBulkEmail(e.target.value); setBulkProgress(null); }}
              className="max-w-sm h-9 rounded-xl bg-background"
            />
            <Badge variant="outline" className="text-[11px]">
              {matchingByEmail.length} eşleşen kayıt
            </Badge>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={matchingByEmail.length === 0 || bulkDeleting}
                  className="rounded-xl"
                >
                  {bulkDeleting && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                  Hepsini Sil
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-[2rem]">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-xl font-bold">
                    {matchingByEmail.length} kayıt silinecek
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-sm">
                    "{bulkEmail}" e-postasıyla eşleşen {matchingByEmail.length} Firestore user kaydı silinecek. Bu işlem geri alınamaz.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                {matchingByEmail.length > 0 && (
                  <div className="max-h-48 overflow-y-auto border rounded-lg p-3 space-y-1 text-xs bg-muted/30">
                    {matchingByEmail.map(u => (
                      <div key={u.id} className="flex justify-between gap-2">
                        <span className="truncate">{u.name || 'İsimsiz'}</span>
                        <code className="text-[10px] text-muted-foreground">{u.id.slice(0, 12)}…</code>
                      </div>
                    ))}
                  </div>
                )}
                <AlertDialogFooter className="gap-2">
                  <AlertDialogCancel className="rounded-xl font-bold">Vazgeç</AlertDialogCancel>
                  <AlertDialogAction
                    className={cn(buttonVariants({ variant: 'destructive' }), 'rounded-xl font-bold')}
                    onClick={handleBulkDelete}
                  >
                    Evet, {matchingByEmail.length} kaydı sil
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
          {bulkProgress && (
            <p className="text-xs text-muted-foreground">
              Son işlem: {bulkProgress.deleted} silindi, {bulkProgress.failed} hata.
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-[2rem] border-black/5 shadow-xl">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle>Platform Üyeleri ({users?.length || 0})</CardTitle>
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="İsim, @kullanıcı, e-posta, telefon..."
                className="pl-9 h-10 rounded-xl"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y border-t border-black/5">
            {filteredUsers.map(user => {
              const status = (user as UserRow & { status?: string }).status || 'Aktif';
              const isSuspended = status === 'Askıda';
              return (
                <div key={user.id} className={cn(
                  'p-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between hover:bg-muted/30 transition-colors',
                  isSuspended && 'opacity-60',
                )}>
                  <button
                    type="button"
                    className="flex items-center gap-4 text-left flex-1 min-w-0 hover:opacity-80 transition-opacity"
                    onClick={() => setViewingUser(user)}
                    title="Profili görüntüle"
                  >
                    <Avatar className="h-12 w-12 border shadow-sm">
                      <AvatarImage src={user.avatarUrl} alt={user.name} />
                      <AvatarFallback className="font-bold">{(user.name || '?').charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-[#1d1d1f] truncate">{user.name || 'İsimsiz'}</p>
                        <Badge variant={user.role === 'super-admin' ? 'default' : user.role === 'ngo-admin' ? 'secondary' : 'outline'} className="text-[9px] font-black uppercase tracking-widest">
                          {roleLabel[user.role || 'user']}
                        </Badge>
                        {isSuspended && <Badge variant="secondary" className="text-[9px] font-black uppercase">ASKIDA</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground font-medium truncate">
                        {user.personalInfo?.email || '—'}
                        {user.username && ` • ${user.username}`}
                      </p>
                    </div>
                  </button>

                  <div className="flex items-center gap-2 flex-wrap shrink-0">
                    <Button variant="outline" size="sm" className="rounded-xl font-bold h-9" onClick={() => setViewingUser(user)}>
                      <Eye className="mr-2 h-4 w-4" /> Görüntüle
                    </Button>
                    <Button variant="outline" size="sm" className="rounded-xl font-bold h-9" onClick={() => setEditingUser(user)}>
                      <Pencil className="mr-2 h-4 w-4" /> Düzenle
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl font-bold h-9"
                      onClick={() => handleToggleStatus(user.id, user.name || 'Kullanıcı', status)}
                    >
                      {isSuspended ? 'Aktif Et' : 'Askıya Al'}
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive hover:bg-destructive/10 rounded-xl" aria-label="Sil">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="rounded-[2rem]">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-xl font-bold">{user.name || 'Kullanıcı'} siliniyor</AlertDialogTitle>
                          <AlertDialogDescription className="text-base font-medium">
                            Bu işlem geri alınamaz. Firestore'daki kullanıcı dokümanı silinir.
                            Firebase Authentication hesabı ayrıca elle silinmelidir (Console &gt; Auth).
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="gap-2">
                          <AlertDialogCancel className="rounded-xl font-bold">Vazgeç</AlertDialogCancel>
                          <AlertDialogAction
                            className={cn(buttonVariants({ variant: 'destructive' }), 'rounded-xl font-bold')}
                            onClick={() => handleDelete(user)}>
                            Evet, Sil
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              );
            })}
            {filteredUsers.length === 0 && (
              <div className="p-16 text-center text-muted-foreground italic">Eşleşen kullanıcı bulunamadı.</div>
            )}
          </div>
        </CardContent>
      </Card>

      <EditUserDialog
        user={editingUser}
        open={!!editingUser}
        onOpenChange={(o) => !o && setEditingUser(null)}
        onSave={handleSaveUser}
      />
      <ProfileViewDialog
        user={viewingUser}
        open={!!viewingUser}
        onOpenChange={(o) => !o && setViewingUser(null)}
      />
    </div>
  );
}
