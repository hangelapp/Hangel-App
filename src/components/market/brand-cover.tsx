'use client';

/**
 * BrandCover — Trendyol tarzı marka kapak banner'ı.
 *
 * Gerçek marka kapak görselimiz olmadığından, marka adından TÜRETİLEN kararlı bir
 * renk (hash → hue) ile şık bir gradyan üretir; her markanın kendi kimlik rengi olur.
 * Marka logosu beyaz yuvarlak bir kutucuğun içinde + büyük beyaz marka adı overlay.
 * Dışa bağımlı görsel yoktur (self-contained).
 */
import React, { useMemo } from 'react';
import { Heart } from 'lucide-react';
import { BrandLogo } from '@/components/market/brand-logo';
import type { Brand } from '@/lib/types';

// Marka adından kararlı bir hue (0–359) türet — her marka kendi kimlik rengini alır.
function hueFromName(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return h % 360;
}

export function BrandCover({
  brandName,
  brand,
  topRate,
}: {
  brandName: string;
  brand: Brand;
  topRate: number;
}) {
  // Şık, çok parlak olmayan bir gradyan: aynı hue'nun iki tonu + hafif komşu hue.
  const bg = useMemo(() => {
    const hue = hueFromName(brandName || 'brand');
    const c1 = `hsl(${hue} 62% 42%)`;
    const c2 = `hsl(${(hue + 24) % 360} 58% 30%)`;
    return `linear-gradient(135deg, ${c1} 0%, ${c2} 100%)`;
  }, [brandName]);

  return (
    <div
      className="relative h-32 w-full overflow-hidden rounded-b-2xl sm:h-44"
      style={{ background: bg }}
    >
      {/* Yumuşak ışık dokusu — düz gradyanı biraz derinleştirir. */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_120%_at_15%_-10%,rgba(255,255,255,0.28),transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />

      {/* En yüksek bağış çipi */}
      {topRate > 0 && (
        <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold text-primary shadow-sm sm:right-4 sm:top-4">
          <Heart className="h-3 w-3 fill-primary" />
          en yüksek %{topRate} bağış
        </div>
      )}

      {/* Logo kutucuğu + marka adı */}
      <div className="absolute bottom-0 left-0 flex w-full items-end gap-3 p-4 sm:gap-4 sm:p-5">
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl border border-white/60 bg-white shadow-md sm:h-20 sm:w-20">
          <BrandLogo brand={brand} />
        </div>
        <h2 className="min-w-0 flex-1 truncate pb-0.5 text-2xl font-black text-white drop-shadow-sm sm:text-4xl">
          {brandName}
        </h2>
      </div>
    </div>
  );
}
