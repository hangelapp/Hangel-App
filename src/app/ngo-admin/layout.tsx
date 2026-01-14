'use client';

import React from 'react';
import { SideNav } from '@/components/layout/SideNav';
import {
  LayoutDashboard,
  HeartHandshake,
  Users,
  FileText,
  Building,
  Settings,
  ShieldCheck,
  BarChart3,
  DollarSign,
  QrCode,
  Newspaper,
  MessageSquare
} from 'lucide-react';

const menuItems = [
  { label: 'Genel Bakış', href: '/ngo-admin/dashboard', icon: LayoutDashboard },
  { label: 'Gönüllülük', href: '/ngo-admin/volunteer', icon: HeartHandshake },
  { label: 'Bağış Takibi', href: '/ngo-admin/donations', icon: DollarSign },
  { label: 'Demografi', href: '/ngo-admin/demographics', icon: BarChart3 },
  { label: 'Gönderiler', href: '/ngo-admin/posts', icon: Newspaper },
  { label: 'STK Profil QR Kodu', href: '/ngo-admin/qr', icon: QrCode },
  { label: 'Raporlar', href: '/ngo-admin/reports', icon: FileText },
  { label: 'Şeffaflık Endeksi', href: '/ngo-admin/transparency', icon: ShieldCheck },
  { label: 'Profili Yönet', href: '/ngo-admin/manage-profile', icon: Building },
  { label: 'Ayarlar', href: '/ngo-admin/settings', icon: Settings },
];

export default function NgoAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
    const mainNavItems = menuItems.slice(0, 9);
    const settingsNavItem = menuItems.slice(9, 10);


  return (
    <div className="flex min-h-screen">
      <SideNav 
        mainItems={mainNavItems}
        userItems={[]}
        secondaryItems={settingsNavItem}
      />
      <main className="flex-1 lg:pl-64">
        <div className="p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
