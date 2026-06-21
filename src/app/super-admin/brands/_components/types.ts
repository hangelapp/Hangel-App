// Shared types & constants for super-admin/brands sub-components.
// Extracted from page.tsx during P2-6a refactor — NO logic changes.

import type { Brand } from "@/lib/types";

// Marka rolleri tek kaynaktan (shared roles.ts) — set-role route + 3 panel aynı
// listeyi paylaşsın diye buradan re-export edilir (eski import yolları korunur).
export { BRAND_ROLE_OPTIONS, type BrandRole } from '@/lib/ngo-admin/roles';

export type BrandItem = Brand & { id: string; source?: 'brands' | 'applications' | 'api'; status?: string };

export type EditFormData = Partial<BrandItem> & {
    _email?: string;
    _phone?: string;
    _website?: string;
    _instagram?: string;
    _twitter?: string;
    _facebook?: string;
    _linkedin?: string;
    _country?: string;
    _city?: string;
    _district?: string;
    _neighborhood?: string;
    _street?: string;
    agency?: string;
    link?: string;
};

// Brand'in opsiyonel olarak Firestore'da tutulan, type tanımında olmayan ekstra alanları.
// type Brand içerisinde address yok; type genişletmek için kullanılır.
export type BrandExtra = Brand & {
    phone?: string;
    email?: string;
    website?: string;
    address?: {
        country?: string;
        city?: string;
        district?: string;
        neighborhood?: string;
        street?: string;
    };
};

export type StatusFilter = 'all' | 'approved' | 'pending' | 'passive' | 'rejected';

export type SortOption = 'default' | 'nameAsc' | 'nameDesc' | 'donationDesc' | 'donationAsc' | 'status';

export interface BrandApplication {
    id: string;
    name?: string;
    sector?: string;
    brandStatus?: string;
    status?: string;
    [key: string]: unknown;
}

export interface SimpleUser {
    id: string;
    name?: string;
    displayName?: string;
    avatarUrl?: string;
    phone?: string;
    phoneNumber?: string;
    personalInfo?: { phone?: string; email?: string };
    [key: string]: unknown;
}

export const normalizePhone = (raw: string): string => raw.replace(/[^0-9]/g, '');

