'use client';

/**
 * LeaderboardRow — 4. sıradan itibaren rounded-3xl numbered list card.
 *
 * Avatar `next/image` ile, isim + score badge. Anonim kullanıcılar maskelenir.
 */

import Image from 'next/image';
import Link from 'next/link';
import { EyeOff, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/components/providers/language-provider';
import { getValue, type RankedUser, type MetricKey } from './leaderboard-types';

type RowProps = {
  user: RankedUser;
  unit: string;
  valueKey: MetricKey;
  isMe: boolean;
};

export function LeaderboardRow({ user, unit, valueKey, isMe }: RowProps) {
  const { t } = useTranslation();
  const isAnonymous = user.privacySettings?.isPrivate === true;
  const name = isAnonymous ? t('leaderboardPage.anonymousUser') : user.name || t('leaderboardPage.anonymousUser');
  const handle = !isAnonymous && user.username ? `@${user.username}` : '';
  const value = user._value.toLocaleString('tr-TR');
  const initial = (user.name || '?').charAt(0).toUpperCase();
  const showImage = !isAnonymous && Boolean(user.avatarUrl);
  const href = !isAnonymous && user.id ? `/profile/${user.id}` : undefined;

  // Secondary metric: impact score when not the active tab (extra context).
  const impactScore = valueKey !== 'impactScore' ? getValue(user, 'impactScore') : 0;

  const content = (
    <div
      className={cn(
        'group flex items-center gap-3 rounded-3xl border border-border/60 bg-card/80 p-3 backdrop-blur transition-all duration-200 ease-spring-out hover:-translate-y-0.5 hover:shadow-glass-soft sm:p-4',
        isMe && 'border-primary/40 bg-primary/5 ring-2 ring-primary/30'
      )}
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-muted text-sm font-bold tabular-nums text-muted-foreground">
        {user._rank}
      </div>
      <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full">
        {showImage ? (
          <Image
            src={user.avatarUrl as string}
            alt={name}
            fill
            sizes="44px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-primary/10 text-base font-bold text-primary">
            {isAnonymous ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : initial}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-1 text-sm font-medium text-foreground sm:text-base">{name}</p>
        <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
          {handle && <span className="min-w-0 truncate">{handle}</span>}
          {impactScore > 0 && (
            <span className="inline-flex shrink-0 items-center gap-1">
              <Star className="h-3 w-3 text-amber-500" />
              {impactScore.toLocaleString('tr-TR')} {t('leaderboardPage.unitPoints')}
            </span>
          )}
        </div>
      </div>
      <div className="shrink-0 rounded-2xl bg-primary/10 px-3 py-1.5 text-right">
        <p className="text-sm font-bold tabular-nums text-primary sm:text-base">{value}</p>
        <p className="text-xs uppercase tracking-tight text-muted-foreground">{unit}</p>
      </div>
    </div>
  );

  return href ? (
    <Link href={href} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-3xl">
      {content}
    </Link>
  ) : (
    content
  );
}
