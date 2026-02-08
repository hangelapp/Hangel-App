'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { X, Share2, Info, Megaphone, Users, Award, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { HangelLogo } from '@/components/icons';
import Image from 'next/image';

const STORY_DURATION = 5000; // 5 seconds

type StorySlide = {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  imageHint: string;
  ctaText: string;
  accentColor: string;
};

const stories: StorySlide[] = [
  {
    id: 1,
    title: "Geleceğin Sosyal Etki Lideri Olun.",
    subtitle: "Üniversite Temsilciliği 2026",
    description: "Kampüsünüzde iyilik hareketini başlatın. Kulüpler, akademisyenler ve STK'lar arasında köprü kurun.",
    image: "https://images.unsplash.com/photo-1523050335392-9bc56751d11a?q=80&w=2070&auto=format&fit=crop",
    imageHint: "university students on campus",
    ctaText: "Hemen Başvur",
    accentColor: "#f34723"
  },
  {
    id: 2,
    title: "Alışverişi İyiliğe Dönüştürün.",
    subtitle: "Hangel Bağış Ekosistemi",
    description: "Ek bir masraf ödemeden, her harcamanızla seçtiğiniz bir sivil toplum kuruluşuna destek olun.",
    image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070&auto=format&fit=crop",
    imageHint: "modern retail store interior",
    ctaText: "Markaları Keşfet",
    accentColor: "#0066cc"
  },
  {
    id: 3,
    title: "Zamanınız En Değerli Bağış.",
    subtitle: "Hangel İmece Modülü",
    description: "Yetkinliklerinizi toplumsal sorunların çözümü için kullanın. Binlerce gönüllülük ilanı sizi bekliyor.",
    image: "https://images.unsplash.com/photo-1559027615-cd4428d63b5f?q=80&w=2074&auto=format&fit=crop",
    imageHint: "volunteers working together",
    ctaText: "İlanları Gör",
    accentColor: "#10b981"
  }
];

export default function StoriesPage() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  const nextStory = useCallback(() => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setProgress(0);
    } else {
      router.back();
    }
  }, [currentIndex, router]);

  const prevStory = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setProgress(0);
    }
  }, [currentIndex]);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          nextStory();
          return 0;
        }
        return prev + (100 / (STORY_DURATION / 50));
      });
    }, 50);

    return () => clearInterval(interval);
  }, [nextStory]);

  const currentSlide = stories[currentIndex];

  if (!currentSlide) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center overflow-hidden touch-none selection:bg-primary/30">
      <div className="relative w-full max-w-[450px] h-full max-h-[850px] bg-black md:rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col animate-in fade-in duration-700">
        
        {/* Progress Bars (iOS Style) */}
        <div className="absolute top-4 inset-x-0 px-4 flex gap-1.5 z-50">
          {stories.map((s, idx) => (
            <div key={s.id} className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
              <div 
                className="h-full bg-white transition-all duration-50 ease-linear shadow-[0_0_8px_rgba(255,255,255,0.5)]"
                style={{ 
                  width: idx < currentIndex ? '100%' : idx === currentIndex ? `${progress}%` : '0%' 
                }}
              />
            </div>
          ))}
        </div>

        {/* Dynamic Header */}
        <div className="absolute top-8 inset-x-0 px-6 flex justify-between items-center z-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-2xl flex items-center justify-center border border-white/10 shadow-lg">
              <HangelLogo className="text-[10px] scale-75 text-white" />
            </div>
            <div className="text-left">
              <p className="text-white font-black text-xs uppercase tracking-[0.15em] drop-shadow-md">Öne Çıkanlar</p>
              <p className="text-white/50 text-[10px] font-bold uppercase tracking-widest drop-shadow-sm">hangel A.Ş.</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-white hover:bg-white/10 rounded-full h-10 w-10 backdrop-blur-2xl bg-white/5 border border-white/5 shadow-lg" 
            onClick={() => router.back()}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Visual Content Area */}
        <div className="flex-1 relative flex flex-col">
          
          {/* Background with Apple-style Ken Burns effect */}
          <div className="absolute inset-0 z-0">
            <Image 
              src={currentSlide.image} 
              alt={currentSlide.title} 
              fill 
              priority
              className="object-cover transition-transform ease-linear"
              style={{ 
                transform: `scale(${1.1 + (progress / 1000)})`,
                transitionDuration: '5000ms'
              }}
              data-ai-hint={currentSlide.imageHint}
            />
            {/* Dynamic Gradients for Typography Readability */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/90" />
          </div>

          {/* Invisible Touch Navigation Zones */}
          <div className="absolute inset-0 z-30 flex">
            <div className="w-1/3 h-full cursor-pointer" onClick={prevStory} />
            <div className="w-2/3 h-full cursor-pointer" onClick={nextStory} />
          </div>

          {/* Typography Layer (Apple Editorial Style) */}
          <div className="relative z-10 flex-1 flex flex-col justify-end p-8 pb-32 space-y-6">
            <div className="animate-in slide-in-from-bottom-8 duration-1000 fill-mode-both">
              <p className="text-[11px] font-black uppercase tracking-[0.3em] text-white/60 mb-2 drop-shadow-md">
                {currentSlide.subtitle}
              </p>
              
              <h2 className="text-4xl md:text-5xl font-black tracking-tighter text-white leading-[1.05] mb-6 drop-shadow-2xl">
                {currentSlide.title}
              </h2>
              
              <p className="text-base text-white/80 font-medium leading-relaxed max-w-sm drop-shadow-lg">
                {currentSlide.description}
              </p>
            </div>
          </div>
        </div>

        {/* Global Action Footer (Glassmorphism) */}
        <div className="absolute bottom-0 inset-x-0 p-8 z-50 bg-white/5 backdrop-blur-3xl border-t border-white/10">
          <div className="flex gap-3 items-center">
            <Button 
              className="flex-1 h-14 rounded-2xl bg-white text-black hover:bg-white/90 font-black text-base shadow-2xl transition-all active:scale-[0.98]"
              style={{ color: currentSlide.accentColor }}
            >
              {currentSlide.ctaText}
            </Button>
            <Button 
              size="icon" 
              variant="ghost" 
              className="rounded-2xl h-14 w-14 bg-white/10 text-white hover:bg-white/20 border border-white/10 shadow-xl"
            >
              <Share2 className="h-6 w-6" />
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}
