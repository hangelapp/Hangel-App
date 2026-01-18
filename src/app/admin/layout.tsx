'use client';

import React from 'react';
import { SideNav } from '@/components/layout/SideNav';
import type { SideNavItem } from '@/lib/types';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const adminMenuItems: SideNavItem[] = [
  { label: 'Genel Bakış', href: '/admin', icon: 'layout-grid' },
  { label: 'Öğrenci Kulüpleri', href: '/admin/clubs', icon: 'users' },
  { label: 'Kulüp Etkinlikleri', href: '/admin/events', icon: 'calendar' },
];

const backToSiteItem: SideNavItem[] = [
    { label: 'Siteye Dön', href: '/timeline', icon: 'arrow-left' }
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <div className="flex min-h-screen">
      <SideNav 
        mainItems={adminMenuItems}
        userItems={[]}
        secondaryItems={backToSiteItem}
      />
      <main className="flex-1 lg:pl-64">
        <div className="p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
