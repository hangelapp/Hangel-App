'use client';

/**
 * VolunteeringCorporateParticipants — onaylanmış kurumsal katılımcıları
 * gönüllülük detay / tanıtım sayfasında türe göre gruplu gösterir.
 *
 * Gruplama sırası: STK'lar → Belediyeler → Valilikler → Markalar → Üniversiteler.
 * Boş gruplar atlanır. Katılımcı yoksa null döner. Her katılımcı: logo (yoksa
 * monogram) + ad; website varsa kart yeni sekmede o siteye link olur.
 * (events/event-participants.tsx ile aynı düzen.)
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Building2 } from 'lucide-react';
import type { CorporateParticipant, CorporateParticipantType } from '@/lib/types';

// Türkçe başlıklar + gösterim sırası.
const GROUPS: { type: CorporateParticipantType; heading: string }[] = [
  { type: 'stk', heading: "Katılımcı STK'lar" },
  { type: 'belediye', heading: 'Belediyeler' },
  { type: 'valilik', heading: 'Valilikler' },
  { type: 'marka', heading: 'Markalar' },
  { type: 'universite', heading: 'Üniversiteler' },
];

function getInitials(name: string) {
  return (
    (name || '')
      .trim()
      .split(/\s+/)
      .map((p) => p[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toLocaleUpperCase('tr') || '?'
  );
}

function ParticipantCard({ p }: { p: CorporateParticipant }) {
  const inner = (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 h-full transition-colors hover:bg-primary/5">
      <Avatar className="h-11 w-11 shrink-0 border bg-white">
        {p.logoUrl && <AvatarImage src={p.logoUrl} alt={p.name} className="object-contain p-0.5" />}
        <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
          {getInitials(p.name)}
        </AvatarFallback>
      </Avatar>
      <p className="min-w-0 flex-1 text-sm font-bold text-foreground break-words leading-snug">
        {p.name}
      </p>
    </div>
  );

  if (p.website && p.website.trim()) {
    return (
      <a href={p.website.trim()} target="_blank" rel="noopener noreferrer" className="block">
        {inner}
      </a>
    );
  }
  return inner;
}

export function VolunteeringCorporateParticipants({
  participants,
}: {
  participants: CorporateParticipant[];
}) {
  if (!participants || participants.length === 0) return null;

  const grouped = GROUPS.map((g) => ({
    ...g,
    items: participants.filter((p) => p.type === g.type),
  })).filter((g) => g.items.length > 0);

  if (grouped.length === 0) return null;

  return (
    <Card className="glass-surface rounded-3xl border-white/40 shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-3">
          <Building2 className="h-5 w-5 text-primary" />
          Katılımcı Kurumlar
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {grouped.map((g) => (
          <div key={g.type} className="space-y-3">
            <p className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground">
              {g.heading}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
              {g.items.map((p) => (
                <ParticipantCard key={p.id} p={p} />
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
