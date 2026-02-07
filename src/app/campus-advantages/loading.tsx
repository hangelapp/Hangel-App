import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="p-4 sm:p-6 space-y-8 min-h-screen bg-[#f5f5f7]">
      <div className="container mx-auto">
        <Skeleton className="h-10 w-24 rounded-full mb-16" />
        <div className="text-center space-y-4 mb-20">
            <Skeleton className="h-6 w-48 mx-auto rounded-full" />
            <Skeleton className="h-20 w-3/4 mx-auto" />
            <Skeleton className="h-12 w-1/2 mx-auto" />
        </div>
        <div className="grid md:grid-cols-2 gap-6">
            <Skeleton className="h-[450px] w-full rounded-[2.5rem]" />
            <Skeleton className="h-[450px] w-full rounded-[2.5rem]" />
        </div>
      </div>
    </div>
  );
}
