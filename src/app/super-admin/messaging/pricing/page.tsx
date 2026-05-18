'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Save, Loader2, Coins } from 'lucide-react';
import { messagingFetch } from '@/lib/messaging/client';

interface Tier {
  upToVolume: number | null;
  perUnit: number;
}

interface PricingConfig {
  tiers: { sms: Tier[]; email: Tier[]; whatsapp: Tier[] };
  freeQuota: { sms: number; email: number; whatsapp: number };
  whatsappCategoryMultiplier: { marketing: number; utility: number; authentication: number; service: number };
  kdvRate: number;
  currency: 'TRY';
}

const DEFAULT: PricingConfig = {
  tiers: {
    sms: [
      { upToVolume: 1000, perUnit: 0.40 },
      { upToVolume: 10000, perUnit: 0.35 },
      { upToVolume: null, perUnit: 0.30 },
    ],
    email: [
      { upToVolume: 5000, perUnit: 0.02 },
      { upToVolume: 50000, perUnit: 0.015 },
      { upToVolume: null, perUnit: 0.012 },
    ],
    whatsapp: [
      { upToVolume: 1000, perUnit: 0.80 },
      { upToVolume: 10000, perUnit: 0.70 },
      { upToVolume: null, perUnit: 0.60 },
    ],
  },
  freeQuota: { sms: 100, email: 500, whatsapp: 50 },
  whatsappCategoryMultiplier: { marketing: 5, utility: 2, authentication: 2, service: 0 },
  kdvRate: 0.20,
  currency: 'TRY',
};

export default function PricingPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cfg, setCfg] = useState<PricingConfig>(DEFAULT);

  useEffect(() => {
    (async () => {
      try {
        const data = await messagingFetch<PricingConfig | null>('/api/admin/messaging/pricing');
        if (data) setCfg({ ...DEFAULT, ...data });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        toast({ variant: 'destructive', title: 'Hata', description: message });
      } finally {
        setLoading(false);
      }
    })();
  }, [toast]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await messagingFetch('/api/admin/messaging/pricing', {
        method: 'PUT',
        body: JSON.stringify(cfg),
      });
      toast({ title: 'Kaydedildi' });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      toast({ variant: 'destructive', title: 'Hata', description: message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const updateTier = (channel: keyof PricingConfig['tiers'], idx: number, field: keyof Tier, value: string) => {
    const tiers = [...cfg.tiers[channel]];
    const num = value === '' ? null : Number(value);
    tiers[idx] = { ...tiers[idx], [field]: num };
    setCfg({ ...cfg, tiers: { ...cfg.tiers, [channel]: tiers } });
  };

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-4xl space-y-6">
      <Link href="/super-admin/messaging" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4 mr-1" /> Toplu SMS & E-Posta
      </Link>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-headline">Pricing</h1>
          <p className="text-muted-foreground text-sm mt-1">Tier indirimleri, ücretsiz kotalar, KDV ve WhatsApp çarpanları.</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Kaydet
        </Button>
      </div>

      {(['sms', 'email', 'whatsapp'] as const).map((ch) => (
        <Card key={ch}>
          <CardHeader className="flex flex-row items-center gap-2">
            <Coins className="h-5 w-5 text-amber-500" />
            <CardTitle className="text-base uppercase">{ch}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {cfg.tiers[ch].map((t, i) => (
              <div key={i} className="grid grid-cols-2 gap-3 items-end">
                <div>
                  <Label className="text-xs">Üst sınır (birim)</Label>
                  <Input
                    type="number"
                    value={t.upToVolume ?? ''}
                    placeholder="sınırsız"
                    onChange={(e) => updateTier(ch, i, 'upToVolume', e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-xs">Birim fiyat (TRY)</Label>
                  <Input
                    type="number"
                    step="0.001"
                    value={t.perUnit}
                    onChange={(e) => updateTier(ch, i, 'perUnit', e.target.value)}
                  />
                </div>
              </div>
            ))}
            <div>
              <Label className="text-xs">Aylık ücretsiz kota (birim)</Label>
              <Input
                type="number"
                value={cfg.freeQuota[ch]}
                onChange={(e) =>
                  setCfg({ ...cfg, freeQuota: { ...cfg.freeQuota, [ch]: Number(e.target.value) } })
                }
              />
            </div>
          </CardContent>
        </Card>
      ))}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">WhatsApp Conversation Çarpanları</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {(['marketing', 'utility', 'authentication', 'service'] as const).map((c) => (
            <div key={c}>
              <Label className="text-xs">{c}</Label>
              <Input
                type="number"
                step="0.5"
                value={cfg.whatsappCategoryMultiplier[c]}
                onChange={(e) =>
                  setCfg({
                    ...cfg,
                    whatsappCategoryMultiplier: {
                      ...cfg.whatsappCategoryMultiplier,
                      [c]: Number(e.target.value),
                    },
                  })
                }
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">KDV Oranı</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            type="number"
            step="0.01"
            value={cfg.kdvRate}
            onChange={(e) => setCfg({ ...cfg, kdvRate: Number(e.target.value) })}
          />
        </CardContent>
      </Card>
    </div>
  );
}
