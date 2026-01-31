
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
    const userRole = (user as any).currentNgoRole || 'Genel Yönetici'; 
    const ngo = ngos.find(n => n.id === '2'); 

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

      <Card className="overflow-hidden">
        <CardHeader className="bg-muted/30 border-b">
            <CardTitle className="text-lg">Kurumsal Performans Özeti</CardTitle>
            <CardDescription>Kuruluşunuzun güncel etki ve bağış verileri.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x">
                {(userRole === 'Finans Yöneticisi' || userRole === 'Genel Yönetici') && (
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Toplam Bağış</span>
                            <DollarSign className="h-4 w-4 text-primary" />
                        </div>
                        <div className="text-2xl font-bold">{totalDonation.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</div>
                        <p className="text-xs text-green-600 font-medium mt-1">+%20.1 geçen aydan</p>
                    </div>
                )}

                {(userRole === 'Gönüllü Yöneticisi' || userRole === 'Genel Yönetici') && (
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Toplam Gönüllü</span>
                            <Users className="h-4 w-4 text-blue-500" />
                        </div>
                        <div className="text-2xl font-bold">+{ngo.stats.volunteers.toLocaleString('tr-TR')}</div>
                        <p className="text-xs text-muted-foreground mt-1">Bu ay +180 yeni gönüllü</p>
                    </div>
                )}

                {(userRole === 'Gönüllü Yöneticisi' || userRole === 'Genel Yönetici') && (
                    <div className="p-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Yeni Başvurular</span>
                            <Heart className="h-4 w-4 text-red-500" />
                        </div>
                        <div className="text-2xl font-bold">+12</div>
                        <p className="text-xs text-amber-600 font-medium mt-1">Onay bekleyen başvurular</p>
                    </div>
                )}

                {userRole === 'Genel Yönetici' && (
                    <div className="p-6 bg-primary/5">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-primary uppercase tracking-wider">Toplam Sağlanan Etki</span>
                            <TrendingUp className="h-4 w-4 text-primary" />
                        </div>
                        <div className="text-2xl font-bold text-primary">{totalImpactValue.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</div>
                        <p className="text-[10px] text-muted-foreground mt-1 uppercase">Bağış + Gönüllülük Değeri</p>
                    </div>
                )}
            </div>
        </CardContent>
      </Card>

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
