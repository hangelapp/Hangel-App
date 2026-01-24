import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-5 w-80" />
      </div>
      
      <div className="space-y-4 rounded-lg border p-6">
        <Skeleton className="h-6 w-32 mb-4" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-12 w-full mt-2" />
      </div>

       <div className="space-y-4 rounded-lg border p-6">
        <Skeleton className="h-6 w-48 mb-4" />
        <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-full" />
        </div>
        <Skeleton className="h-24 w-full" />
      </div>

       <div className="space-y-4 rounded-lg border p-6">
        <Skeleton className="h-6 w-32 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
        </div>
      </div>
      
       <div className="space-y-4 rounded-lg border p-6">
        <Skeleton className="h-6 w-48 mb-4" />
        <div className="space-y-2">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
        </div>
      </div>

      <div className="flex justify-end">
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
  );
}
