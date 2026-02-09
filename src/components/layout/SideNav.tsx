'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import * as Icons from 'lucide-react';
import type { SideNavItem } from '@/lib/types';
import { useTranslation } from '@/components/providers/language-provider';

// iOS-style icon background colors
const iconColorMap: { [key: string]: string } = {
  store: 'bg-green-500',
  building: 'bg-orange-500',
  users: 'bg-blue-500',
  zap: 'bg-yellow-500',
  'dollar-sign': 'bg-green-600',
  'file-text': 'bg-sky-500',
  award: 'bg-amber-500',
  'heart-handshake': 'bg-red-500',
  'bar-chart-3': 'bg-indigo-500',
  send: 'bg-cyan-500',
  sparkles: 'bg-purple-500',
  settings: 'bg-gray-500',
  info: 'bg-blue-400',
  'help-circle': 'bg-teal-500',
  'layout-grid': 'bg-slate-500',
  library: 'bg-amber-700',
  'arrow-left': 'bg-gray-400',
  // NGO Admin specific
  'layout-dashboard': 'bg-blue-500',
  'shield-check': 'bg-green-500',
  'shield': 'bg-red-600',
  newspaper: 'bg-orange-500',
  'qr-code': 'bg-slate-500',
  // Admin specific
  calendar: 'bg-red-400',
};

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
  'Admin Paneli': 'superAdmin',
  'Ayarlar': 'settings',
  'Hakkımızda': 'about',
  'Üye İşyeri': 'merchant',
  'STK Başvurusu': 'ngoOnboarding',
  'Destek': 'support',
  'Gönüllülük': 'volunteering',
};

const NavLink = ({ item, isLast }: { item: SideNavItem; isLast: boolean }) => {
    const { t } = useTranslation();
    // @ts-ignore
    const Icon = Icons[item.icon.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('')] || Icons.HelpCircle;
    
    const color = iconColorMap[item.icon] || 'bg-gray-500';
    const translationKey = navKeyMap[item.label] || item.label;

    return (
        <li className={cn(!isLast && 'border-b')}>
            <Link
                href={item.href}
                className={'group flex items-center justify-between p-3 hover:bg-accent/50 transition-colors'}
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
        </li>
    );
};

const NavList = ({ items }: { items: SideNavItem[] }) => (
    <ul role="list" className="bg-card rounded-lg overflow-hidden border">
        {items.map((item, index) => (
            <NavLink key={item.label} item={item} isLast={index === items.length - 1} />
        ))}
    </ul>
);

export function SideNav({ mainItems, navItems, userItems, secondaryItems }: { mainItems: SideNavItem[], navItems: SideNavItem[], userItems: SideNavItem[], secondaryItems: SideNavItem[] }) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const isAuthPage = pathname.startsWith('/login') || pathname === '/onboarding' || pathname === '/';

  if (isAuthPage) {
    return null;
  }

  return (
    <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:z-50">
      <div className="flex grow flex-col overflow-y-auto bg-secondary border-r px-4 pb-4 pt-8">
        <nav className="flex flex-1 flex-col">
          <div className="flex flex-1 flex-col space-y-4">
            {mainItems.length > 0 && <NavList items={mainItems} />}
            {navItems.length > 0 && <NavList items={navItems} />}
            {userItems.length > 0 && <NavList items={userItems} />}
            
            <div className="mt-auto !mb-0 space-y-4">
                {secondaryItems.length > 0 && <NavList items={secondaryItems} />}
                <ul className="bg-card rounded-lg overflow-hidden border">
                    <li>
                        <Link
                            href="/login"
                            className='group flex items-center p-3 hover:bg-accent/50'
                        >
                            <div className='w-7 h-7 rounded-md flex items-center justify-center bg-red-500'>
                                <Icons.LogOut className='h-4 w-4 text-white' aria-hidden="true" />
                            </div>
                            <span className='ml-4 text-base font-medium text-destructive'>{t('nav.logout')}</span>
                        </Link>
                    </li>
                </ul>
            </div>
          </div>
        </nav>
      </div>
    </div>
  );
}