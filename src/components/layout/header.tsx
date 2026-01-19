
'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import {
  Menu, Bell, ShieldAlert, Settings,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from '@/components/ui/sheet';
import { HangelLogo } from '@/components/icons';
import { UserAvatar } from '@/components/shared/user-avatar';
import { EmergencyDialog } from '@/components/shared/emergency-dialog';
import { Separator } from '../ui/separator';
import { usePathname } from 'next/navigation';
import { user } from '@/lib/data';

const sideMenuItems = [
    { href: '/timeline', label: 'Zaman Tüneli' },
    { href: '/market', label: 'Market' },
    { href: '/volunteering', label: 'Gönüllülük' },
    { href: '/my-donations', label: 'Bağışlarım' },
    { href: '/my-applications', label: 'Başvurularım' },
    { href: '/my-badges', label: 'Rozetler ve Sertifikalar' },
];

const secondaryMenuItems = [
  { href: '/ngos', label: 'STK\'lar' },
  { href: '/admin', label: 'Yönetim Paneli' },
  { href: '/invite', label: 'Arkadaş Davet Et' },
];

const utilityMenuItems = [
    { href: '/settings', label: 'Ayarlar' },
    { href: '/support', label: 'Destek' },
];

function SideMenu({ isOpen, onOpenChange }: { isOpen: boolean, onOpenChange: (open: boolean) => void }) {
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[300px] p-0 flex flex-col bg-card">
        <SheetHeader className="p-4 border-b">
           <SheetTitle className='flex items-center gap-3'>
              <UserAvatar />
              <div>
                <p className="text-base font-semibold">{user.name}</p>
                <p className="text-sm font-normal text-muted-foreground">{user.username}</p>
              </div>
           </SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto">
          <nav className="py-4">
            <ul>
              {sideMenuItems.map((item) => (
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
              {secondaryMenuItems.map((item) => (
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
              {utilityMenuItems.map((item) => (
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
  const pathname = usePathname();
  const isAuthPage = pathname.startsWith('/login') || pathname === '/onboarding' || pathname === '/';

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
      <header className="fixed top-0 left-0 right-0 z-30 mx-auto border-b bg-background/70 backdrop-blur-xl lg:left-64">
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
             <Link href="/timeline" passHref className="">
                <HangelLogo className="h-8 w-8 text-primary" />
            </Link>
          </div>

          <div className="flex items-center gap-1">
            <EmergencyDialog>
              <Button variant="ghost" size="icon">
                <ShieldAlert className="h-5 w-5 text-destructive" />
              </Button>
            </EmergencyDialog>
            <Link href="/settings" passHref>
                <Button variant="ghost" size="icon">
                    <Settings className="h-5 w-5" />
                </Button>
            </Link>
          </div>
        </div>
      </header>
      <SideMenu isOpen={isDrawerOpen} onOpenChange={setDrawerOpen} />
    </>
  );
}
