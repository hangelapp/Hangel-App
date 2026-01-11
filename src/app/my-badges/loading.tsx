import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="p-4 space-y-6">
      <Skeleton className="h-8 w-56" />

      <Skeleton className="h-28 w-full" />
      
      <div>
        <Skeleton className="h-7 w-32 mb-2" />
        <div className="grid grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-36 w-full rounded-lg" />
          ))}
        </div>
      </div>
      
       <div>
        <Skeleton className="h-7 w-40 mb-2" />
        <Skeleton className="h-24 w-full rounded-lg" />
      </div>
    </div>
  );
}
