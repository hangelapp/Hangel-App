
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { HangelLogo } from '@/components/icons';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();

  const handleIndividualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    router.push('/market');
  };

  const handleCorporateLogin = (e: React.FormEvent) => {
    e.preventDefault();
    router.push('/admin');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-secondary">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <HangelLogo className="text-4xl" />
          <h1 className="text-2xl font-bold font-headline text-foreground">Hoş Geldiniz</h1>
          <p className="text-muted-foreground">Devam etmek için hesap türünüzü seçin ve giriş yapın.</p>
        </div>

        <Card className="shadow-lg border-none">
          <CardContent className="pt-6">
            <Tabs defaultValue="individual" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="individual">Bireysel Hesap</TabsTrigger>
                <TabsTrigger value="corporate">Kurumsal Hesap</TabsTrigger>
              </TabsList>
              
              <TabsContent value="individual" className="space-y-6 pt-6">
                <form onSubmit={handleIndividualLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefon Numarası</Label>
                    <Input id="phone" type="tel" placeholder="5XX XXX XX XX" required />
                  </div>
                  <Button type="submit" className="w-full h-11 text-base font-bold">
                    Giriş Yap
                  </Button>
                </form>
                <div className="text-center text-sm">
                  <span className="text-muted-foreground">Hesabınız yok mu? </span>
                  <Link href="/onboarding" className="font-bold text-primary hover:underline">Kayıt Ol</Link>
                </div>
              </TabsContent>
              
              <TabsContent value="corporate" className="space-y-6 pt-6">
                <form onSubmit={handleCorporateLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">E-posta Adresi</Label>
                    <Input id="email" type="email" placeholder="kurumsal@kurum.org" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Şifre</Label>
                    <Input id="password" type="password" required />
                  </div>
                  <Button type="submit" className="w-full h-11 text-base font-bold">
                    Kurumsal Giriş
                  </Button>
                </form>
                <div className="text-center text-sm">
                  <span className="text-muted-foreground">Kuruluş başvurusu yapmak için </span>
                  <Link href="/ngo-onboarding" className="font-bold text-primary hover:underline">Buraya Tıklayın</Link>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Giriş yaparak <Link href="/settings/contracts/kullanici-sozlesmesi" className="underline">Kullanıcı Sözleşmesi</Link> ve <Link href="/settings/contracts/gizlilik-politikasi" className="underline">Gizlilik Politikası</Link>'nı kabul etmiş sayılırsınız.
        </p>
      </div>
    </div>
  );
}
