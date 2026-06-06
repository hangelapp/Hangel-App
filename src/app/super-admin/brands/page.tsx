
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import React, { useEffect, useMemo, useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, deleteDoc, doc, query, where, updateDoc, getDoc, addDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getApp } from 'firebase/app';
import { Loader2, Inbox } from 'lucide-react';
import type { Brand } from "@/lib/types";
import { COLLECTIONS } from '@/firebase/collections';

import { BrandFiltersCard } from './_components/brand-filters-card';
import { BrandListRow } from './_components/brand-list-row';
import { BrandStatsCards } from './_components/brand-stats-cards';
import {
    type BrandApplication,
    type BrandExtra,
    type BrandItem,
    type BrandRole,
    type EditFormData,
    type SimpleUser,
    type SortOption,
    type StatusFilter,
} from './_components/types';

export default function BrandsPage() {
    const { toast } = useToast();
    const db = useFirestore();
    const { user: authUser } = useUser();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [sortBy, setSortBy] = useState<SortOption>('default');
    const [editingBrand, setEditingBrand] = useState<BrandItem | null>(null);
    const [editFormData, setEditFormData] = useState<EditFormData>({});
    const [logoUploading, setLogoUploading] = useState(false);

    // Load approved brands
    const brandsQuery = useMemoFirebase(() => collection(db, COLLECTIONS.brands), [db]);
    const { data: brands, isLoading: brandsLoading } = useCollection<Brand>(brandsQuery);

    // Load all brand applications (any status)
    const applicationsQuery = useMemoFirebase(() =>
        query(collection(db, COLLECTIONS.applications), where('entityType', '==', 'BRAND')),
        [db]
    );
    const { data: applications, isLoading: appsLoading } = useCollection(applicationsQuery);

    // Yetkili atama için tüm kullanıcılar
    const usersQuery = useMemoFirebase(() => collection(db, COLLECTIONS.users), [db]);
    const { data: allUsers } = useCollection<SimpleUser>(usersQuery);

    // /api/offers affiliate kataloğu (Tune/ReklamAction'dan gelen markalar) —
    // read-only kayıtlar (Firestore'da doc'u yok). Kullanıcı talebi üzerine
    // (2026-05-23) marka listesinde GÖRÜNÜR olarak listelenir; ancak yalnız
    // "Profili Gör" butonu açılır (düzenle/yetkili/pasife/sil işlemleri API
    // kataloğunda anlamsız çünkü kalıcı doc yok).
    const [apiBrands, setApiBrands] = useState<Brand[]>([]);
    const [apiLoading, setApiLoading] = useState(true);
    useEffect(() => {
        let cancelled = false;
        // /api/offers, market sayfasıyla aynı kontratta array döner (objet değil).
        fetch('/api/offers')
            .then(r => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
            .then((data: Brand[]) => {
                if (cancelled) return;
                setApiBrands(Array.isArray(data) ? data : []);
            })
            .catch(err => {
                if (cancelled) return;
                console.warn('[super-admin/brands] /api/offers fetch failed:', err);
                setApiBrands([]);
            })
            .finally(() => {
                if (!cancelled) setApiLoading(false);
            });
        return () => { cancelled = true; };
    }, []);

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

        // Add API offers (affiliate katalog — yalnız okuma). brandsLookup ile
        // dedupe: Firestore'da aynı slug/id varsa API kaydını atla (Firestore
        // kaydı "yönetilebilir" olduğundan öncelikli gösterilir).
        const existingKeys = new Set<string>();
        if (brands) brands.forEach(b => { if (b.id) existingKeys.add(b.id); if (b.slug) existingKeys.add(`slug:${b.slug}`); });
        if (apiBrands.length > 0) {
            apiBrands.forEach(b => {
                if (b.id && existingKeys.has(b.id)) return;
                if (b.slug && existingKeys.has(`slug:${b.slug}`)) return;
                combinedList.push({
                    ...b,
                    source: 'api' as const,
                    status: 'Aktif',
                });
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

        // Sort
        const statusOrder: Record<string, number> = { Aktif: 0, Beklemede: 1, Pasif: 2, Reddedildi: 3 };
        const sorted = [...filtered];
        switch (sortBy) {
            case 'nameAsc':      sorted.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'tr')); break;
            case 'nameDesc':     sorted.sort((a, b) => (b.name || '').localeCompare(a.name || '', 'tr')); break;
            case 'donationDesc': sorted.sort((a, b) => (b.donationRate || 0) - (a.donationRate || 0)); break;
            case 'donationAsc':  sorted.sort((a, b) => (a.donationRate || 0) - (b.donationRate || 0)); break;
            case 'status':       sorted.sort((a, b) => (statusOrder[a.status || ''] ?? 99) - (statusOrder[b.status || ''] ?? 99)); break;
            default: break;
        }

        return sorted;
    }, [brands, applications, apiBrands, statusFilter, searchTerm, sortBy]);

    const handleToggleStatus = async (id: string, currentStatus: string) => {
        const isPassive = currentStatus === 'Pasif';
        const newStatus = isPassive ? 'Aktif' : 'Pasif';
        const brandRef = doc(db, COLLECTIONS.brands, id);
        // API source markaları için Firestore doc henüz yok → setDoc merge
        // ile otomatik oluştur (API verisini import eder). Mevcut brands için
        // de güvenli (merge: true sadece güncellenen alanları yazar).
        const item = filteredBrands.find(b => b.id === id);
        try {
            if (item?.source === 'api') {
                const { source: _src, ...apiData } = item as BrandItem & { source?: string };
                await setDoc(brandRef, { ...apiData, status: newStatus }, { merge: true });
            } else {
                await setDoc(brandRef, { status: newStatus }, { merge: true });
            }
            toast({
                title: isPassive ? "Marka Aktifleştirildi" : "Marka Pasife Alındı",
                description: "Durum değişikliği sisteme yansıtıldı."
            });
        } catch (e) {
            const code = (e as { code?: string } | null)?.code;
            toast({
                variant: 'destructive',
                title: 'Durum değiştirilemedi',
                description: code === 'permission-denied'
                    ? 'Bu işlem için super-admin yetkisi gerekli.'
                    : (e instanceof Error ? e.message : 'Beklenmeyen hata.'),
            });
        }
    };

    const handleRemove = async (id: string, name: string) => {
        // Üç senaryo:
        // 1. Application row → applications koleksiyonundan hard delete (başvuru)
        // 2. API source → brands'e setDoc merge ile {status:'Silindi'} yaz (soft delete:
        //    affiliate listesi yenilense bile market/super-admin filtreleri gizler)
        // 3. Normal brand row → brands koleksiyonundan hard delete (kalıcı)
        const item = filteredBrands.find(b => b.id === id);
        try {
            if (item?.source === 'applications') {
                await deleteDoc(doc(db, COLLECTIONS.applications, id));
                toast({ variant: 'destructive', title: 'Başvuru Silindi', description: `${name} platformdan silindi.` });
                return;
            }
            const brandRef = doc(db, COLLECTIONS.brands, id);
            if (item?.source === 'api') {
                const { source: _src, ...apiData } = item as BrandItem & { source?: string };
                await setDoc(brandRef, { ...apiData, status: 'Silindi' }, { merge: true });
                toast({
                    variant: 'destructive',
                    title: 'Marka Gizlendi',
                    description: `${name} affiliate kataloğundan gizlendi (Silindi). Market ve admin listelerinde görünmez.`,
                });
                return;
            }
            // Normal brand → hard delete
            await deleteDoc(brandRef);
            toast({ variant: 'destructive', title: 'Marka Kaldırıldı', description: `${name} platformdan kalıcı olarak silindi.` });
        } catch (e) {
            const code = (e as { code?: string } | null)?.code;
            toast({
                variant: 'destructive',
                title: 'Silme başarısız',
                description: code === 'permission-denied'
                    ? 'Bu işlem için super-admin yetkisi gerekli.'
                    : (e instanceof Error ? e.message : 'Beklenmeyen hata.'),
            });
        }
    };

    const handleAssignBrandAdmin = async (brandId: string, newUserId: string, newUserName: string, role: BrandRole) => {
        try {
            // 1. Brand doc'una yetkili kullanıcıyı işaretle (yalnızca Genel Yönetici ana yetkili olarak kaydedilir)
            if (role === 'Genel Yönetici') {
                await updateDoc(doc(db, COLLECTIONS.brands, brandId), { adminUserId: newUserId });
            }

            // 2. Kullanıcıya ngo-admin rolü ver + bağlı brand ID'sini sakla
            //    Super-admin'lerin rolü değişmez (yetkisini kaybetmesin)
            const userSnap = await getDoc(doc(db, COLLECTIONS.users, newUserId));
            const currentRole = userSnap.exists() ? (userSnap.data() as { role?: string }).role : null;
            const updatePayload: Record<string, unknown> = { managedBrandId: brandId, brandRoleTitle: role };
            if (currentRole !== 'super-admin') {
                updatePayload.role = 'ngo-admin';
            }
            await updateDoc(doc(db, COLLECTIONS.users, newUserId), updatePayload);

            // 3. Davet kaydı (audit + bildirim için)
            await addDoc(collection(db, COLLECTIONS.userInvitations), {
                brandId,
                inviteeUserId: newUserId,
                inviteeName: newUserName,
                role,
                status: 'accepted',
                invitedBy: 'super-admin',
                invitedAt: serverTimestamp(),
                autoAcceptedBy: 'super-admin',
            });

            // 4. Yetkilendirilen kullanıcıya uygulama içi bildirim gönder.
            //    Bildirim oluşturulamasa bile yetkilendirme geri alınmaz.
            const brandName = (brands || []).find(b => b.id === brandId)?.name ?? 'Marka';
            try {
                await addDoc(collection(db, COLLECTIONS.notifications), {
                    userId: newUserId,
                    type: 'authorization',
                    title: 'Yetkilendirildiniz',
                    body: `${brandName} için ${role} olarak yetkilendirildiniz.`,
                    data: { entityId: brandId, entityType: 'brand', role },
                    read: false,
                    createdAt: serverTimestamp(),
                    createdBy: 'super-admin',
                });
            } catch (notifErr) {
                console.warn('Yetkilendirme bildirimi oluşturulamadı:', notifErr);
            }

            toast({
                title: 'Yetkili Atandı',
                description: `${newUserName} bu marka için "${role}" olarak yetkilendirildi.`,
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

    const handleRevokeBrandAdmin = async (invitationId: string, inviteeName: string) => {
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

    const handleUpdateBrandAdminRole = async (invitationId: string, inviteeUserId: string, newRole: BrandRole) => {
        try {
            await updateDoc(doc(db, COLLECTIONS.userInvitations, invitationId), { role: newRole });
            await updateDoc(doc(db, COLLECTIONS.users, inviteeUserId), { brandRoleTitle: newRole });
            toast({
                title: 'Yetki Güncellendi',
                description: `Yetkili rolü "${newRole}" olarak güncellendi.`,
            });
        } catch (e) {
            console.error('Update brand admin role failed:', e);
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

    const handleStartEdit = (brand: BrandItem) => {
        setEditingBrand(brand);
        const b = brand as BrandExtra;
        setEditFormData({
            name: brand.name,
            slug: brand.slug,
            category: brand.category,
            categories: Array.isArray((brand as Brand & { categories?: string[] }).categories)
                ? [...((brand as Brand & { categories?: string[] }).categories || [])]
                : [],
            type: brand.type,
            logoUrl: brand.logoUrl,
            coverPhotoUrl: brand.coverPhotoUrl,
            about: brand.about,
            donationRate: brand.donationRate,
            agency: brand.agency,
            link: brand.link || '',
            // Flatten contact fields for form state
            _email: brand.contact?.email || b.email || '',
            _phone: b.phone || '',
            _website: brand.contact?.website || b.website || '',
            _instagram: brand.contact?.social?.instagram || '',
            _twitter: brand.contact?.social?.twitter || '',
            _facebook: brand.contact?.social?.facebook || '',
            _linkedin: brand.contact?.social?.linkedin || '',
            _country: b.address?.country || 'Türkiye',
            _city: b.address?.city || '',
            _district: b.address?.district || '',
            _neighborhood: b.address?.neighborhood || '',
            _street: b.address?.street || '',
        });
    };

    const handleLogoFile = async (file: File, kind: 'logo' | 'cover') => {
        if (!editingBrand?.id) return;
        // Görsel yüklemesi: brands ve api source için geçerli (api save'de
        // setDoc merge ile brand doc otomatik oluşturuluyor). Sadece başvurular
        // hâlâ engelli — başvuru önce onaylanmalı.
        if (editingBrand.source === 'applications') {
            toast({
                variant: 'destructive',
                title: 'Görsel yüklenemez',
                description: 'Önce başvuruyu onaylayın, sonra görsel yükleyin.',
            });
            return;
        }
        // 5MB cap
        if (file.size > 5 * 1024 * 1024) {
            toast({ variant: 'destructive', title: 'Dosya çok büyük', description: 'Maksimum 5MB yükleyebilirsiniz.' });
            return;
        }
        if (!/^image\/(png|jpe?g|webp|svg\+xml)$/.test(file.type)) {
            toast({ variant: 'destructive', title: 'Geçersiz format', description: 'Sadece JPG, PNG, WebP veya SVG kabul edilir.' });
            return;
        }
        setLogoUploading(true);
        const field = kind === 'logo' ? 'logoUrl' : 'coverPhotoUrl';
        try {
            // 1) Firebase Storage'a yükle
            const storage = getStorage(getApp());
            const path = `brands/${editingBrand.id}/${kind}-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
            const ref = storageRef(storage, path);
            await uploadBytes(ref, file, { contentType: file.type });
            const url = await getDownloadURL(ref);
            setEditFormData(prev => ({ ...prev, [field]: url }));
            // Logo → super-admin "Arşiv" sekmesine marka evrakı olarak ayna (best-effort).
            if (kind === 'logo') {
                try {
                    const token = await authUser?.getIdToken();
                    if (token) {
                        await fetch('/api/ngo/archive', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                            body: JSON.stringify({ docType: 'Logo', fileUrl: url, entityType: 'brand', entityId: editingBrand.id, entityName: editingBrand.name || '' }),
                        });
                    }
                } catch { /* arşiv aynası best-effort */ }
            }
            toast({ title: 'Yüklendi', description: 'Görsel Firebase Storage\'a yüklendi. Kaydet butonuna basmayı unutmayın.' });
        } catch (err) {
            console.warn('Storage upload failed, falling back to Base64:', err);
            // 2) Storage erişimi yoksa Base64 data URL fallback (en fazla 500KB)
            if (file.size > 500 * 1024) {
                toast({
                    variant: 'destructive',
                    title: 'Storage erişilemez ve dosya çok büyük',
                    description: 'Storage upload başarısız oldu, Base64 fallback için maksimum 500KB önerilir. Dosyayı küçültün veya URL girin.',
                });
                setLogoUploading(false);
                return;
            }
            const reader = new FileReader();
            const dataUrl: string = await new Promise((resolve, reject) => {
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = () => reject(reader.error);
                reader.readAsDataURL(file);
            });
            setEditFormData(prev => ({ ...prev, [field]: dataUrl }));
            toast({
                title: 'Base64 olarak gömüldü',
                description: 'Storage erişilemediği için görsel Base64 data URL olarak alana eklendi. Kaydet butonuna basın.',
            });
        } finally {
            setLogoUploading(false);
        }
    };

    const handleSaveEdit = async () => {
        if (!editingBrand || !editingBrand.id) return;

        // Başvurular (applications) brands koleksiyonunda yok — direkt düzenleme
        // yerine onaylama akışına yönlendir.
        if (editingBrand.source === 'applications') {
            toast({
                variant: 'destructive',
                title: "Bu kayıt düzenlenemez",
                description: "Önce başvuruyu onaylayın, sonra düzenleyin.",
            });
            return;
        }

        try {
            const fd = editFormData;
            // Firestore undefined/NaN değerleri reddeder (ignoreUndefinedProperties
            // ayarlı değil). Boş metin alanlarını '' , geçersiz sayıyı 0 yap.
            const donationRate = Number.isFinite(fd.donationRate as number) ? (fd.donationRate as number) : 0;
            const brandRef = doc(db, COLLECTIONS.brands, editingBrand.id);
            // API source markaları için Firestore doc yok → setDoc merge ile
            // hem create hem update'i tek operasyonla yapar (otomatik import).
            await setDoc(brandRef, {
                name: fd.name || '',
                slug: fd.slug || '',
                category: fd.category || '',
                categories: Array.isArray(fd.categories) ? fd.categories.filter(Boolean) : [],
                type: fd.type || 'brand',
                logoUrl: fd.logoUrl || '',
                coverPhotoUrl: fd.coverPhotoUrl || '',
                about: fd.about || '',
                donationRate,
                agency: fd.agency || '',
                link: fd.link || '',
                phone: fd._phone || '',
                contact: {
                    email: fd._email || '',
                    phone: fd._phone || '',
                    website: fd._website || '',
                    social: {
                        instagram: fd._instagram || '',
                        twitter: fd._twitter || '',
                        facebook: fd._facebook || '',
                        linkedin: fd._linkedin || '',
                    },
                },
                address: {
                    country: fd._country || 'Türkiye',
                    city: fd._city || '',
                    district: fd._district || '',
                    neighborhood: fd._neighborhood || '',
                    street: fd._street || '',
                },
            });
            toast({
                title: "Marka Güncellendi",
                description: "Değişiklikler başarıyla kaydedildi."
            });
            setEditingBrand(null);
        } catch (e) {
            console.error('Brand update failed:', e);
            const code = (e as { code?: string } | null)?.code;
            const message = e instanceof Error ? e.message : 'Marka güncellenemedi. Lütfen tekrar deneyin.';
            toast({
                variant: 'destructive',
                title: "Marka güncellenemedi",
                description: code === 'permission-denied'
                    ? 'Bu işlem için super-admin yetkisi gerekli.'
                    : message,
            });
        }
    };

    const isLoading = brandsLoading || appsLoading || apiLoading;

    // useMemo, conditional return'den ÖNCE çağrılmalı (Rules of Hooks)
    const stats = useMemo(() => {
        const approved = (brands || []).filter((b) => ((b as Brand & { status?: string }).status || 'Aktif') === 'Aktif').length;
        const passive = (brands || []).filter((b) => (b as Brand & { status?: string }).status === 'Pasif').length;
        const pending = (applications || []).filter((a) => (a as { status?: string }).status === 'Beklemede').length;
        const rejected = (applications || []).filter((a) => (a as { status?: string }).status === 'Reddedildi').length;
        // API kataloğu Firestore'da yok — toplam'a dahil ama "approved" kategorisinden ayrı.
        const api = apiBrands.length;
        return { approved, passive, pending, rejected, api, total: approved + passive + pending + rejected + api };
    }, [brands, applications, apiBrands]);

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

            <BrandStatsCards stats={stats} onStatusFilterChange={setStatusFilter} />

            <BrandFiltersCard
                searchTerm={searchTerm}
                onSearchTermChange={setSearchTerm}
                statusFilter={statusFilter}
                onStatusFilterChange={setStatusFilter}
                sortBy={sortBy}
                onSortByChange={setSortBy}
                resultCount={filteredBrands.length}
            />

            {/* Brands List */}
            <Card className="rounded-[2.5rem] border-black/5 shadow-xl overflow-hidden">
                <CardHeader className="bg-muted/30 border-b p-8">
                    <CardTitle className="text-xl font-bold">Markalar ({filteredBrands.length})</CardTitle>
                    <CardDescription>Aktif ve beklemede olan tüm markalar.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="divide-y border-black/5">
                        {filteredBrands && filteredBrands.length > 0 ? (
                            filteredBrands.map(brand => (
                                <BrandListRow
                                    key={brand.id}
                                    brand={brand}
                                    editingBrand={editingBrand}
                                    editFormData={editFormData}
                                    onEditFormDataChange={setEditFormData}
                                    logoUploading={logoUploading}
                                    allUsers={allUsers || null}
                                    onStartEdit={handleStartEdit}
                                    onCancelEdit={() => setEditingBrand(null)}
                                    onSaveEdit={handleSaveEdit}
                                    onLogoFile={handleLogoFile}
                                    onToggleStatus={handleToggleStatus}
                                    onRemove={handleRemove}
                                    onAssignBrandAdmin={handleAssignBrandAdmin}
                                    onRevokeBrandAdmin={handleRevokeBrandAdmin}
                                    onUpdateBrandAdminRole={handleUpdateBrandAdminRole}
                                />
                            ))
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
