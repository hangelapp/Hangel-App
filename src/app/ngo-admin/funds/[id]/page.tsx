'use client';

import React, { useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, HandCoins, ExternalLink, Info, CheckCircle2, Calendar, Target, DollarSign, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
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

const normalizeUrl = (raw?: string | null): string | null => {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^\/\//.test(trimmed)) return `https:${trimmed}`;
  return `https://${trimmed.replace(/^\/+/, '')}`;
};

// Same fallback list used in /ngo-admin/funds — kept in sync.
const fallbackFunds: Fund[] = [
    { id: '1', name: 'Avrupa Birliği Sivil Toplum Destek Programı', provider: 'Avrupa Birliği Delegasyonu', status: 'Açık', deadline: '2024-10-31', areas: ['İnsan Hakları', 'Çevre'], description: 'Türkiye ve AB arasındaki sivil toplum diyaloğunu güçlendirmek, sivil toplumun kurumsal kapasitesini artırmak ve karar alma süreçlerine katılımını desteklemek amacıyla hibe desteği sunar.', budget: '60.000 € - 150.000 €', requirements: 'En az 3 yıldır aktif faaliyet gösteren dernek ve vakıflar.', url: 'https://www.ab.gov.tr' },
    { id: '2', name: 'Türkiye Sosyal Girişimcilik Ağı Hibe Programı', provider: 'Koç Üniversitesi Sosyal Etki Forumu', status: 'Açık', deadline: '2024-09-15', areas: ['Sosyal Girişimcilik', 'Gençlik'], description: 'Sosyal girişimlerin kapasite gelişimini, ekosistem içindeki işbirliklerini ve toplumsal etki odaklı yeni iş modellerini destekleyen bir hızlandırma ve hibe programıdır.', budget: '25.000 ₺ - 75.000 ₺', requirements: 'Sosyal girişim statüsündeki veya bu modele geçmek isteyen yapılar.', url: 'https://sosyalgirisimcilikagi.org' },
    { id: '3', name: 'Kültür Sanat Fonu', provider: 'Sabancı Vakfı', status: 'Kapandı', deadline: '2024-07-01', areas: ['Kültür & Sanat'], description: 'Kadınlar, gençler ve engelliler odaklı sosyal projeleri kültür ve sanat aracılığıyla destekler. Toplumsal farkındalık yaratan yaratıcı projelere öncelik verir.', budget: '100.000 ₺ - 300.000 ₺', requirements: 'Kamu yararına çalışan dernek ve vakıflar.', url: 'https://www.sabancivakfi.org' },
];

export default function FundDetailPage() {
    const router = useRouter();
    const params = useParams<{ id: string }>();
    const id = params?.id;
    const db = useFirestore();

    // Firestore'dan oku — yoksa fallback listesinden eşleştir.
    const fundDocRef = useMemoFirebase(
        () => (db && id ? doc(db, COLLECTIONS.funds, id) : null),
        [db, id],
    );
    const { data: cmsFund, isLoading } = useDoc<Fund>(fundDocRef);

    const fund = useMemo<Fund | null>(() => {
        if (cmsFund) return { ...cmsFund, id: id! };
        const fb = fallbackFunds.find(f => f.id === id);
        return fb || null;
    }, [cmsFund, id]);

    if (isLoading && !fund) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!fund) {
        return (
            <div className="p-6 max-w-3xl mx-auto space-y-6">
                <Button onClick={() => router.back()} variant="ghost" size="icon" aria-label="Geri">
                    <ArrowLeft className="h-6 w-6" />
                </Button>
                <Card className="p-10 text-center space-y-3">
                    <HandCoins className="h-10 w-10 mx-auto text-muted-foreground/60" />
                    <h1 className="text-xl font-bold">Fon bulunamadı</h1>
                    <p className="text-sm text-muted-foreground">Aradığınız fon kaldırılmış veya kimliği yanlış olabilir.</p>
                    <Button onClick={() => router.push('/ngo-admin/funds')}>Tüm fonlara dön</Button>
                </Card>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-6 animate-in fade-in-0 pb-20">
            <Button onClick={() => router.back()} variant="ghost" size="icon" className="-ml-2" aria-label="Geri">
                <ArrowLeft className="h-6 w-6" />
            </Button>

            <Card className="overflow-hidden border-none shadow-2xl rounded-[2.5rem]">
                <div className="h-2 w-full bg-primary" />
                <div className="p-6 sm:p-8 space-y-6">
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <HandCoins className="h-6 w-6 text-primary" />
                            <Badge className={cn(
                                "font-black text-[9px] tracking-widest px-3 py-1 uppercase rounded-lg border-none",
                                fund.status === 'Açık' ? 'bg-green-600 text-white' : 'bg-muted text-muted-foreground'
                            )}>
                                {fund.status}
                            </Badge>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1d1d1f] leading-tight">{fund.name}</h1>
                        <p className="text-base font-bold text-primary">{fund.provider}</p>
                    </div>

                    <div className="border-t border-dashed pt-6 space-y-6">
                        <section className="space-y-3">
                            <h2 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                <Info className="h-3.5 w-3.5" /> Program Hakkında
                            </h2>
                            <p className="text-sm leading-relaxed text-[#1d1d1f]/80 font-medium">{fund.description}</p>
                        </section>

                        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-[#f5f5f7] rounded-2xl">
                            <div className="space-y-1">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                    <DollarSign className="h-3.5 w-3.5 text-primary" /> Bütçe Aralığı
                                </h3>
                                <p className="text-sm font-bold text-[#1d1d1f]">{fund.budget || '—'}</p>
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                    <Calendar className="h-3.5 w-3.5 text-primary" /> Son Tarih
                                </h3>
                                <p className="text-sm font-bold text-[#1d1d1f]">{fund.deadline}</p>
                            </div>
                        </section>

                        {fund.requirements && (
                            <section className="space-y-3">
                                <h2 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                    <Target className="h-3.5 w-3.5" /> Başvuru Koşulları
                                </h2>
                                <p className="text-sm font-medium text-[#1d1d1f]/80 leading-relaxed">{fund.requirements}</p>
                            </section>
                        )}

                        {fund.areas && fund.areas.length > 0 && (
                            <section className="space-y-3">
                                <h2 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                    <CheckCircle2 className="h-3.5 w-3.5" /> Odak Alanları
                                </h2>
                                <div className="flex flex-wrap gap-2">
                                    {fund.areas.map((area) => (
                                        <Badge key={area} variant="secondary" className="rounded-xl font-bold px-4 py-1 bg-white border border-black/5 text-[#1d1d1f]/80">{area}</Badge>
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>

                    <div className="pt-6 border-t flex flex-col sm:flex-row gap-3">
                        <Button variant="outline" onClick={() => router.back()} className="rounded-2xl font-bold h-12 flex-1">Geri Dön</Button>
                        {(() => {
                            const officialUrl = normalizeUrl(fund.url);
                            return officialUrl ? (
                                <Button asChild className="rounded-2xl font-bold h-12 flex-1 shadow-xl shadow-primary/20">
                                    <a href={officialUrl} target="_blank" rel="noopener noreferrer">
                                        Resmi Başvuru <ExternalLink className="ml-2 h-4 w-4" />
                                    </a>
                                </Button>
                            ) : null;
                        })()}
                    </div>
                </div>
            </Card>
        </div>
    );
}
