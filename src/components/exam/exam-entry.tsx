'use client';

/**
 * ExamEntry — etkinlik public sayfasında "Sınava Gir" butonu.
 * Public özet (eventExams) açıksa görünür. Tıklayınca /api/exam/start → ExamRunner.
 * Katılım/deneme/geçmiş kontrolü sunucuda; uygun değilse bilgi verilir.
 */
import { useState } from 'react';
import { doc } from 'firebase/firestore';
import { GraduationCap, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useUser, useFirestore, useMemoFirebase, useDoc } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { examKey, type ExamPublicSummary, type ExamPresentedQuestion } from '@/lib/exam';
import { ExamRunner } from './exam-runner';

export function ExamEntry({ eventId }: { eventId: string }) {
  const { user: authUser } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [starting, setStarting] = useState(false);
  const [run, setRun] = useState<{ attemptId: string; questions: ExamPresentedQuestion[] } | null>(null);

  const summaryRef = useMemoFirebase(() => (db ? doc(db, 'eventExams', examKey(eventId)) : null), [db, eventId]);
  const { data: summary } = useDoc<ExamPublicSummary>(summaryRef);

  const start = async () => {
    if (!authUser) return toast({ variant: 'destructive', title: 'Önce giriş yap' });
    setStarting(true);
    try {
      const token = await authUser.getIdToken();
      const res = await fetch('/api/exam/start', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: eventId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Sınav başlatılamadı.');
      setRun({ attemptId: data.attemptId, questions: data.questions });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Başlatılamadı', description: e instanceof Error ? e.message : '' });
    } finally {
      setStarting(false);
    }
  };

  if (!summary || !summary.hasExam || !summary.open) return null;

  return (
    <>
      <Card className="rounded-3xl border-indigo-300/50 bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-950/30 dark:to-violet-950/20 p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-indigo-400/20 text-indigo-600"><GraduationCap className="h-6 w-6" /></div>
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-indigo-900 dark:text-indigo-200">Sertifika Sınavı 📝</h3>
            <p className="text-sm text-indigo-800/80 dark:text-indigo-200/70">{summary.questionCount} soru · geçme %{summary.passPct}. Sertifikan için sınavı geç.</p>
          </div>
          <Button onClick={start} disabled={starting} className="shrink-0">
            {starting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Sınava Gir'}
          </Button>
        </div>
      </Card>

      {run && (
        <ExamRunner
          eventId={eventId}
          attemptId={run.attemptId}
          questions={run.questions}
          onClose={() => setRun(null)}
          onRetry={() => { setRun(null); void start(); }}
        />
      )}
    </>
  );
}
