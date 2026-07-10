'use client';

import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ArrowLeft, Search, Filter, ArrowDownUp, Loader2, CheckCircle, Eye, ShieldCheck, HeartHandshake } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking, useCollection } from '@/firebase';
import { doc, collection } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { NGO } from '@/lib/types';
import { COLLECTIONS } from '@/firebase/collections';
import { useTranslation } from '@/components/providers/language-provider';
import { cn } from '@/lib/utils';
import { useAutosave } from '@/hooks/use-autosave';
import { AutosaveIndicator } from '@/components/shared/autosave-indicator';

type NgoType = NGO['type'] | 'Tümü';

export default function VolunteerNgoSelectionPage() {
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

    const { data: userData, isLoading: isUserDataLoading } = useDoc<{ volunteerNgos?: string[] }>(userDocRef);
    const [selectedNgos, setSelectedNgos] = useState<string[]>([]);
    // Otomatik kayıt hydration tamamlanmadan AÇILMAZ (boş state'in Firestore'u ezmesini önler).
    const [hydrated, setHydrated] = useState(false);

    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState<NgoType>('Tümü');
    // Kullanıcı talebi: her ziyarette random sıralı; sort dropdown override eder.
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'random', direction: 'asc' });
    const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
    const [randomOrder, setRandomOrder] = useState<string[]>([]);
    const [previewNgo, setPreviewNgo] = useState<NGO | null>(null);
    // Bu sayfa zorunlu onboarding zincirinin parçası DEĞİL (zincir: ngo-selection → profile → volunteer → market).
    // Yalnızca standalone "gönüllü STK'larını değiştir" ekranı olarak kullanılır; isOnboarding daima false.
    const [isOnboarding] = useState(false);

    // Hydration BİR KEZ: sonrasında lokal state kaynak olur; snapshot echo'sunun
    // devam eden seçimleri geri ezmesi (ve auto modda gereksiz yazma döngüsü) önlenir.
    useEffect(() => {
        if (hydrated || isUserDataLoading) return;
        if (userData?.volunteerNgos) setSelectedNgos(userData.volunteerNgos);
        setHydrated(true);
    }, [userData, isUserDataLoading, hydrated]);

    // Sadece aktif STK'lar
    const activeNgos = useMemo(
        () => (ngosData ?? []).filter(n => (n as NGO & { status?: string }).status !== 'Pasif'),
        [ngosData]
    );

    useEffect(() => {
        if (activeNgos.length === 0) return;
        const ids = activeNgos.map(n => n.id);
        for (let i = ids.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [ids[i], ids[j]] = [ids[j], ids[i]];
        }
        setRandomOrder(ids);
    }, [activeNgos.length]);
    const randomIndexMap = useMemo(() => {
        const m = new Map<string, number>();
        randomOrder.forEach((id, i) => m.set(id, i));
        return m;
    }, [randomOrder]);

    const allCategories = useMemo(() => Array.from(new Set(activeNgos.map(n => n.category))), [activeNgos]);

    const filteredNgos = useMemo(() => {
        let filtered = [...activeNgos];

        if (typeFilter !== 'Tümü') filtered = filtered.filter(n => n.type === typeFilter);

        if (searchTerm) {
            const lower = searchTerm.toLowerCase();
            filtered = filtered.filter(n =>
                n.name.toLowerCase().includes(lower) || n.category.toLowerCase().includes(lower)
            );
        }

        if (categoryFilter.length > 0) filtered = filtered.filter(n => categoryFilter.includes(n.category));

        filtered.sort((a, b) => {
            switch (sortConfig.key) {
                case 'random': {
                    const ai = randomIndexMap.get(a.id);
                    const bi = randomIndexMap.get(b.id);
                    if (ai === undefined || bi === undefined) return 0;
                    return ai - bi;
                }
                case 'volunteers': return sortConfig.direction === 'asc' ? a.stats.volunteers - b.stats.volunteers : b.stats.volunteers - a.stats.volunteers;
                case 'transparencyScore': return sortConfig.direction === 'asc' ? a.transparencyScore - b.transparencyScore : b.transparencyScore - a.transparencyScore;
                default: return sortConfig.direction === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
            }
        });

        return filtered;
    }, [activeNgos, typeFilter, searchTerm, sortConfig, categoryFilter, randomIndexMap]);

    // Ortak yazım — Kaydet butonu ile aynı Firestore yolu; otomatik kayıt sessiz (toast/navigasyon yok).
    const persist = async () => {
        if (!userDocRef) return;
        const result = await updateDocumentNonBlocking(userDocRef, { volunteerNgos: selectedNgos });
        if (!result.ok) throw result.error;
    };

    // Otomatik kayıt (auto mod): hydration sonrası her seçim değişikliği 600 ms sonra sessizce yazılır.
    const { status: autosaveStatus } = useAutosave(persist, [selectedNgos], { delayMs: 600, enabled: hydrated, auto: true });

    const handleSelectNgo = (ngoId: string) => {
        setSelectedNgos(prev => prev.includes(ngoId) ? prev.filter(id => id !== ngoId) : [...prev, ngoId]);
    };

    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        if (!userDocRef || isSaving) return;
        setIsSaving(true);
        const result = await updateDocumentNonBlocking(userDocRef, { volunteerNgos: selectedNgos });
        setIsSaving(false);
        if (!result.ok) {
            toast({ variant: 'destructive', title: t('settings_volunteer_ngo_selection.saveFailedTitle'), description: result.error.message.slice(0, 200) });
            return;
        }
        toast({ title: t('dashboard.settingsVolunteerNgo.toastSavedTitle'), description: t('dashboard.settingsVolunteerNgo.toastSavedDesc') });
        if (isOnboarding) {
            toast({ title: t('dashboard.settingsVolunteerNgo.toastOnboardingDoneTitle'), description: t('dashboard.settingsVolunteerNgo.toastOnboardingDoneDesc') });
            localStorage.removeItem('onboardingStep');
            router.push('/market');
        } else {
            router.push('/settings/profile');
        }
    };

    if (isUserLoading || isUserDataLoading) {
        return <div className="flex items-center justify-center min-h-dvh"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    return (
        <div className="p-4 space-y-6 animate-in fade-in-0">
            <Button onClick={() => router.back()} variant="ghost" size="icon" className="mb-2 -ml-2" aria-label={t('aria.back')}>
                <ArrowLeft className="h-6 w-6" />
            </Button>
            <div className="flex items-start justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold font-headline">{t('dashboard.settingsVolunteerNgo.heading')}</h1>
                    <p className="text-muted-foreground text-sm">{t('dashboard.settingsVolunteerNgo.subheading')}</p>
                </div>
                <AutosaveIndicator status={autosaveStatus} />
            </div>

            <div className="flex gap-2 items-center">
                <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input placeholder={t('dashboard.settingsVolunteerNgo.searchPlaceholder')} className="pl-10 h-11" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon" className="h-11 w-11" aria-label={t('aria.filter')}><Filter className="h-5 w-5" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>{t('settings_volunteer_ngo_selection.filterByCategory')}</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {allCategories.map(cat => (
                            <DropdownMenuCheckboxItem
                                key={cat}
                                checked={categoryFilter.includes(cat)}
                                onCheckedChange={checked => setCategoryFilter(checked ? [...categoryFilter, cat] : categoryFilter.filter(c => c !== cat))}
                            >{cat}</DropdownMenuCheckboxItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon" className="h-11 w-11" aria-label={t('aria.sort')}><ArrowDownUp className="h-5 w-5" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setSortConfig({ key: 'random', direction: 'asc' })}>{t('settings_volunteer_ngo_selection.sortRandom')}</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setSortConfig({ key: 'name', direction: 'asc' })}>{t('settings_volunteer_ngo_selection.sortNameAsc')}</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setSortConfig({ key: 'name', direction: 'desc' })}>{t('settings_volunteer_ngo_selection.sortNameDesc')}</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setSortConfig({ key: 'volunteers', direction: 'desc' })}>{t('settings_volunteer_ngo_selection.sortVolunteers')}</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setSortConfig({ key: 'transparencyScore', direction: 'desc' })}>{t('settings_volunteer_ngo_selection.sortTransparency')}</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <Tabs defaultValue="Tümü" className="w-full" onValueChange={v => setTypeFilter(v as NgoType)}>
                <TabsList className="grid w-full grid-cols-5">
                    {/* value attribute'ları Firestore'daki NGO.type enum'larıyla birebir eşleşir; etiket child'ları çevrilir. */}
                    <TabsTrigger value="Tümü">{t('settings_volunteer_ngo_selection.tabAll')}</TabsTrigger>
                    <TabsTrigger value="Dernek">{t('settings_volunteer_ngo_selection.tabAssociation')}</TabsTrigger>
                    <TabsTrigger value="Vakıf">{t('settings_volunteer_ngo_selection.tabFoundation')}</TabsTrigger>
                    <TabsTrigger value="Spor Kulübü">{t('settings_volunteer_ngo_selection.tabSports')}</TabsTrigger>
                    <TabsTrigger value="Özel İzinli">{t('settings_volunteer_ngo_selection.tabSpecial')}</TabsTrigger>
                </TabsList>
            </Tabs>

            <Card>
                <CardHeader className="p-4">
                    <p className="text-sm font-medium">{selectedNgos.length}{t('settings_volunteer_ngo_selection.selectedCounterSuffix')}</p>
                </CardHeader>
                <CardContent className="p-0">
                    {isNgosLoading ? (
                        <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                    ) : filteredNgos.length > 0 ? (
                        <div className="divide-y">
                            {filteredNgos.map(ngo => {
                                const isSel = selectedNgos.includes(ngo.id);
                                return (
                                    <div
                                        key={ngo.id}
                                        className={cn(
                                            'flex items-center justify-between p-3 hover:bg-accent cursor-pointer transition-colors',
                                            isSel && 'bg-primary/5',
                                        )}
                                        onClick={() => handleSelectNgo(ngo.id)}
                                    >
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <Avatar className="h-10 w-10 bg-muted">
                                                <AvatarImage src={ngo.avatarUrl} alt={ngo.name} className="object-contain p-1" />
                                                <AvatarFallback className="text-primary font-bold">{ngo.name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div className="min-w-0 flex-1">
                                                <p className="font-medium text-sm truncate">{ngo.name}</p>
                                                <p className="text-xs text-muted-foreground flex items-center gap-1.5 min-w-0 overflow-hidden">
                                                    <span className="truncate">{ngo.category}</span>
                                                    {ngo.category && <span className="text-muted-foreground/50 shrink-0">|</span>}
                                                    <span className="shrink-0">{ngo.type}</span>
                                                    {typeof ngo.transparencyScore === 'number' && (
                                                        <>
                                                            <span className="text-muted-foreground/50 shrink-0">|</span>
                                                            <span className="shrink-0">%{ngo.transparencyScore} {t('settings_volunteer_ngo_selection.transparencyLabel')}</span>
                                                        </>
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-muted-foreground hover:text-primary"
                                                aria-label={t('settings_volunteer_ngo_selection.previewAriaLabel')}
                                                onClick={(e) => { e.stopPropagation(); setPreviewNgo(ngo); }}
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                            <div className={cn(
                                                'h-6 w-6 rounded-full border-2 flex items-center justify-center',
                                                isSel ? 'bg-primary border-primary' : 'bg-transparent border-muted-foreground',
                                            )}>
                                                {isSel && <CheckCircle className="h-4 w-4 text-white" />}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-muted-foreground">
                            <HeartHandshake className="h-10 w-10 mx-auto mb-3 opacity-50" />
                            <p>{t('settings_volunteer_ngo_selection.noResults')}</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button onClick={handleSave} disabled={isSaving}>{isSaving ? t('settings_volunteer_ngo_selection.savingBtn') : (isOnboarding ? t('settings_volunteer_ngo_selection.continueBtn') : t('dashboard.settingsVolunteerNgo.saveBtn'))}</Button>
            </div>

            {/* Preview Dialog — ngo-selection ile aynı pattern */}
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
                                        {t('settings_volunteer_ngo_selection.transparencyLabel')}: {previewNgo.transparencyScore || 0}
                                    </Badge>
                                    {previewNgo.stats?.followers != null && (
                                        <Badge variant="outline" className="font-medium">
                                            {previewNgo.stats.followers.toLocaleString('tr-TR')} {t('settings_volunteer_ngo_selection.donorsSuffix')}
                                        </Badge>
                                    )}
                                    {previewNgo.stats?.volunteers != null && (
                                        <Badge variant="outline" className="font-medium">
                                            {previewNgo.stats.volunteers.toLocaleString('tr-TR')} {t('settings_volunteer_ngo_selection.volunteersSuffix')}
                                        </Badge>
                                    )}
                                </div>
                                {previewNgo.about && (
                                    <p className="text-muted-foreground leading-relaxed line-clamp-6">{previewNgo.about}</p>
                                )}
                                <div className="flex gap-2 pt-2">
                                    <Button asChild variant="outline" className="flex-1 rounded-xl">
                                        <a href={`/ngos/${previewNgo.id}`} target="_blank" rel="noopener noreferrer">{t('settings_volunteer_ngo_selection.openProfile')}</a>
                                    </Button>
                                    <Button
                                        className="flex-1 rounded-xl"
                                        onClick={() => { handleSelectNgo(previewNgo.id); setPreviewNgo(null); }}
                                    >
                                        {selectedNgos.includes(previewNgo.id) ? t('settings_volunteer_ngo_selection.unselect') : t('settings_volunteer_ngo_selection.select')}
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
