'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, RotateCcw, Home, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function MessagesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    console.error('[hangel:error-boundary]', error);
  }, [error]);

  const message = error?.message || '(boş mesaj)';
  const shortMessage = message.length < 240 ? message : message.slice(0, 240) + '…';

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center animate-in fade-in-0">
      <AlertTriangle className="h-14 w-14 text-destructive mb-4" aria-hidden="true" />
      <h1 className="text-xl font-semibold font-headline">Bir sorun oluştu</h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground break-words">{shortMessage}</p>
      {error?.digest && (
        <p className="mt-1 text-[10px] text-muted-foreground/70 font-mono">digest: {error.digest}</p>
      )}
      {error?.name && error.name !== 'Error' && (
        <p className="mt-0.5 text-[10px] text-muted-foreground/70 font-mono">name: {error.name}</p>
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
        <Button variant="ghost" size="sm" onClick={() => setShowDetails((v) => !v)}>
          <Bug className="mr-2 h-4 w-4" /> {showDetails ? 'Gizle' : 'Teknik detayı göster'}
        </Button>
      </div>
      {showDetails && (
        <pre className="mt-4 max-h-96 max-w-2xl w-full overflow-auto rounded-lg border bg-muted/40 p-3 text-[10px] text-left font-mono whitespace-pre-wrap break-words">
{[
  `name: ${error?.name || '(none)'}`,
  `message: ${error?.message || '(empty)'}`,
  `digest: ${error?.digest || '(none)'}`,
  '---',
  error?.stack || '(no stack)',
].join('\n')}
        </pre>
      )}
    </div>
  );
}
