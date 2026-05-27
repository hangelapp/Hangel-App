'use client';

import { contractsData } from '@/lib/contracts';
import { notFound, useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useMemo } from 'react';
import { sanitizeHtml } from '@/lib/sanitize-html';
import { COLLECTIONS } from '@/firebase/collections';

export default function ContractDetailPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const db = useFirestore();

  // Önce Firestore'dan dene (super-admin tarafından düzenlenmiş içerik)
  const contractDocRef = useMemoFirebase(() => {
    if (!db || !slug) return null;
    return doc(db, COLLECTIONS.contracts, slug);
  }, [db, slug]);
  const { data: firestoreContract, isLoading } = useDoc<{ slug: string; title: string; content: string }>(contractDocRef);

  // Firestore'da yoksa kod içi varsayılan içerik
  const contract = useMemo(() => {
    if (firestoreContract && firestoreContract.content) return firestoreContract;
    return contractsData.find(c => c.slug === slug) || null;
  }, [firestoreContract, slug]);

  // App settings sayfaları tasarımı: standart p-4 + Card. PublicFooter kaldırıldı
  // (settings layout zaten footer + max-w sağlar).
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-dvh">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!contract) {
    notFound();
  }

  return (
    <div className="p-4 space-y-6 animate-in fade-in-0">
      <Button onClick={() => router.back()} variant="ghost" size="icon" className="mb-2 -ml-2" aria-label="Geri">
        <ArrowLeft className="h-6 w-6" />
      </Button>
      <div>
        <h1 className="text-2xl font-bold font-headline">{contract.title}</h1>
      </div>
      <Card>
        <CardContent className="pt-6">
          <article
            className="prose prose-sm sm:prose-base dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(contract.content) }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
