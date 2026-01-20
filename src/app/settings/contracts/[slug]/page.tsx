'use client';

import { contractsData } from '@/lib/contracts';
import { notFound, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ContractDetailPage({ params }: { params: { slug: string } }) {
  const router = useRouter();
  const contract = contractsData.find(c => c.slug === params.slug);

  if (!contract) {
    notFound();
  }

  return (
    <div className="p-4 space-y-6 animate-in fade-in-0">
      <Button onClick={() => router.back()} variant="ghost" size="icon" className="mb-2 -ml-2">
        <ArrowLeft className="h-6 w-6" />
      </Button>
      <div>
        <h1 className="text-2xl font-bold font-headline">{contract.title}</h1>
      </div>
      <article
        className="prose prose-sm sm:prose-base dark:prose-invert max-w-none space-y-4"
        dangerouslySetInnerHTML={{ __html: contract.content }}
      />
    </div>
  );
}
