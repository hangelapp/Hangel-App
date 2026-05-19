
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import React, { useMemo, useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { collection, doc, query, where, updateDoc, getDoc, addDoc, serverTimestamp, getDocs, setDoc, writeBatch } from 'firebase/firestore';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getApp } from 'firebase/app';
import { Loader2, Inbox } from 'lucide-react';
import type { Brand } from "@/lib/types";
import seedBrands from '../../../../docs/database-exports/brands.json';
import { COLLECTIONS } from '@/firebase/collections';

import { BrandBulkToolsCard } from './_components/brand-bulk-tools-card';
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
    type StatusFilter,
} from './_components/types';

export default function BrandsPage() {
    const { toast } = useToast();
    const db = useFirestore();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [editingBrand, setEditingBrand] = useState<BrandItem | null>(null);
    const [editFormData, setEditFormData] = useState<EditFormData>({});
    const [bulkOp, setBulkOp] = useState<'idle' | 'clearing' | 'seeding'>('idle');
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
        const brandRef = doc(db, COLLECTIONS.brands, id);
        updateDocumentNonBlocking(brandRef, { status: isPassive ? 'Aktif' : 'Pasif' });

        toast({
            title: isPassive ? "Marka Aktifleştirildi" : "Marka Pasife Alındı",
            description: "Durum değişikliği sisteme yansıtıldı."
        });
    };

    const handleRemove = (id: string, name: string) => {
        const brandRef = doc(db, COLLECTIONS.brands, id);
        deleteDocumentNonBlocking(brandRef);
        toast({
            variant: 'destructive',
            title: "Marka Kaldırıldı",
            description: `${name} platformdan kalıcı olarak silindi.`
        });
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

    const handleClearAll = async () => {
        setBulkOp('clearing');
        try {
            const snap = await getDocs(collection(db, COLLECTIONS.brands));
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
                await setDoc(doc(db, COLLECTIONS.brands, b.id), { ...b, status: 'Aktif' }, { merge: true });
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
        const b = brand as BrandExtra;
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

        try {
            const fd = editFormData;
            const brandRef = doc(db, COLLECTIONS.brands, editingBrand.id);
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

            <BrandBulkToolsCard
                bulkOp={bulkOp}
                seedCount={(seedBrands as unknown[]).length}
                onClearAll={handleClearAll}
                onSeed={handleSeed}
                onResetAndSeed={handleResetAndSeed}
            />

            <BrandStatsCards stats={stats} onStatusFilterChange={setStatusFilter} />

            <BrandFiltersCard
                searchTerm={searchTerm}
                onSearchTermChange={setSearchTerm}
                statusFilter={statusFilter}
                onStatusFilterChange={setStatusFilter}
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
