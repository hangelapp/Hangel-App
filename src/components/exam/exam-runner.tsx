'use client';

/**
 * ExamRunner — katılımcının tam ekran sınavı. Sorular tek tek, HER SORUYA AYRI
 * geri sayım (süre dolunca otomatik sonraki). Sonda /api/exam/submit ile SUNUCUDA
 * puanlanır → geçtiyse sertifika + konfeti; kaldıysa kalan deneme gösterilir.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, Clock, GraduationCap, XCircle, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUser } from '@/firebase';
import { cn } from '@/lib/utils';
import type { ExamPresentedQuestion } from '@/lib/exam';

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];
type Result = { passed: boolean; scorePct: number; correctCount: number; total: number; attemptsLeft: number; passPct: number };

export function ExamRunner({
  eventId,
  attemptId,
  questions,
  onClose,
  onRetry,
}: {
  eventId: string;
  attemptId: string;
  questions: ExamPresentedQuestion[];
  onClose: () => void;
  onRetry: () => void;
}) {
  const { user: authUser } = useUser();
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [secondsLeft, setSecondsLeft] = useState(questions[0]?.timeLimitSec ?? 60);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  // Timer/closure staleliğini önlemek için en güncel cevaplar + "ilerledi mi" bayrağı.
  const answersRef = useRef<Record<string, number>>({});
  const advancedRef = useRef(false);

  const q = questions[idx];
  const isLast = idx >= questions.length - 1;

  const submit = useCallback(
    async (finalAnswers: Record<string, number>) => {
      if (!authUser) return;
      setSubmitting(true);
      setSubmitError(false);
      try {
        const token = await authUser.getIdToken();
        const res = await fetch('/api/exam/submit', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: eventId, attemptId, answers: finalAnswers }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || 'Gönderilemedi.');
        setResult(data as Result);
        if (data.passed) void import('@/lib/celebrate').then((m) => m.celebrate({ title: 'Sınavı geçtin! 🎓', message: `%${data.scorePct} — sertifikan hazır` })).catch(() => undefined);
      } catch {
        // Ağ/sunucu hatası: sahte "kaldın" gösterme; tekrar gönderilebilir hata ekranı.
        setSubmitError(true);
      } finally {
        setSubmitting(false);
      }
    },
    [authUser, eventId, attemptId],
  );

  const advance = useCallback(
    (picked: Record<string, number>) => {
      if (advancedRef.current) return; // çift ilerlemeyi engelle
      advancedRef.current = true;
      if (isLast) void submit(picked);
      else setIdx((i) => i + 1);
    },
    [isLast, submit],
  );

  // Per-soru geri sayım — süre dolunca otomatik ilerle (en güncel cevaplarla).
  useEffect(() => {
    if (result || submitError) return;
    advancedRef.current = false;
    setSecondsLeft(questions[idx]?.timeLimitSec ?? 60);
    let s = questions[idx]?.timeLimitSec ?? 60;
    const t = setInterval(() => {
      s -= 1;
      setSecondsLeft(s);
      if (s <= 0) {
        clearInterval(t);
        advance(answersRef.current);
      }
    }, 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, result, submitError]);

  const pick = (optionIndex: number) => {
    if (result || submitting) return;
    setAnswers((a) => {
      const nextA = { ...a, [q.qid]: optionIndex };
      answersRef.current = nextA;
      return nextA;
    });
  };

  const next = () => advance(answersRef.current);

  // --- Ağ hatası ekranı (tekrar gönder) ---
  if (submitError) {
    return (
      <div className="fixed inset-0 z-[2147482500] flex flex-col items-center justify-center overflow-y-auto bg-gradient-to-br from-slate-700 to-slate-900 p-6 text-white">
        <div className="w-full max-w-md text-center">
          <WifiOff className="mx-auto h-14 w-14" />
          <h2 className="mt-4 text-2xl font-extrabold">Bağlantı hatası</h2>
          <p className="mt-2 opacity-90">Sınavın gönderilemedi. Deneme hakkın harcanmadı — tekrar göndermeyi dene.</p>
          <div className="mt-6 flex flex-col gap-2">
            <Button variant="secondary" onClick={() => submit(answersRef.current)} disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Tekrar Gönder
            </Button>
            <Button variant="ghost" className="text-white hover:text-white" onClick={onClose}>Kapat</Button>
          </div>
        </div>
      </div>
    );
  }

  // --- Sonuç ekranı ---
  if (result) {
    return (
      <div className={cn('fixed inset-0 z-[2147482500] flex flex-col items-center justify-center overflow-y-auto p-6 text-white', result.passed ? 'bg-gradient-to-br from-emerald-500 to-green-600' : 'bg-gradient-to-br from-slate-700 to-slate-900')}>
        <div className="w-full max-w-md text-center">
          {result.passed ? <GraduationCap className="mx-auto h-16 w-16" /> : <XCircle className="mx-auto h-16 w-16" />}
          <h2 className="mt-4 text-3xl font-extrabold">{result.passed ? 'Geçtin! 🎓' : 'Bu sefer olmadı'}</h2>
          <p className="mt-2 text-lg font-semibold">%{result.scorePct} ({result.correctCount}/{result.total})</p>
          {result.passed ? (
            <p className="mt-1 opacity-90">Sertifikan profiline eklendi.</p>
          ) : (
            <p className="mt-1 opacity-90">Geçme puanı %{result.passPct}. {result.attemptsLeft > 0 ? `Kalan deneme: ${result.attemptsLeft}` : 'Deneme hakkın kalmadı.'}</p>
          )}
          <div className="mt-6 flex flex-col gap-2">
            {!result.passed && result.attemptsLeft > 0 && <Button variant="secondary" onClick={onRetry}>Tekrar Dene</Button>}
            <Button variant={result.passed ? 'secondary' : 'ghost'} className={result.passed ? '' : 'text-white hover:text-white'} onClick={onClose}>Kapat</Button>
          </div>
        </div>
      </div>
    );
  }

  // --- Soru ekranı ---
  return (
    <div className="fixed inset-0 z-[2147482500] flex flex-col items-center justify-center overflow-y-auto bg-gradient-to-br from-indigo-600 via-indigo-500 to-violet-600 p-6 text-white">
      <div className="w-full max-w-md py-4">
        <div className="mb-2 flex items-center justify-between text-sm font-semibold opacity-90">
          <span>Soru {idx + 1} / {questions.length}</span>
          <span className={cn('inline-flex items-center gap-1 rounded-full px-3 py-1 tabular-nums', secondsLeft <= 5 ? 'bg-white text-indigo-600' : 'bg-white/20')}>
            <Clock className="h-3.5 w-3.5" /> {Math.max(0, secondsLeft)}s
          </span>
        </div>
        <h2 className="text-xl font-extrabold leading-tight mb-5">{q?.text}</h2>
        <div className="space-y-3">
          {(q?.options || []).map((opt, i) => {
            const selected = answers[q.qid] === i;
            return (
              <button
                key={i}
                type="button"
                onClick={() => pick(i)}
                className={cn('flex w-full items-center gap-3 rounded-2xl px-4 py-4 text-left font-bold transition-all active:scale-[0.98] bg-white/15 backdrop-blur', selected ? 'ring-2 ring-white bg-white/25' : 'hover:bg-white/25')}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/25 text-sm">{LETTERS[i]}</span>
                <span className="flex-1">{opt}</span>
              </button>
            );
          })}
        </div>
        <Button className="w-full mt-6 bg-white text-indigo-600 hover:bg-white/90" onClick={next} disabled={submitting}>
          {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} {isLast ? 'Bitir ve Gönder' : 'Sonraki'}
        </Button>
      </div>
    </div>
  );
}
