'use client';

import React from 'react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Heart, Users, ShieldCheck, Network, Tag } from 'lucide-react';
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
        'p-2 transition-colors hover:bg-accent/40 cursor-pointer',
        className,
      )}
    >
      {/* Satır 1: Ad (+kısa ad) — tam genişlik, ortada rightSlot. */}
      <div className="flex items-start justify-between gap-2 leading-tight">
        <div className="flex items-baseline flex-wrap gap-1.5 min-w-0">
          <p className="font-bold text-sm leading-tight inline-flex items-center gap-1">{ngo.name}{isVerifiedOrg(ngo as unknown as Record<string, unknown>) && <VerifiedBadge size={14} />}</p>
          {shortName && <span className="text-xs text-muted-foreground font-medium">({shortName})</span>}
        </div>
        {rightSlot && <div className="shrink-0">{rightSlot}</div>}
      </div>

      {/* Satır 2: [Logo] Şeffaflık | Bağışçı | Gönüllü | Kategori */}
      <div className="flex items-center gap-2 flex-wrap mt-1">
        <Avatar className="h-9 w-9 border shrink-0">
          <AvatarImage src={ngo.avatarUrl} alt={ngo.name} />
          <AvatarFallback>{ngo.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] flex-1 min-w-0">
          <span className="flex items-center gap-1 font-medium" title="Şeffaflık endeksi">
            <ShieldCheck className="h-3 w-3 text-primary/80" />
            <span>Şeffaflık: <span className="font-bold">%{transparency}</span></span>
          </span>
          <span className="text-muted-foreground/40">|</span>
          <span className="flex items-center gap-1 font-medium" title="Bağışçı sayısı">
            <Heart className="h-3 w-3 text-rose-500" />
            <span>Bağışçı: <span className="font-bold">{donors.toLocaleString('tr-TR')}</span></span>
          </span>
          <span className="text-muted-foreground/40">|</span>
          <span className="flex items-center gap-1 font-medium" title="Gönüllü sayısı">
            <Users className="h-3 w-3 text-emerald-600" />
            <span>Gönüllü: <span className="font-bold">{volunteers.toLocaleString('tr-TR')}</span></span>
          </span>
          {ngo.category && (
            <>
              <span className="text-muted-foreground/40">|</span>
              <span className="flex items-center gap-1 text-muted-foreground font-medium min-w-0" title="Kategori">
                <Tag className="h-3 w-3 shrink-0" />
                <span className="truncate">{ngo.category}</span>
              </span>
            </>
          )}
        </div>
      </div>

      {/* Satır 3: Platformlar */}
      {platforms.length > 0 && (
        <div className="flex flex-wrap items-center gap-1 pt-2 pl-[3.25rem]">
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium shrink-0">
            <Network className="h-3 w-3" /> Platform
          </span>
          {platforms.map(p => (
            <Badge key={p} variant="secondary" className="text-[10px] px-1.5 py-0 font-normal">
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
