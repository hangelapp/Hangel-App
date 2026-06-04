/**
 * Sosyal Etki Mali Değeri (Social Impact Monetary Value) — paylaşılan hesaplama.
 *
 * Tek doğru kaynak: `volunteerScoring` (süper-admin yönetir) `manHourCost`
 * (₺/saat) × tamamlanan gönüllülük saatleri. Profession → rate eşleştirmesi
 * şu sırayla denenir:
 *
 *   1) `taskTypeId` (volunteerScoring doc id) — STK ilanından kopyalanır.
 *   2) `taskTypeName` / `professionId` (taskType adı) — eski/manuel kayıtlar.
 *   3) `manHourCost` (entry üzerinde kopyalanmışsa) — historical değer korunur.
 *   4) `getDefaultHourlyRate()` — hiçbiri yoksa varsayılan ₺/saat.
 *
 * Hesap yerleri (DRY): Profile Etki tab, Leaderboard "Mali Değer" metriği,
 * Super-Admin Demographics toplamı, Settings impact summary. Hepsi
 * `calculateImpactValue` veya `calculateUserImpactValue` çağırır.
 *
 * Bu dosya React/Firestore client SDK içermez (`firebase-admin/firestore`
 * sadece async helper içinden kullanılır). Pure helper `calculateImpactValue`
 * UI'da senkron olarak da çağrılabilir.
 */

import type { Firestore as AdminFirestore } from 'firebase-admin/firestore';
import { COLLECTIONS } from '@/firebase/collections';

/* ----------------------------------------------------------------------- */
/*  Tipler                                                                 */
/* ----------------------------------------------------------------------- */

/** Süper-admin tarafından yönetilen iş kalemi kataloğu (volunteerScoring). */
export interface ProfessionScoringRow {
    id: string;
    taskType: string;
    manHourCost: number;
    pointsPerHour?: number;
    isActive?: boolean;
}

/** Bir kullanıcının tamamladığı gönüllülük kaydı (pastVolunteering doc). */
export interface CompletedVolunteerTask {
    /** doc.id veya benzersiz key */
    taskId: string;
    /** Saat olarak harcanan süre (>=0). 0/missing → değere 0 katkı. */
    hours: number;
    /** volunteerScoring doc id (ilandan kopyalanır). */
    taskTypeId?: string | null;
    /** volunteerScoring.taskType adı (id yoksa fallback). */
    professionId?: string | null;
    /** Eski kayıtlar için snapshot rate (overrides). */
    manHourCost?: number | null;
    /** STK metadata (UI rendering için). */
    ngoId?: string | null;
    organization?: string | null;
    title?: string | null;
    completedAt?: string | null;
}

/** Tek satır kırılım — UI listelerde ve denetimde kullanılır. */
export interface ImpactValueBreakdownRow {
    taskId: string;
    professionId: string | null;
    professionLabel: string | null;
    hours: number;
    rate: number;
    value: number;
}

/** Toplam + kırılım. */
export interface ImpactValueResult {
    totalTRY: number;
    breakdown: ImpactValueBreakdownRow[];
}

/* ----------------------------------------------------------------------- */
/*  Profession lookup helpers                                              */
/* ----------------------------------------------------------------------- */

/**
 * Varsayılan ₺/saat — katalog dışı/bilinmeyen kayıtlar için.
 * Süper-admin kataloğunun medyanı (~80–100₺); muhafazakar 80₺ seçtik.
 */
const DEFAULT_HOURLY_RATE_TRY = 80;

export function getDefaultHourlyRate(): number {
    return DEFAULT_HOURLY_RATE_TRY;
}

/**
 * Bir profession id (volunteerScoring doc id) veya taskType adı verilince
 * katalogdan ilk eşleşeni döndür. Hiçbiri yoksa `null`.
 */
export function findProfession(
    catalog: ProfessionScoringRow[],
    needle: string | null | undefined,
): ProfessionScoringRow | null {
    if (!needle) return null;
    const trimmed = String(needle).trim();
    if (!trimmed) return null;
    const lower = trimmed.toLocaleLowerCase('tr');
    for (const row of catalog) {
        if (row.id === trimmed) return row;
        if (row.taskType && row.taskType.toLocaleLowerCase('tr') === lower) return row;
    }
    return null;
}

/* ----------------------------------------------------------------------- */
/*  Pure hesaplayıcı (sync) — UI ve server her ikisi de kullanır           */
/* ----------------------------------------------------------------------- */

/**
 * Tamamlanan gönüllülük kayıtlarından mali değer hesapla.
 * Saf fonksiyon — Firestore çağrısı yapmaz. Async wrapper bunu çağırır.
 */
