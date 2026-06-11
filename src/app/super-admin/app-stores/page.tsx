'use client';

/**
 * /super-admin/app-stores
 *
 * Süper-admin için 8 mağaza platformu üzerinde AI destekli ekran görüntüsü
 * üretim paneli. Imagen 3 ile prompt'tan görsel üretir, Storage'a yükler,
 * Firestore meta tutar. Mevcut görseller: indir, sil, aktif/pasif toggle.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Sparkles, Download, Trash2, Loader2, AlertCircle, ImageIcon, RefreshCw,
} from 'lucide-react';
import { useUser } from '@/firebase';
import { cn } from '@/lib/utils';
import { PLATFORMS, FEATURES, type PlatformKey, type FeatureKey, type DeviceSpec } from '@/lib/app-store-specs';

interface AssetRow {
  id: string;
  storageUrl: string;
  prompt: string;
  feature: string;
  platform: string;
  deviceLabel: string;
  deviceW: number;
  deviceH: number;
  aspectRatio: string;
  active: boolean;
  createdAt: number | null;
  base64Preview?: string;  // generate response için anında preview
}

export default function AppStoresPage() {
  const { user } = useUser();
  const [activePlatform, setActivePlatform] = useState<PlatformKey>('app-store');
  const [assets, setAssets] = useState<Record<string, AssetRow[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate modal state
  const [genFeature, setGenFeature] = useState<FeatureKey>('genel');
  const [genDevice, setGenDevice] = useState<DeviceSpec | null>(null);
  const [genPrompt, setGenPrompt] = useState('');
  const [generating, setGenerating] = useState(false);

  const activeMeta = useMemo(() => PLATFORMS.find((p) => p.key === activePlatform)!, [activePlatform]);

  const fetchAssets = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/super-admin/app-store-assets/list?platform=${activePlatform}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error((await res.json())?.message || 'Liste hatası');
      const data: { platforms: Record<string, AssetRow[]> } = await res.json();
      setAssets((prev) => ({ ...prev, ...data.platforms }));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Hata');
    } finally {
      setLoading(false);
    }
  }, [user, activePlatform]);

  useEffect(() => { void fetchAssets(); }, [fetchAssets]);

  // Feature template prompt'unu yükle
  useEffect(() => {
    const f = FEATURES.find((x) => x.key === genFeature);
    if (f && !genPrompt) setGenPrompt(f.defaultPrompt);
  }, [genFeature, genPrompt]);

  // Platform değişince ilk required device'ı default seç
  useEffect(() => {
    const firstRequired = activeMeta.devices.find((d) => d.required) || activeMeta.devices[0];
    setGenDevice(firstRequired);
  }, [activeMeta]);

  async function handleGenerate() {
    if (!user || !genDevice) return;
    setGenerating(true);
    setError(null);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/super-admin/app-store-assets/generate', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: activePlatform,
          feature: genFeature,
          customPrompt: genPrompt,
          deviceLabel: genDevice.device,
          deviceW: genDevice.w,
          deviceH: genDevice.h,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.message || `Üretim hatası (${res.status})`);
      }
      const data: { id: string; storageUrl: string; aspectRatio: string; base64Preview: string } = await res.json();
      // Yeni asset'i listenin başına ekle (preview ile)
      setAssets((prev) => ({
        ...prev,
        [activePlatform]: [
          {
            id: data.id,
            storageUrl: data.storageUrl,
            prompt: genPrompt,
            feature: genFeature,
            platform: activePlatform,
            deviceLabel: genDevice.device,
            deviceW: genDevice.w,
            deviceH: genDevice.h,
            aspectRatio: data.aspectRatio,
            active: true,
            createdAt: Date.now(),
            base64Preview: data.base64Preview,
          },
          ...(prev[activePlatform] || []),
        ],
      }));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Üretim başarısız');
    } finally {
      setGenerating(false);
    }
  }

  async function handleDelete(id: string) {
    if (!user) return;
    if (!confirm('Bu görseli silmek istediğinizden emin misiniz?')) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/super-admin/app-store-assets/${id}?platform=${activePlatform}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error((await res.json())?.message || 'Silme hatası');
      setAssets((prev) => ({ ...prev, [activePlatform]: (prev[activePlatform] || []).filter((a) => a.id !== id) }));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Silme hatası');
    }
  }

  async function handleToggleActive(id: string, active: boolean) {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/super-admin/app-store-assets/${id}?platform=${activePlatform}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ active }),
      });
      if (!res.ok) throw new Error((await res.json())?.message || 'Güncelleme hatası');
      setAssets((prev) => ({
        ...prev,
        [activePlatform]: (prev[activePlatform] || []).map((a) => (a.id === id ? { ...a, active } : a)),
      }));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Güncelleme hatası');
    }
  }

  const currentAssets = assets[activePlatform] || [];

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold font-headline">App Storlar — Görsel Üreteç</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          AI ile her mağaza için ekran görüntüsü üret. Mağaza tasarım değiştirilirken
          veya yeni özellik eklendiğinde buradan prompt girip yeni görsel üretebilirsin.
        </p>
      </div>

      {error && (
        <Card className="border-rose-300 bg-rose-50">
          <CardContent className="p-3 text-sm text-rose-700 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" /> {error}
          </CardContent>
        </Card>
      )}

      <Tabs value={activePlatform} onValueChange={(v) => setActivePlatform(v as PlatformKey)}>
        <TabsList className="flex flex-wrap h-auto justify-start gap-1">
          {PLATFORMS.map((p) => (
            <TabsTrigger key={p.key} value={p.key} className="text-xs">
              {p.label}
              <Badge variant="secondary" className="ml-2 text-[9px]">
                {(assets[p.key] || []).length}
              </Badge>
            </TabsTrigger>
          ))}
        </TabsList>

        {PLATFORMS.map((p) => (
          <TabsContent key={p.key} value={p.key} className="space-y-4 mt-4">
            {p.key === activePlatform && (
              <>
                {/* Generator */}
                <Card>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Sparkles className="h-4 w-4 text-primary" />
                      <h2 className="text-sm font-bold">Yeni Görsel Üret — {p.label}</h2>
                    </div>
                    <p className="text-[11px] text-muted-foreground italic">{p.vibe}</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Özellik</label>
                        <select
                          value={genFeature}
                          onChange={(e) => {
                            const k = e.target.value as FeatureKey;
                            setGenFeature(k);
                            const f = FEATURES.find((x) => x.key === k);
                            if (f) setGenPrompt(f.defaultPrompt);
                          }}
                          className="w-full h-9 rounded-md border bg-background px-3 text-sm"
                        >
                          {FEATURES.map((f) => (
                            <option key={f.key} value={f.key}>{f.label}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Cihaz / Boyut</label>
                        <select
                          value={genDevice?.device || ''}
                          onChange={(e) => {
                            const d = p.devices.find((dx) => dx.device === e.target.value);
                            if (d) setGenDevice(d);
                          }}
                          className="w-full h-9 rounded-md border bg-background px-3 text-sm"
                        >
                          {p.devices.map((d) => (
                            <option key={d.device} value={d.device}>
                              {d.device} — {d.w}×{d.h}px {d.required ? '(zorunlu)' : ''}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                        Prompt (Türkçe yaz, AI Imagen 3'e gider)
                      </label>
                      <Textarea
                        value={genPrompt}
                        onChange={(e) => setGenPrompt(e.target.value)}
                        rows={5}
                        className="text-sm font-mono"
                        placeholder="hangel uygulamasında bağış akışını gösteren phone mockup..."
                      />
                      <p className="text-[10px] text-muted-foreground">
                        💡 Brand brief (renkler, ton, kurallar) + platform tonu prompt'a otomatik eklenir.
                        Sen sadece "ne göstereceğini" yaz.
                      </p>
                    </div>

                    <Button
                      onClick={handleGenerate}
                      disabled={generating || !genDevice || !genPrompt.trim()}
                      size="sm"
                      className="bg-primary"
                    >
                      {generating
                        ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Üretiliyor (10-30 sn)…</>
                        : <><Sparkles className="h-4 w-4 mr-1" /> Görseli Üret</>}
                    </Button>
                  </CardContent>
                </Card>

                {/* Mevcut görseller */}
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold">Üretilmiş Görseller ({currentAssets.length})</h2>
                  <Button variant="ghost" size="sm" onClick={fetchAssets} disabled={loading}>
                    <RefreshCw className={cn('h-4 w-4 mr-1', loading && 'animate-spin')} /> Yenile
                  </Button>
                </div>

                {loading && currentAssets.length === 0 ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : currentAssets.length === 0 ? (
                  <Card className="border-dashed">
                    <CardContent className="p-8 text-center text-sm text-muted-foreground">
                      <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      Bu platform için henüz görsel üretilmedi. Yukarıdan başla.
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {currentAssets.map((a) => (
                      <Card key={a.id} className={cn('overflow-hidden', !a.active && 'opacity-50')}>
                        <div className="relative aspect-[9/16] bg-muted">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={a.base64Preview || a.storageUrl}
                            alt={a.deviceLabel}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                          {!a.active && (
                            <Badge variant="destructive" className="absolute top-2 right-2 text-[9px]">PASİF</Badge>
                          )}
                        </div>
                        <CardContent className="p-3 space-y-2">
                          <div>
                            <p className="text-xs font-semibold truncate">{a.deviceLabel}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {a.deviceW}×{a.deviceH}px · {a.aspectRatio}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-[9px]">
                            {FEATURES.find((f) => f.key === a.feature)?.label || a.feature}
                          </Badge>
                          <div className="flex items-center gap-1 pt-2">
                            <Button asChild variant="outline" size="sm" className="h-7 px-2 flex-1">
                              <a href={a.storageUrl} download target="_blank" rel="noopener noreferrer">
                                <Download className="h-3 w-3 mr-1" /> İndir
                              </a>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2"
                              onClick={() => handleToggleActive(a.id, !a.active)}
                              title={a.active ? 'Pasifleştir' : 'Aktifleştir'}
                            >
                              {a.active ? '👁' : '🚫'}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-rose-600"
                              onClick={() => handleDelete(a.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
