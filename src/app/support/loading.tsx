import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-24 bg-[#f5f5f7]">
        <header className="container mx-auto text-center space-y-4">
            <Skeleton className="h-16 w-16 rounded-full mx-auto" />
            <Skeleton className="h-12 w-3/4 mx-auto" />
            <Skeleton className="h-6 w-1/2 mx-auto" />
        </header>

        <main className="container mx-auto space-y-20">
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-x-4 gap-y-8 max-w-4xl mx-auto">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="flex flex-col items-center gap-2">
                        <Skeleton className="h-16 w-16 rounded-full" />
                        <Skeleton className="h-4 w-12" />
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto">
                <Skeleton className="h-20 w-full rounded-2xl" />
                <Skeleton className="h-20 w-full rounded-2xl" />
                <Skeleton className="h-20 w-full rounded-2xl" />
            </div>

            <div className="max-w-xl mx-auto space-y-4">
                <Skeleton className="h-8 w-48 mx-auto" />
                <Skeleton className="h-14 w-full rounded-full" />
            </div>

             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center max-w-6xl mx-auto">
                <Skeleton className="aspect-[4/5] rounded-3xl" />
                <div className="space-y-4">
                    <Skeleton className="h-10 w-1/2" />
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-4/5" />
                    <Skeleton className="h-5 w-1/3" />
                </div>
            </div>

            <div className="max-w-6xl mx-auto space-y-8">
                 <Skeleton className="h-10 w-1/2 mx-auto" />
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Skeleton className="h-64 rounded-3xl" />
                    <Skeleton className="h-64 rounded-3xl" />
                    <Skeleton className="h-64 rounded-3xl" />
                 </div>
            </div>
        </main>
    </div>
  );
}
