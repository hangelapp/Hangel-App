import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="p-4 sm:p-6 space-y-8">
      <div className="text-center space-y-4">
        <Skeleton className="h-20 w-20 rounded-full mx-auto" />
        <Skeleton className="h-8 w-3/4 mx-auto" />
        <Skeleton className="h-5 w-full max-w-xl mx-auto" />
        <div className="flex gap-4 justify-center">
            <Skeleton className="h-12 w-32" />
            <Skeleton className="h-12 w-32" />
        </div>
      </div>
      <Skeleton className="h-64 w-full rounded-lg" />
      <Skeleton className="h-64 w-full rounded-lg" />
    </div>
  );
}
