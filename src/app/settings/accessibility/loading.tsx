
import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="p-4 space-y-6 max-w-3xl mx-auto">
       <Skeleton className="h-10 w-10" />
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-5 w-80" />
      </div>
      <div className="space-y-6">
        {[...Array(5)].map((_, groupIndex) => (
            <div key={groupIndex} className="space-y-4 rounded-lg border p-6">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-64" />
                <div className="space-y-4 pt-4">
                    {[...Array(3)].map((__, itemIndex) => (
                        <div key={itemIndex} className="flex items-center justify-between">
                            <div className="space-y-2"><Skeleton className="h-5 w-40" /></div>
                            <Skeleton className="h-10 w-24 rounded-md" />
                        </div>
                    ))}
                </div>
            </div>
        ))}
      </div>
    </div>
  );
}
