'use client';

import React, { useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Globe } from 'lucide-react';
import { neighborhoodsData } from '@/lib/data';
import { Country, State, City } from 'country-state-city';

export type LocationValue = {
  country?: string;
  city?: string;
  district?: string;
  neighborhood?: string;
};

type Props = {
  value: LocationValue;
  onChange: (next: LocationValue) => void;
  showCountry?: boolean;
  showNeighborhood?: boolean;
  labelCountry?: string;
  labelCity?: string;
  labelDistrict?: string;
  labelNeighborhood?: string;
  required?: boolean;
  className?: string;
};

// Paylaşılan ülke/il/ilçe/mahalle dropdown grubu. TR için neighborhoodsData
// (il→ilçe→mahalle), diğer ülkeler için country-state-city. Cascading:
// country değişince city/district/neighborhood reset; city değişince
// district/neighborhood reset; district değişince neighborhood reset.
export function LocationFields({
  value,
  onChange,
  showCountry = true,
  showNeighborhood = true,
  labelCountry = 'Ülke',
  labelCity,
  labelDistrict,
  labelNeighborhood = 'Mahalle',
  required = false,
  className = '',
}: Props) {
  const currentCountry = value.country || 'Türkiye';
  const currentCity = value.city || '';
  const currentDistrict = value.district || '';
  const currentNeighborhood = value.neighborhood || '';
  const isTurkey = currentCountry === 'Türkiye' || currentCountry === 'Turkey' || currentCountry === 'TR';

  const countryOptions = useMemo(() => {
    const rest = Country.getAllCountries()
      .map(c => ({ name: c.name, code: c.isoCode }))
      .filter(c => c.name !== 'Turkey' && c.name !== 'Cyprus')
      .sort((a, b) => a.name.localeCompare(b.name));
    return [
      { name: 'Türkiye', code: 'TR' },
      { name: 'KKTC (Kuzey Kıbrıs)', code: 'CY-KKTC' },
      ...rest,
    ];
  }, []);

  const countryISO = useMemo(() => {
    if (!currentCountry) return null;
    if (isTurkey) return 'TR';
    return Country.getAllCountries().find(c => c.name === currentCountry || c.isoCode === currentCountry)?.isoCode || null;
  }, [currentCountry, isTurkey]);

  const cityOptions = useMemo<string[]>(() => {
    if (isTurkey) {
      return Object.keys(neighborhoodsData).sort((a, b) => a.localeCompare(b, 'tr'));
    }
    if (!countryISO) return [];
    const states = State.getStatesOfCountry(countryISO).map(s => s.name);
    if (states.length > 0) return states.sort((a, b) => a.localeCompare(b));
    return City.getCitiesOfCountry(countryISO)?.map(c => c.name).sort((a, b) => a.localeCompare(b)) || [];
  }, [isTurkey, countryISO]);

  const districtOptions = useMemo<string[]>(() => {
    if (isTurkey) {
      if (!currentCity || !neighborhoodsData[currentCity]) return [];
      return Object.keys(neighborhoodsData[currentCity]).sort((a, b) => a.localeCompare(b, 'tr'));
    }
    if (!countryISO) return [];
    const stateObj = State.getStatesOfCountry(countryISO).find(s => s.name === currentCity);
    if (!stateObj) return [];
    return City.getCitiesOfState(countryISO, stateObj.isoCode)?.map(c => c.name).sort((a, b) => a.localeCompare(b)) || [];
  }, [isTurkey, countryISO, currentCity]);

  const neighborhoodOptions = useMemo<string[]>(() => {
    if (!isTurkey) return [];
    if (!currentCity || !currentDistrict) return [];
    const list = neighborhoodsData[currentCity]?.[currentDistrict];
    if (!list) return [];
    return list.slice().sort((a, b) => a.localeCompare(b, 'tr'));
  }, [isTurkey, currentCity, currentDistrict]);

  const cityLabel = labelCity ?? (isTurkey ? 'İl' : 'Şehir');
  const districtLabel = labelDistrict ?? (isTurkey ? 'İlçe' : 'Bölge');

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
      {showCountry && (
        <div className="space-y-2 md:col-span-2 lg:col-span-4">
          <Label className="flex items-center gap-2"><Globe className="h-4 w-4" /> {labelCountry}{required && ' *'}</Label>
          <Select
            value={currentCountry || 'Türkiye'}
            onValueChange={(val) => onChange({ country: val, city: '', district: '', neighborhood: '' })}
          >
            <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="Türkiye" /></SelectTrigger>
            <SelectContent className="max-h-72">
              {countryOptions.map(c => (
                <SelectItem key={c.code} value={c.name}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-2">
        <Label>{cityLabel}{required && ' *'}</Label>
        {cityOptions.length > 0 ? (
          <Select
            value={currentCity || ''}
            onValueChange={(v) => onChange({ ...value, city: v, district: '', neighborhood: '' })}
          >
            <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder={`${cityLabel} seçin...`} /></SelectTrigger>
            <SelectContent className="max-h-60">{cityOptions.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
        ) : (
          <Input value={currentCity} onChange={(e) => onChange({ ...value, city: e.target.value })} placeholder={cityLabel} className="h-11 rounded-xl" />
        )}
      </div>

      <div className="space-y-2">
        <Label>{districtLabel}{required && ' *'}</Label>
        {isTurkey || districtOptions.length > 0 ? (
          <Select
            value={currentDistrict || ''}
            onValueChange={(v) => onChange({ ...value, district: v, neighborhood: '' })}
            disabled={!currentCity || districtOptions.length === 0}
          >
            <SelectTrigger className="h-11 rounded-xl">
              <SelectValue placeholder={!currentCity ? `Önce ${cityLabel.toLowerCase()} seçin` : `${districtLabel} seçin...`} />
            </SelectTrigger>
            <SelectContent className="max-h-60">{districtOptions.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
          </Select>
        ) : (
          <Input value={currentDistrict} onChange={(e) => onChange({ ...value, district: e.target.value })} placeholder={districtLabel} className="h-11 rounded-xl" />
        )}
      </div>

      {showNeighborhood && (
        <div className="space-y-2">
          <Label>{labelNeighborhood}{required && ' *'}</Label>
          {isTurkey ? (
            <Select
              value={currentNeighborhood || ''}
              onValueChange={(v) => onChange({ ...value, neighborhood: v })}
              disabled={!currentDistrict || neighborhoodOptions.length === 0}
            >
              <SelectTrigger className="h-11 rounded-xl">
                <SelectValue placeholder={!currentDistrict ? 'Önce ilçe seçin' : 'Mahalle seçin...'} />
              </SelectTrigger>
              <SelectContent className="max-h-60">{neighborhoodOptions.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent>
            </Select>
          ) : (
            <Input value={currentNeighborhood} onChange={(e) => onChange({ ...value, neighborhood: e.target.value })} placeholder={labelNeighborhood} className="h-11 rounded-xl" />
          )}
        </div>
      )}
    </div>
  );
}
