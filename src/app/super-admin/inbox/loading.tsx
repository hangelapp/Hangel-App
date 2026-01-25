import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
    return (
        <div className="space-y-6">
            <Skeleton className="h-8 w-48" />
            <div className="rounded-lg border">
                <div className="p-6">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-64 mt-2" />
                </div>
                <div className="p-6 border-t">
                     <div className="flex gap-4">
                        <Skeleton className="h-10 w-1/2" />
                        <Skeleton className="h-10 w-1/2" />
                    </div>
                     <div className="mt-4 space-y-4">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="flex items-start gap-4 p-4 border rounded-lg">
                                <Skeleton className="h-6 w-6 mt-1" />
                                <div className="flex-1 space-y-2">
                                    <Skeleton className="h-5 w-1/2" />
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-3 w-1/4" />
                                </div>
                                <Skeleton className="h-9 w-32" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
