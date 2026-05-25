'use client';

import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import {
  Sparkles, HandCoins, Handshake, Users, Award, Download, Share2,
  Heart, TrendingUp, Trophy, Loader2, Image as ImageIcon,
} from 'lucide-react';

type NGO = { id?: string; name?: string; avatarUrl?: string };
type Club = { id?: string; name?: string; avatarUrl?: string };

export type StoryInput = {
  name: string;
  avatarUrl?: string;
  impactScore: number;
  totalDonation: number;
  donationCount: number;
  supportedNgosCount: number;
  mostSupportedNgo?: string;
  volunteerHours: number;
  completedProjects: number;
  mostActiveVolunteerArea?: string;
  totalImpactValue: number;
  badgeCount: number;
  supportedNgos: NGO[];
  volunteerNgos: NGO[];
  joinedClubs: Club[];
};

type Design = {
  id: string;
  title: string;
  gradient: string;
  textColor: string;
  render: (d: StoryInput) => React.ReactNode;
};

const fmt = (n: number) => n.toLocaleString('tr-TR');

const DESIGNS: Design[] = [
  {
    id: 'impact',
    title: 'Etki Özeti',
    gradient: 'from-violet-600 via-fuchsia-600 to-pink-500',
    textColor: 'text-white',
    render: (d) => (
      <div className="flex flex-col items-center justify-between h-full text-white text-center p-6">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.25em] opacity-90">
          <Sparkles className="h-3.5 w-3.5" /> hangel
        </div>
        <div className="space-y-3">
          <Avatar className="h-20 w-20 mx-auto border-4 border-white/30 shadow-2xl">
            <AvatarImage src={d.avatarUrl} />
            <AvatarFallback className="text-2xl font-black bg-white/20 text-white">{d.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <p className="text-sm font-bold opacity-90">{d.name}</p>
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">Etki Puanım</p>
            <p className="text-7xl font-black tabular-nums leading-none drop-shadow-lg">{fmt(d.impactScore)}</p>
          </div>
        </div>
        <div className="space-y-2 text-xs font-bold opacity-90 text-center">
          <p>{fmt(d.volunteerHours)} saat gönüllülük</p>
          <p>{fmt(d.totalDonation)} ₺ bağış</p>
          <p className="text-[10px] uppercase tracking-widest opacity-70 pt-2">#hangel #iyilikhareketi</p>
        </div>
      </div>
    ),
  },
  {
    id: 'donation',
    title: 'Bağış Hikayem',
    gradient: 'from-rose-500 via-orange-500 to-amber-500',
    textColor: 'text-white',
    render: (d) => (
      <div className="flex flex-col items-center justify-between h-full text-white p-6">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.25em] opacity-90">
          <HandCoins className="h-3.5 w-3.5" /> Bağışlarım
        </div>
        <div className="space-y-4 text-center">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">Toplam Bağışım</p>
            <p className="text-6xl font-black tabular-nums leading-none drop-shadow">{fmt(d.totalDonation)} ₺</p>
          </div>
          <div className="flex items-center justify-center gap-6 text-xs font-bold opacity-95">
            <div>
              <p className="text-2xl font-black">{fmt(d.donationCount)}</p>
              <p className="text-[10px] uppercase tracking-wider opacity-80">Bağış</p>
            </div>
            <div className="w-px h-8 bg-white/30" />
            <div>
              <p className="text-2xl font-black">{fmt(d.supportedNgosCount)}</p>
              <p className="text-[10px] uppercase tracking-wider opacity-80">STK</p>
            </div>
          </div>
        </div>
        <div className="text-center space-y-2">
          {d.mostSupportedNgo ? (
            <>
              <p className="text-[10px] uppercase tracking-widest opacity-80">En Çok Desteklediğim</p>
              <p className="text-sm font-black">❤️ {d.mostSupportedNgo}</p>
            </>
          ) : null}
          <p className="text-[10px] uppercase tracking-widest opacity-70 pt-1">#hangel #bağışsever</p>
        </div>
      </div>
    ),
  },
  {
    id: 'volunteer',
    title: 'Gönüllülük Hikayem',
    gradient: 'from-emerald-600 via-teal-600 to-cyan-600',
    textColor: 'text-white',
    render: (d) => (
      <div className="flex flex-col items-center justify-between h-full text-white p-6">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.25em] opacity-90">
          <Handshake className="h-3.5 w-3.5" /> Gönüllülüğüm
        </div>
        <div className="space-y-4 text-center">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">Toplam Gönüllülük</p>
            <p className="text-7xl font-black tabular-nums leading-none drop-shadow">{fmt(d.volunteerHours)}</p>
            <p className="text-base font-bold uppercase tracking-widest opacity-90 mt-1">Saat</p>
          </div>
          <div className="space-y-2 pt-2">
            <p className="text-3xl font-black">{fmt(d.completedProjects)}</p>
            <p className="text-[10px] uppercase tracking-widest opacity-80">Tamamlanan Proje</p>
          </div>
        </div>
        <div className="text-center space-y-2">
          {d.mostActiveVolunteerArea ? (
            <>
              <p className="text-[10px] uppercase tracking-widest opacity-80">En Aktif Olduğum Alan</p>
              <p className="text-sm font-black">🌱 {d.mostActiveVolunteerArea}</p>
            </>
          ) : null}
          <p className="text-[10px] uppercase tracking-widest opacity-70 pt-1">#hangel #gönüllülük</p>
        </div>
      </div>
    ),
  },
  {
    id: 'community',
    title: 'Topluluğum',
    gradient: 'from-sky-600 via-blue-600 to-indigo-700',
    textColor: 'text-white',
    render: (d) => {
      const items = [...d.supportedNgos, ...d.volunteerNgos, ...d.joinedClubs].slice(0, 9);
      return (
        <div className="flex flex-col items-center justify-between h-full text-white p-6">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.25em] opacity-90">
            <Users className="h-3.5 w-3.5" /> Topluluğum
          </div>
          <div className="space-y-4 text-center w-full">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">Birlikte Çalıştığım</p>
              <p className="text-5xl font-black tabular-nums leading-none drop-shadow">
                {d.supportedNgos.length + d.volunteerNgos.length + d.joinedClubs.length}
              </p>
              <p className="text-xs font-bold uppercase tracking-widest opacity-90 mt-1">Kuruluş & Kulüp</p>
            </div>
            {items.length > 0 && (
              <div className="grid grid-cols-3 gap-2 w-full max-w-[240px] mx-auto">
                {items.map((it, i) => (
                  <Avatar key={i} className="h-16 w-16 border-2 border-white/30 mx-auto">
                    <AvatarImage src={it.avatarUrl} />
                    <AvatarFallback className="text-xs font-bold bg-white/20 text-white">{(it.name || '?').charAt(0)}</AvatarFallback>
                  </Avatar>
                ))}
              </div>
            )}
          </div>
          <p className="text-[10px] uppercase tracking-widest opacity-70 text-center">#hangel #topluluk</p>
        </div>
      );
    },
  },
  {
    id: 'achievements',
    title: 'Başarılarım',
    gradient: 'from-amber-500 via-rose-500 to-purple-600',
    textColor: 'text-white',
    render: (d) => (
      <div className="flex flex-col items-center justify-between h-full text-white p-6">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.25em] opacity-90">
          <Trophy className="h-3.5 w-3.5" /> Başarılarım
        </div>
        <div className="space-y-4 text-center">
          <Award className="h-24 w-24 mx-auto drop-shadow-2xl" />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">Kazandığım Rozet</p>
            <p className="text-7xl font-black tabular-nums leading-none drop-shadow">{fmt(d.badgeCount)}</p>
          </div>
          <div className="pt-2">
            <p className="text-[10px] uppercase tracking-widest opacity-80">Sosyal Etki Değerim</p>
            <p className="text-3xl font-black tabular-nums drop-shadow">{fmt(d.totalImpactValue)} ₺</p>
          </div>
        </div>
        <p className="text-[10px] uppercase tracking-widest opacity-70 text-center">#hangel #etki #başarı</p>
      </div>
    ),
  },
];

