'use client';

import React from 'react';
import { SideNav } from '@/components/layout/SideNav';
import type { SideNavItem } from '@/lib/types';

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
  { label: 'Destek', href: '/ngo-admin/support', icon: 'help-circle' },
  { label: 'Ayarlar', href: '/ngo-admin/settings', icon: 'settings' },
];

export default function NgoAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
    const mainNavItems = menuItems.slice(0, 9);
    const secondaryNavItems = menuItems.slice(9);


  return (
    <div className="flex min-h-screen">
      <SideNav 
        mainItems={mainNavItems}
        userItems={[]}
        secondaryItems={secondaryNavItems}
      />
      <main className="flex-1 lg:pl-64">
        <div className="p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
