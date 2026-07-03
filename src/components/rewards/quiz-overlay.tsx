'use client';

/**
 * QuizOverlay — canlı soruda katılımcının cihazında açılan TAM EKRAN soru.
 * liveQuizSignal doc'undan beslenir. Cevap /api/rewards/answer'a gider (doğruluk
 * sunucuda). Reveal gelince doğru cevap yeşil, kendi cevabın işaretli gösterilir.
 * Konfeti ayrı celebrations dinleyicisiyle patlar (kazanan + doğru cevaplayan).
 */
import { useCallback, useEffect, useState } from 'react';
import { Loader2, Check, X, Trophy } from 'lucide-react';
import { useUser } from '@/firebase';
import { cn } from '@/lib/utils';

export type QuizSignal = {
  active?: boolean;
  key?: string;
  kind?: 'event' | 'volunteering';
  parentId?: string;
  questionId?: string;
  title?: string;
  text?: string;
  options?: string[];
  timeLimitSec?: number;
  deadlineMs?: number;
  answered?: boolean;
  myOptionIndex?: number | null;
  revealed?: boolean;
  correctIndex?: number | null;
};

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];

export function QuizOverlay({ signal, onDismiss }: { signal: QuizSignal; onDismiss: () => void }) {
  const { user: authUser } = useUser();
  const [submitting, setSubmitting] = useState<number | null>(null);
  const [localAnswered, setLocalAnswered] = useState<number | null>(signal.answered ? signal.myOptionIndex ?? null : null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, []);

  const secondsLeft = signal.deadlineMs ? Math.max(0, Math.ceil((signal.deadlineMs - now) / 1000)) : 0;
  const answeredIndex = signal.myOptionIndex ?? localAnswered;
  const answered = signal.answered || localAnswered !== null;
  const revealed = !!signal.revealed;
  const expired = !revealed && secondsLeft <= 0;

  const submit = useCallback(
    async (optionIndex: number) => {
      if (!authUser || answered || revealed || expired) return;
      setSubmitting(optionIndex);
      try {
        const token = await authUser.getIdToken();
        const res = await fetch('/api/rewards/answer', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ kind: signal.kind, id: signal.parentId, questionId: signal.questionId, optionIndex }),
        });
        if (res.ok) setLocalAnswered(optionIndex);
        else {
          const d = await res.json().catch(() => ({}));
          // Süre doldu / zaten cevaplandı → sessizce kilitle.
          if (d?.error) setLocalAnswered(optionIndex);
        }
      } catch {
        /* yut */
      } finally {
        setSubmitting(null);
      }
    },
    [authUser, answered, revealed, expired, signal.kind, signal.parentId, signal.questionId],
  );

  // Reveal sonrası birkaç saniye göster, sonra otomatik kapat.
  useEffect(() => {
    if (!revealed) return;
    const t = setTimeout(onDismiss, 6500);
    return () => clearTimeout(t);
  }, [revealed, onDismiss]);

  return (
    <div className="fixed inset-0 z-[2147483000] flex flex-col items-center justify-center bg-gradient-to-br from-[#f34723] via-[#ff6a4d] to-[#ff8a5c] p-6 text-white animate-in fade-in-0">
      <div className="w-full max-w-md">
        <div className="mb-2 flex items-center justify-between text-sm font-semibold opacity-90">
          <span className="truncate">{signal.title || 'Canlı Soru'}</span>
          {!revealed && (
            <span className={cn('rounded-full px-3 py-1 tabular-nums', secondsLeft <= 5 ? 'bg-white text-[#f34723]' : 'bg-white/20')}>
              {secondsLeft}s
            </span>
          )}
        </div>

        <h2 className="text-2xl font-extrabold leading-tight mb-6">{signal.text}</h2>

        <div className="space-y-3">
          {(signal.options || []).map((opt, i) => {
            const isCorrect = revealed && signal.correctIndex === i;
            const isMine = answeredIndex === i;
            const isWrongMine = revealed && isMine && signal.correctIndex !== i;
            return (
              <button
                key={i}
                type="button"
                disabled={answered || revealed || expired || submitting !== null}
                onClick={() => submit(i)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-2xl px-4 py-4 text-left font-bold transition-all active:scale-[0.98]',
                  'bg-white/15 backdrop-blur',
                  isMine && !revealed && 'ring-2 ring-white bg-white/25',
                  isCorrect && 'bg-green-500 ring-2 ring-white',
                  isWrongMine && 'bg-red-500/80',
                  !answered && !revealed && !expired && 'hover:bg-white/25',
                )}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/25 text-sm">{LETTERS[i]}</span>
                <span className="flex-1">{opt}</span>
                {submitting === i && <Loader2 className="h-5 w-5 animate-spin" />}
                {isCorrect && <Check className="h-5 w-5" />}
                {isWrongMine && <X className="h-5 w-5" />}
              </button>
            );
          })}
        </div>

        <div className="mt-6 text-center text-sm font-semibold">
          {revealed ? (
            answeredIndex === signal.correctIndex ? (
              <span className="inline-flex items-center gap-1.5"><Trophy className="h-4 w-4" /> Doğru cevap! 🎉</span>
            ) : (
              <span className="opacity-90">Doğru cevap işaretlendi.</span>
            )
          ) : answered ? (
            <span className="opacity-90">Cevabın alındı ✓ — sonucu bekle…</span>
          ) : expired ? (
            <span className="opacity-90">Süre doldu — sonuç bekleniyor…</span>
          ) : (
            <span className="opacity-80">Bir şık seç</span>
          )}
        </div>
      </div>
    </div>
  );
}
