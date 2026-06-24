'use client';

import React, { useState } from 'react';
import type { Brand } from '@/lib/types';

/**
 * Keskin marka logosu — her marka kartında aynı kaynak zincirini kullanır.
 * Bulanık/eksik favicon sorununu otomatik en iyi kaynakla çözer.
 *
 * Bu bileşen `absolute inset-0` ile render eder; bu yüzden `relative` konumlu
 * ve sabit boyutlu bir kapsayıcı içinde kullanılmalıdır.
 */
export const BrandLogo = ({ brand, padding = 'p-3' }: { brand: Brand; padding?: string }) => {
  // En doğru domain: targetDomain → link → contact.website → marka adından türet.
  const domain = (() => {
    const clean = (h: string) => h.replace(/^www\./, '');
    if (brand.targetDomain) return clean(brand.targetDomain.replace(/^https?:\/\//, '').split('/')[0]);
    try { if (brand.link) return clean(new URL(brand.link).hostname); } catch {}
    const web = brand.contact?.website;
    try { if (web) return clean(new URL(web.startsWith('http') ? web : `https://${web}`).hostname); } catch {}
    return `${brand.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com.tr`;
  })();

  // Keskin logo kaynak zinciri — kötü/bulanık logoyu otomatik en iyisiyle değiştirir:
  //  1) markanın yüklediği gerçek logo (clearbit DEĞİLse) — en iyi
  //  2) unavatar.io — çoklu kaynaktan GERÇEK marka logosunu getirir (keskin; yoksa 404)
  //  3) Google favicon sz=256 — güvenli son çare (eski sz=128 bulanıktı)
  // Clearbit kapandı (DNS yok) → DB'deki logo.clearbit.com URL'leri atlanır.
  const realLogo = (() => {
    const url = brand.logoUrl || '';
    return !url || url.includes('logo.clearbit.com/') ? '' : url;
  })();

  const sources = [
    realLogo,
    `https://unavatar.io/${domain}?fallback=false`,
    `https://www.google.com/s2/favicons?domain=${domain}&sz=256`,
  ].filter(Boolean);

  const [srcIndex, setSrcIndex] = useState(0);
  const [hasError, setHasError] = useState(sources.length === 0);

  if (hasError || !sources[srcIndex]) {
    return (
      <div className="absolute inset-0 rounded-2xl bg-primary/10 flex items-center justify-center p-2">
        <span className="text-primary font-black text-xl">{brand.name.charAt(0)}</span>
      </div>
    );
  }

  const tryNext = () => {
    setSrcIndex((i) => {
      if (i < sources.length - 1) return i + 1;
      setHasError(true);
      return i;
    });
  };

  return (
    <img
      src={sources[srcIndex]}
      alt={brand.name}
      className={`absolute inset-0 w-full h-full object-contain ${padding}`}
      onLoad={(e) => {
        const img = e.currentTarget;
        if (img.naturalWidth < 16 || img.naturalHeight < 16) tryNext();
      }}
      onError={tryNext}
      loading="lazy"
      referrerPolicy="no-referrer"
    />
  );
};
