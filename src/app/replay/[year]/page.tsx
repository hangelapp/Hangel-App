'use client';

/**
 * Impact Replay yıl sonu özet sayfası — Faz 3.
 *
 * Spotify Wrapped tarzı: 7 ekranlık animasyonlu story. Kullanıcı kaydırarak
 * geçer; son ekran "Instagram story olarak paylaş" butonu içerir (sonraki
 * commit'te html2canvas ile image generation).
 *
 * Her ekran 5 saniye otomatik geçer (veya tap ile manuel).
 */

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';
import { Heart, Users, Sparkles, Clock, Award, ChevronRight, Share2, Loader2 } from 'lucide-react';

import { useUser } from '@/firebase';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface Replay {
  year: number;
  totalVolunteerHours: number;
  totalEvents: number;
  totalDonationsTry: number;
  totalMicroTasks: number;
  estimatedPeopleHelped: number;
  topCategory: string | null;
  topNgoName: string | null;
  topMonth: { month: number; eventCount: number } | null;
  badgesEarned: number;
  percentileVsAllVolunteers: number | null;
}

const MONTHS = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
const CATEGORY_TR: Record<string, string> = {
  environment: 'Çevre', elderly: 'Yaşlı', animals: 'Hayvan', children: 'Çocuk',
  health: 'Sağlık', education: 'Eğitim', other: 'Diğer',
};

export default function ReplayPage() {
  const params = useParams<{ year: string }>();
  const { user } = useUser();
  const { toast } = useToast();
  const [data, setData] = useState<Replay | null>(null);
  const [loading, setLoading] = useState(true);
  const [storyIndex, setStoryIndex] = useState(0);

  useEffect(() => {
    if (!user || !params?.year) return;
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, params?.year]);

  const load = async () => {
    if (!user || !params?.year) return;
    try {
      const idToken = await user.getIdToken();
      const res = await fetch(`/api/users/me/replay/${params.year}`, { headers: { authorization: `Bearer ${idToken}` } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json.replay as Replay);
    } catch (e) {
      toast({ variant: 'destructive', title: 'Yüklenemedi', description: e instanceof Error ? e.message : 'Bilinmeyen hata.' });
    } finally {
      setLoading(false);
    }
  };

  const share = async () => {
    if (!data) return;
    const text = `${data.year} yılında hangel'de ${data.totalVolunteerHours} saat gönüllülük yaptım, ${data.estimatedPeopleHelped} kişiye dokundum. Sen de katıl: hangel.org.tr #hangel #sosyaletki`;
    if (Capacitor.isNativePlatform()) {
      try { await Share.share({ title: `Hangel ${data.year} Wrapped`, text, url: 'https://hangel.org.tr' }); } catch { /* iptal */ }
      return;
    }
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try { await navigator.share({ title: `Hangel ${data.year} Wrapped`, text, url: 'https://hangel.org.tr' }); return; } catch { /* iptal */ }
    }
    try { await navigator.clipboard.writeText(text); toast({ title: 'Kopyalandı' }); } catch { /* sessiz */ }
  };

  if (loading || !data) {
    return <div className="min-h-dvh flex items-center justify-center bg-black"><Loader2 className="h-8 w-8 animate-spin text-white" /></div>;
  }

  const stories = buildStories(data);
  const story = stories[storyIndex];

  return (
    <div className="min-h-dvh bg-black text-white flex flex-col" onClick={() => setStoryIndex(i => Math.min(i + 1, stories.length - 1))}>

      {/* Progress bars */}
      <div className="flex gap-1 p-3">
        {stories.map((_, i) => (
          <div key={i} className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
            <div className={`h-full bg-white transition-all ${i < storyIndex ? 'w-full' : i === storyIndex ? 'w-1/2' : 'w-0'}`} />
          </div>
        ))}
      </div>

      {/* Story content */}
      <div className={`flex-1 flex flex-col items-center justify-center px-8 text-center ${story.bgClass}`}>
        <div className="space-y-6 max-w-md">
          {story.icon && <div className="text-7xl mb-2">{story.icon}</div>}
          {story.kicker && <p className="text-xs font-bold uppercase tracking-[0.2em] opacity-80">{story.kicker}</p>}
          <div className="text-5xl sm:text-6xl font-black leading-none">{story.bigNumber ?? story.title}</div>
          {story.bigNumber && <p className="text-2xl font-bold">{story.title}</p>}
          {story.subtitle && <p className="text-sm opacity-90 leading-relaxed">{story.subtitle}</p>}
        </div>
      </div>

      {/* Navigation */}
      <div className="p-6 flex items-center justify-between">
        <p className="text-xs opacity-60">Tıkla → sonraki</p>
        {storyIndex === stories.length - 1 ? (
          <Button onClick={(e) => { e.stopPropagation(); void share(); }} className="bg-white text-black hover:bg-white/90 rounded-full font-bold">
            <Share2 className="h-4 w-4 mr-1.5" /> Paylaş
          </Button>
        ) : (
          <button onClick={(e) => { e.stopPropagation(); setStoryIndex(i => Math.min(i + 1, stories.length - 1)); }} className="text-xs opacity-60 hover:opacity-100 inline-flex items-center">
            İleri <ChevronRight className="h-3 w-3 ml-1" />
          </button>
        )}
      </div>
    </div>
  );
}

