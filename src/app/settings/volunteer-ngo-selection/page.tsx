'use client';

import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ArrowLeft, Search, Filter, ArrowDownUp, Loader2 } from 'lucide-react';
import { NgoListItem } from '@/components/shared/ngo-list-item';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking, useCollection } from '@/firebase';
import { doc, collection } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import type { NGO } from '@/lib/types';
import { COLLECTIONS } from '@/firebase/collections';
import { useTranslation } from '@/components/providers/language-provider';

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

    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState<NgoType>('Tümü');
    // Kullanıcı talebi: her ziyarette random sıralı; sort dropdown override eder.
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'random', direction: 'asc' });
    const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
    const [randomOrder, setRandomOrder] = useState<string[]>([]);
    // Bu sayfa zorunlu onboarding zincirinin parçası DEĞİL (zincir: ngo-selection → profile → volunteer → market).
    // Yalnızca standalone "gönüllü STK'larını değiştir" ekranı olarak kullanılır; isOnboarding daima false.
    const [isOnboarding] = useState(false);

    useEffect(() => {
        if (userData?.volunteerNgos) setSelectedNgos(userData.volunteerNgos);
    }, [userData]);

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
            toast({ variant: 'destructive', title: 'Kayıt başarısız', description: result.error.message.slice(0, 200) });
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
            <div>
                <h1 className="text-2xl font-bold font-headline">{t('dashboard.settingsVolunteerNgo.heading')}</h1>
                <p className="text-muted-foreground text-sm">{t('dashboard.settingsVolunteerNgo.subheading')}</p>
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
                        <DropdownMenuLabel>Kategoriye Göre Filtrele</DropdownMenuLabel>
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
                        <DropdownMenuItem onClick={() => setSortConfig({ key: 'random', direction: 'asc' })}>Karışık (varsayılan)</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setSortConfig({ key: 'name', direction: 'asc' })}>İsme Göre (A-Z)</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setSortConfig({ key: 'name', direction: 'desc' })}>İsme Göre (Z-A)</DropdownMenuItem>
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
                    <p className="text-sm font-medium">{selectedNgos.length} STK Seçildi</p>
                </CardHeader>
                <CardContent className="p-0">
                    {isNgosLoading ? (
                        <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                    ) : (
                        <div className="space-y-2 p-2">
                            {filteredNgos.length > 0 ? filteredNgos.map(ngo => {
                                const isSel = selectedNgos.includes(ngo.id);
                                return (
                                    <NgoListItem
                                        key={ngo.id}
                                        ngo={ngo}
                                        href={null}
                                        onClick={() => handleSelectNgo(ngo.id)}
                                        className={isSel ? 'bg-primary/5 border-primary/30' : ''}
                                        rightSlot={
                                            <Checkbox
                                                id={`ngo-${ngo.id}`}
                                                checked={isSel}
                                                onCheckedChange={() => handleSelectNgo(ngo.id)}
                                                onClick={e => e.stopPropagation()}
                                            />
                                        }
                                    />
                                );
                            }) : (
                                <p className="text-center text-muted-foreground p-8">Bu filtrelerle eşleşen STK bulunamadı.</p>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="flex justify-end">
                <Button onClick={handleSave} disabled={isSaving}>{isSaving ? 'Kaydediliyor...' : (isOnboarding ? 'Devam Et' : t('dashboard.settingsVolunteerNgo.saveBtn'))}</Button>
            </div>
        </div>
    );
}
