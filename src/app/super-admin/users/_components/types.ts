import type { User } from '@/lib/types';

export type UserRow = User & { id: string; status?: string };

export type EntityKind = 'ngo' | 'brand' | 'club';

export type EntityRow = {
  id: string;
  name?: string;
  logoUrl?: string;
  category?: string;
};

export const entityKindLabels: Record<EntityKind, string> = {
  ngo: 'STK',
  brand: 'Marka',
  club: 'Öğrenci Kulübü',
};

export const entityCollectionByKind: Record<EntityKind, string> = {
  ngo: 'ngos',
  brand: 'brands',
  club: 'clubs',
};

export const entityIdFieldByKind: Record<EntityKind, 'managedNgoId' | 'managedBrandId' | 'managedClubId'> = {
  ngo: 'managedNgoId',
  brand: 'managedBrandId',
  club: 'managedClubId',
};

export const invitationIdFieldByKind: Record<EntityKind, 'ngoId' | 'brandId' | 'clubId'> = {
  ngo: 'ngoId',
  brand: 'brandId',
  club: 'clubId',
};

export const rolesByKind: Record<EntityKind, { value: string; label: string; isPrimary?: boolean }[]> = {
  ngo: [
    { value: 'Genel Yönetici', label: 'Genel Yönetici', isPrimary: true },
    { value: 'Finans Yöneticisi', label: 'Finans Yöneticisi' },
    { value: 'Gönüllü Yöneticisi', label: 'Gönüllü Yöneticisi' },
    { value: 'İçerik Yöneticisi', label: 'İçerik Yöneticisi' },
    { value: 'Proje Yöneticisi', label: 'Proje Yöneticisi' },
  ],
  brand: [
    { value: 'Genel Yönetici', label: 'Genel Yönetici', isPrimary: true },
    { value: 'Marka Yöneticisi', label: 'Marka Yöneticisi' },
    { value: 'Pazarlama Yöneticisi', label: 'Pazarlama Yöneticisi' },
    { value: 'Finans Yöneticisi', label: 'Finans Yöneticisi' },
  ],
  club: [
    { value: 'Genel Yönetici', label: 'Genel Yönetici', isPrimary: true },
    { value: 'Etkinlik Yöneticisi', label: 'Etkinlik Yöneticisi' },
    { value: 'İçerik Yöneticisi', label: 'İçerik Yöneticisi' },
  ],
};

export const roleLabel: Record<string, string> = {
  'super-admin': 'SÜPER ADMİN',
  'ngo-admin': 'YÖNETİCİ',
  'user': 'KULLANICI',
};
