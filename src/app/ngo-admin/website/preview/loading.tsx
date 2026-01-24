import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
    return (
        <div className="p-4 space-y-8">
            <header className="flex justify-between items-center p-4 border-b">
                <div className="flex items-center gap-3">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <Skeleton className="h-7 w-48" />
                </div>
                <div className="flex gap-4">
                    <Skeleton className="h-5 w-20" />
                    <Skeleton className="h-5 w-20" />
                    <Skeleton className="h-5 w-20" />
                </div>
            </header>
            <div className="space-y-6">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-64 w-full" />
            </div>
        </div>
    )
}
