/**
 * Streak (seri) — saf mantık katmanı.
 *
 * Duolingo etkisi: kullanıcının üst üste günlerdeki aktivitesini izleriz.
 * İki sinyal serinin "bugün canlı" sayılması için yeterlidir:
 *   (a) ZIYARET — hangel'i (app/sayfa) bugün açtı.
 *   (b) KATKI   — bugün etkinlik / gönüllülük / bağış yaptı.
 *
 * Gün sınırı Europe/Istanbul'a göre hesaplanır (sunucu UTC olabilir). Bir gün
 * tamamen atlanırsa seri sıfırlanır; ancak kullanıcının 1 günlük "dondurma"
 * (freeze) hakkı varsa tek günlük boşluk seriyi korur (freeze tüketilir).
 *
 * Bu dosya kasıtlı olarak saftır: Firebase/Next importu yok, sadece veri-içeri
 * veri-dışarı. Böylece hem /api/streak/ping route'u hem de katkı tarafındaki
 * kayıt akışı aynı reducer'ı kullanır ve birim test edilebilir.
 */

/** users/{uid}.streak alanının şeması. Tarihler "YYYY-MM-DD" (Europe/Istanbul). */
export interface StreakState {
  /** Aktif kesintisiz gün serisi. */
  current: number;
  /** Tüm zamanların en uzun serisi. */
  longest: number;
  /** Son ZIYARET (app/sayfa açılışı) günü — "YYYY-MM-DD". */
  lastVisitDate: string | null;
  /** Son KATKI (etkinlik/gönüllülük/bağış) günü — "YYYY-MM-DD". */
  lastActionDate: string | null;
  /** Kalan dondurma (freeze) hakkı. Tek günlük boşluğu telafi eder. */
  freezeCount: number;
}

/** Hangi sinyal seriyi tetikledi. */
export type StreakSignal = 'visit' | 'action';

/** Yeni başlayan kullanıcı / alanı olmayan kayıt için güvenli varsayılan. */
export const DEFAULT_FREEZE_COUNT = 1;

export function emptyStreak(): StreakState {
  return {
    current: 0,
    longest: 0,
    lastVisitDate: null,
    lastActionDate: null,
    freezeCount: DEFAULT_FREEZE_COUNT,
  };
}

/**
 * Bir Date'i (varsayılan: şimdi) Europe/Istanbul gününe çevirir → "YYYY-MM-DD".
 * Intl tabanlı; harici timezone kütüphanesi gerektirmez.
 */
export function istanbulDayKey(date: Date = new Date()): string {
  // en-CA locale ISO benzeri "YYYY-MM-DD" üretir.
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Istanbul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return fmt.format(date);
}

/** "YYYY-MM-DD" → gün cinsinden tamsayı (UTC epoch günü). Karşılaştırma için. */
function dayNumber(key: string): number {
  const [y, m, d] = key.split('-').map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / 86_400_000);
}

/** İki gün anahtarı arasındaki tam gün farkı (b - a). */
export function dayDiff(a: string, b: string): number {
  return dayNumber(b) - dayNumber(a);
}

/** Bu state için serinin "en son canlı olduğu" gün (ziyaret/katkıdan büyük olanı). */
function lastActiveDay(state: StreakState): string | null {
  const v = state.lastVisitDate;
  const a = state.lastActionDate;
  if (v && a) return dayNumber(v) >= dayNumber(a) ? v : a;
  return v ?? a ?? null;
}

export interface ApplySignalResult {
  next: StreakState;
  /** State bu çağrıda gerçekten değişti mi (gereksiz yazımı atlamak için). */
  changed: boolean;
  /** Yeni bir güne ilk kez "canlı" olduk mu (kutlama/bildirim tetiği). */
  advanced: boolean;
  /** Bu çağrıda seri sıfırlandı mı (boşluk dondurmayla da kapanmadı). */
  reset: boolean;
  /** Bu çağrıda bir dondurma (freeze) hakkı tüketildi mi. */
  freezeUsed: boolean;
}

