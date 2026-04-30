
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
import { collection, doc, query, where } from 'firebase/firestore';
import { Loader2, Store, Trash2, Power, PowerOff, Pencil, Search, Inbox } from 'lucide-react';
import type { Brand } from "@/lib/types";
import Link from 'next/link';

type BrandItem = Brand & { id: string; source?: 'brands' | 'applications'; status?: string };

export default function BrandsPage() {
    const { toast } = useToast();
    const db = useFirestore();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'pending' | 'passive' | 'rejected'>('all');
    const [editingBrand, setEditingBrand] = useState<BrandItem | null>(null);
    const [editFormData, setEditFormData] = useState<Partial<BrandItem>>({});

    // Load approved brands
    const brandsQuery = useMemoFirebase(() => collection(db, 'brands'), [db]);
    const { data: brands, isLoading: brandsLoading } = useCollection<Brand>(brandsQuery);

    // Load all brand applications (any status)
    const applicationsQuery = useMemoFirebase(() =>
        query(collection(db, 'applications'), where('entityType', '==', 'BRAND')),
        [db]
    );
    const { data: applications, isLoading: appsLoading } = useCollection(applicationsQuery);

    // Combine and filter brands
    const filteredBrands = useMemo(() => {
        const combinedList: BrandItem[] = [];

        // Add approved brands
        if (brands) {
            brands.forEach(brand => {
                combinedList.push({
                    ...brand,
                    source: 'brands',
                    status: (brand as any).status || 'Aktif'
                });
            });
        }

        // Add applications (all statuses)
        if (applications) {
            applications.forEach((app: any) => {
                // Onaylanmış başvurular zaten brands koleksiyonunda; çift göstermemek için atla
                if (app.status === 'Onaylandı') return;
                combinedList.push({
                    id: app.id,
                    name: app.name,
                    slug: app.name?.toLowerCase().replace(/\s+/g, '-') || '',
                    logoUrl: '',
                    coverPhotoUrl: '',
                    donationRate: 0,
                    type: app.brandStatus || 'Ticari',
                    category: app.sector || 'Diğer',
                    status: app.status || 'Beklemede',
                    ...app,
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
            _email: brand.contact?.email || (brand as any).email || '',
            _phone: (brand as any).phone || '',
            _website: brand.contact?.website || (brand as any).website || '',
            _instagram: brand.contact?.social?.instagram || '',
            _twitter: brand.contact?.social?.twitter || '',
            _facebook: brand.contact?.social?.facebook || '',
            _linkedin: brand.contact?.social?.linkedin || '',
        } as any);
    };

    const handleSaveEdit = async () => {
        if (!editingBrand || !editingBrand.id) return;

        try {
            const fd = editFormData as any;
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
        } catch (error) {
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
        const approved = (brands || []).filter((b: any) => (b.status || 'Aktif') === 'Aktif').length;
        const passive = (brands || []).filter((b: any) => b.status === 'Pasif').length;
        const pending = (applications || []).filter((a: any) => a.status === 'Beklemede').length;
        const rejected = (applications || []).filter((a: any) => a.status === 'Reddedildi').length;
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
                            <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
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
                                        <div className="flex items-center gap-3 w-full md:w-auto">
                                            {brand.source === 'brands' && (
                                                <Button variant="outline" size="sm" className="flex-1 md:flex-none rounded-xl font-bold h-10 px-5" asChild>
                                                    <Link href={`/market/${brand.slug}`}>Mağazayı Gör</Link>
                                                </Button>
                                            )}
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button variant="outline" size="sm" className="flex-1 md:flex-none rounded-xl font-bold h-10 px-5" onClick={() => handleStartEdit(brand)}>
                                                        <Pencil className="mr-2 h-4 w-4" /> Düzenle
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
                                                                            value={(editFormData as any).agency || ''}
                                                                            onChange={(e) => setEditFormData({ ...editFormData, agency: e.target.value } as any)}
                                                                            className="rounded-xl"
                                                                        />
                                                                    </div>
                                                                    <div className="space-y-2 col-span-2">
                                                                        <Label htmlFor="edit-link" className="text-sm font-semibold">Affiliate / Alışveriş Linki</Label>
                                                                        <Input
                                                                            id="edit-link"
                                                                            value={(editFormData as any).link || ''}
                                                                            onChange={(e) => setEditFormData({ ...editFormData, link: e.target.value } as any)}
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
                                                                            value={(editFormData as any)._email || ''}
                                                                            onChange={(e) => setEditFormData({ ...editFormData, _email: e.target.value } as any)}
                                                                            className="rounded-xl"
                                                                        />
                                                                    </div>
                                                                    <div className="space-y-2">
                                                                        <Label htmlFor="edit-phone" className="text-sm font-semibold">Telefon</Label>
                                                                        <Input
                                                                            id="edit-phone"
                                                                            value={(editFormData as any)._phone || ''}
                                                                            onChange={(e) => setEditFormData({ ...editFormData, _phone: e.target.value } as any)}
                                                                            className="rounded-xl"
                                                                        />
                                                                    </div>
                                                                    <div className="space-y-2 col-span-2">
                                                                        <Label htmlFor="edit-website" className="text-sm font-semibold">Web Sitesi</Label>
                                                                        <Input
                                                                            id="edit-website"
                                                                            value={(editFormData as any)._website || ''}
                                                                            onChange={(e) => setEditFormData({ ...editFormData, _website: e.target.value } as any)}
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
                                                                            value={(editFormData as any)._instagram || ''}
                                                                            onChange={(e) => setEditFormData({ ...editFormData, _instagram: e.target.value } as any)}
                                                                            className="rounded-xl"
                                                                            placeholder="https://instagram.com/..."
                                                                        />
                                                                    </div>
                                                                    <div className="space-y-2">
                                                                        <Label htmlFor="edit-twitter" className="text-sm font-semibold">Twitter / X</Label>
                                                                        <Input
                                                                            id="edit-twitter"
                                                                            value={(editFormData as any)._twitter || ''}
                                                                            onChange={(e) => setEditFormData({ ...editFormData, _twitter: e.target.value } as any)}
                                                                            className="rounded-xl"
                                                                            placeholder="https://x.com/..."
                                                                        />
                                                                    </div>
                                                                    <div className="space-y-2">
                                                                        <Label htmlFor="edit-facebook" className="text-sm font-semibold">Facebook</Label>
                                                                        <Input
                                                                            id="edit-facebook"
                                                                            value={(editFormData as any)._facebook || ''}
                                                                            onChange={(e) => setEditFormData({ ...editFormData, _facebook: e.target.value } as any)}
                                                                            className="rounded-xl"
                                                                            placeholder="https://facebook.com/..."
                                                                        />
                                                                    </div>
                                                                    <div className="space-y-2">
                                                                        <Label htmlFor="edit-linkedin" className="text-sm font-semibold">LinkedIn</Label>
                                                                        <Input
                                                                            id="edit-linkedin"
                                                                            value={(editFormData as any)._linkedin || ''}
                                                                            onChange={(e) => setEditFormData({ ...editFormData, _linkedin: e.target.value } as any)}
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
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="flex-1 md:flex-none rounded-xl font-bold h-10 px-5"
                                                    onClick={() => handleToggleStatus(brand.id, brand.status || 'Aktif')}
                                                >
                                                    {isPassive ? <><Power className="mr-2 h-4 w-4" /> Aktif Et</> : <><PowerOff className="mr-2 h-4 w-4" /> Pasife Al</>}
                                                </Button>
                                            )}
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-10 w-10 text-destructive hover:bg-destructive/10 rounded-xl">
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
