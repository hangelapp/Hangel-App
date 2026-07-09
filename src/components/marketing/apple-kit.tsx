'use client';

/**
 * apple-kit — paylaşılan "Apple web sitesi" pazarlama bileşenleri.
 *
 * "Daha Fazla Bilgi Al" tanıtım sayfaları (STK, Marka, Kulüp, Kütüphane,
 * Acil, Kamu) bu kit ile tutarlı bir Apple marka kimliğinde kurulur.
 *
 * Tasarım ilkeleri:
 *   - Tek aksan rengi: narçiçeği (--primary / #f34723). Başka aksan yok.
 *   - Nötrler: beyaz, #1d1d1f, #f5f5f7, siyah (dark slaytlar).
 *   - Tam ekran slaytlar, büyük tipografi, bol boşluk, yumuşak fade-in.
 *   - Özellik durumları rozetle işaretlenir: Yeni / Beta / Yakında / Sadece hangel'da.
 */

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, ChevronRight, Sparkles, Zap, Clock, BadgeCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type Lang = 'tr' | 'en';
export type BadgeKind = 'yeni' | 'beta' | 'yakinda' | 'hangel';

const BADGE_LABELS: Record<BadgeKind, { tr: string; en: string }> = {
  yeni: { tr: 'Yeni', en: 'New' },
  beta: { tr: 'Beta', en: 'Beta' },
  yakinda: { tr: 'Yakında', en: 'Soon' },
  hangel: { tr: "Sadece hangel'da", en: 'Only on hangel' },
};

const BADGE_ICON: Record<BadgeKind, React.ElementType> = {
  yeni: Sparkles,
  beta: Zap,
  yakinda: Clock,
  hangel: BadgeCheck,
};

const BADGE_CLASS: Record<BadgeKind, string> = {
  yeni: 'bg-primary text-white',
  beta: 'border border-primary/40 text-primary bg-primary/5',
  yakinda: 'bg-black/[0.06] text-muted-foreground',
  hangel: 'bg-primary/10 text-primary',
};

export function AppleBadge({
  kind,
  lang = 'tr',
  label,
  className,
}: {
  kind: BadgeKind;
  lang?: Lang;
  label?: string;
  className?: string;
}) {
  const Icon = BADGE_ICON[kind];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold tracking-tight',
        BADGE_CLASS[kind],
        className,
      )}
    >
      <Icon className="h-3 w-3" aria-hidden="true" />
      {label ?? BADGE_LABELS[kind][lang]}
    </span>
  );
}

/** Üst sabit pazarlama navigasyonu (geri + etiket + CTA). */
export function MarketingNav({
  label,
  ctaLabel,
  ctaHref,
  backLabel = 'Geri',
}: {
  label: string;
  ctaLabel: string;
  ctaHref: string;
  backLabel?: string;
}) {
  return (
    <header className="fixed top-0 inset-x-0 z-[100] bg-card/80 backdrop-blur-xl border-b border-border pt-[var(--sat)]">
      <div className="container mx-auto px-4 h-12 flex items-center justify-between max-w-5xl">
        <Link
          href="/"
          className="inline-flex items-center rounded-full h-8 px-3 text-[12px] font-medium text-foreground/80 hover:text-foreground"
        >
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> {backLabel}
        </Link>
        <div className="flex items-center gap-4 text-[12px] font-medium text-foreground/80">
          <span className="hidden sm:inline">{label}</span>
          <Button asChild size="sm" className="h-7 rounded-full px-4 text-[11px] font-bold">
            <Link href={ctaHref}>{ctaLabel}</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

export interface AppleAction {
  label: string;
  href: string;
  variant?: 'primary' | 'secondary' | 'link';
  external?: boolean;
}

/**
 * Tam ekran Apple slaytı. Üstte metin (eyebrow + başlık + alt başlık +
 * açıklama + rozetler + aksiyonlar), altta ya görsel ya da serbest içerik.
 */
export function AppleSection({
  eyebrow,
  title,
  subtitle,
  description,
  badges,
  actions,
  image,
  theme = 'light',
  id,
  className,
  children,
  compact,
}: {
  eyebrow?: string;
  /** Compact + children layout'unda başlık SectionHeading içinde yer alır;
   *  o yüzden opsiyonel — corporate/page.tsx gibi karma kullanımlar serbest. */
  title?: React.ReactNode;
  subtitle?: string;
  description?: string;
  badges?: { kind: BadgeKind; label?: string }[];
  actions?: AppleAction[];
  image?: { url: string; hint?: string };
  theme?: 'light' | 'dark';
  id?: string;
  className?: string;
  children?: React.ReactNode;
  /** compact: tam ekran yerine padding'li bölüm (görselsiz içerik blokları için). */
  compact?: boolean;
}) {
  const dark = theme === 'dark';
  return (
    <section
      id={id}
      className={cn(
        'relative flex flex-col items-center text-center overflow-hidden border-b',
        compact ? 'pt-20 pb-16' : 'min-h-screen pt-24',
        dark ? 'bg-black text-white border-white/10' : 'bg-white text-[#1d1d1f] border-black/5',
        className,
      )}
    >
      <div className="relative z-10 space-y-5 px-6 max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-1000">
        {eyebrow && (
          <p className={cn('text-sm font-bold uppercase tracking-[0.2em]', 'text-primary')}>{eyebrow}</p>
        )}
        {badges && badges.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-2">
            {badges.map((b, i) => (
              <AppleBadge key={i} kind={b.kind} label={b.label} />
            ))}
          </div>
        )}
        <h2 className="text-3xl sm:text-4xl md:text-6xl font-bold tracking-tight leading-[1.05]">{title}</h2>
        {subtitle && <p className="text-xl md:text-2xl font-medium opacity-90">{subtitle}</p>}
        {description && (
          <p className="text-base md:text-lg opacity-70 max-w-2xl mx-auto leading-relaxed">{description}</p>
        )}
        {actions && actions.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {actions.map((a, i) =>
              a.variant === 'primary' ? (
                <Button key={i} asChild size="lg" className="h-12 rounded-full px-8 font-bold shadow-xl shadow-primary/20">
                  <Link href={a.href} target={a.external ? '_blank' : undefined} rel={a.external ? 'noopener noreferrer' : undefined}>
                    {a.label}
                  </Link>
                </Button>
              ) : a.variant === 'secondary' ? (
                <Button
                  key={i}
                  asChild
                  size="lg"
                  variant="outline"
                  className={cn('h-12 rounded-full px-6 font-bold', dark ? 'border-white/20 text-white bg-transparent hover:bg-white hover:text-black' : 'border-black/10')}
                >
                  <Link href={a.href} target={a.external ? '_blank' : undefined} rel={a.external ? 'noopener noreferrer' : undefined}>
                    {a.label}
                  </Link>
                </Button>
              ) : (
                <Link
                  key={i}
                  href={a.href}
                  target={a.external ? '_blank' : undefined}
                  rel={a.external ? 'noopener noreferrer' : undefined}
                  className="text-primary hover:underline flex items-center text-lg font-medium"
                >
                  {a.label} <ChevronRight className="h-5 w-5 ml-0.5" />
                </Link>
              ),
            )}
          </div>
        )}
      </div>

      {image && !children && (
        <div className="relative w-full flex-1 flex items-end justify-center mt-12 px-4 max-w-6xl mx-auto">
          <div className="relative w-full aspect-[16/10] md:aspect-[21/9] rounded-t-[3rem] overflow-hidden shadow-[0_-20px_50px_-12px_rgba(0,0,0,0.12)]">
            <Image src={image.url} alt={typeof title === 'string' ? title : ''} fill className="object-cover" data-ai-hint={image.hint} />
          </div>
        </div>
      )}

      {children && <div className="relative z-10 w-full mt-12">{children}</div>}
    </section>
  );
}

