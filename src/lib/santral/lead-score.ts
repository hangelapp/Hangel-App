/**
 * Kişi "sıcaklık" skoru (lead scoring) — 0..100.
 *
 * Deterministik, AI'sız (sıfır maliyet). Sinyaller:
 *   - aşama (stage): söz verdi / bağış yaptı en sıcak
 *   - son sonuç (lastDisposition): görüşüldü/geri arama sıcak, yanlış numara soğuk
 *   - son temas tazeliği (lastAttemptAt): yeni temas daha sıcak
 *   - deneme sayısı (attempts): hafif pozitif (ilgi göstergesi), aşırıysa doygun
 *
 * Tek kaynak burada; contacts API + UI aynı fonksiyonu kullanır.
 */

export interface LeadSignals {
  stage?: string | null;
  lastDisposition?: string | null;
  lastAttemptAtMs?: number | null;
  attempts?: number | null;
  pledgeAmount?: number | null;
}

const STAGE_POINTS: Record<string, number> = {
  'to-call': 5,
  interested: 25,
  promised: 40,
  donated: 45,
  lost: 0,
};

const DISPOSITION_POINTS: Record<string, number> = {
  answered: 25,
  'callback-requested': 30,
  busy: 12,
  'no-answer': 8,
  voicemail: 10,
  rejected: 2,
  'wrong-number': 0,
};

export function computeLeadScore(sig: LeadSignals): number {
  let score = 0;

  // Aşama (0-45)
  if (sig.stage && STAGE_POINTS[sig.stage] !== undefined) score += STAGE_POINTS[sig.stage];

  // Son sonuç (0-30)
  if (sig.lastDisposition && DISPOSITION_POINTS[sig.lastDisposition] !== undefined) {
    score += DISPOSITION_POINTS[sig.lastDisposition];
  }

  // Tazelik (0-20): 0 gün → 20p, 30+ gün → 0p
  if (sig.lastAttemptAtMs) {
    const days = (Date.now() - sig.lastAttemptAtMs) / (1000 * 60 * 60 * 24);
    if (days <= 30) score += Math.round(20 * (1 - days / 30));
  }

  // Bağış sözü tutarı (0-10): tutar varsa hafif bonus
  if (sig.pledgeAmount && sig.pledgeAmount > 0) score += 10;

  // 'lost' aşaması güçlü soğutucu — üstünü baskıla.
  if (sig.stage === 'lost') score = Math.min(score, 10);

  return Math.max(0, Math.min(100, Math.round(score)));
}

export function scoreTone(score: number): { label: string; className: string } {
  if (score >= 60) return { label: 'Sıcak', className: 'bg-rose-500/15 text-rose-600 dark:text-rose-300' };
  if (score >= 30) return { label: 'Ilık', className: 'bg-amber-500/15 text-amber-700 dark:text-amber-300' };
  return { label: 'Soğuk', className: 'bg-sky-500/15 text-sky-600 dark:text-sky-300' };
}
