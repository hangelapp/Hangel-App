'use client';

/**
 * LeaderboardRewards — sezon ödülleri info kartı.
 *
 * Statik içerik: ilk 3'ün ödülleri + sezon kapanış tarihi mesajı.
 */

import { Gift, Award, Star } from 'lucide-react';
import { useTranslation } from '@/components/providers/language-provider';

export function LeaderboardRewards() {
  const { t } = useTranslation();

  const items = [
    {
      icon: <Award className="h-5 w-5 text-amber-500" />,
      title: t('leaderboardPage.rewardFirstTitle'),
      desc: t('leaderboardPage.rewardFirstDesc'),
    },
    {
      icon: <Award className="h-5 w-5 text-zinc-400" />,
      title: t('leaderboardPage.rewardSecondTitle'),
      desc: t('leaderboardPage.rewardSecondDesc'),
    },
    {
      icon: <Award className="h-5 w-5 text-orange-600" />,
      title: t('leaderboardPage.rewardThirdTitle'),
      desc: t('leaderboardPage.rewardThirdDesc'),
    },
  ];

  return (
    <section className="rounded-3xl border border-border/60 bg-card/80 p-5 shadow-glass-soft backdrop-blur sm:p-6">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Gift className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-base font-bold text-foreground sm:text-lg">
            {t('leaderboardPage.rewardsTitle')}
          </h2>
          <p className="text-xs text-muted-foreground">{t('leaderboardPage.rewardsSubtitle')}</p>
        </div>
      </div>
      <ul className="grid gap-3 sm:grid-cols-3">
        {items.map((item) => (
          <li
            key={item.title}
            className="flex items-start gap-2 rounded-2xl border border-border/40 bg-background/60 p-3"
          >
            <span className="mt-0.5">{item.icon}</span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">{item.title}</p>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <Star className="h-3.5 w-3.5 text-amber-500" />
        {t('leaderboardPage.rewardsDisclaimer')}
      </p>
    </section>
  );
}
