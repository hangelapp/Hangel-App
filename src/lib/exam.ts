/**
 * Sınav (yeterlilik sınavı) — paylaşılan tipler ve yardımcılar (saf).
 * Ödül/Quiz'den BAĞIMSIZ: amaç sertifika için geçme puanını aşmak.
 *
 * Güvenlik: sorular + doğru cevaplar + geçme puanı examConfigs (Admin SDK only).
 * Public tarafta yalnız "sertifika için sınav var" özeti (eventExams).
 * Sınav ETKİNLİKLERE özeldir → key = 'event_{id}'.
 */

export const examKey = (eventId: string): string => `event_${eventId}`;

/** Sınav sorusu — TAM hali yalnız examConfigs içinde. Her soruya ayrı süre (sn). */
export interface ExamQuestion {
  id: string;
  text: string;
  options: string[];
  correctIndex: number; // ASLA public'e gitmez
  timeLimitSec: number; // varsayılan 60; admin saniye bazında değiştirir
}

export const DEFAULT_QUESTION_SECONDS = 60;
export const DEFAULT_PASS_PCT = 60;
export const DEFAULT_ATTEMPTS = 3;

export interface ExamConfig {
  eventId: string;
  ngoId?: string;
  ngoName?: string;
  ngoLogoUrl?: string;
  title?: string;
  enabled: boolean;
  requiredForCert: boolean; // sertifika sınavı geçmeye bağlı mı
  passPct: number; // geçme yüzdesi
  attempts: number; // deneme hakkı
  questions: ExamQuestion[];
  open: boolean; // Tamamla sonrası açılır
  openedAt?: number | null;
}

/** Katılımcıya giden güvenli soru (doğru cevap yok; şıklar KARIŞIK sırada). */
export interface ExamPresentedQuestion {
  qid: string;
  text: string;
  options: string[]; // karışık
  timeLimitSec: number;
  index: number;
  total: number;
}

/** Public özet (eventExams/{key}) — doğru cevap YOK. */
export interface ExamPublicSummary {
  eventId: string;
  title?: string;
  hasExam: boolean;
  passPct: number;
  questionCount: number;
  requiredForCert: boolean;
  open: boolean;
}

export function examPublicSummary(cfg: ExamConfig): ExamPublicSummary {
  return {
    eventId: cfg.eventId,
    title: cfg.title,
    hasExam: !!cfg.enabled && (cfg.questions?.length || 0) > 0,
    passPct: cfg.passPct,
    questionCount: cfg.questions?.length || 0,
    requiredForCert: !!cfg.requiredForCert,
    open: !!cfg.open,
  };
}
