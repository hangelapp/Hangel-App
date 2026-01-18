'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Handshake, HeartHandshake, HandCoins, Star, Rocket } from 'lucide-react';
import { useRouter } from 'next/navigation';

const onboardingSteps = [
  {
    icon: Handshake,
    title: 'İyiliğe Hoş Geldiniz',
    description: 'Toplumsal fayda ve pozitif değişim için bireyleri, STK\'ları ve markaları birleştiren bir dünyaya adım atın.',
  },
  {
    icon: HeartHandshake,
    title: 'Gönüllü Olun, Etki Yaratın',
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
    description: 'Hangel ile iyilik dolu bir yolculuğa çıkmak ve pozitif bir etki yaratmak için şimdi başlayın.',
  },
];

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const router = useRouter();

  const handleNext = () => {
    if (step < onboardingSteps.length - 1) {
      setStep(step + 1);
    } else {
      router.push('/login');
    }
  };

  const handleSkip = () => {
    router.push('/login');
  };
  
  const currentStep = onboardingSteps[step];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-background text-center">
      <header className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between">
        <Progress value={((step + 1) / onboardingSteps.length) * 100} className="w-2/3" />
        <Button variant="ghost" onClick={handleSkip}>
          Atla
        </Button>
      </header>

      <main className="flex flex-col items-center justify-center">
        <div className="w-32 h-32 bg-primary/10 rounded-full flex items-center justify-center mb-8">
            <currentStep.icon className="w-16 h-16 text-primary" />
        </div>
        <h1 className="text-3xl font-bold font-headline mb-4">{currentStep.title}</h1>
        <p className="text-muted-foreground max-w-sm">
            {currentStep.description}
        </p>
      </main>

      <footer className="absolute bottom-0 left-0 right-0 p-6 flex justify-center">
        <Button onClick={handleNext} className="w-full max-w-sm" size="lg">
          {step === onboardingSteps.length - 1 ? 'Hadi Başlayalım!' : 'İleri'}
        </Button>
      </footer>
    </div>
  );
}
