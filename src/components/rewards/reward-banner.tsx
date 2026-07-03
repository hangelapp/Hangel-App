'use client';

/**
 * RewardBanner — etkinlik/gönüllülük public sayfasında, açıklamanın altında.
 * eventRewards/{key} (public, doğru cevap içermez) okunur; ödül/çekiliş varsa
 * "katılanlar arasında ödül var" duyurusu + varsa kazananlar gösterilir.
 */
import { doc, collection, query, orderBy, limit } from 'firebase/firestore';
import { Gift, Trophy } from 'lucide-react';
import { useFirestore, useMemoFirebase, useDoc, useCollection } from '@/firebase';
import { rewardKey, type RewardPublicSummary } from '@/lib/rewards';
import { Card } from '@/components/ui/card';

type Props = { kind: 'event' | 'volunteering'; id: string };
type WinnerDoc = { id: string; name?: string; prizeName?: string; source?: string };

export function RewardBanner({ kind, id }: Props) {
  const db = useFirestore();
  const key = rewardKey(kind, id);

  const summaryRef = useMemoFirebase(() => (db ? doc(db, 'eventRewards', key) : null), [db, key]);
  const { data: summary } = useDoc<RewardPublicSummary>(summaryRef);

  const winnersRef = useMemoFirebase(
    () => (db ? query(collection(db, 'eventRewards', key, 'winners'), orderBy('wonAt', 'desc'), limit(20)) : null),
    [db, key],
  );
  const { data: winners } = useCollection<WinnerDoc>(winnersRef);

  if (!summary || (!summary.hasRaffle && !summary.hasQuiz)) return null;

  const prizeNames = [
    ...(summary.rafflePrizes || []).map((p) => p.name),
    ...(summary.quizPrizes || []).map((p) => p.name),
  ].filter(Boolean);

  return (
    <Card className="rounded-3xl border-amber-300/50 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-400/20 text-amber-600">
          <Gift className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-amber-900 dark:text-amber-200">Katılanlara ödül var! 🎁</h3>
          <p className="text-sm text-amber-800/80 dark:text-amber-200/70 mt-0.5">
            {summary.hasRaffle && summary.hasQuiz
              ? 'Katılımcılar arasında çekiliş yapılacak ve canlı soru-yarışmasında ödüller dağıtılacak.'
              : summary.hasRaffle
                ? 'Katılımcılar arasında çekiliş yapılacaktır.'
                : 'Etkinlik sırasında canlı soru-yarışmasıyla ödüller dağıtılacaktır.'}
          </p>
          {prizeNames.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {prizeNames.slice(0, 6).map((n, i) => (
                <span key={i} className="rounded-full bg-white/70 dark:bg-white/10 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:text-amber-300">🎁 {n}</span>
              ))}
            </div>
          )}
          {winners && winners.length > 0 && (
            <div className="mt-3 rounded-xl bg-white/60 dark:bg-white/5 p-3">
              <p className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5"><Trophy className="h-3.5 w-3.5" /> Kazananlar</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {winners.map((w) => (
                  <span key={w.id} className="rounded-full bg-amber-100 dark:bg-amber-900/40 px-2.5 py-1 text-xs font-medium text-amber-800 dark:text-amber-200">
                    {w.name}{w.prizeName ? ` · ${w.prizeName}` : ''}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
