import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Skeleton className="h-10 w-10" />
        <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-5 w-80" />
        </div>
      </div>
      <div className="space-y-4 rounded-lg border p-6">
        <Skeleton className="h-10 w-full mb-4" />
        <Skeleton className="h-6 w-32" />
        <div className="space-y-4 pt-4">
            <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-10 w-full" /></div>
            <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-10 w-full" /></div>
            <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-20 w-full" /></div>
        </div>
      </div>
    </div>
  );
}
