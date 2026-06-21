'use client';

import React, { useMemo, useState } from 'react';
import {
    Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useDoc, useMemoFirebase, useUser } from '@/firebase';
import { collection, doc, query, where } from 'firebase/firestore';
import { COLLECTIONS } from '@/firebase/collections';
import {
    normalizePool, poolRemaining, normalizePackage,
    type MessagingPool, type UnitPackage,
} from '@/lib/messaging-quota';
import {
    Send, Users, Mail, Building2, Loader2, PackagePlus, MessageSquare,
    Layers, CheckCircle2, Clock,
} from 'lucide-react';

const PKG_ICONS: Record<UnitPackage['iconKey'], React.ComponentType<{ className?: string }>> = {
    starter: Send,
    community: Users,
    active: Mail,
    corporate: Building2,
};

type NgoRow = { id: string; name?: string };
type WalletRow = { id: string; smsQuota?: number; mailQuota?: number; smsUsed?: number; mailUsed?: number };
type OrderRow = {
    id: string;
    ngoId?: string;
    ngoName?: string;
    packageName?: string;
    smsUnits?: number;
    mailUnits?: number;
    priceTRY?: number;
    status?: string;
    kind?: string;
};

const fmtInt = (n: number) => n.toLocaleString('tr-TR');

type PkgForm = {
    id?: string;
    name: string;
    iconKey: UnitPackage['iconKey'];
    smsUnits: string;
    mailUnits: string;
    priceTRY: string;
    active: boolean;
    order: string;
};

const emptyPkgForm = (order: number): PkgForm => ({
    name: '', iconKey: 'community', smsUnits: '', mailUnits: '', priceTRY: '',
    active: true, order: String(order),
});

