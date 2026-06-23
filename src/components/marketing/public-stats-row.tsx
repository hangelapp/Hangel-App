'use client';

import { useEffect, useState } from 'react';

interface StatItem {
  key: 'users' | 'ngos' | 'brands' | 'donationVolume';
  label: string;
  format: (n: number) => string;
}

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M+`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}K+`;
  return String(n);
}

function formatCurrency(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M ₺`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K ₺`;
  return `${n} ₺`;
}

interface PublicStatsRowProps {
  items: StatItem[];
  /** Renk + tipografi tema override için */
  numberClassName?: string;
  labelClassName?: string;
  containerClassName?: string;
}

/**
 * /api/public/stats'tan gerçek rakamları çeker. Sadece > 0 olanları gösterir.
 * Tüm değerler 0 ise component hiç render etmez (section gizlenir).
 */
export function PublicStatsRow({
  items,
  numberClassName = 'text-4xl sm:text-6xl font-black tracking-tighter text-primary',
  labelClassName = 'text-[10px] font-black uppercase tracking-widest text-muted-foreground',
  containerClassName = 'grid grid-cols-2 md:grid-cols-4 gap-x-12 gap-y-16',
}: PublicStatsRowProps) {
  const [stats, setStats] = useState<Record<string, number> | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/public/stats')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (!cancelled && data) setStats(data); })
      .catch(() => { /* sessiz */ });
    return () => { cancelled = true; };
  }, []);

  if (!stats) return null;

  const visible = items.filter((item) => (stats[item.key] ?? 0) > 0);
  if (visible.length === 0) return null;

  return (
    <div className={containerClassName}>
      {visible.map((item) => (
        <div key={item.key} className="space-y-2">
          <p className={numberClassName}>{item.format(stats[item.key])}</p>
          <p className={labelClassName}>{item.label}</p>
        </div>
      ))}
    </div>
  );
}

export const STAT_FORMATTERS = {
  count: formatCompact,
  currency: formatCurrency,
};
