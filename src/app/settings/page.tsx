'use client';

import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { 
    Bell, ChevronRight, FileText, Globe, HelpCircle, Info, LogOut, Palette, Shield, Trash2, User, 
    HeartHandshake, Mail, PersonStanding, Contrast, Type, MinusCircle, Wallet
} from 'lucide-react';
import Link from 'next/link';
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

const SettingsItem = ({ children, icon: Icon, label, iconColor, description }: { children: React.ReactNode, icon: React.ElementType, label: string, iconColor: string, description?: string }) => (
    <div className="flex items-center p-4 text-sm sm:text-base">
        <div className={cn("p-1.5 rounded-lg mr-4", iconColor)}>
            <Icon className="h-5 w-5 text-white" />
        </div>
        <div className='flex-1 space-y-0.5'>
            <label htmlFor={label.replace(/\s/g, '')} className="font-medium cursor-pointer">{label}</label>
            {description && <p className='text-xs text-muted-foreground'>{description}</p>}
        </div>
        {children}
    </div>
);


export default function SettingsPage() {
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
                    <SettingsLink href="/settings/wallet" icon={Wallet} label="Cüzdan ve Ödeme Yöntemleri" iconColor="bg-teal-500" />
                    <SettingsLink href="/settings/security" icon={Shield} label="Güvenlik ve Şifre" iconColor="bg-green-500" />
                 </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Bildirimler</CardTitle>
                <CardDescription>Hangi konularda ve hangi kanallardan bildirim almak istediğinizi seçin.</CardDescription>
            </CardHeader>
             <CardContent className="p-0">
                 <div className="flex flex-col divide-y">
                    <SettingsItem label="Yeni Bağış Yapıldığında" icon={Bell} iconColor="bg-red-500">
                        <Switch id="notif-new-donation" defaultChecked />
                    </SettingsItem>
                    <SettingsItem label="Başvuru Durumu Değiştiğinde" icon={Bell} iconColor="bg-red-500" defaultChecked>
                         <Switch id="notif-app-status" defaultChecked />
                    </SettingsItem>
                    <SettingsItem label="Yeni Rozet Kazanıldığında" icon={Bell} iconColor="bg-red-500" defaultChecked>
                         <Switch id="notif-new-badge" defaultChecked />
                    </SettingsItem>
                     <SettingsItem label="Haftalık Bülten (E-posta)" icon={Mail} iconColor="bg-sky-500">
                         <Switch id="email-newsletter" />
                    </SettingsItem>
                     <SettingsItem label="Aylık Etki Raporu (E-posta)" icon={Mail} iconColor="bg-sky-500" defaultChecked>
                         <Switch id="email-impact-report" defaultChecked />
                    </SettingsItem>
                 </div>
            </CardContent>
        </Card>
        
        <Card>
           <CardHeader>
                <CardTitle>Görünüm ve Erişilebilirlik</CardTitle>
                <CardDescription>Uygulamanın görünümünü ve erişilebilirlik özelliklerini kişiselleştirin.</CardDescription>
            </CardHeader>
             <CardContent className="p-0">
                <div className="flex flex-col divide-y">
                     <SettingsItem label="Tema" icon={Palette} iconColor="bg-gray-500">
                        <Select defaultValue='system'>
                          <SelectTrigger className='w-auto border-none bg-accent focus:ring-0'>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="light">Açık</SelectItem>
                            <SelectItem value="dark">Koyu</SelectItem>
                            <SelectItem value="system">Sistem</SelectItem>
                          </SelectContent>
                        </Select>
                    </SettingsItem>
                    <SettingsItem label="Dil" icon={Globe} iconColor="bg-gray-500">
                        <Select defaultValue='tr'>
                          <SelectTrigger className='w-auto border-none bg-accent focus:ring-0'>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="tr">Türkçe</SelectItem>
                            <SelectItem value="en">English</SelectItem>
                          </SelectContent>
                        </Select>
                    </SettingsItem>
                    <SettingsItem 
                        label="Yüksek Kontrast Modu"
                        description="Okunabilirliği artırmak için renkleri daha belirgin hale getirir."
                        icon={Contrast} 
                        iconColor="bg-indigo-500" 
                    >
                        <Switch id="a11y-contrast" />
                    </SettingsItem>
                    <SettingsItem
                        label="Animasyonları Azalt"
                        description="Uygulama içi geçiş efektlerini azaltır."
                        icon={MinusCircle} 
                        iconColor="bg-indigo-500"
                    >
                         <Switch id="a11y-animations" />
                    </SettingsItem>
                    <SettingsItem label="Yazı Tipi Boyutu" icon={Type} iconColor="bg-indigo-500">
                        <Select defaultValue='normal'>
                          <SelectTrigger className='w-auto border-none bg-accent focus:ring-0'>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="small">Küçük</SelectItem>
                            <SelectItem value="normal">Normal</SelectItem>
                            <SelectItem value="large">Büyük</SelectItem>
                          </SelectContent>
                        </Select>
                    </SettingsItem>
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
                    <SettingsLink href="/support" icon={HelpCircle} label="Destek Merkezi" iconColor="bg-purple-500" />
                    <SettingsLink href="/about" icon={Info} label="Hakkımızda" iconColor="bg-cyan-500" />
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
                <Button variant="secondary" className="w-full justify-start text-base p-6">
                    <LogOut className="mr-2 h-5 w-5" /> Çıkış Yap
                </Button>
                 <AlertDialog>
                  <AlertDialogTrigger asChild>
                     <Button variant="ghost" className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive text-base p-6">
                        <Trash2 className="mr-2 h-5 w-5" /> Hesabı Kalıcı Olarak Sil
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Hesabınızı Silmek Üzeresiniz</AlertDialogTitle>
                      <AlertDialogDescription>
                        Bu işlem geri alınamaz. Tüm profil bilgileriniz, puanlarınız, rozetleriniz ve işlem geçmişiniz kalıcı olarak silinecektir. Devam etmek istediğinizden emin misiniz?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Vazgeç</AlertDialogCancel>
                      <AlertDialogAction className={cn(buttonVariants({ variant: "destructive" }))}>Evet, Hesabımı Sil</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
            </CardContent>
        </Card>

      </div>
    </div>
  );
}
