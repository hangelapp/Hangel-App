'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { X, ChevronLeft, ChevronRight, Share2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { HangelLogo } from '@/components/icons';

const STORY_DURATION = 5000; // 5 seconds

type StorySlide = {
  id: number;
  type: 'original' | 'apple' | 'google';
};

const stories: StorySlide[] = [
  { id: 0, type: 'original' },
  { id: 1, type: 'apple' },
  { id: 2, type: 'google' },
];

export default function StoriesPage() {
  const router = useRouter();
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  const nextStory = useCallback(() => {
    if (currentStoryIndex < stories.length - 1) {
      setCurrentStoryIndex(prev => prev + 1);
      setProgress(0);
    } else {
      router.back();
    }
  }, [currentStoryIndex, router]);

  const prevStory = useCallback(() => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(prev => prev - 1);
      setProgress(0);
    }
  }, [currentStoryIndex]);

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

  const currentStory = stories[currentStoryIndex];

  return (
    <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center overflow-hidden touch-none">
      <div className="relative w-full max-w-[450px] h-full max-h-[850px] bg-card md:rounded-2xl overflow-hidden shadow-2xl flex flex-col">
        
        {/* Progress Bars */}
        <div className="absolute top-4 inset-x-0 px-4 flex gap-1.5 z-50">
          {stories.map((s, idx) => (
            <div key={s.id} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
              <div 
                className="h-full bg-white transition-all duration-50 ease-linear"
                style={{ 
                  width: idx < currentStoryIndex ? '100%' : idx === currentStoryIndex ? `${progress}%` : '0%' 
                }}
              />
            </div>
          ))}
        </div>

        {/* Header Overlay */}
        <div className="absolute top-8 inset-x-0 px-4 flex justify-between items-center z-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 backdrop-blur-md flex items-center justify-center border border-white/20">
              <HangelLogo className="text-xs scale-75" />
            </div>
            <div className="text-left drop-shadow-md">
              <p className="text-white font-bold text-sm">Hangel Duyurular</p>
              <p className="text-white/60 text-xs">Şimdi</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 rounded-full h-10 w-10 backdrop-blur-md" onClick={() => router.back()}>
            <X className="h-6 w-6" />
          </Button>
        </div>

        {/* Content Area */}
        <div className="flex-1 relative flex flex-col items-center justify-center">
          
          {/* Touch Zones for Navigation */}
          <div className="absolute inset-0 z-30 flex">
            <div className="w-1/3 h-full cursor-pointer" onClick={prevStory} />
            <div className="w-2/3 h-full cursor-pointer" onClick={nextStory} />
          </div>

          {/* Slide 1: Original Design */}
          {currentStory.type === 'original' && (
            <div className="w-full h-full flex flex-col animate-in fade-in zoom-in-95 duration-500">
              <div className="flex-[4] bg-[#f5f5f5] flex flex-col items-center justify-center px-8 text-center space-y-8">
                <div className="bg-[#f34723] px-4 py-2 rounded shadow-lg">
                  <span className="text-white font-black text-2xl tracking-tighter">hangel</span>
                </div>
                <h2 className="text-[2.5rem] font-black leading-[1.1] text-[#f34723] tracking-tight uppercase">
                  Üniversite<br />Sosyal Etki<br />Temsilciliği
                </h2>
              </div>
              <div className="flex-[3] bg-[#f34723] px-10 flex items-center justify-center text-center">
                <p className="text-white text-sm md:text-base font-medium leading-relaxed">
                  Sosyal sorunlarla birlikte mücadele etmek amacıyla; <strong>hangel bünyesinde</strong> öğrenci kulüpleri, üniversite yönetimi, akademisyenler ve sivil toplum kuruluşları arasında sosyal etki temelli iş birliklerini geliştirmek üzere "Üniversite Sosyal Etki Temsilciliği Programı"nın 2026 yılı başvuruları açıldı.
                </p>
              </div>
            </div>
          )}

          {/* Slide 2: Apple Style Design */}
          {currentStory.type === 'apple' && (
            <div className="w-full h-full flex flex-col bg-[#fafafa] p-8 justify-between animate-in slide-in-from-right fade-in duration-500">
              <div className="pt-24 space-y-2">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#86868b]">Yeni Program</p>
                <h2 className="text-5xl font-bold tracking-tight text-[#1d1d1f] leading-tight">
                  Temsil Et.<br />Değiştir.<br />İlham Ver.
                </h2>
              </div>
              
              <div className="relative aspect-square w-full rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-br from-white to-[#f5f5f7] border border-black/5 flex items-center justify-center p-8 group">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent opacity-50" />
                <p className="text-sm text-[#1d1d1f]/80 leading-relaxed font-medium relative z-10">
                  Üniversite kampüsünüzde iyilik hareketinin öncüsü olun. Kulüpleri, akademisyenleri ve STK'ları ortak bir amaç etrafında birleştirin.
                </p>
              </div>

              <div className="pb-8 space-y-6">
                <p className="text-xs text-[#86868b] leading-snug">
                  Hangel Üniversite Sosyal Etki Temsilciliği 2026 başvuruları başladı.
                </p>
                <Button className="w-full h-12 rounded-full bg-[#0066cc] hover:bg-[#0071e3] text-white font-semibold text-base shadow-lg shadow-blue-500/20">
                  Hemen Başvur
                </Button>
              </div>
            </div>
          )}

          {/* Slide 3: Google Style Design */}
          {currentStory.type === 'google' && (
            <div className="w-full h-full flex flex-col bg-white p-6 animate-in slide-in-from-right fade-in duration-500">
              <div className="pt-20 flex flex-col items-center text-center space-y-6 flex-1">
                <div className="flex gap-1.5 mb-2">
                  <div className="w-3 h-3 rounded-full bg-[#4285F4]" />
                  <div className="w-3 h-3 rounded-full bg-[#EA4335]" />
                  <div className="w-3 h-3 rounded-full bg-[#FBBC05]" />
                  <div className="w-3 h-3 rounded-full bg-[#34A853]" />
                </div>
                <h2 className="text-3xl font-medium text-[#202124] tracking-tight">
                  Sosyal Etki Temsilcisi Olun
                </h2>
                <div className="w-full p-6 bg-[#f8f9fa] rounded-[2rem] border border-[#dadce0] space-y-4">
                  <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center border border-[#e8eaed]">
                    <Megaphone className="h-6 w-6 text-[#4285F4]" />
                  </div>
                  <p className="text-sm text-[#5f6368] leading-relaxed text-left">
                    Hangel bünyesinde öğrenci kulüpleri, üniversite yönetimi ve sivil toplum kuruluşları arasında köprü kurun. 2026 dönemi için başvurularınızı bekliyoruz.
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-3 w-full">
                  <div className="p-4 bg-blue-50 rounded-3xl border border-blue-100 flex flex-col items-center gap-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    <span className="text-[10px] font-bold text-blue-700 uppercase">Networking</span>
                  </div>
                  <div className="p-4 bg-green-50 rounded-3xl border border-green-100 flex flex-col items-center gap-2">
                    <Award className="h-5 w-5 text-green-600" />
                    <span className="text-[10px] font-bold text-green-700 uppercase">Sertifika</span>
                  </div>
                </div>
              </div>

              <div className="pb-6 pt-4 space-y-4">
                <div className="flex items-center gap-2 justify-center text-[11px] text-[#5f6368] font-medium">
                  <Info className="h-3 w-3" /> 2026 yılı başvuruları aktiftir.
                </div>
                <Button className="w-full h-14 rounded-2xl bg-[#1a73e8] hover:bg-[#1b66c9] text-white font-bold text-lg shadow-md transition-all active:scale-[0.98]">
                  Bilgi Al ve Başvur
                </Button>
              </div>
            </div>
          )}

        </div>

        {/* Footer Overlay */}
        <div className="absolute bottom-0 inset-x-0 p-6 z-50 flex gap-3 items-center bg-gradient-to-t from-black/40 to-transparent">
          <div className="flex-1 h-12 rounded-full border border-white/30 backdrop-blur-xl bg-white/10 flex items-center px-4 text-white/80 text-sm cursor-text">
            Bir mesaj gönder...
          </div>
          <Button size="icon" variant="ghost" className="rounded-full h-12 w-12 text-white hover:bg-white/20 backdrop-blur-xl bg-white/10">
            <Share2 className="h-5 w-5" />
          </Button>
        </div>

      </div>
    </div>
  );
}