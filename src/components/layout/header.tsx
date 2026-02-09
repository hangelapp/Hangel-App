'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Menu, Bell, Siren, Globe, Megaphone, ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from '@/components/ui/sheet';
import { UserAvatar } from '@/components/shared/user-avatar';
import { usePathname } from 'next/navigation';
import { user } from '@/lib/data';
import { SideNavItem } from '@/lib/types';
import * as Icons from 'lucide-react';
import { cn } from '@/lib/utils';
import { languages, useTranslation } from '@/components/providers/language-provider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const iconColorMap: { [key: string]: string } = {
  store: 'bg-green-500',
  building: 'bg-orange-500',
  users: 'bg-blue-500',
  'dollar-sign': 'bg-green-600',
  'file-text': 'bg-sky-500',
  award: 'bg-amber-500',
  'heart-handshake': 'bg-red-500',
  'bar-chart-3': 'bg-indigo-500',
  send: 'bg-cyan-500',
  sparkles: 'bg-purple-500',
  library: 'bg-amber-700',
  'layout-grid': 'bg-slate-500',
  settings: 'bg-gray-500',
  info: 'bg-blue-400',
  'help-circle': 'bg-teal-500',
  'shield': 'bg-red-600',
  'zap': 'bg-yellow-500',
};

const group1Items: SideNavItem[] = [
  { href: '/market', label: 'Markalar', icon: 'store' },
  { href: '/ngos', label: 'STK\'lar', icon: 'building' },
  { href: '/admin/clubs', label: 'Öğrenci Kulüpleri', icon: 'users' },
];

const group2Items: SideNavItem[] = [
    { href: '/my-donations', label: 'Bağışlarım', icon: 'dollar-sign' },
    { href: '/my-applications', label: 'Başvurularım', icon: 'file-text' },
    { href: '/my-badges', label: 'Rozetler ve Sertifikalar', icon: 'award' },
    { href: '/volunteering', label: 'Gönüllülük', icon: 'heart-handshake' },
];

const group3Items: SideNavItem[] = [
    { href: '/leaderboard', label: 'Liderlik Tablosu', icon: 'bar-chart-3' },
    { href: '/invite', label: 'Arkadaş Davet Et', icon: 'send' },
    { href: '/impact-story', label: 'Etki Story', icon: 'sparkles' },
    { href: '/library', label: 'Kütüphane', icon: 'library' },
];

const group4Items: SideNavItem[] = [
  { href: '/admin', label: 'Yönetim Paneli', icon: 'layout-grid' },
  { href: '/super-admin', label: 'Süper Admin', icon: 'shield' },
  { href: '/settings', label: 'Ayarlar', icon: 'settings' },
  { href: '/about', label: 'Hakkımızda', icon: 'info' },
  { href: '/merchant', label: 'Üye İşyeri', icon: 'zap' },
  { href: '/ngo-onboarding', label: 'STK Başvurusu', icon: 'HeartHandshake' },
  { href: '/support', label: 'Destek', icon: 'help-circle' },
];

const navKeyMap: Record<string, string> = {
  'Markalar': 'market',
  'STK\'lar': 'ngos',
  'Öğrenci Kulüpleri': 'clubs',
  'Bağışlarım': 'donations',
  'Başvurularım': 'applications',
  'Rozetler ve Sertifikalar': 'badges',
  'Mesajlarım': 'messages',
  'Liderlik Tablosu': 'leaderboard',
  'Arkadaş Davet Et': 'invite',
  'Etki Story': 'impactStory',
  'Etki Hikayem': 'impactStory',
  'Kütüphane': 'library',
  'Yönetim Paneli': 'admin',
  'Süper Admin': 'superAdmin',
  'Ayarlar': 'settings',
  'Hakkımızda': 'about',
  'Üye İşyeri': 'merchant',
  'STK Başvurusu': 'ngoOnboarding',
  'Destek': 'support',
  'Gönüllülük': 'volunteering',
};

