'use client';

import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ArrowLeft, CheckCircle, Search, Filter, ArrowDownUp, ShieldCheck, ShieldAlert, Loader2, Eye, Calendar } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking, useCollection } from '@/firebase';
import { doc, collection, serverTimestamp } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuCheckboxItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import type { NGO } from '@/lib/types';
import { cn } from '@/lib/utils';

type NgoType = NGO['type'] | 'Tümü';

type UserNgoSelectionData = {
  supportedNgos?: string[];
  lastNgoSelectionChange?: { seconds: number; nanoseconds: number } | { toDate: () => Date } | Date | null;
};

export default function NgoSelectionPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { user: authUser, isUserLoading } = useUser();
    const db = useFirestore();

    // Firestore NGO listesi
    const ngosQuery = useMemoFirebase(() => (db ? collection(db, 'ngos') : null), [db]);
    const { data: ngosData, isLoading: isNgosLoading } = useCollection<NGO>(ngosQuery);

    const userDocRef = useMemoFirebase(() => {
        if (!db || !authUser) return null;
        return doc(db, 'users', authUser.uid);
    }, [db, authUser]);

    const { data: userData, isLoading: isUserDataLoading } = useDoc<UserNgoSelectionData>(userDocRef);
    const [selectedNgos, setSelectedNgos] = useState<string[]>([]);
    const [initialSelected, setInitialSelected] = useState<string[]>([]);
    const [previewNgo, setPreviewNgo] = useState<NGO | null>(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState<NgoType>('Tümü');
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'name', direction: 'asc' });
    const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
    const [isOnboarding, setIsOnboarding] = useState(false);

    // 30 günlük değişim sayacı
    const remainingDays = useMemo(() => {
        const raw = userData?.lastNgoSelectionChange;
        if (!raw) return 0;
        let last: Date | null = null;
        if (raw instanceof Date) last = raw;
        else if (typeof (raw as { toDate?: () => Date }).toDate === 'function') last = (raw as { toDate: () => Date }).toDate();
        else if (typeof (raw as { seconds?: number }).seconds === 'number') last = new Date((raw as { seconds: number }).seconds * 1000);
        if (!last) return 0;
        const diffMs = Date.now() - last.getTime();
        const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        return Math.max(0, 30 - days);
    }, [userData]);

    const canChangeSelection = remainingDays === 0;

    useEffect(() => {
        if (localStorage.getItem('onboardingStep') === 'ngo-selection') setIsOnboarding(true);
    }, []);

    useEffect(() => {
        if (userData?.supportedNgos) {
            setSelectedNgos(userData.supportedNgos);
            setInitialSelected(userData.supportedNgos);
        }
    }, [userData]);

    // Sadece aktif STK'lar
    const activeNgos = useMemo(
        () => (ngosData ?? []).filter(n => (n as NGO & { status?: string }).status !== 'Pasif'),
        [ngosData]
    );

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
    }, [activeNgos, typeFilter, searchTerm, sortConfig, categoryFilter, selectedNgos]);

    const handleNgoSelect = (ngoId: string) => {
        const isSelected = selectedNgos.includes(ngoId);
        if (!canChangeSelection && !isOnboarding) {
            toast({ variant: 'destructive', title: 'Değiştirme Süresi Kilitli', description: `Seçiminizi değiştirebilmek için ${remainingDays} gün daha beklemelisiniz.` });
            return;
        }
        if (!isSelected && selectedNgos.length >= 2) {
            toast({ variant: 'destructive', title: 'Limit Doldu', description: 'En fazla 2 STK seçebilirsiniz.' });
            return;
        }
        setSelectedNgos(prev => isSelected ? prev.filter(id => id !== ngoId) : [...prev, ngoId]);
    };

    const handleSave = () => {
        if (!userDocRef) return;
        // Sadece gerçek değişiklik varsa timestamp güncelle (sayaç sıfırlanmasın)
        const sorted = (arr: string[]) => [...arr].sort().join(',');
        const changed = sorted(selectedNgos) !== sorted(initialSelected);
        const payload: Record<string, unknown> = { supportedNgos: selectedNgos };
        if (changed) payload.lastNgoSelectionChange = serverTimestamp();
        updateDocumentNonBlocking(userDocRef, payload);
        toast({ title: 'Tercihler Kaydedildi', description: 'Varsayılan STK seçimleriniz güncellendi.' });
        if (isOnboarding) {
            localStorage.setItem('onboardingStep', 'volunteer-ngo-selection');
            router.push('/settings/volunteer-ngo-selection');
        } else {
            router.push('/settings/profile');
        }
    };

    if (isUserLoading || isUserDataLoading) {
        return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    return (
        <div className="p-4 space-y-6 animate-in fade-in-0">
            <Button onClick={() => router.back()} variant="ghost" size="icon" className="mb-2 -ml-2" aria-label="Geri">
                <ArrowLeft className="h-6 w-6" />
            </Button>
            <div>
                <h1 className="text-2xl font-bold font-headline">Bağışçı Olduğun STK'ları Değiştir</h1>
                <p className="text-muted-foreground text-sm">Alışverişlerinizden doğan bağışların aktarılacağı varsayılan STK'ları seçin.</p>
            </div>

            <Alert variant="destructive">
                <ShieldAlert className="h-4 w-4" />
                <AlertTitle>Önemli Bilgi</AlertTitle>
                <AlertDescription className="space-y-1">
                    <p>Varsayılan STK seçiminizi 30 gün boyunca yalnızca bir kez değiştirebilirsiniz.</p>
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
                    <Input placeholder="STK ara..." className="pl-10 h-11" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon" className="h-11 w-11" aria-label="Filtrele"><Filter className="h-5 w-5" /></Button>
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
                        <Button variant="outline" size="icon" className="h-11 w-11" aria-label="Sırala"><ArrowDownUp className="h-5 w-5" /></Button>
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
                <Button onClick={handleSave}>{isOnboarding ? 'Devam Et' : 'Değişiklikleri Kaydet'}</Button>
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
                                        <a href={`/ngos/${previewNgo.id}`} target="_blank" rel="noreferrer">Profili Aç</a>
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
