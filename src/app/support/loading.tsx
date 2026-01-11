import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="p-4 space-y-6">
      <div className="text-center space-y-2">
        <Skeleton className="h-8 w-48 mx-auto" />
        <Skeleton className="h-5 w-64 mx-auto" />
      </div>
      
      <div className="space-y-4 rounded-lg border p-4">
        <Skeleton className="h-7 w-56 mb-4" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>

       <div className="space-y-4 rounded-lg border p-4">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-5 w-72 mb-4" />
        <div className='space-y-4'>
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-10 w-full" />
        </div>
      </div>
    </div>
  );
}
