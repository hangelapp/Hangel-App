
'use client';

import React, { useState, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// --- Components from individual page ---
function IndividualLogin({ onLogin }: { onLogin: (e: React.FormEvent) => void }) {
  const [loginStep, setLoginStep] = useState(1);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');

  const handleSendCode = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Sending code to', phoneNumber);
    setLoginStep(2);
  };

  if (loginStep === 1) {
    return (
      <form className="space-y-6" onSubmit={handleSendCode}>
        <div className="space-y-2">
          <Label htmlFor="phone-login">Telefon Numarası</Label>
          <Input id="phone-login" type="tel" required placeholder="5XX XXX XX XX" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />
        </div>
        <Button type="submit" className="w-full">Doğrulama Kodu Gönder</Button>
      </form>
    );
  }

  return (
    <form className="space-y-6" onSubmit={onLogin}>
      <p className="text-sm text-center text-muted-foreground">{`+90 ${phoneNumber} numarasına gönderilen kodu girin.`}</p>
      <div>
        <Label htmlFor="otp">Doğrulama Kodu</Label>
        <Input id="otp" type="text" required className="text-center tracking-[0.5em]" placeholder="------" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value)} />
      </div>
      <div className="flex items-center justify-between text-sm">
        <Button variant="link" onClick={() => setLoginStep(1)} className="p-0 text-primary">Numarayı Değiştir</Button>
        <Button variant="link" className="p-0 text-primary">Kodu Tekrar Gönder</Button>
      </div>
      <Button type="submit" className="w-full">Giriş Yap</Button>
    </form>
  );
}

function IndividualRegister({ onRegister }: { onRegister: (e: React.FormEvent) => void }) {
  return (
    <form className="space-y-6" onSubmit={onRegister}>
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
      <Button type="submit" className="w-full">Kayıt Ol ve Devam Et</Button>
    </form>
  );
}

// --- Components from corporate page ---
function CorporateLogin({ onLogin }: { onLogin: (e: React.FormEvent) => void }) {
    return (
        <form className="space-y-6" onSubmit={onLogin}>
            <div className="space-y-2">
                <Label htmlFor="email-login">E-posta Adresi</Label>
                <Input id="email-login" type="email" required placeholder="kurumsal@eposta.com" />
            </div>
            <div className="space-y-2">
                <Label htmlFor="password-login">Şifre</Label>
                <Input id="password-login" type="password" required />
            </div>
            <div className="flex items-center justify-end text-sm">
                <Button variant="link" className="p-0 text-primary">Şifremi Unuttum</Button>
            </div>
            <Button type="submit" className="w-full">Giriş Yap</Button>
        </form>
    );
}

function CorporateRegister({ onRegister }: { onRegister: (e: React.FormEvent) => void }) {
    return (
        <form className="space-y-6" onSubmit={onRegister}>
            <div className="space-y-2">
                <Label htmlFor="org-type">Kuruluş Türü</Label>
                <Select required>
                    <SelectTrigger id="org-type"><SelectValue placeholder="Kuruluş türünü seçin..." /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ngo">Sivil Toplum Kuruluşu (STK)</SelectItem>
                        <SelectItem value="brand">Marka / Sosyal İşletme</SelectItem>
                        <SelectItem value="club">Öğrenci Kulübü</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label htmlFor="org-name">Kuruluş Adı</Label>
                <Input id="org-name" type="text" required placeholder="Kuruluşunuzun tam adı" />
            </div>
            <div className="space-y-2">
                <Label htmlFor="email-register">Yetkili E-posta Adresi</Label>
                <Input id="email-register" type="email" required placeholder="kurumsal@eposta.com" />
            </div>
            <div className="space-y-2">
                <Label htmlFor="password-register">Şifre Oluştur</Label>
                <Input id="password-register" type="password" required />
            </div>
            <div className="flex items-start space-x-3">
                <Checkbox id="terms-register-corp" required />
                <Label htmlFor="terms-register-corp" className="text-xs font-normal text-muted-foreground">
                    <Link href="#" className="font-medium text-primary hover:underline">Kurumsal Kullanıcı Sözleşmesi</Link> ve <Link href="#" className="font-medium text-primary hover:underline">Gizlilik Politikası</Link>'nı okudum, anladım.
                </Label>
            </div>
            <Button type="submit" className="w-full">Başvuruyu Tamamla</Button>
            <p className="text-xs text-center text-muted-foreground">
                Başvurunuz incelendikten sonra hesabınız aktifleştirilecektir.
            </p>
        </form>
    );
}

function SelectionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const action = searchParams.get('action') || 'login';

  const title = action === 'register' ? 'Kayıt Ol' : 'Giriş Yap';
  const description = 'Hangel\'e devam etmek için hesap türünü seçin.';

  const handleIndividualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    router.push('/market');
  };

  const handleIndividualRegister = (e: React.FormEvent) => {
    e.preventDefault();
    router.push('/market');
  };

  const handleCorporateLogin = (e: React.FormEvent) => {
    e.preventDefault();
    router.push('/admin');
  };

  const handleCorporateRegister = (e: React.FormEvent) => {
    e.preventDefault();
    router.push('/admin');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background relative">
      <Button onClick={() => router.back()} variant="ghost" size="icon" className="absolute top-4 left-4">
          <ArrowLeft className="h-6 w-6" />
       </Button>
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold font-headline">{title}</h1>
          <p className="text-muted-foreground mt-2">{description}</p>
        </div>

        <Tabs defaultValue="individual" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="individual">Bireysel Hesap</TabsTrigger>
            <TabsTrigger value="corporate">Kurumsal Hesap</TabsTrigger>
          </TabsList>
          
          <TabsContent value="individual" className="mt-6">
            {action === 'login' ? (
                <IndividualLogin onLogin={handleIndividualLogin} />
            ) : (
                <IndividualRegister onRegister={handleIndividualRegister} />
            )}
          </TabsContent>
          
          <TabsContent value="corporate" className="mt-6">
             {action === 'login' ? (
                <CorporateLogin onLogin={handleCorporateLogin} />
             ) : (
                <CorporateRegister onRegister={handleCorporateRegister} />
             )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default function SelectionPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Yükleniyor...</div>}>
            <SelectionContent />
        </Suspense>
    )
}