export default function MessagingQuotaPage() {
    const db = useFirestore();
    const { user } = useUser();
    const { toast } = useToast();

    // ── Veri okuma ───────────────────────────────────────────────────────────
    const poolRef = useMemoFirebase(
        () => (db ? doc(db, COLLECTIONS.siteSettings, 'messagingBulkPool') : null),
        [db],
    );
    const { data: poolDoc } = useDoc<Partial<MessagingPool>>(poolRef);
    const pool = useMemo(() => normalizePool(poolDoc), [poolDoc]);
    const remaining = useMemo(() => poolRemaining(pool), [pool]);

    const packagesQuery = useMemoFirebase(
        () => (db ? query(collection(db, COLLECTIONS.messagingPackages), where('kind', '==', 'unit')) : null),
        [db],
    );
    const { data: pkgDocs } = useCollection<Record<string, unknown>>(packagesQuery);
    const packages = useMemo(
        () => (pkgDocs || [])
            .map(p => normalizePackage(p.id as string, p))
            .sort((a, b) => a.order - b.order),
        [pkgDocs],
    );

    const ngosQuery = useMemoFirebase(() => (db ? collection(db, COLLECTIONS.ngos) : null), [db]);
    const { data: ngos } = useCollection<NgoRow>(ngosQuery);

    const walletsQuery = useMemoFirebase(() => (db ? collection(db, COLLECTIONS.ngoMessagingWallets) : null), [db]);
    const { data: wallets } = useCollection<WalletRow>(walletsQuery);
    const walletById = useMemo(() => {
        const m = new Map<string, WalletRow>();
        for (const w of wallets || []) m.set(w.id, w);
        return m;
    }, [wallets]);

    const ordersQuery = useMemoFirebase(
        () => (db ? query(collection(db, COLLECTIONS.paymentOrders), where('kind', '==', 'unit-package')) : null),
        [db],
    );
    const { data: orders } = useCollection<OrderRow>(ordersQuery);
    const pendingOrders = useMemo(
        () => (orders || []).filter(o => (o.status || 'pending') === 'pending'),
        [orders],
    );

    // ── Form durumları ───────────────────────────────────────────────────────
    const [poolSms, setPoolSms] = useState('');
    const [poolMail, setPoolMail] = useState('');
    const [poolBusy, setPoolBusy] = useState(false);

    const [ngoSearch, setNgoSearch] = useState('');
    const [selectedNgo, setSelectedNgo] = useState<string>('');
    const [allocSms, setAllocSms] = useState('');
    const [allocMail, setAllocMail] = useState('');
    const [allocBusy, setAllocBusy] = useState(false);

    const [editPkg, setEditPkg] = useState<PkgForm | null>(null);
    const [pkgBusy, setPkgBusy] = useState(false);

    const [confirmBusy, setConfirmBusy] = useState<string | null>(null);

    const filteredNgos = useMemo(() => {
        const q = ngoSearch.trim().toLowerCase();
        const list = ngos || [];
        if (!q) return list.slice(0, 50);
        return list.filter(n => (n.name || n.id).toLowerCase().includes(q)).slice(0, 50);
    }, [ngos, ngoSearch]);

    const selectedNgoWallet = selectedNgo ? walletById.get(selectedNgo) : undefined;

    // ── API çağrısı ──────────────────────────────────────────────────────────
    const callQuotaApi = async (payload: Record<string, unknown>): Promise<{ ok: boolean; data: Record<string, unknown> }> => {
        if (!user) return { ok: false, data: { message: 'Oturum bulunamadı.' } };
        const token = await user.getIdToken();
        const res = await fetch('/api/super-admin/messaging/quota', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
        return { ok: res.ok, data };
    };

    const handleAddPool = async () => {
        const sms = parseInt(poolSms, 10) || 0;
        const mail = parseInt(poolMail, 10) || 0;
        if (sms <= 0 && mail <= 0) {
            toast({ variant: 'destructive', title: 'Geçersiz', description: 'En az bir adet girin.' });
            return;
        }
        setPoolBusy(true);
        try {
            const { ok, data } = await callQuotaApi({ action: 'addPool', sms, mail });
            if (!ok) throw new Error(typeof data.message === 'string' ? data.message : 'Havuza eklenemedi.');
            toast({ title: 'Havuza eklendi', description: `${fmtInt(sms)} SMS / ${fmtInt(mail)} mail eklendi.` });
            setPoolSms(''); setPoolMail('');
        } catch (e) {
            toast({ variant: 'destructive', title: 'Hata', description: e instanceof Error ? e.message : '' });
        } finally { setPoolBusy(false); }
    };

    const handleAllocate = async () => {
        if (!selectedNgo) {
            toast({ variant: 'destructive', title: 'STK seçilmedi', description: 'Lütfen bir STK seçin.' });
            return;
        }
        const sms = parseInt(allocSms, 10) || 0;
        const mail = parseInt(allocMail, 10) || 0;
        if (sms <= 0 && mail <= 0) {
            toast({ variant: 'destructive', title: 'Geçersiz', description: 'En az bir adet girin.' });
            return;
        }
        setAllocBusy(true);
        try {
            const { ok, data } = await callQuotaApi({ action: 'allocate', ngoId: selectedNgo, sms, mail });
            if (!ok) throw new Error(typeof data.message === 'string' ? data.message : 'Tahsis edilemedi.');
            toast({ title: 'Kota tanımlandı', description: `${fmtInt(sms)} SMS / ${fmtInt(mail)} mail tahsis edildi.` });
            setAllocSms(''); setAllocMail('');
        } catch (e) {
            toast({ variant: 'destructive', title: 'Hata', description: e instanceof Error ? e.message : '' });
        } finally { setAllocBusy(false); }
    };

    const handleSavePackage = async () => {
        if (!editPkg) return;
        if (!editPkg.name.trim()) {
            toast({ variant: 'destructive', title: 'Geçersiz', description: 'Paket adı gerekli.' });
            return;
        }
        setPkgBusy(true);
        try {
            const { ok, data } = await callQuotaApi({
                action: 'savePackage',
                id: editPkg.id,
                name: editPkg.name.trim(),
                iconKey: editPkg.iconKey,
                smsUnits: parseInt(editPkg.smsUnits, 10) || 0,
                mailUnits: parseInt(editPkg.mailUnits, 10) || 0,
                priceTRY: parseInt(editPkg.priceTRY, 10) || 0,
                active: editPkg.active,
                order: parseInt(editPkg.order, 10) || 0,
            });
            if (!ok) throw new Error(typeof data.message === 'string' ? data.message : 'Paket kaydedilemedi.');
            toast({ title: 'Paket kaydedildi', description: editPkg.name });
            setEditPkg(null);
        } catch (e) {
            toast({ variant: 'destructive', title: 'Hata', description: e instanceof Error ? e.message : '' });
        } finally { setPkgBusy(false); }
    };

    const handleConfirmOrder = async (orderId: string) => {
        setConfirmBusy(orderId);
        try {
            const { ok, data } = await callQuotaApi({ action: 'confirmOrder', orderId });
            if (!ok) throw new Error(typeof data.message === 'string' ? data.message : 'Sipariş onaylanamadı.');
            toast({ title: 'Sipariş onaylandı', description: 'Kota STK cüzdanına yüklendi.' });
        } catch (e) {
            toast({ variant: 'destructive', title: 'Hata', description: e instanceof Error ? e.message : '' });
        } finally { setConfirmBusy(null); }
    };

    const startEditPackage = (p: UnitPackage) => setEditPkg({
        id: p.id,
        name: p.name,
        iconKey: p.iconKey,
        smsUnits: String(p.smsUnits),
        mailUnits: String(p.mailUnits),
        priceTRY: String(p.priceTRY),
        active: p.active,
        order: String(p.order),
    });

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-black tracking-tighter text-foreground">SMS / Mail Kota Yönetimi</h1>
                <p className="text-muted-foreground text-sm font-medium">Bayilik havuzunu doldur, STK&apos;lara kota tanımla, paketleri ve siparişleri yönet.</p>
            </div>

            {/* (a) Bayilik Havuzu */}
            <Card className="rounded-[2rem] border-border shadow-xl">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Layers className="h-5 w-5" /> Bayilik Havuzu</CardTitle>
                    <CardDescription>Satın alınan toplu SMS/mail adetleri. STK tahsisleri bu havuzdan düşülür.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <div className="rounded-2xl border p-4">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">SMS</p>
                            <p className="text-2xl font-black mt-1">{fmtInt(remaining.sms)}</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                                Kalan · {fmtInt(pool.smsUsed)} kullanıldı / {fmtInt(pool.smsTotal)} toplam
                            </p>
                        </div>
                        <div className="rounded-2xl border p-4">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Mail</p>
                            <p className="text-2xl font-black mt-1">{fmtInt(remaining.mail)}</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                                Kalan · {fmtInt(pool.mailUsed)} kullanıldı / {fmtInt(pool.mailTotal)} toplam
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-end gap-3 border-t pt-4">
                        <div className="space-y-1">
                            <Label className="text-xs">SMS adet ekle</Label>
                            <Input type="number" min={0} className="h-10 w-36 rounded-xl" value={poolSms}
                                onChange={e => setPoolSms(e.target.value)} placeholder="0" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs">Mail adet ekle</Label>
                            <Input type="number" min={0} className="h-10 w-36 rounded-xl" value={poolMail}
                                onChange={e => setPoolMail(e.target.value)} placeholder="0" />
                        </div>
                        <Button onClick={handleAddPool} disabled={poolBusy} className="rounded-xl h-10">
                            {poolBusy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Havuza Ekle
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* (b) NGO Kota Tahsisi */}
            <Card className="rounded-[2rem] border-border shadow-xl">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><MessageSquare className="h-5 w-5" /> STK Kota Tahsisi</CardTitle>
                    <CardDescription>Bir STK seçip ücretsiz SMS/mail kotası tanımlayın (havuzdan düşülür).</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-1">
                        <Label className="text-xs">STK ara</Label>
                        <Input className="h-10 rounded-xl" value={ngoSearch}
                            onChange={e => setNgoSearch(e.target.value)} placeholder="STK adı ile ara..." />
                    </div>
                    <div className="border rounded-2xl max-h-56 overflow-y-auto divide-y">
                        {filteredNgos.length === 0 ? (
                            <p className="p-4 text-sm text-muted-foreground">Eşleşen STK yok.</p>
                        ) : filteredNgos.map(n => {
                            const w = walletById.get(n.id);
                            const selected = selectedNgo === n.id;
                            return (
                                <button key={n.id} type="button" onClick={() => setSelectedNgo(n.id)}
                                    className={`w-full text-left p-3 flex items-center justify-between gap-2 hover:bg-muted/30 ${selected ? 'bg-primary/5' : ''}`}>
                                    <span className="font-semibold text-sm truncate">{n.name || n.id}</span>
                                    <span className="text-[11px] text-muted-foreground shrink-0">
                                        Kota: {fmtInt(Math.max(0, (w?.smsQuota || 0) - (w?.smsUsed || 0)))} SMS / {fmtInt(Math.max(0, (w?.mailQuota || 0) - (w?.mailUsed || 0)))} mail
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                    {selectedNgo && (
                        <div className="rounded-2xl bg-muted/30 p-3 text-xs text-muted-foreground">
                            Seçili STK kotası: <b className="text-foreground">{fmtInt(selectedNgoWallet?.smsQuota || 0)}</b> SMS /
                            {' '}<b className="text-foreground">{fmtInt(selectedNgoWallet?.mailQuota || 0)}</b> mail toplam.
                        </div>
                    )}
                    <div className="flex flex-wrap items-end gap-3 border-t pt-4">
                        <div className="space-y-1">
                            <Label className="text-xs">SMS adet</Label>
                            <Input type="number" min={0} className="h-10 w-36 rounded-xl" value={allocSms}
                                onChange={e => setAllocSms(e.target.value)} placeholder="0" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs">Mail adet</Label>
                            <Input type="number" min={0} className="h-10 w-36 rounded-xl" value={allocMail}
                                onChange={e => setAllocMail(e.target.value)} placeholder="0" />
                        </div>
                        <Button onClick={handleAllocate} disabled={allocBusy || !selectedNgo} className="rounded-xl h-10">
                            {allocBusy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Kota Tanımla
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* (c) Paketler */}
            <Card className="rounded-[2rem] border-border shadow-xl">
                <CardHeader className="flex flex-row items-start justify-between gap-2">
                    <div>
                        <CardTitle className="flex items-center gap-2"><PackagePlus className="h-5 w-5" /> Kontör Paketleri</CardTitle>
                        <CardDescription>STK&apos;ların satın alabileceği SMS/mail paketleri.</CardDescription>
                    </div>
                    <Button variant="outline" className="rounded-xl shrink-0"
                        onClick={() => setEditPkg(emptyPkgForm(packages.length + 1))}>
                        <PackagePlus className="h-4 w-4 mr-2" /> Yeni Paket
                    </Button>
                </CardHeader>
                <CardContent>
                    {packages.length === 0 ? (
                        <p className="py-8 text-center text-sm text-muted-foreground">Henüz paket yok.</p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {packages.map(p => {
                                const Icon = PKG_ICONS[p.iconKey] || Users;
                                return (
                                    <div key={p.id} className="rounded-2xl border p-4 flex items-start gap-3">
                                        <div className="h-11 w-11 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                                            <Icon className="h-5 w-5 text-primary" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className="font-bold truncate">{p.name}</p>
                                                <Badge variant="outline" className={p.active
                                                    ? 'bg-green-100 text-green-700 border-green-200 text-[10px] font-bold'
                                                    : 'bg-gray-100 text-gray-600 border-gray-200 text-[10px] font-bold'}>
                                                    {p.active ? 'Aktif' : 'Pasif'}
                                                </Badge>
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                {fmtInt(p.smsUnits)} SMS · {fmtInt(p.mailUnits)} mail · {fmtInt(p.priceTRY)} ₺
                                            </p>
                                        </div>
                                        <Button size="sm" variant="outline" className="rounded-xl shrink-0"
                                            onClick={() => startEditPackage(p)}>Düzenle</Button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* (d) Bekleyen Siparişler */}
            <Card className="rounded-[2rem] border-border shadow-xl">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5" /> Bekleyen Siparişler ({pendingOrders.length})</CardTitle>
                    <CardDescription>Ödenmiş kontör paketi siparişlerini onaylayın; kota STK cüzdanına yüklenir.</CardDescription>
                </CardHeader>
                <CardContent>
                    {pendingOrders.length === 0 ? (
                        <p className="py-8 text-center text-sm text-muted-foreground">Bekleyen sipariş yok.</p>
                    ) : (
                        <div className="border rounded-2xl overflow-hidden divide-y">
                            {pendingOrders.map(o => (
                                <div key={o.id} className="p-4 flex flex-col md:flex-row md:items-center gap-3 hover:bg-muted/30">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-sm truncate">{o.packageName || 'Kontör Paketi'}</p>
                                        <p className="text-xs text-muted-foreground truncate">
                                            {o.ngoName || o.ngoId || 'STK'} · {fmtInt(o.smsUnits || 0)} SMS / {fmtInt(o.mailUnits || 0)} mail
                                            {typeof o.priceTRY === 'number' ? ` · ${fmtInt(o.priceTRY)} ₺` : ''}
                                        </p>
                                    </div>
                                    <Button size="sm" className="rounded-xl bg-green-600 hover:bg-green-700 shrink-0"
                                        disabled={confirmBusy === o.id} onClick={() => handleConfirmOrder(o.id)}>
                                        {confirmBusy === o.id
                                            ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                                            : <CheckCircle2 className="h-3.5 w-3.5 mr-1" />} Onayla
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Paket düzenle/oluştur dialog */}
            <Dialog open={!!editPkg} onOpenChange={(o) => !o && setEditPkg(null)}>
                <DialogContent className="rounded-[2rem]">
                    <DialogHeader>
                        <DialogTitle>{editPkg?.id ? 'Paketi Düzenle' : 'Yeni Paket'}</DialogTitle>
                        <DialogDescription>Paket bilgilerini düzenleyin ve kaydedin.</DialogDescription>
                    </DialogHeader>
                    {editPkg && (
                        <div className="space-y-4 py-2">
                            <div className="space-y-2">
                                <Label>Paket Adı</Label>
                                <Input value={editPkg.name} onChange={e => setEditPkg({ ...editPkg, name: e.target.value })} placeholder="ör. Topluluk" />
                            </div>
                            <div className="space-y-2">
                                <Label>İkon</Label>
                                <div className="flex flex-wrap gap-2">
                                    {(['starter', 'community', 'active', 'corporate'] as const).map(key => {
                                        const Icon = PKG_ICONS[key];
                                        const sel = editPkg.iconKey === key;
                                        return (
                                            <button key={key} type="button" onClick={() => setEditPkg({ ...editPkg, iconKey: key })}
                                                className={`h-11 w-11 rounded-2xl flex items-center justify-center border transition-colors ${sel ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted/30 hover:bg-muted'}`}>
                                                <Icon className="h-5 w-5" />
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <Label>SMS adet</Label>
                                    <Input type="number" min={0} value={editPkg.smsUnits}
                                        onChange={e => setEditPkg({ ...editPkg, smsUnits: e.target.value })} placeholder="0" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Mail adet</Label>
                                    <Input type="number" min={0} value={editPkg.mailUnits}
                                        onChange={e => setEditPkg({ ...editPkg, mailUnits: e.target.value })} placeholder="0" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Fiyat (₺)</Label>
                                    <Input type="number" min={0} value={editPkg.priceTRY}
                                        onChange={e => setEditPkg({ ...editPkg, priceTRY: e.target.value })} placeholder="0" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Sıra</Label>
                                    <Input type="number" min={0} value={editPkg.order}
                                        onChange={e => setEditPkg({ ...editPkg, order: e.target.value })} placeholder="0" />
                                </div>
                            </div>
                            <div className="flex items-center justify-between rounded-2xl border p-3">
                                <Label className="cursor-pointer">Aktif (STK&apos;lara göster)</Label>
                                <Switch checked={editPkg.active} onCheckedChange={(v) => setEditPkg({ ...editPkg, active: v })} />
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditPkg(null)}>İptal</Button>
                        <Button onClick={handleSavePackage} disabled={pkgBusy}>
                            {pkgBusy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Kaydet
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
