'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import AppHeader from '@/components/layout/header';
import { SideNav } from '@/components/layout/SideNav';
import type { SideNavItem, User } from '@/lib/types';
import { Sheet, SheetContent, SheetClose, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import Link from 'next/link';
import { HangelLogo } from '@/components/icons';
import { UserAvatar } from '@/components/shared/user-avatar';
import * as Icons from 'lucide-react';
import { cn } from '@/lib/utils';
import { user as staticUser } from '@/lib/data';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';

const group1Items: SideNavItem[] = [
  { href: '/market', label: 'Markalar', icon: 'store' },
  { href: '/ngos', label: 'STK\'lar', icon: 'building' },
  { href: '/clubs', label: 'Öğrenci Kulüpleri', icon: 'users' },
  { href: '/events', label: 'Etkinlikler', icon: 'calendar' },
];

const group2Items: SideNavItem[] = [
    { href: '/my-donations', label: 'Bağışlarım', icon: 'dollar-sign' },
    { href: '/my-applications', label: 'Başvurularım', icon: 'file-text' },
    { href: '/my-badges', label: 'Rozetler ve Sertifikalar', icon: 'award' },
    { href: '/messages', label: 'Mesajlarım', icon: 'message-square' },
];

const group3Items: SideNavItem[] = [
    { href: '/leaderboard', label: 'Liderlik Tablosu', icon: 'bar-chart-3' },
    { href: '/invite', label: 'Arkadaş Davet Et', icon: 'send' },
    { href: '/library', label: 'Kütüphane', icon: 'library' },
];

const group4Items: SideNavItem[] = [
  { href: '/admin', label: 'Yönetim Paneli', icon: 'layout-grid' },
  { href: '/super-admin', label: 'Admin Paneli', icon: 'shield' },
  { href: '/settings', label: 'Ayarlar', icon: 'settings' },
  { href: '/about', label: 'Hakkımızda', icon: 'info' },
  { href: '/login/selection?action=register&type=corporate&entity=BRAND', label: 'Üye İşyeri', icon: 'zap' },
  { href: '/login/selection?action=register&type=corporate&entity=NGO', label: 'STK Başvurusu', icon: 'HeartHandshake' },
  { href: '/support/app-support', label: 'App Destek', icon: 'help-circle' },
];

const iconColorMap: { [key: string]: string } = {
  store: 'bg-green-500',
  building: 'bg-orange-500',
  users: 'bg-blue-500',
  calendar: 'bg-rose-500',
  'dollar-sign': 'bg-green-600',
  'file-text': 'bg-sky-500',
  award: 'bg-amber-500',
  'message-square': 'bg-blue-400',
  'bar-chart-3': 'bg-indigo-500',
  send: 'bg-cyan-500',
  sparkles: 'bg-purple-500',
  library: 'bg-amber-700',
  'layout-grid': 'bg-slate-500',
  shield: 'bg-red-600',
  settings: 'bg-gray-500',
  info: 'bg-blue-400',
  zap: 'bg-yellow-500',
  'HeartHandshake': 'bg-rose-500',
  'help-circle': 'bg-teal-500',
};

const MobileNavLink = ({ item, onClick }: { item: SideNavItem; onClick: () => void }) => {
    const Icon = Icons[item.icon.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('') as keyof typeof Icons] || Icons.HelpCircle;
    const color = iconColorMap[item.icon] || 'bg-gray-500';

    return (
        <SheetClose asChild>
            <Link href={item.href} className='group flex items-center justify-between p-3 hover:bg-accent/50 transition-colors'>
                <div className="flex items-center gap-4">
                    <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', color)}>
                        <Icon className="h-5 w-5 text-white" />
                    </div>
                    <span className='text-sm font-semibold text-foreground'>{item.label}</span>
                </div>
                <Icons.ChevronRight className="h-5 w-5 text-muted-foreground/50" />
            </Link>
        </SheetClose>
    );
};

export function AppShell({ children }: { children: React.ReactNode }) {
    const [isDrawerOpen, setDrawerOpen] = React.useState(false);
    const pathname = usePathname();
    const router = useRouter();
    const [isMounted, setIsMounted] = useState(false);
    const { user: authUser, isUserLoading } = useUser();
    const db = useFirestore();

    const userDocRef = useMemoFirebase(() => {
        if (!db || !authUser) return null;
        return doc(db, 'users', authUser.uid);
    }, [db, authUser]);

    const { data: userData } = useDoc<User>(userDocRef);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Authorization Flags
    const isSuperAdmin = useMemo(() => {
        if (!authUser) return false;
        // Check for specific master admin email or general role in Firestore
        return authUser.email === '5384009090@hangel.org' || userData?.role === 'super-admin';
    }, [authUser, userData]);

    const isNgoAdmin = useMemo(() => {
        return isSuperAdmin || userData?.role === 'ngo-admin';
    }, [isSuperAdmin, userData]);

    // Filter Secondary items based on authorization
    const filteredSecondaryItems = useMemo(() => {
        return group4Items.filter(item => {
            if (item.href === '/super-admin') return isSuperAdmin;
            if (item.href === '/admin') return isNgoAdmin;
            return true;
        });
    }, [isSuperAdmin, isNgoAdmin]);

    // Auth Guard Logic
    useEffect(() => {
        if (!isUserLoading && !authUser && isMounted) {
            const protectedPaths = [
                '/timeline', '/market', '/volunteering', '/clubs', '/events', 
                '/qr-payment', '/emergency', '/leaderboard', '/stories', 
                '/invite', '/library', '/profile', '/my-donations', 
                '/my-applications', '/my-badges', '/messages', '/settings', 
                '/ngo-admin', '/super-admin', '/admin'
            ];
            
            const isProtected = protectedPaths.some(path => pathname === path || pathname.startsWith(path + '/'));
            
            if (isProtected) {
                const redirectUrl = `/login/selection?action=login&redirect=${encodeURIComponent(pathname)}`;
                router.push(redirectUrl);
            }
        }
    }, [authUser, isUserLoading, pathname, router, isMounted]);

    if (!isMounted) {
        return <div className="min-h-screen bg-background">{children}</div>;
    }

    const isPreviewPage = pathname === '/ngo-admin/website/preview';
    const isSuperAdminPage = pathname.startsWith('/super-admin');

    const publicWebsitePaths = [
        '/',
        '/login',
        '/onboarding',
        '/about',
        '/press',
        '/yatirimci-iliskileri',
        '/careers',
        '/corporate',
        '/feedback',
        '/accessibility',
        '/sitemap',
        '/bilgi-toplumu-hizmetleri',
        '/campus-advantages',
        '/merchant',
        '/ngo-onboarding',
        '/hangelassociation',
        '/logo-usage',
        '/settings/contracts',
        '/contact',
        '/support/app-support',
    ];

    const isPublicPage = publicWebsitePaths.some(path => pathname === path || (path !== '/' && pathname.startsWith(path + '/')));

    if (isPreviewPage || isSuperAdminPage || isPublicPage) {
        return <div className="min-h-screen bg-background">{children}</div>;
    }

    const currentUserName = authUser?.displayName || authUser?.email?.split('@')[0] || staticUser.name;
    const currentUserHandle = authUser?.email ? `@${authUser.email.split('@')[0]}` : staticUser.username;

    return (
        <div className="relative mx-auto flex min-h-screen w-full flex-col bg-background">
          <SideNav 
            mainItems={group1Items} 
            navItems={group2Items}
            userItems={group3Items}
            secondaryItems={filteredSecondaryItems}
          />
           <Sheet open={isDrawerOpen} onOpenChange={setDrawerOpen}>
              <SheetContent side="left" className="w-full max-w-sm p-0">
                   <SheetHeader>
                       <SheetTitle className="sr-only">Ana Menü</SheetTitle>
                       <SheetDescription className="sr-only">Uygulama ana navigasyon menüsü</SheetDescription>
                   </SheetHeader>
                   <div className="flex h-full flex-col overflow-y-auto bg-secondary/30">
                        <div className="p-4 bg-background border-b sticky top-0 z-10">
                            <div className="flex justify-between items-center mb-6">
                                <Link href="/login" onClick={() => setDrawerOpen(false)}>
                                    <HangelLogo className="text-2xl" />
                                </Link>
                                <SheetClose>
                                    <Icons.X className="h-6 w-6 text-muted-foreground" />
                                </SheetClose>
                            </div>
                            <Link href="/profile" className="flex items-center gap-3">
                                <UserAvatar className="h-12 w-12" />
                                <div>
                                    <p className="font-bold">{currentUserName}</p>
                                    <p className="text-sm text-muted-foreground">{currentUserHandle}</p>
                                </div>
                            </Link>
                        </div>
                        <nav className="flex-1 space-y-4 p-4">
                            <ul className="bg-card rounded-xl border overflow-hidden divide-y">
                                {group1Items.map((item) => <MobileNavLink key={item.href} item={item} onClick={() => setDrawerOpen(false)} />)}
                            </ul>
                            <ul className="bg-card rounded-xl border overflow-hidden divide-y">
                                {group2Items.map((item) => <MobileNavLink key={item.href} item={item} onClick={() => setDrawerOpen(false)} />)}
                            </ul>
                             <ul className="bg-card rounded-xl border overflow-hidden divide-y">
                                {group3Items.map((item) => <MobileNavLink key={item.href} item={item} onClick={() => setDrawerOpen(false)} />)}
                            </ul>
                            <ul className="bg-card rounded-xl border overflow-hidden divide-y">
                                {filteredSecondaryItems.map((item) => <MobileNavLink key={item.href} item={item} onClick={() => setDrawerOpen(false)} />)}
                            </ul>
                        </nav>
                   </div>
              </SheetContent>
          </Sheet>

          <div className="lg:pl-64 flex flex-col flex-1">
            <AppHeader onMenuClick={() => setDrawerOpen(true)} />
            <main className="flex-1 pt-12 pb-24 lg:pb-24">{children}</main>
          </div>
        </div>
    );
}