import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-dvh p-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-2">
          <Skeleton className="h-8 w-32 mx-auto" />
          <Skeleton className="h-5 w-64 mx-auto" />
        </div>
        <div className="space-y-4">
            <div className="flex gap-2 border rounded-md p-1">
                <Skeleton className="h-9 w-1/2" />
                <Skeleton className="h-9 w-1/2" />
            </div>
            <div className="space-y-4 pt-4">
                <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-full" />
                </div>
                <Skeleton className="h-10 w-full" />
            </div>
        </div>
      </div>
    </div>
  );
}
