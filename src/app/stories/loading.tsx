import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center">
      <div className="relative w-full max-w-[450px] h-full max-h-[850px] bg-card overflow-hidden">
        <Skeleton className="w-full h-full" />
      </div>
    </div>
  );
}