/**
 * Volunteer impact value calculation (C3 — Calculate, Catalog, Cache).
 *
 * Tek bir hesaplama mantığı — TÜM yerlerde aynı formül kullanılmalı
 * (volunteerCompletions, profil etki tablosu, certificate üretimi).
 *
 *   impactValueTRY = hoursLogged × hourlyRate (TL/saat)
 *
 * hourlyRate kaynağı: `volunteerScoring/{id}.manHourCost`. NGO admin
 * görev oluştururken bu katalogdan seçer (override yok). User profile
 * default'u ile completion sırasında çakıştığında user girdiği
 * professionId baz alınır.
 *
 * Hesaplamayı server-side yaparken hourlyRate snapshot olarak kaydedilir
 * (`hourlyRateAtTime`); ileride katalog değişirse eski kayıtlar etkilenmez.
 */

import type { Firestore } from 'firebase-admin/firestore';
import { COLLECTIONS } from '@/firebase/collections';

export interface ProfessionRate {
  id: string;
  label: string;        // taskType field — örn. "Öğretmenlik / Eğitim Verme"
  hourlyRate: number;   // manHourCost (TL/saat)
  pointsPerHour: number;
  isActive: boolean;
}

/**
 * `volunteerScoring` katalogundan tek bir profession kaydını çek.
 * Profession ID, super-admin tarafında yönetilen koleksiyondaki doc id'sidir.
 *
 * Bulunamazsa veya pasifse `null` döner — caller fallback'e karar verir
 * (ör. ilk aktif profession'ı seç, ya da default rate uygula).
 */
export async function findProfession(
  db: Firestore,
  professionId: string,
): Promise<ProfessionRate | null> {
  if (!professionId) return null;
  const snap = await db.collection(COLLECTIONS.volunteerScoring).doc(professionId).get();
  if (!snap.exists) return null;
  const data = snap.data() as {
    taskType?: string;
    manHourCost?: number;
    pointsPerHour?: number;
    isActive?: boolean;
  };
  if (data.isActive === false) return null;
  return {
    id: snap.id,
    label: data.taskType ?? '',
    hourlyRate: Number(data.manHourCost ?? 0),
    pointsPerHour: Number(data.pointsPerHour ?? 0),
    isActive: (data.isActive as boolean | undefined) !== false,
  };
}

/**
 * `taskType` (label) ile profession kaydını çek — user profile'da meslek
 * string olarak tutuluyorsa fallback eşleme için.
 */
export async function findProfessionByLabel(
  db: Firestore,
  label: string,
): Promise<ProfessionRate | null> {
  if (!label) return null;
  const q = await db
    .collection(COLLECTIONS.volunteerScoring)
    .where('taskType', '==', label)
    .where('isActive', '==', true)
    .limit(1)
    .get();
  if (q.empty) return null;
  const doc = q.docs[0];
  if (!doc) return null;
  const data = doc.data() as { taskType?: string; manHourCost?: number; pointsPerHour?: number };
  return {
    id: doc.id,
    label: data.taskType ?? label,
    hourlyRate: Number(data.manHourCost ?? 0),
    pointsPerHour: Number(data.pointsPerHour ?? 0),
    isActive: true,
  };
}

/**
 * C3 — saat × saatlik ücret = TL etki değeri.
 * Negatif veya NaN girdileri 0'a clamp eder.
 */
export function calculateUserImpactValue(hours: number, hourlyRate: number): number {
  const h = Number.isFinite(hours) ? Math.max(0, hours) : 0;
  const r = Number.isFinite(hourlyRate) ? Math.max(0, hourlyRate) : 0;
  return Math.round(h * r);
}
