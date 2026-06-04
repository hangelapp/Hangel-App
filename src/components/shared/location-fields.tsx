'use client';

import React, { useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Globe, MapPin } from 'lucide-react';
import { neighborhoodsData } from '@/lib/data';
import { Country, State, City } from 'country-state-city';

export type LocationValue = {
  country?: string;
  city?: string;
  district?: string;
  neighborhood?: string;
  // Yeni: serbest metin alanları (opsiyonel — showXxx=true ile aktif olur).
  openAddress?: string;
  doorNo?: string;
  postalCode?: string;
};

type Props = {
  value: LocationValue;
  onChange: (next: LocationValue) => void;
  showCountry?: boolean;
  showNeighborhood?: boolean;
  showOpenAddress?: boolean;
  showDoorNo?: boolean;
  showPostalCode?: boolean;
  labelCountry?: string;
  labelCity?: string;
  labelDistrict?: string;
  labelNeighborhood?: string;
  labelOpenAddress?: string;
  labelDoorNo?: string;
  labelPostalCode?: string;
  required?: boolean;
  className?: string;
  // Auto-fill marker — formData kütük/vakıf lookup'ından geldiyse yeşil bordur
  // göstermek için. Set'te bulunan field key'lerine (city/district/neighborhood
  // /openAddress/doorNo) class eklenir.
  autoFilledFields?: Set<string>;
};

// Türkiye'de pinned (top of list) iller. Kullanıcının çoğu büyük 3 ilden.
const PINNED_TR_CITIES = ['İstanbul', 'Ankara', 'İzmir'];

// iso2 → bayrak emoji türetme. Regional indicator symbols (U+1F1E6..1F1FF).
const isoToFlag = (iso2: string): string => {
  if (!iso2 || iso2.length !== 2) return '🌐';
  const codePoints = iso2
    .toUpperCase()
    .split('')
    .map(c => 0x1f1e6 - 65 + c.charCodeAt(0));
  try {
    return String.fromCodePoint(...codePoints);
  } catch {
    return '🌐';
  }
};

