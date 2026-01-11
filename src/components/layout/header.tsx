"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import {
  Menu, Bell, ShieldAlert, Gift, Star, BookUser, Building, Store, School, LayoutGrid, Users, Settings, Info, HelpCircle, LogOut, ChevronRight, BarChart3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from '@/components/ui/sheet';
import { HangelLogo } from '@/components/icons';
import { UserAvatar } from '@/components/shared/user-avatar';
import { EmergencyDialog } from '@/components/shared/emergency-dialog';
import { Separator } from '../ui/separator';

const sideMenuItems = [
    { href: '/timeline', icon: BarChart3, label: 'hangel Impact Story' },
    { href: '/my-donations', icon: Gift, label: 'Bağışlarım' },
    { href: '/my-applications', icon: BookUser, label: 'Başvurularım' },
    { href: '/my-badges', icon: Star, label: 'Rozetlerim' },
    { href: '/ngos', icon: Building, label: 'Sivil Toplum Kuruluşları' },
    { href: '/market', icon: Store, label: 'Markalar' },
    { href: '/admin/clubs', icon: School, label: 'Öğrenci Kulüpleri' },
    { href: '/admin', icon: LayoutGrid, label: 'Yönetim Paneli' },
    { href: '/invite', icon: Users, label: 'Arkadaşlarını Davet Et' },
];

const secondaryMenuItems = [
    { href: '/settings', icon: Settings, label: 'Ayarlar' },
    { href: '/about', icon: Info, label: 'Hakkımızda' },
    { href: '/support', icon: HelpCircle, label: 'Destek' },
];

function SideMenu({ isOpen, onOpenChange }: { isOpen: boolean, onOpenChange: (open: boolean) => void }) {
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[300px] p-0 flex flex-col bg-card">
        <SheetHeader className="p-4 border-b">
           <SheetTitle className='sr-only'>Menü</SheetTitle>
           <Link href="/timeline" passHref asChild>
            <SheetClose asChild>
                <div className="flex items-center gap-2 text-primary">
                    <HangelLogo className="h-8 w-8 text-primary" />
                    <span className="text-2xl font-bold text-foreground">hangel</span>
                </div>
            </SheetClose>
           </Link>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto">
          <nav className="py-4">
            <ul>
              {sideMenuItems.map((item) => (
                <li key={item.label}>
                    <Link href={item.href} passHref>
                        <SheetClose asChild>
                            <div className="flex items-center justify-between px-4 py-3 text-base text-foreground/80 hover:bg-accent">
                                <div className="flex items-center gap-4">
                                <item.icon className="h-5 w-5 text-primary" />
                                <span>{item.label}</span>
                                </div>
                                <ChevronRight className="h-5 w-5 text-muted-foreground" />
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
                        <div className="flex items-center justify-between px-4 py-3 text-base text-foreground/80 hover:bg-accent">
                            <div className="flex items-center gap-4">
                            <item.icon className="h-5 w-5 text-muted-foreground" />
                            <span>{item.label}</span>
                            </div>
                        </div>
                    </SheetClose>
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/login" passHref>
                    <SheetClose asChild>
                        <div className="flex items-center justify-between px-4 py-3 text-base text-destructive hover:bg-destructive/10">
                            <div className="flex items-center gap-4">
                            <LogOut className="h-5 w-5" />
                            <span>Çıkış Yap</span>
                            </div>
                        </div>
                    </SheetClose>
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default function AppHeader() {
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  
  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 mx-auto max-w-md border-b border-black/10 bg-background/80 backdrop-blur-xl dark:border-white/10">
        <div className="flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => setDrawerOpen(true)}>
              <Menu className="h-6 w-6" />
            </Button>
            <Link href="/timeline" passHref>
                <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-foreground">hangel</span>
                </div>
            </Link>
          </div>
          <div className="flex items-center gap-1">
            <Link href="/notifications" passHref>
                <Button variant="ghost" size="icon">
                    <Bell className="h-5 w-5" />
                </Button>
            </Link>
            <EmergencyDialog>
              <Button variant="ghost" size="icon">
                <ShieldAlert className="h-5 w-5 text-destructive" />
              </Button>
            </EmergencyDialog>
            <Link href="/profile" passHref>
                <Button variant="ghost" size="icon">
                    <UserAvatar />
                </Button>
            </Link>
          </div>
        </div>
      </header>
      <SideMenu isOpen={isDrawerOpen} onOpenChange={setDrawerOpen} />
    </>
  );
}
