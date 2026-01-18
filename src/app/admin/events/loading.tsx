import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="p-4 space-y-4">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-10 w-full" />
        <div className="flex gap-2">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
        </div>
        <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
                <div key={i} className="p-4 border rounded-lg space-y-3">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-5 w-32" />
                    <div className="flex items-center gap-2">
                       <Skeleton className="h-4 w-4" />
                       <Skeleton className="h-4 w-20" />
                    </div>
                    <Skeleton className="h-9 w-full" />
                </div>
            ))}
        </div>
    </div>
  );
}
