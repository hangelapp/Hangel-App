/**
 * award-badges — sunucu tarafı rozet kazandırma motoru.
 *
 * Gönüllülük kapanış zincirinin son halkası. Bir kullanıcının gerçek
 * aktivitesinden (gönüllülük + bağış + davet) alan-bazlı puanları (areaPoints)
 * yeniden hesaplar, kullanıcı dokümanına kalıcılaştırır ve yeni bir rozet
 * tier'ı (Bakır→Platin) aşıldıysa:
 *   - users/{uid}/badges/{badgeId} kaydı yazar (henüz yoksa)
 *   - badge_earned bildirimi gönderir (notify-user 3-kanal: bildirim+push+mesaj)
 *
 * Tasarım: areaPoints hesabı istemci (my-badges) ile AYNI saf fonksiyonu
 * (computeAreaPoints/enrichBadges) kullanır; böylece sunucu ve istemci aynı
 * sonucu üretir. Persist edilen değerle max alınır → seçim-bazlı (selection)
 * puanlar veya istemcinin önceden yazdığı değerler korunur.
 *
 * Admin SDK gerektirir; yalnızca sunucudan çağrılır. Asla throw etmez —
 * hata durumunda boş sonuç döner (kapanış akışını bloklamaz).
 */

import type { Firestore } from 'firebase-admin/firestore';
import { FieldValue } from 'firebase-admin/firestore';

import { COLLECTIONS } from '@/firebase/collections';
import {
  computeAreaPoints,
  enrichBadges,
  mapCategoryToBadgeArea,
  type DonationLike,
  type PastVolunteeringLike,
} from '@/lib/badge-points';
import { notifyUser } from '@/lib/notify-user';

export interface AwardedBadge {
  id: string;
  name: string;
  level: string;
  socialArea: string;
  pointsRequired: number;
}

export interface AwardBadgesResult {
  ok: boolean;
  newBadges: AwardedBadge[];
  areaPoints: Record<string, number>;
}

/**
 * Bir bağış/gönüllülük dökümanından geçen tüm ngoId'leri topla → kategori
 * haritası kur (computeAreaPoints'in alan eşlemesi için).
 */
async function buildNgoCategoryMap(
  db: Firestore,
  ngoIds: Set<string>,
): Promise<Record<string, string>> {
  const map: Record<string, string> = {};
  const ids = Array.from(ngoIds).filter((x) => x && x !== 'Atanmamış');
  if (ids.length === 0) return map;
  const refs = ids.map((id) => db.collection(COLLECTIONS.ngos).doc(id));
  const snaps = await db.getAll(...refs);
  for (const s of snaps) {
    const cat = (s.data() as { category?: string } | undefined)?.category;
    if (s.exists && typeof cat === 'string') map[s.id] = cat;
  }
  return map;
}

export async function awardBadgesForUser(
  db: Firestore,
  uid: string,
  opts: { notify?: boolean } = {},
): Promise<AwardBadgesResult> {
  const empty: AwardBadgesResult = { ok: false, newBadges: [], areaPoints: {} };
  if (!uid) return empty;

  try {
    const userRef = db.collection(COLLECTIONS.users).doc(uid);

    const [userSnap, pastVolSnap, donationsSnap, earnedBadgesSnap] = await Promise.all([
      userRef.get(),
      userRef.collection(COLLECTIONS.pastVolunteering).get(),
      db.collection(COLLECTIONS.donations).where('userId', '==', uid).get(),
      userRef.collection(COLLECTIONS.badges).get(),
    ]);

    const userData = (userSnap.data() ?? {}) as {
      areaPoints?: Record<string, number>;
      inviteCount?: number;
    };
    const storedAreaPoints = userData.areaPoints ?? {};
    const inviteCount = Number(userData.inviteCount) || 0;

    const pastVolunteering: PastVolunteeringLike[] = pastVolSnap.docs.map(
      (d) => d.data() as PastVolunteeringLike,
    );
    const donations: DonationLike[] = donationsSnap.docs.map((d) => d.data() as DonationLike);

    // İlgili ngoId'leri topla (bağış + socialArea'sı olmayan gönüllülük).
    const ngoIds = new Set<string>();
    for (const dn of donations) for (const id of dn.ngoIds ?? []) ngoIds.add(id);
    for (const pv of pastVolunteering) {
      if (!pv.socialArea && !pv.area && pv.ngoId) ngoIds.add(pv.ngoId);
    }
    const ngoCategoryById = await buildNgoCategoryMap(db, ngoIds);

    const computed = computeAreaPoints({
      donations,
      ngoCategoryById,
      pastVolunteering,
      inviteCount,
    });

    // Persist edilen değerle birleştir (max) — seçim puanları/eski yazımlar korunur.
    const merged: Record<string, number> = { ...storedAreaPoints };
    for (const area of new Set([...Object.keys(storedAreaPoints), ...Object.keys(computed)])) {
      merged[area] = Math.max(Number(storedAreaPoints[area]) || 0, Number(computed[area]) || 0);
    }

    // areaPoints'i kalıcılaştır (istemci de aynısını yazar; tutarlı).
    await userRef.set({ areaPoints: merged }, { merge: true });

    // Hangi rozetler hak edildi? (currentPoints >= pointsRequired)
    const earnedIds = new Set(earnedBadgesSnap.docs.map((d) => d.id));
    const enriched = enrichBadges(merged);
    const newBadges: AwardedBadge[] = [];

    for (const b of enriched) {
      if (b.currentPoints >= b.pointsRequired && !earnedIds.has(b.id)) {
        newBadges.push({
          id: b.id,
          name: b.name,
          level: b.level,
          socialArea: b.socialArea,
          pointsRequired: b.pointsRequired,
        });
      }
    }

    // Yeni rozet kayıtlarını yaz.
    if (newBadges.length > 0) {
      const batch = db.batch();
      for (const nb of newBadges) {
        batch.set(userRef.collection(COLLECTIONS.badges).doc(nb.id), {
          badgeId: nb.id,
          name: nb.name,
          level: nb.level,
          socialArea: nb.socialArea,
          pointsRequired: nb.pointsRequired,
          earnedAt: FieldValue.serverTimestamp(),
        });
      }
      await batch.commit();

      // Bildirim — yeni rozet(ler). Tek bildirimde özetle.
      if (opts.notify) {
        const lead = newBadges[0];
        const more = newBadges.length - 1;
        const title = 'Yeni rozet kazandın! 🧡';
        const body =
          newBadges.length === 1
            ? `"${lead.name}" rozetini kazandın (${lead.socialArea}). Rozetlerini profilinde görebilirsin.`
            : `"${lead.name}" ve ${more} rozet daha kazandın! Rozetlerini profilinde görebilirsin.`;
        await notifyUser({
          userId: uid,
          type: 'badge_earned',
          title,
          body,
          link: '/my-badges',
          data: { badgeIds: newBadges.map((b) => b.id) },
          storeAsMessage: true,
          messageSubject: title,
          messageContent: body,
        });
      }
    }

    return { ok: true, newBadges, areaPoints: merged };
  } catch (e) {
    console.warn('[awardBadgesForUser] failed', { uid, error: e instanceof Error ? e.message : String(e) });
    return empty;
  }
}

/** Bir gönüllülük görevinin sosyal alanını 19 rozet alanından birine eşle. */
export function resolveBadgeArea(rawSocialArea: string | undefined | null): string | null {
  if (!rawSocialArea) return null;
  return mapCategoryToBadgeArea(rawSocialArea) ?? rawSocialArea;
}
