'use client';

/**
 * EvalPopart — etkinlik "Tamamla"nınca katılımcının cihazında açılan değerlendirme.
 * 5 standart soru (yıldız) + yorum + konuşmacı/sanatçı puanlama. Gönderince +20 puan
 * + konfeti. evalPrompt sinyalinden beslenir; gönderim /api/rewards/evaluate'e gider.
 */
import { useState } from 'react';
import { Loader2, Star, X, PartyPopper } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export type EvalContributor = { name: string; title?: string; role?: string };
export type EvalSignal = {
  active?: boolean;
  kind?: 'event' | 'volunteering';
  parentId?: string;
  title?: string;
  contributors?: EvalContributor[];
};

const QUESTIONS = [
  'Etkinliği genel olarak nasıl buldun?',
  'Organizasyon ve akış nasıldı?',
  'İçerik ne kadar faydalıydı?',
  'Mekân / erişim (veya online akış) nasıldı?',
  'Tekrar katılır / tavsiye eder misin?',
];

function Stars({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" onClick={() => onChange(n)} aria-label={`${n} yıldız`} className="p-0.5">
          <Star className={cn('h-6 w-6 transition-colors', n <= value ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/40')} />
        </button>
      ))}
    </div>
  );
}

export function EvalPopart({ signal, onDismiss }: { signal: EvalSignal; onDismiss: () => void }) {
  const { user: authUser } = useUser();
  const { toast } = useToast();
  const [answers, setAnswers] = useState<number[]>(new Array(QUESTIONS.length).fill(0));
  const [comment, setComment] = useState('');
  const contributors = signal.contributors || [];
  const [speaker, setSpeaker] = useState<Record<number, number>>({});
  const [submitting, setSubmitting] = useState(false);

  const setAns = (i: number, v: number) => setAnswers((a) => a.map((x, idx) => (idx === i ? v : x)));
  const answeredAny = answers.some((a) => a >= 1);

  const submit = async () => {
    if (!authUser || !answeredAny) return;
    setSubmitting(true);
    try {
      const token = await authUser.getIdToken();
      const res = await fetch('/api/rewards/evaluate', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: signal.parentId,
          answers,
          comment,
          speakerRatings: Object.fromEntries(Object.entries(speaker).filter(([, v]) => v >= 1)),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Gönderilemedi.');
      void import('@/lib/celebrate').then((m) => m.celebrate({ title: data.awarded ? '+20 puan! 🎉' : 'Teşekkürler! 🧡', message: 'Değerlendirmen alındı.' })).catch(() => undefined);
      onDismiss();
    } catch (e) {
      toast({ variant: 'destructive', title: 'Gönderilemedi', description: e instanceof Error ? e.message : '' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[2147482000] flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4 animate-in fade-in-0">
      <div className="w-full sm:max-w-md max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-background p-5 shadow-2xl">
        <div className="flex items-start justify-between mb-1">
          <div>
            <h2 className="text-lg font-bold">Etkinliği değerlendir ⭐</h2>
            <p className="text-xs text-muted-foreground">{signal.title}</p>
          </div>
          <button onClick={onDismiss} aria-label="Kapat" className="rounded-full p-1.5 hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>
        <div className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-amber-100 dark:bg-amber-900/30 px-3 py-1 text-xs font-bold text-amber-700 dark:text-amber-300">
          <PartyPopper className="h-3.5 w-3.5" /> Değerlendir, +20 puan kazan
        </div>

        <div className="space-y-4">
          {QUESTIONS.map((q, i) => (
            <div key={i} className="flex items-center justify-between gap-3">
              <span className="text-sm flex-1">{q}</span>
              <Stars value={answers[i]} onChange={(v) => setAns(i, v)} />
            </div>
          ))}

          <Textarea placeholder="Yorumun (opsiyonel)" value={comment} onChange={(e) => setComment(e.target.value)} className="min-h-[72px]" />

          {contributors.length > 0 && (
            <div className="space-y-2 pt-2 border-t">
              <p className="text-sm font-semibold">Konuşmacı / Sanatçılar</p>
              {contributors.map((c, i) => (
                <div key={i} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{c.name}</p>
                    {(c.title || c.role) && <p className="text-[11px] text-muted-foreground truncate">{[c.title, c.role].filter(Boolean).join(' · ')}</p>}
                  </div>
                  <Stars value={speaker[i] || 0} onChange={(v) => setSpeaker((s) => ({ ...s, [i]: v }))} />
                </div>
              ))}
            </div>
          )}

          <Button className="w-full" onClick={submit} disabled={submitting || !answeredAny}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Gönder ve +20 Puan Kazan
          </Button>
        </div>
      </div>
    </div>
  );
}
