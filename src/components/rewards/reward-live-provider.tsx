'use client';

/**
 * RewardLiveProvider — global (app-shell). Kullanıcının cihazında:
 *   - celebrations: çekiliş/quiz kazanınca KONFETİ patlatır (aynı anda tüm kazananlarda).
 *   - (Faz 2) liveQuizSignal: canlı soruda tam ekran overlay açar.
 *
 * Sadece dinler; görünür bir DOM bırakmaz (konfeti kendi canvas'ını kullanır).
 */
import { useEffect, useRef, useState } from 'react';
import { collection, doc, limit, orderBy, query } from 'firebase/firestore';
import { useUser, useFirestore, useMemoFirebase, useCollection, useDoc } from '@/firebase';
import { COLLECTIONS } from '@/firebase/collections';
import { QuizOverlay, type QuizSignal } from './quiz-overlay';
import { EvalPopart, type EvalSignal } from './eval-popart';

type CelebrationDoc = {
  id: string;
  type?: string;
  title?: string;
  message?: string;
  createdAt?: { seconds?: number } | null;
};

export function RewardLiveProvider() {
  const { user: authUser } = useUser();
  const db = useFirestore();

  const celebrationsRef = useMemoFirebase(
    () =>
      db && authUser
        ? query(collection(db, COLLECTIONS.users, authUser.uid, 'celebrations'), orderBy('createdAt', 'desc'), limit(8))
        : null,
    [db, authUser?.uid],
  );
  const { data: celebrations } = useCollection<CelebrationDoc>(celebrationsRef);

  // İlk snapshot'ta mevcut id'leri "görüldü" say (baseline); sonra yalnız YENİ
  // gelen kutlamalar için konfeti patlat → sayfa açılışında eski kutlamalar tetiklenmez.
  const seen = useRef<Set<string> | null>(null);

  useEffect(() => {
    if (!celebrations) return;
    if (seen.current === null) {
      seen.current = new Set(celebrations.map((c) => c.id));
      return;
    }
    const fresh = celebrations.filter((c) => !seen.current!.has(c.id));
    if (fresh.length === 0) return;
    fresh.forEach((c) => seen.current!.add(c.id));
    // En yenisini kutla (çoklu gelirse ilkini göster; konfeti tek yeterli).
    const top = fresh[0];
    void import('@/lib/celebrate')
      .then((m) => m.celebrate({ title: top.title || 'Tebrikler! 🎉', message: top.message || '' }))
      .catch(() => undefined);
  }, [celebrations]);

  // Canlı soru sinyali → tam ekran overlay.
  const signalRef = useMemoFirebase(
    () => (db && authUser ? doc(db, COLLECTIONS.users, authUser.uid, 'liveQuizSignal', 'current') : null),
    [db, authUser?.uid],
  );
  const { data: signal } = useDoc<QuizSignal>(signalRef);
  const [dismissedQid, setDismissedQid] = useState<string | null>(null);

  const showQuiz =
    !!signal &&
    !!signal.active &&
    !!signal.questionId &&
    signal.questionId !== dismissedQid;

  // Değerlendirme popart sinyali (Tamamla sonrası).
  const evalRef = useMemoFirebase(
    () => (db && authUser ? doc(db, COLLECTIONS.users, authUser.uid, 'evalPrompt', 'current') : null),
    [db, authUser?.uid],
  );
  const { data: evalSignal } = useDoc<EvalSignal>(evalRef);
  const [dismissedEval, setDismissedEval] = useState<string | null>(null);
  const showEval = !!evalSignal && !!evalSignal.active && !!evalSignal.parentId && evalSignal.parentId !== dismissedEval && !showQuiz;

  return (
    <>
      {showQuiz && signal && (
        <QuizOverlay signal={signal} onDismiss={() => setDismissedQid(signal.questionId ?? null)} />
      )}
      {showEval && evalSignal && (
        <EvalPopart signal={evalSignal} onDismiss={() => setDismissedEval(evalSignal.parentId ?? null)} />
      )}
    </>
  );
}
