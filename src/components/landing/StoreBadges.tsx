'use client';

/**
 * StoreBadges — Ana sayfada "Hemen Katıl" CTA'sının altında hangel'in hangi
 * platformlarda olduğunu gösterir. Beyaz/gri zemin geçiş noktasında konumlanır.
 *
 * Durumlar:
 *   - canlı:   tıklanabilir, store'a link
 *   - beta:    "Beta" rozeti (TestFlight gibi)
 *   - yakında: opacity'li disabled görünüm
 *
 * 4 platform: App Store (iOS), Google Play (Android), Mac App Store, Chrome Web Store.
 */

import Link from 'next/link';

type Status = 'live' | 'beta' | 'soon';

interface StoreBadgeProps {
  store: string;
  caption: string;       // Üst yazı (örn: "App Store'da")
  status: Status;
  href?: string;
  Logo: React.ComponentType<{ className?: string }>;
}

// App Store (Apple) logo — Apple official glyph (rounded apple icon)
function AppleLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
    </svg>
  );
}

// Google Play — official "Play" triangle
function GooglePlayLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M3 20.5V3.5c0-.59.34-1.11.84-1.35L13.69 12 3.84 21.85c-.5-.25-.84-.76-.84-1.35z" fill="#00D7FE"/>
      <path d="M16.81 15.12L6.05 21.34l8.49-8.49 2.27 2.27z" fill="#FF3A44"/>
      <path d="M20.16 10.81c.39.22.7.62.7 1.19 0 .57-.31.96-.71 1.19l-2.32 1.34L15.39 12l2.44-2.53 2.33 1.34z" fill="#FFCE00"/>
      <path d="M6.05 2.66l10.76 6.22-2.27 2.27-8.49-8.49z" fill="#00F076"/>
    </svg>
  );
}

// Mac App Store — Apple + circle
function MacAppStoreLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="11" fill="currentColor" opacity="0.1"/>
      <path d="M17.05 16.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 11.25 3.51 3.59 9.05 3.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09z" fill="currentColor"/>
    </svg>
  );
}

// Chrome — official 4-color logo
function ChromeLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="11" fill="#fff"/>
      <path d="M12 1C7.93 1 4.36 3.21 2.44 6.5h9.18l-2.12 3.67A4.5 4.5 0 1 1 8.6 7.5L4 1.5l.05-.03A11 11 0 0 1 12 1z" fill="#EA4335"/>
      <path d="M22.56 12c0-1.85-.46-3.6-1.27-5.13l-4.9 8.49a4.5 4.5 0 0 1-7.79 0L4.16 6.27A11 11 0 0 0 12 23a11 11 0 0 0 10.56-11z" fill="#34A853"/>
      <circle cx="12" cy="12" r="4" fill="#4285F4"/>
      <path d="M22.56 12a11 11 0 0 1-3.05 7.6L14.6 11.4l-2.6 4.5 4.59-7.95.79-1.37H21.3c.81 1.53 1.27 3.28 1.27 5.42z" fill="#FBBC04"/>
    </svg>
  );
}

function StoreBadge({ store, caption, status, href, Logo }: StoreBadgeProps) {
  const disabled = status !== 'live' && !href;
  const badge = (
    <div
      className={[
        'group relative flex items-center gap-3 rounded-2xl px-5 py-3 transition-all',
        'bg-black text-white',
        disabled ? 'opacity-60' : 'hover:scale-[1.03] hover:shadow-xl',
      ].join(' ')}
    >
      <Logo className="h-9 w-9 shrink-0" />
      <div className="text-left leading-tight">
        <p className="text-[10px] uppercase tracking-wider opacity-70">{caption}</p>
        <p className="text-base font-semibold -mt-0.5">{store}</p>
      </div>
      {status === 'beta' && (
        <span className="absolute -top-2 -right-2 rounded-full bg-amber-500 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-black shadow-md">
          Beta
        </span>
      )}
      {status === 'soon' && (
        <span className="absolute -top-2 -right-2 rounded-full bg-white px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-black shadow-md ring-1 ring-black/10">
          Yakında
        </span>
      )}
    </div>
  );
  if (disabled || !href) return <div className="cursor-default" aria-disabled>{badge}</div>;
  return (
    <Link href={href} className="cursor-pointer">
      {badge}
    </Link>
  );
}

export function StoreBadges() {
  return (
    <section className="bg-gradient-to-b from-white to-[#f1f1f1] py-12 px-6 border-b border-black/5">
      <div className="max-w-5xl mx-auto text-center">
        <p className="text-[11px] uppercase tracking-widest font-bold text-muted-foreground mb-1">
          hangel her yerde
        </p>
        <h3 className="text-xl md:text-2xl font-medium text-[#1d1d1f] mb-6">
          Web, mobil ve masaüstünde
        </h3>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <StoreBadge
            store="App Store"
            caption="iOS — TestFlight"
            status="beta"
            Logo={AppleLogo}
          />
          <StoreBadge
            store="Google Play"
            caption="Android"
            status="soon"
            Logo={GooglePlayLogo}
          />
          <StoreBadge
            store="Mac App Store"
            caption="macOS"
            status="soon"
            Logo={MacAppStoreLogo}
          />
          <StoreBadge
            store="Chrome Web Store"
            caption="Chrome Eklenti"
            status="soon"
            Logo={ChromeLogo}
          />
        </div>
      </div>
    </section>
  );
}
