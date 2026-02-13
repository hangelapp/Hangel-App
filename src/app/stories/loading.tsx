
import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="p-4 md:p-8">
      <div className="space-y-4 mb-8">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-5 w-2/3" />
      </div>
      <div className="flex gap-4 overflow-hidden">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="w-3/4 sm:w-1/2 md:w-1/3 lg:w-1/4 flex-shrink-0 pr-4">
             <Skeleton className="aspect-[3/4] w-full rounded-3xl" />
          </div>
        ))}
      </div>
    </div>
  );
}
