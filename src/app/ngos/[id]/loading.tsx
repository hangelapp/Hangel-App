import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="animate-in fade-in-0">
      <Skeleton className="h-40 w-full" />
      <div className="p-4 bg-background">
        <div className="flex gap-4 items-end -mt-16">
            <Skeleton className="h-24 w-24 rounded-lg border-4 border-background shrink-0" />
             <div className="flex-1 pb-2 flex justify-between items-end">
                <div className='space-y-2'>
                     <Skeleton className="h-7 w-48" />
                     <Skeleton className="h-5 w-32" />
                </div>
            </div>
        </div>
         <div className="flex gap-2 mt-4">
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-full" />
        </div>
      </div>
      <div className="p-4 space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    </div>
  );
}
