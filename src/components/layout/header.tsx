'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Menu, Siren, Bell, Globe, Search, QrCode,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserNav } from '@/components/layout/user-nav';
import { QrScanDialog } from '@/components/auth/qr-scan-dialog';
import { usePathname } from 'next/navigation';
import { languages, useTranslation } from '@/components/providers/language-provider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { HangelLogo } from '@/components/icons';
import { COLLECTIONS } from '@/firebase/collections';
import { cn } from '@/lib/utils';

export default function AppHeader({ onMenuClick }: { onMenuClick: () => void }) {
  const { language, changeLanguage, t } = useTranslation();
  const pathname = usePathname();
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const isAuthPage = pathname.startsWith('/login') || pathname === '/onboarding' || pathname === '/';

  // Liquid Glass: adaptive blur — sayfa scroll edildikçe glass katmanı kalınlaşır.
  // Why: iOS 26 header pattern'i (sayfa üstünde flat, scroll'da prominent).
  const [isScrolled, setIsScrolled] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);
  // Scroll handler rAF ile throttle edilir — her scroll event'inde setState
  // çağrılmaz, frame başına en fazla bir kez okunur (jank önlenir).
  useEffect(() => {
    let ticking = false;
    const update = () => {
      setIsScrolled(window.scrollY > 8);
      ticking = false;
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(update);
      }
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

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
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-30 mx-auto lg:left-64 pt-[var(--sat)]',
          'transition-[background-color,backdrop-filter,border-color] duration-300 ease-spring',
          // Adaptive: scroll'da glass yoğunlaşır, üst durumda neredeyse şeffaf.
          isScrolled
            ? 'glass border-b border-glass-black-8 dark:border-glass-white-8'
            : 'bg-background/40 backdrop-blur-glass-1 border-b border-transparent'
        )}
      >
        <div className="flex h-12 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={onMenuClick} className="lg:hidden" aria-label={t('a11y.openMenu')}>
                <Menu className="h-6 w-6" />
            </Button>
            <Link href="/home" className="flex items-center">
              <HangelLogo className="text-xl" href={null} />
            </Link>
          </div>

          <div className="flex items-center gap-1">
            <div className="hidden md:flex items-center mr-4">
                <Select value={language} onValueChange={changeLanguage}>
                    <SelectTrigger className="w-auto border-none bg-transparent gap-1 h-auto p-0 text-xs font-normal text-foreground hover:text-primary transition-colors focus:ring-0">
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
            {/* Global search — giriş yapmış kullanıcılar görür */}
            {user && (
              <Button asChild variant="ghost" size="icon" aria-label="Ara">
                <Link href="/search">
                  <Search className="h-5 w-5" />
                </Link>
              </Button>
            )}

            {/* Acil ikonu — giriş yapmamış kullanıcı /emergency/about tanıtım sayfasına,
                giriş yapmış kullanıcı /emergency aksiyon sayfasına gider. */}
            <Button asChild variant="ghost" size="icon" aria-label={t('a11y.emergency')}>
              <Link href={user ? '/emergency' : '/emergency/about'}>
                <Siren className="h-5 w-5 text-destructive" />
              </Link>
            </Button>

            {/* Bildirim ikonu — sadece giriş yapmış kullanıcılar görür */}
            {user && (
              <Button asChild variant="ghost" size="icon" className="relative" aria-label={t('a11y.notifications')}>
                <Link href="/notifications">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[11px] font-bold flex items-center justify-center leading-none">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </Link>
              </Button>
            )}

            {/* QR Okut — giriş yapmış kullanıcı başka cihazın QR'ını ya da kodunu
                okutup/girip o cihazı giriş yaptırır (kamerasız cihazlar kodla). */}
            {user && (
              <Button variant="ghost" size="icon" aria-label="QR Okut" title="QR Okut" onClick={() => setScanOpen(true)}>
                <QrCode className="h-5 w-5" />
              </Button>
            )}

            {isUserLoading ? (
                <div className="w-9 h-9 rounded-full bg-muted animate-pulse ml-1" />
            ) : user ? (
                <UserNav />
            ) : (
                <Button asChild size="sm" className="h-11 rounded-full px-5 text-xs font-bold">
                    <Link href="/login/selection?action=login">{t('nav.login')}</Link>
                </Button>
            )}
          </div>
        </div>
        {user && <QrScanDialog open={scanOpen} onOpenChange={setScanOpen} />}
      </header>
  );
}
