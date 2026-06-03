'use client';

/**
 * ContractBanner — Üst gradient banner: başlık + jurisdiction + version +
 * effective date + status pill (+ opsiyonel compliance rozeti). Liquid Glass
 * over primary gradient.
 */

import { CalendarDays, ShieldCheck, ScrollText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ContractBannerProps {
  title: string;
  /** Üstte tip etiketi (örn. "Kullanıcı Sözleşmesi" / "Privacy Policy"). */
  eyebrow?: string;
  /** Jurisdiction label — örn. "Türkiye (KVKK)". */
  jurisdiction?: string;
  version?: string;
  effectiveDate?: string | null;
  lastUpdated?: string | null;
  /** Yayında / Taslak / Arşiv. */
  status?: 'published' | 'draft' | 'archived';
  /** 0-100 — compliance yüzdesi. null/undefined ise badge gösterilmez. */
  compliancePercent?: number | null;
}

function statusPill(status: ContractBannerProps['status']) {
  switch (status) {
    case 'draft':
      return { label: 'Taslak', cls: 'bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200' };
    case 'archived':
      return { label: 'Arşiv', cls: 'bg-muted text-muted-foreground' };
    case 'published':
    default:
      return { label: 'Yayında', cls: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-200' };
  }
}

function complianceTone(pct: number) {
  if (pct >= 85) return 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-200';
  if (pct >= 60) return 'bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200';
  return 'bg-red-100 text-red-900 dark:bg-red-900/40 dark:text-red-200';
}

export function ContractBanner({
  title,
  eyebrow,
  jurisdiction,
  version,
  effectiveDate,
  lastUpdated,
  status = 'published',
  compliancePercent,
}: ContractBannerProps) {
  const pill = statusPill(status);
  const showCompliance = typeof compliancePercent === 'number' && Number.isFinite(compliancePercent);

  return (
    <header
      className={cn(
        'relative overflow-hidden rounded-3xl border border-white/20 print:rounded-none print:border-none',
        'bg-gradient-to-br from-[#f34723] via-[#f86a3d] to-[#ffb38a]',
        'shadow-glass-prominent text-white p-6 sm:p-8'
      )}
    >
      {/* Decorative glow — Apple "depth on color" */}
      <div className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-white/20 blur-3xl print:hidden" />
      <div className="pointer-events-none absolute -bottom-20 -left-10 h-40 w-40 rounded-full bg-white/10 blur-3xl print:hidden" />

      <div className="relative space-y-4">
        {eyebrow && (
          <p className="text-[11px] uppercase tracking-[0.18em] font-medium text-white/80 inline-flex items-center gap-1.5">
            <ScrollText className="h-3.5 w-3.5" /> {eyebrow}
          </p>
        )}
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black font-headline tracking-tight leading-tight">
          {title}
        </h1>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {jurisdiction && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 px-2.5 py-1 font-medium">
              <ShieldCheck className="h-3.5 w-3.5" /> {jurisdiction}
            </span>
          )}
          {version && (
            <span className="inline-flex items-center rounded-full bg-white/15 backdrop-blur-md border border-white/20 px-2.5 py-1 font-mono">
              v{version}
            </span>
          )}
          {effectiveDate && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/20 px-2.5 py-1">
              <CalendarDays className="h-3.5 w-3.5" /> Yürürlük {effectiveDate}
            </span>
          )}
          <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 font-semibold', pill.cls)}>
            {pill.label}
          </span>
          {showCompliance && (
            <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 font-semibold', complianceTone(compliancePercent))}>
              %{Math.round(compliancePercent)} uyumlu
            </span>
          )}
        </div>

        {lastUpdated && (
          <p className="text-[11px] text-white/70">Son güncelleme: {lastUpdated}</p>
        )}
      </div>
    </header>
  );
}
