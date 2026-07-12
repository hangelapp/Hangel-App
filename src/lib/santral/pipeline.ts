/**
 * Bağış/ilişki hunisi (pipeline) aşamaları.
 *
 * Her santralContacts kişisi bir `stage` alanında tutulur. Şimdilik hazır bir
 * aşama seti var; ileride STK başına özelleştirme eklenebilecek şekilde
 * merkezî tutuldu (tek kaynak burası — UI + API buradan okur).
 */

export interface PipelineStage {
  key: string;
  label: string;
  /** Tailwind renk sınıfı ipucu (rozet için). */
  tone: 'slate' | 'sky' | 'amber' | 'emerald' | 'rose';
  /** Bu aşama "kazanıldı" mı (bağış yapıldı) — huni sonucu için. */
  won?: boolean;
  /** Bu aşama "kaybedildi" mi (vazgeçti). */
  lost?: boolean;
}

/** Hazır (varsayılan) aşamalar. STK özelleştirmesi ileride bunun üstüne gelecek. */
export const DEFAULT_STAGES: PipelineStage[] = [
  { key: 'to-call', label: 'Aranacak', tone: 'slate' },
  { key: 'interested', label: 'İlgileniyor', tone: 'sky' },
  { key: 'promised', label: 'Söz verdi', tone: 'amber' },
  { key: 'donated', label: 'Bağış yaptı', tone: 'emerald', won: true },
  { key: 'lost', label: 'Vazgeçti', tone: 'rose', lost: true },
];

export const DEFAULT_STAGE_KEY = 'to-call';

const STAGE_MAP = new Map(DEFAULT_STAGES.map((s) => [s.key, s]));

export function getStage(key: string | null | undefined): PipelineStage {
  return (key && STAGE_MAP.get(key)) || DEFAULT_STAGES[0];
}

export function isValidStageKey(key: unknown): key is string {
  return typeof key === 'string' && STAGE_MAP.has(key);
}

/** Rozet için renk sınıfları (bg + text). Hem açık hem koyu temada okunur. */
export const STAGE_TONE_CLASS: Record<PipelineStage['tone'], string> = {
  slate: 'bg-slate-500/15 text-slate-600 dark:text-slate-300',
  sky: 'bg-sky-500/15 text-sky-600 dark:text-sky-300',
  amber: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  emerald: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  rose: 'bg-rose-500/15 text-rose-700 dark:text-rose-300',
};
