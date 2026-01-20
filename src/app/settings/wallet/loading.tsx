import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="p-4 space-y-6">
       <Skeleton className="h-10 w-10" />
      <div className="space-y-2">
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-5 w-80" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <div className="border rounded-lg p-4 space-y-4">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-12 w-full" />
             <Skeleton className="h-12 w-full" />
        </div>
      </div>
    </div>
  );
}
