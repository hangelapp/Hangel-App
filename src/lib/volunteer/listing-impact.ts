/**
 * İlan-bazlı Sosyal Etki hesabı (estimatedPoints + estimatedValueTRY + workItem).
 *
 * Yeni A3 ilanlarında STK yöneticisi `volunteerScoring` kataloğundan bir iş
 * kalemi (taskType) seçer ve süre girer; ilan dokümanına `taskTypeId`,
 * `pointsPerHour`, `manHourCost`, `estimatedHours`, `points`, `manHourValue`
 * kopyalanır. Eski / elle açılmış ilanlarda bu alanlar YOKtur; sadece serbest
 * metin alanlar (profession(s), skills, socialArea) bulunur.
 *
 * Bu helper her iki tür ilandan da iş kalemini çıkarır ve katalogla eşleştirir.
 * Eşleşmeyen ilanlara "Genel Gönüllülük" varsayılan kalemi uygulanır.
 *
 * İş kalemi çıkarma önceliği:
 *   1) profession / professions (meslek alanı)
 *   2) ilk skill
 *   3) socialArea (kategori)
 *
 * Saat çıkarma önceliği:
 *   estimatedHours → hours.total → makul varsayım (DEFAULT_LISTING_HOURS)
 *
 *   estimatedPoints   = pointsPerHour × saat
 *   estimatedValueTRY = manHourCost   × saat
 *
 * Mevcut `impact-value.ts` / `volunteer-impact.ts` export'larını bozmaz;
 * `ProfessionScoringRow` ve `findProfession` katalog tipini yeniden kullanır.
 */

import { findProfession, type ProfessionScoringRow } from './impact-value';

/* ----------------------------------------------------------------------- */
/*  Varsayılan "Genel Gönüllülük" kalemi                                    */
/* ----------------------------------------------------------------------- */

/**
 * Katalogda eşleşme bulunamayan ilanlar için varsayılan iş kalemi.
 * Değerler muhafazakar seçildi: katalog ortalamasının (~68 pt / ~188 ₺)
 * altında, professions.ts DEFAULT_HOURLY_RATE_TRY (150) ile uyumlu.
 */
export const GENERAL_VOLUNTEERING_WORK_ITEM = 'Genel Gönüllülük' as const;
const GENERAL_POINTS_PER_HOUR = 40;
const GENERAL_MAN_HOUR_COST_TRY = 150;

/** Saat bilgisi hiç yoksa varsayılan ilan süresi (tek günlük ~ yarım gün). */
const DEFAULT_LISTING_HOURS = 4;

/* ----------------------------------------------------------------------- */
/*  Tipler                                                                  */
/* ----------------------------------------------------------------------- */

/**
 * Bir gönüllülük ilanından okunan alanlar (defansif — eski + yeni şema).
 * Firestore doc.data() ham objesi de bu shape'e cast edilebilir.
 */
export interface VolunteeringListingLike {
    /** Yeni A3 ilanlarında katalog doc id'si. */
    taskTypeId?: string | null;
    /** Yeni A3 ilanlarında katalog adı (taskType). */
    taskTypeName?: string | null;
    /** Tip: tekil meslek alanı. */
    profession?: string | null;
    /** Yeni A3 ilanlarında çoğul meslek dizisi. */
    professions?: string[] | null;
    /** İlan yetenek etiketleri. */
    skills?: string[] | null;
    /** Kategori / sosyal alan. */
    socialArea?: string | null;
    /** Süre: yeni A3 ilanlarında saat sayısı. */
    estimatedHours?: number | null;
    /** Süre: tip şemasında hours.total. */
    hours?: { total?: number | null } | null;
}

/** Hesap sonucu. */
export interface ListingImpactResult {
    /** Eşleşen (veya varsayılan) iş kalemi adı. */
    workItem: string;
    /** Saat × pointsPerHour. */
    estimatedPoints: number;
    /** Saat × manHourCost (₺). */
    estimatedValueTRY: number;
}

/* ----------------------------------------------------------------------- */
/*  Alan çıkarıcılar                                                        */
/* ----------------------------------------------------------------------- */

function firstNonEmpty(...values: Array<string | null | undefined>): string | null {
    for (const v of values) {
        if (typeof v === 'string') {
            const t = v.trim();
            if (t) return t;
        }
    }
    return null;
}

function firstFromArray(arr: string[] | null | undefined): string | null {
    if (!Array.isArray(arr)) return null;
    for (const v of arr) {
        if (typeof v === 'string') {
            const t = v.trim();
            if (t) return t;
        }
    }
    return null;
}

/**
 * İlandan iş kalemini çıkar (öncelik: profession/meslek → ilk skill → category).
 * Eşleşme aramak için kullanılacak ham metin (henüz katalogla eşleşmiş değil).
 */
export function extractWorkItemNeedle(listing: VolunteeringListingLike): string | null {
    return firstNonEmpty(
        // Yeni A3 ilanı: doğrudan katalog id/adı taşır (en güvenilir).
        listing.taskTypeId,
        listing.taskTypeName,
        // Meslek alanı (tekil tip + çoğul A3 dizisi).
        listing.profession,
        firstFromArray(listing.professions),
        // İlk yetenek.
        firstFromArray(listing.skills),
        // Kategori.
        listing.socialArea,
    );
}

/** İlandan saat çıkar (estimatedHours → hours.total → varsayım). */
export function extractListingHours(listing: VolunteeringListingLike): number {
    const est = Number(listing.estimatedHours);
    if (Number.isFinite(est) && est > 0) return est;

    const total = Number(listing.hours?.total);
    if (Number.isFinite(total) && total > 0) return total;

    return DEFAULT_LISTING_HOURS;
}

/* ----------------------------------------------------------------------- */
/*  Ana hesap                                                               */
/* ----------------------------------------------------------------------- */

/**
 * Bir gönüllülük ilanından estimatedPoints + estimatedValueTRY + workItem üret.
 *
 * @param listing  İlan doc.data() (eski veya yeni şema).
 * @param catalog  volunteerScoring kataloğu (`ProfessionScoringRow[]`).
 */
export function computeListingImpact(
    listing: VolunteeringListingLike,
    catalog: ProfessionScoringRow[],
): ListingImpactResult {
    const hours = extractListingHours(listing);
    const needle = extractWorkItemNeedle(listing);

    const matched = findProfession(catalog, needle);

    const pointsPerHour =
        matched && Number.isFinite(matched.pointsPerHour) && (matched.pointsPerHour ?? 0) > 0
            ? Number(matched.pointsPerHour)
            : GENERAL_POINTS_PER_HOUR;

    const manHourCost =
        matched && Number.isFinite(matched.manHourCost) && matched.manHourCost > 0
            ? matched.manHourCost
            : GENERAL_MAN_HOUR_COST_TRY;

    const workItem = matched?.taskType?.trim() || GENERAL_VOLUNTEERING_WORK_ITEM;

    return {
        workItem,
        estimatedPoints: Math.round(pointsPerHour * hours),
        estimatedValueTRY: Math.round(manHourCost * hours),
    };
}
