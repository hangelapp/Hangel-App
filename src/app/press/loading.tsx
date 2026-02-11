
import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-24">
        <header className="container mx-auto">
            <Skeleton className="h-10 w-32" />
        </header>

        <main className="container mx-auto space-y-24">
            <div className="text-center space-y-6">
                <Skeleton className="h-20 w-3/4 mx-auto" />
                <Skeleton className="h-6 w-1/2 mx-auto" />
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <Skeleton className="h-32 w-full rounded-2xl" />
                <Skeleton className="h-32 w-full rounded-2xl" />
                <Skeleton className="h-32 w-full rounded-2xl" />
                <Skeleton className="h-32 w-full rounded-2xl" />
            </div>

            <div className="space-y-4">
                <Skeleton className="h-10 w-56" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
            </div>

            <div className="space-y-8">
                <div className="flex justify-center gap-4">
                    <Skeleton className="h-14 w-32" />
                    <Skeleton className="h-14 w-32" />
                    <Skeleton className="h-14 w-32" />
                    <Skeleton className="h-14 w-32" />
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                     <Skeleton className="h-48 w-full rounded-2xl" />
                     <Skeleton className="h-48 w-full rounded-2xl" />
                     <Skeleton className="h-48 w-full rounded-2xl" />
                     <Skeleton className="h-48 w-full rounded-2xl" />
                </div>
            </div>

            <Skeleton className="h-48 w-full rounded-3xl" />
        </main>
    </div>
  );
}
