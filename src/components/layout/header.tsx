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

export default function AppHeader() {
  const { language, changeLanguage } = useTranslation();
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();
  const isAuthPage = pathname.startsWith('/login') || pathname === '/onboarding' || pathname === '/';

  if (isAuthPage) return null;
  if (['/ngo-admin', '/admin'].some(p => pathname.startsWith(p))) return null;

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-30 mx-auto border-b bg-card/80 backdrop-blur-xl lg:left-64">
        <div className="flex h-12 items-center justify-between px-4">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={() => setDrawerOpen(true)} className="lg:hidden">
                <Menu className="h-6 w-6" />
            </Button>
            <div className="w-8 h-8" /> {/* Logo alanı talebiniz üzerine boşaltılmıştır */}
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
    </>
  );
}
