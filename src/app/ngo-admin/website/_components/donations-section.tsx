'use client';
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import Link from 'next/link';
import { Landmark, Smartphone, Save, Loader2 } from 'lucide-react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { COLLECTIONS } from '@/firebase/collections';
import { useActiveEntity, useActiveEntityDoc } from '@/app/ngo-admin/active-entity-context';
import { useToast } from '@/hooks/use-toast';
import type { NgoDoc, NgoSiteDonations } from './types';

const DEFAULTS: Required<Omit<NgoSiteDonations, 'smsShortCode' | 'smsKeyword'>> & Pick<NgoSiteDonations, 'smsShortCode' | 'smsKeyword'> = {
    hangel: true,
    helpSteps: true,
    sms: true,
    smsShortCode: '',
    smsKeyword: '',
    smsTurkcell: true,
    smsVodafone: true,
    smsTurkTelekom: true,
    bankTransfer: true,
};

export function DonationsSection() {
    const db = useFirestore();
    const { id: activeId, kind } = useActiveEntity();
    const ngoId = kind === 'ngo' ? activeId : null;
    const { data: ngoData } = useActiveEntityDoc<NgoDoc>();
    const { toast } = useToast();

    const [donations, setDonations] = useState<NgoSiteDonations>(DEFAULTS);
    const [hydrated, setHydrated] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // NGO verisi gelince state'i bir kere hydrate et (page.tsx ile aynı pattern).
    useEffect(() => {
        if (!ngoData || hydrated) return;
        const d = ngoData.siteSettings?.donations ?? {};
        setDonations({ ...DEFAULTS, ...d });
        setHydrated(true);
    }, [ngoData, hydrated]);

    const set = <K extends keyof NgoSiteDonations>(key: K, value: NgoSiteDonations[K]) =>
        setDonations(prev => ({ ...prev, [key]: value }));

    const handleSave = async () => {
        if (!db || !ngoId) {
            toast({ variant: 'destructive', title: 'Kurum bulunamadı', description: 'Kaydetmek için aktif bir STK gerekli.' });
            return;
        }
        setIsSaving(true);
        try {
            await updateDoc(doc(db, COLLECTIONS.ngos, ngoId), {
                'siteSettings.donations': {
                    hangel: !!donations.hangel,
                    helpSteps: !!donations.helpSteps,
                    sms: !!donations.sms,
                    smsShortCode: donations.smsShortCode?.trim() || '',
                    smsKeyword: donations.smsKeyword?.trim() || '',
                    smsTurkcell: !!donations.smsTurkcell,
                    smsVodafone: !!donations.smsVodafone,
                    smsTurkTelekom: !!donations.smsTurkTelekom,
                    bankTransfer: !!donations.bankTransfer,
                },
                'siteSettings.updatedAt': serverTimestamp(),
            });
            toast({ title: 'Bağış ayarları kaydedildi', description: 'Tercihleriniz güncellendi.' });
        } catch (err) {
            const e = err as { message?: string };
            toast({ variant: 'destructive', title: 'Kaydedilemedi', description: e?.message?.slice(0, 160) || 'Lütfen tekrar deneyin.' });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <>
            <div className="space-y-4">
                <div className="p-4 border rounded-2xl bg-muted/10">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-bold">hangel ile Bağış</span>
                        <Switch checked={!!donations.hangel} onCheckedChange={v => set('hangel', v)} className="data-[state=checked]:bg-green-600" />
                    </div>
                </div>
                <div className="p-4 border rounded-2xl bg-muted/10">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-bold">HelpSteps ile Bağış</span>
                        <Switch checked={!!donations.helpSteps} onCheckedChange={v => set('helpSteps', v)} className="data-[state=checked]:bg-green-600" />
                    </div>
                </div>
                <div className="p-4 border rounded-2xl bg-muted/10 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Smartphone className="h-4 w-4 text-primary" />
                            <span className="text-sm font-bold">SMS ile Bağış</span>
                        </div>
                        <Switch checked={!!donations.sms} onCheckedChange={v => set('sms', v)} className="data-[state=checked]:bg-green-600" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-xs">Kısa Kod</Label>
                            <Input placeholder="3406" value={donations.smsShortCode ?? ''} onChange={e => set('smsShortCode', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs">Anahtar Kelime</Label>
                            <Input placeholder="AHBAP" value={donations.smsKeyword ?? ''} onChange={e => set('smsKeyword', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs">Operatör Seçimi</Label>
                            <div className="flex flex-wrap gap-4 pt-1">
                                <div className="flex items-center space-x-2"><Checkbox id="op-tr" checked={!!donations.smsTurkcell} onCheckedChange={v => set('smsTurkcell', v === true)} /><Label htmlFor="op-tr" className="text-xs">Turkcell</Label></div>
                                <div className="flex items-center space-x-2"><Checkbox id="op-vd" checked={!!donations.smsVodafone} onCheckedChange={v => set('smsVodafone', v === true)} /><Label htmlFor="op-vd" className="text-xs">Vodafone</Label></div>
                                <div className="flex items-center space-x-2"><Checkbox id="op-tt" checked={!!donations.smsTurkTelekom} onCheckedChange={v => set('smsTurkTelekom', v === true)} /><Label htmlFor="op-tt" className="text-xs">T.Telekom</Label></div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="p-4 border rounded-2xl bg-muted/10">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-bold">Banka EFT/Havale</span>
                        <Switch checked={!!donations.bankTransfer} onCheckedChange={v => set('bankTransfer', v)} className="data-[state=checked]:bg-green-600" />
                    </div>
                </div>
            </div>
            <Button className="w-full" onClick={handleSave} disabled={isSaving}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Bağış Ayarlarını Kaydet
            </Button>
            <Button asChild variant="outline" className="w-full">
                <Link href="/ngo-admin/manage-profile">
                    <Landmark className="mr-2 h-4 w-4" /> Banka Bilgilerini Düzenle
                </Link>
            </Button>
        </>
    );
}
