
import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-5 w-80" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-11 flex-1" />
        <Skeleton className="h-11 w-11" />
        <Skeleton className="h-11 w-11" />
      </div>
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="p-4 border rounded-lg space-y-3">
            <div className="flex justify-between">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-6 w-16" />
            </div>
            <Skeleton className="h-4 w-1/2" />
            <div className="flex gap-2">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-5 w-20" />
            </div>
            <Skeleton className="h-4 w-1/3" />
            <div className="flex gap-2 pt-2">
                <Skeleton className="h-9 flex-1" />
                <Skeleton className="h-9 flex-1" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
