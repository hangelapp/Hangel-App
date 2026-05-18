
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import React, { useMemo, useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { collection, doc, query, where, updateDoc, getDoc, addDoc, serverTimestamp, getDocs, setDoc, writeBatch } from 'firebase/firestore';
import { Loader2, Trash2, Power, PowerOff, Search, Inbox, Eye, UserCog, CheckCircle, XCircle, Edit3, Database, Upload, RefreshCw } from 'lucide-react';
import type { Brand } from "@/lib/types";
import Link from 'next/link';
import seedBrands from '../../../../docs/database-exports/brands.json';

type BrandItem = Brand & { id: string; source?: 'brands' | 'applications'; status?: string };

type EditFormData = Partial<BrandItem> & {
    _email?: string;
    _phone?: string;
    _website?: string;
    _instagram?: string;
    _twitter?: string;
    _facebook?: string;
    _linkedin?: string;
    agency?: string;
    link?: string;
};

type StatusFilter = 'all' | 'approved' | 'pending' | 'passive' | 'rejected';

interface BrandApplication {
    id: string;
    name?: string;
    sector?: string;
    brandStatus?: string;
    status?: string;
    [key: string]: unknown;
}

interface SimpleUser {
    id: string;
    name?: string;
    displayName?: string;
    avatarUrl?: string;
    phone?: string;
    phoneNumber?: string;
    personalInfo?: { phone?: string; email?: string };
    [key: string]: unknown;
}

const normalizePhone = (raw: string): string => raw.replace(/[^0-9]/g, '');

const TransferBrandAdminDialog = ({ brand, allUsers, onAssign }: {
    brand: BrandItem;
    allUsers: SimpleUser[] | null;
    onAssign: (brandId: string, userId: string, userName: string) => Promise<void>;
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
            await onAssign(brand.id, matchedUser.id, matchedUser.name || matchedUser.displayName || 'Üye');
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
                        <strong>{brand.name}</strong> markası için yeni yöneticiyi telefon numarasıyla bulun ve atayın.
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
                        Atanan kullanıcı <strong>"ngo-admin"</strong> rolüyle yetkilendirilir ve bu marka için yönetim panelini kullanabilir.
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

export default function BrandsPage() {
    const { toast } = useToast();
    const db = useFirestore();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [editingBrand, setEditingBrand] = useState<BrandItem | null>(null);
    const [editFormData, setEditFormData] = useState<EditFormData>({});
    const [bulkOp, setBulkOp] = useState<'idle' | 'clearing' | 'seeding'>('idle');

    // Load approved brands
    const brandsQuery = useMemoFirebase(() => collection(db, 'brands'), [db]);
    const { data: brands, isLoading: brandsLoading } = useCollection<Brand>(brandsQuery);

    // Load all brand applications (any status)
    const applicationsQuery = useMemoFirebase(() =>
        query(collection(db, 'applications'), where('entityType', '==', 'BRAND')),
        [db]
    );
    const { data: applications, isLoading: appsLoading } = useCollection(applicationsQuery);

    // Yetkili atama için tüm kullanıcılar
    const usersQuery = useMemoFirebase(() => collection(db, 'users'), [db]);
    const { data: allUsers } = useCollection<SimpleUser>(usersQuery);

    // Combine and filter brands
    const filteredBrands = useMemo(() => {
        const combinedList: BrandItem[] = [];

        // Add approved brands
        if (brands) {
            brands.forEach(brand => {
                combinedList.push({
                    ...brand,
                    source: 'brands',
                    status: (brand as Brand & { status?: string }).status || 'Aktif'
                });
            });
        }

        // Add applications (all statuses)
        if (applications) {
            applications.forEach((app: BrandApplication) => {
                // Onaylanmış başvurular zaten brands koleksiyonunda; çift göstermemek için atla
                if (app.status === 'Onaylandı') return;
                combinedList.push({
                    name: app.name,
                    slug: app.name?.toLowerCase().replace(/\s+/g, '-') || '',
                    logoUrl: '',
                    coverPhotoUrl: '',
                    donationRate: 0,
                    type: app.brandStatus || 'Ticari',
                    category: app.sector || 'Diğer',
                    status: app.status || 'Beklemede',
                    ...app,
                    id: app.id,
                    source: 'applications' as const, // spread'den sonra override garantili
                } as BrandItem);
            });
        }

        // Apply filters
        let filtered = combinedList;

        // Status filter
        if (statusFilter === 'approved') {
            filtered = filtered.filter(b => b.source === 'brands' && b.status === 'Aktif');
        } else if (statusFilter === 'pending') {
            filtered = filtered.filter(b => b.status === 'Beklemede');
        } else if (statusFilter === 'passive') {
            filtered = filtered.filter(b => b.source === 'brands' && b.status === 'Pasif');
        } else if (statusFilter === 'rejected') {
            filtered = filtered.filter(b => b.status === 'Reddedildi');
        }

        // Search filter
        if (searchTerm.trim()) {
            const q = searchTerm.toLowerCase();
            filtered = filtered.filter(b =>
                b.name?.toLowerCase().includes(q) ||
                b.category?.toLowerCase().includes(q) ||
                b.type?.toLowerCase().includes(q)
            );
        }

        return filtered;
    }, [brands, applications, statusFilter, searchTerm]);

    const handleToggleStatus = (id: string, currentStatus: string) => {
        const isPassive = currentStatus === 'Pasif';
        const brandRef = doc(db, 'brands', id);
        updateDocumentNonBlocking(brandRef, { status: isPassive ? 'Aktif' : 'Pasif' });

        toast({
            title: isPassive ? "Marka Aktifleştirildi" : "Marka Pasife Alındı",
            description: "Durum değişikliği sisteme yansıtıldı."
        });
    };

    const handleRemove = (id: string, name: string) => {
        const brandRef = doc(db, 'brands', id);
        deleteDocumentNonBlocking(brandRef);
        toast({
            variant: 'destructive',
            title: "Marka Kaldırıldı",
            description: `${name} platformdan kalıcı olarak silindi.`
        });
    };

    const handleAssignBrandAdmin = async (brandId: string, newUserId: string, newUserName: string) => {
        try {
            // 1. Brand doc'una yetkili kullanıcıyı işaretle
            await updateDoc(doc(db, 'brands', brandId), { adminUserId: newUserId });

            // 2. Kullanıcıya ngo-admin rolü ver + bağlı brand ID'sini sakla
            //    Super-admin'lerin rolü değişmez (yetkisini kaybetmesin)
            const userSnap = await getDoc(doc(db, 'users', newUserId));
            const currentRole = userSnap.exists() ? (userSnap.data() as { role?: string }).role : null;
            const updatePayload: Record<string, unknown> = { managedBrandId: brandId };
            if (currentRole !== 'super-admin') {
                updatePayload.role = 'ngo-admin';
            }
            await updateDoc(doc(db, 'users', newUserId), updatePayload);

            // 3. Davet kaydı (audit + bildirim için)
            await addDoc(collection(db, 'userInvitations'), {
                brandId,
                inviteeUserId: newUserId,
                inviteeName: newUserName,
                role: 'Marka Yöneticisi',
                status: 'accepted',
                invitedBy: 'super-admin',
                invitedAt: serverTimestamp(),
                autoAcceptedBy: 'super-admin',
            });

            toast({
                title: 'Yetkili Atandı',
                description: `${newUserName} bu markanın yöneticisi olarak işaretlendi.`,
            });
        } catch (e) {
            console.error('Brand admin assign failed:', e);
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

    const handleClearAll = async () => {
        setBulkOp('clearing');
        try {
            const snap = await getDocs(collection(db, 'brands'));
            const batches: ReturnType<typeof writeBatch>[] = [];
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
                title: 'Marka Listesi Temizlendi',
                description: `${snap.size} marka kaydı silindi.`,
            });
        } catch (e) {
            console.error('Clear all brands failed:', e);
            const code = (e as { code?: string } | null)?.code;
            const message = e instanceof Error ? e.message : 'Bilinmeyen hata.';
            toast({
                variant: 'destructive',
                title: 'Temizleme başarısız',
                description: code === 'permission-denied'
                    ? 'Bu işlem için super-admin yetkisi gerekli.'
                    : message,
            });
        } finally {
            setBulkOp('idle');
        }
    };

    const handleSeed = async () => {
        setBulkOp('seeding');
        try {
            let count = 0;
            for (const b of (seedBrands as Array<{ id: string } & Record<string, unknown>>)) {
                await setDoc(doc(db, 'brands', b.id), { ...b, status: 'Aktif' }, { merge: true });
                count += 1;
            }
            toast({
                title: 'Marka Verisi Yüklendi',
                description: `${count} marka Firestore'a aktarıldı (mevcut kayıtların üzerine yazıldı).`,
            });
        } catch (e) {
            console.error('Seed brands failed:', e);
            const code = (e as { code?: string } | null)?.code;
            const message = e instanceof Error ? e.message : 'Bilinmeyen hata.';
            toast({
                variant: 'destructive',
                title: 'Yükleme başarısız',
                description: code === 'permission-denied'
                    ? 'Bu işlem için super-admin yetkisi gerekli.'
                    : message,
            });
        } finally {
            setBulkOp('idle');
        }
    };

    const handleResetAndSeed = async () => {
        await handleClearAll();
        await handleSeed();
    };

    const handleStartEdit = (brand: BrandItem) => {
        setEditingBrand(brand);
        setEditFormData({
            name: brand.name,
            slug: brand.slug,
            category: brand.category,
            type: brand.type,
            logoUrl: brand.logoUrl,
            coverPhotoUrl: brand.coverPhotoUrl,
            about: brand.about,
            donationRate: brand.donationRate,
            agency: brand.agency,
            link: brand.link || '',
            // Flatten contact fields for form state
            _email: brand.contact?.email || (brand as Brand & { email?: string }).email || '',
            _phone: (brand as Brand & { phone?: string }).phone || '',
            _website: brand.contact?.website || (brand as Brand & { website?: string }).website || '',
            _instagram: brand.contact?.social?.instagram || '',
            _twitter: brand.contact?.social?.twitter || '',
            _facebook: brand.contact?.social?.facebook || '',
            _linkedin: brand.contact?.social?.linkedin || '',
        });
    };

    const handleSaveEdit = async () => {
        if (!editingBrand || !editingBrand.id) return;

        try {
            const fd = editFormData;
            const brandRef = doc(db, 'brands', editingBrand.id);
            updateDocumentNonBlocking(brandRef, {
                name: fd.name,
                slug: fd.slug,
                category: fd.category,
                type: fd.type,
                logoUrl: fd.logoUrl,
                coverPhotoUrl: fd.coverPhotoUrl,
                about: fd.about,
                donationRate: fd.donationRate,
                agency: fd.agency,
                link: fd.link || '',
                contact: {
                    email: fd._email || '',
                    website: fd._website || '',
                    social: {
                        instagram: fd._instagram || '',
                        twitter: fd._twitter || '',
                        facebook: fd._facebook || '',
                        linkedin: fd._linkedin || '',
                    },
                },
            });
            toast({
                title: "Marka Güncellendi",
                description: "Değişiklikler başarıyla kaydedildi."
            });
            setEditingBrand(null);
        } catch {
            toast({
                variant: 'destructive',
                title: "Hata",
                description: "Güncellenirken bir hata oluştu."
            });
        }
    };

    const isLoading = brandsLoading || appsLoading;

    // useMemo, conditional return'den ÖNCE çağrılmalı (Rules of Hooks)
    const stats = useMemo(() => {
        const approved = (brands || []).filter((b) => ((b as Brand & { status?: string }).status || 'Aktif') === 'Aktif').length;
        const passive = (brands || []).filter((b) => (b as Brand & { status?: string }).status === 'Pasif').length;
        const pending = (applications || []).filter((a) => (a as { status?: string }).status === 'Beklemede').length;
        const rejected = (applications || []).filter((a) => (a as { status?: string }).status === 'Reddedildi').length;
        return { approved, passive, pending, rejected, total: approved + passive + pending + rejected };
    }, [brands, applications]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Marka Listesi Yükleniyor...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in-0">
            <div className="space-y-1">
                <h1 className="text-3xl font-black tracking-tighter text-[#1d1d1f]">Marka Yönetimi</h1>
                <p className="text-muted-foreground text-sm font-medium">İş ortağı markaları, bağış oranlarını, onay durumlarını ve detaylarını yönetin.</p>
            </div>

            {/* Bulk admin tools */}
            <Card className="rounded-2xl border-amber-200 bg-amber-50/30">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2"><Database className="h-4 w-4" /> Veri Yönetim Araçları</CardTitle>
                    <CardDescription>Demo verileri temizle ve mevcut marka datalarını ({(seedBrands as unknown[]).length} marka) Firestore'a yükle.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col sm:flex-row gap-2 flex-wrap">
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="outline" disabled={bulkOp !== 'idle'} className="gap-1.5">
                                <Trash2 className="h-4 w-4" /> Tüm Markaları Temizle
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Tüm marka kayıtları silinsin mi?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Bu işlem <strong>kalıcıdır</strong>. Firestore'daki <code>brands</code> koleksiyonundaki tüm dokümanlar silinir.
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
                        Marka Datalarını Yükle ({(seedBrands as unknown[]).length} marka)
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
                                    Önce mevcut tüm marka kayıtları silinir, ardından <strong>{(seedBrands as unknown[]).length} marka</strong> Firestore'a aktarılır.
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
                <Card className="rounded-2xl border-black/5 cursor-pointer hover:shadow-md transition" onClick={() => setStatusFilter('passive')}>
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

            {/* Filters */}
            <Card className="rounded-2xl border-black/5">
                <CardContent className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="search" className="text-sm font-semibold">Ara</Label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="search"
                                    placeholder="Marka adı, kategori..."
                                    className="pl-10 h-10 rounded-xl"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="status" className="text-sm font-semibold">Durum</Label>
                            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
                                <SelectTrigger id="status" className="h-10 rounded-xl">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tümü</SelectItem>
                                    <SelectItem value="approved">Yayında (Aktif)</SelectItem>
                                    <SelectItem value="pending">Onay Bekleyen</SelectItem>
                                    <SelectItem value="passive">Pasif</SelectItem>
                                    <SelectItem value="rejected">Reddedildi</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-end">
                            <p className="text-sm text-muted-foreground">
                                <strong>{filteredBrands.length}</strong> marka gösteriliyor
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Brands List */}
            <Card className="rounded-[2.5rem] border-black/5 shadow-xl overflow-hidden">
                <CardHeader className="bg-muted/30 border-b p-8">
                    <CardTitle className="text-xl font-bold">Markalar ({filteredBrands.length})</CardTitle>
                    <CardDescription>Aktif ve beklemede olan tüm markalar.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="divide-y border-black/5">
                        {filteredBrands && filteredBrands.length > 0 ? (
                            filteredBrands.map(brand => {
                                const isPassive = brand.status === 'Pasif';
                                const isPending = brand.status === 'Beklemede';
                                const isRejected = brand.status === 'Reddedildi';
                                const isApproved = brand.source === 'brands' && brand.status === 'Aktif';
                                return (
                                    <div key={brand.id} className={cn("p-6 flex flex-col md:flex-row items-center justify-between gap-6 hover:bg-muted/30 transition-colors", (isPassive || isRejected) && "opacity-60 grayscale")}>
                                        <div className="flex items-center gap-5 flex-1">
                                            <Avatar className="h-14 w-14 border-2 border-white shadow-lg bg-white">
                                                <AvatarImage src={brand.logoUrl} alt={brand.name} className="object-contain p-1" />
                                                <AvatarFallback className="font-black text-xl">{brand.name?.[0]}</AvatarFallback>
                                            </Avatar>
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <p className="font-black text-lg text-[#1d1d1f] tracking-tight">{brand.name}</p>
                                                    {isApproved && <Badge className="bg-green-600 text-white text-[9px] font-black uppercase">YAYINDA</Badge>}
                                                    {isPending && <Badge className="bg-amber-500 text-white text-[9px] font-black uppercase">ONAY BEKLİYOR</Badge>}
                                                    {isPassive && <Badge variant="secondary" className="text-[9px] font-black uppercase">PASİF</Badge>}
                                                    {isRejected && <Badge variant="destructive" className="text-[9px] font-black uppercase">REDDEDİLDİ</Badge>}
                                                </div>
                                                <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium">
                                                    {brand.donationRate ? <span className="flex items-center gap-1">%{brand.donationRate} Bağış</span> : null}
                                                    {brand.type && <><span>•</span> <span className="capitalize">{brand.type}</span></>}
                                                    {brand.category && <><span>•</span> <span>{brand.category}</span></>}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap" onClick={e => e.stopPropagation()}>
                                            {brand.source === 'brands' && (
                                                <>
                                                    <Button variant="outline" size="sm" className="rounded-xl font-bold h-10 px-4" asChild>
                                                        <Link href={`/market/${brand.slug}`}>
                                                            <Eye className="mr-2 h-4 w-4" /> Profili Gör
                                                        </Link>
                                                    </Button>
                                                </>
                                            )}
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button variant="outline" size="sm" className="rounded-xl font-bold h-10 px-4" onClick={() => handleStartEdit(brand)}>
                                                        <Edit3 className="mr-2 h-4 w-4" /> Düzelt
                                                    </Button>
                                                </DialogTrigger>
                                                {editingBrand?.id === brand.id && (
                                                    <DialogContent className="sm:max-w-[600px] rounded-[2.5rem]">
                                                        <DialogHeader>
                                                            <DialogTitle>{brand.name} - Detaylar</DialogTitle>
                                                            <DialogDescription>Marka bilgilerini düzenleyin.</DialogDescription>
                                                        </DialogHeader>
                                                        <div className="max-h-[70vh] overflow-y-auto pr-1 space-y-6 py-4">

                                                            {/* --- Genel Bilgiler --- */}
                                                            <div className="space-y-4">
                                                                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Genel Bilgiler</p>
                                                                <div className="grid grid-cols-2 gap-4">
                                                                    <div className="space-y-2 col-span-2">
                                                                        <Label htmlFor="edit-name" className="text-sm font-semibold">Marka Adı</Label>
                                                                        <Input
                                                                            id="edit-name"
                                                                            value={editFormData.name || ''}
                                                                            onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                                                                            className="rounded-xl"
                                                                        />
                                                                    </div>
                                                                    <div className="space-y-2">
                                                                        <Label htmlFor="edit-slug" className="text-sm font-semibold">Kısa Ad / Slug</Label>
                                                                        <Input
                                                                            id="edit-slug"
                                                                            value={editFormData.slug || ''}
                                                                            onChange={(e) => setEditFormData({ ...editFormData, slug: e.target.value })}
                                                                            className="rounded-xl"
                                                                            placeholder="ornek-marka"
                                                                        />
                                                                    </div>
                                                                    <div className="space-y-2">
                                                                        <Label htmlFor="edit-category" className="text-sm font-semibold">Kategori</Label>
                                                                        <Input
                                                                            id="edit-category"
                                                                            value={editFormData.category || ''}
                                                                            onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                                                                            className="rounded-xl"
                                                                        />
                                                                    </div>
                                                                    <div className="space-y-2">
                                                                        <Label htmlFor="edit-type" className="text-sm font-semibold">Tür</Label>
                                                                        <Select
                                                                            value={editFormData.type || ''}
                                                                            onValueChange={(v) => setEditFormData({ ...editFormData, type: v as Brand['type'] })}
                                                                        >
                                                                            <SelectTrigger id="edit-type" className="rounded-xl">
                                                                                <SelectValue placeholder="Tür seçin" />
                                                                            </SelectTrigger>
                                                                            <SelectContent>
                                                                                <SelectItem value="brand">Marka</SelectItem>
                                                                                <SelectItem value="cooperative">Kooperatif</SelectItem>
                                                                                <SelectItem value="social">Sosyal Girişim</SelectItem>
                                                                                <SelectItem value="economic">Ekonomik Birlik</SelectItem>
                                                                            </SelectContent>
                                                                        </Select>
                                                                    </div>
                                                                    <div className="space-y-2">
                                                                        <Label htmlFor="edit-donation" className="text-sm font-semibold">Bağış Oranı %</Label>
                                                                        <Input
                                                                            id="edit-donation"
                                                                            type="number"
                                                                            value={editFormData.donationRate ?? 0}
                                                                            onChange={(e) => setEditFormData({ ...editFormData, donationRate: parseFloat(e.target.value) })}
                                                                            className="rounded-xl"
                                                                        />
                                                                    </div>
                                                                    <div className="space-y-2 col-span-2">
                                                                        <Label htmlFor="edit-logo" className="text-sm font-semibold">Logo URL</Label>
                                                                        <Input
                                                                            id="edit-logo"
                                                                            value={editFormData.logoUrl || ''}
                                                                            onChange={(e) => setEditFormData({ ...editFormData, logoUrl: e.target.value })}
                                                                            className="rounded-xl"
                                                                            placeholder="https://..."
                                                                        />
                                                                    </div>
                                                                    <div className="space-y-2 col-span-2">
                                                                        <Label htmlFor="edit-cover" className="text-sm font-semibold">Kapak Fotoğrafı URL</Label>
                                                                        <Input
                                                                            id="edit-cover"
                                                                            value={editFormData.coverPhotoUrl || ''}
                                                                            onChange={(e) => setEditFormData({ ...editFormData, coverPhotoUrl: e.target.value })}
                                                                            className="rounded-xl"
                                                                            placeholder="https://..."
                                                                        />
                                                                    </div>
                                                                    <div className="space-y-2 col-span-2">
                                                                        <Label htmlFor="edit-about" className="text-sm font-semibold">Hakkında</Label>
                                                                        <Textarea
                                                                            id="edit-about"
                                                                            value={editFormData.about || ''}
                                                                            onChange={(e) => setEditFormData({ ...editFormData, about: e.target.value })}
                                                                            className="rounded-xl min-h-[80px]"
                                                                            placeholder="Marka hakkında kısa bilgi..."
                                                                        />
                                                                    </div>
                                                                    <div className="space-y-2 col-span-2">
                                                                        <Label htmlFor="edit-agency" className="text-sm font-semibold">Ajans</Label>
                                                                        <Input
                                                                            id="edit-agency"
                                                                            value={editFormData.agency || ''}
                                                                            onChange={(e) => setEditFormData({ ...editFormData, agency: e.target.value })}
                                                                            className="rounded-xl"
                                                                        />
                                                                    </div>
                                                                    <div className="space-y-2 col-span-2">
                                                                        <Label htmlFor="edit-link" className="text-sm font-semibold">Affiliate / Alışveriş Linki</Label>
                                                                        <Input
                                                                            id="edit-link"
                                                                            value={editFormData.link || ''}
                                                                            onChange={(e) => setEditFormData({ ...editFormData, link: e.target.value })}
                                                                            className="rounded-xl"
                                                                            placeholder="https://..."
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="border-t border-black/5" />

                                                            {/* --- İletişim --- */}
                                                            <div className="space-y-4">
                                                                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">İletişim</p>
                                                                <div className="grid grid-cols-2 gap-4">
                                                                    <div className="space-y-2">
                                                                        <Label htmlFor="edit-email" className="text-sm font-semibold">E-posta</Label>
                                                                        <Input
                                                                            id="edit-email"
                                                                            type="email"
                                                                            value={editFormData._email || ''}
                                                                            onChange={(e) => setEditFormData({ ...editFormData, _email: e.target.value })}
                                                                            className="rounded-xl"
                                                                        />
                                                                    </div>
                                                                    <div className="space-y-2">
                                                                        <Label htmlFor="edit-phone" className="text-sm font-semibold">Telefon</Label>
                                                                        <Input
                                                                            id="edit-phone"
                                                                            value={editFormData._phone || ''}
                                                                            onChange={(e) => setEditFormData({ ...editFormData, _phone: e.target.value })}
                                                                            className="rounded-xl"
                                                                        />
                                                                    </div>
                                                                    <div className="space-y-2 col-span-2">
                                                                        <Label htmlFor="edit-website" className="text-sm font-semibold">Web Sitesi</Label>
                                                                        <Input
                                                                            id="edit-website"
                                                                            value={editFormData._website || ''}
                                                                            onChange={(e) => setEditFormData({ ...editFormData, _website: e.target.value })}
                                                                            className="rounded-xl"
                                                                            placeholder="https://..."
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="border-t border-black/5" />

                                                            {/* --- Sosyal Medya --- */}
                                                            <div className="space-y-4">
                                                                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Sosyal Medya</p>
                                                                <div className="grid grid-cols-2 gap-4">
                                                                    <div className="space-y-2">
                                                                        <Label htmlFor="edit-instagram" className="text-sm font-semibold">Instagram</Label>
                                                                        <Input
                                                                            id="edit-instagram"
                                                                            value={editFormData._instagram || ''}
                                                                            onChange={(e) => setEditFormData({ ...editFormData, _instagram: e.target.value })}
                                                                            className="rounded-xl"
                                                                            placeholder="https://instagram.com/..."
                                                                        />
                                                                    </div>
                                                                    <div className="space-y-2">
                                                                        <Label htmlFor="edit-twitter" className="text-sm font-semibold">Twitter / X</Label>
                                                                        <Input
                                                                            id="edit-twitter"
                                                                            value={editFormData._twitter || ''}
                                                                            onChange={(e) => setEditFormData({ ...editFormData, _twitter: e.target.value })}
                                                                            className="rounded-xl"
                                                                            placeholder="https://x.com/..."
                                                                        />
                                                                    </div>
                                                                    <div className="space-y-2">
                                                                        <Label htmlFor="edit-facebook" className="text-sm font-semibold">Facebook</Label>
                                                                        <Input
                                                                            id="edit-facebook"
                                                                            value={editFormData._facebook || ''}
                                                                            onChange={(e) => setEditFormData({ ...editFormData, _facebook: e.target.value })}
                                                                            className="rounded-xl"
                                                                            placeholder="https://facebook.com/..."
                                                                        />
                                                                    </div>
                                                                    <div className="space-y-2">
                                                                        <Label htmlFor="edit-linkedin" className="text-sm font-semibold">LinkedIn</Label>
                                                                        <Input
                                                                            id="edit-linkedin"
                                                                            value={editFormData._linkedin || ''}
                                                                            onChange={(e) => setEditFormData({ ...editFormData, _linkedin: e.target.value })}
                                                                            className="rounded-xl"
                                                                            placeholder="https://linkedin.com/..."
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <DialogFooter>
                                                            <Button variant="outline" onClick={() => setEditingBrand(null)} className="rounded-xl font-bold">Vazgeç</Button>
                                                            <Button onClick={handleSaveEdit} className="rounded-xl font-bold">Kaydet</Button>
                                                        </DialogFooter>
                                                    </DialogContent>
                                                )}
                                            </Dialog>
                                            {brand.source === 'brands' && (
                                                <>
                                                    <TransferBrandAdminDialog brand={brand} allUsers={allUsers || null} onAssign={handleAssignBrandAdmin} />
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="rounded-xl font-bold h-10 px-4"
                                                        onClick={() => handleToggleStatus(brand.id, brand.status || 'Aktif')}
                                                    >
                                                        {isPassive ? <><Power className="mr-2 h-4 w-4" /> Aktif</> : <><PowerOff className="mr-2 h-4 w-4" /> Pasife</>}
                                                    </Button>
                                                </>
                                            )}
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-10 w-10 text-destructive hover:bg-destructive/10 rounded-xl" aria-label="Sil">
                                                        <Trash2 className="h-5 w-5" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent className="rounded-[2.5rem]">
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle className="text-xl font-bold">{brand.name} markasını silmek istiyor musunuz?</AlertDialogTitle>
                                                        <AlertDialogDescription className="text-base font-medium">
                                                            Bu işlem geri alınamaz. Marka ve ilişkili tüm veriler platformdan kalıcı olarak silinecektir.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter className="gap-2">
                                                        <AlertDialogCancel className="rounded-2xl font-bold">Vazgeç</AlertDialogCancel>
                                                        <AlertDialogAction
                                                            className={cn(buttonVariants({ variant: "destructive" }), "rounded-2xl font-bold")}
                                                            onClick={() => handleRemove(brand.id, brand.name)}
                                                        >
                                                            Evet, Kalıcı Olarak Sil
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="p-20 flex flex-col items-center justify-center text-center gap-3">
                                <Inbox className="h-12 w-12 text-muted-foreground/30" />
                                <p className="text-muted-foreground italic">Filtrelerinize uygun marka bulunmuyor.</p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
