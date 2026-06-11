'use client';

import Link from 'next/link';
import { collection, query, where, limit } from 'firebase/firestore';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { COLLECTIONS } from '@/firebase/collections';
import type { Volunteering } from '@/lib/types';
import { SiteRenderer, type NgoWithSite } from './SiteRenderer';

// Ortak çözümleyici: bir Firestore alanı ('shortLink' ya da 'siteSettings.domain')
// ile STK'yı bulur, YAYIN durumunu kontrol eder ve gönüllülük ilanlarını çekip
// SiteRenderer'a aktarır. /s/[slug] ve /d/[domain] rotaları bunu kullanır.

interface SiteResolverProps {
  field: 'shortLink' | 'siteSettings.domain';
  value: string;
}

function StatusScreen({ title, message }: { title: string; message: string }) {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-background px-6 py-16">
      <div className="max-w-md w-full text-center space-y-6">
        <Link href="https://hangel.org" target="_blank" rel="noopener noreferrer" className="inline-block text-3xl font-black tracking-tighter text-primary">
          hangel
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
        <p className="text-muted-foreground leading-relaxed">{message}</p>
        <Link
          href="https://hangel.org"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center rounded-full bg-primary px-8 h-12 font-bold text-primary-foreground shadow-lg hover:opacity-90 transition-opacity"
        >
          hangel'i keşfet
        </Link>
      </div>
    </div>
  );
}

export function SiteResolver({ field, value }: SiteResolverProps) {
  const db = useFirestore();

  const ngoQuery = useMemoFirebase(
    () => (db && value ? query(collection(db, COLLECTIONS.ngos), where(field, '==', value), limit(1)) : null),
    [db, field, value],
  );
  const { data: ngos, isLoading: ngoLoading } = useCollection<NgoWithSite>(ngoQuery);

  const ngo = ngos && ngos.length > 0 ? ngos[0] : null;
  const ngoId = ngo?.id ?? null;

  const volunteeringQuery = useMemoFirebase(
    () => (db && ngoId ? query(collection(db, COLLECTIONS.volunteering), where('ngoId', '==', ngoId)) : null),
    [db, ngoId],
  );
  const { data: opportunities } = useCollection<Volunteering>(volunteeringQuery);

  if (ngoLoading || !ngoQuery) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Site yükleniyor…</p>
      </div>
    );
  }

  if (!ngo) {
    return (
      <StatusScreen
        title="Site bulunamadı"
        message="Aradığınız sivil toplum kuruluşu sitesine ulaşılamadı. Bağlantıyı kontrol edip tekrar deneyebilirsiniz."
      />
    );
  }

  if (ngo.siteSettings?.published !== true) {
    return (
      <StatusScreen
        title="Bu site henüz yayında değil"
        message={`${ngo.name} sitesi şu anda hazırlanıyor. Bu kuruluşa hangel üzerinden ulaşabilirsiniz.`}
      />
    );
  }

  return <SiteRenderer ngo={ngo} opportunities={opportunities ?? []} />;
}
