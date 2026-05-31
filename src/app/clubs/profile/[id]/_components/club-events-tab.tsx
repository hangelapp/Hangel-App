'use client';

/**
 * Kulüp profil sayfası "Etkinlikler" sekmesi.
 *
 * Sadece üye olanlar tüm liste görür (user.volunteerInfo.clubMemberships.includes(clubId)).
 * Üye olmayanlar "Üye ol ki etkinlikleri gör" görür.
 */

import React, { useEffect, useState } from 'react';
import { Calendar, MapPin, Loader2, Users2 } from 'lucide-react';
import Link from 'next/link';

import { useUser } from '@/firebase';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ClubEvent {
  id: string;
  title?: string;
  description?: string;
  startDate?: { _seconds: number; _nanoseconds: number } | string | { toDate: () => Date };
  location?: string;
  capacity?: number;
  registeredCount?: number;
  imageUrl?: string;
}

interface Props {
  clubId: string;
}

function formatEventDate(d: ClubEvent['startDate']): string {
  if (!d) return '';
  try {
    let date: Date;
    if (typeof d === 'string') date = new Date(d);
    else if ('_seconds' in d) date = new Date(d._seconds * 1000);
    else if ('toDate' in d) date = d.toDate();
    else return '';
    return date.toLocaleString('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

export function ClubEventsTab({ clubId }: Props) {
  const { user } = useUser();
  const [events, setEvents] = useState<ClubEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [notMember, setNotMember] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const idToken = await user.getIdToken();
        const res = await fetch('/api/users/me/clubs-events', {
          headers: { authorization: `Bearer ${idToken}` },
        });
        const data = await res.json();
        if (data?.message === 'Üye olduğun kulüp yok.') {
          setNotMember(true);
        } else if (data?.ok) {
          const filtered = (data.events ?? []).filter((e: ClubEvent & { clubId?: string }) => e.clubId === clubId);
          setEvents(filtered);
          if (filtered.length === 0 && (data.events?.length ?? 0) > 0) {
            // Üye ama bu kulübe ait etkinlik yok
          } else if (filtered.length === 0) {
            // Bu kulübe üye değil veya hiç etkinlik yok — soft fallback
          }
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [user, clubId]);

  if (loading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  if (notMember) {
    return (
      <Card><CardContent className="pt-6 text-center space-y-3">
        <Users2 className="h-10 w-10 text-muted-foreground mx-auto" />
        <p className="text-sm text-muted-foreground leading-relaxed">
          Bu kulübün etkinliklerini görmek için önce üye olman gerek.
        </p>
        <Button asChild size="sm">
          <Link href="/settings/education">Kulüplere Üye Ol</Link>
        </Button>
      </CardContent></Card>
    );
  }

  if (events.length === 0) {
    return (
      <Card><CardContent className="pt-6 text-center text-sm text-muted-foreground">
        <Calendar className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
        <p>Bu kulübün yaklaşan etkinliği yok.</p>
      </CardContent></Card>
    );
  }

  return (
    <div className="space-y-3">
      {events.map((event) => (
        <Card key={event.id}>
          <CardContent className="pt-4 space-y-2">
            <h3 className="font-bold text-base leading-snug">{event.title}</h3>
            {event.description && <p className="text-xs text-muted-foreground leading-snug line-clamp-2">{event.description}</p>}
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{formatEventDate(event.startDate)}</span>
              {event.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{event.location}</span>}
              {event.capacity != null && (
                <span>{event.registeredCount ?? 0}/{event.capacity}</span>
              )}
            </div>
            <Button asChild size="sm" variant="outline" className="w-full mt-2">
              <Link href={`/events/${event.id}`}>Detay</Link>
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
