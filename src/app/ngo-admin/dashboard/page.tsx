'use client';
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Users, Heart, ChevronRight } from 'lucide-react';
import { user } from '@/lib/data';
import type { SideNavItem } from '@/lib/types';
import Link from 'next/link';
import * as Icons from 'lucide-react';
import { cn } from '@/lib/utils';

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
  { label: 'Destek', href: '/ngo-admin/support', icon: 'help-circle' },
  { label: 'Ayarlar', href: '/ngo-admin/settings', icon: 'settings' },
];

const iconColorMap: { [key: string]: string } = {
  'layout-dashboard': 'bg-blue-500',
  'heart-handshake': 'bg-red-500',
  'dollar-sign': 'bg-green-600',
  'bar-chart-3': 'bg-indigo-500',
  newspaper: 'bg-orange-500',
  building: 'bg-teal-500',
  'shield-check': 'bg-green-500',
  'file-text': 'bg-sky-500',
  'qr-code': 'bg-slate-500',
  users: 'bg-blue-500',
  'help-circle': 'bg-teal-500',
  settings: 'bg-gray-500',
};


export default function NgoDashboardPage() {
    const userName = user.name;
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold font-headline">Kuruluş Yönetim Paneli</h1>
        <p className="text-muted-foreground">Hoş geldin, {userName}.</p>
      </div>

       <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Bağış</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1.245,78 ₺</div>
            <p className="text-xs text-muted-foreground">+%20.1 geçen aydan</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Destekçi Sayısı</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+2.350</div>
            <p className="text-xs text-muted-foreground">Bu ay +180 yeni destekçi</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Yeni Etkileşimler</CardTitle>
             <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+12</div>
            <p className="text-xs text-muted-foreground">Onay bekleyen etkileşimler</p>
          </CardContent>
        </Card>
      </div>
      
        <Card>
            <CardHeader>
                <CardTitle>Yönetim Araçları</CardTitle>
                <CardDescription>Kuruluşunuzu yönetmek için tüm araçlara buradan erişin.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
                <div className="divide-y">
                    {ngoAdminMenuItems.map(item => {
                        // @ts-ignore
                        const Icon = Icons[item.icon.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('')] || Icons.HelpCircle;
                        if (item.href === '/ngo-admin/dashboard') return null; // Don't show link to self
                        return (
                            <Link href={item.href} key={item.label} className="block hover:bg-accent transition-colors">
                                <div className="flex items-center justify-between p-4">
                                    <div className="flex items-center gap-4">
                                        <div className={cn("p-2 rounded-lg", iconColorMap[item.icon] || 'bg-gray-500')}>
                                            <Icon className="h-5 w-5 text-white" />
                                        </div>
                                        <p className="font-semibold">{item.label}</p>
                                    </div>
                                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    </div>
  );
}
