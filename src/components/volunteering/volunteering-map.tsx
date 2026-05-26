'use client';

import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Link from 'next/link';
import { lookupCityCoords } from '@/lib/turkey-city-coords';
import type { Volunteering } from '@/lib/types';

function fixDefaultIcon() {
  delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
}

type Group = { city: string; coords: [number, number]; items: Volunteering[] };

export function VolunteeringMap({ items }: { items: Volunteering[] }) {
  useEffect(() => { fixDefaultIcon(); }, []);

  const groups: Group[] = useMemo(() => {
    const map = new Map<string, Group>();
    for (const opp of items) {
      const loc = opp.location as (typeof opp.location & { coords?: [number, number] }) | undefined;
      const explicit = loc?.coords;
      const city = loc?.city;
      const coords = (Array.isArray(explicit) && explicit.length === 2)
        ? explicit
        : lookupCityCoords(city);
      if (!coords) continue;
      const key = city || `${coords[0]},${coords[1]}`;
      if (!map.has(key)) map.set(key, { city: city || 'Konum', coords, items: [] });
      map.get(key)!.items.push(opp);
    }
    return Array.from(map.values());
  }, [items]);

  const center: [number, number] = [39.0, 35.0];
  const zoom = 5;

  return (
    <MapContainer center={center} zoom={zoom} scrollWheelZoom style={{ height: '100%', width: '100%' }}>
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
                {group.items.slice(0, 8).map((opp) => (
                  <li key={opp.id}>
                    <Link href={`/volunteering/${opp.id}`} className="text-xs text-primary hover:underline block">
                      {opp.title}
                      {opp.organization && (
                        <span className="text-[10px] text-muted-foreground block">{opp.organization}</span>
                      )}
                    </Link>
                  </li>
                ))}
                {group.items.length > 8 && (
                  <li className="text-[10px] text-muted-foreground">+{group.items.length - 8} ilan daha</li>
                )}
              </ul>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
