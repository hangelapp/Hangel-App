'use client';

import React from 'react';
import { SideNav } from '@/components/layout/SideNav';
import type { SideNavItem } from '@/lib/types';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePathname, useRouter } from 'next/navigation';

const menuItems: SideNavItem[] = [
  { label: 'Genel Bakış', href: '/ngo-admin/dashboard', icon: 'layout-dashboard' },
  { label: 'Gönüllülük', href: '/ngo-admin/volunteer', icon: 'heart-handshake' },
  { label: 'Bağış Takibi', href: '/ngo-admin/donations', icon: 'dollar-sign' },
  { label: 'Demografi', href: '/ngo-admin/demographics', icon: 'bar-chart-3' },
  { label: 'Gönderiler', href: '/ngo-admin/posts', icon: 'newspaper' },
  { label: 'STK Profil QR Kodu', href: '/ngo-admin/qr', icon: 'qr-code' },
  { label: 'Raporlar', href: '/ngo-admin/reports', icon: 'file-text' },
  { label: 'Şeffaflık Endeksi', href: '/ngo-admin/transparency', icon: 'shield-check' },
  { label: 'Profili Yönet', href: '/ngo-admin/manage-profile', icon: 'building' },
];

const secondaryMenuItems: SideNavItem[] = [
    { label: 'Destek', href: '/ngo-admin/support', icon: 'help-circle' },
    { label: 'Ayarlar', href: '/ngo-admin/settings', icon: 'settings' },
];


export default function NgoAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const isRootNgoAdmin = pathname === '/ngo-admin/dashboard';


  return (
    <div className="flex min-h-screen">
      <SideNav 
        mainItems={menuItems}
        userItems={[]}
        secondaryItems={secondaryMenuItems}
      />
      <main className="flex-1 lg:pl-64 pt-16 lg:pt-0">
        <div className="px-4 sm:px-6 lg:px-8 pb-8">
             {!isRootNgoAdmin && (
                <Button onClick={() => router.back()} variant="ghost" size="icon" className="mt-4 mb-4 -ml-2">
                    <ArrowLeft className="h-6 w-6" />
                </Button>
            )}
             <div className={isRootNgoAdmin ? 'pt-8' : ''}>
              {children}
            </div>
        </div>
      </main>
    </div>
  );
}
