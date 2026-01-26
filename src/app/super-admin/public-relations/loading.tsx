
import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
    return (
        <div className="space-y-6">
            <Skeleton className="h-8 w-64" />
            <div className="space-y-4 rounded-lg border p-6">
                <Skeleton className="h-6 w-48 mb-4" />
                <Skeleton className="h-24 w-full" />
            </div>
        </div>
    );
}
