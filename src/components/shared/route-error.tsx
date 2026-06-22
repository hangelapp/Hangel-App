'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { HeartCrack, RotateCcw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Marka uyumlu, yeniden kullanılabilir hata sınırı içeriği.
 * Apple estetiği + coral (--primary) + sıcak hangel söylemi.
 * Her route'taki ince `error.tsx` bunu render eder.
 */
export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[hangel:error-boundary]', error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center animate-in fade-in-0">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
        <HeartCrack className="h-8 w-8 text-primary" aria-hidden="true" />
      </div>
      <h1 className="text-xl font-semibold font-headline">
        Bir şeyler ters gitti — ama yalnız değilsin.
      </h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        Küçük bir aksilik oldu. Birlikte tekrar deneyelim; umudu büyütmeye kaldığımız
        yerden devam edebiliriz.
      </p>
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
