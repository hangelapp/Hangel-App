
import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="p-4 sm:p-6 space-y-6">
      <Skeleton className="h-8 w-48" />
      
      <div className="flex items-center gap-4">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-8 w-64" />
      </div>

      <div className="space-y-4 rounded-lg border p-4">
        <Skeleton className="h-7 w-32 mb-4" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-3/4" />
      </div>
    </div>
  );
}
