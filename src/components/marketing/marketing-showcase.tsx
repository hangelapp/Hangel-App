'use client';

// hangel tanıtım vitrini — herkese açık (publicListed) materyalleri kart ızgarası
// olarak gösterir. Hem public /tanitim sayfasında hem super-admin önizlemesinde
// (/super-admin/marketing-kit/tanitim) kullanılır; tek kaynaktan render edilir.

import React, { useMemo } from 'react';
import Image from 'next/image';
import { Loader2, Download, FileText, Presentation as PresentationIcon } from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { COLLECTIONS } from '@/firebase/collections';
import { categoryLabel, type MarketingAsset } from '@/lib/marketing-kit';

export function MarketingShowcase() {
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

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Yükleniyor...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <PresentationIcon className="h-14 w-14 mx-auto text-muted-foreground/30 mb-4" />
        <p className="italic">Şu an herkese açık tanıtım materyali yok.</p>
      </div>
    );
  }

  return (
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
  );
}
