
import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="p-4 space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-5 w-full max-w-lg" />
      </div>
      <div className="space-y-6">
        <div className="space-y-4 rounded-lg border p-6">
            <Skeleton className="h-6 w-32" />
            <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-10 w-full" /></div>
            <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-20 w-full" /></div>
            <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-10 w-full" /></div>
        </div>
        <div className="space-y-4 rounded-lg border p-6">
            <Skeleton className="h-6 w-40" />
            <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-10 w-full" /></div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-10 w-full" /></div>
                <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-10 w-full" /></div>
            </div>
        </div>
         <div className="space-y-4 rounded-lg border p-6">
            <Skeleton className="h-6 w-56" />
            <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-10 w-full" /></div>
            <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-10 w-full" /></div>
            <div className="space-y-2"><Skeleton className="h-4 w-24" /><Skeleton className="h-10 w-full" /></div>
        </div>
        <Skeleton className="h-12 w-full" />
      </div>
    </div>
  );
}