const MobileNavLink = ({ item, isLast }: { item: SideNavItem; isLast: boolean }) => {
    const { t } = useTranslation();
    const Icon = Icons[item.icon.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('') as keyof typeof Icons] || Icons.HelpCircle;
    const color = iconColorMap[item.icon] || 'bg-gray-500';
    const translationKey = navKeyMap[item.label] || item.label;

    return (
        <li className={cn(!isLast && 'border-b')}>
             <SheetClose asChild>
                <Link
                    href={item.href}
                    className={'group flex items-center justify-between p-3 transition-colors'}
                >
                    <div className="flex items-center gap-4">
                        <div className={cn('w-7 h-7 rounded-md flex items-center justify-center', color)}>
                            <Icon className="h-4 w-4 text-white" aria-hidden="true" />
                        </div>
                        <span className={'text-base font-medium text-foreground'}>
                            {t(`nav.${translationKey}`)}
                        </span>
                    </div>
                    <Icons.ChevronRight className="h-5 w-5 text-muted-foreground/50" />
                </Link>
             </SheetClose>
        </li>
    );
};

const MobileNavList = ({ items }: { items: SideNavItem[] }) => (
    <ul role="list" className="bg-card rounded-lg overflow-hidden border">
        {items.map((item, index) => (
            <MobileNavLink key={item.label} item={item} isLast={index === items.length - 1} />
        ))}
    </ul>
);

function SideMenu({ isOpen, onOpenChange }: { isOpen: boolean, onOpenChange: (open: boolean) => void }) {
  const { t } = useTranslation();
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[300px] p-0 flex flex-col bg-secondary">
        <SheetHeader className="p-4 border-b bg-card text-left">
           <SheetClose asChild>
            <Link href="/profile" className="text-left">
              <div className='flex items-center gap-3'>
                <UserAvatar />
                <div>
                  <p className="text-base font-semibold">{user.name}</p>
                  <p className="text-sm font-normal text-muted-foreground">{user.username}</p>
                </div>
              </div>
            </Link>
          </SheetClose>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <MobileNavList items={group1Items} />
            <MobileNavList items={group2Items} />
            <MobileNavList items={group3Items} />
            <MobileNavList archetype="secondary" items={group4Items} />
        </div>
         <div className='p-4 border-t bg-secondary'>
            <ul role="list" className="bg-card rounded-lg overflow-hidden border">
                <li>
                    <SheetClose asChild>
                         <Link
                            href="/login"
                            className='group flex items-center p-3'
                        >
                            <div className='w-7 h-7 rounded-md flex items-center justify-center bg-red-500'>
                                <Icons.LogOut className='h-4 w-4 text-white' aria-hidden="true" />
                            </div>
                            <span className='ml-4 text-base font-medium text-destructive'>{t('nav.logout')}</span>
                        </Link>
                    </SheetClose>
                </li>
            </ul>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default function AppHeader() {
  const { language, changeLanguage } = useTranslation();
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const pathname = usePathname();
  const isAuthPage = pathname.startsWith('/login') || pathname === '/onboarding' || pathname === '/';

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (isAuthPage) return null;
  
  if (['/ngo-admin', '/admin'].some(p => pathname.startsWith(p))) return null;

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-30 mx-auto border-b bg-card/80 backdrop-blur-xl lg:left-64">
        <div className="flex h-12 items-center justify-between px-2">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => setDrawerOpen(true)} className="lg:hidden">
                <Menu className="h-6 w-6" />
            </Button>
            <div className="hidden lg:block w-4" /> 
          </div>

          <div className="flex items-center gap-1">
            <div className="hidden md:flex items-center mr-4">
                <Select value={language} onValueChange={changeLanguage}>
                    <SelectTrigger className="w-auto border-none bg-transparent gap-1 h-auto p-0 text-[12px] font-normal text-[#1d1d1f] hover:text-primary transition-colors focus:ring-0">
                        <Icons.Globe className="h-3.5 w-3.5" />
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent align="end">
                        {languages.map(lang => (
                            <SelectItem key={lang.value} value={lang.value}>{lang.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <Button asChild variant="ghost" size="icon"><Link href="/stories"><Megaphone className="h-5 w-5" /></Link></Button>
            <Button asChild variant="ghost" size="icon"><Link href="/emergency"><Siren className="h-5 w-5 text-destructive" /></Link></Button>
            <Button asChild variant="ghost" size="icon"><Link href="/notifications"><Bell className="h-5 w-5" /></Link></Button>
            <Link href="/profile" passHref className="lg:hidden ml-1">
              <Button variant="ghost" size="icon"><UserAvatar /></Button>
            </Link>
          </div>
        </div>
      </header>
      <SideMenu isOpen={isDrawerOpen} onOpenChange={setDrawerOpen} />
    </>
  );
}
