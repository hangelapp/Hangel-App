'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
import { collection, doc, updateDoc, deleteDoc, query, where, addDoc, serverTimestamp, getDocs, setDoc, writeBatch } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import {
  Loader2, ShieldCheck, Trash2, Edit3, Power, PowerOff, UserCog, CheckCircle,
  XCircle, Search, Database, Upload, RefreshCw,
} from 'lucide-react';
import type { NGO } from '@/lib/types';
import seedNgos from '../../../../docs/database-exports/ngos.json';

type NgoItem = (NGO & { id: string }) & {
  source: 'ngos' | 'applications';
  status: string;
  __raw?: any;
};

const normalizePhone = (raw: string): string => raw.replace(/[^0-9]/g, '');

const TransferAdminDialog = ({ ngo, allUsers, onAssign }: {
  ngo: NgoItem;
  allUsers: any[] | null;
  onAssign: (ngoId: string, newUserId: string, newUserName: string) => Promise<void>;
}) => {
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const normalizedSearch = normalizePhone(phone);
  const matchedUser = useMemo(() => {
    if (!allUsers || normalizedSearch.length < 3) return null;
    return allUsers.find(u => {
      const cands = [u.personalInfo?.phone, u.phoneNumber, u.phone].filter(Boolean).map(normalizePhone);
      return cands.some(c => c.endsWith(normalizedSearch) || normalizedSearch.endsWith(c));
    }) || null;
  }, [allUsers, normalizedSearch]);

  const handleAssign = async () => {
    if (!matchedUser) return;
    setSubmitting(true);
    try {
      await onAssign(ngo.id, matchedUser.id, matchedUser.name || matchedUser.displayName || 'Üye');
      setOpen(false);
      setPhone('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="rounded-xl font-bold h-10 px-4">
          <UserCog className="mr-2 h-4 w-4" /> Yetkili
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Yetkili Kişi Değiştir</DialogTitle>
          <DialogDescription>
            <strong>{ngo.name}</strong> için yeni yöneticiyi telefon numarasıyla bulun ve atayın. Sadece kayıtlı hangel üyeleri seçilebilir.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Telefon Numarası</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="5XX XXX XX XX"
                className="pl-10"
                autoFocus
              />
            </div>
            <p className="text-xs text-muted-foreground">En az 3 hane girin.</p>
          </div>

          {normalizedSearch.length >= 3 && matchedUser && (
            <div className="flex items-center gap-3 p-3 border-2 border-green-500/30 bg-green-500/5 rounded-lg">
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
            <div className="flex items-center gap-2 p-3 border border-destructive/30 bg-destructive/5 rounded-lg text-sm text-destructive">
              <XCircle className="h-4 w-4" />
              <span>Bu telefon numarasıyla kayıtlı üye bulunamadı.</span>
            </div>
          )}

          <p className="text-xs text-muted-foreground leading-relaxed">
            Atanan kullanıcı <strong>"ngo-admin"</strong> rolüyle yetkilendirilir ve bu STK için NGO yönetim panelini kullanabilir.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>İptal</Button>
          <Button disabled={!matchedUser || submitting} onClick={handleAssign}>
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
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'pending' | 'passive' | 'rejected'>('all');

  const ngosQuery = useMemoFirebase(() => collection(db, 'ngos'), [db]);
  const { data: ngos, isLoading: ngosLoading } = useCollection<NGO>(ngosQuery);

  const applicationsQuery = useMemoFirebase(() =>
    query(collection(db, 'applications'), where('entityType', '==', 'NGO')),
    [db],
  );
  const { data: applications, isLoading: appsLoading } = useCollection<any>(applicationsQuery);

  const usersQuery = useMemoFirebase(() => collection(db, 'users'), [db]);
  const { data: allUsers } = useCollection<any>(usersQuery);

  const items = useMemo<NgoItem[]>(() => {
    const list: NgoItem[] = [];

    (ngos || []).forEach((n: any) => {
      list.push({
        ...n,
        id: n.id,
        source: 'ngos',
        status: n.status || 'Aktif',
      });
    });

    (applications || []).forEach((app: any) => {
      if (app.status === 'Onaylandı') return; // ngos koleksiyonunda zaten var
      list.push({
        id: app.id,
        name: app.name || 'İsimsiz',
        slug: app.name?.toLowerCase().replace(/\s+/g, '-') || '',
        avatarUrl: '',
        coverPhotoUrl: '',
        type: app.orgSubType || 'Dernek',
        category: app.sector || '',
        transparencyScore: 0,
        source: 'applications',
        status: app.status || 'Beklemede',
        __raw: app,
      } as NgoItem);
    });

    return list;
  }, [ngos, applications]);

  const filteredItems = useMemo(() => {
    if (statusFilter === 'all') return items;
    if (statusFilter === 'approved') return items.filter(i => i.source === 'ngos' && i.status === 'Aktif');
    if (statusFilter === 'pending') return items.filter(i => i.status === 'Beklemede');
    if (statusFilter === 'passive') return items.filter(i => i.source === 'ngos' && i.status === 'Pasif');
    if (statusFilter === 'rejected') return items.filter(i => i.status === 'Reddedildi');
    return items;
  }, [items, statusFilter]);

  const stats = useMemo(() => {
    const approved = (ngos || []).filter((n: any) => (n.status || 'Aktif') === 'Aktif').length;
    const passive = (ngos || []).filter((n: any) => n.status === 'Pasif').length;
    const pending = (applications || []).filter((a: any) => a.status === 'Beklemede').length;
    const rejected = (applications || []).filter((a: any) => a.status === 'Reddedildi').length;
    return { total: approved + passive + pending + rejected, approved, pending, passive, rejected };
  }, [ngos, applications]);

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const isPassive = currentStatus === 'Pasif';
    try {
      await updateDoc(doc(db, 'ngos', id), { status: isPassive ? 'Aktif' : 'Pasif' });
      toast({
        title: isPassive ? 'Kuruluş Aktifleştirildi' : 'Kuruluş Pasife Alındı',
        description: isPassive
          ? 'STK platformdaki tüm listelerde tekrar görünür olacak.'
          : 'STK artık platformdaki public listelerde görünmeyecek.',
      });
    } catch (e: any) {
      toast({
        variant: 'destructive',
        title: 'Durum güncellenemedi',
        description: e?.code === 'permission-denied'
          ? 'Bu işlem için super-admin yetkisi gerekli.'
          : (e?.message || 'Beklenmeyen bir hata oluştu.'),
      });
    }
  };

  const handleRemove = async (id: string, name: string) => {
    try {
      await deleteDoc(doc(db, 'ngos', id));
      toast({
        variant: 'destructive',
        title: 'Kuruluş Kaldırıldı',
        description: `${name} platformdan kalıcı olarak silindi.`,
      });
    } catch (e: any) {
      toast({
        variant: 'destructive',
        title: 'Silme başarısız',
        description: e?.code === 'permission-denied'
          ? 'Bu işlem için super-admin yetkisi gerekli.'
          : (e?.message || 'Beklenmeyen bir hata oluştu.'),
      });
    }
  };

  const [bulkOp, setBulkOp] = useState<'idle' | 'clearing' | 'seeding'>('idle');

  const handleClearAll = async () => {
    setBulkOp('clearing');
    try {
      const snap = await getDocs(collection(db, 'ngos'));
      const batches: any[] = [];
      let current = writeBatch(db);
      let count = 0;
      snap.docs.forEach(d => {
        current.delete(d.ref);
        count += 1;
        if (count >= 450) {
          batches.push(current);
          current = writeBatch(db);
          count = 0;
        }
      });
      if (count > 0) batches.push(current);
      await Promise.all(batches.map(b => b.commit()));
      toast({
        variant: 'destructive',
        title: 'STK Listesi Temizlendi',
        description: `${snap.size} STK kaydı silindi.`,
      });
    } catch (e: any) {
      console.error('Clear all NGOs failed:', e);
      toast({
        variant: 'destructive',
        title: 'Temizleme başarısız',
        description: e?.code === 'permission-denied'
          ? 'Bu işlem için super-admin yetkisi gerekli.'
          : (e?.message || 'Bilinmeyen hata.'),
      });
    } finally {
      setBulkOp('idle');
    }
  };

  const handleSeed = async () => {
    setBulkOp('seeding');
    try {
      let count = 0;
      for (const n of (seedNgos as any[])) {
        await setDoc(doc(db, 'ngos', n.id), { ...n, status: 'Aktif' }, { merge: true });
        count += 1;
      }
      toast({
        title: 'STK Verisi Yüklendi',
        description: `${count} STK Firestore'a aktarıldı (mevcut kayıtların üzerine yazıldı).`,
      });
    } catch (e: any) {
      console.error('Seed NGOs failed:', e);
      toast({
        variant: 'destructive',
        title: 'Yükleme başarısız',
        description: e?.code === 'permission-denied'
          ? 'Bu işlem için super-admin yetkisi gerekli.'
          : (e?.message || 'Bilinmeyen hata.'),
      });
    } finally {
      setBulkOp('idle');
    }
  };

  const handleResetAndSeed = async () => {
    await handleClearAll();
    await handleSeed();
  };

  const handleAssignAdmin = async (ngoId: string, newUserId: string, newUserName: string) => {
    try {
      // 1. NGO doc'una yetkili kullanıcıyı işaretle
      await updateDoc(doc(db, 'ngos', ngoId), { adminUserId: newUserId });

      // 2. Kullanıcıya ngo-admin rolü ver + bağlı STK ID'sini sakla
      await updateDoc(doc(db, 'users', newUserId), {
        role: 'ngo-admin',
        managedNgoId: ngoId,
      });

      // 3. Davet kaydı (audit + bildirim için)
      await addDoc(collection(db, 'userInvitations'), {
        ngoId,
        inviteeUserId: newUserId,
        inviteeName: newUserName,
        role: 'Genel Yönetici',
        status: 'accepted',
        invitedBy: 'super-admin',
        invitedAt: serverTimestamp(),
        autoAcceptedBy: 'super-admin',
      });

      toast({
        title: 'Yetkili Atandı',
        description: `${newUserName} bu STK'nın yöneticisi olarak işaretlendi.`,
      });
    } catch (e: any) {
      console.error('Admin transfer failed:', e);
      toast({
        variant: 'destructive',
        title: 'Yetki ataması başarısız',
        description: e?.code === 'permission-denied'
          ? 'Bu işlem için super-admin yetkisi gerekli.'
          : (e?.message || 'Beklenmeyen bir hata oluştu.'),
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

      {/* Bulk admin tools */}
      <Card className="rounded-2xl border-amber-200 bg-amber-50/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2"><Database className="h-4 w-4" /> Veri Yönetim Araçları</CardTitle>
          <CardDescription>Demo verileri temizle ve mevcut STK datalarını (20 kuruluş) Firestore'a yükle.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-2 flex-wrap">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" disabled={bulkOp !== 'idle'} className="gap-1.5">
                <Trash2 className="h-4 w-4" /> Tüm STK'ları Temizle
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Tüm STK kayıtları silinsin mi?</AlertDialogTitle>
                <AlertDialogDescription>
                  Bu işlem <strong>kalıcıdır</strong>. Firestore'daki <code>ngos</code> koleksiyonundaki tüm dokümanlar silinir.
                  Başvurular ve kullanıcı bağlantıları etkilenmez.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Vazgeç</AlertDialogCancel>
                <AlertDialogAction
                  className={cn(buttonVariants({ variant: 'destructive' }))}
                  onClick={handleClearAll}>
                  {bulkOp === 'clearing' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Evet, Tümünü Sil
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Button variant="outline" onClick={handleSeed} disabled={bulkOp !== 'idle'} className="gap-1.5">
            {bulkOp === 'seeding' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            STK Datalarını Yükle ({(seedNgos as any[]).length} kuruluş)
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button disabled={bulkOp !== 'idle'} className="gap-1.5 bg-red-600 hover:bg-red-700">
                <RefreshCw className="h-4 w-4" /> Sıfırla ve Yeniden Yükle
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Sıfırla ve Yeniden Yükle?</AlertDialogTitle>
                <AlertDialogDescription>
                  Önce mevcut tüm STK kayıtları silinir, ardından <strong>{(seedNgos as any[]).length} STK</strong> Firestore'a aktarılır.
                  Bu işlem geri alınamaz.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Vazgeç</AlertDialogCancel>
                <AlertDialogAction
                  className={cn(buttonVariants({ variant: 'destructive' }))}
                  onClick={handleResetAndSeed}>
                  Devam Et
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>

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
          <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
            <SelectTrigger className="h-9 w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tümü</SelectItem>
              <SelectItem value="approved">Yayında (Aktif)</SelectItem>
              <SelectItem value="pending">Onay Bekleyen</SelectItem>
              <SelectItem value="passive">Pasif</SelectItem>
              <SelectItem value="rejected">Reddedildi</SelectItem>
            </SelectContent>
          </Select>
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
              return (
                <div key={ngo.id}
                     className={cn('p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-muted/30 transition-colors',
                       (isPassive || isRejected) && 'opacity-60 grayscale')}>
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <Avatar className="h-12 w-12 border-2 border-white shadow">
                      <AvatarImage src={ngo.avatarUrl} alt={ngo.name} className="object-contain p-1" />
                      <AvatarFallback className="font-black">{ngo.name?.[0] || '?'}</AvatarFallback>
                    </Avatar>
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-black text-base text-[#1d1d1f] tracking-tight truncate">{ngo.name}</p>
                        {isApproved && <Badge className="bg-green-600 text-white text-[9px] font-black uppercase">YAYINDA</Badge>}
                        {isPending && <Badge className="bg-amber-500 text-white text-[9px] font-black uppercase">ONAY BEKLİYOR</Badge>}
                        {isPassive && <Badge variant="secondary" className="text-[9px] font-black uppercase">PASİF</Badge>}
                        {isRejected && <Badge variant="destructive" className="text-[9px] font-black uppercase">REDDEDİLDİ</Badge>}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium flex-wrap">
                        {ngo.source === 'ngos' && (
                          <span className="flex items-center gap-1"><ShieldCheck className="h-3 w-3 text-primary" /> {ngo.transparencyScore || 0} Puan</span>
                        )}
                        {ngo.type && <><span>•</span> <span className="capitalize">{ngo.type}</span></>}
                        {ngo.category && <><span>•</span> <span>{ngo.category}</span></>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap" onClick={e => e.stopPropagation()}>
                    {ngo.source === 'ngos' && (
                      <>
                        <Button variant="outline" size="sm" className="rounded-xl font-bold h-10 px-4" asChild>
                          <Link href={`/ngos/${ngo.id}`}>Profili Gör</Link>
                        </Button>
                        <Button variant="outline" size="sm" className="rounded-xl font-bold h-10 px-4" asChild>
                          <Link href={`/super-admin/ngos/${ngo.id}/edit`}><Edit3 className="mr-2 h-4 w-4" />Düzelt</Link>
                        </Button>
                        <TransferAdminDialog ngo={ngo} allUsers={allUsers || null} onAssign={handleAssignAdmin} />
                        <Button variant="outline" size="sm" className="rounded-xl font-bold h-10 px-4"
                                onClick={() => handleToggleStatus(ngo.id, ngo.status)}>
                          {isPassive ? <><Power className="mr-2 h-4 w-4" /> Aktif</> : <><PowerOff className="mr-2 h-4 w-4" /> Pasife</>}
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-10 w-10 text-destructive hover:bg-destructive/10 rounded-xl">
                              <Trash2 className="h-5 w-5" />
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
                      <Button variant="outline" size="sm" className="rounded-xl font-bold h-10 px-4" asChild>
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
