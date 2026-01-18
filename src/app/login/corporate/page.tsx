'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function CorporateLoginPage() {
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement corporate login logic
    router.push('/admin');
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement corporate registration logic
    // Redirect to a "pending approval" page or dashboard
    router.push('/admin'); 
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] p-4 bg-background relative">
      <Button onClick={() => router.push('/login')} variant="ghost" size="icon" className="absolute top-4 left-4">
          <ArrowLeft className="h-6 w-6" />
       </Button>
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground tracking-tight font-headline">
            Kurumsal Hesap
          </h1>
        </div>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Giriş Yap</TabsTrigger>
            <TabsTrigger value="register">Kayıt Ol</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login" className="mt-6">
            <form className="space-y-6" onSubmit={handleLogin}>
              <div className="space-y-2">
                <Label htmlFor="email-login">E-posta Adresi</Label>
                <Input id="email-login" type="email" required placeholder="kurumsal@eposta.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password-login">Şifre</Label>
                <Input id="password-login" type="password" required />
              </div>
               <div className="flex items-center justify-end text-sm">
                <Button variant="link" className="p-0 text-primary">
                    Şifremi Unuttum
                </Button>
            </div>
              <Button type="submit" className="w-full">
                Giriş Yap
              </Button>
            </form>
          </TabsContent>
          
          <TabsContent value="register" className="mt-6">
            <form className="space-y-6" onSubmit={handleRegister}>
              <div className="space-y-2">
                <Label htmlFor="org-type">Kuruluş Türü</Label>
                <Select required>
                  <SelectTrigger id="org-type">
                    <SelectValue placeholder="Kuruluş türünü seçin..." />
                  </SelectTrigger>
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
              <Button type="submit" className="w-full">
                Başvuruyu Tamamla
              </Button>
               <p className="text-xs text-center text-muted-foreground">
                Başvurunuz incelendikten sonra hesabınız aktifleştirilecektir.
              </p>
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
