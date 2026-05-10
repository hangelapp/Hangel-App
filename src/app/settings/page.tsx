
'use client';

import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { 
    Bell, ChevronRight, FileText, Globe, HelpCircle, Info, LogOut, Palette, Shield, Trash2, User,
    HeartHandshake, PersonStanding, Wallet, Users, HandCoins, Store
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useState } from 'react';

const SettingsLink = ({ href, icon, label, iconColor }: { href: string, icon: React.ElementType, label: string, iconColor: string }) => {
  const Icon = icon;
  return (
    <Link href={href} className="flex items-center p-4 hover:bg-accent transition-colors w-full text-sm sm:text-base">
      <div className={cn("p-1.5 rounded-lg mr-4", iconColor)}>
          <Icon className="h-5 w-5 text-white" />
      </div>
      <span className="flex-1 font-medium">{label}</span>
      <ChevronRight className="h-5 w-5 text-muted-foreground" />
    </Link>
  )
}

export default function SettingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);

  const handleDeleteAccount = () => {
    toast({
        variant: 'destructive',
        title: 'Hesap Silindi',
        description: 'Hesabınız kalıcı olarak silindi. Güvenli bir şekilde çıkış yapılıyor.',
    });
    setTimeout(async () => {
        try {
            await signOut(auth);
            router.push('/login');
        } catch (error) {
            console.error("Sign out error:", error);
        }
    }, 2000);
  };

  const handleSignOut = async () => {
    try {
        await signOut(auth);
        router.push('/login');
    } catch (error) {
        console.error("Sign out error:", error);
    }
  };
  
  return (
    <div className="p-4 space-y-8 animate-in fade-in-0">
      <h1 className="text-3xl font-bold font-headline">Ayarlar</h1>

      <div className='space-y-6'>

        <Card>
            <CardHeader>
                <CardTitle>Hesap</CardTitle>
                <CardDescription>Profil, gönüllülük ve güvenlik bilgilerinizi yönetin.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
                 <div className="flex flex-col divide-y">
                    <SettingsLink href="/settings/profile" icon={User} label="Kişisel Bilgileri Düzenle" iconColor="bg-blue-500" />
                    <SettingsLink href="/settings/volunteer" icon={HeartHandshake} label="Gönüllülük Bilgilerini Düzenle" iconColor="bg-orange-500" />
                    <SettingsLink href="/settings/security" icon={Shield} label="Güvenlik ve Şifre" iconColor="bg-sky-500" />
                 </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Bağışçı ve Gönüllüsü Olduğun STK'lar</CardTitle>
                <CardDescription>Desteklediğiniz ve gönüllüsü olduğunuz kuruluşları yönetin.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
                    <div className="flex flex-col divide-y">
                        <SettingsLink href="/settings/ngo-selection" icon={HandCoins} label="Bağışçısı Olduğun STK'ları Değiştir" iconColor="bg-amber-500" />
                        <SettingsLink href="/settings/volunteer-ngo-selection" icon={HeartHandshake} label="Gönüllüsü Olduğun STK'ları Değiştir" iconColor="bg-rose-500" />
                    </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Takip ettiğim Markalar</CardTitle>
                <CardDescription>Takip ettiğiniz markaları yönetin.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
                <div className="flex flex-col divide-y">
                    <SettingsLink href="/settings/brands" icon={Store} label="Takip Ettiğim Markaları Gör" iconColor="bg-violet-500" />
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Uygulama</CardTitle>
                <CardDescription>Bildirim, görünüm ve dil tercihlerinizi yönetin.</CardDescription>
            </CardHeader>
             <CardContent className="p-0">
                 <div className="flex flex-col divide-y">
                    <SettingsLink href="/settings/notifications" icon={Bell} label="Bildirim Ayarları" iconColor="bg-red-500" />
                    <SettingsLink href="/settings/theme" icon={Palette} label="Tema Ayarları" iconColor="bg-gray-500" />
                    <SettingsLink href="/settings/language" icon={Globe} label="Dil Ayarları" iconColor="bg-blue-500" />
                    <SettingsLink href="/settings/accessibility" icon={PersonStanding} label="Erişilebilirlik" iconColor="bg-indigo-500" />
                    <SettingsLink href="/settings/privacy" icon={Shield} label="Gizlilik ve Etkileşim" iconColor="bg-teal-500" />
                 </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Yardım ve Yasal</CardTitle>
                 <CardDescription>Yardıma ihtiyacınız olduğunda veya politikalarımızı merak ettiğinizde.</CardDescription>
            </CardHeader>
             <CardContent className="p-0">
                 <div className="flex flex-col divide-y">
                    <SettingsLink href="/settings/contracts" icon={FileText} label="Sözleşmeler ve Politikalar" iconColor="bg-slate-500" />
                 </div>
            </CardContent>
        </Card>

         <Card>
            <CardHeader>
                <CardTitle>Hesap İşlemleri</CardTitle>
                <CardDescription>Hesabınızı yönetin, dondurun veya silin.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Button variant="secondary" className="w-full justify-start text-base p-6 rounded-2xl" onClick={() => setIsLogoutDialogOpen(true)}>
                    <LogOut className="mr-2 h-5 w-5" /> Çıkış Yap
                </Button>
                
                <AlertDialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
                    <AlertDialogContent className="rounded-3xl">
                        <AlertDialogHeader>
                            <AlertDialogTitle className="text-xl font-bold">Emin misin?</AlertDialogTitle>
                            <AlertDialogDescription className="text-base">
                                Çıkış yaptığında yaptığın alışverişlerden bağış yapamazsın.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="gap-2">
                            <AlertDialogCancel className="rounded-2xl font-bold">Vazgeç</AlertDialogCancel>
                            <AlertDialogAction onClick={handleSignOut} className="rounded-2xl font-bold bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                Çıkış Yap
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                 <AlertDialog>
                  <AlertDialogTrigger asChild>
                     <Button variant="ghost" className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive text-sm p-3 rounded-xl">
                        <Trash2 className="mr-2 h-5 w-5" /> Hesabı Kalıcı Olarak Sil
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="rounded-3xl">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-xl font-bold text-destructive">Hesabınızı Silmek Üzeresiniz</AlertDialogTitle>
                      <AlertDialogDescription className="text-base">
                        Bu işlem geri alınamaz. Tüm profil bilgileriniz, puanlarınız, rozetleriniz ve işlem geçmişiniz kalıcı olarak silinecektir. Devam etmek istediğinizden emin misiniz?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2">
                      <AlertDialogCancel className="rounded-2xl font-bold">Vazgeç</AlertDialogCancel>
                      <AlertDialogAction className={cn(buttonVariants({ variant: "destructive" }), "rounded-2xl font-bold")} onClick={handleDeleteAccount}>Evet, Hesabımı Sil</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
            </CardContent>
        </Card>

      </div>
    </div>
  );
}
