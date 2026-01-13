'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import Link from 'next/link';
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
    router.push('/market');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8.5rem)] p-4 bg-background">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center mb-8">
          <h1 className="text-6xl font-bold text-destructive tracking-tight">
            hangel
          </h1>
          <p className="text-3xl font-bold text-foreground tracking-tight font-headline mt-4">
            Merhaba
          </p>
          <p className="mt-2 text-muted-foreground">
            {step === 1 ? 'Devam etmek için telefon numaranızı girin' : `+90 ${phoneNumber} numarasına gönderilen kodu girin.`}
          </p>
        </div>

        {step === 1 && (
          <form className="space-y-6" onSubmit={handleSendCode}>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefon Numarası</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                required
                className="text-base py-6"
                placeholder="5XX XXX XX XX"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            </div>

            <div className="flex items-start">
              <Checkbox id="terms" required />
              <Label htmlFor="terms" className="ml-3 text-xs font-normal text-muted-foreground">
                 <Link href="#" className="font-medium text-primary hover:underline">Kullanıcı Sözleşmesi</Link>, <Link href="#" className="font-medium text-primary hover:underline">KVKK Aydınlatma Metni</Link> ve <Link href="#" className="font-medium text-primary hover:underline">Sosyal Etki Politikası</Link>'nı okudum, anladım.
              </Label>
            </div>

            <div>
              <Button type="submit" className="w-full" size="lg">
                Doğrulama Kodu Gönder
              </Button>
            </div>
          </form>
        )}

        {step === 2 && (
          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <Label htmlFor="otp">Doğrulama Kodu</Label>
              <Input
                id="otp"
                name="otp"
                type="text"
                required
                className="text-center text-2xl tracking-[1rem] py-6"
                placeholder="------"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />
            </div>
            
            <div className="flex items-center justify-between text-sm">
                <Button variant="link" onClick={() => setStep(1)} className="p-0 text-primary">
                    Numarayı Değiştir
                </Button>
                 <Button variant="link" className="p-0 text-primary">
                    Kodu Tekrar Gönder
                </Button>
            </div>

            <div>
              <Button type="submit" className="w-full" size="lg">
                Giriş Yap
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
