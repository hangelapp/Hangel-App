'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { Bell, ChevronRight, FileText, Globe, HelpCircle, Info, LogOut, Palette, Shield, Trash2, User, HeartHandshake, Mail, PersonStanding, Contrast, Type, MinusCircle } from 'lucide-react';
import Link from 'next/link';

const SettingsSection = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <Card className={cn("overflow-hidden", className)}>
    <CardContent className="p-0">
      <div className="flex flex-col">
        {children}
      </div>
    </CardContent>
  </Card>
);

const SettingsLink = ({ href, icon, label, iconColor }: { href: string, icon: React.ElementType, label: string, iconColor: string }) => {
  const Icon = icon;
  return (
    <Link href={href} className="flex items-center p-4 hover:bg-accent transition-colors w-full text-base">
      <div className={cn("p-1.5 rounded-lg mr-4", iconColor)}>
          <Icon className="h-5 w-5 text-white" />
      </div>
      <span className="flex-1 font-medium">{label}</span>
      <ChevronRight className="h-5 w-5 text-muted-foreground" />
    </Link>
  )
}

const SettingsSwitch = ({ label, description, icon: Icon, iconColor, defaultChecked = false }: { label: string, description?: string, icon: React.ElementType, iconColor: string, defaultChecked?: boolean }) => (
    <div className="flex items-center p-4 text-base">
        <div className={cn("p-1.5 rounded-lg mr-4", iconColor)}>
            <Icon className="h-5 w-5 text-white" />
        </div>
        <div className='flex-1 space-y-0.5'>
            <label htmlFor={label} className="font-medium cursor-pointer">{label}</label>
            {description && <p className='text-xs text-muted-foreground'>{description}</p>}
        </div>
        <Switch id={label} defaultChecked={defaultChecked} />
    </div>
);


export default function SettingsPage() {
  return (
    <div className="p-4 space-y-8 animate-in fade-in-0">
      <h1 className="text-3xl font-bold font-headline">Ayarlar</h1>

      <div className='space-y-6'>
        <SettingsSection>
          <SettingsLink href="#" icon={User} label="Kişisel Bilgileri Düzenle" iconColor="bg-blue-500" />
          <Separator />
          <SettingsLink href="#" icon={HeartHandshake} label="Gönüllülük Bilgilerini Düzenle" iconColor="bg-orange-500" />
        </SettingsSection>

        <SettingsSection>
           <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 pt-4">Bildirimler</h2>
           <SettingsSwitch label="Yeni Bağış Yapıldığında" icon={Bell} iconColor="bg-red-500" defaultChecked />
           <Separator />
           <SettingsSwitch label="Başvuru Durumu Değiştiğinde" icon={Bell} iconColor="bg-red-500" defaultChecked />
           <Separator />
           <SettingsSwitch label="Yeni Rozet Kazanıldığında" icon={Bell} iconColor="bg-red-500" />
        </SettingsSection>
        
         <SettingsSection>
           <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 pt-4">E-posta Tercihleri</h2>
           <SettingsSwitch label="Haftalık Bülten" icon={Mail} iconColor="bg-sky-500" />
           <Separator />
           <SettingsSwitch label="Aylık Etki Raporu" icon={Mail} iconColor="bg-sky-500" defaultChecked />
        </SettingsSection>

        <SettingsSection>
          <SettingsLink href="#" icon={Shield} label="Güvenlik ve Şifre" iconColor="bg-green-500" />
        </SettingsSection>
        
        <SettingsSection>
           <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 pt-4">Erişilebilirlik</h2>
           <SettingsSwitch 
            label="Yüksek Kontrast Modu"
            description="Renk kontrastını artırarak okunabilirliği iyileştirir."
            icon={Contrast} 
            iconColor="bg-indigo-500" 
           />
           <Separator />
           <SettingsSwitch 
            label="Animasyonları Azalt"
            description="Uygulama içi animasyonları ve geçiş efektlerini azaltır."
            icon={MinusCircle} 
            iconColor="bg-indigo-500" 
           />
           <Separator />
            <div className="flex items-center p-4 text-base">
                <div className="p-1.5 rounded-lg mr-4 bg-indigo-500">
                    <Type className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Yazı Tipi Boyutu</p>
                  <p className="text-xs text-muted-foreground">Uygulama genelindeki metin boyutunu ayarlar.</p>
                </div>
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
            </div>
        </SettingsSection>

        <SettingsSection>
            <div className="flex items-center p-4 text-base">
                <div className="p-1.5 rounded-lg mr-4 bg-gray-500">
                    <Palette className="h-5 w-5 text-white" />
                </div>
                <span className="flex-1 font-medium">Tema</span>
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
            </div>
             <Separator />
            <div className="flex items-center p-4 text-base">
                 <div className="p-1.5 rounded-lg mr-4 bg-gray-500">
                    <Globe className="h-5 w-5 text-white" />
                </div>
                <span className="flex-1 font-medium">Dil</span>
                <Select defaultValue='tr'>
                  <SelectTrigger className='w-auto border-none bg-accent focus:ring-0'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tr">Türkçe</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
            </div>
        </SettingsSection>

        <SettingsSection>
          <SettingsLink href="/support" icon={HelpCircle} label="Yardım Merkezi" iconColor="bg-cyan-500" />
          <Separator />
          <SettingsLink href="/about" icon={Info} label="Hakkımızda" iconColor="bg-cyan-500" />
           <Separator />
          <SettingsLink href="/settings/contracts" icon={FileText} label="Sözleşmeler ve Politikalar" iconColor="bg-gray-400" />
        </SettingsSection>

        <SettingsSection>
          <Link href="/login">
                <div className="flex items-center p-4 text-primary font-medium justify-center text-base">
                    <LogOut className="mr-2 h-5 w-5" />
                    Çıkış Yap
                </div>
            </Link>
        </SettingsSection>
      </div>

    </div>
  );
}
