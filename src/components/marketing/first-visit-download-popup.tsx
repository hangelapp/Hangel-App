'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Apple, Smartphone, Watch, Monitor, Laptop, Chrome, Globe, X, Download,
} from 'lucide-react';

const STORAGE_KEY = 'hangel_app_promo_dismissed_v1';
const REMIND_LATER_KEY = 'hangel_app_promo_remind_after';

interface Platform {
  name: string;
  icon: React.ElementType;
  href: string;
  badge?: string;
}

const PLATFORMS: Platform[] = [
  {
    name: 'App Store',
    icon: Apple,
    href: 'https://apps.apple.com/tr/app/hangel/id6664058822',
  },
  {
    name: 'Google Play',
    icon: Smartphone,
    href: 'https://play.google.com/store/apps/details?id=com.hangel.app',
  },
  {
    name: 'AppGallery',
    icon: Smartphone,
    href: 'https://appgallery.huawei.com/app/C113000000',
    badge: 'yakında',
  },
  {
    name: 'Mac App',
    icon: Laptop,
    href: 'https://apps.apple.com/tr/app/hangel/id6664058822',
  },
  {
    name: 'Apple Watch',
    icon: Watch,
    href: 'https://apps.apple.com/tr/app/hangel/id6664058822',
    badge: 'beta',
  },
  {
    name: 'Windows',
    icon: Monitor,
    href: 'https://hangel.org/',
    badge: 'PWA',
  },
  {
    name: 'Chrome',
    icon: Chrome,
    href: 'https://hangel.org/',
    badge: 'PWA',
  },
  {
    name: 'Web',
    icon: Globe,
    href: 'https://hangel.org/',
  },
];

export function FirstVisitDownloadPopup({ forceOpen = false }: { forceOpen?: boolean }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Önizleme/test: kapıları atla, doğrudan açık göster (varsayılan: kapalı).
    if (forceOpen) { setOpen(true); return; }
    if (typeof window === 'undefined') return;

    const path = window.location.pathname;
    if (path !== '/' && path !== '/app') {
      return;
    }

    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (dismissed === 'true') return;

    const remindAfter = localStorage.getItem(REMIND_LATER_KEY);
    if (remindAfter && Date.now() < parseInt(remindAfter, 10)) return;

    const t = setTimeout(() => setOpen(true), 2500);
    return () => clearTimeout(t);
  }, [forceOpen]);

  function dismissForever() {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, 'true');
    }
    setOpen(false);
  }

  function remindLater() {
    if (typeof window !== 'undefined') {
      const threeDays = Date.now() + 3 * 24 * 60 * 60 * 1000;
      localStorage.setItem(REMIND_LATER_KEY, String(threeDays));
    }
    setOpen(false);
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in-0 duration-300"
      onClick={remindLater}
      role="dialog"
      aria-modal="true"
      aria-labelledby="app-promo-title"
    >
      {/* Liquid Glass overlay — Dialog ile aynı: heavy blur + black/30 tint. */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-glass-3" />

      <div
        className="glass-prominent relative w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-3xl p-6 sm:p-8 animate-in zoom-in-95 duration-300 ease-spring"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={dismissForever}
          aria-label="Kapat"
          className="absolute right-4 top-4 rounded-full p-1.5 opacity-70 ring-offset-background transition-opacity hover:opacity-100 hover:bg-glass-black-5 dark:hover:bg-glass-white-8 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="text-center mb-6">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-glass-soft">
            <Download className="h-8 w-8" strokeWidth={2} />
          </div>
          <h2
            id="app-promo-title"
            className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground"
            style={{ fontFamily: 'var(--font-poppins)' }}
          >
            hangel'i cihazına ekle
          </h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto leading-relaxed">
            iOS, Android, Mac, Apple Watch ve web — hangi cihazı kullanırsan kullan, hangel hep yanında.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {PLATFORMS.map((p) => {
            const Icon = p.icon;
            return (
              <a
                key={p.name}
                href={p.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={dismissForever}
                className="group relative flex flex-col items-center justify-center gap-2 p-4 glass-thin rounded-2xl transition-all duration-200 ease-spring hover:shadow-glass-soft active:scale-[0.96]"
              >
                <Icon className="h-7 w-7 text-foreground" strokeWidth={1.75} />
                <p className="text-xs font-medium text-foreground text-center leading-tight">
                  {p.name}
                </p>
                {p.badge && (
                  <span className="absolute top-1.5 right-1.5 text-[9px] font-semibold bg-primary/10 text-primary px-1.5 py-0.5 rounded-full uppercase tracking-wide">
                    {p.badge}
                  </span>
                )}
              </a>
            );
          })}
        </div>

        <div className="mt-6 flex flex-col items-center gap-3 text-center">
          <Link
            href="/app"
            onClick={dismissForever}
            className="text-sm font-medium text-primary hover:underline underline-offset-4 transition-colors"
          >
            Tüm platformları ve sosyal medya hesaplarımızı gör
          </Link>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={remindLater}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Sonra hatırlat
            </button>
            <button
              onClick={dismissForever}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Tekrar gösterme
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
