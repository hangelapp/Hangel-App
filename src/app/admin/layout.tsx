'use client';

import React from 'react';
import { SideNav } from '@/components/layout/SideNav';
import type { SideNavItem } from '@/lib/types';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useRouter, usePathname } from 'next/navigation';

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
  const router = useRouter();
  const pathname = usePathname();
  const isRootAdmin = pathname === '/admin';

  return (
    <div className="flex min-h-screen">
      <SideNav 
        mainItems={adminMenuItems}
        userItems={[]}
        secondaryItems={backToSiteItem}
      />
      <main className="flex-1 lg:pl-64">
        <div className="p-4 sm:p-6 lg:p-8">
            {!isRootAdmin && (
                 <Button onClick={() => router.back()} variant="ghost" size="icon" className="mb-4 -ml-2">
                    <ArrowLeft className="h-6 w-6" />
                </Button>
            )}
            {children}
        </div>
      </main>
    </div>
  );
}
