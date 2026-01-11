'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import Link from 'next/link';
import { HangelLogo } from '@/components/icons';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [step, setStep] = useState(1);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const router = useRouter();

  const handleSendCode = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement OTP sending logic
    console.log('Sending code to', phoneNumber);
    setStep(2);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement OTP verification logic
    console.log('Verifying OTP', otp);
    router.push('/timeline');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <HangelLogo className="mx-auto h-12 w-auto text-primary" />
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-foreground">
            Hangel'e Hoş Geldin
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {step === 1 ? 'Devam etmek için telefon numaranı gir.' : `+90 ${phoneNumber} numarasına gönderilen kodu gir.`}
          </p>
        </div>

        {step === 1 && (
          <form className="space-y-6" onSubmit={handleSendCode}>
            <div>
              <Label htmlFor="phone" className="sr-only">
                Telefon Numarası
              </Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                required
                className="text-lg"
                placeholder="5XX XXX XX XX"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-start">
                <Checkbox id="terms" required />
                <Label htmlFor="terms" className="ml-3 text-sm font-normal text-muted-foreground">
                  <Link href="#" className="font-medium text-primary hover:underline">Kullanıcı Sözleşmesi</Link>'ni ve <Link href="#" className="font-medium text-primary hover:underline">KVKK Aydınlatma Metni</Link>'ni okudum, anladım.
                </Label>
              </div>
            </div>

            <div>
              <Button type="submit" className="w-full">
                Doğrulama Kodu Gönder
              </Button>
            </div>
          </form>
        )}

        {step === 2 && (
          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <Label htmlFor="otp" className="sr-only">
                Doğrulama Kodu
              </Label>
              <Input
                id="otp"
                name="otp"
                type="text"
                required
                className="text-center text-2xl tracking-[1rem]"
                placeholder="------"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />
            </div>
            
            <div className="flex items-center justify-between text-sm">
                <Button variant="link" onClick={() => setStep(1)} className="p-0">
                    Numarayı Değiştir
                </Button>
                 <Button variant="link" className="p-0">
                    Kodu Tekrar Gönder
                </Button>
            </div>

            <div>
              <Button type="submit" className="w-full">
                Giriş Yap
              </Button>
            </div>
          </form>