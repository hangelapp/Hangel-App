'use client';

/**
 * src/app/super-admin/app-stores/_components/template-studio.tsx
 *
 * Deterministik şablon stüdyosu: seçili platform/cihaz/özellik için
 * <ScreenshotTemplate /> önizlemesi + tam çözünürlükte PNG indirme.
 *
 * İndirme: ekranda gizli (off-screen) bir kapsayıcıya cihazın TAM piksel
 * genişliğinde (device.w) bir şablon render eder ve html2canvas ile yakalar.
 * Böylece çıktı tam `device.w × device.h` olur, önizleme küçük kalır.
 */

import * as React from 'react';
import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { ScreenshotTemplate, getDeviceClass } from './screenshot-template';
import type { PlatformKey, FeatureKey, DeviceSpec } from '@/lib/app-store-specs';

// Önizleme kutusunun maksimum CSS boyutları.
const PREVIEW_MAX_W = 320;
const PREVIEW_MAX_H = 420;

interface TemplateStudioProps {
  platformKey: PlatformKey;
  device: DeviceSpec;
  feature: FeatureKey;
  featureLabel: string;
  /** Üretilen PNG'yi (dataURL + meta) listeye eklemek için. */
  onCaptured?: (item: { dataUrl: string; fileName: string }) => void;
}

const DEVICE_CLASS_TR: Record<ReturnType<typeof getDeviceClass>, string> = {
  phone: 'Telefon çerçevesi',
  tablet: 'Tablet çerçevesi',
  watch: 'Saat çerçevesi (watchOS)',
  banner: 'Yatay banner',
  desktop: 'Masaüstü pencere',
};

export function TemplateStudio({
  platformKey,
  device,
  feature,
  featureLabel,
  onCaptured,
}: TemplateStudioProps) {
  const captureRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const deviceClass = getDeviceClass(platformKey, device);

  // Önizleme: cihaz oranını koruyarak PREVIEW_MAX kutusuna sığdır.
  const ratio = device.w / device.h;
  let previewW = PREVIEW_MAX_W;
  let previewH = Math.round(previewW / ratio);
  if (previewH > PREVIEW_MAX_H) {
    previewH = PREVIEW_MAX_H;
    previewW = Math.round(previewH * ratio);
  }

  const fileName = `hangel-${platformKey}-${slug(device.device)}-${feature}.png`;

  async function handleDownload() {
    if (!captureRef.current) return;
    setDownloading(true);
    setErr(null);
    try {
      const { default: html2canvas } = await import('html2canvas');
      const node = captureRef.current;
      // Off-screen şablon device.w genişliğinde render edildi; html2canvas
      // birebir o pikselde yakalar (scale = 1 → tam device.w × device.h).
      const canvas = await html2canvas(node, {
        scale: 1,
        backgroundColor: null,
        useCORS: true,
        logging: false,
        width: device.w,
        height: device.h,
        windowWidth: device.w,
        windowHeight: device.h,
      });

      const dataUrl = canvas.toDataURL('image/png');

      // İndir
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      onCaptured?.({ dataUrl, fileName });
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'İndirme başarısız');
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Önizleme — ölçekli */}
      <div
        className="rounded-xl border border-border shadow-sm overflow-hidden bg-white"
        style={{ width: previewW, height: previewH }}
      >
        <ScreenshotTemplate
          platformKey={platformKey}
          device={device}
          feature={feature}
          renderWidth={previewW}
        />
      </div>

      <div className="text-center">
        <p className="text-[11px] font-semibold text-foreground">{DEVICE_CLASS_TR[deviceClass]}</p>
        <p className="text-[10px] text-muted-foreground">
          {device.device} · {device.w}×{device.h}px · {featureLabel}
        </p>
      </div>

      <Button onClick={handleDownload} disabled={downloading} size="sm" className="bg-primary">
        {downloading ? (
          <>
            <Loader2 className="h-4 w-4 mr-1 animate-spin" /> Yakalanıyor…
          </>
        ) : (
          <>
            <Download className="h-4 w-4 mr-1" /> İndir (PNG · tam çözünürlük)
          </>
        )}
      </Button>

      {err && <p className="text-[11px] text-rose-600">{err}</p>}

      {/* Off-screen tam çözünürlük render — sadece yakalama için, görünmez. */}
      <div
        aria-hidden
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          // Görünür alanın dışına it; pointer/scroll etkilemesin.
          transform: 'translate(-100000px, -100000px)',
          pointerEvents: 'none',
          opacity: 0,
          zIndex: -1,
        }}
      >
        <ScreenshotTemplate
          platformKey={platformKey}
          device={device}
          feature={feature}
          renderWidth={device.w}
          innerRef={captureRef}
        />
      </div>
    </div>
  );
}

// Cihaz adını dosya-adı dostu slug'a çevir.
function slug(s: string): string {
  return s
    .toLowerCase()
    .replace(/["']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
