'use client';

import React from 'react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Heart, Users, ShieldCheck, Network, Tag } from 'lucide-react';
import { cn } from '@/lib/utils';
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
        'p-3 transition-colors hover:bg-accent/40 cursor-pointer',
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <Avatar className="h-12 w-12 border shrink-0">
          <AvatarImage src={ngo.avatarUrl} alt={ngo.name} />
          <AvatarFallback>{ngo.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0 space-y-1.5">
          {/* Ad + kısa ad */}
          <div className="flex items-baseline flex-wrap gap-1.5">
            <p className="font-bold text-sm leading-tight">{ngo.name}</p>
            {shortName && <span className="text-xs text-muted-foreground font-medium">({shortName})</span>}
          </div>

          {/* Kategori */}
          {ngo.category && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Tag className="h-3 w-3 shrink-0" />
              <span className="truncate">{ngo.category}</span>
            </p>
          )}

          {/* Şeffaflık | Bağışçı | Gönüllü */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
            <span className="flex items-center gap-1 font-medium" title="Şeffaflık endeksi">
              <ShieldCheck className="h-3 w-3 text-primary/80" />
              <span>Şeffaflık <span className="font-bold">%{transparency}</span></span>
            </span>
            <span className="flex items-center gap-1 font-medium" title="Bağışçı sayısı">
              <Heart className="h-3 w-3 text-rose-500" />
              <span>Bağışçı <span className="font-bold">{donors.toLocaleString('tr-TR')}</span></span>
            </span>
            <span className="flex items-center gap-1 font-medium" title="Gönüllü sayısı">
              <Users className="h-3 w-3 text-emerald-600" />
              <span>Gönüllü <span className="font-bold">{volunteers.toLocaleString('tr-TR')}</span></span>
            </span>
          </div>

          {/* Platformlar (varsa hepsi) */}
          {platforms.length > 0 && (
            <div className="flex flex-wrap items-center gap-1 pt-0.5">
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
        </div>
        {rightSlot && <div className="shrink-0 pt-1">{rightSlot}</div>}
      </div>
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
