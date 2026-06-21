'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, HandCoins, Filter, Search, ArrowDownUp, X, Send, Calendar, DollarSign, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { cn } from '@/lib/utils';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useActiveEntityDoc } from '@/app/ngo-admin/active-entity-context';
import { collection, query } from 'firebase/firestore';
import { COLLECTIONS } from '@/firebase/collections';
import { useTranslation } from '@/components/providers/language-provider';

interface Fund {
  id: string;
  name: string;
  provider: string;
  status: string;
  deadline: string;
  areas?: string[];
  description: string;
  budget?: string;
  requirements?: string;
  url?: string;
}

// Firestore'da http(s):// olmadan kaydedilmiş URL'leri relative path olarak
// açmasın diye normalize et. Boş/null URL null döner.
const normalizeUrl = (raw?: string | null): string | null => {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^\/\//.test(trimmed)) return `https:${trimmed}`;
  return `https://${trimmed.replace(/^\/+/, '')}`;
};

const fallbackFunds: Fund[] = [
    { 
        id: '1', 
        name: 'Avrupa Birliği Sivil Toplum Destek Programı', 
        provider: 'Avrupa Birliği Delegasyonu', 
        status: 'Açık', 
        deadline: '2024-10-31', 
        areas: ['İnsan Hakları', 'Çevre'],
        description: 'Türkiye ve AB arasındaki sivil toplum diyaloğunu güçlendirmek, sivil toplumun kurumsal kapasitesini artırmak ve karar alma süreçlerine katılımını desteklemek amacıyla hibe desteği sunar.',
        budget: '60.000 € - 150.000 €',
        requirements: 'En az 3 yıldır aktif faaliyet gösteren dernek ve vakıflar.',
        url: 'https://www.ab.gov.tr'
    },
    { 
        id: '2', 
        name: 'Türkiye Sosyal Girişimcilik Ağı Hibe Programı', 
        provider: 'Koç Üniversitesi Sosyal Etki Forumu', 
        status: 'Açık', 
        deadline: '2024-09-15', 
        areas: ['Sosyal Girişimcilik', 'Gençlik'],
        description: 'Sosyal girişimlerin kapasite gelişimini, ekosistem içindeki işbirliklerini ve toplumsal etki odaklı yeni iş modellerini destekleyen bir hızlandırma ve hibe programıdır.',
        budget: '25.000 ₺ - 75.000 ₺',
        requirements: 'Sosyal girişim statüsündeki veya bu modele geçmek isteyen yapılar.',
        url: 'https://sosyalgirisimcilikagi.org'
    },
    { 
        id: '3', 
        name: 'Kültür Sanat Fonu', 
        provider: 'Sabancı Vakfı', 
        status: 'Kapandı', 
        deadline: '2024-07-01', 
        areas: ['Kültür & Sanat'],
        description: 'Kadınlar, gençler ve engelliler odaklı sosyal projeleri kültür ve sanat aracılığıyla destekler. Toplumsal farkındalık üreten yaratıcı projelere öncelik verir.',
        budget: '100.000 ₺ - 300.000 ₺',
        requirements: 'Kamu yararına çalışan dernek ve vakıflar.',
        url: 'https://www.sabancivakfi.org'
    },
    { 
        id: '4', 
        name: 'Japonya Büyükelçiliği Yerel Projelere Hibe Programı', 
        provider: 'Japonya Büyükelçiliği', 
        status: 'Açık', 
        deadline: '2024-11-30', 
        areas: ['Eğitim', 'Sağlık'],
        description: 'Yerel kalkınma, sağlık ve eğitim ihtiyaçlarına yönelik küçük ölçekli, somut ve doğrudan yarar sağlayan altyapı veya ekipman projelerine hibe sağlar.',
        budget: 'Maksimum 90.000 $',
        requirements: 'Yerel yönetimler, eğitim kurumları ve STK\'lar.',
        url: 'https://www.tr.emb-japan.go.tr'
    },
];

