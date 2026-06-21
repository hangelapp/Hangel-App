'use client';

import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

/**
 * Etki Haritası — kullanıcının iz bıraktığı şehirleri yoğunluğa göre coral
 * tonlarında bir ısı-noktası (heat-dot) olarak gösterir. Leaflet tabanlı; proje
 * genelinde (event-map / volunteering-map) kullanılan react-leaflet yaklaşımının
 * aynısıdır, ancak Marker yerine yoğunluğa göre ölçeklenen CircleMarker kullanır.
 */

export type CityImpact = {
  city: string;
  coords: [number, number];
  /** Toplam katkı sayısı (etkinlik + gönüllülük + bağış) — nokta boyut/renk skalası. */
  total: number;
  events: number;
  volunteering: number;
  donations: number;
};

// Coral yoğunluk skalası (#f34723 ana vurgu). 0 → en açık, 1 → en koyu.
function coralScale(t: number): string {
  // Açık şeftaliden derin corale doğru.
  const stops: Array<[number, [number, number, number]]> = [
    [0, [255, 214, 200]],
    [0.5, [248, 144, 104]],
    [1, [196, 48, 18]],
  ];
  const clamped = Math.max(0, Math.min(1, t));
  let lo = stops[0];
  let hi = stops[stops.length - 1];
  for (let i = 0; i < stops.length - 1; i++) {
    if (clamped >= stops[i][0] && clamped <= stops[i + 1][0]) {
      lo = stops[i];
      hi = stops[i + 1];
      break;
    }
  }
  const span = hi[0] - lo[0] || 1;
  const k = (clamped - lo[0]) / span;
  const ch = (a: number, b: number) => Math.round(a + (b - a) * k);
  const [r, g, b] = [ch(lo[1][0], hi[1][0]), ch(lo[1][1], hi[1][1]), ch(lo[1][2], hi[1][2])];
  return `rgb(${r}, ${g}, ${b})`;
}

export function ImpactMap({
  cities,
  selectedCity,
  onSelectCity,
}: {
  cities: CityImpact[];
  selectedCity?: string | null;
  onSelectCity?: (city: string) => void;
}) {
  // Leaflet bazı sürümlerde retina marker path'lerini bozar; CircleMarker kullandığımız
  // için ikon gerekmiyor ama default ikon path uyarısını sustur (diğer haritalarla tutarlı).
  useEffect(() => {
    // Leaflet default ikon path düzeltmesi (proje genel deseni; CircleMarker
    // ikon kullanmaz ama Leaflet init uyarısını sustururuz).
    delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });
  }, []);

  const maxTotal = useMemo(
    () => cities.reduce((m, c) => Math.max(m, c.total), 0) || 1,
    [cities],
  );

  // Türkiye merkezli, ferah görünüm.
  const center: [number, number] = [39.2, 35.2];
  const zoom = 5;

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      scrollWheelZoom
      style={{ height: '100%', width: '100%', background: '#f7f5f2' }}
    >
      <TileLayer
        // Sade, açık tonlu Apple-temiz altlık (CartoDB Positron).
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
      />
      {cities.map((c) => {
        const intensity = c.total / maxTotal;
        // Yoğunluğa göre 8 → 30px yarıçap.
        const radius = 8 + Math.round(intensity * 22);
        const fill = coralScale(intensity);
        const isSelected = selectedCity === c.city;
        return (
          <CircleMarker
            key={c.city}
            center={c.coords}
            radius={radius}
            pathOptions={{
              color: isSelected ? '#f34723' : '#ffffff',
              weight: isSelected ? 3 : 1.5,
              fillColor: fill,
              fillOpacity: 0.78,
            }}
            eventHandlers={{
              click: () => onSelectCity?.(c.city),
            }}
          >
            <Tooltip direction="top" offset={[0, -radius]} opacity={1}>
              <div className="text-center">
                <p className="text-sm font-bold text-foreground">{c.city}</p>
                <p className="text-xs text-muted-foreground">{c.total} katkı</p>
              </div>
            </Tooltip>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
