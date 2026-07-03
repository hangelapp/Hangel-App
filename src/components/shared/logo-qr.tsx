'use client';

/**
 * LogoQr — merkeze ilgili kurumun logosu gömülü QR kodu.
 *
 * Client-side canvas ile üretilir (sunucuya keyfi URL fetch'i YOK → SSRF yok,
 * `sharp` bağımlılığı yok). Yüksek hata düzeltme (level H, ~%30 kurtarma)
 * sayesinde ortadaki ~%22 alanı kaplayan logo QR'ın taranabilirliğini bozmaz.
 * Logo yüklenemezse (CORS/404) QR yine geçerli kalır — sessizce logosuz gösterilir.
 */

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

export function LogoQr({
  value,
  logoUrl,
  size = 240,
  className,
  onDataUrl,
}: {
  value: string;
  logoUrl?: string | null;
  size?: number;
  className?: string;
  /** Çizim bitince PNG data-URL verir (indirme için). CORS logoyu kirletirse null. */
  onDataUrl?: (url: string | null) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let cancelled = false;
    const canvas = canvasRef.current;
    if (!canvas || !value) return;

    const emit = () => {
      if (cancelled || !onDataUrl) return;
      try {
        onDataUrl(canvas.toDataURL('image/png'));
      } catch {
        onDataUrl(null); // canvas tainted (logo CORS) → logosuz indirmeye düş
      }
    };

    (async () => {
      const QR = (await import('qrcode')).default;
      await QR.toCanvas(canvas, value, {
        width: size,
        margin: 2,
        errorCorrectionLevel: 'H', // logo için zorunlu
        color: { dark: '#042654', light: '#ffffff' }, // hangel navy / beyaz — yüksek kontrast
      });
      if (cancelled) return;

      // Kurum logosu yoksa hangel markasına düş (same-origin → canvas kirlenmez,
      // indirme de çalışır). Böylece her QR'ın ortasında görünür bir mark olur.
      const raw = logoUrl || '/logo.png';
      // Harici (http/https) logoları same-origin proxy üzerinden çek — çoğu logo
      // host'u CORS header göndermediğinden crossOrigin='anonymous' ile doğrudan
      // yükleme başarısız oluyordu (→ logosuz QR). Proxy same-origin olduğu için
      // canvas kirlenmez, indirme de çalışır. Yerel yol / data: URI doğrudan geçer.
      const logoSrc = /^https?:\/\//i.test(raw)
        ? `/api/img-proxy?url=${encodeURIComponent(raw)}`
        : raw;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        emit();
        return;
      }
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        if (cancelled) return;
        const box = Math.round(size * 0.22);
        const pos = Math.round((size - box) / 2);
        const pad = Math.round(box * 0.14);
        const plateR = Math.round((box + pad * 2) * 0.28);
        // Beyaz yuvarlak plaka (logoyu QR modüllerinden ayırır, taramayı korur).
        ctx.save();
        ctx.beginPath();
        roundRectPath(ctx, pos - pad, pos - pad, box + pad * 2, box + pad * 2, plateR);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        // Narçiçeği (marka) ince çerçeve — logoyu vurgular. Stroke plakanın kenarına
        // ortalanır; toplam merkez alanı ~%29 kalır (errorCorrectionLevel:'H' ~%30'a
        // kadar tolere eder) → tarama bozulmaz.
        ctx.lineWidth = Math.max(2, Math.round(box * 0.055));
        ctx.strokeStyle = '#f34723';
        ctx.stroke();
        // Logoyu yuvarlak köşeli kutuya kırparak çiz.
        ctx.beginPath();
        roundRectPath(ctx, pos, pos, box, box, Math.round(box * 0.2));
        ctx.clip();
        ctx.drawImage(img, pos, pos, box, box);
        ctx.restore();
        emit();
      };
      img.onerror = () => {
        // Logo yüklenemedi → QR logosuz ama geçerli kalır.
        emit();
      };
      img.src = logoSrc;
    })();

    return () => {
      cancelled = true;
    };
  }, [value, logoUrl, size, onDataUrl]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      role="img"
      aria-label="QR kod"
      className={cn('block', className)}
    />
  );
}

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}
