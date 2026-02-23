
'use client';
import React from 'react';
import Link from 'next/link';
import {
  Menu, Bell, Siren, Globe, Megaphone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserNav } from '@/components/layout/user-nav';
import { usePathname } from 'next/navigation';
import * as Icons from 'lucide-react';
import { languages, useTranslation } from '@/components/providers/language-provider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUser } from '@/firebase';

export default function AppHeader({ onMenuClick }: { onMenuClick: () => void }) {
  const { language, changeLanguage } = useTranslation();
  const pathname = usePathname();
  const { user, isUserLoading } = useUser();
  const isAuthPage = pathname.startsWith('/login') || pathname === '/onboarding' || pathname === '/';

  if (isAuthPage) return null;
  
  const isManagementPage = ['/ngo-admin', '/admin', '/super-admin'].some(p => pathname.startsWith(p));
  if (isManagementPage) return null;

  return (
      <header className="fixed top-0 left-0 right-0 z-30 mx-auto border-b bg-card/80 backdrop-blur-xl lg:left-64">
        <div className="flex h-12 items-center justify-between px-4">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={onMenuClick} className="lg:hidden">
                <Menu className="h-6 w-6" />
            </Button>
            <div className="w-8 h-8" /> 
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
            
            {isUserLoading ? (
                <div className="w-9 h-9 rounded-full bg-muted animate-pulse ml-1" />
            ) : user ? (
                <UserNav />
            ) : (
                <Button asChild size="sm" className="h-8 rounded-full px-5 text-xs font-bold">
                    <Link href="/login/selection?action=login">Giriş Yap</Link>
                </Button>
            )}
          </div>
        </div>
      </header>
  );
}

    