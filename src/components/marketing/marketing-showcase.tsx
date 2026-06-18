'use client';

// hangel tanıtım vitrini — herkese açık (publicListed) materyalleri kart ızgarası
// olarak gösterir. Hem public /tanitim sayfasında hem super-admin önizlemesinde
// (/super-admin/marketing-kit/tanitim) kullanılır; tek kaynaktan render edilir.

import React, { useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Loader2, Download, FileText, Presentation as PresentationIcon, Play } from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { COLLECTIONS } from '@/firebase/collections';
import { categoryLabel, type MarketingAsset } from '@/lib/marketing-kit';

// Apple-keynote tarzı tam-ekran konferans sunumu — herkese açık.
const KEYNOTE_HREF = '/gelir-modeli-konferanslari/sunum';

function KeynoteBanner() {
  return (
    <Link
      href={KEYNOTE_HREF}
      className="group block rounded-3xl overflow-hidden border border-black/5 shadow-lg bg-gradient-to-br from-[#f34723] to-[#ff7a4d] text-white"
    >
      <div className="p-7 sm:p-9 flex flex-col sm:flex-row sm:items-center gap-6">
        <div className="flex-1 space-y-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-[11px] font-bold uppercase tracking-widest">
            <PresentationIcon className="h-3.5 w-3.5" /> Konferans Sunumu
          </span>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tighter leading-tight">
            STK’larda Gelir Modeli Oluşturma ve Sürdürülebilirlik
          </h2>
          <p className="text-sm text-white/90 max-w-xl">
            Apple-keynote tarzı tam ekran sunum. Konferans ve eğitimlerde doğrudan açıp sunabilirsiniz.
          </p>
        </div>
        <div className="shrink-0">
          <span className="inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-3.5 text-base font-black text-[#f34723] shadow-md group-hover:scale-105 transition-transform">
            <Play className="h-5 w-5 fill-current" /> Sunumu Başlat
          </span>
        </div>
      </div>
    </Link>
  );
}

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

  return (
    <div className="space-y-10">
      <KeynoteBanner />

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Yükleniyor...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
          <p className="italic">İndirilebilir herkese açık materyal henüz yok.</p>
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
    </div>
  );
}
