'use client';

/**
 * /super-admin/app-stores
 *
 * Süper-admin için 8 mağaza platformu üzerinde ekran görüntüsü üretim paneli.
 *
 * BİRİNCİL: Deterministik HTML/CSS şablon üretimi — gerçek hangel wordmark'ı,
 * doğru Türkçe metin, doğru cihaz çerçevesi (telefon/tablet/saat/banner/masaüstü)
 * ve marka renkleriyle; html2canvas ile tam çözünürlükte PNG. Piksel-/metin-/
 * marka-doğru.
 *
 * İKİNCİL (Deneysel): AI (Gemini text-to-image) üretimi. Metni/logoyu bozabilir;
 * sadece taslak/ilham için. Geri planda tutulur.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Sparkles, Download, Trash2, Loader2, AlertCircle, ImageIcon, RefreshCw,
  LayoutTemplate, FlaskConical,
} from 'lucide-react';
import { useUser } from '@/firebase';
import { cn } from '@/lib/utils';
import { PLATFORMS, FEATURES, type PlatformKey, type FeatureKey, type DeviceSpec } from '@/lib/app-store-specs';
import { TemplateStudio } from './_components/template-studio';

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

// Şablondan üretilip indirilen görsellerin oturum-içi listesi (önizleme için).
interface TemplateShot {
  id: string;
  dataUrl: string;
  fileName: string;
  platform: PlatformKey;
  feature: FeatureKey;
  deviceLabel: string;
}

export default function AppStoresPage() {
  const { user } = useUser();
  const [activePlatform, setActivePlatform] = useState<PlatformKey>('app-store');
  const [assets, setAssets] = useState<Record<string, AssetRow[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Seçim state'i (hem şablon hem AI üretimi için ortak)
  const [genFeature, setGenFeature] = useState<FeatureKey>('genel');
  const [genDevice, setGenDevice] = useState<DeviceSpec | null>(null);

  // AI (deneysel) state
  const [genPrompt, setGenPrompt] = useState('');
  const [generating, setGenerating] = useState(false);

  // Şablondan üretilen görseller (oturum-içi)
  const [templateShots, setTemplateShots] = useState<Record<string, TemplateShot[]>>({});

  const activeMeta = useMemo(() => PLATFORMS.find((p) => p.key === activePlatform)!, [activePlatform]);
  const activeFeatureLabel = useMemo(
    () => FEATURES.find((f) => f.key === genFeature)?.label || genFeature,
    [genFeature],
  );

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

  // Feature template prompt'unu yükle (AI alanı için)
  useEffect(() => {
    const f = FEATURES.find((x) => x.key === genFeature);
    if (f && !genPrompt) setGenPrompt(f.defaultPrompt);
  }, [genFeature, genPrompt]);

  // Platform değişince ilk required device'ı default seç
  useEffect(() => {
    const firstRequired = activeMeta.devices.find((d) => d.required) || activeMeta.devices[0];
    setGenDevice(firstRequired);
  }, [activeMeta]);

  const handleTemplateCaptured = useCallback(
    (item: { dataUrl: string; fileName: string }) => {
      if (!genDevice) return;
      setTemplateShots((prev) => ({
        ...prev,
        [activePlatform]: [
          {
            id: `${Date.now()}`,
            dataUrl: item.dataUrl,
            fileName: item.fileName,
            platform: activePlatform,
            feature: genFeature,
            deviceLabel: genDevice.device,
          },
          ...(prev[activePlatform] || []),
        ],
      }));
    },
    [activePlatform, genFeature, genDevice],
  );

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
  const currentShots = templateShots[activePlatform] || [];

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold font-headline">App Storlar — Görsel Üreteç</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Her mağaza için ekran görüntüsü üret. <strong>Şablondan üret</strong> gerçek hangel logosu,
          doğru Türkçe metin ve doğru cihaz çerçevesiyle tam çözünürlükte, marka-doğru PNG verir.
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
                {/* Ortak seçim: özellik + cihaz */}
                <Card>
                  <CardContent className="p-4 space-y-3">
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
                  </CardContent>
                </Card>

                {/* BİRİNCİL: Şablondan üret */}
                <Card className="border-primary/30">
                  <CardContent className="p-4 space-y-4">
                    <div className="flex items-center gap-2">
                      <LayoutTemplate className="h-4 w-4 text-primary" />
                      <h2 className="text-sm font-bold">Şablondan Üret — {p.label}</h2>
                      <Badge className="text-[9px] bg-primary">Önerilen</Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Gerçek hangel wordmark'ı + doğru Türkçe metin + doğru cihaz çerçevesi + marka renkleri.
                      Önizlemeyi gör, tam çözünürlükte PNG indir.
                    </p>
                    {genDevice && (
                      <TemplateStudio
                        platformKey={p.key}
                        device={genDevice}
                        feature={genFeature}
                        featureLabel={activeFeatureLabel}
                        onCaptured={handleTemplateCaptured}
                      />
                    )}

                    {/* Şablondan indirilen görseller (oturum) */}
                    {currentShots.length > 0 && (
                      <div className="pt-2 border-t">
                        <p className="text-[11px] font-bold mb-2">Bu oturumda indirilenler ({currentShots.length})</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                          {currentShots.map((s) => (
                            <a
                              key={s.id}
                              href={s.dataUrl}
                              download={s.fileName}
                              className="block rounded-lg border overflow-hidden bg-muted hover:opacity-90"
                              title={s.fileName}
                            >
                              {/* Şablon görseli dataURL — next/image gerekmiyor. */}
                              <img src={s.dataUrl} alt={s.deviceLabel} className="w-full h-auto" loading="lazy" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* İKİNCİL: Deneysel (AI) */}
                <Card className="border-dashed bg-muted/30">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <FlaskConical className="h-4 w-4 text-amber-600" />
                      <h2 className="text-sm font-bold text-muted-foreground">Deneysel (AI) — metin/logoyu bozabilir</h2>
                    </div>
                    <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-2">
                      ⚠️ AI text-to-image markayı/metni uydurabilir (bozuk logo, anlamsız Türkçe, yanlış cihaz).
                      Sadece taslak/ilham için. Mağazaya yüklemeden önce <strong>şablondan üret</strong>i tercih et.
                    </p>

                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                        Prompt (Türkçe)
                      </label>
                      <Textarea
                        value={genPrompt}
                        onChange={(e) => setGenPrompt(e.target.value)}
                        rows={4}
                        className="text-sm font-mono"
                        placeholder="hangel uygulamasında bağış akışını gösteren phone mockup..."
                      />
                    </div>

                    <Button
                      onClick={handleGenerate}
                      disabled={generating || !genDevice || !genPrompt.trim()}
                      size="sm"
                      variant="outline"
                    >
                      {generating
                        ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Üretiliyor (10-30 sn)…</>
                        : <><Sparkles className="h-4 w-4 mr-1" /> Deneysel AI ile üret</>}
                    </Button>
                  </CardContent>
                </Card>

                {/* Mevcut AI görselleri */}
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold">AI ile Üretilmiş Görseller ({currentAssets.length})</h2>
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
                      Bu platform için AI görseli üretilmedi. Şablondan üretmen önerilir.
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {currentAssets.map((a) => (
                      <Card key={a.id} className={cn('overflow-hidden', !a.active && 'opacity-50')}>
                        <div className="relative aspect-[9/16] bg-muted">
                          {/* AI çıktısı dataURL/Storage URL — next/image gerekmiyor. */}
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
