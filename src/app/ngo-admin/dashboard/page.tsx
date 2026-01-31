'use client';
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DollarSign, Users, Heart, ChevronRight, Globe, TrendingUp, HandCoins, ShieldAlert } from 'lucide-react';
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
    <Link href={href} className="flex items-center p-4 hover:bg-accent transition-colors w-full text-sm sm:text-base border-b last:border-b-0">
      <div className={cn("p-1.5 rounded-lg mr-4", color)}>
          <Icon className="h-5 w-5 text-white" />
      </div>
      <span className="flex-1 font-medium">{label}</span>
      <ChevronRight className="h-5 w-5 text-muted-foreground" />
    </Link>
  )
}

const allNavItems = [
    { id: 'profile', href: '/ngo-admin/manage-profile', label: 'Profili Güncelle', icon: 'user-cog', roles: ['Genel Yönetici', 'Mini Blog Yöneticisi'] },
    { id: 'volunteer', href: '/ngo-admin/volunteer', label: 'Gönüllülük Yönetimi', icon: 'heart-handshake', roles: ['Genel Yönetici', 'Gönüllü Yöneticisi'] },
    { id: 'donations', href: '/ngo-admin/donations', label: 'Bağış Takibi', icon: 'dollar-sign', roles: ['Genel Yönetici', 'Finans Yöneticisi'] },
    { id: 'posts', href: '/ngo-admin/posts', label: 'Gönderiler', icon: 'newspaper', roles: ['Genel Yönetici', 'Mini Blog Yöneticisi'] },
    { id: 'demographics', href: '/ngo-admin/demographics', label: 'Demografi Analizi', icon: 'bar-chart-3', roles: ['Genel Yönetici', 'Gönüllü Yöneticisi'] },
    { id: 'transparency', href: '/ngo-admin/transparency', label: 'Şeffaflık Endeksi', icon: 'shield-check', roles: ['Genel Yönetici', 'Finans Yöneticisi'] },
    { id: 'impact-story', href: '/ngo-admin/impact-story', label: 'Etki Hikayem', icon: 'sparkles', roles: ['Genel Yönetici', 'Gönüllü Yöneticisi'] },
    { id: 'qr', href: '/ngo-admin/qr', label: 'STK Profil QR Kodu', icon: 'qr-code', roles: ['Genel Yönetici', 'Mini Blog Yöneticisi'] },
    { id: 'website', href: '/ngo-admin/website', label: 'Web Sitesi Yönetimi', icon: 'globe', roles: ['Genel Yönetici', 'Mini Blog Yöneticisi'] },
    { id: 'users', href: '/ngo-admin/users', label: 'Yetkili Yönetimi', icon: 'users', roles: ['Genel Yönetici'] },
    { id: 'notifications', href: '/ngo-admin/notifications', label: 'Gelen Kutusu', icon: 'bell', roles: ['Genel Yönetici', 'Finans Yöneticisi', 'Gönüllü Yöneticisi', 'Mini Blog Yöneticisi'] },
    { id: 'settings', href: '/ngo-admin/settings', label: 'Panel Ayarları', icon: 'settings', roles: ['Genel Yönetici'] },
    { id: 'support', href: '/ngo-admin/support', label: 'Destek', icon: 'help-circle', roles: ['Genel Yönetici', 'Finans Yöneticisi', 'Gönüllü Yöneticisi', 'Mini Blog Yöneticisi'] },
];

export default function NgoDashboardPage() {
    const userName = user.name;
    const userRole = (user as any).currentNgoRole || 'Genel Yönetici'; // Simulating a role for the prototype
    const ngo = ngos.find(n => n.id === '2'); // Ahbap

    const filteredNavItems = useMemo(() => {
        return allNavItems.filter(item => item.roles.includes(userRole));
    }, [userRole]);

    if (!ngo) return null;

    const totalDonation = ngo.stats.totalDonation;
    const volunteerHours = ngo.stats.volunteerHours;
    const volunteerValue = volunteerHours * 100;
    const cashDonation = totalDonation;
    const totalImpactValue = volunteerValue + cashDonation;

  return (
    <div className="space-y-6 animate-in fade-in-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
            <h1 className="text-2xl font-bold font-headline">{ngo.name}</h1>
            <p className="text-muted-foreground">Yönetim Paneline hoş geldin, {userName}.</p>
        </div>
        <div className="flex items-center gap-2 bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20">
            <ShieldAlert className="h-4 w-4 text-primary" />
            <span className="text-xs font-bold text-primary uppercase tracking-wider">{userRole} Yetkisi</span>
        </div>
      </div>

       <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {userRole === 'Finans Yöneticisi' || userRole === 'Genel Yönetici' ? (
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
        ) : null}

        {userRole === 'Gönüllü Yöneticisi' || userRole === 'Genel Yönetici' ? (
            <>
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
            </>
        ) : null}

        {userRole === 'Genel Yönetici' ? (
            <Card className="sm:col-span-2 lg:col-span-1">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Toplam Yaratılan Etki</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{totalImpactValue.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</div>
                    <p className="text-xs text-muted-foreground">Bağış + Gönüllülük Değeri</p>
                </CardContent>
            </Card>
        ) : null}
      </div>

        <Card>
            <CardHeader>
                <CardTitle>Yönetim Araçları</CardTitle>
                <CardDescription>Yetkileriniz dahilindeki yönetim araçları aşağıda listelenmiştir.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
                <div className="flex flex-col">
                    {filteredNavItems.map(item => (
                        <NavLink key={item.id} {...item} />
                    ))}
                </div>
            </CardContent>
        </Card>
    </div>
  );
}
