'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { HandCoins, HeartHandshake, Star } from 'lucide-react';
import { useRouter } from 'next/navigation';

const onboardingSteps = [
  {
    icon: HandCoins,
    title: 'Alışverişle Bağış Yap',
    description: 'Anlaşmalı markalardan yaptığın her alışverişin bir kısmı, seçtiğin STK\'lara otomatik olarak bağışlansın.',
  },
  {
    icon: HeartHandshake,
    title: 'Gönüllülük Fırsatlarını Keşfet',
    description: 'Yeteneklerine ve ilgi alanlarına uygun gönüllülük ilanlarına kolayca başvur, topluma fayda sağla.',
  },
  {
    icon: Star,
    title: 'Etki Puanı Kazan',
    description: 'Yaptığın her iyi hareketle etki puanı ve rozetler kazan, sosyal fayda yolculuğunu oyunlaştır.',
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
    <div className="flex flex-col h-screen bg-background p-6">
      <header className="flex items-center justify-between">
        <Progress value={((step + 1) / onboardingSteps.length) * 100} className="w-2/3" />
        <Button variant="ghost" onClick={handleSkip}>
          Atla
        </Button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center text-center -mt-16">
        <div className="w-32 h-32 bg-primary/10 rounded-full flex items-center justify-center mb-8">
            <currentStep.icon className="w-16 h-16 text-primary" />
        </div>
        <h1 className="text-3xl font-bold font-headline mb-4">{currentStep.title}</h1>
        <p className="text-muted-foreground max-w-sm">
            {currentStep.description}
        </p>
      </main>

      <footer className="flex justify-center">
        <Button onClick={handleNext} className="w-full max-w-sm">
          {step === onboardingSteps.length - 1 ? 'H