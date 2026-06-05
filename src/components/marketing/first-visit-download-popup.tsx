'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Apple, Smartphone, Watch, Monitor, Laptop, Chrome, Globe, X,
} from 'lucide-react';

const STORAGE_KEY = 'hangel_app_promo_dismissed_v1';
const REMIND_LATER_KEY = 'hangel_app_promo_remind_after';

interface Platform {
  name: string;
  icon: React.ElementType;
  href: string;
  badge?: string;
  bg: string;
  iconColor: string;
}

const PLATFORMS: Platform[] = [
  {
    name: 'App Store',
    icon: Apple,
    href: 'https://apps.apple.com/tr/app/hangel/id6664058822',
    bg: 'bg-white',
    iconColor: 'text-black',
  },
  {
    name: 'Google Play',
    icon: Smartphone,
    href: 'https://play.google.com/store/apps/details?id=com.hangel.app',
    bg: 'bg-emerald-300',
    iconColor: 'text-emerald-900',
  },
  {
    name: 'AppGallery',
    icon: Smartphone,
    href: 'https://appgallery.huawei.com/app/C113000000',
    badge: 'yakında',
    bg: 'bg-red-300',
    iconColor: 'text-red-900',
  },
  {
    name: 'Mac App',
    icon: Laptop,
    href: 'https://apps.apple.com/tr/app/hangel/id6664058822',
    badge: 'beta',
    bg: 'bg-slate-200',
    iconColor: 'text-slate-900',
  },
  {
    name: 'Apple Watch',
    icon: Watch,
    href: 'https://apps.apple.com/tr/app/hangel/id6664058822',
    badge: 'beta',
    bg: 'bg-zinc-200',
    iconColor: 'text-zinc-900',
  },
  {
    name: 'Windows PWA',
    icon: Monitor,
    href: 'https://hangel.org.tr/',
    badge: 'PWA',
    bg: 'bg-blue-300',
    iconColor: 'text-blue-900',
  },
  {
    name: 'Chrome',
    icon: Chrome,
    href: 'https://hangel.org.tr/',
    badge: 'PWA',
    bg: 'bg-amber-300',
    iconColor: 'text-amber-900',
  },
  {
    name: 'Web',
    icon: Globe,
    href: 'https://hangel.org.tr/',
    bg: 'bg-pink-300',
    iconColor: 'text-pink-900',
  },
];

export function FirstVisitDownloadPopup() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
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
  }, []);

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
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div
        className="relative max-w-2xl w-full max-h-[92vh] overflow-y-auto rounded-[2rem] border-[5px] border-black bg-yellow-300 shadow-[12px_12px_0_rgba(0,0,0,1)] p-6 sm:p-8 -rotate-1 animate-in zoom-in-90 duration-500"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.15) 1px, transparent 0)',
          backgroundSize: '18px 18px',
        }}
      >
        <button
          onClick={dismissForever}
          aria-label="Kapat"
          className="absolute -top-4 -right-4 z-20 h-12 w-12 rounded-full bg-black text-white border-[4px] border-white shadow-[4px_4px_0_rgba(0,0,0,1)] flex items-center justify-center hover:scale-110 transition-transform"
        >
          <X className="h-6 w-6" strokeWidth={3} />
        </button>

        <div className="relative z-10 text-center mb-6">
          <span
            className="inline-block bg-pink-500 text-white text-2xl sm:text-3xl font-black px-6 py-2 rounded-2xl border-[4px] border-black -rotate-[4deg] shadow-[5px_5px_0_rgba(0,0,0,1)]"
            style={{ textShadow: '2px 2px 0 rgba(0,0,0,0.3)' }}
          >
            BOOM! 💥
          </span>
          <h2
            className="text-3xl sm:text-5xl font-black mt-5 leading-[1.05] text-black"
            style={{ fontFamily: 'var(--font-poppins)' }}
          >
            hangel'i şimdi indir!
          </h2>
          <p className="text-sm sm:text-base font-bold text-black/80 mt-3 max-w-md mx-auto">
            Her cihazında, her zaman yanında. iOS, Android, Mac, Watch, Web — neyi kullanıyorsan oradayız.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 relative z-10">
          {PLATFORMS.map((p, i) => {
            const Icon = p.icon;
            const rotations = ['-rotate-2', 'rotate-2', '-rotate-1', 'rotate-1'];
            const rot = rotations[i % rotations.length];
            return (
              <a
                key={p.name}
                href={p.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={dismissForever}
                className={`group relative flex flex-col items-center justify-center p-4 ${p.bg} rounded-2xl border-[3px] border-black shadow-[4px_4px_0_rgba(0,0,0,1)] hover:shadow-[6px_6px_0_rgba(0,0,0,1)] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all ${rot} hover:rotate-0`}
              >
                <Icon className={`h-8 w-8 ${p.iconColor}`} strokeWidth={2.5} />
                <p className="text-xs font-black mt-2 text-black text-center leading-tight">
                  {p.name}
                </p>
                {p.badge && (
                  <span className="absolute -top-2 -right-2 text-[9px] font-black bg-black text-yellow-300 px-2 py-0.5 rounded-full uppercase tracking-wide border-2 border-yellow-300">
                    {p.badge}
                  </span>
                )}
              </a>
            );
          })}
        </div>

        <div className="mt-6 relative z-10 flex items-center justify-between gap-3 flex-wrap">
          <Link
            href="/app"
            onClick={dismissForever}
            className="text-xs sm:text-sm font-black underline decoration-2 decoration-black underline-offset-4 hover:text-pink-600 transition-colors"
          >
            → Tüm platformları ve sosyal medya hesaplarımızı gör
          </Link>
          <div className="flex gap-2 ml-auto">
            <button
              onClick={remindLater}
              className="text-[11px] sm:text-xs font-bold text-black/60 hover:text-black underline underline-offset-2"
            >
              Sonra hatırlat
            </button>
            <button
              onClick={dismissForever}
              className="text-[11px] sm:text-xs font-bold text-black/60 hover:text-black underline underline-offset-2"
            >
              Tekrar gösterme
            </button>
          </div>
        </div>

        <div className="absolute -top-6 -left-6 w-20 h-20 bg-cyan-400 rounded-full border-[4px] border-black -z-0 hidden sm:block" />
        <div className="absolute -bottom-4 -right-2 w-16 h-16 bg-pink-400 rounded-full border-[4px] border-black -z-0 hidden sm:block" />
      </div>
    </div>
  );
}