export function StoryDesigns({ data }: { data: StoryInput }) {
  const { toast } = useToast();
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const downloadAsImage = async (designId: string) => {
    const el = cardRefs.current[designId];
    if (!el) return;
    setBusy(designId);
    try {
      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(el, {
        scale: 3,
        backgroundColor: null,
        useCORS: true,
        logging: false,
      });
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `hangel-hikaye-${designId}-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
      toast({ title: 'Görsel indirildi', description: 'Hikaye paylaşıma hazır!' });
    } catch (err) {
      const e = err as { message?: string };
      toast({ variant: 'destructive', title: 'İndirilemedi', description: e?.message || 'Beklenmeyen hata' });
    } finally {
      setBusy(null);
    }
  };

  const shareCard = async (designId: string) => {
    const el = cardRefs.current[designId];
    if (!el) return;
    setBusy(designId);
    try {
      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(el, { scale: 3, backgroundColor: null, useCORS: true, logging: false });
      canvas.toBlob(async (blob) => {
        if (!blob) {
          toast({ variant: 'destructive', title: 'Paylaşım başarısız', description: 'Görsel oluşturulamadı.' });
          setBusy(null);
          return;
        }
        const file = new File([blob], `hangel-hikaye-${designId}.png`, { type: 'image/png' });
        const shareData: ShareData = {
          title: 'Hangel Etki Hikayem',
          text: `Hangel'deki etki hikayem! #hangel #iyilikhareketi`,
          files: [file],
        };
        const nav = navigator as Navigator & { canShare?: (data?: ShareData) => boolean };
        if (nav.canShare && nav.canShare(shareData)) {
          try {
            await navigator.share(shareData);
          } catch { /* user iptal */ }
        } else {
          // Web Share desteklenmiyor → indirme fallback
          const link = document.createElement('a');
          link.download = `hangel-hikaye-${designId}.png`;
          link.href = URL.createObjectURL(blob);
          link.click();
          toast({ title: 'Cihazın paylaşımı desteklemiyor', description: 'Görseli indirdik; oradan paylaşabilirsin.' });
        }
        setBusy(null);
      }, 'image/png');
    } catch (err) {
      const e = err as { message?: string };
      toast({ variant: 'destructive', title: 'Paylaşılamadı', description: e?.message || 'Beklenmeyen hata' });
      setBusy(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {DESIGNS.map((design) => (
          <div key={design.id} className="space-y-2">
            <div className="relative mx-auto" style={{ width: '100%', maxWidth: 270 }}>
              {/* 9:16 aspect ratio story card */}
              <div
                ref={(el) => { cardRefs.current[design.id] = el; }}
                className={`relative w-full aspect-[9/16] rounded-2xl overflow-hidden shadow-xl bg-gradient-to-br ${design.gradient}`}
              >
                {/* dekoratif glow */}
                <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
                <div className="absolute -bottom-12 -left-12 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
                {design.render(data)}
              </div>
            </div>
            <div className="flex gap-1.5 justify-center">
              <Button
                size="sm"
                variant="outline"
                disabled={busy === design.id}
                onClick={() => downloadAsImage(design.id)}
                className="h-8 px-2.5 text-xs font-bold flex-1 max-w-[100px]"
              >
                {busy === design.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Download className="h-3 w-3 mr-1" /> İndir</>}
              </Button>
              <Button
                size="sm"
                disabled={busy === design.id}
                onClick={() => shareCard(design.id)}
                className="h-8 px-2.5 text-xs font-bold flex-1 max-w-[100px]"
              >
                <Share2 className="h-3 w-3 mr-1" /> Paylaş
              </Button>
            </div>
            <p className="text-xs text-center text-muted-foreground font-medium">{design.title}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