export default function FundsPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { t } = useTranslation();
    const db = useFirestore();
    const [searchTerm, setSearchTerm] = useState('');

    // Filtering and Sorting States
    const [statusFilter, setStatusFilter] = useState<string | null>(null);
    const [areaFilters, setAreaFilters] = useState<string[]>([]);
    const [sortConfig, setSortConfig] = useState<{ key: 'deadline' | 'name' | 'compat', direction: 'asc' | 'desc' }>({ key: 'deadline', direction: 'asc' });

    // Firestore'dan fon listesi (super-admin tarafından yönetilen).
    // orderBy uygulamıyoruz; deadline alanı eksik olan dokümanlar listede yer alsın.
    // Sıralama tamamen client-side yapılıyor.
    const fundsQuery = useMemoFirebase(
        () => (db ? query(collection(db, COLLECTIONS.funds)) : null),
        [db],
    );
    const { data: cmsFunds } = useCollection<Fund>(fundsQuery);
    const funds = useMemo(() => {
        if (cmsFunds && cmsFunds.length > 0) return cmsFunds;
        return fallbackFunds;
    }, [cmsFunds]);

    const allPossibleAreas = useMemo(
        () => Array.from(new Set(funds.flatMap((f) => f.areas || []))).sort(),
        [funds],
    );

    // STK uyumluluk yüzdesi: fonun faaliyet alanları ile STK'nın kategori/faydalanıcı/SKA
    // alanlarının örtüşmesi. Farklı taksonomiler için normalize + iki yönlü substring eşleşmesi.
    const { data: myEntity } = useActiveEntityDoc<{ categories?: string[]; beneficiaries?: string[]; sdgs?: string[] }>();
    const ngoAreas = useMemo(() => {
        const norm = (s: string) => (s || '').toLocaleLowerCase('tr').trim();
        return [...(myEntity?.categories || []), ...(myEntity?.beneficiaries || []), ...(myEntity?.sdgs || [])]
            .map(norm).filter(Boolean);
    }, [myEntity]);
    const compatScore = (fund: Fund): number | null => {
        const areas = (fund.areas || []).map(a => (a || '').toLocaleLowerCase('tr').trim()).filter(Boolean);
        if (areas.length === 0 || ngoAreas.length === 0) return null;
        const matched = areas.filter(a => ngoAreas.some(na => na === a || na.includes(a) || a.includes(na))).length;
        return Math.round((matched / areas.length) * 100);
    };

    const filteredAndSortedFunds = useMemo(() => {
        let result = [...funds];

        // 1. Search
        if (searchTerm.trim()) {
            const lower = searchTerm.toLowerCase();
            result = result.filter(f => 
                f.name.toLowerCase().includes(lower) || 
                f.provider.toLowerCase().includes(lower) ||
                f.description.toLowerCase().includes(lower)
            );
        }

        // 2. Status Filter
        if (statusFilter) {
            result = result.filter(f => f.status === statusFilter);
        }

        // 3. Area Filter
        if (areaFilters.length > 0) {
            result = result.filter(f => (f.areas || []).some((area: string) => areaFilters.includes(area)));
        }

        // 4. Sort
        result.sort((a, b) => {
            if (sortConfig.key === 'deadline') {
                return sortConfig.direction === 'asc' 
                    ? a.deadline.localeCompare(b.deadline) 
                    : b.deadline.localeCompare(a.deadline);
            }
            if (sortConfig.key === 'name') {
                return sortConfig.direction === 'asc'
                    ? a.name.localeCompare(b.name, 'tr')
                    : b.name.localeCompare(a.name, 'tr');
            }
            if (sortConfig.key === 'compat') {
                const sa = compatScore(a) ?? -1;
                const sb = compatScore(b) ?? -1;
                return sortConfig.direction === 'asc' ? sa - sb : sb - sa;
            }
            return 0;
        });

        return result;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchTerm, statusFilter, areaFilters, sortConfig, funds, ngoAreas]);

    const handleOpenDetails = (fund: typeof funds[0]) => {
        router.push(`/ngo-admin/funds/${fund.id}`);
    };

    const toggleAreaFilter = (area: string) => {
        setAreaFilters(prev => 
            prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area]
        );
    };

    const clearFilters = () => {
        setStatusFilter(null);
        setAreaFilters([]);
        setSearchTerm('');
        toast({ title: t('ngo_admin_funds.filtersClearedToast') });
    };

    const activeFilterCount = (statusFilter ? 1 : 0) + areaFilters.length;

    return (
        <div className="space-y-6 animate-in fade-in-0 max-w-5xl mx-auto p-4 sm:p-6">
            <div className="flex items-center gap-2">
                <Button onClick={() => router.back()} variant="ghost" size="icon" className="-ml-2" aria-label={t('ngo_admin_funds.backAria')}>
                    <ArrowLeft className="h-6 w-6" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold font-headline">{t('ngo_admin_funds.title')}</h1>
                    <p className="text-muted-foreground text-sm">{t('ngo_admin_funds.subtitle')}</p>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                <div className="relative flex-grow w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                        placeholder={t('ngo_admin_funds.searchPlaceholder')}
                        className="pl-10 h-11 rounded-xl"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon" className="h-11 w-11 shrink-0 rounded-xl relative" aria-label={t('ngo_admin_funds.filterAria')}>
                                <Filter className="h-5 w-5" />
                                {activeFilterCount > 0 && (
                                    <span className="absolute -top-1 -right-1 h-4 w-4 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-background">
                                        {activeFilterCount}
                                    </span>
                                )}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 rounded-xl">
                            <DropdownMenuLabel>{t('ngo_admin_funds.filterByStatus')}</DropdownMenuLabel>
                            <DropdownMenuCheckboxItem
                                checked={statusFilter === 'Açık'}
                                onCheckedChange={() => setStatusFilter(statusFilter === 'Açık' ? null : 'Açık')}
                            >
                                {t('ngo_admin_funds.onlyOpen')}
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem
                                checked={statusFilter === 'Kapandı'}
                                onCheckedChange={() => setStatusFilter(statusFilter === 'Kapandı' ? null : 'Kapandı')}
                            >
                                {t('ngo_admin_funds.onlyClosed')}
                            </DropdownMenuCheckboxItem>

                            <DropdownMenuSeparator />
                            <DropdownMenuLabel>{t('ngo_admin_funds.filterByArea')}</DropdownMenuLabel>
                            {allPossibleAreas.map(area => (
                                <DropdownMenuCheckboxItem
                                    key={area}
                                    checked={areaFilters.includes(area)}
                                    onCheckedChange={() => toggleAreaFilter(area)}
                                >
                                    {area}
                                </DropdownMenuCheckboxItem>
                            ))}
                            
                            {(activeFilterCount > 0 || searchTerm) && (
                                <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={clearFilters} className="text-destructive font-bold focus:text-destructive">
                                        <X className="mr-2 h-4 w-4" /> {t('ngo_admin_funds.clearFilters')}
                                    </DropdownMenuItem>
                                </>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon" className="h-11 w-11 shrink-0 rounded-xl" aria-label={t('ngo_admin_funds.sortAria')}>
                                <ArrowDownUp className="h-5 w-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 rounded-xl">
                            <DropdownMenuLabel>{t('ngo_admin_funds.sortOptions')}</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setSortConfig({ key: 'deadline', direction: 'asc' })}>
                                {t('ngo_admin_funds.sortDeadlineAsc')} {sortConfig.key === 'deadline' && sortConfig.direction === 'asc' && '✓'}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setSortConfig({ key: 'deadline', direction: 'desc' })}>
                                {t('ngo_admin_funds.sortDeadlineDesc')} {sortConfig.key === 'deadline' && sortConfig.direction === 'desc' && '✓'}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setSortConfig({ key: 'name', direction: 'asc' })}>
                                {t('ngo_admin_funds.sortNameAsc')} {sortConfig.key === 'name' && sortConfig.direction === 'asc' && '✓'}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setSortConfig({ key: 'name', direction: 'desc' })}>
                                {t('ngo_admin_funds.sortNameDesc')} {sortConfig.key === 'name' && sortConfig.direction === 'desc' && '✓'}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setSortConfig({ key: 'compat', direction: 'desc' })}>
                                Uyuma Göre Sırala (yüksek → düşük) {sortConfig.key === 'compat' && '✓'}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <Card className="rounded-[2rem] border-border shadow-sm">
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>{t('ngo_admin_funds.cardTitle')}</CardTitle>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{filteredAndSortedFunds.length} {t('ngo_admin_funds.resultsSuffix')}</p>
                    </div>
                    <CardDescription>{t('ngo_admin_funds.cardDescription')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {filteredAndSortedFunds.length > 0 ? filteredAndSortedFunds.map(fund => (
                        <Card key={fund.id} className={cn(
                            "transition-all duration-300 rounded-2xl border-border shadow-sm overflow-hidden",
                            fund.status === 'Kapandı' ? 'opacity-60 bg-muted/30 grayscale-[0.5]' : 'hover:border-primary/50 hover:shadow-md'
                        )}>
                            <CardHeader className="p-6 pb-2">
                                <div className="flex justify-between items-start gap-4">
                                    <div className="space-y-1">
                                        <CardTitle className="text-lg font-bold leading-tight group-hover:text-primary transition-colors">{fund.name}</CardTitle>
                                        <p className="text-sm font-semibold text-primary">{fund.provider}</p>
                                        {(() => {
                                            const sc = compatScore(fund);
                                            return sc !== null ? (
                                                <Badge className={cn('text-[10px] font-black border-none mt-0.5', sc >= 60 ? 'bg-green-600 text-white' : sc >= 30 ? 'bg-amber-500 text-white' : 'bg-muted text-muted-foreground')}>
                                                    {t('ngo_admin_funds.compatibilityPrefix')}{sc}{t('ngo_admin_funds.compatibilitySuffix')}
                                                </Badge>
                                            ) : null;
                                        })()}
                                    </div>
                                    <Badge variant={fund.status === 'Açık' ? 'default' : 'secondary'} className={cn(
                                        "font-black text-[9px] tracking-widest px-3 py-1 uppercase rounded-lg border-none",
                                        fund.status === 'Açık' ? 'bg-green-600 text-white' : 'bg-muted text-muted-foreground'
                                    )}>
                                        {fund.status === 'Açık' ? t('ngo_admin_funds.statusOpen') : fund.status === 'Kapandı' ? t('ngo_admin_funds.statusClosed') : fund.status}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6 pt-2 space-y-4">
                                <div className="flex flex-wrap gap-2">
                                    {(fund.areas || []).map((area: string) => (
                                        <Badge key={area} variant="secondary" className="rounded-lg font-bold text-[10px] bg-muted border-none text-muted-foreground">
                                            {area}
                                        </Badge>
                                    ))}
                                </div>
                                <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-[11px] font-bold text-muted-foreground">
                                    <div className="flex items-center gap-1.5 bg-muted/50 px-3 py-1.5 rounded-full">
                                        <Calendar className="h-3.5 w-3.5" />
                                        <span>{t('ngo_admin_funds.deadlineLabel')} {fund.deadline || t('ngo_admin_funds.deadlineUnspecified')}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 bg-primary/5 text-primary px-3 py-1.5 rounded-full">
                                        <DollarSign className="h-3.5 w-3.5" />
                                        <span>{fund.budget || t('ngo_admin_funds.budgetUnspecified')}</span>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="p-6 pt-0 flex flex-wrap gap-3">
                                <Button size="sm" className="flex-1 min-w-[120px] font-bold h-10 rounded-xl" onClick={() => handleOpenDetails(fund)}>{t('ngo_admin_funds.viewDetails')}</Button>
                                <Button
                                    size="sm"
                                    variant="default"
                                    className="flex-1 min-w-[120px] font-bold h-10 rounded-xl bg-green-600 hover:bg-green-700"
                                    onClick={() => router.push('/library')}
                                >
                                    <Send className="mr-2 h-3.5 w-3.5" />
                                    {t('ngo_admin_funds.prepareProject')}
                                </Button>
                                {(() => {
                                    const officialUrl = normalizeUrl(fund.url);
                                    return officialUrl ? (
                                        <Button asChild size="sm" variant="outline" className="flex-1 min-w-[120px] font-bold h-10 rounded-xl border-border">
                                            <a href={officialUrl} target="_blank" rel="noopener noreferrer">
                                                {t('ngo_admin_funds.officialPage')} <ExternalLink className="ml-2 h-3.5 w-3.5" />
                                            </a>
                                        </Button>
                                    ) : null;
                                })()}
                            </CardFooter>
                        </Card>
                    )) : (
                        <div className="text-center py-20 bg-muted/20 rounded-[2rem] border-2 border-dashed">
                            <HandCoins className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
                            {(activeFilterCount > 0 || searchTerm) ? (
                                <>
                                    <p className="text-muted-foreground font-medium italic">{t('ngo_admin_funds.noResultsFiltered')}</p>
                                    <Button variant="link" onClick={clearFilters} className="mt-2 text-primary">{t('ngo_admin_funds.clearAllFilters')}</Button>
                                </>
                            ) : (
                                <p className="text-muted-foreground font-medium italic">{t('ngo_admin_funds.noFundsYet')}</p>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

        </div>
    );
}