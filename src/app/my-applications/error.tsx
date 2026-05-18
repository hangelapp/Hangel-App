'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function MyApplicationsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[hangel:error-boundary]', error);
  }, [error]);

  const safeMessage =
    error?.message && error.message.length < 240
      ? error.message
      : 'Beklenmeyen bir hata oluştu.';

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center animate-in fade-in-0">
      <AlertTriangle className="h-14 w-14 text-destructive mb-4" aria-hidden="true" />
      <h1 className="text-xl font-semibold font-headline">Bir sorun oluştu</h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">{safeMessage}</p>
      {process.env.NODE_ENV === 'development' && error?.digest && (
        <p className="mt-2 text-xs text-muted-foreground/80">digest: {error.digest}</p>
      )}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        <Button onClick={() => reset()} variant="default">
          <RotateCcw className="mr-2 h-4 w-4" /> Tekrar dene
        </Button>
        <Button asChild variant="outline">
          <Link href="/">
            <Home className="mr-2 h-4 w-4" /> Ana sayfa
          </Link>
        </Button>
      </div>
    </div>
  );
}
