'use client';
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronRight, DollarSign, Users, Heart } from 'lucide-react';
import * as Icons from 'lucide-react';
import Link from 'next/link';
import { user } from '@/lib/data';

const menuItems = [
  { label: 'Gönüllülük', href: '/ngo-admin/volunteer', icon: 'heart-handshake', color: 'bg-red-500' },
  { label: 'Bağış Takibi', href: '/ngo-admin/donations', icon: 'dollar-sign', color: 'bg-green-500' },
  { label: 'Demografi', href: '/ngo-admin/demographics', icon: 'bar-chart-3', color: 'bg-blue-500' },
  { label: 'Gönderiler', href: '/ngo-admin/posts', icon: 'newspaper', color: 'bg-orange-500' },
  { label: 'STK Profil QR Kodu', href: '/ngo-admin/qr', icon: 'qr-code', color: 'bg-gray-700' },
  { label: 'Raporlar', href: '/ngo-admin/reports', icon: 'file-text', color: 'bg-indigo-500' },
  { label: 'Şeffaflık Endeksi', href: '/ngo-admin/transparency', icon: 'shield-check', color: 'bg-teal-500' },
  { label: 'Profili Yönet', href: '/ngo-admin/manage-profile', icon: 'building', color: 'bg-sky-500' },
];

const secondaryMenuItems = [
  { label: 'Destek', href: '/ngo-admin/support', icon: 'help-circle', color: 'bg-blue-600' },
  { label: 'Ayarlar', href: '/ngo-admin/settings', icon: 'settings', color: 'bg-gray-500' },
];

const MenuList = ({ items }: { items: typeof menuItems | typeof secondaryMenuItems }) => (
    <Card className="overflow-hidden">
        <div className="divide-y divide-border">
            {items.map((item) => {
                // @ts-ignore
                const Icon = Icons[item.icon.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('')] || Icons.HelpCircle;
                return (
                    <Link href={item.href} key={item.label} passHref>
                        <div className="flex items-center p-3 hover:bg-accent transition-colors active:bg-accent/50">
                            <div className={`p-2 ${item.color} rounded-lg mr-4`}>
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
        <h1 className="text-2xl font-bold font-headline">Ahbap Derneği Yönetim Paneli</h1>
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
            <CardTitle className="text-sm font-medium">Toplam Gönüllü</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+2.350</div>
            <p className="text-xs text-muted-foreground">Bu ay +180 yeni gönüllü</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Yeni Başvurular</CardTitle>
             <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+12</div>
            <p className="text-xs text-muted-foreground">Onay bekleyen gönüllü başvuruları</p>
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