/**
 * Bir sinyal (ziyaret/katkı) uygulayıp yeni streak state'ini üretir.
 *
 * Kurallar:
 *  - Aynı gün ikinci sinyal: sadece ilgili lastXDate güncellenir, current değişmez.
 *  - Bir sonraki gün (diff === 1): current += 1.
 *  - İki+ gün boşluk (diff >= 2): bir gün eksik + freeze varsa freeze tüket,
 *    seriyi koru ve bugünü ekle; aksi halde seri 1'e sıfırlanır.
 *  - longest her zaman max(longest, current) olarak korunur.
 */
export function applyStreakSignal(
  prev: StreakState | null | undefined,
  signal: StreakSignal,
  today: string = istanbulDayKey(),
): ApplySignalResult {
  const base: StreakState = prev
    ? { ...emptyStreak(), ...prev }
    : emptyStreak();

  const prevActive = lastActiveDay(base);
  const next: StreakState = { ...base };

  // İlgili sinyalin tarihini her durumda bugüne çek.
  if (signal === 'visit') next.lastVisitDate = today;
  else next.lastActionDate = today;

  let advanced = false;
  let reset = false;
  let freezeUsed = false;

  if (prevActive === null) {
    // İlk aktivite.
    next.current = 1;
    advanced = true;
  } else {
    const diff = dayDiff(prevActive, today);
    if (diff <= 0) {
      // Aynı gün (veya teorik geç-gelen kayıt) → seri sayısı değişmez.
      if (next.current < 1) {
        next.current = 1;
        advanced = true;
      }
    } else if (diff === 1) {
      // Dün canlıydık, bugün devam → seri büyür.
      next.current = base.current + 1;
      advanced = true;
    } else {
      // Boşluk var. Tek günlük boşluğu dondurma ile telafi etmeyi dene.
      const gap = diff - 1; // atlanmış gün sayısı
      if (gap === 1 && base.freezeCount > 0) {
        next.freezeCount = base.freezeCount - 1;
        next.current = base.current + 1;
        advanced = true;
        freezeUsed = true;
      } else {
        next.current = 1;
        advanced = true;
        reset = true;
      }
    }
  }

  next.longest = Math.max(base.longest, next.current);

  const changed =
    next.current !== base.current ||
    next.longest !== base.longest ||
    next.lastVisitDate !== base.lastVisitDate ||
    next.lastActionDate !== base.lastActionDate ||
    next.freezeCount !== base.freezeCount;

  return { next, changed, advanced, reset, freezeUsed };
}

/**
 * Salt-okuma görünüm yardımcısı: state bayatsa (boşluk oluşmuşsa) UI'da
 * gösterilecek "etkin" current değerini hesaplar. Firestore'a YAZMAZ — sadece
 * gösterim. Örn. kullanıcı 2 gün açmadıysa kart "0 gün" göstermeli.
 */
export function effectiveCurrent(
  state: StreakState | null | undefined,
  today: string = istanbulDayKey(),
): number {
  if (!state) return 0;
  const active = lastActiveDay(state);
  if (active === null) return 0;
  const diff = dayDiff(active, today);
  if (diff <= 0) return state.current;          // bugün canlı
  if (diff === 1) return state.current;          // dün canlı, bugün henüz değil → seri ayakta
  if (diff === 2 && (state.freezeCount ?? 0) > 0) return state.current; // dondurma serisi koruyor
  return 0;                                      // boşluk kapandı → seri düştü
}

/** Seri bugün için "canlı/tamam" mı? (kart rozeti için.) */
export function isStreakActiveToday(
  state: StreakState | null | undefined,
  today: string = istanbulDayKey(),
): boolean {
  if (!state) return false;
  const active = lastActiveDay(state);
  return active !== null && dayDiff(active, today) === 0;
}
