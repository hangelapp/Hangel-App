'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';

/**
 * Ayarlar akışında "Sıradaki adım" yönlendirme kartı (iOS Ayarlar satırı
 * estetiği): tonlu ikon karesi + başlık + açıklama + chevron; kartın tamamı
 * tıklanabilir. Akış: profil → eğitim → afet/acil durum → gönüllülük.
 */
export function SettingsNextStep({ href, icon, iconBg, title, description }: {
  href: string;
  icon: ReactNode;
  iconBg: string;
  title: string;
  description?: string;
}) {
  return (
    <Link href={href} className="block group">
      <div className="flex items-center gap-4 rounded-2xl border bg-card p-4 shadow-sm transition-all hover:shadow-md hover:border-primary/30 active:scale-[0.99]">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Sıradaki adım</p>
          <p className="font-bold leading-tight">{title}</p>
          {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
}
