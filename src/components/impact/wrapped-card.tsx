'use client';

/**
 * Etki Wrapped — paylaşılabilir özet kartı (9:16, Apple iPhone dili).
 *
 * Spotify Wrapped final ekranı gibi: coral gradyan, büyük rakamlar,
 * glassmorphism. html2canvas ile görsele dönüştürülüp Web Share / indirme
 * ile paylaşılır (mevcut unified-story-card / story-designs deseni).
 */

import React, { useRef, useState } from 'react';
import { Download, Share2, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';

export interface WrappedCardData {
  name: string;
  avatarUrl?: string;
  periodLabel: string;            // "Haziran 2026" | "2026"
  periodKind: 'month' | 'year';
  totalVolunteerHours: number;
  donationCount: number;
  eventCount: number;
  impactScore: number;
  estimatedLivesTouched: number;
  topArea: string | null;
}

const fmt = (n: number) => (Number.isFinite(n) ? n.toLocaleString('tr-TR') : '0');

export function WrappedCard({ data }: { data: WrappedCardData }) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const { toast } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const renderAsBlob = async (): Promise<Blob | null> => {
    if (!cardRef.current) return null;
    const { default: html2canvas } = await import('html2canvas');
    const canvas = await html2canvas(cardRef.current, {
      backgroundColor: null,
      scale: 3,
      useCORS: true,
      logging: false,
    });
    return new Promise((resolve) => canvas.toBlob((b) => resolve(b), 'image/png'));
  };

  const fileName = `hangel-etki-hikayem-${data.periodLabel.replace(/\s+/g, '-').toLowerCase()}.png`;

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const blob = await renderAsBlob();
      if (!blob) throw new Error('canvas-empty');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({ title: 'İndirildi', description: 'Etki hikayen telefonuna kaydedildi.' });
    } catch {
      toast({ variant: 'destructive', title: 'İndirilemedi', description: 'Lütfen tekrar dene.' });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShare = async () => {
    setIsSharing(true);
    try {
      const blob = await renderAsBlob();
      if (!blob) throw new Error('canvas-empty');
      const file = new File([blob], fileName, { type: 'image/png' });
      const nav = typeof navigator !== 'undefined'
        ? (navigator as Navigator & { canShare?: (d?: ShareData) => boolean })
        : null;
      if (nav?.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'hangel etki hikayem',
          text: `${data.name} — ${data.periodLabel} hangel etki hikayem`,
        });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast({ title: 'Hikaye indirildi', description: 'Paylaşmak için galerine gidebilirsin.' });
      }
    } catch {
      toast({ variant: 'destructive', title: 'Paylaşılamadı', description: 'Lütfen tekrar dene.' });
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="mx-auto w-full max-w-md overflow-hidden">
        <div
          ref={cardRef}
          className="relative w-full aspect-[9/16] rounded-[2.5rem] overflow-hidden text-white shadow-2xl"
          style={{
            background: 'radial-gradient(130% 100% at 50% 0%, #f34723 0%, #b3270f 38%, #1a0703 78%, #000000 100%)',
          }}
        >
          {/* Glow yumuşatıcılar — kontrast için düşük opaklık (<=20%), mobilde küçük */}
          <div className="absolute top-0 right-0 w-48 h-48 sm:w-72 sm:h-72 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3 opacity-20" style={{ backgroundColor: '#ff7a52' }} />
          <div className="absolute bottom-0 left-0 w-44 h-44 sm:w-64 sm:h-64 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3 opacity-[0.18]" style={{ backgroundColor: '#f34723' }} />
          {/* Koyu alt zemin — metin okunabilirliği için scrim */}
          <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/40 to-transparent" />

          <div className="relative h-full flex flex-col p-7">
            {/* Header */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-[0.3em] opacity-95">hangel</span>
              <span className="text-xs font-medium opacity-90">etki hikayem</span>
            </div>

            {/* Kullanıcı + dönem */}
            <div className="flex flex-col items-center text-center mt-5 space-y-2.5">
              <Avatar className="h-20 w-20 ring-4 ring-white/20 shadow-xl">
                <AvatarImage src={data.avatarUrl} alt={data.name} />
                <AvatarFallback className="text-2xl font-black bg-white/15 text-white">
                  {(data.name || '?').charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <p className="text-sm font-bold tracking-tight text-white">{data.name}</p>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-white bg-white/20 rounded-full px-3 py-1">
                {data.periodKind === 'month' ? 'Bu Ay' : 'Bu Yıl'} · {data.periodLabel}
              </p>
            </div>

            {/* Hero — dokunulan can */}
            <div className="relative flex flex-col items-center mt-5">
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-white/90">Dokunduğun Tahmini Can</p>
              <p
                className="text-7xl font-black tracking-tighter tabular-nums leading-none mt-1 text-white"
                style={{ textShadow: '0 4px 30px rgba(0,0,0,0.5)' }}
              >
                {fmt(data.estimatedLivesTouched)}
              </p>
            </div>

            {/* 2x2 metrik grid */}
            <div className="grid grid-cols-2 gap-2 mt-5">
              <StatTile label="Gönüllülük" value={`${fmt(data.totalVolunteerHours)} sa`} />
              <StatTile label="Etkinlik" value={fmt(data.eventCount)} />
              <StatTile label="Destek" value={fmt(data.donationCount)} />
              <StatTile label="Etki Puanı" value={fmt(data.impactScore)} />
            </div>

            {/* En çok katkı alanı */}
            {data.topArea && (
              <div className="mt-3 flex items-center justify-center gap-2 bg-white/15 backdrop-blur-md rounded-full px-4 py-2 mx-auto border border-white/20">
                <span className="text-xs font-bold uppercase tracking-widest text-white/90">En Çok Katkı</span>
                <span className="text-xs font-black text-white">{data.topArea}</span>
              </div>
            )}

            {/* Footer */}
            <div className="mt-auto pt-4 text-center">
              <p className="text-xs font-medium tracking-[0.25em] text-white/80">hangel.org</p>
            </div>
          </div>
        </div>
      </div>

      {/* Aksiyonlar */}
      <div className="flex gap-2 max-w-md mx-auto">
        <Button onClick={handleDownload} disabled={isDownloading} className="flex-1 h-12 rounded-2xl font-bold">
          {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Download className="mr-2 h-4 w-4" /> İndir</>}
        </Button>
        <Button onClick={handleShare} disabled={isSharing} variant="outline" className="flex-1 h-12 rounded-2xl font-bold">
          {isSharing ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Share2 className="mr-2 h-4 w-4" /> Paylaş</>}
        </Button>
      </div>
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white/15 backdrop-blur-md rounded-2xl px-3 py-2.5 border border-white/20">
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-white/90 truncate">{label}</p>
      <p className="text-base font-black tabular-nums leading-tight mt-0.5 truncate text-white">{value}</p>
    </div>
  );
}
