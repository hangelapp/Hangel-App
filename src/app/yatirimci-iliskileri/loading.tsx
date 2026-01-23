import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="text-center space-y-2">
        <Skeleton className="h-8 w-72 mx-auto" />
        <Skeleton className="h-5 w-full max-w-lg mx-auto" />
      </div>

      <div className="p-6 border rounded-lg space-y-4">
        <Skeleton className="h-7 w-40" />
        <div className="space-y-2">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-3/4" />
        </div>
        <div className="grid grid-cols-2 gap-4 pt-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
        </div>
      </div>

      <div className="p-6 border rounded-lg space-y-4">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-5 w-64" />
        <div className="space-y-3 pt-2">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
        </div>
      </div>

       <div className="p-6 border rounded-lg space-y-4">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-5 w-32" />
      </div>
    </div>
  );
}
