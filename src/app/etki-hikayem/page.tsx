'use client';

/**
 * Etki Hikayem — kişisel "Etki Wrapped" (Spotify Wrapped tarzı).
 *
 * Giriş yapmış kullanıcının AYLIK ve YILLIK etki özetini gösterir:
 * gönüllülük saati, destek/bağış adedi, etkinlik sayısı, etki puanı,
 * dokunulan tahmini can ve en çok katkı verdiği alan. Dönem seçici
 * (Bu Ay / Bu Yıl) ile veriyi /api/impact/wrapped üzerinden çeker.
 *
 * Tam ekran, büyük rakamlar, coral gradyan kartlar, animasyonlu reveal.
 * Final kart html2canvas ile görsele dönüşüp paylaşılır.
 */

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { doc } from 'firebase/firestore';
import { ChevronRight, Loader2, Calendar, CalendarDays, Sparkles, Film } from 'lucide-react';

import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { COLLECTIONS } from '@/firebase/collections';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { WrappedCard } from '@/components/impact/wrapped-card';
import { WrappedStory, type WrappedStoryData } from '@/components/impact/wrapped-story';

type Period = 'month' | 'year';

interface Wrapped {
  period: Period;
  periodLabel: string;
  totalVolunteerHours: number;
  donationCount: number;
  totalDonationTry: number;
  eventCount: number;
  impactScore: number;
  totalImpactValueTry: number;
  estimatedLivesTouched: number;
  topArea: string | null;
  badgesEarned: number;
  hasAnyData: boolean;
}

const fmt = (n: number) => (Number.isFinite(n) ? n.toLocaleString('tr-TR') : '0');

interface Slide {
  kicker?: string;
  big: string;
  title: string;
  subtitle?: string;
  gradient: string;
}

function buildSlides(d: Wrapped, periodWord: string): Slide[] {
  const slides: Slide[] = [
    {
      kicker: 'hangel',
      big: d.periodLabel,
      title: `${periodWord} etki hikayen`,
      subtitle: 'Birlikte ürettiğin iyiliğe bir göz at.',
      gradient: 'from-[#f34723] via-[#d6310f] to-[#7a1c08]',
    },
    {
      kicker: 'Dokunduğun tahmini can',
      big: fmt(d.estimatedLivesTouched),
      title: 'can',
      subtitle: 'Gönüllülüğün ve desteğinle birçok hayata dokundun.',
      gradient: 'from-emerald-500 via-emerald-700 to-emerald-950',
    },
    {
      kicker: 'Gönüllülük',
      big: `${fmt(d.totalVolunteerHours)}`,
      title: 'saat',
      subtitle: `${periodWord} ${fmt(d.eventCount)} etkinlik/gönüllülükte yer aldın.`,
      gradient: 'from-blue-500 via-blue-700 to-blue-950',
    },
  ];

  if (d.donationCount > 0) {
    slides.push({
      kicker: 'Destek',
      big: fmt(d.donationCount),
      title: d.totalDonationTry > 0 ? `destek · ${fmt(d.totalDonationTry)} ₺` : 'destek',
      subtitle: 'Alışverişlerinle markalar üzerinden bağış akıttın.',
      gradient: 'from-rose-500 via-rose-700 to-rose-950',
    });
  }

  if (d.totalImpactValueTry > 0) {
    slides.push({
      kicker: 'Ürettiğin sosyal etki',
      big: `${fmt(d.totalImpactValueTry)} ₺`,
      title: 'değerinde katkı',
      subtitle: 'Emeğinin topluma kazandırdığı tahmini değer.',
      gradient: 'from-amber-500 via-amber-700 to-amber-950',
    });
  }

  if (d.topArea) {
    slides.push({
      kicker: 'En çok katkı verdiğin alan',
      big: d.topArea,
      title: '',
      subtitle: `${periodWord} en çok burada iz bıraktın.`,
      gradient: 'from-violet-500 via-violet-700 to-violet-950',
    });
  }

  slides.push({
    kicker: 'Etki Puanın',
    big: fmt(d.impactScore),
    title: 'puan',
    subtitle: 'Topluluğa kattığın toplam etki.',
    gradient: 'from-[#f34723] via-pink-600 to-purple-800',
  });

  return slides;
}

