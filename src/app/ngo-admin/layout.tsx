'use client';

import React from 'react';
import { SideNav } from '@/components/layout/SideNav';
import type { SideNavItem } from '@/lib/types';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';


const ngoAdminMenuItems: SideNavItem[] = [
  { label: 'Genel Bakış', href: '/ngo-admin/dashboard', icon: 'layout-dashboard' },
  { label: 'Gönüllülük', href: '/ngo-admin/volunteer', icon: 'heart-handshake' },
  { label: 'Bağış Takibi', href: '/ngo-admin/donations', icon: 'dollar-sign' },
  { label: 'Demografi', href: '/ngo-admin/demographics', icon: 'bar-chart-3' },
  { label: 'Gönderiler', href: '/ngo-admin/posts', icon: 'newspaper' },
  { label: 'Profili Yönet', href: '/ngo-admin/manage-profile', icon: 'building' },
  { label: 'Şeffaflık Endeksi', href: '/ngo-admin/transparency', icon: 'shield-check' },
  { label: 'Raporlar', href: '/ngo-admin/reports', icon: 'file-text' },
  { label: 'STK Profil QR Kodu', href: '/ngo-admin/qr', icon: 'qr-code' },
  { label: 'Yetkili Yönetimi', href: '/ngo-admin/users', icon: 'users' },
];

const secondaryMenuItems: SideNavItem[] = [
    { label: 'Destek', href: '/ngo-admin/support', icon: 'help-circle' },
    { label: 'Ayarlar', href: '/ngo-admin/settings', icon: 'settings' },
];

const backToAdminItem: SideNavItem[] = [
    { label: 'Ana Yönetim Paneli', href: '/admin', icon: 'arrow-left' }
]

export default function NgoAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  return (
    <div className="flex min-h-screen">
      <SideNav 
        mainItems={ngoAdminMenuItems}
        navItems={secondaryMenuItems}
        userItems={[]}
        secondaryItems={backToAdminItem}
      />
      <main className="flex-1 lg:pl-64 pt-12 lg:pt-0">
        <div className="px-4 sm:px-6 lg:px-8 py-8">
            <Button onClick={() => router.back()} variant="ghost" size="icon" className="mb-4 lg:hidden -ml-2">
                <ArrowLeft className="h-6 w-6" />
            </Button>
            <div>
              {children}
            </div>
        </div>
      </main>
    </div>
  );
}
