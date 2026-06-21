'use client';

/**
 * Firestore → ana ekran widget'ları otomatik senkron.
 *
 * Girişli kullanıcının GERÇEK değerlerini Firestore'dan toplar ve `setWidgetData`
 * ile native paylaşılan depoya yazar (iOS App Group / Android SharedPreferences).
 * Widget'lar bu depodan okur; veri gelene kadar placeholder gösterir.
 *
 * Tamamen best-effort: her metrik kendi try/catch'inde toplanır; biri başarısız
 * olursa veya değer yoksa o alan ATLANIR (plugin önceki/placeholder değeri korur).
 * native-bridge-provider'dan app açılışında girişliyken bir kez çağrılır.
 *
 * Veri kaynakları (mevcut app sorgularıyla aynı):
 *  - Etki puanı: users/{uid}.impactScore (number)
 *  - Yaklaşan etkinlik: collectionGroup('rsvps') userId==uid & status=='going'
 *    → events/{id}.{name, startDate, location.city}; startDate "YYYY-MM-DD HH:mm".
 *  - Acil kan: emergencyRequests type=='blood' & status=='approved' sayısı;
 *    en yakın şehir için kullanıcının kendi şehri (personalInfo.address.city).
 *  - Bağışlar: users/{uid}.stats.donationCount (önbellekli sayaç).
 */

import {
  collection,
  collectionGroup,
  doc,
  documentId,
  getDoc,
  getDocs,
  getCountFromServer,
  query,
  where,
  type Firestore,
} from 'firebase/firestore';

import { COLLECTIONS } from '@/firebase/collections';
import { setWidgetData, type WidgetData } from '@/lib/native-widget';

/**
 * impactScore → kullanıcıya gösterilecek rütbe etiketi (best-effort gösterim).
 * Kanonik bir score→rütbe haritası yok (rozetler alan-bazlı); widget'ın `rank`
 * alanı boş kalmasın diye basit eşik bandı kullanılır. "hangel" lowercase, Türkçe.
 */
function rankLabel(score: number): string {
  if (score >= 2500) return 'Efsane Gönüllü';
  if (score >= 1000) return 'Lider Gönüllü';
  if (score >= 250) return 'Aktif Gönüllü';
  return 'Gönüllü';
}

/** Firestore Timestamp veya "YYYY-MM-DD HH:mm" / ISO string → epoch ms (yoksa null). */
function toEpochMs(value: unknown): number | null {
  if (value == null) return null;
  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    const tsDate = (value as { toDate: () => Date }).toDate();
    const ms = tsDate.getTime();
    return Number.isFinite(ms) ? ms : null;
  }
  if (typeof value === 'string') {
    // "YYYY-MM-DD HH:mm" → ISO'ya çevir (Safari/iOS boşluklu formatı parse etmez).
    const iso = value.includes('T') ? value : value.replace(' ', 'T');
    const ms = new Date(iso).getTime();
    return Number.isFinite(ms) ? ms : null;
  }
  return null;
}

/** Kullanıcının bir sonraki (gelecekteki) RSVP'li etkinliğini bulup widget alanlarına yazar. */
async function collectUpcomingEvent(db: Firestore, uid: string, out: WidgetData): Promise<void> {
  try {
    const rsvpSnap = await getDocs(
      query(
        collectionGroup(db, COLLECTIONS.eventRsvps),
        where('userId', '==', uid),
        where('status', '==', 'going'),
      ),
    );
    const eventIds: string[] = [];
    rsvpSnap.forEach((d) => {
      const parentEventId = d.ref.parent.parent?.id;
      if (parentEventId) eventIds.push(parentEventId);
    });
    if (eventIds.length === 0) return;

    const now = Date.now();
    let best: { title: string; startMs: number; location: string } | null = null;

    // Firestore 'in' sorgusu en fazla 10 id alır → 10'arlı dilimlerde tara.
    for (let i = 0; i < eventIds.length; i += 10) {
      const batch = eventIds.slice(i, i + 10);
      const eventSnap = await getDocs(
        query(collection(db, COLLECTIONS.events), where(documentId(), 'in', batch)),
      );
      eventSnap.forEach((d) => {
        const data = d.data() as {
          name?: string;
          startDate?: unknown;
          location?: { city?: string };
        };
        const startMs = toEpochMs(data.startDate);
        if (startMs == null || startMs <= now) return; // sadece gelecekteki etkinlikler
        if (best === null || startMs < best.startMs) {
          best = {
            title: data.name ?? '',
            startMs,
            location: data.location?.city ?? '',
          };
        }
      });
    }

    if (best !== null) {
      const next: { title: string; startMs: number; location: string } = best;
      if (next.title) out.upcomingEventTitle = next.title;
      out.upcomingEventStartEpochMs = next.startMs;
      if (next.location) out.upcomingEventLocation = next.location;
    }
  } catch (e) {
    console.warn('[sync-widget] upcoming event failed', e);
  }
}

/** Açık acil kan çağrısı sayısını sayar; en yakın şehir için kullanıcının şehrini kullanır. */
async function collectBloodStatus(db: Firestore, uid: string, out: WidgetData): Promise<void> {
  try {
    const countSnap = await getCountFromServer(
      query(
        collection(db, COLLECTIONS.emergencyRequests),
        where('type', '==', 'blood'),
        where('status', '==', 'approved'),
      ),
    );
    out.bloodOpenRequests = countSnap.data().count;

    const userSnap = await getDoc(doc(db, COLLECTIONS.users, uid));
    const city = userSnap.data()?.personalInfo?.address?.city;
    if (typeof city === 'string' && city) out.bloodNearestCity = city;
  } catch (e) {
    console.warn('[sync-widget] blood status failed', e);
  }
}

/** users/{uid}.impactScore + stats.donationCount → widget alanları. */
async function collectUserStats(db: Firestore, uid: string, out: WidgetData): Promise<void> {
  try {
    const userSnap = await getDoc(doc(db, COLLECTIONS.users, uid));
    if (!userSnap.exists()) return;
    const data = userSnap.data() as {
      impactScore?: number;
      stats?: { donationCount?: number };
    };
    if (typeof data.impactScore === 'number') {
      out.impactScore = data.impactScore;
      out.impactRank = rankLabel(data.impactScore);
    }
    const donationCount = data.stats?.donationCount;
    if (typeof donationCount === 'number') {
      out.donationsCount = donationCount;
      out.donationsLabel = 'destek';
    }
  } catch (e) {
    console.warn('[sync-widget] user stats failed', e);
  }
}

/**
 * Kullanıcının gerçek widget verisini topla ve native'e gönder. Web/non-native ise
 * setWidgetData zaten no-op. Hiçbir alan toplanamazsa setData çağrılmaz.
 */
export async function syncWidgetData(db: Firestore, uid: string): Promise<void> {
  if (!db || !uid) return;
  const data: WidgetData = {};

  await collectUserStats(db, uid, data);
  await collectUpcomingEvent(db, uid, data);
  await collectBloodStatus(db, uid, data);

  if (Object.keys(data).length === 0) return;
  await setWidgetData(data);
}
