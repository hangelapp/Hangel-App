'use client';

import React, { useMemo, useState } from 'react';
import {
    Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { COLLECTIONS } from '@/firebase/collections';
import { useActiveEntity } from '../active-entity-context';
import {
    HandCoins, Wallet, Building2, CalendarDays, Loader2, AlertTriangle, TrendingUp,
} from 'lucide-react';
import { format, parse } from 'date-fns';
import { tr } from 'date-fns/locale';

type Donation = {
    id: string;
    brandId?: string;
    brandName?: string;
    purchaseAmount?: string;
    donationAmount?: string;
    date?: string;
    period?: string;
    status?: string;
    type?: 'income' | 'expense';
    ngo?: string[];
    split?: { gross?: number; netAfterTax?: number; ngoShareTotal?: number; hangelShare?: number };
};

const fmtAmount = (v: unknown) => {
    const n = typeof v === 'string' ? parseFloat(v) : Number(v || 0);
    return Number.isFinite(n) ? n.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' }) : '0,00 ₺';
};

const fmtMonth = (period: string) => {
    try { return format(parse(period, 'yyyy-MM', new Date()), 'MMMM yyyy', { locale: tr }); }
    catch { return period; }
};

const fmtDay = (date: string) => {
    try { return format(parse(date, 'yyyy-MM-dd', new Date()), 'd MMM yyyy', { locale: tr }); }
    catch { return date; }
};

export default function BrandEarningsPage() {
    const db = useFirestore();
    const { id: brandId, kind, isLoading: entityLoading } = useActiveEntity();
    const [nowMs] = useState<number>(() => Date.now());

    const donationsQuery = useMemoFirebase(
        () => (db && brandId && kind === 'brand'
            ? query(collection(db, COLLECTIONS.donations), where('brandId', '==', brandId))
            : null),
        [db, brandId, kind],
    );
    const { data: donations, isLoading } = useCollection<Donation>(donationsQuery);

    const list = useMemo(() => (donations || []).filter(d => d.type !== 'income'), [donations]);

    const totals = useMemo(() => {
        let gross = 0, ngoNet = 0, hangel = 0;
        for (const d of list) {
            gross += parseFloat(d.donationAmount || '0') || 0;
            ngoNet += Number(d.split?.ngoShareTotal) || 0;
            hangel += Number(d.split?.hangelShare) || 0;
        }
        return { gross, ngoNet, hangel, count: list.length };
    }, [list]);

    // Aylık kırılım (period YYYY-MM), en yeni üstte.
    const monthly = useMemo(() => {
        const map = new Map<string, { period: string; gross: number; ngoNet: number; hangel: number; count: number }>();
        for (const d of list) {
            const period = d.period || (d.date ? d.date.slice(0, 7) : 'Bilinmeyen');
            if (!map.has(period)) map.set(period, { period, gross: 0, ngoNet: 0, hangel: 0, count: 0 });
            const e = map.get(period)!;
            e.gross += parseFloat(d.donationAmount || '0') || 0;
            e.ngoNet += Number(d.split?.ngoShareTotal) || 0;
            e.hangel += Number(d.split?.hangelShare) || 0;
            e.count++;
        }
        return Array.from(map.values()).sort((a, b) => b.period.localeCompare(a.period));
    }, [list]);

    // Günlük kırılım (date YYYY-MM-DD), son ~30 gün.
    const daily = useMemo(() => {
        const cutoff = new Date(nowMs);
        cutoff.setDate(cutoff.getDate() - 30);
        const cutoffStr = cutoff.toISOString().slice(0, 10);
        const map = new Map<string, { date: string; gross: number; ngoNet: number; hangel: number; count: number }>();
        for (const d of list) {
            const date = d.date || '';
            if (!date || date < cutoffStr) continue;
            if (!map.has(date)) map.set(date, { date, gross: 0, ngoNet: 0, hangel: 0, count: 0 });
            const e = map.get(date)!;
            e.gross += parseFloat(d.donationAmount || '0') || 0;
            e.ngoNet += Number(d.split?.ngoShareTotal) || 0;
            e.hangel += Number(d.split?.hangelShare) || 0;
            e.count++;
        }
        return Array.from(map.values()).sort((a, b) => b.date.localeCompare(a.date));
    }, [list, nowMs]);

    if (entityLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }

    if (kind !== 'brand') {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-black tracking-tighter text-[#1d1d1f]">Bağış Kazançları</h1>
                </div>
                <Card className="rounded-2xl border-orange-300/50 bg-orange-50/50">
                    <CardContent className="p-6 flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5 shrink-0" />
                        <div>
                            <p className="font-bold text-orange-900">Bu sayfa markalar içindir</p>
                            <p className="text-sm text-orange-800/80 mt-1">
                                Bağış kazançları yalnızca marka panellerinde görüntülenebilir. Lütfen üst menüden bir marka hesabına geçiş yapın.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (isLoading && list.length === 0) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-black tracking-tighter text-[#1d1d1f]">Bağış Kazançları</h1>
                <p className="text-muted-foreground text-sm font-medium">
                    Markanız üzerinden oluşan bağışların aylık ve günlük dökümü.
                </p>
            </div>

            {/* Özet kartları */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Card className="rounded-2xl border-primary/20">
                    <CardContent className="p-4">
                        <p className="text-2xl font-black text-primary">{fmtAmount(totals.gross)}</p>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">Toplam Bağış (brüt)</p>
                    </CardContent>
                </Card>
                <Card className="rounded-2xl border-green-300/50">
                    <CardContent className="p-4">
                        <p className="text-2xl font-black text-green-600">{fmtAmount(totals.ngoNet)}</p>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">STK'lara Giden Net</p>
                    </CardContent>
                </Card>
                <Card className="rounded-2xl">
                    <CardContent className="p-4">
                        <p className="text-2xl font-black">{fmtAmount(totals.hangel)}</p>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">hangel Payı</p>
                    </CardContent>
                </Card>
                <Card className="rounded-2xl">
                    <CardContent className="p-4">
                        <p className="text-2xl font-black">{totals.count.toLocaleString('tr-TR')}</p>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">İşlem Sayısı</p>
                    </CardContent>
                </Card>
            </div>

            <Card className="rounded-[2rem] border-black/5 shadow-xl">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><HandCoins className="h-5 w-5" /> Dönemsel Kırılım</CardTitle>
                    <CardDescription>Aylık ve günlük olarak oluşan bağış miktarları.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="monthly">
                        <TabsList className="grid w-full grid-cols-2 max-w-md">
                            <TabsTrigger value="monthly">
                                <CalendarDays className="h-4 w-4 mr-2" /> AYLIK ({monthly.length})
                            </TabsTrigger>
                            <TabsTrigger value="daily">
                                <TrendingUp className="h-4 w-4 mr-2" /> GÜNLÜK ({daily.length})
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="monthly" className="mt-4">
                            {monthly.length === 0 ? (
                                <div className="py-16 text-center text-muted-foreground">
                                    <Building2 className="h-10 w-10 mx-auto opacity-30 mb-2" />
                                    <p>Henüz bağış kaydı yok.</p>
                                </div>
                            ) : (
                                <div className="border rounded-2xl overflow-hidden overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-muted/30">
                                            <tr>
                                                <th className="text-left p-4 font-bold">Dönem</th>
                                                <th className="text-right p-4 font-bold">Toplam Bağış (brüt)</th>
                                                <th className="text-right p-4 font-bold text-green-600">STK Net</th>
                                                <th className="text-right p-4 font-bold">hangel</th>
                                                <th className="text-right p-4 font-bold">İşlem</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {monthly.map(m => (
                                                <tr key={m.period} className="hover:bg-muted/20">
                                                    <td className="p-4 font-semibold capitalize">{fmtMonth(m.period)}</td>
                                                    <td className="p-4 text-right font-bold text-primary">{fmtAmount(m.gross)}</td>
                                                    <td className="p-4 text-right text-green-700">{fmtAmount(m.ngoNet)}</td>
                                                    <td className="p-4 text-right">{fmtAmount(m.hangel)}</td>
                                                    <td className="p-4 text-right text-muted-foreground">{m.count}</td>
                                                </tr>
                                            ))}
                                            <tr className="border-t-2 bg-muted/30 font-black">
                                                <td className="p-4">TOPLAM</td>
                                                <td className="p-4 text-right text-primary">{fmtAmount(totals.gross)}</td>
                                                <td className="p-4 text-right text-green-700">{fmtAmount(totals.ngoNet)}</td>
                                                <td className="p-4 text-right">{fmtAmount(totals.hangel)}</td>
                                                <td className="p-4 text-right">{totals.count}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="daily" className="mt-4">
                            {daily.length === 0 ? (
                                <div className="py-16 text-center text-muted-foreground">
                                    <CalendarDays className="h-10 w-10 mx-auto opacity-30 mb-2" />
                                    <p>Son 30 günde bağış kaydı yok.</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <Badge variant="outline" className="text-[10px] font-bold uppercase">
                                        <Wallet className="h-3 w-3 mr-1" /> Son 30 gün
                                    </Badge>
                                    <div className="border rounded-2xl overflow-hidden overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead className="bg-muted/30">
                                                <tr>
                                                    <th className="text-left p-4 font-bold">Gün</th>
                                                    <th className="text-right p-4 font-bold">Toplam Bağış (brüt)</th>
                                                    <th className="text-right p-4 font-bold text-green-600">STK Net</th>
                                                    <th className="text-right p-4 font-bold">hangel</th>
                                                    <th className="text-right p-4 font-bold">İşlem</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y">
                                                {daily.map(d => (
                                                    <tr key={d.date} className="hover:bg-muted/20">
                                                        <td className="p-4 font-semibold">{fmtDay(d.date)}</td>
                                                        <td className="p-4 text-right font-bold text-primary">{fmtAmount(d.gross)}</td>
                                                        <td className="p-4 text-right text-green-700">{fmtAmount(d.ngoNet)}</td>
                                                        <td className="p-4 text-right">{fmtAmount(d.hangel)}</td>
                                                        <td className="p-4 text-right text-muted-foreground">{d.count}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}
