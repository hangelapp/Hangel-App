'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import Link from 'next/link';
import React, { useMemo, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import {
    collection, doc, updateDoc, deleteDoc, query, where, addDoc, serverTimestamp, getDoc,
} from 'firebase/firestore';
import {
    Loader2, ShieldCheck, Trash2, Edit3, Power, PowerOff, UserCog, CheckCircle, XCircle,
    Search, Eye, GraduationCap,
} from 'lucide-react';
import type { StudentClub } from '@/lib/types';

type ClubItem = (StudentClub & { id: string }) & {
    source: 'clubs' | 'applications';
    status: string;
    __raw?: unknown;
};

interface SimpleClubUser {
    id: string;
    name?: string;
    displayName?: string;
    avatarUrl?: string;
    phone?: string;
    phoneNumber?: string;
    personalInfo?: { phone?: string; email?: string };
    [key: string]: unknown;
}

interface ClubApplication {
    id: string;
    name?: string;
    status?: string;
    clubType?: string;
    universityName?: string;
    clubCategory?: string;
    [key: string]: unknown;
}

const normalizePhone = (raw: string): string => raw.replace(/[^0-9]/g, '');

const TransferAdminDialog = ({ club, allUsers, onAssign }: {
    club: ClubItem;
    allUsers: SimpleClubUser[] | null;
    onAssign: (clubId: string, newUserId: string, newUserName: string) => Promise<void>;
}) => {
    const [open, setOpen] = useState(false);
    const [phone, setPhone] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const normalizedSearch = normalizePhone(phone);
    const matchedUser = useMemo(() => {
        if (!allUsers || normalizedSearch.length < 3) return null;
        return allUsers.find(u => {
            const cands = ([u.personalInfo?.phone, u.phoneNumber, u.phone].filter(Boolean) as string[]).map(normalizePhone);
            return cands.some(c => c.endsWith(normalizedSearch) || normalizedSearch.endsWith(c));
        }) || null;
    }, [allUsers, normalizedSearch]);

    const handleAssign = async () => {
        if (!matchedUser) return;
        setSubmitting(true);
        try {
            await onAssign(club.id, matchedUser.id, matchedUser.name || matchedUser.displayName || 'Üye');
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
                    <DialogTitle>Kulüp Yetkilisini Belirle</DialogTitle>
                    <DialogDescription>
                        <strong>{club.name}</strong> için yeni yöneticiyi telefon numarasıyla bulun ve atayın.
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
                        Atanan kullanıcı <strong>"ngo-admin"</strong> rolüyle yetkilendirilir ve bu kulüp için yönetim panelini kullanabilir.
                        Süper admin'in rolü değişmez.
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

export default function ClubsAdminPage() {
    const { toast } = useToast();
    const db = useFirestore();
    const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'pending' | 'passive' | 'rejected'>('all');
    const [searchTerm, setSearchTerm] = useState('');

    const clubsQuery = useMemoFirebase(() => collection(db, 'clubs'), [db]);
    const { data: clubs, isLoading: clubsLoading } = useCollection<StudentClub>(clubsQuery);

    const applicationsQuery = useMemoFirebase(
        () => query(collection(db, 'applications'), where('entityType', '==', 'CLUB')),
        [db],
    );
    const { data: applications, isLoading: appsLoading } = useCollection<ClubApplication>(applicationsQuery);

    // Yetkili atama için tüm kullanıcılar
    const usersQuery = useMemoFirebase(() => collection(db, 'users'), [db]);
    const { data: allUsers } = useCollection<SimpleClubUser>(usersQuery);

    const items = useMemo<ClubItem[]>(() => {
        const list: ClubItem[] = [];
        (clubs || []).forEach((c) => {
            const clubWithStatus = c as StudentClub & { id: string; status?: string };
            list.push({
                ...clubWithStatus,
                source: 'clubs',
                status: clubWithStatus.status || 'Aktif',
            });
        });
        (applications || []).forEach((a) => {
            const aExt = a as ClubApplication & { org?: string; university?: string; logoUrl?: string; avatarUrl?: string; coverPhotoUrl?: string; about?: string; date?: string; email?: string; phone?: string; website?: string };
            // Onaylanmış başvurular zaten clubs'ta var; çift göstermemek için atla
            if (a.status === 'Onaylandı') return;
            list.push({
                id: a.id,
                name: a.name || aExt.org || 'Adsız Kulüp',
                university: a.universityName || aExt.university || '',
                avatarUrl: aExt.logoUrl || aExt.avatarUrl || '',
                coverPhotoUrl: aExt.coverPhotoUrl || '',
                type: a.clubType || 'university',
                category: a.clubCategory || '',
                members: 0,
                points: 0,
                description: aExt.about || '',
                vision: '',
                joinDate: aExt.date || '',
                contact: { email: aExt.email || '', phone: aExt.phone || '', website: aExt.website || '' },
                source: 'applications',
                status: a.status || 'Beklemede',
                __raw: a,
            } as ClubItem);
        });
        return list;
    }, [clubs, applications]);

    const filteredItems = useMemo(() => {
        let list = items;
        if (statusFilter === 'approved') list = list.filter(c => c.source === 'clubs' && c.status === 'Aktif');
        else if (statusFilter === 'pending') list = list.filter(c => c.status === 'Beklemede');
        else if (statusFilter === 'passive') list = list.filter(c => c.source === 'clubs' && c.status === 'Pasif');
        else if (statusFilter === 'rejected') list = list.filter(c => c.status === 'Reddedildi');

        if (searchTerm.trim()) {
            const q = searchTerm.toLowerCase();
            list = list.filter(c =>
                (c.name || '').toLowerCase().includes(q) ||
                (c.university || '').toLowerCase().includes(q) ||
                (c.category || '').toLowerCase().includes(q),
            );
        }
        return list;
    }, [items, statusFilter, searchTerm]);

    const stats = useMemo(() => {
        const approved = (clubs || []).filter((c) => ((c as StudentClub & { status?: string }).status || 'Aktif') === 'Aktif').length;
        const passive = (clubs || []).filter((c) => (c as StudentClub & { status?: string }).status === 'Pasif').length;
        const pending = (applications || []).filter((a) => a.status === 'Beklemede').length;
        const rejected = (applications || []).filter((a) => a.status === 'Reddedildi').length;
        return { total: approved + passive + pending + rejected, approved, pending, passive, rejected };
    }, [clubs, applications]);

    const handleToggleStatus = async (id: string, currentStatus: string) => {
        const isPassive = currentStatus === 'Pasif';
        try {
            await updateDoc(doc(db, 'clubs', id), { status: isPassive ? 'Aktif' : 'Pasif' });
            toast({
                title: isPassive ? 'Kulüp Aktifleştirildi' : 'Kulüp Pasife Alındı',
                description: isPassive
                    ? 'Kulüp /clubs sayfasında tekrar görünür olacak.'
                    : 'Kulüp artık public listelerde görünmeyecek.',
            });
        } catch (e) {
            const code = (e as { code?: string } | null)?.code;
            const message = e instanceof Error ? e.message : 'Hata.';
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
            await deleteDoc(doc(db, 'clubs', id));
            toast({
                variant: 'destructive',
                title: 'Kulüp Kaldırıldı',
                description: `${name} platformdan kalıcı olarak silindi.`,
            });
        } catch (e) {
            const code = (e as { code?: string } | null)?.code;
            const message = e instanceof Error ? e.message : 'Hata.';
            toast({
                variant: 'destructive',
                title: 'Silme başarısız',
                description: code === 'permission-denied'
                    ? 'Bu işlem için super-admin yetkisi gerekli.'
                    : message,
            });
        }
    };

    const handleAssignAdmin = async (clubId: string, newUserId: string, newUserName: string) => {
        try {
            await updateDoc(doc(db, 'clubs', clubId), { adminUserId: newUserId });

            // Super-admin'in rolünü düşürme; sadece henüz super-admin olmayanları yükselt.
            const userSnap = await getDoc(doc(db, 'users', newUserId));
            const currentRole = userSnap.exists() ? (userSnap.data() as { role?: string }).role : null;
            const updatePayload: Record<string, unknown> = { managedClubId: clubId };
            if (currentRole !== 'super-admin') {
                updatePayload.role = 'ngo-admin';
            }
            await updateDoc(doc(db, 'users', newUserId), updatePayload);

            await addDoc(collection(db, 'userInvitations'), {
                clubId,
                inviteeUserId: newUserId,
                inviteeName: newUserName,
                role: 'Kulüp Yöneticisi',
                status: 'accepted',
                invitedBy: 'super-admin',
                invitedAt: serverTimestamp(),
                autoAcceptedBy: 'super-admin',
            });

            toast({
                title: 'Yetkili Atandı',
                description: `${newUserName} bu kulübün yöneticisi olarak işaretlendi.`,
            });
        } catch (e) {
            console.error('Club admin assign failed:', e);
            const code = (e as { code?: string } | null)?.code;
            const message = e instanceof Error ? e.message : 'Beklenmeyen bir hata oluştu.';
            toast({
                variant: 'destructive',
                title: 'Atama başarısız',
                description: code === 'permission-denied'
                    ? 'Bu işlem için super-admin yetkisi gerekli.'
                    : message,
            });
        }
    };

    if (clubsLoading || appsLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Kulüp Listesi Yükleniyor...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in-0">
            <div className="space-y-1">
                <h1 className="text-3xl font-black tracking-tighter text-[#1d1d1f]">Öğrenci Kulübü Yönetimi</h1>
                <p className="text-muted-foreground text-sm font-medium">
                    Yayında olan ve başvuru sürecindeki kulüpleri yönetin.
                </p>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <Card className="rounded-2xl border-black/5 cursor-pointer hover:shadow-md transition" onClick={() => setStatusFilter('all')}>
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

            {/* Filtre & arama */}
            <Card className="rounded-2xl border-black/5">
                <CardContent className="p-4 flex items-center gap-3 flex-wrap">
                    <div className="relative flex-1 min-w-[220px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Kulüp adı, üniversite, kategori..."
                            className="pl-10 h-10 rounded-xl"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Label className="text-sm font-semibold">Durum:</Label>
                    <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as 'all' | 'approved' | 'pending' | 'passive' | 'rejected')}>
                        <SelectTrigger className="h-9 w-44"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tümü</SelectItem>
                            <SelectItem value="approved">Yayında (Aktif)</SelectItem>
                            <SelectItem value="pending">Onay Bekleyen</SelectItem>
                            <SelectItem value="passive">Pasif</SelectItem>
                            <SelectItem value="rejected">Reddedildi</SelectItem>
                        </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground ml-auto"><strong>{filteredItems.length}</strong> kulüp gösteriliyor</p>
                </CardContent>
            </Card>

            {/* Kulüp listesi */}
            <Card className="rounded-[2rem] border-black/5 shadow-xl overflow-hidden">
                <CardHeader className="bg-muted/30 border-b p-6">
                    <CardTitle className="text-xl font-bold">Kulüp Listesi</CardTitle>
                    <CardDescription>Yayında olan ve başvuru sürecindeki öğrenci kulüpleri.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="divide-y border-black/5">
                        {filteredItems.length > 0 ? filteredItems.map(club => {
                            const isPassive = club.status === 'Pasif';
                            const isPending = club.status === 'Beklemede';
                            const isRejected = club.status === 'Reddedildi';
                            const isApproved = club.source === 'clubs' && club.status === 'Aktif';
                            return (
                                <div
                                    key={club.id}
                                    className={cn(
                                        'p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:bg-muted/30 transition-colors',
                                        (isPassive || isRejected) && 'opacity-60 grayscale',
                                    )}
                                >
                                    <div className="flex items-center gap-4 flex-1 min-w-0">
                                        <Avatar className="h-12 w-12 border-2 border-white shadow">
                                            <AvatarImage src={club.avatarUrl} alt={club.name} className="object-contain p-1" />
                                            <AvatarFallback className="font-black">
                                                {club.name?.[0] || <GraduationCap className="h-5 w-5" />}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="space-y-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className="font-black text-base text-[#1d1d1f] tracking-tight truncate">{club.name}</p>
                                                {isApproved && <Badge className="bg-green-600 text-white text-[9px] font-black uppercase">YAYINDA</Badge>}
                                                {isPending && <Badge className="bg-amber-500 text-white text-[9px] font-black uppercase">ONAY BEKLİYOR</Badge>}
                                                {isPassive && <Badge variant="secondary" className="text-[9px] font-black uppercase">PASİF</Badge>}
                                                {isRejected && <Badge variant="destructive" className="text-[9px] font-black uppercase">REDDEDİLDİ</Badge>}
                                            </div>
                                            <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium flex-wrap">
                                                {club.university && <span className="flex items-center gap-1"><GraduationCap className="h-3 w-3" /> {club.university}</span>}
                                                {club.type && <><span>•</span> <span className="capitalize">{club.type === 'university' ? 'Üniversite' : 'Lise'}</span></>}
                                                {club.category && <><span>•</span> <span>{club.category}</span></>}
                                                {club.source === 'clubs' && (
                                                    <><span>•</span> <span className="flex items-center gap-1"><ShieldCheck className="h-3 w-3 text-primary" /> {club.points || 0} Puan</span></>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 flex-wrap" onClick={e => e.stopPropagation()}>
                                        {club.source === 'clubs' && (
                                            <>
                                                <Button variant="outline" size="sm" className="rounded-xl font-bold h-10 px-4" asChild>
                                                    <Link href={`/clubs/profile/${club.id}`}>
                                                        <Eye className="mr-2 h-4 w-4" /> Profili Gör
                                                    </Link>
                                                </Button>
                                                <Button variant="outline" size="sm" className="rounded-xl font-bold h-10 px-4" asChild>
                                                    <Link href={`/admin/clubs/profile/${club.id}`}>
                                                        <Edit3 className="mr-2 h-4 w-4" /> Düzelt
                                                    </Link>
                                                </Button>
                                                <TransferAdminDialog club={club} allUsers={allUsers || null} onAssign={handleAssignAdmin} />
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="rounded-xl font-bold h-10 px-4"
                                                    onClick={() => handleToggleStatus(club.id, club.status)}
                                                >
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
                                                            <AlertDialogTitle className="text-xl font-bold">{club.name} kulübünü silmek istiyor musunuz?</AlertDialogTitle>
                                                            <AlertDialogDescription className="text-base font-medium">
                                                                Bu işlem geri alınamaz. Kulüp ve ilişkili tüm veriler platformdan kalıcı olarak silinecektir.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter className="gap-2">
                                                            <AlertDialogCancel className="rounded-xl font-bold">Vazgeç</AlertDialogCancel>
                                                            <AlertDialogAction
                                                                className={cn(buttonVariants({ variant: 'destructive' }), 'rounded-xl font-bold')}
                                                                onClick={() => handleRemove(club.id, club.name)}>
                                                                Evet, Kalıcı Olarak Sil
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </>
                                        )}
                                        {club.source === 'applications' && (
                                            <Button variant="outline" size="sm" className="rounded-xl font-bold h-10 px-4" asChild>
                                                <Link href="/super-admin/applications">Başvuru Yönetimine Git</Link>
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            );
                        }) : (
                            <div className="p-16 text-center text-muted-foreground italic">Bu filtreyle eşleşen kulüp bulunmuyor.</div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
