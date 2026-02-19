import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="animate-in fade-in-0">
       <Skeleton className="h-48 w-full" />
      <div className="p-4 bg-background">
        <div className="flex gap-4 items-center -mt-16">
            <Skeleton className="h-20 w-20 rounded-lg border-4 border-background" />
             <div className="space-y-1 pt-16">
                 <Skeleton className="h-7 w-48" />
                 <Skeleton className="h-5 w-32" />
            </div>
        </div>
         <div className="mt-4 space-y-2">
             <Skeleton className="h-16 w-full" />
             <Skeleton className="h-10 w-full" />
        </div>
      </div>
      <div className="p-4 space-y-4">
        <Skeleton className="h-48 w-full rounded-lg" />
        <Skeleton className="h-32 w-full rounded-lg" />
      </div>
    </div>
  );
}
