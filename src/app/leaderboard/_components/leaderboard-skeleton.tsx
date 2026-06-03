'use client';

/**
 * LeaderboardSkeleton — yüklenirken shimmer placeholder.
 *
 * Hero + podium + 7 row için Tailwind `animate-pulse` ile skeleton render eder.
 */

import { Skeleton } from '@/components/ui/skeleton';

export function LeaderboardSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-40 rounded-3xl sm:h-48" />
      <div className="grid grid-cols-1 gap-3 sm:hidden">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-28 rounded-3xl" />
        ))}
      </div>
      <div className="hidden grid-cols-3 items-end gap-3 sm:grid">
        <Skeleton className="h-32 rounded-3xl" />
        <Skeleton className="h-44 rounded-3xl" />
        <Skeleton className="h-32 rounded-3xl" />
      </div>
      <div className="space-y-2">
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-16 rounded-3xl" />
        ))}
      </div>
    </div>
  );
}
