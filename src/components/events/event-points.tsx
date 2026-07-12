'use client';

/**
 * EventPoints — çok noktalı (multi-location) etkinliklerde tüm katılım
 * noktalarını kart listesi olarak gösterir. Tek konumlu etkinliklerde
 * event.points boş/tanımsız olduğundan hiçbir şey render edilmez.
 *
 * Her nokta kartı: ad + tam adres (ilçe/il) ve aksiyon satırı:
 *  - Katıl → /e/{eventId}/kayit?point={id} (QR kayıt girişi)
 *  - Kayıt QR → LogoQr (nokta atıflı kayıt linki)
 *  - Paylaş → ShareButtons (önceden yazılmış TR metin + WhatsApp/Telegram)
 *  - Yol tarifi → Google Maps (mapsUrl veya lat/lon)
 */

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LogoQr } from '@/components/shared/logo-qr';
import { ShareButtons } from '@/components/shared/share-buttons';
import { MapPin, Navigation, QrCode } from 'lucide-react';
import type { Event as EventType, EventPoint } from '@/lib/types';

/** Nokta için Google Maps yol tarifi linki: önce mapsUrl, yoksa lat/lon. */
function pointMapsUrl(point: EventPoint): string | null {
  if (point.mapsUrl && point.mapsUrl.trim()) return point.mapsUrl.trim();
  if (typeof point.lat === 'number' && typeof point.lon === 'number') {
    return `https://www.google.com/maps/search/?api=1&query=${point.lat},${point.lon}`;
  }
  const q = [point.address, point.district, point.city].filter(Boolean).join(', ').trim();
  if (q) return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
  return null;
}

export function EventPoints({ event }: { event: EventType }) {
  const points = event.points;
  if (!points || points.length === 0) return null;

  return (
    <Card className="glass-surface rounded-3xl border-white/40 shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-3">
          <MapPin className="h-5 w-5 text-primary" />
          Katılım Noktaları
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {points.map((point) => {
          const registerUrl = `https://hangel.org/e/${event.id}/kayit?point=${encodeURIComponent(point.id)}`;
          const shareText = `${point.name} noktasında ${event.name} için buluşuyoruz! 🌍🧡 Sen de katıl: ${registerUrl} #hangel`;
          const directions = pointMapsUrl(point);
          const fullAddress = [point.address, [point.district, point.city].filter(Boolean).join(', ')]
            .filter(Boolean)
            .join(' — ');

          return (
            <div
              key={point.id}
              className="rounded-2xl border border-border bg-card p-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
            >
              {/* Nokta bilgisi */}
              <div className="min-w-0 flex-1 space-y-2">
                <p className="font-bold text-foreground break-words leading-snug">{point.name}</p>
                <p className="text-sm text-muted-foreground font-medium break-words leading-relaxed">
                  {fullAddress}
                </p>
                {point.hostNgoName && (
                  <p className="text-xs text-muted-foreground/80 font-medium">
                    Ev sahibi: <span className="font-bold text-foreground/80">{point.hostNgoName}</span>
                  </p>
                )}

                {/* Aksiyon satırı */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <Button
                    asChild
                    size="sm"
                    className="h-10 rounded-xl text-xs font-black shadow-sm shadow-primary/20"
                  >
                    <Link href={`/e/${event.id}/kayit?point=${encodeURIComponent(point.id)}`}>
                      Katıl
                    </Link>
                  </Button>

                  {directions && (
                    <Button
                      asChild
                      size="sm"
                      variant="outline"
                      className="h-10 rounded-xl text-xs font-bold gap-1.5 border-primary/20 text-primary hover:bg-primary/5"
                    >
                      <a href={directions} target="_blank" rel="noopener noreferrer">
                        <Navigation className="h-3.5 w-3.5" /> Yol tarifi
                      </a>
                    </Button>
                  )}

                  <ShareButtons
                    url={registerUrl}
                    title={shareText}
                    qrTitle={`${point.name} — Kayıt QR`}
                    buttonClassName="h-10 w-10"
                  />
                </div>
              </div>

              {/* Kayıt QR — nokta atıflı */}
              <div className="flex flex-col items-center gap-1 shrink-0 self-center sm:self-start">
                <div className="rounded-2xl bg-white p-2 ring-1 ring-black/5">
                  <LogoQr value={registerUrl} size={96} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <QrCode className="h-3 w-3" /> Kayıt QR
                </span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
