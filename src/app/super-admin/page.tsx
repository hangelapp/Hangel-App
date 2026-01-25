'use client';
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import * as Icons from 'lucide-react';
import {
  Building,
  Store,
  Users,
  FileText,
  Bell,
  HeartHandshake,
  BarChart3,
} from "lucide-react";

const iconColorMap: { [key: string]: string } = {
  'file-text': 'bg-sky-500',
  'users': 'bg-purple-500',
  'building': 'bg-orange-500',
  'store': 'bg-green-500',
  'heart-handshake': 'bg-red-500',
  'bar-chart-3': 'bg-indigo-500',
  'bell': 'bg-teal-500',
};

const NavLink = ({ href, icon, label, description }: { href: string, icon: string, label: string, description: string }) => {
  // @ts-ignore
  const Icon = Icons[icon.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('')] || Icons.HelpCircle;
  const color = iconColorMap[icon] || 'bg-gray-500';

  return (
    <Link href={href} className="block hover:bg-accent transition-colors w-full rounded-lg border p-4">
      <div className="flex items-center gap-4">
        <div className={cn("p-2 rounded-lg", color)}>
            <Icon className="h-6 w-6 text-white" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-base">{label}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <Icons.ChevronRight className="h-5 w-5 text-muted-foreground" />
      </div>
    </Link>
  )
}

const superAdminNavItems = [
    { href: '/super-admin/applications', label: 'Başvuru Yönetimi', icon: 'FileText', description: 'STK, marka ve kulüp başvurularını onayla/reddet.' },
    { href: '/super-admin/users', label: 'Kullanıcı Yönetimi', icon: 'Users', description: 'Tüm kullanıcıları görüntüle, düzenle veya askıya al.' },
    { href: '/super-admin/ngos', label: 'STK Yönetimi', icon: 'Building', description: 'Platformdaki tüm STK\'ları yönet.' },
    { href: '/super-admin/brands', label: 'Marka Yönetimi', icon: 'Store', description: 'Tüm markaları ve bağış oranlarını yönet.' },
    { href: '/super-admin/content', label: 'İçerik Yönetimi', icon: 'HeartHandshake', description: 'Gönüllülük ilanları ve diğer içerikleri onayla.' },
    { href: '/super-admin/analytics', label: 'Platform Analizleri', icon: 'BarChart3', description: 'Kullanıcı, etki ve finansal metrikleri izle.' },
    { href: '/super-admin/communications', label: 'İletişim Araçları', icon: 'Bell', description: 'Genel duyurular ve bültenler gönder.' },
];

export default function SuperAdminDashboard() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold font-headline">Süper Yönetici Paneli</h1>
        <p className="text-muted-foreground">hangel platformunu buradan yönetebilirsiniz.</p>
      </div>

       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Toplam Kullanıcı
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">14,234</div>
              <p className="text-xs text-muted-foreground">
                +%20.1 geçen aydan
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Onay Bekleyen Başvurular
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">+573</div>
              <p className="text-xs text-muted-foreground">
                32 STK, 120 Marka, 421 Kulüp
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aktif STK</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">128</div>
              <p className="text-xs text-muted-foreground">
                +19% geçen aydan
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aktif Marka</CardTitle>
              <Store className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">542</div>
              <p className="text-xs text-muted-foreground">
                +201 geçen aydan
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
            <CardHeader>
                <CardTitle>Yönetim Araçları</CardTitle>
                <CardDescription>Platformun temel fonksiyonlarını buradan yönetin.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                {superAdminNavItems.map(item => (
                    <NavLink key={item.href} {...item} />
                ))}
            </CardContent>
        </Card>
    </div>
  );
}
