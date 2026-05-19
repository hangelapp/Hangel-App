
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
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getApp } from 'firebase/app';
import { Loader2, Trash2, Power, PowerOff, Search, Inbox, Eye, UserCog, CheckCircle, XCircle, Edit3, Database, Upload, RefreshCw, ImageUp, X } from 'lucide-react';
import type { Brand } from "@/lib/types";
import Link from 'next/link';
import seedBrands from '../../../../docs/database-exports/brands.json';
import { neighborhoodsData } from '@/lib/neighborhoods-data';
import { COLLECTIONS } from '@/firebase/collections';

type BrandItem = Brand & { id: string; source?: 'brands' | 'applications'; status?: string };

type EditFormData = Partial<BrandItem> & {
    _email?: string;
    _phone?: string;
    _website?: string;
    _instagram?: string;
    _twitter?: string;
    _facebook?: string;
    _linkedin?: string;
    _country?: string;
    _city?: string;
    _district?: string;
    _neighborhood?: string;
    _street?: string;
    agency?: string;
    link?: string;
};

// Brand'in opsiyonel olarak Firestore'da tutulan, type tanımında olmayan ekstra alanları.
// type Brand içerisinde address yok; type genişletmek için kullanılır.
type BrandExtra = Brand & {
    phone?: string;
    email?: string;
    website?: string;
    address?: {
        country?: string;
        city?: string;
        district?: string;
        neighborhood?: string;
        street?: string;
    };
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

const BRAND_ROLE_OPTIONS = [
    'Genel Yönetici',
    'Marka Yöneticisi',
    'Pazarlama Yöneticisi',
    'Finans Yöneticisi',
] as const;
type BrandRole = typeof BRAND_ROLE_OPTIONS[number];

interface BrandInvitation {
    id: string;
    brandId?: string;
    inviteeUserId?: string;
    inviteeName?: string;
    role?: string;
    status?: string;
    invitedAt?: { toDate?: () => Date } | Date | null;
}

const TransferBrandAdminDialog = ({ brand, allUsers, onAssign, onRevoke }: {
    brand: BrandItem;
    allUsers: SimpleUser[] | null;
    onAssign: (brandId: string, userId: string, userName: string, role: BrandRole) => Promise<void>;
    onRevoke: (invitationId: string, inviteeName: string) => Promise<void>;
}) => {
    const db = useFirestore();
    const [open, setOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRole, setSelectedRole] = useState<BrandRole>('Genel Yönetici');
    const [submitting, setSubmitting] = useState(false);

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
        () => open ? query(collection(db, COLLECTIONS.userInvitations), where('brandId', '==', brand.id)) : null,
        [db, brand.id, open],
    );
    const { data: invitations } = useCollection<BrandInvitation>(invitationsQuery);

    const activeInvitations = useMemo(
        () => (invitations || []).filter(i => i.status !== 'revoked'),
        [invitations],
    );

    const handleAssign = async () => {
        if (!matchedUser) return;
        setSubmitting(true);
        try {
            await onAssign(brand.id, matchedUser.id, matchedUser.name || matchedUser.displayName || 'Üye', selectedRole);
            setOpen(false);
            setSearchTerm('');
            setSelectedRole('Genel Yönetici');
        } finally {
            setSubmitting(false);
        }
    };

    const formatDate = (raw: BrandInvitation['invitedAt']): string => {
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
                        <strong>{brand.name}</strong> markası için telefon veya e-posta ile kullanıcı bulup rol atayın.
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
                                    return (
                                        <div key={inv.id} className="flex items-center gap-2 p-2 rounded-xl bg-white">
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={userInfo?.avatarUrl} />
                                                <AvatarFallback className="text-xs font-bold">{displayName.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-sm truncate">{displayName}</p>
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    <Badge variant="secondary" className="text-[9px] font-bold">{inv.role || 'Yönetici'}</Badge>
                                                    {inv.invitedAt && (
                                                        <span className="text-[10px] text-muted-foreground">{formatDate(inv.invitedAt)}</span>
                                                    )}
                                                </div>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 text-destructive hover:bg-destructive/10 rounded-lg"
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
                        <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as BrandRole)}>
                            <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {BRAND_ROLE_OPTIONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
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
                        Atanan kullanıcı seçili rol ile yetkilendirilir ve bu marka için yönetim panelini kullanabilir.
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
                                                                        <Label htmlFor="edit-logo" className="text-sm font-semibold">Logo</Label>
                                                                        <div className="flex items-center gap-3">
                                                                            {editFormData.logoUrl ? (
                                                                                <Avatar className="h-14 w-14 border-2 border-white shadow-md bg-white shrink-0">
                                                                                    <AvatarImage src={editFormData.logoUrl} alt="logo" className="object-contain p-1" />
                                                                                    <AvatarFallback className="font-black">{(editFormData.name || '?')[0]}</AvatarFallback>
                                                                                </Avatar>
                                                                            ) : (
                                                                                <div className="h-14 w-14 rounded-full border-2 border-dashed border-black/10 flex items-center justify-center text-muted-foreground shrink-0">
                                                                                    <ImageUp className="h-5 w-5" />
                                                                                </div>
                                                                            )}
                                                                            <div className="flex-1 space-y-2">
                                                                                <Input
                                                                                    id="edit-logo"
                                                                                    value={editFormData.logoUrl || ''}
                                                                                    onChange={(e) => setEditFormData({ ...editFormData, logoUrl: e.target.value })}
                                                                                    className="rounded-xl"
                                                                                    placeholder="https://... veya yükleyin"
                                                                                />
                                                                                <div className="flex items-center gap-2">
                                                                                    <label className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'rounded-xl font-bold cursor-pointer h-9')}>
                                                                                        {logoUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ImageUp className="mr-2 h-4 w-4" />}
                                                                                        Logo Yükle (JPG/PNG)
                                                                                        <input
                                                                                            type="file"
                                                                                            accept="image/png,image/jpeg,image/webp,image/svg+xml"
                                                                                            hidden
                                                                                            disabled={logoUploading}
                                                                                            onChange={(e) => {
                                                                                                const f = e.target.files?.[0];
                                                                                                if (f) handleLogoFile(f, 'logo');
                                                                                                e.currentTarget.value = '';
                                                                                            }}
                                                                                        />
                                                                                    </label>
                                                                                    <p className="text-[11px] text-muted-foreground">Maks 5MB. Storage erişilemezse Base64 (max 500KB).</p>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="space-y-2 col-span-2">
                                                                        <Label htmlFor="edit-cover" className="text-sm font-semibold">Kapak Fotoğrafı</Label>
                                                                        <div className="flex items-center gap-3">
                                                                            {editFormData.coverPhotoUrl ? (
                                                                                <div className="h-14 w-24 rounded-xl border-2 border-white shadow-md bg-cover bg-center shrink-0" style={{ backgroundImage: `url(${editFormData.coverPhotoUrl})` }} />
                                                                            ) : (
                                                                                <div className="h-14 w-24 rounded-xl border-2 border-dashed border-black/10 flex items-center justify-center text-muted-foreground shrink-0">
                                                                                    <ImageUp className="h-5 w-5" />
                                                                                </div>
                                                                            )}
                                                                            <div className="flex-1 space-y-2">
                                                                                <Input
                                                                                    id="edit-cover"
                                                                                    value={editFormData.coverPhotoUrl || ''}
                                                                                    onChange={(e) => setEditFormData({ ...editFormData, coverPhotoUrl: e.target.value })}
                                                                                    className="rounded-xl"
                                                                                    placeholder="https://... veya yükleyin"
                                                                                />
                                                                                <label className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'rounded-xl font-bold cursor-pointer h-9 w-fit')}>
                                                                                    {logoUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ImageUp className="mr-2 h-4 w-4" />}
                                                                                    Kapak Yükle (JPG/PNG)
                                                                                    <input
                                                                                        type="file"
                                                                                        accept="image/png,image/jpeg,image/webp"
                                                                                        hidden
                                                                                        disabled={logoUploading}
                                                                                        onChange={(e) => {
                                                                                            const f = e.target.files?.[0];
                                                                                            if (f) handleLogoFile(f, 'cover');
                                                                                            e.currentTarget.value = '';
                                                                                        }}
                                                                                    />
                                                                                </label>
                                                                            </div>
                                                                        </div>
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

                                                            <div className="border-t border-black/5" />

                                                            {/* --- Adres --- */}
                                                            <div className="space-y-4">
                                                                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Adres</p>
                                                                <div className="grid grid-cols-2 gap-4">
                                                                    <div className="space-y-2">
                                                                        <Label htmlFor="edit-country" className="text-sm font-semibold">Ülke</Label>
                                                                        <Select
                                                                            value={editFormData._country || 'Türkiye'}
                                                                            onValueChange={(v) => setEditFormData({ ...editFormData, _country: v, _city: '', _district: '', _neighborhood: '' })}
                                                                        >
                                                                            <SelectTrigger id="edit-country" className="rounded-xl">
                                                                                <SelectValue placeholder="Ülke seçin" />
                                                                            </SelectTrigger>
                                                                            <SelectContent>
                                                                                <SelectItem value="Türkiye">Türkiye</SelectItem>
                                                                                <SelectItem value="KKTC">KKTC</SelectItem>
                                                                                <SelectItem value="Almanya">Almanya</SelectItem>
                                                                                <SelectItem value="ABD">ABD</SelectItem>
                                                                                <SelectItem value="İngiltere">İngiltere</SelectItem>
                                                                                <SelectItem value="Diğer">Diğer</SelectItem>
                                                                            </SelectContent>
                                                                        </Select>
                                                                    </div>
                                                                    <div className="space-y-2">
                                                                        <Label htmlFor="edit-city" className="text-sm font-semibold">İl</Label>
                                                                        {(editFormData._country || 'Türkiye') === 'Türkiye' ? (
                                                                            <Select
                                                                                value={editFormData._city || ''}
                                                                                onValueChange={(v) => setEditFormData({ ...editFormData, _city: v, _district: '', _neighborhood: '' })}
                                                                            >
                                                                                <SelectTrigger id="edit-city" className="rounded-xl">
                                                                                    <SelectValue placeholder="İl seçin" />
                                                                                </SelectTrigger>
                                                                                <SelectContent>
                                                                                    {Object.keys(neighborhoodsData).sort((a, b) => a.localeCompare(b, 'tr')).map(city => (
                                                                                        <SelectItem key={city} value={city}>{city}</SelectItem>
                                                                                    ))}
                                                                                </SelectContent>
                                                                            </Select>
                                                                        ) : (
                                                                            <Input
                                                                                id="edit-city"
                                                                                value={editFormData._city || ''}
                                                                                onChange={(e) => setEditFormData({ ...editFormData, _city: e.target.value })}
                                                                                className="rounded-xl"
                                                                                placeholder="Şehir adı"
                                                                            />
                                                                        )}
                                                                    </div>
                                                                    <div className="space-y-2">
                                                                        <Label htmlFor="edit-district" className="text-sm font-semibold">İlçe</Label>
                                                                        {(editFormData._country || 'Türkiye') === 'Türkiye' && editFormData._city && neighborhoodsData[editFormData._city] ? (
                                                                            <Select
                                                                                value={editFormData._district || ''}
                                                                                onValueChange={(v) => setEditFormData({ ...editFormData, _district: v, _neighborhood: '' })}
                                                                            >
                                                                                <SelectTrigger id="edit-district" className="rounded-xl">
                                                                                    <SelectValue placeholder="İlçe seçin" />
                                                                                </SelectTrigger>
                                                                                <SelectContent>
                                                                                    {Object.keys(neighborhoodsData[editFormData._city]).sort((a, b) => a.localeCompare(b, 'tr')).map(d => (
                                                                                        <SelectItem key={d} value={d}>{d}</SelectItem>
                                                                                    ))}
                                                                                </SelectContent>
                                                                            </Select>
                                                                        ) : (
                                                                            <Input
                                                                                id="edit-district"
                                                                                value={editFormData._district || ''}
                                                                                onChange={(e) => setEditFormData({ ...editFormData, _district: e.target.value })}
                                                                                className="rounded-xl"
                                                                                placeholder="İlçe"
                                                                            />
                                                                        )}
                                                                    </div>
                                                                    <div className="space-y-2">
                                                                        <Label htmlFor="edit-neighborhood" className="text-sm font-semibold">Mahalle</Label>
                                                                        {(editFormData._country || 'Türkiye') === 'Türkiye' && editFormData._city && editFormData._district && neighborhoodsData[editFormData._city]?.[editFormData._district] ? (
                                                                            <Select
                                                                                value={editFormData._neighborhood || ''}
                                                                                onValueChange={(v) => setEditFormData({ ...editFormData, _neighborhood: v })}
                                                                            >
                                                                                <SelectTrigger id="edit-neighborhood" className="rounded-xl">
                                                                                    <SelectValue placeholder="Mahalle seçin" />
                                                                                </SelectTrigger>
                                                                                <SelectContent>
                                                                                    {neighborhoodsData[editFormData._city][editFormData._district].slice().sort((a, b) => a.localeCompare(b, 'tr')).map(n => (
                                                                                        <SelectItem key={n} value={n}>{n}</SelectItem>
                                                                                    ))}
                                                                                </SelectContent>
                                                                            </Select>
                                                                        ) : (
                                                                            <Input
                                                                                id="edit-neighborhood"
                                                                                value={editFormData._neighborhood || ''}
                                                                                onChange={(e) => setEditFormData({ ...editFormData, _neighborhood: e.target.value })}
                                                                                className="rounded-xl"
                                                                                placeholder="Mahalle"
                                                                            />
                                                                        )}
                                                                    </div>
                                                                    <div className="space-y-2 col-span-2">
                                                                        <Label htmlFor="edit-street" className="text-sm font-semibold">Sokak / Cadde / No</Label>
                                                                        <Input
                                                                            id="edit-street"
                                                                            value={editFormData._street || ''}
                                                                            onChange={(e) => setEditFormData({ ...editFormData, _street: e.target.value })}
                                                                            className="rounded-xl"
                                                                            placeholder="Örn: Atatürk Cad. No:12 Daire:3"
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <DialogFooter>
                                                            <Button variant="outline" onClick={() => setEditingBrand(null)} className="rounded-xl font-bold">Vazgeç</Button>
                                                            <Button onClick={handleSaveEdit} className="rounded-xl font-bold" disabled={logoUploading}>
                                                                {logoUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                                Kaydet
                                                            </Button>
                                                        </DialogFooter>
                                                    </DialogContent>
                                                )}
                                            </Dialog>
                                            {brand.source === 'brands' && (
                                                <>
                                                    <TransferBrandAdminDialog brand={brand} allUsers={allUsers || null} onAssign={handleAssignBrandAdmin} onRevoke={handleRevokeBrandAdmin} />
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
