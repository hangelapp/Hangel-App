'use client';

import React, { useMemo, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft,
    Send,
    Users,
    Mail,
    Building2,
    Wallet,
    Loader2,
    Upload,
    FileCheck,
    CheckCircle2,
    type LucideIcon,
} from 'lucide-react';
import { collection, doc, query, where } from 'firebase/firestore';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useFirestore, useUser, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { COLLECTIONS } from '@/firebase/collections';
import { useActiveEntity } from '@/app/ngo-admin/active-entity-context';
import {
    normalizeQuota,
    quotaRemaining,
    normalizePackage,
    type NgoQuota,
    type UnitPackage,
} from '@/lib/messaging-quota';

const ICON_MAP: Record<UnitPackage['iconKey'], LucideIcon> = {
    starter: Send,
    community: Users,
    active: Mail,
    corporate: Building2,
};

type RequiredDoc = {
    key: 'senderId' | 'kvkk' | 'commercial';
    title: string;
    description: string;
};

const REQUIRED_DOCS: RequiredDoc[] = [
    { key: 'senderId', title: 'Gönderici Adı (Sender ID) İzni', description: 'Operatör onaylı gönderici başlığı izin belgesi.' },
    { key: 'kvkk', title: 'KVKK Açık Rıza / Aydınlatma Metni', description: 'Kişisel verilerin işlenmesine dair onay metni.' },
    { key: 'commercial', title: 'Ticari İleti İzin Kaydı', description: 'İYS (İleti Yönetim Sistemi) izin kaydı belgesi.' },
];

