'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Building2, Heart, Droplet, CalendarHeart, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel"
import { useTranslation } from '@/components/providers/language-provider';

// Onboarding tour — welcome akışından önce gösterilen 4 ekran swipeable
// carousel. PRD: "Yakın STK'ları keşfet" / "Tek dokunla bağış" /
// "Acil kan çağrılarına yanıt ver" / "Etkinliklere katıl".
// `onboardingPage.*` key'leri translations.ts'de tanımlı değil (i18n agent
// olmadığı için inline metin tercih edildi). Skip + Devam akışı korunur.

export default function OnboardingPage() {
  const [api, setApi] = useState<CarouselApi>()
  const [current, setCurrent] = useState(0)
  const router = useRouter();
  const { t } = useTranslation();
  // Skip / Devam etiketlerini mevcut key'lerden çek — t key fallback'i
  // metni geri verir. Eğer key tanımlanmamışsa key string'i döner; o yüzden
  // try-catch'siz nullish coalescing ile sabit Türkçe metne düş.
  const skipLabel = (() => {
    const k = t('onboardingPage.skip');
    return k === 'onboardingPage.skip' ? 'Geç' : k;
  })();
  const nextLabel = (() => {
    const k = t('onboardingPage.next');
    return k === 'onboardingPage.next' ? 'İleri' : k;
  })();

  const onboardingSteps: { icon: typeof Building2; title: string; description: string }[] = [
    {
      icon: Building2,
      title: "Yakın STK'ları keşfet",
      description: 'Sana yakın güvenilir sivil toplum kuruluşlarını gör, projelerini incele ve sürece dahil ol.',
    },
    {
      icon: Heart,
      title: 'Tek dokunla bağış',
      description: 'Markalardan yaptığın her alışveriş, seçtiğin STK\'lara otomatik bağış yapsın. Cebinden ekstra para çıkmaz.',
    },
    {
      icon: Droplet,
      title: 'Acil kan çağrılarına yanıt ver',
      description: 'Kan grubun ve konumunla eşleşen acil çağrılar anında bildirilir. Bir hayat kurtarmak elinde.',
    },
    {
      icon: CalendarHeart,
      title: 'Etkinliklere katıl',
      description: 'Gönüllülük, eğitim ve toplum buluşmalarına başvur. Sosyal etki puanın ve rozetlerin biriksin.',
    },
  ];

  useEffect(() => {
    if (!api) return
    setCurrent(api.selectedScrollSnap())
    api.on("select", () => {
      setCurrent(api.selectedScrollSnap())
    })
  }, [api])


  const handleNext = () => {
    if (current < onboardingSteps.length - 1) {
      api?.scrollNext()
    } else {
      router.push('/login');
    }
  };

  const handleSkip = () => {
    router.push('/login');
  };

  return (
    <div className="flex flex-col min-h-dvh p-6 bg-background text-center">
      <Carousel setApi={setApi} className="w-full h-full flex flex-col">
          <header className="flex items-center justify-end p-2">
            <Button variant="ghost" onClick={handleSkip} aria-label={skipLabel}>
              {skipLabel}
            </Button>
          </header>
          <main className='flex-1 flex flex-col items-center justify-center'>
            <CarouselContent>
            {onboardingSteps.map((step, index) => {
                const Icon = step.icon;
                return (
                <CarouselItem key={index}>
                    <div className="flex flex-col items-center justify-center text-center p-4">
                        <div className="w-32 h-32 bg-primary/10 rounded-full flex items-center justify-center mb-12">
                            <Icon className="w-16 h-16 text-primary" aria-hidden="true" />
                        </div>
                        <h1 className="text-3xl font-bold mb-4">{step.title}</h1>
                        <p className="text-muted-foreground max-w-sm text-lg">
                            {step.description}
                        </p>
                    </div>
                </CarouselItem>
                )
            })}
            </CarouselContent>
          </main>
          <footer className='py-6 space-y-4'>
            <div
              className="flex justify-center gap-2"
              role="tablist"
              aria-label="Onboarding adımları"
            >
                {onboardingSteps.map((_, i) => (
                <button
                    key={i}
                    type="button"
                    role="tab"
                    aria-selected={i === current}
                    aria-label={`Adım ${i + 1} / ${onboardingSteps.length}`}
                    onClick={() => api?.scrollTo(i)}
                    className={cn(
                      'h-2 rounded-full transition-all',
                      i === current ? 'w-6 bg-primary' : 'w-2 bg-primary/20 hover:bg-primary/40'
                    )}
                />
                ))}
            </div>
          </footer>
      </Carousel>
      <Button
        onClick={handleNext}
        size="icon"
        className="absolute right-6 top-1/2 -translate-y-1/2 rounded-full h-12 w-12 z-10"
        aria-label={nextLabel}
      >
           <ChevronRight className="h-6 w-6" aria-hidden="true" />
      </Button>
    </div>
  );
}
