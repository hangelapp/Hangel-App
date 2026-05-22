'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, HandCoins, ExternalLink, Filter, Search, ArrowDownUp, Info, CheckCircle2, Calendar, Target, DollarSign, X, Send } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { collection, query } from 'firebase/firestore';
import { COLLECTIONS } from '@/firebase/collections';

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
        description: 'Kadınlar, gençler ve engelliler odaklı sosyal projeleri kültür ve sanat aracılığıyla destekler. Toplumsal farkındalık yaratan yaratıcı projelere öncelik verir.',
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
    const db = useFirestore();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedFund, setSelectedFund] = useState<Fund | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    // Filtering and Sorting States
    const [statusFilter, setStatusFilter] = useState<string | null>(null);
    const [areaFilters, setAreaFilters] = useState<string[]>([]);
    const [sortConfig, setSortConfig] = useState<{ key: 'deadline' | 'name', direction: 'asc' | 'desc' }>({ key: 'deadline', direction: 'asc' });

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
            return 0;
        });

        return result;
    }, [searchTerm, statusFilter, areaFilters, sortConfig, funds]);

    const handleOpenDetails = (fund: typeof funds[0]) => {
        setSelectedFund(fund);
        setIsDetailsOpen(true);
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
        toast({ title: "Filtreler Temizlendi" });
    };

    const activeFilterCount = (statusFilter ? 1 : 0) + areaFilters.length;

    return (
        <div className="space-y-6 animate-in fade-in-0 max-w-5xl mx-auto p-4 sm:p-6">
            <div className="flex items-center gap-2">
                <Button onClick={() => router.back()} variant="ghost" size="icon" className="-ml-2" aria-label="Geri">
                    <ArrowLeft className="h-6 w-6" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold font-headline">Hibeler ve Fonlar</h1>
                    <p className="text-muted-foreground text-sm">Kuruluşunuzun başvurabileceği aktif hibe ve fon fırsatları.</p>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                <div className="relative flex-grow w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input 
                        placeholder="Hibe veya sağlayıcı ara..." 
                        className="pl-10 h-11 rounded-xl" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon" className="h-11 w-11 shrink-0 rounded-xl relative" aria-label="Filtrele">
                                <Filter className="h-5 w-5" />
                                {activeFilterCount > 0 && (
                                    <span className="absolute -top-1 -right-1 h-4 w-4 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-background">
                                        {activeFilterCount}
                                    </span>
                                )}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 rounded-xl">
                            <DropdownMenuLabel>Duruma Göre</DropdownMenuLabel>
                            <DropdownMenuCheckboxItem 
                                checked={statusFilter === 'Açık'} 
                                onCheckedChange={() => setStatusFilter(statusFilter === 'Açık' ? null : 'Açık')}
                            >
                                Sadece Açık İlanlar
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem 
                                checked={statusFilter === 'Kapandı'} 
                                onCheckedChange={() => setStatusFilter(statusFilter === 'Kapandı' ? null : 'Kapandı')}
                            >
                                Kapanan İlanlar
                            </DropdownMenuCheckboxItem>
                            
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel>Odak Alanlarına Göre</DropdownMenuLabel>
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
                                        <X className="mr-2 h-4 w-4" /> Filtreleri Temizle
                                    </DropdownMenuItem>
                                </>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon" className="h-11 w-11 shrink-0 rounded-xl" aria-label="Sırala">
                                <ArrowDownUp className="h-5 w-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 rounded-xl">
                            <DropdownMenuLabel>Sıralama Seçenekleri</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setSortConfig({ key: 'deadline', direction: 'asc' })}>
                                Tarih (En Yakın) {sortConfig.key === 'deadline' && sortConfig.direction === 'asc' && '✓'}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setSortConfig({ key: 'deadline', direction: 'desc' })}>
                                Tarih (En Uzak) {sortConfig.key === 'deadline' && sortConfig.direction === 'desc' && '✓'}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setSortConfig({ key: 'name', direction: 'asc' })}>
                                İsim (A-Z) {sortConfig.key === 'name' && sortConfig.direction === 'asc' && '✓'}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setSortConfig({ key: 'name', direction: 'desc' })}>
                                İsim (Z-A) {sortConfig.key === 'name' && sortConfig.direction === 'desc' && '✓'}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <Card className="rounded-[2rem] border-black/5 shadow-sm">
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>Hibe Programları</CardTitle>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{filteredAndSortedFunds.length} Sonuç</p>
                    </div>
                    <CardDescription>Başvuruya açık olan ve geçmiş hibe fırsatlarını inceleyin.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {filteredAndSortedFunds.length > 0 ? filteredAndSortedFunds.map(fund => (
                        <Card key={fund.id} className={cn(
                            "transition-all duration-300 rounded-2xl border-black/5 shadow-sm overflow-hidden",
                            fund.status === 'Kapandı' ? 'opacity-60 bg-muted/30 grayscale-[0.5]' : 'hover:border-primary/50 hover:shadow-md'
                        )}>
                            <CardHeader className="p-6 pb-2">
                                <div className="flex justify-between items-start gap-4">
                                    <div className="space-y-1">
                                        <CardTitle className="text-lg font-bold leading-tight group-hover:text-primary transition-colors">{fund.name}</CardTitle>
                                        <p className="text-sm font-semibold text-primary">{fund.provider}</p>
                                    </div>
                                    <Badge variant={fund.status === 'Açık' ? 'default' : 'secondary'} className={cn(
                                        "font-black text-[9px] tracking-widest px-3 py-1 uppercase rounded-lg border-none",
                                        fund.status === 'Açık' ? 'bg-green-600 text-white' : 'bg-muted text-muted-foreground'
                                    )}>
                                        {fund.status}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="p-6 pt-2 space-y-4">
                                <div className="flex flex-wrap gap-2">
                                    {(fund.areas || []).map((area: string) => (
                                        <Badge key={area} variant="secondary" className="rounded-lg font-bold text-[10px] bg-[#f5f5f7] border-none text-[#1d1d1f]/70">
                                            {area}
                                        </Badge>
                                    ))}
                                </div>
                                <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-[11px] font-bold text-muted-foreground">
                                    <div className="flex items-center gap-1.5 bg-muted/50 px-3 py-1.5 rounded-full">
                                        <Calendar className="h-3.5 w-3.5" />
                                        <span>Son Başvuru: {fund.deadline}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 bg-primary/5 text-primary px-3 py-1.5 rounded-full">
                                        <DollarSign className="h-3.5 w-3.5" />
                                        <span>{fund.budget}</span>
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="p-6 pt-0 flex flex-wrap gap-3">
                                <Button size="sm" className="flex-1 min-w-[120px] font-bold h-10 rounded-xl" onClick={() => handleOpenDetails(fund)}>Detayları Gör</Button>
                                <Button
                                    size="sm"
                                    variant="default"
                                    className="flex-1 min-w-[120px] font-bold h-10 rounded-xl bg-green-600 hover:bg-green-700"
                                    onClick={() => router.push('/library')}
                                >
                                    <Send className="mr-2 h-3.5 w-3.5" />
                                    Proje Hazırla
                                </Button>
                                {fund.url && (
                                    <Button asChild size="sm" variant="outline" className="flex-1 min-w-[120px] font-bold h-10 rounded-xl border-black/10">
                                        <a href={fund.url} target="_blank" rel="noopener noreferrer">
                                            Resmi Sayfa <ExternalLink className="ml-2 h-3.5 w-3.5" />
                                        </a>
                                    </Button>
                                )}
                            </CardFooter>
                        </Card>
                    )) : (
                        <div className="text-center py-20 bg-muted/20 rounded-[2rem] border-2 border-dashed">
                            <HandCoins className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
                            {(activeFilterCount > 0 || searchTerm) ? (
                                <>
                                    <p className="text-muted-foreground font-medium italic">Aradığınız kriterlerde hibe fırsatı bulunamadı.</p>
                                    <Button variant="link" onClick={clearFilters} className="mt-2 text-primary">Tüm Filtreleri Temizle</Button>
                                </>
                            ) : (
                                <p className="text-muted-foreground font-medium italic">Henüz yayınlanan bir hibe veya fon ilanı yok.</p>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Fund Details Dialog */}
            <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                {selectedFund && (
                    <DialogContent className="sm:max-w-[600px] rounded-[2.5rem] border-none shadow-2xl overflow-hidden p-0">
                        <div className="h-2 w-full bg-primary" />
                        <div className="p-8">
                            <DialogHeader>
                                <div className="flex items-center gap-2 mb-4">
                                    <HandCoins className="h-6 w-6 text-primary" />
                                    <Badge className={cn(
                                        "font-black text-[9px] tracking-widest px-3 py-1 uppercase rounded-lg border-none",
                                        selectedFund.status === 'Açık' ? 'bg-green-600 text-white' : 'bg-muted text-muted-foreground'
                                    )}>
                                        {selectedFund.status}
                                    </Badge>
                                </div>
                                <DialogTitle className="text-2xl font-bold tracking-tight text-[#1d1d1f] leading-tight">{selectedFund.name}</DialogTitle>
                                <DialogDescription className="text-base font-bold text-primary mt-1">{selectedFund.provider}</DialogDescription>
                            </DialogHeader>
                            
                            <div className="py-6 space-y-6 max-h-[50vh] overflow-y-auto no-scrollbar pr-2 mt-4 border-t border-dashed">
                                <div className="space-y-3">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                        <Info className="h-3.5 w-3.5" /> Program Hakkında
                                    </h4>
                                    <p className="text-sm leading-relaxed text-[#1d1d1f]/80 font-medium">{selectedFund.description}</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-[#f5f5f7] rounded-2xl">
                                    <div className="space-y-1">
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                            <DollarSign className="h-3.5 w-3.5 text-primary" /> Bütçe Aralığı
                                        </h4>
                                        <p className="text-sm font-bold text-[#1d1d1f]">{selectedFund.budget}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                            <Calendar className="h-3.5 w-3.5 text-primary" /> Son Tarih
                                        </h4>
                                        <p className="text-sm font-bold text-[#1d1d1f]">{selectedFund.deadline}</p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                        <Target className="h-3.5 w-3.5" /> Başvuru Koşulları
                                    </h4>
                                    <p className="text-sm font-medium text-[#1d1d1f]/80 leading-relaxed">{selectedFund.requirements}</p>
                                </div>

                                <div className="space-y-3">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                        <CheckCircle2 className="h-3.5 w-3.5" /> Odak Alanları
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {(selectedFund.areas || []).map((area: string) => (
                                            <Badge key={area} variant="secondary" className="rounded-xl font-bold px-4 py-1 bg-white border border-black/5 text-[#1d1d1f]/80">{area}</Badge>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <DialogFooter className="gap-3 sm:gap-0 mt-8 pt-6 border-t">
                                <Button variant="ghost" onClick={() => setIsDetailsOpen(false)} className="rounded-2xl font-bold h-12 flex-1">Kapat</Button>
                                <Button asChild className="rounded-2xl font-bold h-12 flex-1 shadow-xl shadow-primary/20">
                                    <a href={selectedFund.url} target="_blank" rel="noopener noreferrer">
                                        Resmi Başvuru <ExternalLink className="ml-2 h-4 w-4" />
                                    </a>
                                </Button>
                            </DialogFooter>
                        </div>
                    </DialogContent>
                )}
            </Dialog>
        </div>
    );
}