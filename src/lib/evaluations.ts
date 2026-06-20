/**
 * evaluations — çift yönlü (gönüllü ↔ STK) değerlendirme çekirdek tipleri,
 * soru setleri ve saf helper'lar.
 *
 * Bağlam: Bir gönüllülük / etkinlik faaliyeti tamamlanınca iki yönlü
 * değerlendirme yapılır:
 *   1. volunteer_to_ngo — gönüllü, STK'yı + faaliyeti 10 soruda puanlar.
 *   2. ngo_to_volunteer — STK, gönüllüyü 10 soruda + yorumla puanlar.
 * STK değerlendirmesi tamamlanınca gönüllünün sertifikası görünür olur
 * (`certificateUnlocked: true`).
 *
 * Scope: Bu dosya kasıtlı olarak SAF tutulur — React yok, Firestore yok,
 * yan etki yok. Yalnızca tip + sabit soru seti + deterministik id ve
 * ortalama-puan helper'ı export eder. Hem client (dialog) hem server
 * (API route) bu tek kaynaktan beslenir.
 */

/** Değerlendirmenin yönü. */
export type EvalDirection = 'volunteer_to_ngo' | 'ngo_to_volunteer';

/**
 * Değerlendirmenin bağlandığı kayıt tipi:
 *   - 'volunteer' → volunteerCompletions kaydı (gönüllülük görevi)
 *   - 'event'     → events kaydı (etkinlik)
 */
export type EvalKind = 'volunteer' | 'event';

/** Tek bir Likert sorusu (1-5). */
export interface EvalQuestion {
  /** Stabil, makine-okur kimlik (answers map anahtarı). */
  id: string;
  /** Kullanıcıya gösterilen Türkçe soru metni. */
  text: string;
}

/**
 * Gönüllü → STK / faaliyet değerlendirmesi (10 soru, 1-5 Likert).
 * Gönüllü, deneyimini ve STK'nın yürütmesini puanlar.
 */
export const VOLUNTEER_TO_NGO_QUESTIONS: readonly EvalQuestion[] = [
  { id: 'communication', text: 'STK ile iletişim açık ve zamanında mıydı?' },
  { id: 'task_clarity', text: 'Görev tanımı ve beklentiler net miydi?' },
  { id: 'organization', text: 'Faaliyet iyi organize edilmiş miydi?' },
  { id: 'venue_conditions', text: 'Mekan ve çalışma koşulları uygun muydu?' },
  { id: 'support', text: 'İhtiyaç anında STK sana destek oldu mu?' },
  { id: 'safety', text: 'Güvenlik ve sağlık önlemleri yeterli miydi?' },
  { id: 'time_respect', text: 'Planlanan başlangıç ve bitiş saatlerine uyuldu mu?' },
  { id: 'impact', text: 'Katkının anlamlı bir etki ürettiğinı hissettin mi?' },
  { id: 'appreciation', text: 'Emeğin takdir edildi ve değer gördü mü?' },
  { id: 'would_repeat', text: 'Bu STK ile tekrar gönüllü olur musun?' },
] as const;

/**
 * STK → gönüllü değerlendirmesi (10 soru, 1-5 Likert).
 * STK admini gönüllünün performansını ve uyumunu puanlar.
 */
export const NGO_TO_VOLUNTEER_QUESTIONS: readonly EvalQuestion[] = [
  { id: 'punctuality', text: 'Gönüllü zamanında geldi mi?' },
  { id: 'task_completion', text: 'Görevini eksiksiz yerine getirdi mi?' },
  { id: 'reliability', text: 'Verdiği sözlere ve taahhütlere güvenilir miydi?' },
  { id: 'teamwork', text: 'Ekiple uyumlu çalıştı mı?' },
  { id: 'communication', text: 'İletişimi açık ve saygılı mıydı?' },
  { id: 'initiative', text: 'Gerektiğinde inisiyatif aldı mı?' },
  { id: 'attitude', text: 'Olumlu ve istekli bir tutum sergiledi mi?' },
  { id: 'adaptability', text: 'Değişen koşullara uyum sağladı mı?' },
  { id: 'care', text: 'Görevini özen ve sorumlulukla yürüttü mü?' },
  { id: 'would_reinvite', text: 'Bu gönüllüyü tekrar davet eder misiniz?' },
] as const;

/**
 * Bir yön için soru setini döndüren yardımcı.
 */
export function questionsForDirection(direction: EvalDirection): readonly EvalQuestion[] {
  return direction === 'volunteer_to_ngo'
    ? VOLUNTEER_TO_NGO_QUESTIONS
    : NGO_TO_VOLUNTEER_QUESTIONS;
}

/**
 * Deterministik değerlendirme doc id'si.
 *
 * Aynı (kind, refId, volunteerId) üçlüsü için her zaman aynı id üretilir →
 * çift yön (volunteer_to_ngo + ngo_to_volunteer) TEK doc'ta birleşir ve
 * tekrar gönderim mevcut yönü merge'ler (çift kayıt önlenir).
 *
 * Örn: `volunteer_abc123_uidXYZ`
 */
export function evalDocId(kind: EvalKind, refId: string, volunteerId: string): string {
  return `${kind}_${refId}_${volunteerId}`;
}

/**
 * 1-5 Likert cevaplarının ortalaması. Boş map → 0.
 * Geçersiz (sayı olmayan / aralık dışı) değerler yok sayılır.
 * Sonuç 2 ondalığa yuvarlanır (örn 4.33).
 */
export function avgScore(answers: Record<string, number>): number {
  const values = Object.values(answers).filter(
    (v): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 1 && v <= 5,
  );
  if (values.length === 0) return 0;
  const sum = values.reduce((acc, v) => acc + v, 0);
  return Math.round((sum / values.length) * 100) / 100;
}
