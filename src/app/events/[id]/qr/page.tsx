'use client';

/**
 * /events/[id]/qr — Etkinlik "sunum ekranı".
 *
 * Katılımcılara projeksiyon/TV'de gösterilmek için tam sayfa QR ekranı.
 * Apple keynote estetiği: bol boşluk, sistem fontu, tek odak. hangel arka planda;
 * DÜZENLEYEN KURUM (logo + ad) ön planda. Afiş + tarih/saat/yer + QR + kolay kod.
 *
 * Kayıt iki yolla: (1) QR'ı kamerayla okut, (2) hangel.org/kod'a git + kodu gir.
 * Kod = plaka+ay+gün (plate-codes.ts, eventJoinCode).
 */

import React, { useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { collection, query, where, limit, doc } from 'firebase/firestore';
import { useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { COLLECTIONS } from '@/firebase/collections';
import { format, parse } from 'date-fns';
import { tr } from 'date-fns/locale';
import { eventJoinCode } from '@/lib/plate-codes';
import { X, Loader2, Smartphone, KeyRound } from 'lucide-react';
import './qr-screen.css';

interface EventLite {
  name?: string;
  slug?: string;
  organizer?: string;
  organizerLogoUrl?: string;
  eventLogoUrl?: string;
  startDate?: string;
  endDate?: string;
  imageUrl?: string;
  location?: { address?: string; city?: string; district?: string } | string;
}

function formatDateLong(startDate?: string): { date: string; time: string } {
  if (!startDate) return { date: '', time: '' };
  try {
    let d = parse(startDate, 'yyyy-MM-dd HH:mm', new Date());
    const hasTime = !isNaN(d.getTime());
    if (!hasTime) d = parse(startDate, 'yyyy-MM-dd', new Date());
    if (isNaN(d.getTime())) return { date: startDate, time: '' };
    return {
      date: format(d, 'd MMMM yyyy · EEEE', { locale: tr }),
      time: hasTime ? format(d, 'HH:mm', { locale: tr }) : '',
    };
  } catch {
    return { date: startDate, time: '' };
  }
}

export default function EventQrScreenPage() {
  const params = useParams();
  const slug = params?.id as string;
  const db = useFirestore();

  const bySlugRef = useMemoFirebase(
    () => (db && slug ? query(collection(db, COLLECTIONS.events), where('slug', '==', slug), limit(1)) : null),
    [db, slug],
  );
  const { data: bySlug, isLoading: l1 } = useCollection<EventLite>(bySlugRef);
  const byIdRef = useMemoFirebase(
    () => (db && slug ? doc(db, COLLECTIONS.events, slug) : null),
    [db, slug],
  );
  const { data: byId, isLoading: l2 } = useDoc<EventLite>(byIdRef);
  const event = (bySlug && bySlug[0]) || byId || null;
  const loading = l1 || l2;

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://hangel.org';
  const eventUrl = `${origin}/events/${event?.slug || slug}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&margin=0&data=${encodeURIComponent(eventUrl)}`;

  const loc = typeof event?.location === 'object' && event?.location ? event.location : null;
  const city = loc?.city;
  const address = loc?.address || [loc?.district, loc?.city].filter(Boolean).join(', ')
    || (typeof event?.location === 'string' ? event.location : '');

  const { date, time } = useMemo(() => formatDateLong(event?.startDate), [event?.startDate]);
  const code = useMemo(() => eventJoinCode(city, event?.startDate), [city, event?.startDate]);

  const organizerName = event?.organizer || '';
  const organizerLogo = event?.organizerLogoUrl || event?.eventLogoUrl || '';
  const poster = event?.imageUrl || '';

  if (loading) {
    return (
      <div className="qrs-stage qrs-center">
        <Loader2 className="qrs-spin" />
      </div>
    );
  }
  if (!event) {
    return (
      <div className="qrs-stage qrs-center">
        <p className="qrs-notfound">Etkinlik bulunamadı.</p>
        <Link href="/events" className="qrs-back-link">Etkinliklere dön</Link>
      </div>
    );
  }

  return (
    <div className="qrs-stage">
      {/* Kapat — köşede ince, sunumdayken göze batmaz */}
      <Link href={`/events/${event.slug || slug}`} className="qrs-close" aria-label="Kapat">
        <X strokeWidth={1.6} />
      </Link>

      {/* ÜST: düzenleyen kurum ön planda (logo + ad) */}
      <header className="qrs-organizer">
        {organizerLogo ? (
          <span className="qrs-logo-wrap">
            <Image src={organizerLogo} alt={organizerName || 'Düzenleyen'} width={72} height={72} className="qrs-logo" unoptimized />
          </span>
        ) : null}
        {organizerName ? <span className="qrs-org-name">{organizerName}</span> : null}
      </header>

      {/* ORTA: iki kolon — solda afiş + bilgiler, sağda QR + kod */}
      <main className="qrs-main">
        <section className="qrs-info">
          {poster ? (
            <div className="qrs-poster">
              <Image src={poster} alt={event.name || 'Afiş'} width={520} height={720} className="qrs-poster-img" unoptimized />
            </div>
          ) : null}
          <div className="qrs-info-text">
            <h1 className="qrs-title">{event.name}</h1>
            <dl className="qrs-meta">
              {date ? (
                <div className="qrs-meta-row">
                  <dt>Tarih</dt>
                  <dd>{date}{time ? <span className="qrs-time"> · {time}</span> : null}</dd>
                </div>
              ) : null}
              {address ? (
                <div className="qrs-meta-row">
                  <dt>Yer</dt>
                  <dd>{address}</dd>
                </div>
              ) : null}
            </dl>
          </div>
        </section>

        <section className="qrs-access">
          <div className="qrs-qr-card">
            <img src={qrUrl} alt="Kayıt QR kodu" className="qrs-qr-img" width={340} height={340} />
          </div>

          <div className="qrs-methods">
            <div className="qrs-method">
              <Smartphone strokeWidth={1.6} className="qrs-method-icon" />
              <div>
                <p className="qrs-method-title">Kameranla okut</p>
                <p className="qrs-method-sub">Kayıt sayfası anında açılır</p>
              </div>
            </div>

            {code ? (
              <>
                <div className="qrs-or"><span>veya</span></div>
                <div className="qrs-method">
                  <KeyRound strokeWidth={1.6} className="qrs-method-icon" />
                  <div>
                    <p className="qrs-method-title">
                      <span className="qrs-code-host">hangel.org/kod</span>
                    </p>
                    <p className="qrs-method-sub">adresine bu kodu gir</p>
                  </div>
                </div>
                <div className="qrs-code" aria-label={`Kayıt kodu ${code}`}>
                  {code.split('').map((c, i) => (
                    <span key={i} className="qrs-code-digit">{c}</span>
                  ))}
                </div>
              </>
            ) : null}
          </div>
        </section>
      </main>

      {/* ALT: hangel arka planda, ince imza */}
      <footer className="qrs-footer">
        <span className="qrs-by">hangel<span className="qrs-by-dot">.</span>org üzerinden</span>
      </footer>
    </div>
  );
}
