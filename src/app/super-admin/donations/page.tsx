'use client';

import React, { useMemo, useState } from 'react';
import {
    Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useUser, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import {
    collection, doc, query, orderBy, updateDoc, addDoc, setDoc, serverTimestamp,
} from 'firebase/firestore';
import { normalizeRates, type DonationRates } from '@/lib/donation-split';
import {
    HandCoins, Search, CheckCircle2, Clock, XCircle, Loader2, Building, FileText, Wallet, Receipt,
} from 'lucide-react';
import { format, parse } from 'date-fns';
import { tr } from 'date-fns/locale';
import { COLLECTIONS } from '@/firebase/collections';
import { printPayoutReceipt } from '@/components/shared/payout-receipt';

type Donation = {
    id: string;
    userId: string;
    userName?: string;
    userEmail?: string;
    brand?: string;
    brandId?: string;
    brandName?: string;
    purchaseAmount?: string;
    donationAmount?: string;
    donationRate?: number;
    date?: string;
    time?: string;
    type?: 'income' | 'expense';
    status?: string;
    ngo?: string[];
    ngoIds?: string[];
    ngoSplit?: { ngoId: string; ngoName: string; amount: number }[];
    split?: { gross?: number; netAfterTax?: number; ngoShareTotal?: number; hangelShare?: number; perNgo?: number; ngoCount?: number };
    period?: string;
    settlementStatus?: string;
    createdAt?: unknown;
    payoutDate?: unknown;
};

type Payout = {
    id: string;
    ngoId?: string;
    ngoName?: string;
    period?: string;
    amount?: number;
    donationCount?: number;
    status?: string;
    reference?: string;
    notes?: string;
    paidAt?: { toDate?: () => Date } | null;
    createdAt?: unknown;
};

const STATUS_TONES: Record<string, { class: string; icon: React.ComponentType<{ className?: string }>; label: string }> = {
    'Yatırıldı': { class: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle2, label: 'Yatırıldı' },
    'Tamamlandı': { class: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle2, label: 'Tamamlandı' },
    'İşleme Alındı': { class: 'bg-orange-100 text-orange-700 border-orange-200', icon: Clock, label: 'İşleme Alındı' },
    'Yönlendirildi': { class: 'bg-orange-100 text-orange-700 border-orange-200', icon: Clock, label: 'Yönlendirildi' },
    'Reddedildi': { class: 'bg-red-100 text-red-700 border-red-200', icon: XCircle, label: 'Reddedildi' },
};

const fmtAmount = (v: unknown) => {
    const n = typeof v === 'string' ? parseFloat(v) : Number(v || 0);
    return Number.isFinite(n) ? n.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' }) : '0,00 ₺';
};

const fmtDate = (v: unknown) => {
    if (!v) return '';
    try {
        const maybeDate = v as { toDate?: () => Date } | null;
        if (maybeDate?.toDate) return format(maybeDate.toDate(), 'd MMM yyyy', { locale: tr });
        if (typeof v === 'string') return format(parse(v, 'yyyy-MM-dd', new Date()), 'd MMM yyyy', { locale: tr });
    } catch {}
    return typeof v === 'string' ? v : '';
};

export default function DonationsAdminPage() {
    const db = useFirestore();
    const { user: authUser } = useUser();
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [editingDonation, setEditingDonation] = useState<Donation | null>(null);
    const [editPurchase, setEditPurchase] = useState('');
    const [editDonation, setEditDonation] = useState('');
    const [savingEdit, setSavingEdit] = useState(false);

    const donationsQuery = useMemoFirebase(
        () => (db ? query(collection(db, COLLECTIONS.donations), orderBy('createdAt', 'desc')) : null),
        [db],
    );
    const { data: donations, isLoading } = useCollection<Donation>(donationsQuery);

    const payoutsQuery = useMemoFirebase(
        () => (db ? query(collection(db, COLLECTIONS.payouts), orderBy('createdAt', 'desc')) : null),
        [db],
    );
    const { data: payouts } = useCollection<Payout>(payoutsQuery);
    const payoutList = useMemo(() => payouts || [], [payouts]);

    const list = useMemo(() => donations || [], [donations]);

    const filtered = useMemo(() => {
        return list.filter(d => {
            const status = d.status || 'İşleme Alındı';
            if (statusFilter !== 'all' && status !== statusFilter) return false;
            if (!searchTerm.trim()) return true;
            const q = searchTerm.toLowerCase();
            return (
                (d.brandName || d.brand || '').toLowerCase().includes(q) ||
                (d.userName || '').toLowerCase().includes(q) ||
                (d.userEmail || '').toLowerCase().includes(q) ||
                (d.ngo || []).some(n => n.toLowerCase().includes(q))
            );
        });
    }, [list, statusFilter, searchTerm]);

    const stats = useMemo(() => {
        const totalDonation = list
            .filter(d => d.type !== 'income')
            .reduce((s, d) => s + (parseFloat(d.donationAmount || '0') || 0), 0);
        const pending = list.filter(d => d.status === 'İşleme Alındı' || d.status === 'Yönlendirildi').length;
        const paid = list.filter(d => d.status === 'Yatırıldı' || d.status === 'Tamamlandı').length;
        const totalPurchase = list
            .filter(d => d.type !== 'income')
            .reduce((s, d) => s + (parseFloat(d.purchaseAmount || '0') || 0), 0);
        return { totalDonation, pending, paid, totalPurchase, count: list.length };
    }, [list]);

    // STK hak edişleri — ngoId bazında toplanır (payout route ngoId ister).
    // Her STK için ayrıca DÖNEM (period) kırılımı tutulur: o dönemin bekleyen
    // net toplamı + bekleyen sayısı. "O dönemi öde" butonu period payout çağırır.
    type PeriodRow = { period: string; pendingAmount: number; pendingCount: number };
    type EarningRow = {
        ngoId: string;
        ngo: string;
        totalAmount: number;
        pendingAmount: number;
        paidAmount: number;
        count: number;
        pendingCount: number;
        lastApprovalAt: number | null;
        periods: PeriodRow[];
    };
    const ngoEarnings = useMemo<EarningRow[]>(() => {
        const map = new Map<string, EarningRow & { _periods: Map<string, PeriodRow> }>();
        for (const d of list) {
            if (d.type === 'income') continue;
            const status = d.status || 'İşleme Alındı';
            const isPaid = status === 'Yatırıldı' || status === 'Tamamlandı';
            const payoutMaybe = d.payoutDate as { toDate?: () => Date } | undefined;
            const payoutMs = payoutMaybe?.toDate ? payoutMaybe.toDate().getTime() : null;
            const docPeriod = d.period || (d.date ? d.date.slice(0, 7) : '—');
            // NET hak ediş: yeni kayıtlar ngoSplit taşır (dernek başına net tutar +
            // ngoId). Eski kayıtlar (ngoSplit yok) → brüt donationAmount'ı dernek
            // sayısına böl ve ngoIds/ngo'dan id+ad türet.
            const gross = parseFloat(d.donationAmount || '0') || 0;
            const entries: { ngoId: string; name: string; amount: number }[] =
                Array.isArray(d.ngoSplit) && d.ngoSplit.length > 0
                    ? d.ngoSplit.map(s => ({ ngoId: s.ngoId, name: s.ngoName || s.ngoId, amount: Number(s.amount) || 0 }))
                    : (d.ngoIds && d.ngoIds.length > 0
                        ? d.ngoIds.map((id, i) => ({ ngoId: id, name: d.ngo?.[i] || id, amount: gross / d.ngoIds!.length }))
                        : [{ ngoId: '', name: d.ngo?.[0] || 'Atanmamış', amount: gross }]);
            for (const { ngoId, name, amount } of entries) {
                const key = ngoId || name;
                if (!map.has(key)) {
                    map.set(key, {
                        ngoId, ngo: name, totalAmount: 0, pendingAmount: 0, paidAmount: 0,
                        count: 0, pendingCount: 0, lastApprovalAt: null, periods: [],
                        _periods: new Map(),
                    });
                }
                const e = map.get(key)!;
                if (!e.ngo || e.ngo === e.ngoId) e.ngo = name;
                e.totalAmount += amount;
                e.count++;
                if (isPaid) {
                    e.paidAmount += amount;
                    if (payoutMs && (e.lastApprovalAt === null || payoutMs > e.lastApprovalAt)) {
                        e.lastApprovalAt = payoutMs;
                    }
                } else {
                    e.pendingAmount += amount;
                    if (status === 'İşleme Alındı') {
                        e.pendingCount++;
                        const p = e._periods.get(docPeriod) || { period: docPeriod, pendingAmount: 0, pendingCount: 0 };
                        p.pendingAmount += amount;
                        p.pendingCount++;
                        e._periods.set(docPeriod, p);
                    }
                }
            }
        }
        return Array.from(map.values())
            .map(({ _periods, ...rest }) => ({
                ...rest,
                periods: Array.from(_periods.values()).sort((a, b) => (a.period < b.period ? 1 : -1)),
            }))
            .sort((a, b) => b.totalAmount - a.totalAmount);
    }, [list]);

    // payoutTarget: `${ngoId}:${period}` veya `${ngoId}:__all__` (kilit + spinner).
    const [payoutTarget, setPayoutTarget] = useState<string | null>(null);
    const [nowMs] = useState<number>(() => Date.now());

    // Bağış oranları (ayarlanabilir) — webhook bunları okuyup dağıtımı yapar.
    const ratesRef = useMemoFirebase(() => (db ? doc(db, COLLECTIONS.siteSettings, 'donationRates') : null), [db]);
    const { data: ratesDoc } = useDoc<Partial<DonationRates>>(ratesRef);
    const rates = useMemo(() => normalizeRates(ratesDoc), [ratesDoc]);
    const [rateForm, setRateForm] = useState<{ incomeTaxRate: string; vatRate: string; hangelCommissionRate: string } | null>(null);
    const [savingRates, setSavingRates] = useState(false);
    const effRateForm = rateForm ?? {
        incomeTaxRate: String(Math.round(rates.incomeTaxRate * 100)),
        vatRate: String(Math.round(rates.vatRate * 100)),
        hangelCommissionRate: String(Math.round(rates.hangelCommissionRate * 100)),
    };
    const saveRates = async () => {
        if (!db || !ratesRef) return;
        setSavingRates(true);
        try {
            const toFrac = (s: string) => Math.min(1, Math.max(0, (parseFloat(s) || 0) / 100));
            await setDoc(ratesRef, {
                incomeTaxRate: toFrac(effRateForm.incomeTaxRate),
                vatRate: toFrac(effRateForm.vatRate),
                hangelCommissionRate: toFrac(effRateForm.hangelCommissionRate),
                updatedAt: serverTimestamp(),
            }, { merge: true });
            toast({ title: 'Oranlar kaydedildi', description: 'Yeni bağışlardan itibaren bu oranlar uygulanır.' });
            setRateForm(null);
        } catch (e) {
            toast({ variant: 'destructive', title: 'Kaydedilemedi', description: e instanceof Error ? e.message : '' });
        } finally { setSavingRates(false); }
    };

    // Marka kazançları — her markanın oluşturduğu bağış (brüt + net + hangel) + aylık/günlük.
    const brandEarnings = useMemo(() => {
        const todayStr = new Date(nowMs).toISOString().slice(0, 10);
        const monthStr = todayStr.slice(0, 7);
        const map = new Map<string, { brand: string; gross: number; ngoNet: number; hangel: number; count: number; monthGross: number; todayGross: number }>();
        for (const d of list) {
            if (d.type === 'income') continue;
            const key = d.brandName || d.brand || d.brandId || 'Bilinmeyen';
            if (!map.has(key)) map.set(key, { brand: key, gross: 0, ngoNet: 0, hangel: 0, count: 0, monthGross: 0, todayGross: 0 });
            const e = map.get(key)!;
            const gross = parseFloat(d.donationAmount || '0') || 0;
            e.gross += gross;
            e.ngoNet += Number(d.split?.ngoShareTotal) || 0;
            e.hangel += Number(d.split?.hangelShare) || 0;
            e.count++;
            if ((d.period || d.date?.slice(0, 7)) === monthStr) e.monthGross += gross;
            if (d.date === todayStr) e.todayGross += gross;
        }
        return Array.from(map.values()).sort((a, b) => b.gross - a.gross);
    }, [list, nowMs]);

    const fmtApproval = (ms: number | null) => {
        if (!ms) return '—';
        try { return format(new Date(ms), 'd MMM yyyy', { locale: tr }); } catch { return '—'; }
    };

    // Ödeme route'u (Admin SDK) — donations'a doğrudan client batch yerine
    // /api/super-admin/payout çağrılır: daha güvenli + payout kaydı + bildirim.
    const runPayout = async (
        row: EarningRow,
        opts: { action: 'payPeriod'; period: string } | { action: 'payAll' },
    ) => {
        if (!authUser || !row.ngoId) {
            toast({ variant: 'destructive', title: 'Hata', description: 'Bu STK için ngoId bulunamadı, ödeme yapılamaz.' });
            return;
        }
        const targetKey = `${row.ngoId}:${opts.action === 'payPeriod' ? opts.period : '__all__'}`;
        setPayoutTarget(targetKey);
        try {
            const token = await authUser.getIdToken();
            const res = await fetch('/api/super-admin/payout', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify(
                    opts.action === 'payPeriod'
                        ? { action: 'payPeriod', ngoId: row.ngoId, period: opts.period }
                        : { action: 'payAll', ngoId: row.ngoId },
                ),
            });
            const body = await res.json();
            if (!res.ok) throw new Error(body.message || 'Ödeme başarısız oldu.');
            toast({
                title: 'Hak ediş ödendi',
                description: `${body.ngoName || row.ngo} · ${body.period} · ${fmtAmount(body.amount)} (${body.donationCount} bağış)${body.notified ? '' : ' — STK yöneticisi bulunamadı, bildirim gitmedi.'}`,
            });
        } catch (e) {
            const message = e instanceof Error ? e.message : 'Hak ediş ödemesi başarısız oldu.';
            toast({ variant: 'destructive', title: 'Hata', description: message });
        } finally {
            setPayoutTarget(null);
        }
    };

    const updateStatus = async (donationId: string, newStatus: string, userId?: string, brandName?: string, donationAmount?: string) => {
        try {
            const updatePayload: Record<string, unknown> = { status: newStatus };
            if (newStatus === 'Yatırıldı' || newStatus === 'Tamamlandı') {
                updatePayload.payoutDate = serverTimestamp();
            }
            await updateDoc(doc(db, COLLECTIONS.donations, donationId), updatePayload);

            // Kullanıcıya bildirim gönder — Yatırıldı veya Tamamlandı için
            if (userId && (newStatus === 'Yatırıldı' || newStatus === 'Tamamlandı')) {
                try {
                    const isCompleted = newStatus === 'Tamamlandı';
                    await addDoc(collection(db, COLLECTIONS.notifications), {
                        userId,
                        type: 'donation',
                        title: isCompleted ? 'Bağışınız tamamlandı' : 'Bağışınız STK\'ya aktarıldı',
                        body: isCompleted
                            ? `${brandName || 'Marka'} üzerinden yaptığınız ${donationAmount || '0'} ₺ bağış tamamlandı. Teşekkürler!`
                            : `${brandName || 'Marka'} üzerinden yaptığınız ${donationAmount || '0'} ₺ bağış başarıyla STK'ya aktarıldı.`,
                        data: { donationId },
                        read: false,
                        createdAt: serverTimestamp(),
                        createdBy: 'super-admin',
                    });
                } catch (e) {
                    console.warn('Notification send failed:', e);
                }
            }

            toast({ title: 'Durum güncellendi', description: `Bağış "${newStatus}" olarak işaretlendi.` });
        } catch (e) {
            console.error('Status update failed:', e);
            const message = e instanceof Error ? e.message : 'Güncellenemedi.';
            toast({ variant: 'destructive', title: 'Hata', description: message });
        }
    };

    const handleSaveEdit = async () => {
        if (!editingDonation) return;
        setSavingEdit(true);
        try {
            await updateDoc(doc(db, COLLECTIONS.donations, editingDonation.id), {
                purchaseAmount: editPurchase,
                donationAmount: editDonation,
            });
            toast({ title: 'Tutarlar güncellendi' });
            setEditingDonation(null);
        } catch (e) {
            const message = e instanceof Error ? e.message : 'Hata oluştu.';
            toast({ variant: 'destructive', title: 'Hata', description: message });
        } finally {
            setSavingEdit(false);
        }
    };

    const startEdit = (d: Donation) => {
        setEditingDonation(d);
        setEditPurchase(d.purchaseAmount || '0.00');
        setEditDonation(d.donationAmount || '0.00');
    };

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
                <h1 className="text-3xl font-black tracking-tighter text-foreground">Bağış Yönetimi</h1>
                <p className="text-muted-foreground text-sm font-medium">Tüm kullanıcı bağışlarını ve STK hak edişlerini yönetin.</p>
            </div>

            {/* Özet kartları */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Card className="rounded-2xl">
                    <CardContent className="p-4">
                        <p className="text-2xl font-black">{stats.count.toLocaleString('tr-TR')}</p>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">Toplam İşlem</p>
                    </CardContent>
                </Card>
                <Card className="rounded-2xl border-orange-300/50">
                    <CardContent className="p-4">
                        <p className="text-2xl font-black text-orange-600">{stats.pending}</p>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">İşleme Alındı</p>
                    </CardContent>
                </Card>
                <Card className="rounded-2xl border-green-300/50">
                    <CardContent className="p-4">
                        <p className="text-2xl font-black text-green-600">{stats.paid}</p>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">Yatırıldı</p>
                    </CardContent>
                </Card>
                <Card className="rounded-2xl">
                    <CardContent className="p-4">
                        <p className="text-2xl font-black text-primary">{fmtAmount(stats.totalDonation)}</p>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">Toplam Bağış</p>
                    </CardContent>
                </Card>
            </div>

            {/* Bağış oranları — webhook dağıtımı bunları uygular */}
            <Card className="rounded-2xl border-primary/20 bg-primary/5">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2"><Wallet className="h-4 w-4 text-primary" /> Bağış Dağıtım Oranları</CardTitle>
                    <CardDescription>Brüt bağıştan düşülür; kalan net kullanıcının 2 derneğine %50/%50 paylaşılır. Yeni bağışlardan itibaren geçerli.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap items-end gap-3">
                    {([['incomeTaxRate', 'Gelir Vergisi %'], ['vatRate', 'KDV %'], ['hangelCommissionRate', 'hangel Komisyonu %']] as const).map(([k, label]) => (
                        <div key={k} className="space-y-1">
                            <Label className="text-xs">{label}</Label>
                            <Input type="number" min={0} max={100} className="h-10 w-28 rounded-xl"
                                value={effRateForm[k]}
                                onChange={e => setRateForm({ ...effRateForm, [k]: e.target.value })} />
                        </div>
                    ))}
                    <Button onClick={saveRates} disabled={savingRates} className="rounded-xl h-10">
                        {savingRates ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Oranları Kaydet
                    </Button>
                </CardContent>
            </Card>

            <Card className="rounded-[2rem] border-border shadow-xl">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><HandCoins className="h-5 w-5" /> Bağışlar &amp; Hakedişler</CardTitle>
                    <CardDescription>İşlem detayları, STK bazında hak edişler ve marka bazında oluşan bağışlar.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="donations">
                        <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="donations">
                                <FileText className="h-4 w-4 mr-2" /> BAĞIŞLAR ({stats.count})
                            </TabsTrigger>
                            <TabsTrigger value="earnings">
                                <Building className="h-4 w-4 mr-2" /> HAKEDİŞLER ({ngoEarnings.length})
                            </TabsTrigger>
                            <TabsTrigger value="payouts">
                                <Receipt className="h-4 w-4 mr-2" /> ÖDEMELER ({payoutList.length})
                            </TabsTrigger>
                            <TabsTrigger value="brands">
                                <Wallet className="h-4 w-4 mr-2" /> MARKALAR ({brandEarnings.length})
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="donations" className="mt-4 space-y-4">
                            {/* Filtre & arama */}
                            <div className="flex items-center gap-3 flex-wrap">
                                <div className="relative flex-1 min-w-[240px]">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Marka, kullanıcı, e-posta veya STK ara..."
                                        className="pl-10 h-10 rounded-xl"
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger className="h-10 w-48"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Tüm durumlar</SelectItem>
                                        <SelectItem value="İşleme Alındı">İşleme Alındı (turuncu)</SelectItem>
                                        <SelectItem value="Yatırıldı">Yatırıldı (yeşil)</SelectItem>
                                        <SelectItem value="Reddedildi">Reddedildi</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Liste */}
                            <div className="border rounded-2xl overflow-hidden divide-y">
                                {filtered.length === 0 ? (
                                    <div className="py-16 text-center text-muted-foreground">
                                        <HandCoins className="h-10 w-10 mx-auto opacity-30 mb-2" />
                                        <p>Eşleşen bağış işlemi bulunamadı.</p>
                                    </div>
                                ) : filtered.map(d => {
                                    const status = d.status || 'İşleme Alındı';
                                    const tone = STATUS_TONES[status] || STATUS_TONES['İşleme Alındı'];
                                    const StatusIcon = tone.icon;
                                    const isPaid = status === 'Yatırıldı' || status === 'Tamamlandı';
                                    return (
                                        <div key={d.id} className={`p-4 flex flex-col md:flex-row md:items-center gap-3 hover:bg-muted/30 ${isPaid ? 'border-l-4 border-l-green-500' : 'border-l-4 border-l-orange-400'}`}>
                                            <div className="flex-1 min-w-0 space-y-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <p className="font-bold text-sm truncate">{d.brandName || d.brand || 'Marka'}</p>
                                                    <Badge variant="outline" className={`text-[10px] font-bold uppercase ${tone.class}`}>
                                                        <StatusIcon className="h-3 w-3 mr-1" />
                                                        {tone.label}
                                                    </Badge>
                                                </div>
                                                <p className="text-xs text-muted-foreground truncate">
                                                    {d.userName || d.userEmail || d.userId} · {fmtDate(d.createdAt) || fmtDate(d.date)}
                                                </p>
                                                {d.ngo && d.ngo.length > 0 && (
                                                    <p className="text-xs text-muted-foreground truncate">STK: {d.ngo.join(', ')}</p>
                                                )}
                                            </div>
                                            <div className="text-right shrink-0 space-y-0.5">
                                                <p className="text-xs text-muted-foreground">Alışveriş: {fmtAmount(d.purchaseAmount)}</p>
                                                <p className="text-sm font-bold text-primary">Bağış: {fmtAmount(d.donationAmount)}</p>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0 flex-wrap">
                                                <Button size="sm" variant="outline" className="rounded-xl" onClick={() => startEdit(d)}>
                                                    Tutar Düzenle
                                                </Button>
                                                {!isPaid && (
                                                    <Button
                                                        size="sm"
                                                        className="rounded-xl bg-green-600 hover:bg-green-700"
                                                        onClick={() => updateStatus(d.id, 'Yatırıldı', d.userId, d.brandName || d.brand, d.donationAmount)}
                                                    >
                                                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Yatırıldı İşaretle
                                                    </Button>
                                                )}
                                                {isPaid && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="rounded-xl"
                                                        onClick={() => updateStatus(d.id, 'İşleme Alındı', d.userId, d.brandName || d.brand)}
                                                    >
                                                        Geri Al
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </TabsContent>

                        <TabsContent value="earnings" className="mt-4">
                            {ngoEarnings.length === 0 ? (
                                <div className="py-16 text-center text-muted-foreground">
                                    <Building className="h-10 w-10 mx-auto opacity-30 mb-2" />
                                    <p>STK hak edişi yok.</p>
                                </div>
                            ) : (
                                <div className="border rounded-2xl overflow-hidden overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-muted/30">
                                            <tr>
                                                <th className="text-left p-4 font-bold">STK</th>
                                                <th className="text-right p-4 font-bold">Toplam</th>
                                                <th className="text-right p-4 font-bold text-orange-600">Bekleyen</th>
                                                <th className="text-right p-4 font-bold text-green-600">Yatırılan</th>
                                                <th className="text-right p-4 font-bold">İşlem</th>
                                                <th className="text-right p-4 font-bold">Son Onay</th>
                                                <th className="text-right p-4 font-bold">Aksiyon</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {ngoEarnings.map(e => {
                                                const allKey = `${e.ngoId}:__all__`;
                                                const isLoadingAll = payoutTarget === allKey;
                                                const canPay = e.pendingCount > 0 && !!e.ngoId;
                                                const pendingPeriods = (e.periods || []).filter(p => p.pendingAmount > 0);
                                                return (
                                                    <React.Fragment key={e.ngoId || e.ngo}>
                                                    <tr className="border-t hover:bg-muted/20">
                                                        <td className="p-4 font-bold">{e.ngo}</td>
                                                        <td className="p-4 text-right font-bold text-primary">{fmtAmount(e.totalAmount)}</td>
                                                        <td className="p-4 text-right text-orange-600">{fmtAmount(e.pendingAmount)}</td>
                                                        <td className="p-4 text-right text-green-600">{fmtAmount(e.paidAmount)}</td>
                                                        <td className="p-4 text-right">{e.count}</td>
                                                        <td className="p-4 text-right text-xs text-muted-foreground">{fmtApproval(e.lastApprovalAt)}</td>
                                                        <td className="p-4 text-right">
                                                            <Button
                                                                size="sm"
                                                                disabled={!canPay || isLoadingAll}
                                                                className="rounded-xl bg-green-600 hover:bg-green-700"
                                                                onClick={() => runPayout(e, { action: 'payAll' })}
                                                            >
                                                                {isLoadingAll
                                                                    ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                                                                    : <Wallet className="h-3.5 w-3.5 mr-1" />}
                                                                Tümünü Öde
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                    {pendingPeriods.length > 0 && (
                                                        <tr className="bg-muted/10">
                                                            <td colSpan={7} className="px-4 pb-3 pt-0">
                                                                <div className="flex flex-wrap gap-2 items-center">
                                                                    <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Dönem kesimi:</span>
                                                                    {pendingPeriods.map(p => {
                                                                        const pk = `${e.ngoId}:${p.period}`;
                                                                        const loadingP = payoutTarget === pk;
                                                                        return (
                                                                            <Button key={p.period} size="sm" variant="outline" disabled={loadingP || !e.ngoId}
                                                                                className="rounded-xl h-8 text-xs"
                                                                                onClick={() => runPayout(e, { action: 'payPeriod', period: p.period })}>
                                                                                {loadingP ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Wallet className="h-3 w-3 mr-1" />}
                                                                                {p.period} · {fmtAmount(p.pendingAmount)} öde
                                                                            </Button>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                    </React.Fragment>
                                                );
                                            })}
                                            <tr className="border-t-2 bg-muted/30 font-black">
                                                <td className="p-4">TOPLAM</td>
                                                <td className="p-4 text-right text-primary">
                                                    {fmtAmount(ngoEarnings.reduce((s, e) => s + e.totalAmount, 0))}
                                                </td>
                                                <td className="p-4 text-right text-orange-600">
                                                    {fmtAmount(ngoEarnings.reduce((s, e) => s + e.pendingAmount, 0))}
                                                </td>
                                                <td className="p-4 text-right text-green-600">
                                                    {fmtAmount(ngoEarnings.reduce((s, e) => s + e.paidAmount, 0))}
                                                </td>
                                                <td className="p-4 text-right">{ngoEarnings.reduce((s, e) => s + e.count, 0)}</td>
                                                <td className="p-4" />
                                                <td className="p-4" />
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="payouts" className="mt-4">
                            {payoutList.length === 0 ? (
                                <div className="py-16 text-center text-muted-foreground">
                                    <Receipt className="h-10 w-10 mx-auto opacity-30 mb-2" />
                                    <p>Henüz ödeme kaydı yok.</p>
                                </div>
                            ) : (
                                <div className="border rounded-2xl overflow-hidden overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-muted/30">
                                            <tr>
                                                <th className="text-left p-4 font-bold">STK</th>
                                                <th className="text-left p-4 font-bold">Dönem</th>
                                                <th className="text-right p-4 font-bold text-green-600">Tutar (net)</th>
                                                <th className="text-right p-4 font-bold">Bağış</th>
                                                <th className="text-right p-4 font-bold">Tarih</th>
                                                <th className="text-right p-4 font-bold">Makbuz</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {payoutList.map(p => (
                                                <tr key={p.id} className="hover:bg-muted/20">
                                                    <td className="p-4 font-semibold">{p.ngoName || p.ngoId}</td>
                                                    <td className="p-4">{p.period || '—'}</td>
                                                    <td className="p-4 text-right text-green-700 font-bold">{fmtAmount(p.amount)}</td>
                                                    <td className="p-4 text-right text-muted-foreground">{p.donationCount ?? 0}</td>
                                                    <td className="p-4 text-right text-xs text-muted-foreground">{fmtDate(p.paidAt)}</td>
                                                    <td className="p-4 text-right">
                                                        <Button size="sm" variant="outline" className="rounded-xl"
                                                            onClick={() => printPayoutReceipt({
                                                                ngoName: p.ngoName || '',
                                                                period: p.period || '',
                                                                amount: p.amount || 0,
                                                                donationCount: p.donationCount || 0,
                                                                paidAtMs: p.paidAt?.toDate ? p.paidAt.toDate().getTime() : null,
                                                                reference: p.reference,
                                                                notes: p.notes,
                                                                payoutId: p.id,
                                                            })}>
                                                            <Receipt className="h-3.5 w-3.5 mr-1" /> Makbuz
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="brands" className="mt-4">
                            {brandEarnings.length === 0 ? (
                                <div className="py-16 text-center text-muted-foreground">
                                    <Wallet className="h-10 w-10 mx-auto opacity-30 mb-2" />
                                    <p>Marka bağışı yok.</p>
                                </div>
                            ) : (
                                <div className="border rounded-2xl overflow-hidden overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-muted/30">
                                            <tr>
                                                <th className="text-left p-4 font-bold">Marka</th>
                                                <th className="text-right p-4 font-bold">Toplam Bağış (brüt)</th>
                                                <th className="text-right p-4 font-bold text-green-600">STK Net</th>
                                                <th className="text-right p-4 font-bold text-primary">hangel</th>
                                                <th className="text-right p-4 font-bold">Bu Ay</th>
                                                <th className="text-right p-4 font-bold">Bugün</th>
                                                <th className="text-right p-4 font-bold">İşlem</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {brandEarnings.map(b => (
                                                <tr key={b.brand} className="hover:bg-muted/20">
                                                    <td className="p-4 font-semibold">{b.brand}</td>
                                                    <td className="p-4 text-right font-bold">{fmtAmount(b.gross)}</td>
                                                    <td className="p-4 text-right text-green-700">{fmtAmount(b.ngoNet)}</td>
                                                    <td className="p-4 text-right text-primary">{fmtAmount(b.hangel)}</td>
                                                    <td className="p-4 text-right">{fmtAmount(b.monthGross)}</td>
                                                    <td className="p-4 text-right">{fmtAmount(b.todayGross)}</td>
                                                    <td className="p-4 text-right text-muted-foreground">{b.count}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>

            {/* Tutar düzenle dialog */}
            <Dialog open={!!editingDonation} onOpenChange={(o) => !o && setEditingDonation(null)}>
                <DialogContent className="rounded-[2rem]">
                    <DialogHeader>
                        <DialogTitle>Tutarları Düzenle</DialogTitle>
                        <DialogDescription>{editingDonation?.brandName || editingDonation?.brand} — {editingDonation?.userName}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-2">
                            <Label>Alışveriş Tutarı (₺)</Label>
                            <Input value={editPurchase} onChange={e => setEditPurchase(e.target.value)} placeholder="0.00" />
                        </div>
                        <div className="space-y-2">
                            <Label>Bağış Tutarı (₺)</Label>
                            <Input value={editDonation} onChange={e => setEditDonation(e.target.value)} placeholder="0.00" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingDonation(null)}>İptal</Button>
                        <Button onClick={handleSaveEdit} disabled={savingEdit}>
                            {savingEdit && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Kaydet
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
