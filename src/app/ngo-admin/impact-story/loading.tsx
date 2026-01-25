import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">
        <div className="relative w-full max-w-[450px] h-full max-h-[800px] aspect-[9/16] bg-muted rounded-2xl overflow-hidden">
            <Skeleton className="w-full h-full" />
        </div>
    </div>
  );
}
