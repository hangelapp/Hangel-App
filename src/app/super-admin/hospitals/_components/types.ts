/**
 * super-admin/hospitals tipleri.
 *
 * Firestore `hospitals` koleksiyonundaki doc shape'i. Tüm alanlar opsiyonel
 * çünkü import sırasında OSM/SB kaynaklarının dolduramadığı alanlar boş kalır.
 * Doc id prefix:
 *  - `osm-<id>` → OpenStreetMap import
 *  - `sb-<id>`  → Sağlık Bakanlığı import
 */
export interface HospitalDoc {
  id: string;
  name?: string;
  city?: string;
  district?: string;
  address?: string;
  neighborhood?: string;
  phone?: string;
  website?: string;
  postcode?: string;
  lat?: number;
  lng?: number;
  source?: string;
}

export type HospitalFilter = 'all' | 'missingAddress' | 'missingCity' | 'missingDistrict';
export type HospitalSort = 'missingFirst' | 'nameAsc' | 'nameDesc';

export interface HospitalStats {
  total: number;
  missingAddress: number;
  missingCity: number;
  missingDistrict: number;
}

export interface HospitalEditForm {
  name: string;
  city: string;
  district: string;
  neighborhood: string;
  address: string;
  phone: string;
  website: string;
  postcode: string;
}
