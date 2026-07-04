'use client';

import { useEffect, useRef, type CSSProperties } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { MarketAdBanner } from '@/lib/market/ad-banners';

/** Fire-and-forget analytics ping — navigasyonu bloklamaz, hataları yutar. */
function pingAd(kind: 'click' | 'impression', id: string) {
  try {
    fetch(`/api/ads/${kind}`, {
      method: 'POST',
      keepalive: true,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id }),
    }).catch(() => {});
  } catch {
    // yut
  }
}

/**
 * Kurumsal-kimlikli, tam genişlik market reklam banner'ı.
 * `banner.design` (bg/fg/accent/ctaBg/ctaFg/logoText/imageUrl) ile tamamen
 * CSS'ten stillenir — kod dışı görsel gerektirmez.
 */
export function AdBannerCard({ banner }: { banner: MarketAdBanner }) {
  const { design, linkUrl } = banner;
  const firedImpression = useRef(false);

  useEffect(() => {
    if (firedImpression.current) return;
    firedImpression.current = true;
    pingAd('impression', banner.id);
  }, [banner.id]);

  const isInternal = linkUrl.startsWith('/');
  const isExternal = linkUrl.startsWith('http');

  const handleClick = () => {
    pingAd('click', banner.id);
  };

  const containerStyle: CSSProperties = {
    background: design.bg,
    color: design.fg,
  };

  const inner = (
    <div
      className={cn(
        'group relative flex w-full items-center overflow-hidden rounded-2xl shadow-sm',
        'min-h-[140px] md:min-h-[180px]',
        'transition-transform duration-200 hover:scale-[1.005]',
      )}
      style={containerStyle}
    >
      {/* Opsiyonel arka plan görseli — metnin arkasında, hafif opak. */}
      {design.imageUrl ? (
        <img
          src={design.imageUrl}
          alt=""
          aria-hidden="true"
          loading="lazy"
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-25"
        />
      ) : null}

      {/* Sponsorlu etiketi — yasal gereklilik, köşede hafif. */}
      <span
        className="absolute right-3 top-3 z-20 rounded-full bg-black/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/90 backdrop-blur-sm"
      >
        Sponsorlu
      </span>

      {/* Sol taraf — metin + CTA */}
      <div className="relative z-10 flex flex-1 flex-col gap-2 p-5 md:p-8">
        {banner.eyebrow ? (
          <span
            className="text-xs font-bold uppercase tracking-widest"
            style={{ color: design.accent }}
          >
            {banner.eyebrow}
          </span>
        ) : null}

        <h3 className="text-2xl font-black leading-tight md:text-4xl">
          {banner.title}
        </h3>

        {banner.subtitle ? (
          <p className="max-w-xl text-sm opacity-80 md:text-base">
            {banner.subtitle}
          </p>
        ) : null}

        {banner.ctaText ? (
          <span
            className="mt-2 inline-flex w-fit items-center rounded-full px-5 py-2 text-sm font-bold shadow-sm transition-transform group-hover:scale-105"
            style={{ background: design.ctaBg, color: design.ctaFg }}
          >
            {banner.ctaText}
          </span>
        ) : null}
      </div>

      {/* Sağ taraf — büyük wordmark/emoji. Küçük ekranlarda gizli. */}
      {design.logoText ? (
        <div className="relative z-10 hidden shrink-0 items-center justify-center pr-8 md:flex">
          <span className="select-none text-5xl font-black opacity-25 md:text-7xl">
            {design.logoText}
          </span>
        </div>
      ) : null}
    </div>
  );

  if (isInternal) {
    return (
      <Link
        href={linkUrl}
        onClick={handleClick}
        rel="sponsored"
        className="block w-full"
        aria-label={banner.title}
      >
        {inner}
      </Link>
    );
  }

  if (isExternal) {
    return (
      <a
        href={linkUrl}
        target="_blank"
        rel="noreferrer noopener sponsored"
        onClick={handleClick}
        className="block w-full"
        aria-label={banner.title}
      >
        {inner}
      </a>
    );
  }

  // Bilinmeyen link biçimi — güvenli fallback (dahili).
  return (
    <Link
      href={linkUrl || '#'}
      onClick={handleClick}
      rel="sponsored"
      className="block w-full"
      aria-label={banner.title}
    >
      {inner}
    </Link>
  );
}

export default AdBannerCard;
