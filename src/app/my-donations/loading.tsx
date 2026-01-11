import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="p-4 space-y-4">
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-5 w-72" />
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-6 w-40 mt-4" />
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
        ))}
      </div>
    </div>
  );
}
