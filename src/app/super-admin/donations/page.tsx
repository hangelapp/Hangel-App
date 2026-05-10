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
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import {
    collection, doc, query, orderBy, updateDoc, addDoc, serverTimestamp,
} from 'firebase/firestore';
import {
    HandCoins, Search, CheckCircle2, Clock, XCircle, Loader2, TrendingUp, Building, Eye, FileText,
} from 'lucide-react';
import { format, parse } from 'date-fns';
import { tr } from 'date-fns/locale';

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
    createdAt?: any;
    payoutDate?: any;
};

const STATUS_TONES: Record<string, { class: string; icon: any; label: string }> = {
    'Yatırıldı': { class: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle2, label: 'Yatırıldı' },
    'Tamamlandı': { class: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle2, label: 'Tamamlandı' },
    'İşleme Alındı': { class: 'bg-orange-100 text-orange-700 border-orange-200', icon: Clock, label: 'İşleme Alındı' },
    'Yönlendirildi': { class: 'bg-orange-100 text-orange-700 border-orange-200', icon: Clock, label: 'Yönlendirildi' },
    'Reddedildi': { class: 'bg-red-100 text-red-700 border-red-200', icon: XCircle, label: 'Reddedildi' },
};

const fmtAmount = (v: any) => {
    const n = typeof v === 'string' ? parseFloat(v) : Number(v || 0);
    return Number.isFinite(n) ? n.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' }) : '0,00 ₺';
};

const fmtDate = (v: any) => {
    if (!v) return '';
    try {
        if (v?.toDate) return format(v.toDate(), 'd MMM yyyy', { locale: tr });
        if (typeof v === 'string') return format(parse(v, 'yyyy-MM-dd', new Date()), 'd MMM yyyy', { locale: tr });
    } catch {}
    return v;
};

export default function DonationsAdminPage() {
    const db = useFirestore();
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [editingDonation, setEditingDonation] = useState<Donation | null>(null);
    const [editPurchase, setEditPurchase] = useState('');
    const [editDonation, setEditDonation] = useState('');
    const [savingEdit, setSavingEdit] = useState(false);

    const donationsQuery = useMemoFirebase(
        () => (db ? query(collection(db, 'donations'), orderBy('createdAt', 'desc')) : null),
        [db],
    );
    const { data: donations, isLoading } = useCollection<Donation>(donationsQuery);

    const list = donations || [];

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

    // STK hak edişleri (her STK için toplam bağış miktarı + işlem sayısı)
    const ngoEarnings = useMemo(() => {
        const map = new Map<string, { ngo: string; totalAmount: number; pendingAmount: number; paidAmount: number; count: number }>();
        for (const d of list) {
            if (d.type === 'income') continue;
            const amount = parseFloat(d.donationAmount || '0') || 0;
            const ngoNames = d.ngo && d.ngo.length > 0 ? d.ngo : ['Atanmamış'];
            for (const n of ngoNames) {
                if (!map.has(n)) map.set(n, { ngo: n, totalAmount: 0, pendingAmount: 0, paidAmount: 0, count: 0 });
                const e = map.get(n)!;
                e.totalAmount += amount;
                e.count++;
                if (d.status === 'Yatırıldı' || d.status === 'Tamamlandı') e.paidAmount += amount;
                else e.pendingAmount += amount;
            }
        }
        return Array.from(map.values()).sort((a, b) => b.totalAmount - a.totalAmount);
    }, [list]);

    const updateStatus = async (donationId: string, newStatus: string, userId?: string, brandName?: string, donationAmount?: string) => {
        try {
            const updatePayload: any = { status: newStatus };
            if (newStatus === 'Yatırıldı' || newStatus === 'Tamamlandı') {
                updatePayload.payoutDate = serverTimestamp();
            }
            await updateDoc(doc(db, 'donations', donationId), updatePayload);

            // Kullanıcıya bildirim gönder
            if (userId && newStatus === 'Yatırıldı') {
                try {
                    await addDoc(collection(db, 'notifications'), {
                        userId,
                        type: 'donation',
                        title: 'Bağışınız STK\'ya aktarıldı',
                        body: `${brandName || 'Marka'} üzerinden yaptığınız ${donationAmount || '0'} ₺ bağış başarıyla STK'ya aktarıldı.`,
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
        } catch (e: any) {
            console.error('Status update failed:', e);
            toast({ variant: 'destructive', title: 'Hata', description: e?.message || 'Güncellenemedi.' });
        }
    };

    const handleSaveEdit = async () => {
        if (!editingDonation) return;
        setSavingEdit(true);
        try {
            await updateDoc(doc(db, 'donations', editingDonation.id), {
                purchaseAmount: editPurchase,
                donationAmount: editDonation,
            });
            toast({ title: 'Tutarlar güncellendi' });
            setEditingDonation(null);
        } catch (e: any) {
            toast({ variant: 'destructive', title: 'Hata', description: e?.message });
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
                <h1 className="text-3xl font-black tracking-tighter text-[#1d1d1f]">Bağış Yönetimi</h1>
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

            <Card className="rounded-[2rem] border-black/5 shadow-xl">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><HandCoins className="h-5 w-5" /> Bağışlar &amp; Hakedişler</CardTitle>
                    <CardDescription>İşlem detayları ve STK bazında toplam hak edişler.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="donations">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="donations">
                                <FileText className="h-4 w-4 mr-2" /> BAĞIŞLAR ({stats.count})
                            </TabsTrigger>
                            <TabsTrigger value="earnings">
                                <Building className="h-4 w-4 mr-2" /> HAKEDİŞLER ({ngoEarnings.length})
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
                                <div className="border rounded-2xl overflow-hidden">
                                    <table className="w-full text-sm">
                                        <thead className="bg-muted/30">
                                            <tr>
                                                <th className="text-left p-4 font-bold">STK</th>
                                                <th className="text-right p-4 font-bold">Toplam</th>
                                                <th className="text-right p-4 font-bold text-orange-600">Bekleyen</th>
                                                <th className="text-right p-4 font-bold text-green-600">Yatırılan</th>
                                                <th className="text-right p-4 font-bold">İşlem</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {ngoEarnings.map(e => (
                                                <tr key={e.ngo} className="border-t hover:bg-muted/20">
                                                    <td className="p-4 font-bold">{e.ngo}</td>
                                                    <td className="p-4 text-right font-bold text-primary">{fmtAmount(e.totalAmount)}</td>
                                                    <td className="p-4 text-right text-orange-600">{fmtAmount(e.pendingAmount)}</td>
                                                    <td className="p-4 text-right text-green-600">{fmtAmount(e.paidAmount)}</td>
                                                    <td className="p-4 text-right">{e.count}</td>
                                                </tr>
                                            ))}
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
                                            </tr>
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
