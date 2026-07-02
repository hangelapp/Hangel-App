/**
 * Şeffaflık skoru — SUNUCU (Admin SDK) yeniden hesaplama yardımcısı.
 *
 * Bir STK'nın şeffaflık endeksini TEK KAYNAKTAN hesaplar ve `ngos/{id}.transparencyScore`'a
 * YÜZDE (0-100) olarak yayınlar. Skor = güncel kriter tanımları üzerinden, STK'nın
 * yüklediği belge/bilgi + PROFİLDEN otomatik karşılanan kriterler (web/e-posta/telefon/
 * adres/üyelik) birleşimi. Böylece kart/liste/profil her yerde AYNI gerçek endeks görünür.
 *
 * Çağrılır: belge kaydet/onayla/sil rotaları + STK profil güncelleme rotaları
 * (profil değişince skor tazelenir) + toplu recalculate.
 */
import type { Firestore } from 'firebase-admin/firestore';
import { COLLECTIONS } from '@/firebase/collections';
import { normalizeDefs, mergeWithProfile, computeScore, type CriteriaItem, type NgoProfileLike } from './transparency';

export async function recomputeNgoTransparency(db: Firestore, ngoId: string): Promise<number | null> {
  if (!ngoId) return null;
  // Güncel kriter tanımları.
  let defs;
  try {
    const cs = await db.collection(COLLECTIONS.transparencyCriteria).get();
    defs = normalizeDefs(cs.docs.map((d) => ({ id: d.id, ...(d.data() as Record<string, unknown>) })) as never);
  } catch {
    defs = normalizeDefs(null);
  }
  const ngoRef = db.collection(COLLECTIONS.ngos).doc(ngoId);
  const ngoSnap = await ngoRef.get();
  if (!ngoSnap.exists) return null;
  const ngo = ngoSnap.data() as NgoProfileLike & { adminUserId?: string };

  // Yüklenen belge/bilgi verisi (varsa).
  let saved: CriteriaItem[] | null = null;
  if (ngo.adminUserId) {
    try {
      const t = await db.collection(COLLECTIONS.transparency).doc(ngo.adminUserId).get();
      saved = t.exists ? ((t.data() as { criteria?: CriteriaItem[] }).criteria || null) : null;
    } catch { /* yoksa yalnız profil sayılır */ }
  }

  const merged = mergeWithProfile(defs, saved as never, ngo);
  const { percent } = computeScore(defs, merged as never, { requireApproved: true });
  await ngoRef.set({ transparencyScore: percent, transparencyUpdatedAt: new Date().toISOString() }, { merge: true });
  return percent;
}
