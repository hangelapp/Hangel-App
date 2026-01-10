import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="p-4 space-y-4">
      <Skeleton className="h-10 w-full" />
      <div className="flex gap-2">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-24" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        {[...Array(6)].map((_, i) => (
            <div key={i} className="border rounded-lg p-4 space-y-2">
                <Skeleton className="h-16 w-16 rounded-full mx-auto" />
                <Skeleton className="h-5 w-3/4 mx-auto" />
                <Skeleton className="h-4 w-1/2 mx-auto" />
                <Skeleton className="h-9 w-full" />
            </div>
        ))}
      </div>
    </div>
  );
}
