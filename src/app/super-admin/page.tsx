
'use client';
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  Shield,
  LayoutDashboard,
  Newspaper,
  BookCopy,
  Settings,
  HelpCircle,
  School,
  UserCog,
  LifeBuoy,
  Megaphone,
  Inbox,
  FileEdit,
  Globe,
  MessageSquare,
  DatabaseZap
} from "lucide-react";
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';

const iconColorMap: { [key: string]: string } = {
  'FileText': 'bg-sky-500',
  'FileEdit': 'bg-indigo-500',
  'UserCog': 'bg-purple-500',
  'Building': 'bg-orange-500',
  'Store': 'bg-green-500',
  'School': 'bg-gray-500',
  'HeartHandshake': 'bg-red-500',
  'Newspaper': 'bg-blue-500',
  'BarChart3': 'bg-indigo-500',
  'Shield': 'bg-green-600',
  'BookCopy': 'bg-amber-600',
  'Bell': 'bg-teal-500',
  'Settings': 'bg-gray-500',
  'HelpCircle': 'bg-pink-500',
  'LifeBuoy': 'bg-blue-400',
  'Megaphone': 'bg-yellow-500',
  'LayoutDashboard': 'bg-blue-500',
  'Inbox': 'bg-cyan-500',
  'Users': 'bg-blue-500',
  'Globe': 'bg-emerald-500',
  'MessageSquare': 'bg-cyan-500',
  'DatabaseZap': 'bg-red-600',
};

const superAdminNavItems = [
    { href: '/super-admin/setup', label: 'Veritabanı Kurulumu (Import)', icon: 'DatabaseZap', description: 'Mock dataları veritabanına aktar ve sistemi başlat.' },
    { href: '/super-admin/web-content', label: 'WEB İçerik Yönetimi', icon: 'FileEdit', description: 'Genel bilgilendirme ve kurumsal portal sayfalarını yönet.' },
    { href: '/super-admin/association-content', label: 'Dernek Web Sitesi Yönetimi', icon: 'Globe', description: 'Dernek sayfalarının içeriklerini yönet.' },
    { href: '/super-admin/applications', label: 'Başvuru Yönetimi', icon: 'FileText', description: 'STK, marka ve kulüp başvurularını yönet.' },
    { href: '/super-admin/users', label: 'Kullanıcı Yönetimi', icon: 'UserCog', description: 'Platformdaki kullanıcıları görüntüle ve yönet.' },
    { href: '/super-admin/ngos', label: 'STK Yönetimi', icon: 'Building', description: 'Platformdaki STK\'ları görüntüle ve yönet.' },
    { href: '/super-admin/brands', label: 'Marka Yönetimi', icon: 'Store', description: 'Platformdaki markaları görüntüle ve yönet.' },
    { href: '/super-admin/clubs', label: 'Kulüp Yönetimi', icon: 'School', description: 'Öğrenci kulüplerini görüntüle ve yönet.' },
    { href: '/super-admin/volunteer', label: 'Gönüllülük Yönetimi', icon: 'HeartHandshake', description: 'Gönüllülük ilanlarını onayla ve yönet.' },
    { href: '/super-admin/posts', label: 'Gönderi Yönetimi', icon: 'Newspaper', description: 'Tüm gönderileri denetle ve yönet.' },
    { href: '/super-admin/analytics', label: 'İstatistik ve Analizler', icon: 'BarChart3', description: 'Platformun genel metriklerini izle.' },
    { href: '/super-admin/transparency', label: 'Şeffaflık Yönetimi', icon: 'Shield', description: 'Yüklenen belgeleri kontrol et ve onayla.' },
    { href: '/super-admin/library', label: 'Kütüphane Yönetimi', icon: 'BookCopy', description: 'Kütüphane içeriklerini ekle, düzenle veya sil.' },
    { href: '/super-admin/communications', label: 'DM, Bildirimler & E-Bülten', icon: 'MessageSquare', description: 'Kullanıcılara direkt mesaj, anlık bildirim ve e-bülten gönder.' },
    { href: '/super-admin/ads', label: 'Reklam Yönetimi', icon: 'Megaphone', description: 'Platform içi reklamları yönet.' },
    { href: '/super-admin/public-relations', label: 'Kamu İlişkileri', icon: 'Users', description: 'Kurumsal işbirliği taleplerini yönet.' },
    { href: '/super-admin/settings', label: 'Panel Ayarları', icon: 'Settings', description: 'Platformun genel ayarlarını yönet.' },
    { href: '/super-admin/support', label: 'Destek Talepleri', icon: 'HelpCircle', description: 'Kullanıcılardan gelen destek taleplerini yönet.' },
    { href: '/super-admin/help', label: 'Yardım Merkezi', icon: 'LifeBuoy', description: 'Admin paneli kullanımı hakkında bilgi al.' },
];

export default function SuperAdminDashboard() {
  const db = useFirestore();

  const usersQuery = useMemoFirebase(() => collection(db, 'users'), [db]);
  const ngosQuery = useMemoFirebase(() => collection(db, 'ngos'), [db]);
  const brandsQuery = useMemoFirebase(() => collection(db, 'brands'), [db]);
  const appsQuery = useMemoFirebase(() => collection(db, 'applications'), [db]);

  const { data: usersData } = useCollection(usersQuery);
  const { data: ngosData } = useCollection(ngosQuery);
  const { data: brandsData } = useCollection(brandsQuery);
  const { data: appsData } = useCollection(appsQuery);

  return (
    <div className="space-y-8 animate-in fade-in-0 max-w-5xl mx-auto pb-12">
      <div className="space-y-1 px-1">
        <h1 className="text-3xl font-bold font-headline">Admin Paneli</h1>
        <p className="text-muted-foreground text-sm">hangel platformunun genel sağlığını, üyelik süreçlerini ve operasyonel araçlarını buradan denetleyin.</p>
      </div>

       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Kullanıcı</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{usersData?.length || 0}</div>
              <p className="text-xs text-muted-foreground">Aktif üye sayısı</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Onay Bekleyenler</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{appsData?.length || 0}</div>
              <p className="text-xs text-muted-foreground">Yeni başvurular</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aktif STK</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{ngosData?.length || 0}</div>
              <p className="text-xs text-muted-foreground">Kayıtlı kuruluşlar</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aktif Marka</CardTitle>
              <Store className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{brandsData?.length || 0}</div>
              <p className="text-xs text-muted-foreground">İş ortağı markalar</p>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-sm">
            <CardHeader className="bg-muted/20">
                <CardTitle>Yönetim Araçları</CardTitle>
                <CardDescription>Platformun temel fonksiyonlarını ve sistem ayarlarını yapılandırın.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
                <div className="divide-y">
                    {superAdminNavItems.map(item => {
                        const Icon = Icons[item.icon as keyof typeof Icons] || Icons.HelpCircle;
                        const color = iconColorMap[item.icon as keyof typeof iconColorMap] || 'bg-gray-500';
                        return (
                            <Link href={item.href} key={item.href} className="block hover:bg-accent transition-colors">
                                <div className="flex items-center p-4">
                                    <div className={cn("h-12 w-12 flex items-center justify-center mr-4 rounded-lg", color)}>
                                        <Icon className="h-6 w-6 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-semibold">{item.label}</p>
                                        <p className="text-xs text-muted-foreground">{item.description}</p>
                                    </div>
                                    <Icons.ChevronRight className="h-5 w-5 text-muted-foreground/50" />
                                </div>
                            </Link>
                        )
                    })}
                </div>
            </CardContent>
        </Card>
    </div>
  );
}
