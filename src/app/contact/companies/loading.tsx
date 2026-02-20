import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="p-4 sm:p-6 space-y-8">
      <Skeleton className="h-10 w-10" />
      <div className="text-center space-y-4">
        <Skeleton className="h-20 w-20 rounded-full mx-auto" />
        <Skeleton className="h-8 w-3/4 mx-auto" />
        <Skeleton className="h-5 w-full max-w-xl mx-auto" />
      </div>

      <div className="p-6 border rounded-lg max-w-3xl mx-auto space-y-4">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-64" />
        <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-12 w-full" />
        </div>
      </div>
    </div>
  );
}