// Paylaşılan ülke/il/ilçe/mahalle dropdown grubu. TR için neighborhoodsData
// (il→ilçe→mahalle), diğer ülkeler için country-state-city. Cascading:
// country değişince city/district/neighborhood reset; city değişince
// district/neighborhood reset; district değişince neighborhood reset.
// Country dropdown'unda bayrak emoji + searchable Select. TR şehirleri
// pinned (İstanbul/Ankara/İzmir üstte). showOpenAddress/showDoorNo ile
// serbest metin alanları aynı bileşene eklenebilir.
export function LocationFields({
  value,
  onChange,
  showCountry = true,
  showNeighborhood = true,
  showOpenAddress = false,
  showDoorNo = false,
  showPostalCode = false,
  labelCountry = 'Ülke',
  labelCity,
  labelDistrict,
  labelNeighborhood = 'Mahalle',
  labelOpenAddress = 'Açık Adres',
  labelDoorNo = 'Kapı No',
  labelPostalCode = 'Posta Kodu',
  required = false,
  className = '',
  autoFilledFields,
}: Props) {
  const currentCountry = value.country || 'Türkiye';
  const currentCity = value.city || '';
  const currentDistrict = value.district || '';
  const currentNeighborhood = value.neighborhood || '';
  const currentOpenAddress = value.openAddress || '';
  const currentDoorNo = value.doorNo || '';
  const currentPostalCode = value.postalCode || '';
  const isTurkey = currentCountry === 'Türkiye' || currentCountry === 'Turkey' || currentCountry === 'TR';

  const autoCls = (field: string) =>
    autoFilledFields && autoFilledFields.has(field)
      ? 'border border-green-500/60 ring-1 ring-green-100'
      : '';

  // Country list: TR + KKTC pinned, sonra alfabetik. Her birinin yanında bayrak.
  const countryOptions = useMemo(() => {
    const rest = Country.getAllCountries()
      .map(c => ({ name: c.name, code: c.isoCode, flag: isoToFlag(c.isoCode) }))
      .filter(c => c.name !== 'Turkey' && c.name !== 'Cyprus')
      .sort((a, b) => a.name.localeCompare(b.name));
    return [
      { name: 'Türkiye', code: 'TR', flag: '🇹🇷' },
      { name: 'KKTC (Kuzey Kıbrıs)', code: 'CY-KKTC', flag: '🇨🇾' },
      ...rest,
    ];
  }, []);

  const currentCountryFlag = useMemo(() => {
    const found = countryOptions.find(c => c.name === currentCountry || c.code === currentCountry);
    return found?.flag || '🇹🇷';
  }, [countryOptions, currentCountry]);

  const countryISO = useMemo(() => {
    if (!currentCountry) return null;
    if (isTurkey) return 'TR';
    return Country.getAllCountries().find(c => c.name === currentCountry || c.isoCode === currentCountry)?.isoCode || null;
  }, [currentCountry, isTurkey]);

  const cityOptions = useMemo<string[]>(() => {
    if (isTurkey) {
      // TR illeri: İstanbul/Ankara/İzmir üstte pinned, sonra alfabetik (78 il).
      const all = Object.keys(neighborhoodsData);
      const pinned = PINNED_TR_CITIES.filter(c => all.includes(c));
      const rest = all
        .filter(c => !PINNED_TR_CITIES.includes(c))
        .sort((a, b) => a.localeCompare(b, 'tr'));
      return [...pinned, ...rest];
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

  // Grid kolonu: openAddress/doorNo/postalCode aktifse 4'ten 2'ye düşür ki
  // metin alanları tam genişlikte gözüksün. Aksi halde dropdown'lar 4 kolon.
  const hasTextFields = showOpenAddress || showDoorNo || showPostalCode;
  const gridCls = hasTextFields
    ? `grid grid-cols-1 md:grid-cols-2 gap-4 ${className}`
    : `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`;

  return (
    <div className={gridCls}>
      {showCountry && (
        <div className="space-y-2 md:col-span-2 lg:col-span-4">
          <Label className="flex items-center gap-2"><Globe className="h-4 w-4" /> {labelCountry}{required && ' *'}</Label>
          <Select
            value={currentCountry || 'Türkiye'}
            onValueChange={(val) => onChange({ country: val, city: '', district: '', neighborhood: '' })}
          >
            <SelectTrigger className="h-11 rounded-xl">
              <SelectValue placeholder="Türkiye">
                <span className="text-base mr-2">{currentCountryFlag}</span>
                {currentCountry || 'Türkiye'}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="max-h-72">
              {countryOptions.map(c => (
                <SelectItem key={c.code} value={c.name}>
                  <span className="text-base mr-2">{c.flag}</span>
                  {c.name}
                </SelectItem>
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
            <SelectTrigger className={`h-11 rounded-xl ${autoCls('city')}`}><SelectValue placeholder={`${cityLabel} seçin...`} /></SelectTrigger>
            <SelectContent className="max-h-60">{cityOptions.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
        ) : (
          <Input value={currentCity} onChange={(e) => onChange({ ...value, city: e.target.value })} placeholder={cityLabel} className={`h-11 rounded-xl ${autoCls('city')}`} />
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
            <SelectTrigger className={`h-11 rounded-xl ${autoCls('district')}`}>
              <SelectValue placeholder={!currentCity ? `Önce ${cityLabel.toLowerCase()} seçin` : `${districtLabel} seçin...`} />
            </SelectTrigger>
            <SelectContent className="max-h-60">{districtOptions.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
          </Select>
        ) : (
          <Input value={currentDistrict} onChange={(e) => onChange({ ...value, district: e.target.value })} placeholder={districtLabel} className={`h-11 rounded-xl ${autoCls('district')}`} />
        )}
      </div>

      {showNeighborhood && (
        <div className="space-y-2">
          <Label>{labelNeighborhood}{required && ' *'}</Label>
          {isTurkey && neighborhoodOptions.length > 0 ? (
            <Select
              value={currentNeighborhood || ''}
              onValueChange={(v) => onChange({ ...value, neighborhood: v })}
              disabled={!currentDistrict}
            >
              <SelectTrigger className={`h-11 rounded-xl ${autoCls('neighborhood')}`}>
                <SelectValue placeholder={!currentDistrict ? 'Önce ilçe seçin' : 'Mahalle seçin...'} />
              </SelectTrigger>
              <SelectContent className="max-h-60">{neighborhoodOptions.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent>
            </Select>
          ) : (
            <Input value={currentNeighborhood} onChange={(e) => onChange({ ...value, neighborhood: e.target.value })} placeholder={labelNeighborhood} className={`h-11 rounded-xl ${autoCls('neighborhood')}`} />
          )}
        </div>
      )}

      {/* Kapı No önce — kullanıcı talebi: Kapı No ile Açık Adres yer değiştirsin. */}
      {showDoorNo && (
        <div className="space-y-2">
          <Label>{labelDoorNo}</Label>
          <Input
            value={currentDoorNo}
            onChange={(e) => onChange({ ...value, doorNo: e.target.value })}
            placeholder="Bina / Daire no"
            className={`h-11 rounded-xl ${autoCls('doorNo')}`}
          />
        </div>
      )}

      {showOpenAddress && (
        <div className="space-y-2 md:col-span-2">
          <Label className="flex items-center gap-2"><MapPin className="h-4 w-4" /> {labelOpenAddress}{required && ' *'}</Label>
          <Input
            value={currentOpenAddress}
            onChange={(e) => onChange({ ...value, openAddress: e.target.value })}
            placeholder="Sokak, cadde, bina adı"
            className={`h-11 rounded-xl ${autoCls('openAddress')}`}
          />
        </div>
      )}

      {showPostalCode && (
        <div className="space-y-2">
          <Label>{labelPostalCode}</Label>
          <Input
            value={currentPostalCode}
            onChange={(e) => onChange({ ...value, postalCode: e.target.value })}
            placeholder="34000"
            className="h-11 rounded-xl"
            inputMode="numeric"
          />
        </div>
      )}
    </div>
  );
}
