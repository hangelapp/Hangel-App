'use client';

/**
 * LeaderboardMyRank — kullanıcının kendi sırasını vurgulayan sticky card.
 *
 * Kullanıcı login ise ve sıralamada yer alıyorsa sayfa altında görünür.
 * Top 3'de ise vurgulu "podyumdasın" mesajı; aksi halde sıra + puan.
 */

import { Sparkles, TrendingUp } from 'lucide-react';
import { useTranslation } from '@/components/providers/language-provider';
import type { RankedUser } from './leaderboard-types';

type MyRankProps = {
  me: RankedUser | null;
  totalShown: number;
  unit: string;
};

export function LeaderboardMyRank({ me, totalShown, unit }: MyRankProps) {
  const { t } = useTranslation();

  if (!me) {
    return (
      <div className="sticky bottom-4 z-20 rounded-3xl border border-border/60 bg-card/95 p-4 shadow-glass-prominent backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">{t('leaderboardPage.notRankedTitle')}</p>
            <p className="text-xs text-muted-foreground">{t('leaderboardPage.notRankedSubtitle')}</p>
          </div>
        </div>
      </div>
    );
  }

  const inPodium = me._rank <= 3;
  const value = me._value.toLocaleString('tr-TR');

  return (
    <div className="sticky bottom-4 z-20 rounded-3xl border border-primary/40 bg-gradient-to-r from-primary/10 via-card/95 to-card/95 p-4 shadow-glass-prominent backdrop-blur-md">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
          <Sparkles className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            {t('leaderboardPage.myRankLabel')}
          </p>
          <p className="text-sm font-medium text-foreground sm:text-base">
            {inPodium
              ? t('leaderboardPage.myRankPodium').replace('{rank}', String(me._rank))
              : t('leaderboardPage.myRankBeyond')
                  .replace('{rank}', String(me._rank))
                  .replace('{total}', String(totalShown))}
          </p>
        </div>
        <div className="shrink-0 rounded-2xl bg-primary px-3 py-1.5 text-right text-primary-foreground">
          <p className="text-sm font-bold tabular-nums sm:text-base">{value}</p>
          <p className="text-[10px] uppercase tracking-wide opacity-80">{unit}</p>
        </div>
      </div>
    </div>
  );
}
