'use client';

/**
 * DetailBody — Etkinlik + Gönüllülük detay sayfaları için ORTAK gövde
 * primitive'leri. Tek tasarım dili:
 *   - GÖNÜLLÜLÜĞÜN ferah/havadar boşluğu (bol space-y, geniş padding).
 *   - ETKİNLİĞİN sticky CTA + tutarlı kart/başlık yapısı.
 *   - Apple/iOS 26 token: rounded-2xl/3xl, shadow-sm/glass-soft, semantik renk.
 *
 * Bu dosya SALT layout primitive'i sağlar; sayfa-özel mantık (RSVP, başvuru,
 * hava durumu, canlı bölüm) çağıran sayfada KALIR — bozulmaz.
 */

import { cn } from '@/lib/utils';

/**
 * Sayfa içerik kapsayıcısı — ferah, ortalanmış, güvenli alanlı.
 * Sticky CTA için altta nefes payı bırakır.
 */
export function DetailBody({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'mx-auto w-full max-w-5xl px-5 md:px-8 pt-8 md:pt-12 pb-10',
        className,
      )}
    >
      {children}
    </div>
  );
}

/**
 * Dikey bölüm akışı — gönüllülüğün havadar ritmi (geniş space-y).
 */
export function DetailSections({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('space-y-10 md:space-y-12', className)}>{children}</div>
  );
}

/**
 * Başlıklı içerik bölümü — tutarlı tipografi hiyerarşisi.
 */
export function DetailSection({
  title,
  children,
  className,
  titleClassName,
}: {
  title?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  titleClassName?: string;
}) {
  return (
    <section className={cn('space-y-4', className)}>
      {title && (
        <h2
          className={cn(
            'text-2xl md:text-3xl font-bold tracking-tight text-foreground',
            titleClassName,
          )}
        >
          {title}
        </h2>
      )}
      {children}
    </section>
  );
}

/**
 * Birincil kart yüzeyi — Apple token (rounded-3xl, shadow-sm, semantik renk).
 * Cam materyal isteyene `glass` prop'u (.glass utility).
 */
export function DetailCard({
  children,
  className,
  glass = false,
  padded = true,
}: {
  children: React.ReactNode;
  className?: string;
  glass?: boolean;
  padded?: boolean;
}) {
  return (
    <div
      className={cn(
        'rounded-3xl border',
        glass ? 'glass border-transparent' : 'border-border bg-card',
        'shadow-sm',
        padded && 'p-5 sm:p-6',
        className,
      )}
    >
      {children}
    </div>
  );
}

/**
 * Ferah iki-kolon düzeni — geniş ekranda içerik + sidebar, mobilde tek kolon.
 * Gönüllülüğün havadar boşluğunu korur (geniş gap).
 */
export function DetailColumns({
  main,
  aside,
  className,
}: {
  main: React.ReactNode;
  aside?: React.ReactNode;
  className?: string;
}) {
  if (!aside) {
    return <div className={cn('min-w-0', className)}>{main}</div>;
  }
  return (
    <div
      className={cn(
        'grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-x-12 gap-y-12 items-start',
        className,
      )}
    >
      <div className="min-w-0">{main}</div>
      <aside className="space-y-10 lg:sticky lg:top-8">{aside}</aside>
    </div>
  );
}

/**
 * Sticky alt CTA barı — translucent materyal, güvenli alan, ≥44px buton.
 * Etkinlik + gönüllülük detayında tutarlı birincil eylem yeri.
 *
 * LAYOUT SÖZLEŞMESİ: Bu bar `sticky bottom-0` olduğundan, içerik bar'ın
 * altına kaymasın diye SAYFA içerik kapsayıcısı yeterli alt padding
 * vermelidir. Bar yüksekliği ~60px (py-4) + `var(--sab)`
 * olduğundan, çağıran sayfa en az `pb-32` (~128px) bırakmalıdır
 * (örn. volunteering/[id]/page.tsx). Bu pay kısaltılırsa uzun sekme
 * içeriklerinde son satır bar'ın arkasında kalır.
 */
export function DetailStickyBar({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'sticky bottom-0 z-10 mt-auto border-t border-border bg-background/80 px-5 md:px-8 py-4 backdrop-blur-xl',
        className,
      )}
      style={{ paddingBottom: 'calc(1rem + var(--sab))' }}
    >
      <div className="mx-auto max-w-5xl">{children}</div>
    </div>
  );
}
