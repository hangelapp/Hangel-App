import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="p-4 flex items-center justify-center min-h-[calc(100vh-10rem)]">
      <div className="w-full max-w-sm space-y-4">
        <Skeleton className="h-8 w-3/4 mx-auto" />
        <Skeleton className="h-5 w-full mx-auto" />
        <Skeleton className="h-5 w-5/6 mx-auto" />
        <div className="p-4 border rounded-lg space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
        </div>
      </div>
    </div>
  );
}
