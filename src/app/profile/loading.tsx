import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-32 w-full" />
      <div className="p-4 -mt-16">
        <Skeleton className="h-24 w-24 rounded-full border-4 border-background" />
      </div>
      <div className="p-4 space-y-2">
        <Skeleton className="h-7 w-1/2" />
        <Skeleton className="h-5 w-1/3" />
      </div>
      <div className="p-4 grid grid-cols-3 gap-4">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
      <div className="p-4">
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  );
}