export default function MessagingPackagesPage() {
    const { toast } = useToast();
    const router = useRouter();
    const db = useFirestore();
    const { user: authUser } = useUser();
    const { id: ngoId, kind } = useActiveEntity();

    const [purchasingId, setPurchasingId] = useState<string | null>(null);
    const [uploadingKey, setUploadingKey] = useState<RequiredDoc['key'] | null>(null);
    const [uploadedKeys, setUploadedKeys] = useState<Record<string, boolean>>({});
    const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});

    const walletRef = useMemoFirebase(
        () => (db && ngoId ? doc(db, COLLECTIONS.ngoMessagingWallets, ngoId) : null),
        [db, ngoId],
    );
    const { data: walletRaw } = useDoc<NgoQuota>(walletRef);
    const remaining = useMemo(() => quotaRemaining(normalizeQuota(walletRaw)), [walletRaw]);

    const packagesQuery = useMemoFirebase(
        () => (db ? query(collection(db, COLLECTIONS.messagingPackages), where('kind', '==', 'unit')) : null),
        [db],
    );
    const { data: packageDocs } = useCollection<Record<string, unknown>>(packagesQuery);

    const packages = useMemo<UnitPackage[]>(() => {
        const list = (packageDocs || []).map((d) => normalizePackage((d as { id: string }).id, d));
        return list.filter((p) => p.active).sort((a, b) => a.order - b.order);
    }, [packageDocs]);

    const handlePurchase = async (pkg: UnitPackage) => {
        if (!ngoId) {
            toast({ variant: 'destructive', title: 'Aktif kurum bulunamadı' });
            return;
        }
        setPurchasingId(pkg.id);
        try {
            const token = await authUser?.getIdToken();
            const res = await fetch('/api/ngo-admin/messaging/quota/purchase', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ ngoId, packageId: pkg.id }),
            });
            const data = await res.json();
            if (!res.ok) {
                toast({
                    variant: 'destructive',
                    title: 'Sipariş oluşturulamadı',
                    description: typeof data?.message === 'string' ? data.message : undefined,
                });
                return;
            }
            toast({
                title: 'Siparişiniz alındı',
                description: typeof data?.message === 'string'
                    ? data.message
                    : 'Ödeme onayında kontörler yüklenecek.',
            });
        } catch {
            toast({ variant: 'destructive', title: 'Sipariş oluşturulamadı', description: 'Bağlantı hatası.' });
        } finally {
            setPurchasingId(null);
        }
    };

    const handleFileUpload = async (file: File, docInfo: RequiredDoc) => {
        if (!ngoId || !kind) {
            toast({ variant: 'destructive', title: 'Aktif kurum bulunamadı' });
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            toast({ variant: 'destructive', title: 'Dosya çok büyük', description: 'En fazla 10 MB.' });
            return;
        }
        setUploadingKey(docInfo.key);
        try {
            const storage = getStorage();
            const folder = kind === 'ngo' ? 'ngos' : kind === 'brand' ? 'brands' : 'clubs';
            const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
            const path = `${folder}/${ngoId}/messaging-${docInfo.key}-${Date.now()}-${safe}`;
            const r = storageRef(storage, path);
            await uploadBytes(r, file);
            const url = await getDownloadURL(r);

            const token = await authUser?.getIdToken();
            if (token) {
                await fetch('/api/ngo/archive', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify({
                        docType: docInfo.title,
                        fileUrl: url,
                        entityType: kind,
                        entityId: ngoId,
                        entityName: '',
                    }),
                });
            }
            setUploadedKeys((prev) => ({ ...prev, [docInfo.key]: true }));
            toast({ title: 'Belge yüklendi', description: docInfo.title });
        } catch {
            toast({ variant: 'destructive', title: 'Yükleme başarısız', description: 'Lütfen tekrar deneyin.' });
        } finally {
            setUploadingKey(null);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in-0 max-w-5xl mx-auto p-4 sm:p-6">
            <div className="flex items-center gap-2">
                <Button onClick={() => router.back()} variant="ghost" size="icon" className="-ml-2" aria-label="Geri">
                    <ArrowLeft className="h-6 w-6" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold font-headline">Kontör Paketleri</h1>
                    <p className="text-muted-foreground text-sm">SMS ve mail kontörü satın alın.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card className="border-primary/30 bg-primary/5">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="h-10 w-10 shrink-0 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Wallet className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Kalan SMS</p>
                            <p className="text-xl font-black">{remaining.sms}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-primary/30 bg-primary/5">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="h-10 w-10 shrink-0 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Mail className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Kalan Mail</p>
                            <p className="text-xl font-black">{remaining.mail}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {packages.map((pkg) => {
                    const Icon = ICON_MAP[pkg.iconKey];
                    return (
                        <Card key={pkg.id} className="flex flex-col">
                            <CardContent className="p-4 flex flex-col items-center text-center space-y-3 flex-1">
                                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-primary/10 text-primary">
                                    <Icon className="h-6 w-6" />
                                </div>
                                <p className="font-bold">{pkg.name}</p>
                                <div className="text-xs text-muted-foreground space-y-1">
                                    <p>{pkg.smsUnits} SMS</p>
                                    <p>{pkg.mailUnits} Mail</p>
                                </div>
                                <p className="text-2xl font-black mt-auto">{pkg.priceTRY} ₺</p>
                            </CardContent>
                            <div className="p-4 pt-0">
                                <Button
                                    className="w-full"
                                    onClick={() => handlePurchase(pkg)}
                                    disabled={purchasingId !== null}
                                >
                                    {purchasingId === pkg.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                    Satın Al
                                </Button>
                            </div>
                        </Card>
                    );
                })}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><FileCheck className="h-5 w-5 text-primary" /> Gerekli Evraklar</CardTitle>
                    <CardDescription>
                        Toplu gönderim için aşağıdaki belgeleri yükleyin. Belgeler onay için kurum arşivinize kaydedilir.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    {REQUIRED_DOCS.map((d) => {
                        const uploaded = uploadedKeys[d.key];
                        return (
                            <div key={d.key} className="flex items-center gap-3 p-3 rounded-xl border">
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold flex items-center gap-2">
                                        {d.title}
                                        {uploaded && <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />}
                                    </p>
                                    <p className="text-xs text-muted-foreground">{d.description}</p>
                                </div>
                                <input
                                    ref={(el) => { fileInputs.current[d.key] = el; }}
                                    type="file"
                                    className="hidden"
                                    accept=".pdf,.png,.jpg,.jpeg"
                                    onChange={(e) => {
                                        const f = e.target.files?.[0];
                                        if (f) handleFileUpload(f, d);
                                        e.target.value = '';
                                    }}
                                />
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="shrink-0"
                                    onClick={() => fileInputs.current[d.key]?.click()}
                                    disabled={uploadingKey !== null}
                                >
                                    {uploadingKey === d.key
                                        ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        : <Upload className="mr-2 h-4 w-4" />}
                                    {uploaded ? 'Değiştir' : 'Yükle'}
                                </Button>
                            </div>
                        );
                    })}
                </CardContent>
            </Card>
        </div>
    );
}