export function calculateImpactValue(
    tasks: CompletedVolunteerTask[],
    catalog: ProfessionScoringRow[],
): ImpactValueResult {
    const breakdown: ImpactValueBreakdownRow[] = [];
    let totalTRY = 0;

    for (const task of tasks) {
        const hours = Number(task.hours);
        if (!Number.isFinite(hours) || hours <= 0) continue;

        // Profession lookup: önce id, sonra ad
        const prof =
            findProfession(catalog, task.taskTypeId) ||
            findProfession(catalog, task.professionId);

        // Rate seçimi: katalog > snapshot > default
        const snapshotRate = Number(task.manHourCost);
        const rate =
            prof && Number.isFinite(prof.manHourCost) && prof.manHourCost > 0
                ? prof.manHourCost
                : Number.isFinite(snapshotRate) && snapshotRate > 0
                  ? snapshotRate
                  : getDefaultHourlyRate();

        const value = Math.round(hours * rate);
        totalTRY += value;

        breakdown.push({
            taskId: task.taskId,
            professionId: prof?.id ?? task.taskTypeId ?? task.professionId ?? null,
            professionLabel: prof?.taskType ?? task.professionId ?? null,
            hours,
            rate,
            value,
        });
    }

    return { totalTRY, breakdown };
}

/**
 * Toplam saat — UI hızlı özet için ayrı helper (breakdown çağırmadan).
 */
export function sumVolunteerHours(tasks: CompletedVolunteerTask[]): number {
    let total = 0;
    for (const t of tasks) {
        const h = Number(t.hours);
        if (Number.isFinite(h) && h > 0) total += h;
    }
    return total;
}

/* ----------------------------------------------------------------------- */
/*  Firestore okuma normalizer'ı                                           */
/* ----------------------------------------------------------------------- */

/**
 * `pastVolunteering` veya `completedVolunteerTasks` array elemanını
 * `CompletedVolunteerTask`'a normalize et. Field isimleri farklı şemalardan
 * (legacy ilanlar, yeni ilanlar) gelebilir — defansif.
 */
export function normalizeCompletedTask(
    raw: Record<string, unknown>,
    fallbackId: string,
): CompletedVolunteerTask {
    const hours =
        Number(raw.hours) ||
        Number((raw as { totalHours?: unknown }).totalHours) ||
        Number((raw as { estimatedHours?: unknown }).estimatedHours) ||
        0;

    const taskTypeId =
        (raw.taskTypeId as string | undefined) ??
        (raw.scoringId as string | undefined) ??
        null;

    const professionId =
        (raw.taskTypeName as string | undefined) ??
        (raw.professionId as string | undefined) ??
        (raw.profession as string | undefined) ??
        null;

    const manHourCost =
        Number((raw as { manHourCost?: unknown }).manHourCost) ||
        Number((raw as { manHourValue?: unknown }).manHourValue) ||
        null;

    const ngoId = (raw.ngoId as string | undefined) ?? null;
    const organization =
        (raw.organization as string | undefined) ??
        (raw.ngoName as string | undefined) ??
        null;
    const title = (raw.title as string | undefined) ?? null;

    const completedAt =
        (raw.completedAt as string | undefined) ??
        ((raw as { dates?: { eventEnd?: string } }).dates?.eventEnd) ??
        null;

    return {
        taskId: (raw.id as string | undefined) ?? (raw.taskId as string | undefined) ?? fallbackId,
        hours,
        taskTypeId,
        professionId,
        manHourCost,
        ngoId,
        organization,
        title,
        completedAt,
    };
}

/* ----------------------------------------------------------------------- */
/*  Async loader (server / admin SDK)                                      */
/* ----------------------------------------------------------------------- */

/**
 * Server-side helper — admin SDK üzerinden bir kullanıcının mali etkisini
 * hesaplar. UI'da bundle endpoint'i zaten pastVolunteering döner; orada
 * `calculateImpactValue(tasks, catalog)` sync olarak kullanılabilir.
 *
 * Kaynaklar (sırayla denenir):
 *   1) `users/{uid}.completedVolunteerTasks` (top-level array, varsa)
 *   2) `users/{uid}/pastVolunteering` sub-collection
 */
export async function calculateUserImpactValue(
    db: AdminFirestore,
    uid: string,
): Promise<ImpactValueResult> {
    if (!uid) return { totalTRY: 0, breakdown: [] };

    const userRef = db.collection(COLLECTIONS.users).doc(uid);

    const [userSnap, pastVolSnap, catalogSnap] = await Promise.all([
        userRef.get(),
        userRef.collection(COLLECTIONS.pastVolunteering).get(),
        db.collection(COLLECTIONS.volunteerScoring).get(),
    ]);

    const catalog: ProfessionScoringRow[] = catalogSnap.docs.map((d) => {
        const data = d.data() as Record<string, unknown>;
        return {
            id: d.id,
            taskType: String(data.taskType ?? ''),
            manHourCost: Number(data.manHourCost) || 0,
            pointsPerHour: Number(data.pointsPerHour) || 0,
            isActive: data.isActive !== false,
        };
    });

    const tasks: CompletedVolunteerTask[] = [];

    // 1) Top-level array (yeni şema)
    if (userSnap.exists) {
        const arr = (userSnap.data() as { completedVolunteerTasks?: unknown[] } | undefined)
            ?.completedVolunteerTasks;
        if (Array.isArray(arr)) {
            arr.forEach((raw, idx) => {
                if (raw && typeof raw === 'object') {
                    tasks.push(normalizeCompletedTask(raw as Record<string, unknown>, `inline-${idx}`));
                }
            });
        }
    }

    // 2) pastVolunteering sub-collection
    pastVolSnap.docs.forEach((d) => {
        tasks.push(normalizeCompletedTask({ id: d.id, ...d.data() }, d.id));
    });

    return calculateImpactValue(tasks, catalog);
}