interface Story {
  icon?: string;
  kicker?: string;
  title: string;
  bigNumber?: string;
  subtitle?: string;
  bgClass: string;
}

function buildStories(data: Replay): Story[] {
  const stories: Story[] = [
    {
      kicker: 'Hangel',
      title: `${data.year}`,
      subtitle: `Bu yıl iyiliklerinin özeti.`,
      bgClass: 'bg-gradient-to-br from-primary to-orange-600',
    },
    {
      icon: '⏱️',
      kicker: 'Gönüllülük',
      title: 'saat',
      bigNumber: data.totalVolunteerHours.toString(),
      subtitle: `Toplam ${data.totalEvents} etkinlikte yer aldın.`,
      bgClass: 'bg-gradient-to-br from-blue-600 to-blue-900',
    },
    {
      icon: '🤝',
      kicker: 'Yardım ettiğin kişi sayısı',
      title: 'kişiye dokundun',
      bigNumber: data.estimatedPeopleHelped.toString(),
      subtitle: `Her saatin gerçek bir hayata değdi.`,
      bgClass: 'bg-gradient-to-br from-emerald-600 to-emerald-900',
    },
  ];

  if (data.totalDonationsTry > 0) {
    stories.push({
      icon: '💝',
      kicker: 'Bağışların',
      title: 'TL',
      bigNumber: new Intl.NumberFormat('tr-TR').format(data.totalDonationsTry),
      subtitle: `Cüzdandan değil, kalpten.`,
      bgClass: 'bg-gradient-to-br from-rose-600 to-rose-900',
    });
  }

  if (data.topNgoName) {
    stories.push({
      icon: '⭐',
      kicker: 'En çok katıldığın',
      title: data.topNgoName,
      subtitle: `Bu STK ile en güçlü bağı kurdun.`,
      bgClass: 'bg-gradient-to-br from-violet-600 to-violet-900',
    });
  }

  if (data.topCategory) {
    stories.push({
      icon: '🎯',
      kicker: 'En çok odaklandığın alan',
      title: CATEGORY_TR[data.topCategory] ?? data.topCategory,
      subtitle: `${data.year} senin yılındı.`,
      bgClass: 'bg-gradient-to-br from-amber-600 to-amber-900',
    });
  }

  if (data.topMonth) {
    stories.push({
      icon: '🔥',
      kicker: 'En aktif olduğun ay',
      title: MONTHS[data.topMonth.month] ?? 'Bilinmiyor',
      subtitle: `${data.topMonth.eventCount} etkinlik. Müthiş enerji!`,
      bgClass: 'bg-gradient-to-br from-pink-600 to-pink-900',
    });
  }

  if (data.percentileVsAllVolunteers !== null && data.percentileVsAllVolunteers >= 50) {
    stories.push({
      icon: '🏆',
      kicker: 'Türkiye gönüllüleri arasında',
      title: `%${data.percentileVsAllVolunteers}`,
      bigNumber: `Top %${100 - data.percentileVsAllVolunteers}`,
      subtitle: `Hangel topluluğunun ilk %${100 - data.percentileVsAllVolunteers}'indesin.`,
      bgClass: 'bg-gradient-to-br from-indigo-600 to-indigo-900',
    });
  }

  stories.push({
    icon: '✨',
    kicker: 'Teşekkürler',
    title: `${data.year} senin yılındı`,
    subtitle: `Yeni yılda da yanındayız. Paylaş, daha çok kişi katılsın.`,
    bgClass: 'bg-gradient-to-br from-primary via-pink-600 to-purple-800',
  });

  return stories;
}
