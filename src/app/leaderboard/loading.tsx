import { LeaderboardSkeleton } from './_components/leaderboard-skeleton';

export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-5 p-4 pb-32 sm:p-6">
      <LeaderboardSkeleton />
    </div>
  );
}
