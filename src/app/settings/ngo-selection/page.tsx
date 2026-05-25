'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ArrowLeft, CheckCircle, Search, Filter, ArrowDownUp, ShieldCheck, ShieldAlert, Loader2, Eye, Calendar, MapPin, Users, Network } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking, useCollection } from '@/firebase';
import { doc, collection, serverTimestamp, runTransaction, increment } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import type { NGO } from '@/lib/types';
import { cn } from '@/lib/utils';
import { COLLECTIONS } from '@/firebase/collections';
import { useTranslation } from '@/components/providers/language-provider';

type NgoType = NGO['type'] | 'Tümü';

type UserNgoSelectionData = {
  supportedNgos?: string[];
  lastNgoSelectionChange?: { seconds: number; nanoseconds: number } | { toDate: () => Date } | Date | null;
};

export default function NgoSelectionPage() {
    const router = useRouter();
    const { t } = useTranslation();
    const { toast } = useToast();
    const { user: authUser, isUserLoading } = useUser();
    const db = useFirestore();

    // Firestore NGO listesi
    const ngosQuery = useMemoFirebase(() => (db ? collection(db, COLLECTIONS.ngos) : null), [db]);
    const { data: ngosData, isLoading: isNgosLoading } = useCollection<NGO>(ngosQuery);

    const userDocRef = useMemoFirebase(() => {
        if (!db || !authUser) return null;
        return doc(db, COLLECTIONS.users, authUser.uid);
    }, [db, authUser]);

    const { data: userData, isLoading: isUserDataLoading } = useDoc<UserNgoSelectionData>(userDocRef);
    const [selectedNgos, setSelectedNgos] = useState<string[]>([]);
    const [initialSelected, setInitialSelected] = useState<string[]>([]);
    const [previewNgo, setPreviewNgo] = useState<NGO | null>(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState<NgoType>('Tümü');
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'name', direction: 'asc' });
    const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
    const [cityFilter, setCityFilter] = useState<string>('');
    const [platformFilter, setPlatformFilter] = useState<string[]>([]);
    const [beneficiaryFilter, setBeneficiaryFilter] = useState<string[]>([]);
    const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
    const [isOnboarding, setIsOnboarding] = useState(false);

    // 30 günlük değişim sayacı — staleness aralığı saatler mertebesinde olduğu için
    // Date.now()'u mount başında sabitleyip useMemo deps'i pure tutuyoruz.
    const [nowMs] = useState(() => Date.now());
    const remainingDays = useMemo(() => {
        const raw = userData?.lastNgoSelectionChange;
        if (!raw) return 0;
        let last: Date | null = null;
        if (raw instanceof Date) last = raw;
        else if (typeof (raw as { toDate?: () => Date }).toDate === 'function') last = (raw as { toDate: () => Date }).toDate();
        else if (typeof (raw as { seconds?: number }).seconds === 'number') last = new Date((raw as { seconds: number }).seconds * 1000);
        if (!last) return 0;
        const diffMs = nowMs - last.getTime();
        const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        return Math.max(0, 30 - days);
    }, [userData, nowMs]);

    const canChangeSelection = remainingDays === 0;

    const [preselectNgo, setPreselectNgo] = useState<string | null>(null);

    useEffect(() => {
        if (localStorage.getItem('onboardingStep') === 'ngo-selection') setIsOnboarding(true);
        // QR ile gelen STK (ref=ngo:<id>) onboarding'de ÖN SEÇİLİ gösterilir.
        // IndividualForm bu id'yi localStorage'a yazar; burada bir kez okunup
        // selectedNgos'a eklenir ve temizlenir.
        try {
            const pre = localStorage.getItem('onboardingPreselectNgo');
            if (pre) {
                setPreselectNgo(pre);
                setSelectedNgos(prev => (prev.includes(pre) ? prev : [...prev, pre]));
                localStorage.removeItem('onboardingPreselectNgo');
            }
        } catch {
            // localStorage erişilemedi (Safari private, vb.) — ön seçim atlanır
        }
    }, []);

    useEffect(() => {
        if (userData?.supportedNgos) {
            // QR ön seçimini koru: kayıttaki STK'lara ek olarak ref'li STK seçili kalsın.
            const merged = preselectNgo && !userData.supportedNgos.includes(preselectNgo)
                ? [...userData.supportedNgos, preselectNgo]
                : userData.supportedNgos;
            setSelectedNgos(merged);
            setInitialSelected(userData.supportedNgos);
        }
    }, [userData, preselectNgo]);

    // Sadece aktif STK'lar
    const activeNgos = useMemo(
        () => (ngosData ?? []).filter(n => (n as NGO & { status?: string }).status !== 'Pasif'),
        [ngosData]
    );

    const allCategories = useMemo(() => Array.from(new Set(activeNgos.map(n => n.category).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'tr')), [activeNgos]);

    type NgoWithLocation = NGO & {
        address?: { city?: string; district?: string };
        headquarters?: { city?: string; district?: string };
    };

    const getNgoCity = useCallback((n: NGO): string | undefined => {
        const ext = n as NgoWithLocation;
        return n.contact?.address?.city || ext.address?.city || ext.headquarters?.city;
    }, []);

    const allCities = useMemo(
        () => Array.from(new Set(activeNgos.map(n => getNgoCity(n)).filter((c): c is string => !!c))).sort((a, b) => a.localeCompare(b, 'tr')),
        [activeNgos, getNgoCity]
    );

    const allPlatforms = useMemo(
        () => Array.from(new Set(activeNgos.flatMap(n => n.memberOf ?? []).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'tr')),
        [activeNgos]
    );

    const allBeneficiaries = useMemo(
        () => Array.from(new Set(activeNgos.flatMap(n => n.beneficiaryGroups ?? []).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'tr')),
        [activeNgos]
    );

    const activeFilterCount =
        categoryFilter.length +
        (cityFilter ? 1 : 0) +
        platformFilter.length +
        beneficiaryFilter.length;

    const filteredNgos = useMemo(() => {
        // Seçili STK'lar her zaman görünsün — kullanıcı seçtiğini kaybetmesin.
        // Filtre eşleşmesi olmasa bile selectedNgos içindekiler kalır.
        const selectedSet = new Set(selectedNgos);
        const passesFilters = (n: typeof activeNgos[number]) => {
            if (typeFilter !== 'Tümü' && n.type !== typeFilter) return false;
            if (searchTerm) {
                const lower = searchTerm.toLowerCase();
                if (!(n.name.toLowerCase().includes(lower) || n.category.toLowerCase().includes(lower))) return false;
            }
            if (categoryFilter.length > 0 && !categoryFilter.includes(n.category)) return false;
            if (cityFilter) {
                const city = getNgoCity(n);
                if (city !== cityFilter) return false;
            }
            if (platformFilter.length > 0 && !(n.memberOf ?? []).some(p => platformFilter.includes(p))) return false;
            if (beneficiaryFilter.length > 0 && !(n.beneficiaryGroups ?? []).some(b => beneficiaryFilter.includes(b))) return false;
            return true;
        };
        const filtered = activeNgos.filter(n => selectedSet.has(n.id) || passesFilters(n));

        filtered.sort((a, b) => {
            // Seçili STK'lar her zaman üstte
            const aSel = selectedNgos.includes(a.id);
            const bSel = selectedNgos.includes(b.id);
            if (aSel && !bSel) return -1;
            if (!aSel && bSel) return 1;
            switch (sortConfig.key) {
                case 'followers': return sortConfig.direction === 'asc' ? a.stats.followers - b.stats.followers : b.stats.followers - a.stats.followers;
                case 'volunteers': return sortConfig.direction === 'asc' ? a.stats.volunteers - b.stats.volunteers : b.stats.volunteers - a.stats.volunteers;
                case 'transparencyScore': return sortConfig.direction === 'asc' ? a.transparencyScore - b.transparencyScore : b.transparencyScore - a.transparencyScore;
                default: return sortConfig.direction === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
            }
        });

        return filtered;
    }, [activeNgos, typeFilter, searchTerm, sortConfig, categoryFilter, cityFilter, platformFilter, beneficiaryFilter, selectedNgos, getNgoCity]);

    const clearAllFilters = () => {
        setCategoryFilter([]);
        setCityFilter('');
        setPlatformFilter([]);
        setBeneficiaryFilter([]);
    };

    const togglePlatform = (p: string) => {
        setPlatformFilter(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
    };

    const toggleBeneficiary = (b: string) => {
        setBeneficiaryFilter(prev => prev.includes(b) ? prev.filter(x => x !== b) : [...prev, b]);
    };

    const toggleCategory = (c: string) => {
        setCategoryFilter(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);
    };

    const handleNgoSelect = (ngoId: string) => {
        const isSelected = selectedNgos.includes(ngoId);
        if (!canChangeSelection && !isOnboarding) {
            toast({ variant: 'destructive', title: t('dashboard.settingsNgoSelection.toastLockedTitle'), description: `${t('dashboard.settingsNgoSelection.toastLockedDescPrefix')}${remainingDays}${t('dashboard.settingsNgoSelection.toastLockedDescSuffix')}` });
            return;
        }
        if (!isSelected && selectedNgos.length >= 2) {
            toast({ variant: 'destructive', title: t('dashboard.settingsNgoSelection.toastLimitTitle'), description: t('dashboard.settingsNgoSelection.toastLimitDesc') });
            return;
        }
        setSelectedNgos(prev => isSelected ? prev.filter(id => id !== ngoId) : [...prev, ngoId]);
    };

    const handleSave = async () => {
        if (!userDocRef || !db) return;
        // Zorunluluk: en az 2 STK seçilmeli (hem onboarding hem sonradan değişiklik için).
        if (selectedNgos.length < 2) {
            toast({
                variant: 'destructive',
                title: t('dashboard.settingsNgoSelection.toastLimitTitle'),
                description: 'En az 2 STK seçmen gerekiyor.',
            });
            return;
        }
        // Diff hesapla: kullanıcının seçimine eklenen/çıkarılan STK'lar.
        // Her eklenen → ilgili NGO stats.donors +1, her çıkarılan → -1
        // (atomic: user doc + NGO sayaçları aynı transaction).
        const addedIds = selectedNgos.filter(id => !initialSelected.includes(id));
        const removedIds = initialSelected.filter(id => !selectedNgos.includes(id));
        const sorted = (arr: string[]) => [...arr].sort().join(',');
        const changed = sorted(selectedNgos) !== sorted(initialSelected);
        try {
            await runTransaction(db, async (tx) => {
                const userPayload: Record<string, unknown> = { supportedNgos: selectedNgos };
                if (changed) userPayload.lastNgoSelectionChange = serverTimestamp();
                tx.update(userDocRef, userPayload);
                for (const id of addedIds) {
                    tx.set(doc(db, COLLECTIONS.ngos, id), { stats: { donors: increment(1) } }, { merge: true });
                }
                for (const id of removedIds) {
                    tx.set(doc(db, COLLECTIONS.ngos, id), { stats: { donors: increment(-1) } }, { merge: true });
                }
            });
            toast({ title: t('dashboard.settingsNgoSelection.toastSavedTitle'), description: t('dashboard.settingsNgoSelection.toastSavedDesc') });
        } catch (e) {
            console.error('NGO selection save failed:', e);
            // Transaction başarısızsa yine de user-doc'u kaydet (NGO sayaçları
            // güncellenemese bile kullanıcı seçimi kaybolmasın).
            const fb = await updateDocumentNonBlocking(userDocRef, {
                supportedNgos: selectedNgos,
                ...(changed ? { lastNgoSelectionChange: serverTimestamp() } : {}),
            });
            if (fb.ok) {
                toast({
                    title: t('dashboard.settingsNgoSelection.toastSavedTitle'),
                    description: 'Seçim kaydedildi; STK sayaçları güncellenemedi (yetki kısıtı).',
                });
            } else {
                toast({ variant: 'destructive', title: 'Kayıt başarısız', description: fb.error.message.slice(0, 200) });
                return;
            }
        }
        if (isOnboarding) {
            localStorage.setItem('onboardingStep', 'profile');
            router.push('/settings/profile');
        } else {
            router.push('/settings/profile');
        }
    };

    if (isUserLoading || isUserDataLoading) {
        return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    return (
        <div className="p-4 space-y-6 animate-in fade-in-0">
            <Button onClick={() => router.back()} variant="ghost" size="icon" className="mb-2 -ml-2" aria-label={t('aria.back')}>
                <ArrowLeft className="h-6 w-6" />
            </Button>
            <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                    <h1 className="text-2xl font-bold font-headline">{t('dashboard.settingsNgoSelection.heading')}</h1>
                    <p className="text-muted-foreground text-sm">{t('dashboard.settingsNgoSelection.subheading')}</p>
                </div>
                {/* Üstteki kaydet butonu — alttakinin aynısı, uzun listede aşağı kaydırmadan kaydetmek için. */}
                <Button onClick={handleSave} className="shrink-0">
                    {isOnboarding ? 'Devam Et' : t('dashboard.settingsNgoSelection.saveBtn')}
                </Button>
            </div>

            <Alert variant="destructive">
                <ShieldAlert className="h-4 w-4" />
                <AlertTitle>{t('dashboard.settingsNgoSelection.warningTitle')}</AlertTitle>
                <AlertDescription className="space-y-1">
                    <p>{t('dashboard.settingsNgoSelection.warningDesc')}</p>
                    {remainingDays > 0 && (
                        <p className="flex items-center gap-1.5 mt-1 font-semibold">
                            <Calendar className="h-3.5 w-3.5" />
                            Kalan süre: <span className="font-black">{remainingDays}</span> gün
                        </p>
                    )}
                </AlertDescription>
            </Alert>

            <div className="flex gap-2 items-center">
                <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input placeholder={t('dashboard.settingsNgoSelection.searchPlaceholder')} className="pl-10 h-11" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
                <Sheet open={isFilterSheetOpen} onOpenChange={setIsFilterSheetOpen}>
                    <SheetTrigger asChild>
                        <Button variant="outline" size="icon" className="h-11 w-11 relative rounded-2xl" aria-label={t('aria.filter')}>
                            <Filter className="h-5 w-5" />
                            {activeFilterCount > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 h-5 min-w-5 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                                    {activeFilterCount}
                                </span>
                            )}
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0">
                        <SheetHeader className="p-4 border-b">
                            <SheetTitle className="font-black tracking-tight">Filtreler</SheetTitle>
                            <SheetDescription>STK listesini ihtiyaca göre daralt.</SheetDescription>
                        </SheetHeader>

                        <div className="flex-1 overflow-y-auto p-4 space-y-6">
                            {/* Kategori */}
                            <section className="space-y-2">
                                <h3 className="font-bold text-sm flex items-center gap-2"><Filter className="h-4 w-4 text-primary" /> Kategori</h3>
                                {allCategories.length === 0 ? (
                                    <p className="text-xs text-muted-foreground">Kategori bulunamadı.</p>
                                ) : (
                                    <div className="grid grid-cols-2 gap-2">
                                        {allCategories.map(cat => (
                                            <label key={cat} className="flex items-center gap-2 rounded-2xl border bg-card p-2 cursor-pointer hover:bg-accent">
                                                <Checkbox
                                                    checked={categoryFilter.includes(cat)}
                                                    onCheckedChange={() => toggleCategory(cat)}
                                                />
                                                <span className="text-xs font-medium truncate">{cat}</span>
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </section>

                            {/* Il / Sehir */}
                            <section className="space-y-2">
                                <h3 className="font-bold text-sm flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> İl</h3>
                                {allCities.length === 0 ? (
                                    <p className="text-xs text-muted-foreground">Konum bilgisi olan STK bulunamadı.</p>
                                ) : (
                                    <>
                                        <Label htmlFor="ngo-city-filter" className="sr-only">İl seç</Label>
                                        <select
                                            id="ngo-city-filter"
                                            value={cityFilter}
                                            onChange={e => setCityFilter(e.target.value)}
                                            className="w-full rounded-2xl border bg-background px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                                        >
                                            <option value="">Tüm İller</option>
                                            {allCities.map(c => (
                                                <option key={c} value={c}>{c}</option>
                                            ))}
                                        </select>
                                    </>
                                )}
                            </section>

                            {/* Uye Olunan Platformlar */}
                            <section className="space-y-2">
                                <h3 className="font-bold text-sm flex items-center gap-2"><Network className="h-4 w-4 text-primary" /> Üye Olunan Platformlar</h3>
                                {allPlatforms.length === 0 ? (
                                    <p className="text-xs text-muted-foreground">Platform bilgisi bulunamadı.</p>
                                ) : (
                                    <div className="flex flex-wrap gap-2">
                                        {allPlatforms.map(p => {
                                            const active = platformFilter.includes(p);
                                            return (
                                                <button
                                                    key={p}
                                                    type="button"
                                                    onClick={() => togglePlatform(p)}
                                                    className={cn(
                                                        "px-3 py-1.5 rounded-full border text-xs font-bold transition-colors",
                                                        active
                                                            ? "bg-primary text-primary-foreground border-primary"
                                                            : "bg-card hover:bg-accent"
                                                    )}
                                                >
                                                    {p}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </section>

                            {/* Faydalanici Gruplar */}
                            <section className="space-y-2">
                                <h3 className="font-bold text-sm flex items-center gap-2"><Users className="h-4 w-4 text-primary" /> Faydalanıcı Gruplar</h3>
                                {allBeneficiaries.length === 0 ? (
                                    <p className="text-xs text-muted-foreground">Faydalanıcı grubu bilgisi bulunamadı.</p>
                                ) : (
                                    <div className="flex flex-wrap gap-2">
                                        {allBeneficiaries.map(b => {
                                            const active = beneficiaryFilter.includes(b);
                                            return (
                                                <button
                                                    key={b}
                                                    type="button"
                                                    onClick={() => toggleBeneficiary(b)}
                                                    className={cn(
                                                        "px-3 py-1.5 rounded-full border text-xs font-bold transition-colors",
                                                        active
                                                            ? "bg-primary text-primary-foreground border-primary"
                                                            : "bg-card hover:bg-accent"
                                                    )}
                                                >
                                                    {b}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </section>
                        </div>

                        <SheetFooter className="p-4 border-t flex flex-row gap-2 sm:flex-row">
                            <Button
                                variant="outline"
                                className="flex-1 rounded-2xl font-bold"
                                onClick={clearAllFilters}
                                disabled={activeFilterCount === 0}
                            >
                                Temizle
                            </Button>
                            <Button
                                className="flex-1 rounded-2xl font-bold"
                                onClick={() => setIsFilterSheetOpen(false)}
                            >
                                Uygula{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
                            </Button>
                        </SheetFooter>
                    </SheetContent>
                </Sheet>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon" className="h-11 w-11" aria-label={t('aria.sort')}><ArrowDownUp className="h-5 w-5" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setSortConfig({ key: 'name', direction: 'asc' })}>İsme Göre (A-Z)</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setSortConfig({ key: 'name', direction: 'desc' })}>İsme Göre (Z-A)</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setSortConfig({ key: 'followers', direction: 'desc' })}>Takipçi Sayısı</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setSortConfig({ key: 'volunteers', direction: 'desc' })}>Gönüllü Sayısı</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setSortConfig({ key: 'transparencyScore', direction: 'desc' })}>Şeffaflık Puanı</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <Tabs defaultValue="Tümü" className="w-full" onValueChange={v => setTypeFilter(v as NgoType)}>
                <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="Tümü">Tümü</TabsTrigger>
                    <TabsTrigger value="Dernek">Dernek</TabsTrigger>
                    <TabsTrigger value="Vakıf">Vakıf</TabsTrigger>
                    <TabsTrigger value="Spor Kulübü">Spor</TabsTrigger>
                    <TabsTrigger value="Özel İzinli">Özel</TabsTrigger>
                </TabsList>
            </Tabs>

            <Card>
                <CardHeader className="p-4">
                    <p className="text-sm font-medium">{selectedNgos.length} / 2 STK Seçildi</p>
                </CardHeader>
                <CardContent className="p-0">
                    {isNgosLoading ? (
                        <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                    ) : (
                        <div className="divide-y">
                            {filteredNgos.length > 0 ? filteredNgos.map(ngo => (
                                <div
                                    key={ngo.id}
                                    className={cn(
                                      "flex items-center justify-between p-3 hover:bg-accent cursor-pointer",
                                      selectedNgos.includes(ngo.id) && "bg-primary/5"
                                    )}
                                    onClick={() => handleNgoSelect(ngo.id)}
                                >
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage src={ngo.avatarUrl} alt={ngo.name} />
                                            <AvatarFallback>{ngo.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0">
                                            <p className="font-medium text-sm truncate">{ngo.name}</p>
                                            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                                                {ngo.category}
                                                <span className="text-muted-foreground/50">|</span>
                                                <ShieldCheck className="h-3 w-3 text-primary/80" /> {ngo.transparencyScore}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                                            aria-label="İncele"
                                            onClick={(e) => { e.stopPropagation(); setPreviewNgo(ngo); }}
                                        >
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                        <div className={cn(
                                            "h-6 w-6 rounded-full border-2 flex items-center justify-center",
                                            selectedNgos.includes(ngo.id) ? 'bg-primary border-primary' : 'bg-transparent border-muted-foreground'
                                        )}>
                                            {selectedNgos.includes(ngo.id) && <CheckCircle className="h-4 w-4 text-white" />}
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <p className="text-center text-muted-foreground p-8">Bu filtrelerle eşleşen STK bulunamadı.</p>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button onClick={handleSave}>{isOnboarding ? 'Devam Et' : t('dashboard.settingsNgoSelection.saveBtn')}</Button>
            </div>

            <Dialog open={!!previewNgo} onOpenChange={(open) => !open && setPreviewNgo(null)}>
                <DialogContent className="max-w-md rounded-3xl">
                    {previewNgo && (
                        <>
                            <DialogHeader>
                                <div className="flex items-start gap-3">
                                    <Avatar className="h-14 w-14 border-2 border-white shadow">
                                        <AvatarImage src={previewNgo.avatarUrl} alt={previewNgo.name} />
                                        <AvatarFallback className="font-black">{previewNgo.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0 text-left">
                                        <DialogTitle className="text-lg font-black tracking-tight">{previewNgo.name}</DialogTitle>
                                        <DialogDescription className="text-xs">{previewNgo.type} · {previewNgo.category}</DialogDescription>
                                    </div>
                                </div>
                            </DialogHeader>
                            <div className="space-y-3 pt-2 text-sm">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <Badge variant="secondary" className="font-bold">
                                        <ShieldCheck className="h-3 w-3 mr-1 text-primary" />
                                        Şeffaflık: {previewNgo.transparencyScore || 0}
                                    </Badge>
                                    {previewNgo.stats?.followers != null && (
                                        <Badge variant="outline" className="font-medium">
                                            {previewNgo.stats.followers.toLocaleString('tr-TR')} bağışçı
                                        </Badge>
                                    )}
                                    {previewNgo.stats?.volunteers != null && (
                                        <Badge variant="outline" className="font-medium">
                                            {previewNgo.stats.volunteers.toLocaleString('tr-TR')} gönüllü
                                        </Badge>
                                    )}
                                </div>
                                {previewNgo.about && (
                                    <p className="text-muted-foreground leading-relaxed line-clamp-6">{previewNgo.about}</p>
                                )}
                                <div className="flex gap-2 pt-2">
                                    <Button asChild variant="outline" className="flex-1 rounded-xl">
                                        <a href={`/ngos/${previewNgo.id}`} target="_blank" rel="noopener noreferrer">Profili Aç</a>
                                    </Button>
                                    <Button
                                        className="flex-1 rounded-xl"
                                        onClick={() => { handleNgoSelect(previewNgo.id); setPreviewNgo(null); }}
                                    >
                                        {selectedNgos.includes(previewNgo.id) ? 'Seçimi Kaldır' : 'Seç'}
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
