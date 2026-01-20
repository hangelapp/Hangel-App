import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="p-4 space-y-6">
       <Skeleton className="h-10 w-10" />
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-5 w-80" />
      </div>
      <div className="space-y-4 rounded-lg border p-6">
        {[...Array(6)].map((_, i) => (
            <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
            </div>
        ))}
        <div className="flex justify-end pt-4">
            <Skeleton className="h-10 w-32" />
        </div>
      </div>
    </div>
  );
}
