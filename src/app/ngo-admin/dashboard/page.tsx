
'use client';
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DollarSign, Users, Heart, ChevronRight, Globe, TrendingUp, HandCoins } from 'lucide-react';
import { user, ngos } from '@/lib/data';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import * as Icons from 'lucide-react';


const iconColorMap: { [key: string]: string } = {
  'user-cog': 'bg-gray-500',
  'heart-handshake': 'bg-red-500',
  'dollar-sign': 'bg-green-600',
  newspaper: 'bg-orange-500',
  'bar-chart-3': 'bg-indigo-500',
  'shield-check': 'bg-green-500',
  'qr-code': 'bg-slate-500',
  'globe': 'bg-cyan-500',
  users: 'bg-blue-500',
  bell: 'bg-purple-500',
  settings: 'bg-gray-500',
  'help-circle': 'bg-teal-500',
  sparkles: 'bg-purple-500',
  'trending-up': 'bg-pink-500',
  'hand-coins': 'bg-yellow-500',
};

const NavLink = ({ href, icon, label }: { href: string, icon: string, label: string }) => {
  // @ts-ignore
  const Icon = Icons[icon.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('')] || Icons.HelpCircle;
  const color = iconColorMap[icon] || 'bg-gray-500';

  return (
    <Link href={href} className="flex items-center p-4 hover:bg-accent transition-colors w-full text-sm sm:text-base">
      <div className={cn("p-1.5 rounded-lg mr-4", color)}>
          <Icon className="h-5 w-5 text-white" />
      </div>
      <span className="flex-1 font-medium">{label}</span>
      <ChevronRight className="h-5 w-5 text-muted-foreground" />
    </Link>
  )
}

const ngoAdminNavItems = [
    { href: '/ngo-admin/manage-profile', label: 'Profili Güncelle', icon: 'user-cog' },
    { href: '/ngo-admin/volunteer', label: 'Gönüllülük Yönetimi', icon: 'heart-handshake' },
    { href: '/ngo-admin/donations', label: 'Bağış Takibi', icon: 'dollar-sign' },
    { href: '/ngo-admin/posts', label: 'Gönderiler', icon: 'newspaper' },
    { href: '/ngo-admin/demographics', label: 'Demografi Analizi', icon: 'bar-chart-3' },
    { href: '/ngo-admin/transparency', label: 'Şeffaflık Endeksi', icon: 'shield-check' },
    { href: '/ngo-admin/impact-story', label: 'Etki Hikayem', icon: 'sparkles' },
    { href: '/ngo-admin/qr', label: 'STK Profil QR Kodu', icon: 'qr-code' },
    { href: '/ngo-admin/website', label: 'Web Sitesi Yönetimi', icon: 'globe' },
    { href: '/ngo-admin/users', label: 'Yetkili Yönetimi', icon: 'users' },
    { href: '/ngo-admin/notifications', label: 'Gelen Kutusu', icon: 'bell' },
    { href: '/ngo-admin/settings', label: 'Panel Ayarları', icon: 'settings' },
    { href: '/ngo-admin/support', label: 'Destek', icon: 'help-circle' },
];

export default function NgoDashboardPage() {
    const userName = user.name;
    const ngo = ngos.find(n => n.id === '2'); // Ahbap

    if (!ngo) return null;

    const totalDonation = ngo.stats.totalDonation;
    const volunteerHours = ngo.stats.volunteerHours;
    // Assuming 1 hour of volunteering is valued at 100 TL for this calculation
    const volunteerValue = volunteerHours * 100;
    const cashDonation = totalDonation; // Assuming total donation is cash for now
    const totalImpactValue = volunteerValue + cashDonation;

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold font-headline">{ngo.name}</h1>
        <p className="text-muted-foreground">Yönetim Paneline hoş geldin, {userName}. İşte kuruluşunun bugünkü özeti.</p>
      </div>

       <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Bağış</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDonation.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</div>
            <p className="text-xs text-muted-foreground">+%20.1 geçen aydan</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Gönüllü</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{ngo.stats.volunteers.toLocaleString('tr-TR')}</div>
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
            <p className="text-xs text-muted-foreground">Onay bekleyen başvurular</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nakit Bağış</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cashDonation.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</div>
            <p className="text-xs text-muted-foreground">+%20.1 geçen aydan</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gönüllülüğün Nakti Dönüşümü</CardTitle>
            <HandCoins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{volunteerValue.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</div>
            <p className="text-xs text-muted-foreground">Tahmini değer</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bağış + Gönüllü Toplamı</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalImpactValue.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</div>
            <p className="text-xs text-muted-foreground">Toplam yaratılan etki</p>
          </CardContent>
        </Card>
      </div>

        <Card>
            <CardHeader>
                <CardTitle>Yönetim Araçları</CardTitle>
                <CardDescription>Kuruluşunuzla ilgili tüm yönetim araçlarına buradan erişin.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
                <div className="divide-y">
                    {ngoAdminNavItems.map(item => (
                        <NavLink key={item.href} {...item} />
                    ))}
                </div>
            </CardContent>
        </Card>
    </div>
  );
}
