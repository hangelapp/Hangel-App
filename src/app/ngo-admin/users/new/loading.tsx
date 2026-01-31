import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-2">
        <Skeleton className="h-10 w-10" />
        <Skeleton className="h-8 w-48" />
      </div>
      <div className="space-y-4 rounded-lg border p-6">
        <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
        </div>
        <div className="flex justify-end gap-2 pt-4">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-32" />
        </div>
      </div>
    </div>
  );
}
