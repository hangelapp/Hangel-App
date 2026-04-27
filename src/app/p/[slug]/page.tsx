'use client';

import { notFound, useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PublicFooter } from '@/components/layout/public-footer';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import Image from 'next/image';

export default function SitePageView() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const db = useFirestore();

  const pageDocRef = useMemoFirebase(() => {
    if (!db || !slug) return null;
    return doc(db, 'sitePages', slug);
  }, [db, slug]);

  const { data: page, isLoading } = useDoc<any>(pageDocRef);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!page) {
    notFound();
  }

  if (page.published === false) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-white">
      <main className="animate-in fade-in-0">
        <div className="max-w-3xl mx-auto p-4 sm:p-6">
          <Button onClick={() => router.back()} variant="ghost" size="icon" className="mb-2 -ml-2">
            <ArrowLeft className="h-6 w-6" />
          </Button>

          {page.category && (
            <p className="text-xs font-bold uppercase tracking-widest text-primary mt-4">{page.category}</p>
          )}

          <h1 className="text-3xl md:text-4xl font-black tracking-tight mt-2">{page.title}</h1>

          {page.excerpt && (
            <p className="text-lg text-muted-foreground mt-3 leading-relaxed">{page.excerpt}</p>
          )}

          {page.coverImageUrl && (
            <div className="relative aspect-[16/9] mt-6 rounded-2xl overflow-hidden border bg-muted">
              <Image
                src={page.coverImageUrl}
                alt={page.title}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          )}

          <article
            className="prose prose-sm sm:prose-base max-w-none mt-8 space-y-4"
            dangerouslySetInnerHTML={{ __html: page.content || '' }}
          />
        </div>
      </main>
      <PublicFooter currentPageLabel={page.title} />
    </div>
  );
}
