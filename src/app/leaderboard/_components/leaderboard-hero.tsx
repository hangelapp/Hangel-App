'use client';

/**
 * LeaderboardHero — sezon temalı banner.
 *
 * hangel brand: gradient primary (#f34723) + rounded-3xl + Liquid Glass overlay.
 */

import { Sparkles, Trophy } from 'lucide-react';
import { useTranslation } from '@/components/providers/language-provider';

export function LeaderboardHero() {
  const { t } = useTranslation();
  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/20 bg-gradient-to-br from-primary via-primary/85 to-orange-400 p-6 text-white shadow-glass-prominent sm:p-8">
      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" aria-hidden />
      <div className="absolute -bottom-12 -left-6 h-32 w-32 rounded-full bg-amber-200/30 blur-2xl" aria-hidden />
      <div className="relative flex flex-col gap-3">
        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-medium backdrop-blur">
          <Sparkles className="h-3.5 w-3.5" />
          {t('leaderboardPage.seasonBadge')}
        </span>
        <h1 className="font-headline text-3xl font-bold leading-tight sm:text-4xl">
          {t('leaderboardPage.heroTitle')}
        </h1>
        <p className="max-w-xl text-sm text-white/85 sm:text-base">
          {t('leaderboardPage.heroSubtitle')}
        </p>
        <div className="mt-2 inline-flex w-fit items-center gap-2 rounded-2xl bg-white/15 px-3 py-2 text-xs backdrop-blur sm:text-sm">
          <Trophy className="h-4 w-4 text-amber-200" />
          <span>{t('leaderboardPage.heroSeasonEndsLabel')}</span>
        </div>
      </div>
    </section>
  );
}