export interface FeatureItem {
  icon?: React.ElementType;
  title: string;
  description: string;
  badge?: { kind: BadgeKind; label?: string };
}

/** Özellik kartları ızgarası — her kart isteğe bağlı ikon + durum rozeti taşır. */
export function FeatureGrid({
  items,
  columns = 3,
  theme = 'light',
}: {
  items: FeatureItem[];
  columns?: 2 | 3 | 4;
  theme?: 'light' | 'dark';
}) {
  const dark = theme === 'dark';
  const cols = columns === 2 ? 'sm:grid-cols-2' : columns === 4 ? 'sm:grid-cols-2 lg:grid-cols-4' : 'sm:grid-cols-2 lg:grid-cols-3';
  return (
    <div className={cn('mx-auto max-w-6xl px-6 grid gap-5', cols)}>
      {items.map((it, i) => {
        const Icon = it.icon;
        return (
          <div
            key={i}
            className={cn(
              'rounded-3xl p-6 text-left border transition-shadow hover:shadow-lg',
              dark ? 'bg-white/[0.04] border-white/10' : 'bg-white border-black/5 shadow-sm',
            )}
          >
            <div className="mb-4 flex items-center justify-between gap-2">
              {Icon ? (
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
                </div>
              ) : (
                <span />
              )}
              {it.badge && <AppleBadge kind={it.badge.kind} label={it.badge.label} />}
            </div>
            <h3 className="text-lg font-bold mb-1.5 tracking-tight">{it.title}</h3>
            <p className={cn('text-sm leading-relaxed', dark ? 'text-white/60' : 'text-muted-foreground')}>{it.description}</p>
          </div>
        );
      })}
    </div>
  );
}

/** İsim vermeden kıyas notu — "Dünyada benzerleri var; hangel'de …" tonunda. */
export function CompareNote({ children, theme = 'light' }: { children: React.ReactNode; theme?: 'light' | 'dark' }) {
  const dark = theme === 'dark';
  return (
    <div
      className={cn(
        'mx-auto max-w-3xl px-6 mt-10 rounded-3xl border p-6 text-center',
        dark ? 'bg-white/[0.04] border-white/10 text-white/80' : 'bg-primary/[0.04] border-primary/10 text-[#1d1d1f]/80',
      )}
    >
      <p className="text-sm md:text-base leading-relaxed flex items-center justify-center gap-2 flex-wrap">
        <Sparkles className="h-4 w-4 text-primary shrink-0" aria-hidden="true" />
        {children}
      </p>
    </div>
  );
}

/** Bölüm başlığı (ızgaralardan önce). */
export function SectionHeading({
  eyebrow,
  title,
  description,
  theme = 'light',
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  theme?: 'light' | 'dark';
}) {
  const dark = theme === 'dark';
  return (
    <div className="text-center mb-12 px-6">
      {eyebrow && <p className="text-sm font-bold uppercase tracking-[0.2em] text-primary mb-3">{eyebrow}</p>}
      <h2 className="text-3xl md:text-5xl font-bold tracking-tight">{title}</h2>
      {description && (
        <p className={cn('mt-4 text-base md:text-lg max-w-2xl mx-auto leading-relaxed', dark ? 'text-white/60' : 'text-muted-foreground')}>
          {description}
        </p>
      )}
    </div>
  );
}
