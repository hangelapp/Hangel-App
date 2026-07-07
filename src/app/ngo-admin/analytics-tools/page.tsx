'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Code, ShieldCheck, KeyRound, Loader2, MousePointer2, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { doc, updateDoc } from 'firebase/firestore';
import { useFirestore, useUser } from '@/firebase';
import { COLLECTIONS } from '@/firebase/collections';
import { useActiveEntity, useActiveEntityDoc } from '@/app/ngo-admin/active-entity-context';
import { useAutosave } from '@/hooks/use-autosave';
import { AutosaveIndicator } from '@/components/shared/autosave-indicator';

type NgoAnalyticsDoc = {
    id: string;
    name?: string;
    analytics?: {
        gaId?: string;
        gtmId?: string;
        metaPixelId?: string;
    };
};

const trackingTools = [
    { id: 'ga4', name: 'Google Analytics 4', logo: 'GA', color: 'bg-[#F9AB00]', type: 'Analytics' },
    { id: 'meta-pixel', name: 'Meta Pixel', logo: 'MP', color: 'bg-[#0668E1]', type: 'Ads' },
    { id: 'hotjar', name: 'Hotjar', logo: 'HJ', color: 'bg-[#FD3C00]', type: 'UX' },
    { id: 'gtm', name: 'Tag Manager', logo: 'TM', color: 'bg-[#246FDB]', type: 'Integration' },
];

