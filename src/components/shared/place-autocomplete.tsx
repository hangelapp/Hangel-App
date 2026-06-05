'use client';

import React, { useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { MapPin, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// OpenStreetMap Nominatim ile yer arama (Google Maps API key gerektirmez —
// kod tabanında reverse-geocoding için zaten Nominatim kullanılıyor).
// Kullanıcı adres yazar, MapPin ikonuna tıklar (ya da yazdıkça debounce ile),
// eşleşen yerler ALTTA bir liste olarak çıkar; seçilince adres + il/ilçe + konum
// (lat/lon) otomatik doldurulur. Yeni sekme AÇILMAZ.

interface NominatimAddress {
  road?: string;
  pedestrian?: string;
  neighbourhood?: string;
  suburb?: string;
  quarter?: string;
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  county?: string;
  district?: string;
  city_district?: string;
  province?: string;
  state?: string;
  postcode?: string;
}

interface NominatimItem {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  name?: string;
  address?: NominatimAddress;
}

export interface PlaceSelection {
  address: string;
  display: string;
  city: string;
  district: string;
  lat: string;
  lon: string;
}

function toSelection(item: NominatimItem): PlaceSelection {
  const a = item.address || {};
  const city = a.province || a.state || a.city || a.town || '';
  const district =
    a.county || a.district || a.city_district || a.town || a.municipality || a.suburb || '';
  const street =
    a.road ||
    a.pedestrian ||
    a.neighbourhood ||
    a.quarter ||
    a.suburb ||
    item.name ||
    item.display_name.split(',')[0] ||
    '';
  return {
    address: street.trim(),
    display: item.display_name,
    city: city.trim(),
    district: district.trim(),
    lat: item.lat,
    lon: item.lon,
  };
}

export function PlaceAutocomplete({
  value,
  onTextChange,
  onSelect,
  placeholder = 'Adres / mekan adı yazın (örn. Sancar Maruflu Yerleşkesi)',
  inputClassName,
}: {
  value: string;
  onTextChange: (text: string) => void;
  onSelect: (sel: PlaceSelection) => void;
  placeholder?: string;
  inputClassName?: string;
}) {
  const [results, setResults] = useState<NominatimItem[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [noResult, setNoResult] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runSearch = async (q: string) => {
    const query = q.trim();
    if (query.length < 3) {
      setResults([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    setNoResult(false);
    try {
      const url =
        'https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&countrycodes=tr&accept-language=tr&limit=6&q=' +
        encodeURIComponent(query);
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      const data = (await res.json()) as NominatimItem[];
      const list = Array.isArray(data) ? data : [];
      setResults(list);
      setNoResult(list.length === 0);
      setOpen(true);
    } catch {
      setResults([]);
      setNoResult(true);
      setOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const scheduleSearch = (q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(q), 500);
  };

  const handleSelect = (item: NominatimItem) => {
    onSelect(toSelection(item));
    setOpen(false);
    setResults([]);
  };

  return (
    <div className="relative">
      <div className="flex gap-2">
        <Input
          value={value}
          onChange={(e) => {
            onTextChange(e.target.value);
            scheduleSearch(e.target.value);
          }}
          onFocus={() => {
            if (results.length > 0) setOpen(true);
          }}
          placeholder={placeholder}
          className={cn('flex-1', inputClassName)}
          autoComplete="off"
        />
        <button
          type="button"
          onClick={() => runSearch(value)}
          title="Haritada ara — yazdığın yeri bul"
          aria-label="Haritada ara"
          className="h-10 w-10 shrink-0 rounded-md bg-card border flex items-center justify-center hover:bg-accent transition-colors"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin text-primary" /> : <MapPin className="h-5 w-5 text-primary" />}
        </button>
      </div>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border bg-popover shadow-lg max-h-64 overflow-y-auto">
          {noResult ? (
            <p className="px-3 py-4 text-center text-xs text-muted-foreground">
              Sonuç bulunamadı. Adresi elle de yazabilirsin.
            </p>
          ) : (
            results.map((item) => (
              <button
                key={item.place_id}
                type="button"
                onClick={() => handleSelect(item)}
                className="w-full text-left px-3 py-2 text-sm hover:bg-muted border-b last:border-b-0 flex items-start gap-2"
              >
                <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <span className="leading-tight">{item.display_name}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
