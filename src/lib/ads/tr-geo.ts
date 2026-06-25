/**
 * Türkiye geo/dil hedefleme sabitleri — Google Ads geo target ID'leri.
 *
 * Saf veri modülü (UI + backend import eder). 'use server' DEĞİL.
 * - geoTargetIds boş/undefined ⇒ tüm Türkiye (TR_COUNTRY_GEO).
 * - ID'ler Google geo target constant numaralarıdır (string).
 */
export const TR_PROVINCES: { id: string; name: string }[] = [
  { id: '21069', name: 'İstanbul' },
  { id: '21055', name: 'Ankara' },
  { id: '21070', name: 'İzmir' },
  { id: '21060', name: 'Bursa' },
  { id: '21056', name: 'Antalya' },
  { id: '21052', name: 'Adana' },
  { id: '21066', name: 'Gaziantep' },
  { id: '21075', name: 'Konya' },
  { id: '21068', name: 'Mersin' },
  { id: '21073', name: 'Kayseri' },
  { id: '21074', name: 'Kocaeli' },
  { id: '21065', name: 'Eskişehir' },
  { id: '21062', name: 'Diyarbakır' },
  { id: '21085', name: 'Samsun' },
  { id: '21088', name: 'Trabzon' },
  { id: '21089', name: 'Şanlıurfa' },
];

/** Türkiye ülke geo target ID'si (varsayılan hedef). */
export const TR_COUNTRY_GEO = '2792';

/** Türkçe dil constant ID'si. */
export const TR_LANGUAGE = '1037';
