'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Gift,
  Star,
  Users,
  Settings,
  Info,
  LogOut,
  ChevronRight,
  Heart,
  Store,
  BookUser,
  LayoutGrid,
  Building,
  School,
  Briefcase,
  HelpCircle,
  BarChart,
} from 'lucide-react';
import TopNav from '@/components/top-nav';
import BottomNav from '@/components/bottom-nav';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { HangelLogo } from './icons';
import { Button } from './ui/button';

const sideMenuItems = [
    { href: '/timeline', icon: BarChart, label: 'hangel Impact Story' },
    { href: '/profile', icon: Gift, label: 'Bağışlarım' },
    { href: '/profile', icon: BookUser, label: 'Başvurularım' },
    { href: '/profile', icon: Star, label: 'Rozetlerim' },
    { href: '/market', icon: Building, label: 'Sivil Toplum Kuruluşları' },
    { href: '/market', icon: Store, label: 'Markalar' },
    { href: '#', icon: School, label: 'Öğrenci Kulüpleri' },
    { href: '#', icon: LayoutGrid, label: 'Yönetim Paneli' },
    { href: '#', icon: Users, label: 'Arkadaşlarını Davet Et' },
  ];
  
  const secondaryMenuItems = [
    { href: '#', icon: Settings, label: 'Ayarlar' },
    { href: '#', icon: Info, label: 'Hakkımızda' },
    { href: '#', icon: HelpCircle, label: 'Destek' },
  ];

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const [isDrawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen">
      <TopNav onMenuClick={() => setDrawerOpen(true)} />
      <main className="flex-grow pt-16 pb-20">{children}</main>
      <BottomNav />

      <Sheet open={isDrawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent side="left" className="w-[300px] p-0 flex flex-col bg-card">
          <SheetHeader className="p-4 border-b">
            <SheetTitle>
              <Link
                href="/timeline"
                className="flex items-center gap-2 text-primary"
                onClick={() => setDrawerOpen(false)}
              >
                <HangelLogo className="h-8 w-8" />
                <span className="text-2xl font-bold font-headline">Hangel</span>
              </Link>
            </SheetTitle>
          </SheetHeader>
          <ScrollArea className="flex-1">
            <nav className="py-4">
              <ul>
                {sideMenuItems.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="flex items-center justify-between px-4 py-3 text-base text-foreground/80 hover:bg-accent/50"
                      onClick={() => setDrawerOpen(false)}
                    >
                      <div className="flex items-center gap-4">
                        <item.icon className="h-5 w-5 text-primary" />
                        <span>{item.label}</span>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </Link>
                  </li>
                ))}
              </ul>
              <Separator className="my-2" />
               <div className="px-4 py-2">
                 <Button variant="outline" className="w-full justify-between">
                    Kuruluş Değiştir
                    <ChevronRight className="h-4 w-4" />
                 </Button>
               </div>
              <Separator className="my-2" />
              <ul>
                {secondaryMenuItems.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="flex items-center justify-between px-4 py-3 text-base text-foreground/80 hover:bg-accent/50"
                      onClick={() => setDrawerOpen(false)}
                    >
                      <div className="flex items-center gap-4">
                        <item.icon className="h-5 w-5 text-muted-foreground" />
                        <span>{item.label}</span>
                      </div>
                    </Link>
                  </li>
                ))}
                <li>
                  <Link
                    href="/login"
                    className="flex items-center justify-between px-4 py-3 text-base text-destructive hover:bg-destructive/10"
                    onClick={() => setDrawerOpen(false)}
                  >
                    <div className="flex items-center gap-4">
                      <LogOut className="h-5 w-5" />
                      <span>Çıkış Yap</span>
                    </div>
                  </Link>
                </li>
              </ul>
            </nav>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  );
}
