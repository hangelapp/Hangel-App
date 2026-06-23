'use client';

import React from 'react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Heart, Users, ShieldCheck, Network } from 'lucide-react';
import { cn } from '@/lib/utils';
import { VerifiedBadge, isVerifiedOrg } from '@/components/shared/verified-badge';
import type { NGO } from '@/lib/types';

/**
 * Standartlaşmış STK liste kartı — tüm STK listelerinde aynı görünüm.
 *
 * Format (kullanıcı talebi):
 *   - Logo + ADI (+ kısa adı parantezde)
 *   - Kategori (tek satır)
 *   - Şeffaflık %X | Bağışçı X | Gönüllü X (label'lı)
 *   - Platformlar (memberOf — varsa hepsi badge olarak)
 *
 * Klikleme davranışı:
 *   - `href` verilirse <Link> ile sarılır (default: /ngos/<id>)
 *   - `href={null}` verilirse sadece statik kart (tıklanmaz)
 *   - `onClick` verilirse tıklamada custom handler (örn. seçim)
 */
export interface NgoListItemProps {
  ngo: NGO;
  /** Default: `/ngos/<id>`. null → statik kart. */
  href?: string | null;
  /** Ek tıklama callback (örn. Seç). */
  onClick?: (ngo: NGO) => void;
  /** Sağ tarafa eklenecek aksiyon (örn. seçim daire ikonu, "İncele" buton). */
  rightSlot?: React.ReactNode;
  /** Kart üstüne ek class (örn. seçili görsel) */
  className?: string;
}

export function NgoListItem({ ngo, href, onClick, rightSlot, className }: NgoListItemProps) {
  const donors = ngo.stats?.donors ?? 0;
  const volunteers = ngo.stats?.volunteers ?? 0;
  const transparency = ngo.transparencyScore ?? 0;
  const platforms = (ngo.memberOf ?? []).filter(Boolean);
  const shortName = ngo.shortName?.trim();

  const card = (
    <Card
      className={cn(
        'p-4 transition-all duration-200 hover:shadow-glass-soft hover:-translate-y-0.5 active:translate-y-0',
        className,
      )}
    >
      {/* Üst blok: Logo + Ad/kategori + rightSlot */}
      <div className="flex items-start gap-3.5">
        <Avatar className="h-14 w-14 rounded-2xl border border-border/60 shrink-0">
          <AvatarImage src={ngo.avatarUrl} alt={ngo.name} className="rounded-2xl" />
          <AvatarFallback className="rounded-2xl bg-secondary text-base font-semibold">
            {ngo.name.charAt(0)}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-semibold text-[15px] leading-snug text-foreground flex min-w-0 items-center gap-1.5">
                <span className="break-words">{ngo.name}</span>
                {isVerifiedOrg(ngo as unknown as Record<string, unknown>) && <VerifiedBadge size={15} />}
              </h3>
              {shortName && (
                <p className="text-xs text-muted-foreground font-medium mt-0.5 break-words">{shortName}</p>
              )}
            </div>
            {rightSlot && <div className="shrink-0">{rightSlot}</div>}
          </div>

          {ngo.category && (
            <span className="inline-flex mt-2 items-center rounded-full bg-secondary/70 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
              {ngo.category}
            </span>
          )}
        </div>
      </div>

      {/* İstatistik satırı: Şeffaflık · Bağışçı · Gönüllü */}
      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="flex flex-col items-center justify-center rounded-2xl bg-secondary/40 py-2.5 px-1">
          <ShieldCheck className="h-4 w-4 text-primary mb-1" />
          <span className="text-sm font-bold leading-none text-foreground">%{transparency}</span>
          <span className="text-[10px] text-muted-foreground font-medium mt-1">Şeffaflık</span>
        </div>
        <div className="flex flex-col items-center justify-center rounded-2xl bg-secondary/40 py-2.5 px-1">
          <Heart className="h-4 w-4 text-rose-500 mb-1" />
          <span className="text-sm font-bold leading-none text-foreground">{donors.toLocaleString('tr-TR')}</span>
          <span className="text-[10px] text-muted-foreground font-medium mt-1">Bağışçı</span>
        </div>
        <div className="flex flex-col items-center justify-center rounded-2xl bg-secondary/40 py-2.5 px-1">
          <Users className="h-4 w-4 text-emerald-600 mb-1" />
          <span className="text-sm font-bold leading-none text-foreground">{volunteers.toLocaleString('tr-TR')}</span>
          <span className="text-[10px] text-muted-foreground font-medium mt-1">Gönüllü</span>
        </div>
      </div>

      {/* Platformlar */}
      {platforms.length > 0 && (
        <div className="mt-3.5 flex flex-wrap items-center gap-1.5 border-t border-border/40 pt-3">
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground font-medium shrink-0">
            <Network className="h-3.5 w-3.5" /> Platform
          </span>
          {platforms.map(p => (
            <Badge key={p} variant="secondary" className="rounded-full text-[10px] px-2 py-0.5 font-medium">
              {p}
            </Badge>
          ))}
        </div>
      )}
    </Card>
  );

  // Link davranışı: href null → statik; onClick varsa div wrapper; aksi href Link.
  if (onClick && !href) {
    return (
      <button
        type="button"
        onClick={() => onClick(ngo)}
        className="block w-full text-left"
      >
        {card}
      </button>
    );
  }
  if (href === null) {
    return card;
  }
  return (
    <Link href={href ?? `/ngos/${ngo.id}`} className="block">
      {card}
    </Link>
  );
}
