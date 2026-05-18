'use client';

import { contractsData } from '@/lib/contracts';
import { notFound, useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PublicFooter } from '@/components/layout/public-footer';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useMemo } from 'react';

export default function ContractDetailPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const db = useFirestore();

  // Önce Firestore'dan dene (super-admin tarafından düzenlenmiş içerik)
  const contractDocRef = useMemoFirebase(() => {
    if (!db || !slug) return null;
    return doc(db, 'contracts', slug);
  }, [db, slug]);
  const { data: firestoreContract, isLoading } = useDoc<{ slug: string; title: string; content: string }>(contractDocRef);

  // Firestore'da yoksa kod içi varsayılan içerik
  const contract = useMemo(() => {
    if (firestoreContract && firestoreContract.content) return firestoreContract;
    return contractsData.find(c => c.slug === slug) || null;
  }, [firestoreContract, slug]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!contract) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-white">
      <main className="p-4 space-y-6 animate-in fade-in-0 max-w-3xl mx-auto">
        <Button onClick={() => router.back()} variant="ghost" size="icon" className="mb-2 -ml-2" aria-label="Geri">
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold font-headline">{contract.title}</h1>
        </div>
        <article
          className="prose prose-sm sm:prose-base dark:prose-invert max-w-none space-y-4"
          dangerouslySetInnerHTML={{ __html: contract.content }}
        />
      </main>
      <PublicFooter currentPageLabel={contract.title} />
    </div>
  );
}