export default function AnalyticsToolsPage() {
    const { toast } = useToast();
    const router = useRouter();
    const db = useFirestore();
    useUser();

    // Aktif kurum (ActiveEntityProvider) — yalnız NGO için anlamlı.
    const { id: activeIdFromCtx, kind: activeKind } = useActiveEntity();
    const { data: activeDoc } = useActiveEntityDoc<NgoAnalyticsDoc>();
    const ngoData = useMemo(() => (activeKind === 'ngo' && activeDoc ? activeDoc : null), [activeKind, activeDoc]);
    const ngoId: string | null = activeKind === 'ngo' ? activeIdFromCtx : null;

    const [gaId, setGaId] = useState('');
    const [metaPixelId, setMetaPixelId] = useState('');
    const [gtmId, setGtmId] = useState('');
    const [hydrated, setHydrated] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // NGO doc gelince ilk değerleri formdan tek seferlik hydrate et
    useEffect(() => {
        if (!ngoData || hydrated) return;
        const a = ngoData.analytics || {};
        setGaId(a.gaId || '');
        setMetaPixelId(a.metaPixelId || '');
        setGtmId(a.gtmId || '');
        setHydrated(true);
    }, [ngoData, hydrated]);

    const isAdmin = !!ngoId;
    const gaConnected = !!gaId.trim();
    const pixelConnected = !!metaPixelId.trim();
    const gtmConnected = !!gtmId.trim();
    const statusFor = (toolId: string) => {
        if (toolId === 'ga4') return gaConnected ? 'Bağlı' : 'Bağlanabilir';
        if (toolId === 'meta-pixel') return pixelConnected ? 'Bağlı' : 'Bağlanabilir';
        if (toolId === 'gtm') return gtmConnected ? 'Bağlı' : 'Bağlanabilir';
        return 'Bağlanabilir';
    };

    const persistAnalytics = async () => {
        if (!db || !ngoId) return;
        await updateDoc(doc(db, COLLECTIONS.ngos, ngoId), {
            analytics: {
                gaId: gaId.trim(),
                gtmId: gtmId.trim(),
                metaPixelId: metaPixelId.trim(),
            },
        });
    };

    const { status: autosaveStatus, markDirty } = useAutosave(persistAnalytics, [gaId, metaPixelId, gtmId], { delayMs: 1000 });

    const handleSave = async () => {
        if (!db || !ngoId) {
            toast({
                variant: 'destructive',
                title: 'Yönetici varlık bulunamadı',
                description: 'Takip kodlarını kaydetmek için yönettiğiniz bir STK olmalı.',
            });
            return;
        }
        setIsSaving(true);
        try {
            await persistAnalytics();
            toast({ title: 'Takip Kodları Kaydedildi', description: 'Değişiklikler NGO profil sayfanızda aktif hale getirildi.' });
        } catch (err) {
            const e = err as { message?: string };
            toast({ variant: 'destructive', title: 'Kaydedilemedi', description: e?.message || 'Beklenmeyen bir hata oluştu.' });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in-0 max-w-5xl mx-auto p-4 sm:p-6">
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <Button onClick={() => router.back()} variant="ghost" size="icon" className="-ml-2" aria-label="Geri">
                        <ArrowLeft className="h-6 w-6" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold font-headline">Web Analiz Araçları</h1>
                        <p className="text-muted-foreground text-sm">
                            {ngoData?.name ? (
                                <><span className="font-semibold text-foreground">{ngoData.name}</span> için takip kodlarını yönetin.</>
                            ) : (
                                'Ziyaretçi trafiğinizi ve bağışçı dönüşümlerini profesyonelce ölçümleyin.'
                            )}
                        </p>
                    </div>
                </div>
                <AutosaveIndicator status={autosaveStatus} />
            </div>

            {!isAdmin && (
                <div className="p-4 border rounded-xl bg-amber-50 text-amber-900 text-sm flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                        <p className="font-bold">Bu sayfa yalnızca STK yöneticileri içindir</p>
                        <p>Hesabınız henüz bir STK ile eşleşmedi. Yönetici davetiniz tamamlanınca takip kodlarını buradan girebilirsiniz.</p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {trackingTools.map((tool) => {
                    const status = statusFor(tool.id);
                    return (
                        <Card key={tool.id} className="hover:border-primary transition-all group">
                            <CardContent className="p-4 flex flex-col items-center text-center space-y-3">
                                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg", tool.color)}>
                                    {tool.logo}
                                </div>
                                <div>
                                    <p className="font-bold text-sm">{tool.name}</p>
                                    <Badge variant={status === 'Bağlı' ? 'default' : 'secondary'} className="text-[10px] mt-1">
                                        {status}
                                    </Badge>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            <Tabs defaultValue="standard">
                <TabsList className="grid w-full grid-cols-2 max-w-md">
                    <TabsTrigger value="standard"><Code className="mr-2 h-4 w-4" /> Standart Etiketler</TabsTrigger>
                    <TabsTrigger value="events"><MousePointer2 className="mr-2 h-4 w-4" /> Olay İzleme (Events)</TabsTrigger>
                </TabsList>

                <TabsContent value="standard" className="mt-6 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2"><KeyRound className="h-5 w-5 text-primary"/> Kimlikler (Tracking IDs)</CardTitle>
                            <CardDescription>Kullandığınız araçların mülk veya hesap kimliklerini buraya girin. NGO profil sayfanızda otomatik enjekte edilir.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="ga4-id">GA4 Measurement ID</Label>
                                    <Input
                                        id="ga4-id"
                                        placeholder="G-XXXXXXXXXX"
                                        value={gaId}
                                        onChange={(e) => { markDirty(); setGaId(e.target.value); }}
                                        disabled={!isAdmin}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="meta-pixel-id">Meta Pixel ID</Label>
                                    <Input
                                        id="meta-pixel-id"
                                        placeholder="123456789012345"
                                        value={metaPixelId}
                                        onChange={(e) => { markDirty(); setMetaPixelId(e.target.value); }}
                                        disabled={!isAdmin}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="gtm-id">GTM Container ID</Label>
                                <Input
                                    id="gtm-id"
                                    placeholder="GTM-XXXXXXX"
                                    value={gtmId}
                                    onChange={(e) => { markDirty(); setGtmId(e.target.value); }}
                                    disabled={!isAdmin}
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="bg-muted/30 border-t p-4 flex justify-end">
                            <Button onClick={handleSave} disabled={isSaving || !isAdmin}>
                                {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Kaydediliyor</> : 'Değişiklikleri Kaydet'}
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>

                <TabsContent value="events" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Dönüşüm Olayları (Conversion Tracking)</CardTitle>
                            <CardDescription>Bağış ve gönüllülük adımları için otomatik olay izleme durumları.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {[
                                { name: 'donations_completed', label: 'Bağış Tamamlandı', status: 'İzleniyor' },
                                { name: 'volunteer_apply_click', label: 'Gönüllü Başvuru Tıklandı', status: 'İzleniyor' },
                                { name: 'ngo_profile_share', label: 'Profil Paylaşıldı', status: 'İzleniyor' }
                            ].map((event, i) => (
                                <div key={i} className="p-4 border rounded-xl flex items-center justify-between bg-muted/10">
                                    <div>
                                        <p className="font-bold text-sm">{event.label}</p>
                                        <code className="text-[10px] text-muted-foreground">{event.name}</code>
                                    </div>
                                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">{event.status}</Badge>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <div className="p-4 border rounded-xl bg-blue-50 text-blue-800 text-xs flex items-start gap-3">
                <ShieldCheck className="h-5 w-5 shrink-0 mt-0.5" />
                <div className="space-y-1">
                    <p className="font-bold">Veri Gizliliği ve Çerez Politikası</p>
                    <p>Takip kodları eklendiğinde, web sitenizdeki çerez onay bannerı otomatik olarak &quot;Analitik Çerezler&quot; kategorisini aktif hale getirir. Tüm veri toplama işlemleri KVKK ve GDPR uyumlu olarak gerçekleştirilmektedir.</p>
                </div>
            </div>
        </div>
    );
}
