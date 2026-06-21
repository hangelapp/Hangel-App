'use client';

/**
 * Apple Health → users/{uid}.personalInfo otomatik senkron.
 *
 * `readHealthData()` çağırır; izin verilmiş + veri varsa SADECE dolu gelen
 * alanları dot-path ile yazar (`personalInfo.bloodType` vb.). Dot-path
 * kullanmamızın nedeni: nested object spread updateDoc'ta diğer personalInfo
 * alanlarını siler — dot-path yalnız verilen anahtarları günceller, gerisi
 * korunur.
 *
 * Tamamen best-effort: hata sessizce yutulur (native-bridge-provider'dan
 * app açılışında girişliyken bir kez çağrılır).
 */

import { doc, updateDoc, type Firestore } from 'firebase/firestore';

import { COLLECTIONS } from '@/firebase/collections';
import { readHealthData } from '@/lib/native-health';

export async function syncHealthToProfile(db: Firestore, uid: string): Promise<void> {
  if (!db || !uid) return;
  try {
    const health = await readHealthData();
    if (!health || !health.available) return;

    const updates: Record<string, string> = {};
    if (health.bloodType) updates['personalInfo.bloodType'] = health.bloodType;
    if (health.gender) updates['personalInfo.gender'] = health.gender;
    if (health.birthDate) updates['personalInfo.birthDate'] = health.birthDate;
    if (health.height) updates['personalInfo.height'] = health.height;
    if (health.weight) updates['personalInfo.weight'] = health.weight;

    if (Object.keys(updates).length === 0) return;

    await updateDoc(doc(db, COLLECTIONS.users, uid), updates);
  } catch (e) {
    console.warn('[sync-health] sync failed', e);
  }
}
