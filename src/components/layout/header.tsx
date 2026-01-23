
'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Menu, Bell, Siren,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from '@/components/ui/sheet';
import { UserAvatar } from '@/components/shared/user-avatar';
import { Separator } from '../ui/separator';
import { usePathname } from 'next/navigation';
import { user } from '@/lib/data';
import { SideNavItem } from '@/lib/types';
import { HangelLogo } from '../icons';

const group1Items: SideNavItem[] = [
  { href: '/market', label: 'Markalar', icon: 'store' },
  { href: '/ngos', label: 'STK\'lar', icon: 'building' },
  { href: '/admin/clubs', label: 'Öğrenci Kulüpleri', icon: 'users' },
];

const group2Items: SideNavItem[] = [
    { href: '/my-donations', label: 'Bağışlarım', icon: 'dollar-sign' },
    { href: '/my-applications', label: 'Başvurularım', icon: 'file-text' },
    { href: '/my-badges', label: 'Rozetler', icon: 'award' },
    { href: '/volunteering', label: 'Gönüllülük', icon: 'heart-handshake' },
];

const group3Items: SideNavItem[] = [
    { href: '/admin', label: 'Yönetim Paneli', icon: 'layout-grid' },
    { href: '/invite', label: 'Arkadaş Davet Et', icon: 'send' },
    { href: '/impact-story', label: 'Etki Hikayem', icon: 'sparkles' },
    { href: '/settings', label: 'Ayarlar', icon: 'settings' },
];

const group4Items: SideNavItem[] = [
  { href: '/leaderboard', label: 'Liderlik Tablosu', icon: 'bar-chart-3' },
  { href: '/library', label: 'Kütüphane', icon: 'library' },
  { href: '/bilgi-toplumu-hizmetleri', label: 'Bilgi Toplumu Hizmetleri', icon: 'book-copy' },
  { href: '/about', label: 'Hakkımızda', icon: 'info' },
  { href: '/support', label: 'Destek', icon: 'help-circle' },
  { href: '/support/ai-assistants', label: 'Yapay Zeka Asistanları', icon: 'bot' },
];


function SideMenu({ isOpen, onOpenChange }: { isOpen: boolean, onOpenChange: (open: boolean) => void }) {
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[300px] p-0 flex flex-col bg-card">
        <SheetHeader className="p-4 border-b">
           <SheetClose asChild>
            <Link href="/profile" className="text-left">
              <SheetTitle className='flex items-center gap-3'>
                <UserAvatar />
                <div>
                  <p className="text-base font-semibold">{user.name}</p>
                  <p className="text-sm font-normal text-muted-foreground">{user.username}</p>
                </div>
              </SheetTitle>
            </Link>
          </SheetClose>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto">
          <nav className="py-4">
            <ul>
              {group1Items.map((item) => (
                <li key={item.label}>
                    <Link href={item.href} passHref>
                        <SheetClose asChild>
                            <div className="flex items-center justify-between px-4 py-2.5 text-base text-foreground hover:bg-accent">
                                <span>{item.label}</span>
                            </div>
                        </SheetClose>
                    </Link>
                </li>
              ))}
            </ul>
            <Separator className="my-2" />
            <ul>
              {group2Items.map((item) => (
                <li key={item.label}>
                  <Link href={item.href} passHref>
                    <SheetClose asChild>
                        <div className="flex items-center justify-between px-4 py-2.5 text-base text-foreground hover:bg-accent">
                            <span>{item.label}</span>
                        </div>
                    </SheetClose>
                  </Link>
                </li>
              ))}
            </ul>
            <Separator className="my-2" />
             <ul>
              {group3Items.map((item) => (
                <li key={item.label}>
                  <Link href={item.href} passHref>
                    <SheetClose asChild>
                        <div className="flex items-center justify-between px-4 py-2.5 text-base text-foreground hover:bg-accent">
                            <span>{item.label}</span>
                        </div>
                    </SheetClose>
                  </Link>
                </li>
              ))}
            </ul>
             <Separator className="my-2" />
             <ul>
              {group4Items.map((item) => (
                <li key={item.label}>
                  <Link href={item.href} passHref>
                    <SheetClose asChild>
                        <div className="flex items-center justify-between px-4 py-2.5 text-base text-foreground hover:bg-accent">
                            <span>{item.label}</span>
                        </div>
                    </SheetClose>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <SheetClose asChild>
          <div className='p-4 border-t'>
            <Link href="/login" className="text-destructive w-full text-center p-2 block">Çıkış Yap</Link>
          </div>
        </SheetClose>
      </SheetContent>
    </Sheet>
  );
}

export default function AppHeader() {
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const pathname = usePathname();
  const isAuthPage = pathname.startsWith('/login') || pathname === '/onboarding' || pathname === '/';

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (isAuthPage) {
    return null;
  }
  
  const hiddenOnPages = [
    '/ngo-admin',
    '/admin',
  ];

  if (hiddenOnPages.some(p => pathname.startsWith(p))) {
    return null;
  }

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-30 mx-auto border-b bg-card/80 backdrop-blur-xl lg:left-64">
        <div className="flex h-12 items-center justify-between px-2">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => setDrawerOpen(true)} className="lg:hidden">
                <Menu className="h-6 w-6" />
            </Button>
            <Link href="/profile" passHref className='lg:hidden'>
              <Button variant="ghost" size="icon">
                  <UserAvatar />
              </Button>
            </Link>
          </div>

          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
             <Link href="/market" passHref className="">
                <span className="text-xl font-bold text-primary">hangel</span>
            </Link>
          </div>

          <div className="flex items-center gap-1">
            <Button asChild variant="ghost" size="icon">
              <Link href="/emergency">
                <Siren className="h-5 w-5 text-destructive" />
              </Link>
            </Button>
             <Link href="/notifications" passHref>
                <Button variant="ghost" size="icon">
                    <Bell className="h-5 w-5" />
                </Button>
            </Link>
          </div>
        </div>
      </header>
      <SideMenu isOpen={isDrawerOpen} onOpenChange={setDrawerOpen} />
    </>
  );
}
