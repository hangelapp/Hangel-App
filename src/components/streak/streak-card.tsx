'use client';

/**
 * StreakCard — kullanıcının günlük serisini (streak) gösteren Apple-temiz kart.
 *
 * Alev ikonu + "X gün seri" + en uzun seri. Coral (#f34723) vurgu. Profil ya da
 * ana sayfada gösterilebilir. Veriyi users/{uid}.streak'ten reaktif okur
 * (useDoc); gösterimde bayat seri (boşluk oluşmuş) effectiveCurrent ile düşürülür
 * — Firestore'a yazmaz, yazımı /api/streak/ping yapar.
 *
 * Kullanım:
 *   <StreakCard />                       // oturum sahibinden otomatik
 *   <StreakCard streak={user.streak} />  // hazır veri varsa (ekstra okuma yok)
 */

import React, { useMemo } from 'react';
import { doc } from 'firebase/firestore';
import { Flame } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useFirestore, useMemoFirebase, useDoc, useUser } from '@/firebase';
import { COLLECTIONS } from '@/firebase/collections';
import {
  effectiveCurrent,
  isStreakActiveToday,
  type StreakState,
} from '@/lib/streak';

const CORAL = '#f34723';

interface UserStreakDoc {
  streak?: StreakState;
}

export interface StreakCardProps {
  /** Hazır streak verisi (verilirse ekstra Firestore okuması yapılmaz). */
  streak?: StreakState | null;
  /** Veri yoksa kartı tamamen gizle (varsayılan: "Hadi başla" boş durumu göster). */
  hideWhenEmpty?: boolean;
  className?: string;
}

export function StreakCard({ streak, hideWhenEmpty = false, className }: StreakCardProps) {
  const { user: authUser } = useUser();
  const db = useFirestore();

  // streak prop verilmediyse oturum sahibinin dokümanını oku.
  const userDocRef = useMemoFirebase(
    () => (streak === undefined && authUser ? doc(db, COLLECTIONS.users, authUser.uid) : null),
    [db, authUser?.uid, streak],
  );
  const { data, isLoading } = useDoc<UserStreakDoc>(userDocRef);

  const resolved: StreakState | null | undefined =
    streak !== undefined ? streak : data?.streak;

  const view = useMemo(() => {
    if (!resolved) return { current: 0, longest: 0, activeToday: false };
    return {
      current: effectiveCurrent(resolved),
      longest: resolved.longest ?? 0,
      activeToday: isStreakActiveToday(resolved),
    };
  }, [resolved]);

  // Henüz veri bekleniyorsa iskelet.
  if (streak === undefined && (isLoading || (authUser && data === undefined))) {
    return (
      <Card className={cn('p-5', className)} aria-busy="true">
        <div className="flex items-center gap-4">
          <Skeleton className="h-14 w-14 rounded-2xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-28 rounded-full" />
            <Skeleton className="h-4 w-20 rounded-full" />
          </div>
        </div>
      </Card>
    );
  }

  const isEmpty = view.current === 0 && view.longest === 0;
  if (isEmpty && hideWhenEmpty) return null;

  return (
    <Card
      className={cn('overflow-hidden p-5', className)}
      role="group"
      aria-label={`Seri: ${view.current} gün. En uzun seri ${view.longest} gün.`}
    >
      <div className="flex items-center gap-4">
        {/* Alev rozeti */}
        <div
          className={cn(
            'flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl transition',
            view.activeToday ? 'shadow-sm' : 'opacity-90',
          )}
          style={{
            background: view.activeToday
              ? 'linear-gradient(135deg, #ff7a59 0%, #f34723 100%)'
              : 'rgba(243,71,35,0.10)',
          }}
        >
          <Flame
            className="h-7 w-7"
            style={{ color: view.activeToday ? '#ffffff' : CORAL }}
            fill={view.activeToday ? '#ffffff' : 'transparent'}
            strokeWidth={2}
          />
        </div>

        <div className="min-w-0 flex-1">
          {isEmpty ? (
            <>
              <p className="text-base font-bold leading-tight">Serini başlat</p>
              <p className="text-sm text-muted-foreground">
                Bugün bir katkı yap, alevi yak 🧡
              </p>
            </>
          ) : (
            <>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-extrabold tabular-nums" style={{ color: CORAL }}>
                  {view.current}
                </span>
                <span className="text-base font-bold">gün seri</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {view.activeToday ? 'Bugün tamam 🧡 · ' : 'Bugün henüz boş · '}
                En uzun: <span className="font-semibold text-foreground">{view.longest} gün</span>
              </p>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}

export default StreakCard;
