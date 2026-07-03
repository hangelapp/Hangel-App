'use client';

import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Download, FileText, Megaphone, Globe } from 'lucide-react';
import Image from 'next/image';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { COLLECTIONS } from '@/firebase/collections';
import { useActiveEntity } from '@/app/ngo-admin/active-entity-context';
import {
  MARKETING_CATEGORIES,
  categoryLabel,
  starterMarketingAssets,
  type MarketingAsset,
  type MarketingTargetKind,
} from '@/lib/marketing-kit';

function formatBytes(bytes?: number): string {
  if (!bytes) return '';
  const units = ['B', 'KB', 'MB', 'GB'];
  let v = bytes;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) { v /= 1024; i++; }
  return `${v.toFixed(v >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
}

export default function OrgMarketingKitPage() {
  const db = useFirestore();
  const { kind, isLoading: entityLoading } = useActiveEntity();

  // Yalnız yayında olanları çek (rules: where('status','==','yayinda') gerekli).
  // Hedef kitle filtresi client tarafında (targetKinds çoklu olabildiği için).
  const assetsQuery = useMemoFirebase(
    () => (db ? query(collection(db, COLLECTIONS.marketingAssets), where('status', '==', 'yayinda')) : null),
    [db],
  );
  const { data: assets, isLoading } = useCollection<MarketingAsset>(assetsQuery);

  const myKind = (kind as MarketingTargetKind | null) ?? null;

  const visible = useMemo(() => {
    // Yerleşik başlangıç paketi + Firestore'daki yayınlanmış materyaller.
    // seedKey ile tekilleştir: aynı seedKey'de Firestore sürümü yerleşiğin yerine geçer.
    const bySeed = new Map<string, MarketingAsset>();
    for (const b of starterMarketingAssets()) bySeed.set(b.seedKey || b.id, b);
    for (const a of assets || []) bySeed.set(a.seedKey || a.id, a);
    return [...bySeed.values()]
      .filter((a) => !myKind || (a.targetKinds || []).includes(myKind))
      .sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  }, [assets, myKind]);

  const grouped = useMemo(() => {
    return MARKETING_CATEGORIES
      .map((c) => ({ category: c, items: visible.filter((a) => a.category === c.value) }))
      .filter((g) => g.items.length > 0);
  }, [visible]);

  if (isLoading || entityLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Tanıtım Araçları Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in-0">
      <div className="space-y-1">
        <h1 className="text-3xl font-black tracking-tighter text-foreground flex items-center gap-2">
          <Megaphone className="h-7 w-7 text-primary" /> Tanıtım Araçları
        </h1>
        <p className="text-muted-foreground text-sm font-medium">
          hangel ekibinin sizin için hazırladığı tanıtım materyallerini indirin ve kullanın: sunum, sosyal medya
          içerikleri, döner kartlar, mağaza içi ekipmanlar, kasa önü A5 kartlar ve örümcek stand görselleri.
        </p>
      </div>

      {visible.length === 0 ? (
        <Card className="rounded-[2rem] border-border shadow-xl">
          <CardContent className="p-16 text-center text-muted-foreground">
            <Megaphone className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="italic">Şu an indirilebilir tanıtım materyali yok. Yeni materyaller eklendikçe burada görünecek.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {grouped.map(({ category, items }) => (
            <div key={category.value} className="space-y-3">
              <div className="space-y-0.5">
                <h2 className="text-lg font-bold text-foreground">{category.label}</h2>
                <p className="text-xs text-muted-foreground">{category.description}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map((a) => {
                  const isImage = (a.contentType || '').startsWith('image/');
                  const preview = a.thumbnailUrl || (isImage ? a.fileUrl : null);
                  return (
                    <Card key={a.id} className="rounded-2xl border-border shadow-sm overflow-hidden flex flex-col">
                      <div className="relative h-40 bg-muted/40 flex items-center justify-center">
                        {preview ? (
                          <Image src={preview} alt={a.title} fill className="object-cover" unoptimized />
                        ) : (
                          <FileText className="h-12 w-12 text-muted-foreground/40" />
                        )}
                        {a.isPublic && (
                          <Badge className="absolute top-2 left-2 bg-[#042654] text-white text-[9px] font-black uppercase gap-1">
                            <Globe className="h-2.5 w-2.5" />Herkese açık
                          </Badge>
                        )}
                      </div>
                      <CardContent className="p-4 flex-1 flex flex-col gap-2">
                        <div className="space-y-1">
                          <Badge variant="outline" className="text-[9px] font-bold uppercase">{categoryLabel(a.category)}</Badge>
                          <h3 className="font-bold text-sm leading-tight line-clamp-2">{a.title}</h3>
                          {a.description && <p className="text-xs text-muted-foreground line-clamp-3">{a.description}</p>}
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-auto truncate">
                          {a.fileName}{a.fileSize ? ` · ${formatBytes(a.fileSize)}` : ''}
                        </p>
                        <Button asChild className="rounded-xl font-bold w-full mt-1">
                          <a href={a.fileUrl} download={a.fileName} target="_blank" rel="noopener noreferrer">
                            <Download className="mr-2 h-4 w-4" /> İndir
                          </a>
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
