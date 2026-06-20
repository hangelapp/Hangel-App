'use client';

/**
 * EvaluationDialog — yeniden kullanılabilir 10 soruluk değerlendirme formu.
 *
 * Çift yönlü değerlendirme akışının ortak UI'ı: hem gönüllü → STK hem de
 * STK → gönüllü yönünde aynı dialog kullanılır; yalnızca `questions`,
 * `title` ve `withComment` prop'ları değişir. Her soru 1-5 yıldız ile
 * puanlanır. "Gönder" yalnızca tüm sorular cevaplandığında aktif olur.
 *
 * Saf sunum bileşeni: Firestore / API çağrısı içermez — `onSubmit`
 * (answers, comment?) callback'i ile cevapları üst bileşene devreder.
 * answers anahtarları soru id'leridir (src/lib/evaluations.ts soru setleri).
 */

import * as React from 'react';
import { Star } from 'lucide-react';

import type { EvalQuestion } from '@/lib/evaluations';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

export interface EvaluationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  /** Opsiyonel açıklama metni (başlığın altında). */
  description?: string;
  questions: EvalQuestion[];
  /** Serbest yorum textarea'sı göster. */
  withComment?: boolean;
  /** Dış akış gönderim sürerken butonu kilitler + "Gönderiliyor…" gösterir. */
  submitting?: boolean;
  onSubmit: (answers: Record<string, number>, comment?: string) => Promise<void> | void;
}

const LIKERT = [1, 2, 3, 4, 5] as const;

export function EvaluationDialog({
  open,
  onOpenChange,
  title,
  description,
  questions,
  withComment = false,
  submitting = false,
  onSubmit,
}: EvaluationDialogProps) {
  const [answers, setAnswers] = React.useState<Record<string, number>>({});
  const [comment, setComment] = React.useState('');

  // Dialog kapanınca formu sıfırla (tekrar açılışta temiz başlasın).
  React.useEffect(() => {
    if (!open) {
      setAnswers({});
      setComment('');
    }
  }, [open]);

  const allAnswered = questions.length > 0 && questions.every((q) => typeof answers[q.id] === 'number');

  const handleSubmit = async () => {
    if (!allAnswered || submitting) return;
    await onSubmit(answers, withComment ? comment.trim() || undefined : undefined);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>

        <div className="flex flex-col gap-5 py-2">
          {questions.map((q, idx) => {
            const value = answers[q.id];
            return (
              <div key={q.id} className="flex flex-col gap-2">
                <p className="text-sm font-medium leading-snug">
                  <span className="text-muted-foreground">{idx + 1}.</span> {q.text}
                </p>
                <div className="flex items-center gap-1.5" role="radiogroup" aria-label={q.text}>
                  {LIKERT.map((score) => {
                    const active = typeof value === 'number' && score <= value;
                    return (
                      <button
                        key={score}
                        type="button"
                        role="radio"
                        aria-checked={value === score}
                        aria-label={`${score} / 5`}
                        disabled={submitting}
                        onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: score }))}
                        className={cn(
                          'rounded-full p-1.5 transition-colors focus:outline-none focus:ring-2 focus:ring-ring',
                          'disabled:pointer-events-none disabled:opacity-50',
                          active
                            ? 'text-orange-500'
                            : 'text-muted-foreground/40 hover:text-orange-400',
                        )}
                      >
                        <Star className={cn('h-6 w-6', active && 'fill-current')} />
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {withComment ? (
            <div className="flex flex-col gap-2">
              <Label htmlFor="evaluation-comment">Yorum (opsiyonel)</Label>
              <Textarea
                id="evaluation-comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Eklemek istediğin notlar…"
                rows={3}
                maxLength={2000}
                disabled={submitting}
              />
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!allAnswered || submitting}
          >
            {submitting ? 'Gönderiliyor…' : 'Gönder'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
