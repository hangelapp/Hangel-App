'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft } from 'lucide-react';

export default function IndividualLoginPage() {
  const [loginStep, setLoginStep] = useState(1);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const router = useRouter();

  const handleSendCode = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Sending code to', phoneNumber);
    setLoginStep(2);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Verifying OTP', otp);
    router.push('/market');
  };
  
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement registration logic
    console.log('Registering with phone:', phoneNumber);
    router.push('/market');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-4 bg-background relative">
       <Button onClick={() => router.push('/login')} variant="ghost" size="icon" className="absolute top-4 left-4">
          <ArrowLeft className="h-6 w-6" />
       </Button>
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground tracking-tight font-headline">
            Bireysel Hesap
          </h1>
        </div>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Giriş Yap</TabsTrigger>
            <TabsTrigger value="register">Kayıt Ol</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login" className="mt-6">
            {loginStep === 1 && (
              <form className="space-y-6" onSubmit={handleSendCode}>
                <div className="space-y-2">
                  <Label htmlFor="phone-login">Telefon Numarası</Label>
                  <Input
                    id="phone-login"
                    type="tel"
                    required
                    placeholder="5XX XXX XX XX"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full">
                  Doğrulama Kodu Gönder
                </Button>
              </form>
            )}

            {loginStep === 2 && (
              <form className="space-y-6" onSubmit={handleLogin}>
                <p className="text-sm text-center text-muted-foreground">
                    {`+90 ${phoneNumber} numarasına gönderilen kodu girin.`}
                </p>
                <div>
                  <Label htmlFor="otp">Doğrulama Kodu</Label>
                  <Input
                    id="otp"
                    type="text"
                    required
                    className="text-center tracking-[0.5em]"
                    placeholder="------"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                  />
                </div>
                <div className="flex items-center justify-between text-sm">
                    <Button variant="link" onClick={() => setLoginStep(1)} className="p-0 text-primary">
                        Numarayı Değiştir
                    </Button>
                     <Button variant="link" className="p-0 text-primary">
                        Kodu Tekrar Gönder
                    </Button>
                </div>
                <Button type="submit" className="w-full">
                  Giriş Yap
                </Button>
              </form>
            )}
          </TabsContent>
          
          <TabsContent value="register" className="mt-6">
            <form className="space-y-6" onSubmit={handleRegister}>
               <div className="space-y-2">
                <Label htmlFor="name-register">Ad Soyad</Label>
                <Input id="name-register" type="text" required placeholder="Adınız Soyadınız" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone-register">Telefon Numarası</Label>
                <Input id="phone-register" type="tel" required placeholder="5XX XXX XX XX" />
              </div>
               <div className="space-y-2">
                <Label htmlFor="email-register">E-posta Adresi (İsteğe Bağlı)</Label>
                <Input id="email-register" type="email" placeholder="ornek@eposta.com" />
              </div>
              <div className="flex items-start space-x-3">
                <Checkbox id="terms-register" required />
                <Label htmlFor="terms-register" className="text-xs font-normal text-muted-foreground">
                   <Link href="#" className="font-medium text-primary hover:underline">Kullanıcı Sözleşmesi</Link>, <Link href="#" className="font-medium text-primary hover:underline">KVKK Aydınlatma Metni</Link> ve <Link href="#" className="font-medium text-primary hover:underline">Sosyal Etki Politikası</Link>'nı okudum, anladım.
                </Label>
              </div>
              <Button type="submit" className="w-full">
                Kayıt Ol ve Devam Et
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
