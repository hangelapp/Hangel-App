import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="p-4 sm:p-6 space-y-8">
      <div className="text-center space-y-2">
        <Skeleton className="h-8 w-40 mx-auto" />
        <Skeleton className="h-5 w-72 mx-auto" />
      </div>
      
      <div className="space-y-6">
        {[...Array(7)].map((_, i) => (
            <div key={i} className="p-6 border rounded-lg space-y-4">
                <div className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-6 w-56" />
                </div>
                <Skeleton className="h-4 w-80" />
                <div className="space-y-2 pt-2">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                </div>
            </div>
        ))}
      </div>
    </div>
  );
}
