'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Handshake, HeartHandshake, HandCoins, Star, Rocket } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel"

const onboardingSteps = [
  {
    icon: Handshake,
    title: 'İyiliğe Hoş Geldiniz',
    description: 'Toplumsal fayda ve pozitif değişim için bireyleri, STK\'ları ve markaları birleştiren bir dünyaya adım atın.',
  },
  {
    icon: HeartHandshake,
    title: 'Gönüllü Olun, Etki Oluşturun',
    description: 'Yeteneklerinize ve ilgi alanlarınıza uygun gönüllülük fırsatlarını keşfedin, topluma değer katın ve ilham verin.',
  },
  {
    icon: HandCoins,
    title: 'Alışverişle Fark Yaratın',
    description: 'Günlük alışverişlerinizi, seçtiğiniz sivil toplum kuruluşları için anlamlı bir desteğe dönüştürün. Ekstra bir ücret ödemeden.',
  },
  {
    icon: Star,
    title: 'Etkinizi Görün ve Büyütün',
    description: 'Yaptığınız her katkıyla "Sosyal Etki Puanı" kazanın. Başarılarınızı rozetler ve sertifikalarla sergileyerek ilham kaynağı olun.',
  },
  {
    icon: Rocket,
    title: 'Değişimi Başlatmaya Hazır Mısınız?',
    description: 'Hangel ile iyilik dolu bir yolculuğa çıkmak ve pozitif bir etki oluşturmak için şimdi başlayın.',
  },
];

export default function OnboardingPage() {
  const [api, setApi] = useState<CarouselApi>()
  const [current, setCurrent] = useState(0)
  const router = useRouter();

  React.useEffect(() => {
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
    <div className="flex flex-col h-screen p-6 bg-background text-center">
      <header className="flex items-center justify-end">
        <Button variant="ghost" onClick={handleSkip}>
          Atla
        </Button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center">
        <Carousel setApi={setApi} className="w-full">
            <CarouselContent>
            {onboardingSteps.map((step, index) => {
                const Icon = step.icon;
                return (
                <CarouselItem key={index}>
                    <div className="flex flex-col items-center justify-center text-center p-4">
                        <div className="w-32 h-32 bg-primary/10 rounded-full flex items-center justify-center mb-12">
                            <Icon className="w-16 h-16 text-primary" />
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
        </Carousel>
      </main>

      <footer className="py-6 space-y-4">
        <div className="flex justify-center gap-2">
            {onboardingSteps.map((_, i) => (
            <div
                key={i}
                className={cn(
                'h-2 w-2 rounded-full transition-all',
                i === current ? 'w-6 bg-primary' : 'bg-primary/20'
                )}
            />
            ))}
        </div>
        <Button onClick={handleNext} className="w-full max-w-sm mx-auto" size="lg">
           {current < onboardingSteps.length - 1 ? 'İleri' : 'Hadi Başlayalım!'}
        </Button>
      </footer>
    </div>
  );
}
