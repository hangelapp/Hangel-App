'use client';

import React, { useMemo } from 'react';
import Image from 'next/image';
import { PublicFooter } from '@/components/layout/public-footer';
import { Loader2, Download, FileText, Presentation as PresentationIcon } from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { COLLECTIONS } from '@/firebase/collections';
import { categoryLabel, type MarketingAsset } from '@/lib/marketing-kit';

export default function TanitimPage() {
  const db = useFirestore();

  // Kimliksiz erişilebilir: rules yalnız publicListed==true dokümanlarını açar.
  const assetsQuery = useMemoFirebase(
    () => (db ? query(collection(db, COLLECTIONS.marketingAssets), where('publicListed', '==', true)) : null),
    [db],
  );
  const { data: assets, isLoading } = useCollection<MarketingAsset>(assetsQuery);

  const items = useMemo(() => {
    if (!assets) return [];
    return [...assets].sort((a, b) => {
      // Sunumları öne al, sonra en yeni.
      if (a.category === 'sunum' && b.category !== 'sunum') return -1;
      if (b.category === 'sunum' && a.category !== 'sunum') return 1;
      return (b.createdAt || '').localeCompare(a.createdAt || '');
    });
  }, [assets]);

  return (
    <div className="min-h-screen bg-white font-sans selection:bg-primary/30 flex flex-col">
      {/* Hero */}
      <header className="bg-gradient-to-br from-primary/10 via-background to-background border-b">
        <div className="max-w-5xl mx-auto px-6 py-16 sm:py-20 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-primary mb-5">
            <PresentationIcon className="h-3.5 w-3.5" /> hangel Tanıtım
          </div>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tighter text-[#1d1d1f]">hangel’i Tanıyın</h1>
          <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            hangel’in kurumsal sunumu ve tanıtım materyalleri. Konferans, etkinlik ve toplantılarınızda
            görüntüleyin veya indirin.
          </p>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-12">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Yükleniyor...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <PresentationIcon className="h-14 w-14 mx-auto text-muted-foreground/30 mb-4" />
            <p className="italic">Şu an herkese açık tanıtım materyali yok.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((a) => {
              const isImage = (a.contentType || '').startsWith('image/');
              const preview = a.thumbnailUrl || (isImage ? a.fileUrl : null);
              return (
                <article key={a.id} className="rounded-2xl border border-black/5 shadow-sm overflow-hidden flex flex-col bg-white">
                  <div className="relative h-44 bg-muted/40 flex items-center justify-center">
                    {preview ? (
                      <Image src={preview} alt={a.title} fill className="object-cover" unoptimized />
                    ) : (
                      <FileText className="h-14 w-14 text-muted-foreground/40" />
                    )}
                  </div>
                  <div className="p-5 flex-1 flex flex-col gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-primary">{categoryLabel(a.category)}</span>
                    <h2 className="font-bold text-lg leading-tight text-[#1d1d1f]">{a.title}</h2>
                    {a.description && <p className="text-sm text-muted-foreground line-clamp-3">{a.description}</p>}
                    <a
                      href={a.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-auto inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90 transition"
                    >
                      <Download className="h-4 w-4" /> Görüntüle / İndir
                    </a>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      <PublicFooter currentPageLabel="hangel Tanıtım" />
    </div>
  );
}
