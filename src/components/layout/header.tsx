'use client';
import React from 'react';
import Link from 'next/link';
import {
  Menu, Siren, Bell, Globe,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserNav } from '@/components/layout/user-nav';
import { usePathname } from 'next/navigation';
import { languages, useTranslation } from '@/components/providers/language-provider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { HangelLogo } from '@/components/icons';
import { COLLECTIONS } from '@/firebase/collections';

export default function AppHeader({ onMenuClick }: { onMenuClick: () => void }) {
  const { language, changeLanguage, t } = useTranslation();
  const pathname = usePathname();
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const isAuthPage = pathname.startsWith('/login') || pathname === '/onboarding' || pathname === '/';

  // Okunmamış bildirim sayısı (kullanıcı giriş yaptığında)
  const notifQuery = useMemoFirebase(() => {
    if (!db || !user?.uid) return null;
    return query(
      collection(db, COLLECTIONS.notifications),
      where('userId', '==', user.uid),
      where('read', '==', false),
    );
  }, [db, user?.uid]);
  const { data: unreadNotifs } = useCollection<unknown>(notifQuery);
  const unreadCount = (unreadNotifs || []).length;

  if (isAuthPage) return null;
  
  const isManagementPage = ['/ngo-admin', '/admin', '/super-admin'].some(p => pathname.startsWith(p));
  if (isManagementPage) return null;

  return (
      <header className="fixed top-0 left-0 right-0 z-30 mx-auto border-b bg-card/80 backdrop-blur-xl lg:left-64">
        <div className="flex h-12 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={onMenuClick} className="lg:hidden" aria-label={t('a11y.openMenu')}>
                <Menu className="h-6 w-6" />
            </Button>
            <Link href="/home" className="flex items-center">
              <HangelLogo className="text-xl" />
            </Link>
          </div>

          <div className="flex items-center gap-1">
            <div className="hidden md:flex items-center mr-4">
                <Select value={language} onValueChange={changeLanguage}>
                    <SelectTrigger className="w-auto border-none bg-transparent gap-1 h-auto p-0 text-[12px] font-normal text-[#1d1d1f] hover:text-primary transition-colors focus:ring-0">
                        <Globe className="h-3.5 w-3.5" />
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent align="end">
                        {languages.map(lang => (
                            <SelectItem key={lang.value} value={lang.value}>{lang.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            {/* Acil ikonu — herkes (anon + auth) /emergency/about tanıtım sayfasına gider. */}
            <Button asChild variant="ghost" size="icon" aria-label={t('a11y.emergency')}>
              <Link href="/emergency/about">
                <Siren className="h-5 w-5 text-destructive" />
              </Link>
            </Button>

            {/* Bildirim ikonu — sadece giriş yapmış kullanıcılar görür */}
            {user && (
              <Button asChild variant="ghost" size="icon" className="relative" aria-label={t('a11y.notifications')}>
                <Link href="/notifications">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </Link>
              </Button>
            )}

            {isUserLoading ? (
                <div className="w-9 h-9 rounded-full bg-muted animate-pulse ml-1" />
            ) : user ? (
                <UserNav />
            ) : (
                <Button asChild size="sm" className="h-8 rounded-full px-5 text-xs font-bold">
                    <Link href="/login/selection?action=login">{t('nav.login')}</Link>
                </Button>
            )}
          </div>
        </div>
      </header>
  );
}
