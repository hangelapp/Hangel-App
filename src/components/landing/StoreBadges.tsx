'use client';

/**
 * StoreBadges — Ana sayfada "Hemen Katıl" CTA'sının altında hangel'in hangi
 * platformlarda olduğunu gösterir. Beyaz/gri zemin geçiş noktasında konumlanır.
 *
 * 8 platform: App Store, Google Play, AppGallery, Apple Watch, Mac App,
 *             Apple Vision, Microsoft Store, Chrome Uzantısı.
 *
 * Status'lar:
 *   - live  : tıklanabilir, canlıda
 *   - beta  : "Beta" rozeti (TestFlight / Mac Catalyst gibi)
 *   - soon  : "Yakında" rozeti, disabled görünüm
 *   - pwa   : "PWA" rozeti (Microsoft Store için)
 */

import Link from 'next/link';

type Status = 'live' | 'beta' | 'soon' | 'pwa';

interface StoreBadgeProps {
  store: string;
  caption: string;
  status: Status;
  href?: string;
  Logo: React.ComponentType<{ className?: string }>;
}

function AppleLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
    </svg>
  );
}

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

// Huawei AppGallery — kırmızı flower-like petal
function AppGalleryLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M12 2C9.5 4.5 9.5 8.5 12 11c2.5-2.5 2.5-6.5 0-9zM4 6c0 3.5 2.5 6 6 6 0-3.5-2.5-6-6-6zM20 6c-3.5 0-6 2.5-6 6 3.5 0 6-2.5 6-6zM4 18c3.5 0 6-2.5 6-6-3.5 0-6 2.5-6 6zM20 18c0-3.5-2.5-6-6-6 0 3.5 2.5 6 6 6zM12 22c2.5-2.5 2.5-6.5 0-9-2.5 2.5-2.5 6.5 0 9z" fill="#FF0000"/>
    </svg>
  );
}

// Apple Watch — rounded square watch silhouette
function AppleWatchLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <rect x="6" y="6" width="12" height="12" rx="3" fill="currentColor"/>
      <path d="M9 3l.5 3h5L15 3H9zM9 18l.5 3h5L15 18H9z" fill="currentColor" opacity="0.7"/>
    </svg>
  );
}

// Mac — laptop silhouette
function MacLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M4 5h16v10H4V5zm0 11h16l1 2H3l1-2z" fill="currentColor"/>
    </svg>
  );
}

// Apple Vision Pro — goggle silhouette
function VisionLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M3 10c0-2 1.5-3 3.5-3h11c2 0 3.5 1 3.5 3v4c0 2-1.5 3-3.5 3-1.5 0-2.5-1-3.5-2-1-1-2-1-3 0-1 1-2 2-3.5 2C4.5 17 3 16 3 14v-4z" fill="currentColor"/>
    </svg>
  );
}

// Microsoft — 4 colored squares
function MicrosoftLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <rect x="3" y="3" width="8" height="8" fill="#F25022"/>
      <rect x="13" y="3" width="8" height="8" fill="#7FBA00"/>
      <rect x="3" y="13" width="8" height="8" fill="#00A4EF"/>
      <rect x="13" y="13" width="8" height="8" fill="#FFB900"/>
    </svg>
  );
}

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

const STATUS_BADGE: Record<Status, { label: string; cls: string } | null> = {
  live: null,
  beta:  { label: 'Beta',    cls: 'bg-amber-500 text-black' },
  soon:  { label: 'Yakında', cls: 'bg-white text-black ring-1 ring-black/10' },
  pwa:   { label: 'PWA',     cls: 'bg-emerald-500 text-white' },
};

function StoreBadge({ store, caption, status, href, Logo }: StoreBadgeProps) {
  const disabled = status === 'soon' && !href;
  const badgeMeta = STATUS_BADGE[status];
  const content = (
    <div
      className={[
        'group relative flex items-center gap-3 rounded-2xl px-5 py-3 transition-all',
        'bg-black text-white min-w-[230px]',
        disabled ? 'opacity-60' : 'hover:scale-[1.03] hover:shadow-xl',
      ].join(' ')}
    >
      <Logo className="h-9 w-9 shrink-0" />
      <div className="text-left leading-tight">
        <p className="text-base font-semibold leading-tight">{store}</p>
        <p className="text-[10px] opacity-70 mt-0.5">{caption}</p>
      </div>
      {badgeMeta && (
        <span className={[
          'absolute -top-2 -right-2 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider shadow-md',
          badgeMeta.cls,
        ].join(' ')}>
          {badgeMeta.label}
        </span>
      )}
    </div>
  );
  if (disabled || !href) return <div className="cursor-default" aria-disabled>{content}</div>;
  return <Link href={href}>{content}</Link>;
}

export function StoreBadges() {
  return (
    <section className="bg-gradient-to-b from-white to-[#f1f1f1] py-12 px-6 border-b border-black/5">
      <div className="max-w-6xl mx-auto text-center">
        <p className="text-[11px] uppercase tracking-widest font-bold text-muted-foreground mb-1">
          hangel her yerde
        </p>
        <h3 className="text-xl md:text-2xl font-medium text-[#1d1d1f] mb-6">
          Web, mobil, masaüstü ve giyilebilir
        </h3>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <StoreBadge
            store="App Store"
            caption="iPhone & iPad — iOS 15+"
            status="live"
            Logo={AppleLogo}
          />
          <StoreBadge
            store="Google Play"
            caption="Android telefon & tablet — Android 8+"
            status="live"
            Logo={GooglePlayLogo}
          />
          <StoreBadge
            store="AppGallery"
            caption="Huawei cihazları — EMUI 10+"
            status="soon"
            Logo={AppGalleryLogo}
          />
          <StoreBadge
            store="Apple Watch"
            caption="iPhone hangel app ile birlikte gelir"
            status="beta"
            Logo={AppleWatchLogo}
          />
          <StoreBadge
            store="Mac App"
            caption="macOS 11+ — Mac Catalyst (iOS app Mac'te çalışır)"
            status="beta"
            Logo={MacLogo}
          />
          <StoreBadge
            store="Apple Vision"
            caption="visionOS — uzamsal arayüz"
            status="soon"
            Logo={VisionLogo}
          />
          <StoreBadge
            store="Microsoft Store"
            caption="Windows 10/11 — PWA"
            status="pwa"
            Logo={MicrosoftLogo}
          />
          <StoreBadge
            store="Chrome Uzantısı"
            caption="Chrome / Edge — alışverişte otomatik STK desteği"
            status="soon"
            Logo={ChromeLogo}
          />
        </div>
      </div>
    </section>
  );
}
