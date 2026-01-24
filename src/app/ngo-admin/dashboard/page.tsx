'use client';
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronRight, DollarSign, Users, Heart } from 'lucide-react';
import * as Icons from 'lucide-react';
import Link from 'next/link';
import { user } from '@/lib/data';
import { cn } from '@/lib/utils';
import type { SideNavItem } from '@/lib/types';


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
  'layout-dashboard': 'bg-blue-500',
  'shield-check': 'bg-green-500',
  newspaper: 'bg-orange-500',
  'qr-code': 'bg-slate-500',
  calendar: 'bg-red-400',
};

const menuItems: SideNavItem[] = [
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

const MenuList = ({ items }: { items: SideNavItem[] }) => (
    <Card className="overflow-hidden">
        <div className="divide-y divide-border">
            {items.map((item) => {
                // @ts-ignore
                const Icon = Icons[item.icon.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('')] || Icons.HelpCircle;
                return (
                    <Link href={item.href} key={item.label} passHref>
                        <div className="flex items-center p-3 hover:bg-accent transition-colors active:bg-accent/50">
                            <div className={cn("p-2 rounded-lg mr-4", iconColorMap[item.icon] || 'bg-gray-500')}>
                                <Icon className="h-5 w-5 text-white" />
                            </div>
                            <div className="flex-1">
                                <p className="font-medium">{item.label}</p>
                            </div>
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                    </Link>
                );
            })}
        </div>
    </Card>
);

export default function NgoDashboardPage() {
    const userName = user.name.split(' ')[0] + ' ' + user.name.split(' ')[1].toLowerCase();
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold font-headline">Kuruluş Yönetim Paneli</h1>
        <p className="text-muted-foreground">Hoş geldin, {userName}</p>
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
      
      <div className="space-y-4">
        <MenuList items={menuItems} />
        <MenuList items={secondaryMenuItems} />
      </div>
    </div>
  );
}
