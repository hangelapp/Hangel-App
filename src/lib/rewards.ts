/**
 * Ödül / Çekiliş / Canlı Soru-Yarışması — paylaşılan tipler ve yardımcılar (saf).
 *
 * İki koleksiyon ayrımı GÜVENLİK içindir:
 *   - eventRewards/{key}          → PUBLIC (banner). Doğru cevap YOK. Güvenli özet.
 *   - rewardConfigs/{key}         → PRIVATE (yalnız Admin SDK). Sorular + doğru cevap.
 * key = 'event_{id}' | 'vol_{id}'.
 *
 * Uygunluk kuralı: fiziksel etkinlik → yalnız check-in yapanlar; online → kayıtlı herkes.
 * Soru bazında ayrıca "checkinOnly" ile fiziksel bulunma zorunlu kılınabilir.
 */

export type RewardKind = 'event' | 'volunteering';

export function rewardKey(kind: RewardKind, id: string): string {
  return `${kind === 'event' ? 'event' : 'vol'}_${id}`;
}

export type WinnerRule = 'first' | 'raffle'; // ilk doğru / doğrular arasında çekiliş

export interface RewardPrize {
  name: string;
  count: number;
}

/** Quiz sorusu — TAM hali yalnız rewardConfigs (private) içinde durur. */
export interface QuizQuestion {
  id: string;
  text: string;
  options: string[];
  correctIndex: number; // ASLA public'e yazılmaz
  timeLimitSec: number; // sıkı süre (aramaya vakit kalmasın)
  winnerRule: WinnerRule;
  checkinOnly: boolean;
  prizeName?: string;
  winnerCount: number; // kaç kişi kazanır
}

/** Katılımcıya giden güvenli soru (doğru cevap içermez). */
export interface PublicQuestion {
  id: string;
  text: string;
  options: string[];
  timeLimitSec: number;
  index: number;
  total: number;
}

/** Private tam yapılandırma (rewardConfigs/{key}). */
export interface RewardConfig {
  kind: RewardKind;
  parentId: string;
  ngoId?: string;
  ngoName?: string;
  ngoLogoUrl?: string;
  title?: string;
  isOnline: boolean;
  raffle: { enabled: boolean; prizes: RewardPrize[] };
  quiz: { enabled: boolean; questions: QuizQuestion[] };
  activeQuestionId?: string | null;
}

/** Public banner özeti (eventRewards/{key}) — doğru cevap YOK. */
export interface RewardPublicSummary {
  kind: RewardKind;
  parentId: string;
  title?: string;
  hasRaffle: boolean;
  hasQuiz: boolean;
  rafflePrizes: RewardPrize[];
  quizPrizes: RewardPrize[];
  questionCount: number;
}

/** Private config'ten public özet türet (doğru cevapları soyar). */
export function toPublicSummary(cfg: RewardConfig): RewardPublicSummary {
  const quizPrizes: RewardPrize[] = (cfg.quiz.questions || [])
    .filter((q) => q.prizeName)
    .map((q) => ({ name: q.prizeName as string, count: q.winnerCount || 1 }));
  return {
    kind: cfg.kind,
    parentId: cfg.parentId,
    title: cfg.title,
    hasRaffle: !!cfg.raffle.enabled && (cfg.raffle.prizes?.length || 0) > 0,
    hasQuiz: !!cfg.quiz.enabled && (cfg.quiz.questions?.length || 0) > 0,
    rafflePrizes: cfg.raffle.prizes || [],
    quizPrizes,
    questionCount: cfg.quiz.questions?.length || 0,
  };
}

/** Katılımcıya gönderilecek güvenli soru (doğru cevap soyulmuş). */
export function toPublicQuestion(q: QuizQuestion, index: number, total: number): PublicQuestion {
  return { id: q.id, text: q.text, options: q.options, timeLimitSec: q.timeLimitSec, index, total };
}

/** Kısa rastgele id (crypto yoksa index-temelli çağrı tarafında üretilir). */
export function isRewardConfigured(s: RewardPublicSummary | null | undefined): boolean {
  return !!s && (s.hasRaffle || s.hasQuiz);
}
