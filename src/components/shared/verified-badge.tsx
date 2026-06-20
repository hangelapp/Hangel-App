'use client';

/**
 * VerifiedBadge — doğrulanmış (evrakları onaylı) kuruluş için coral onay tiki.
 * X/Instagram mavi tiki gibi ama hangel rengi (coral). İsim yanında gösterilir.
 *
 * Kullanım: {isVerifiedOrg(ngo) && <VerifiedBadge />}
 */

import React from 'react';
import { BadgeCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

const CORAL = '#f34723';

export function VerifiedBadge({ size = 16, className, title = 'Doğrulanmış kuruluş' }: { size?: number; className?: string; title?: string }) {
  return (
    <BadgeCheck
      width={size}
      height={size}
      fill={CORAL}
      strokeWidth={2.25}
      aria-label={title}
      role="img"
      className={cn('inline-block shrink-0 align-text-bottom text-white', className)}
    />
  );
}

/** Bir kuruluş "doğrulanmış" sayılır mı? (evrak onaylı / status Onaylandı / verified) */
export function isVerifiedOrg(org: Record<string, unknown> | null | undefined): boolean {
  if (!org) return false;
  if (org.status === 'taslak') return false;
  return org.verified === true || org.documentsComplete === true || org.status === 'Onaylandı';
}
