import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-10 w-36" />
            </div>
            <div className="space-y-4 rounded-lg border p-6">
                <Skeleton className="h-6 w-48 mb-4" />
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex gap-4 p-4 border rounded-lg">
                        <Skeleton className="h-24 w-48 rounded-md" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-5 w-3/4" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-3 w-1/2" />
                        </div>
                        <div className="flex flex-col gap-2">
                            <Skeleton className="h-9 w-24" />
                            <Skeleton className="h-9 w-24" />
                            <Skeleton className="h-9 w-24" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
