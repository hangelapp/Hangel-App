'use client';

/**
 * LeaderboardPodium — ilk 3'ün altın/gümüş/bronz podyumu.
 *
 * Mobile: dikey stack (1 → 2 → 3). Desktop: yatay (2 — 1 — 3) klasik podyum.
 * Avatarlar `next/image` ile servis edilir.
 */

import Image from 'next/image';
import Link from 'next/link';
import { Crown, EyeOff, Medal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/components/providers/language-provider';
import type { RankedUser } from './leaderboard-types';

type PodiumProps = {
  top3: RankedUser[];
  unit: string;
};

const RANK_STYLES = [
  {
    ring: 'ring-amber-400/60',
    bg: 'from-amber-100/80 via-amber-50/60 to-white/40 dark:from-amber-500/15 dark:via-amber-500/5 dark:to-transparent',
    badge: 'bg-gradient-to-br from-amber-400 to-amber-600 text-white',
    icon: 'text-amber-500',
    height: 'sm:h-44',
    label: '1',
  },
  {
    ring: 'ring-zinc-300/60',
    bg: 'from-zinc-100/80 via-zinc-50/60 to-white/40 dark:from-zinc-500/15 dark:via-zinc-500/5 dark:to-transparent',
    badge: 'bg-gradient-to-br from-zinc-300 to-zinc-500 text-white',
    icon: 'text-zinc-400',
    height: 'sm:h-36',
    label: '2',
  },
  {
    ring: 'ring-orange-700/40',
    bg: 'from-orange-100/80 via-orange-50/60 to-white/40 dark:from-orange-800/15 dark:via-orange-800/5 dark:to-transparent',
    badge: 'bg-gradient-to-br from-orange-500 to-orange-700 text-white',
    icon: 'text-orange-700',
    height: 'sm:h-32',
    label: '3',
  },
] as const;

const PodiumCard = ({ user, rank, unit }: { user: RankedUser; rank: 0 | 1 | 2; unit: string }) => {
  const { t } = useTranslation();
  const style = RANK_STYLES[rank];
  const isAnonymous = user.privacySettings?.isPrivate === true;
  const name = isAnonymous ? t('leaderboardPage.anonymousUser') : user.name || t('leaderboardPage.anonymousUser');
  const handle = !isAnonymous && user.username ? `@${user.username}` : '';
  const value = user._value.toLocaleString('tr-TR');
  const initial = (user.name || '?').charAt(0).toUpperCase();
  const showImage = !isAnonymous && Boolean(user.avatarUrl);
  const href = !isAnonymous && user.id ? `/profile/${user.id}` : undefined;

  const content = (
    <div
      className={cn(
        'group relative flex flex-col items-center gap-3 rounded-3xl border border-white/40 bg-gradient-to-b p-4 text-center shadow-glass-soft backdrop-blur transition-transform duration-300 ease-spring-out hover:-translate-y-0.5 sm:p-5',
        style.bg,
        style.height,
        'h-auto'
      )}
    >
      <div className={cn('absolute -top-3 right-3 inline-flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-xs font-bold shadow-md', style.badge)}>
        {rank === 0 ? <Crown className="h-4 w-4" /> : style.label}
      </div>
      <div className={cn('relative h-20 w-20 overflow-hidden rounded-full ring-4 ring-offset-2 ring-offset-background', style.ring)}>
        {showImage ? (
          <Image
            src={user.avatarUrl as string}
            alt={name}
            fill
            sizes="80px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-primary/10 text-2xl font-bold text-primary">
            {isAnonymous ? <EyeOff className="h-7 w-7 text-muted-foreground" /> : initial}
          </div>
        )}
      </div>
      <div className="flex w-full min-w-0 flex-col items-center gap-0.5">
        <p className="line-clamp-1 max-w-full break-words font-semibold text-foreground">{name}</p>
        {handle && <p className="line-clamp-1 max-w-full break-all text-xs text-muted-foreground">{handle}</p>}
      </div>
      <div className="mt-auto flex items-center gap-1.5 rounded-full bg-background/60 px-3 py-1 text-sm font-bold text-foreground backdrop-blur">
        <Medal className={cn('h-4 w-4', style.icon)} />
        <span>{value}</span>
        <span className="text-xs font-normal text-muted-foreground">{unit}</span>
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
};

export function LeaderboardPodium({ top3, unit }: PodiumProps) {
  if (top3.length === 0) return null;

  // Desktop layout: 2 - 1 - 3 (klasik podyum). Mobile: 1 - 2 - 3 (dikey stack).
  const [first, second, third] = top3;

  return (
    <section className="mt-2">
      <div className="grid grid-cols-1 gap-3 sm:hidden">
        {first && <PodiumCard user={first} rank={0} unit={unit} />}
        {second && <PodiumCard user={second} rank={1} unit={unit} />}
        {third && <PodiumCard user={third} rank={2} unit={unit} />}
      </div>
      <div className="hidden grid-cols-3 items-end gap-3 sm:grid">
        <div className="pt-6">{second && <PodiumCard user={second} rank={1} unit={unit} />}</div>
        <div>{first && <PodiumCard user={first} rank={0} unit={unit} />}</div>
        <div className="pt-10">{third && <PodiumCard user={third} rank={2} unit={unit} />}</div>
      </div>
    </section>
  );
}
