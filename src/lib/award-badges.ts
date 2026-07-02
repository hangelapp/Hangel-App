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
 * Kilometre taşı (milestone) rozetleri — alan-bazlı tier rozetlerinden bağımsız,
 * global başarı rozetleri. Kullanıcının toplam aktivitesine (user.stats) göre
 * tek seferlik açılır; alan puanına bağlı DEĞİL.
 *
 * id'ler `milestone-` ön ekiyle namespace'lenir → alan rozetleriyle
 * (`{alan}-{seviye}`) çakışmaz, aynı `users/{uid}/badges` ledger'ında yan yana
 * durur. `socialArea` hepsinde 'Genel' → enrichBadges/my-badges tier mantığını
 * etkilemez (orada yalnızca 19 sosyal alan üzerinden gruplanır).
 *
 * Koşul saf bir predicate'tir; user.stats üzerinden değerlendirilir. Eşikler
 * makul tutulmuştur (gerçek gönüllülük temposuna göre).
 */
interface MilestoneStats {
  volunteerHours: number;
  completedProjects: number;
  totalImpactValue: number;
  totalImpactPoints: number;
}

interface MilestoneBadgeDef {
  id: string;
  /** Kullanıcıya gösterilen TR ad. */
  name: string;
  /** Kısa TR açıklama (nasıl kazanıldığı). */
  description: string;
  /** UI/bildirim için emoji ikon. */
  emoji: string;
  level: string;
  /** Koşulu sağlayan eşik (bildirim/sıralama için bilgilendirici). */
  threshold: number;
  /** Açılış koşulu — user.stats üzerinden saf değerlendirme. */
  unlocked: (s: MilestoneStats) => boolean;
}

const MILESTONE_BADGES: MilestoneBadgeDef[] = [
  {
    id: 'milestone-ilk-adim',
    name: 'İlk Adım',
    description: 'İlk gönüllülük/etkinlik tamamlaman onaylandı.',
    emoji: '🌱',
    level: 'Bakır',
    threshold: 1,
    unlocked: (s) => s.completedProjects >= 1,
  },
  {
    id: 'milestone-ilk-etkinlik',
    name: 'İlk Etkinlik',
    description: 'İlk etkinliğini başarıyla tamamladın.',
    emoji: '🎉',
    level: 'Bakır',
    threshold: 1,
    unlocked: (s) => s.completedProjects >= 1,
  },
  {
    id: 'milestone-bes-etkinlik',
    name: '5 Etkinlik',
    description: 'Toplam 5 etkinlik/gönüllülük tamamladın.',
    emoji: '🖐️',
    level: 'Bronz',
    threshold: 5,
    unlocked: (s) => s.completedProjects >= 5,
  },
  {
    id: 'milestone-sadik-gonullu',
    name: 'Sadık Gönüllü',
    description: 'Toplam 10 etkinlik/gönüllülük tamamladın.',
    emoji: '🤝',
    level: 'Gümüş',
    threshold: 10,
    unlocked: (s) => s.completedProjects >= 10,
  },
  {
    id: 'milestone-gonullu-10s',
    name: 'Gönüllü',
    description: '10 saat gönüllülük katkısı sağladın.',
    emoji: '⏳',
    level: 'Bronz',
    threshold: 10,
    unlocked: (s) => s.volunteerHours >= 10,
  },
  {
    id: 'milestone-aktivist-50s',
    name: 'Aktivist',
    description: '50 saat gönüllülük katkısı sağladın.',
    emoji: '🔥',
    level: 'Gümüş',
    threshold: 50,
    unlocked: (s) => s.volunteerHours >= 50,
  },
  {
    id: 'milestone-topluluk-lideri-100s',
    name: 'Topluluk Lideri',
    description: '100 saat gönüllülük katkısı sağladın.',
    emoji: '🏆',
    level: 'Altın',
    threshold: 100,
    unlocked: (s) => s.volunteerHours >= 100,
  },
];

/** user.stats'ı (gevşek) güvenli MilestoneStats'a normalize et. */
function readMilestoneStats(raw: unknown): MilestoneStats {
  const s = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const num = (v: unknown) => {
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? n : 0;
  };
  return {
    volunteerHours: num(s.volunteerHours),
    completedProjects: num(s.completedProjects),
    totalImpactValue: num(s.totalImpactValue),
    totalImpactPoints: num(s.totalImpactPoints),
  };
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
      stats?: unknown;
    };
    const storedAreaPoints = userData.areaPoints ?? {};
    const inviteCount = Number(userData.inviteCount) || 0;
    const milestoneStats = readMilestoneStats(userData.stats);

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

    // areaPoints + toplam puanı kalıcılaştır (totalPoints = liderlik sıralaması).
    const totalPoints = Object.values(merged).reduce((a, b) => a + (Number(b) || 0), 0);
    await userRef.set({ areaPoints: merged, totalPoints }, { merge: true });

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

    // Kilometre taşı (milestone) rozetleri — user.stats üzerinden değerlendir.
    // Aynı idempotency seti (earnedIds) ile: zaten kazanılmışsa atlanır.
    const newMilestones: Array<{ def: MilestoneBadgeDef }> = [];
    for (const m of MILESTONE_BADGES) {
      if (!earnedIds.has(m.id) && m.unlocked(milestoneStats)) {
        newMilestones.push({ def: m });
        newBadges.push({
          id: m.id,
          name: m.name,
          level: m.level,
          socialArea: 'Genel',
          pointsRequired: m.threshold,
        });
      }
    }

    // Yeni rozet kayıtlarını yaz (alan + milestone).
    if (newBadges.length > 0) {
      const milestoneById = new Map(newMilestones.map((x) => [x.def.id, x.def]));
      const batch = db.batch();
      for (const nb of newBadges) {
        const m = milestoneById.get(nb.id);
        batch.set(userRef.collection(COLLECTIONS.badges).doc(nb.id), {
          badgeId: nb.id,
          name: nb.name,
          level: nb.level,
          socialArea: nb.socialArea,
          pointsRequired: nb.pointsRequired,
          ...(m
            ? { kind: 'milestone', description: m.description, emoji: m.emoji }
            : { kind: 'area' }),
          earnedAt: FieldValue.serverTimestamp(),
        });
      }
      await batch.commit();

      // Bildirim — yeni rozet(ler). Tek bildirimde özetle.
      if (opts.notify) {
        const lead = newBadges[0];
        const more = newBadges.length - 1;
        const title = 'Yeni rozet kazandın! 🧡';
        const leadSuffix = lead.socialArea && lead.socialArea !== 'Genel' ? ` (${lead.socialArea})` : '';
        const body =
          newBadges.length === 1
            ? `"${lead.name}" rozetini kazandın${leadSuffix}. Rozetlerini profilinde görebilirsin.`
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
