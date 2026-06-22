'use client';
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Save, Loader2 } from 'lucide-react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { COLLECTIONS } from '@/firebase/collections';
import { useActiveEntity, useActiveEntityDoc } from '@/app/ngo-admin/active-entity-context';
import { useToast } from '@/hooks/use-toast';
import type { NgoDoc, NgoSiteAnalytics } from './types';

interface AnalyticsSectionProps {
    onConnectClick: (providerName: string) => void;
    onSave: () => void;
}

// Sahte "Bağlandı" durumu yerine, gerçekten kaydedilen kimlik alanları.
// Alan dolu = entegrasyon aktif; boş = pasif. Tek doğruluk kaynağı veridir.
const ID_FIELDS: { key: keyof NgoSiteAnalytics; label: string; placeholder: string; help: string }[] = [
    { key: 'gaMeasurementId', label: 'Google Analytics', placeholder: 'G-XXXXXXXXXX', help: 'GA4 → Yönetici → Veri Akışları → Ölçüm Kimliği' },
    { key: 'metaPixelId', label: 'Meta Pixel', placeholder: '1234567890', help: 'Meta Events Manager → Veri Kaynakları → Piksel Kimliği' },
    { key: 'hotjarSiteId', label: 'Hotjar', placeholder: '3123456', help: 'Hotjar → Settings → Sites & Organizations → Site ID' },
    { key: 'yandexMetricaId', label: 'Yandex Metrica', placeholder: '12345678', help: 'Yandex Metrica → Ayarlar → Etiket → Sayaç Numarası' },
];

export function AnalyticsSection({ onSave: _onSave }: AnalyticsSectionProps) {
    const db = useFirestore();
    const { id: activeId, kind } = useActiveEntity();
    const ngoId = kind === 'ngo' ? activeId : null;
    const { data: ngoData } = useActiveEntityDoc<NgoDoc>();
    const { toast } = useToast();

    const [analytics, setAnalytics] = useState<NgoSiteAnalytics>({});
    const [hydrated, setHydrated] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (!ngoData || hydrated) return;
        setAnalytics(ngoData.siteSettings?.analytics ?? {});
        setHydrated(true);
    }, [ngoData, hydrated]);

    const set = (key: keyof NgoSiteAnalytics, value: string) =>
        setAnalytics(prev => ({ ...prev, [key]: value }));

    const handleSave = async () => {
        if (!db || !ngoId) {
            toast({ variant: 'destructive', title: 'Kurum bulunamadı', description: 'Kaydetmek için aktif bir STK gerekli.' });
            return;
        }
        setIsSaving(true);
        try {
            await updateDoc(doc(db, COLLECTIONS.ngos, ngoId), {
                'siteSettings.analytics': {
                    gaMeasurementId: analytics.gaMeasurementId?.trim() || '',
                    metaPixelId: analytics.metaPixelId?.trim() || '',
                    hotjarSiteId: analytics.hotjarSiteId?.trim() || '',
                    yandexMetricaId: analytics.yandexMetricaId?.trim() || '',
                    customScript: analytics.customScript?.trim() || '',
                },
                'siteSettings.updatedAt': serverTimestamp(),
            });
            toast({ title: 'Kodlar kaydedildi', description: 'Analiz ayarlarınız güncellendi.' });
        } catch (err) {
            const e = err as { message?: string };
            toast({ variant: 'destructive', title: 'Kaydedilemedi', description: e?.message?.slice(0, 160) || 'Lütfen tekrar deneyin.' });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {ID_FIELDS.map((f) => {
                    const value = (analytics[f.key] as string | undefined) ?? '';
                    const active = value.trim().length > 0;
                    return (
                        <div key={f.key} className="p-3 border rounded-xl flex flex-col gap-1.5 bg-muted/10">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold">{f.label}</span>
                                <span className={`text-[9px] font-black uppercase tracking-wider ${active ? 'text-green-600' : 'text-muted-foreground'}`}>
                                    {active ? 'Aktif' : 'Pasif'}
                                </span>
                            </div>
                            <Input
                                className="h-8 text-xs"
                                placeholder={f.placeholder}
                                value={value}
                                onChange={(e) => set(f.key, e.target.value)}
                            />
                            <p className="text-[10px] text-muted-foreground leading-snug">{f.help}</p>
                        </div>
                    );
                })}
            </div>
            <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-muted-foreground">Özel Script (Head/Body)</Label>
                <Textarea
                    className="font-mono text-[10px]"
                    rows={5}
                    placeholder="<!-- Google Tag Manager, FB Pixel vb. -->"
                    value={analytics.customScript ?? ''}
                    onChange={(e) => set('customScript', e.target.value)}
                />
            </div>
            <Button className="w-full" onClick={handleSave} disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Kodları Kaydet
            </Button>
        </>
    );
}
