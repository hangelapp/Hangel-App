import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-5 w-80" />
      </div>
      <div className="space-y-4 rounded-lg border p-6">
        <Skeleton className="h-6 w-32 mb-2" />
        <Skeleton className="h-4 w-64 mb-4" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-10 w-40 mt-2" />
      </div>
      <div className="space-y-4 rounded-lg border p-6">
        <Skeleton className="h-6 w-48 mb-2" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    </div>
  );
}
