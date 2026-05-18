'use client';

import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Link from 'next/link';
import { lookupCityCoords } from '@/lib/turkey-city-coords';
import type { Event } from '@/lib/types';

// Default Leaflet ikon path'i Next.js bundler'ında bozulur — manuel düzeltme.
function fixDefaultIcon() {
  // @ts-ignore
  delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
}

type EventGroup = {
  city: string;
  coords: [number, number];
  events: Event[];
};

export function EventMap({ events }: { events: Event[] }) {
  useEffect(() => { fixDefaultIcon(); }, []);

  // Şehirlere göre grupla, koordinatları çöz
  const groups: EventGroup[] = useMemo(() => {
    const map = new Map<string, EventGroup>();
    for (const ev of events) {
      const loc = ev.location as (typeof ev.location & { coords?: [number, number] }) | undefined;
      const explicit = loc?.coords;
      const city = loc?.city;
      const coords = (Array.isArray(explicit) && explicit.length === 2)
        ? explicit
        : lookupCityCoords(city);
      if (!coords) continue;
      const key = city || `${coords[0]},${coords[1]}`;
      if (!map.has(key)) {
        map.set(key, { city: city || 'Konum', coords, events: [] });
      }
      map.get(key)!.events.push(ev);
    }
    return Array.from(map.values());
  }, [events]);

  // Tüm noktaları kapsayan bounds; yoksa Türkiye merkezine zoomla
  const center: [number, number] = [39.0, 35.0];
  const zoom = 5;

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      scrollWheelZoom
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      {groups.map(group => (
        <Marker key={`${group.coords[0]}-${group.coords[1]}-${group.city}`} position={group.coords}>
          <Popup>
            <div className="space-y-2 min-w-[200px]">
              <p className="font-bold text-sm">{group.city}</p>
              <ul className="space-y-1.5">
                {group.events.slice(0, 8).map((ev) => (
                  <li key={ev.id || ev.slug}>
                    <Link
                      href={`/events/${ev.slug || ev.id}`}
                      className="text-xs text-primary hover:underline block"
                    >
                      {ev.name || 'Etkinlik'}
                      {ev.startDate && (
                        <span className="text-[10px] text-muted-foreground block">{ev.startDate}</span>
                      )}
                    </Link>
                  </li>
                ))}
                {group.events.length > 8 && (
                  <li className="text-[10px] text-muted-foreground">+{group.events.length - 8} etkinlik daha</li>
                )}
              </ul>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