export default function EtkiHikayemPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const db = useFirestore();

  const [period, setPeriod] = useState<Period>('month');
  const [data, setData] = useState<Wrapped | null>(null);
  const [loading, setLoading] = useState(true);
  const [slideIndex, setSlideIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [storyOpen, setStoryOpen] = useState(false);

  const userDocRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, COLLECTIONS.users, user.uid);
  }, [db, user]);
  const { data: userData } = useDoc<{ name?: string; avatarUrl?: string }>(userDocRef);

  // Anonim kullanıcıyı login'e taşı (eylem anında giriş kapısı).
  useEffect(() => {
    if (isUserLoading) return;
    if (!user) {
      router.replace('/login/selection?action=login&next=%2Fetki-hikayem');
    }
  }, [user, isUserLoading, router]);

  const load = useCallback(async (p: Period) => {
    if (!user) return;
    setLoading(true);
    setRevealed(false);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch(`/api/impact/wrapped?period=${p}`, {
        headers: { authorization: `Bearer ${idToken}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json.wrapped as Wrapped);
      setSlideIndex(0);
    } catch {
      toast({ variant: 'destructive', title: 'Yüklenemedi', description: 'Etki özeti şu an alınamadı.' });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    if (!user) return;
    void load(period);
  }, [user, period, load]);

  const switchPeriod = (p: Period) => {
    if (p === period) return;
    setPeriod(p);
  };

  if (isUserLoading || (!user && typeof window !== 'undefined')) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  const periodWord = period === 'month' ? 'Bu ay' : 'Bu yıl';
  const name = userData?.name || user?.displayName || 'hangel gönüllüsü';
  const avatarUrl = userData?.avatarUrl || user?.photoURL || undefined;

  return (
    <div className="min-h-dvh bg-black text-white">
      {/* Dönem seçici */}
      <div className="sticky top-0 z-20 flex items-center justify-center gap-2 px-4 py-4 bg-black/70 backdrop-blur-md">
        <div className="inline-flex rounded-full bg-white/10 p-1">
          <PeriodTab active={period === 'month'} onClick={() => switchPeriod('month')} icon={<Calendar className="h-4 w-4" />} label="Bu Ay" />
          <PeriodTab active={period === 'year'} onClick={() => switchPeriod('year')} icon={<CalendarDays className="h-4 w-4" />} label="Bu Yıl" />
        </div>
      </div>

      {loading || !data ? (
        <div className="min-h-[70dvh] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-white/80" />
        </div>
      ) : !data.hasAnyData ? (
        <EmptyState periodWord={periodWord} onExplore={() => router.push('/volunteering')} />
      ) : !revealed ? (
        <StoryReveal
          data={data}
          periodWord={periodWord}
          slideIndex={slideIndex}
          setSlideIndex={setSlideIndex}
          onFinish={() => setRevealed(true)}
        />
      ) : (
        <SummaryView
          data={data}
          period={period}
          name={name}
          avatarUrl={avatarUrl}
          onReplay={() => { setSlideIndex(0); setRevealed(false); }}
          onWatchVideo={() => setStoryOpen(true)}
        />
      )}

      {/* Tam ekran IG-tarzı animasyonlu Hikaye Videosu oynatıcısı */}
      {storyOpen && data && (
        <WrappedStory
          data={{
            name,
            periodLabel: data.periodLabel,
            periodKind: period,
            totalVolunteerHours: data.totalVolunteerHours,
            donationCount: data.donationCount,
            eventCount: data.eventCount,
            impactScore: data.impactScore,
            estimatedLivesTouched: data.estimatedLivesTouched,
            topArea: data.topArea,
          } satisfies WrappedStoryData}
          onClose={() => setStoryOpen(false)}
        />
      )}
    </div>
  );
}

function PeriodTab({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold transition-colors',
        active ? 'bg-[#f34723] text-white shadow' : 'text-white/70 hover:text-white',
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function StoryReveal({
  data, periodWord, slideIndex, setSlideIndex, onFinish,
}: {
  data: Wrapped;
  periodWord: string;
  slideIndex: number;
  setSlideIndex: React.Dispatch<React.SetStateAction<number>>;
  onFinish: () => void;
}) {
  const slides = buildSlides(data, periodWord);
  const slide = slides[Math.min(slideIndex, slides.length - 1)];
  const isLast = slideIndex >= slides.length - 1;

  const next = () => {
    if (isLast) { onFinish(); return; }
    setSlideIndex((i) => Math.min(i + 1, slides.length - 1));
  };

  return (
    <div
      className={cn('min-h-[calc(100dvh-72px)] flex flex-col bg-gradient-to-br select-none cursor-pointer', slide.gradient)}
      onClick={next}
    >
      {/* İlerleme çubukları */}
      <div className="flex gap-1 p-3">
        {slides.map((_, i) => (
          <div key={i} className="flex-1 h-1 bg-white/25 rounded-full overflow-hidden">
            <div className={cn('h-full bg-white transition-all duration-500', i < slideIndex ? 'w-full' : i === slideIndex ? 'w-1/2' : 'w-0')} />
          </div>
        ))}
      </div>

      {/* İçerik — animasyonlu reveal (key ile her geçişte yeniden tetiklenir) */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        <div key={slideIndex} className="space-y-5 max-w-md animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-500">
          {slide.kicker && (
            <p className="text-xs font-black uppercase tracking-[0.25em] opacity-95">{slide.kicker}</p>
          )}
          <p className="text-4xl sm:text-6xl md:text-7xl font-black leading-none tracking-tighter text-balance break-words">{slide.big}</p>
          {slide.title && <p className="text-2xl font-bold">{slide.title}</p>}
          {slide.subtitle && <p className="text-sm opacity-95 leading-relaxed">{slide.subtitle}</p>}
        </div>
      </div>

      {/* Alt navigasyon */}
      <div className="p-6 flex items-center justify-between">
        <p className="text-xs opacity-70">Devam etmek için dokun</p>
        {isLast ? (
          <Button onClick={(e) => { e.stopPropagation(); onFinish(); }} className="bg-white text-black hover:bg-white/90 rounded-full font-bold">
            <Sparkles className="h-4 w-4 mr-1.5" /> Kartı gör
          </Button>
        ) : (
          <button
            onClick={(e) => { e.stopPropagation(); next(); }}
            className="text-xs font-bold opacity-80 hover:opacity-100 inline-flex items-center"
          >
            İleri <ChevronRight className="h-3 w-3 ml-1" />
          </button>
        )}
      </div>
    </div>
  );
}

function SummaryView({
  data, period, name, avatarUrl, onReplay, onWatchVideo,
}: {
  data: Wrapped;
  period: Period;
  name: string;
  avatarUrl?: string;
  onReplay: () => void;
  onWatchVideo: () => void;
}) {
  return (
    <div className="px-4 pb-16 pt-6 animate-in fade-in duration-500">
      <div className="text-center max-w-md mx-auto mb-6">
        <p className="text-xs font-black uppercase tracking-[0.25em] text-white/60">
          {period === 'month' ? 'Bu Ay' : 'Bu Yıl'} · {data.periodLabel}
        </p>
        <h1 className="text-2xl font-black tracking-tight mt-1">Etki Hikayen</h1>
        <p className="text-sm text-white/60 mt-1">Kartını indir ya da paylaş; ilhamı büyüt.</p>
      </div>

      {/* 🎬 Hikaye Videosu girişi — tam ekran animasyonlu oynatıcı */}
      <div className="max-w-md mx-auto mb-6">
        <button
          onClick={onWatchVideo}
          className="group w-full flex items-center gap-3 rounded-3xl bg-gradient-to-r from-[#f34723] to-[#d6310f] px-5 py-4 text-left shadow-md transition-transform duration-300 ease-spring-out active:scale-[0.98]"
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md">
            <Film className="h-6 w-6 text-white" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-base font-black tracking-tight text-white">🎬 Hikaye Videosu</span>
            <span className="block text-xs font-medium text-white/85">
              Etkini müzikli, animasyonlu sahnelerle izle ve paylaş
            </span>
          </span>
          <ChevronRight className="h-5 w-5 shrink-0 text-white/80 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>

      <div className="mx-auto w-full max-w-[calc(100vw-24px)] overflow-hidden sm:max-w-md">
        <WrappedCard
          data={{
            name,
            avatarUrl,
            periodLabel: data.periodLabel,
            periodKind: period,
            totalVolunteerHours: data.totalVolunteerHours,
            donationCount: data.donationCount,
            eventCount: data.eventCount,
            impactScore: data.impactScore,
            estimatedLivesTouched: data.estimatedLivesTouched,
            topArea: data.topArea,
          }}
        />
      </div>

      <div className="max-w-md mx-auto mt-4 text-center">
        <button onClick={onReplay} className="text-sm font-bold text-white/70 hover:text-white underline-offset-4 hover:underline">
          Hikayeyi yeniden izle
        </button>
      </div>
    </div>
  );
}

function EmptyState({ periodWord, onExplore }: { periodWord: string; onExplore: () => void }) {
  return (
    <div className="min-h-[70dvh] flex flex-col items-center justify-center px-8 text-center">
      <div className="text-6xl mb-4">🧡</div>
      <h2 className="text-xl font-black tracking-tight">{periodWord} henüz etki verin yok</h2>
      <p className="text-sm text-white/60 mt-2 max-w-xs">
        Bir gönüllülüğe katıl, bir etkinliğe gel ya da markalardan alışverişle bağış akıt — hikayen burada şekillensin.
      </p>
      <Button onClick={onExplore} className="mt-6 rounded-full font-bold bg-[#f34723] hover:bg-[#d6310f]">
        Gönüllülükleri keşfet
      </Button>
    </div>
  );
}
