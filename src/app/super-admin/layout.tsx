'use client';

import React from 'react';
import {
  Bell,
  Users,
  Building,
  Store,
  FileText,
  HeartHandshake,
  BarChart3,
  Shield,
  LayoutDashboard,
  ArrowLeft,
  Newspaper,
  BookCopy,
  Settings,
  HelpCircle,
  School,
  UserCog
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { HangelLogo } from '@/components/icons';
import { cn } from '@/lib/utils';
import type { SideNavItem } from '@/lib/types';
import { UserAvatar } from '@/components/shared/user-avatar';
import * as Icons from 'lucide-react';
import { Button } from '@/components/ui/button';

const navItems: SideNavItem[] = [
  { href: '/super-admin', label: 'Genel Bakış', icon: 'LayoutDashboard' },
  { href: '/super-admin/applications', label: 'Başvuru Yönetimi', icon: 'FileText' },
  { href: '/super-admin/users', label: 'Kullanıcı Yönetimi', icon: 'UserCog' },
  { href: '/super-admin/ngos', label: 'STK Yönetimi', icon: 'Building' },
  { href: '/super-admin/brands', label: 'Marka Yönetimi', icon: 'Store' },
  { href: '/super-admin/clubs', label: 'Kulüp Yönetimi', icon: 'School' },
  { href: '/super-admin/volunteer', label: 'Gönüllülük Yönetimi', icon: 'HeartHandshake' },
  { href: '/super-admin/posts', label: 'Gönderi Yönetimi', icon: 'Newspaper' },
  { href: '/super-admin/analytics', label: 'İstatistik ve Analizler', icon: 'BarChart3' },
  { href: '/super-admin/transparency', label: 'Şeffaflık Yönetimi', icon: 'Shield' },
  { href: '/super-admin/library', label: 'Kütüphane Yönetimi', icon: 'BookCopy' },
  { href: '/super-admin/communications', label: 'Bildirimler ve Bülten', icon: 'Bell' },
  { href: '/super-admin/settings', label: 'Panel Ayarları', icon: 'Settings' },
  { href: '/super-admin/support', label: 'Destek', icon: 'HelpCircle' },
];

const NavLink = ({ item }: { item: SideNavItem }) => {
    const pathname = usePathname();
    const isActive = pathname === item.href;
    // @ts-ignore
    const Icon = Icons[item.icon] || Icons.HelpCircle;

    return (
        <Link href={item.href} className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
            isActive && 'bg-muted text-primary'
        )}>
            <Icon className="h-4 w-4" />
            {item.label}
        </Link>
    );
};


export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  // Show back button only on sub-pages
  const showBackButton = pathname !== '/super-admin';

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-muted/40 md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link href="/super-admin" className="flex items-center gap-2 font-semibold">
              <HangelLogo className="h-6 w-6 text-primary" />
              <span className="">Hangel Yönetim</span>
            </Link>
          </div>
          <div className="flex-1">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
              {navItems.map(item => <NavLink key={item.href} item={item} />)}
            </nav>
          </div>
        </div>
      </div>
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
            {/* Mobile menu can be added here */}
            <div className="w-full flex-1">
                 {/* Optional search bar */}
            </div>
            <UserAvatar />
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-secondary">
          {showBackButton && (
              <Button onClick={() => router.back()} variant="ghost" size="icon" className="-mt-2 -ml-2 h-8 w-8 self-start">
                  <ArrowLeft className="h-5 w-5" />
              </Button>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
