'use client';
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import * as Icons from 'lucide-react';
import {
  Building,
  Store,
  Users,
  FileText,
  Activity,
  ChevronRight
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
  'Star': 'bg-yellow-500',
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
  'Send': 'bg-violet-500',
  'DatabaseZap': 'bg-red-600',
  'Siren': 'bg-red-700',
};

const superAdminNavItems = [
    { href: '/super-admin/set-superadmin', label: 'SUPERADMIN Ayarı', icon: 'Shield', description: '5384009090 numaralı kullanıcıyı SUPERADMIN olarak ayarla.' },
    { href: '/super-admin/web-content', label: 'WEB İçerik Yönetimi', icon: 'FileEdit', description: 'Genel bilgilendirme ve kurumsal portal sayfalarını yönet.' },
    { href: '/super-admin/association-content', label: 'Dernek Web Sitesi Yönetimi', icon: 'Globe', description: 'Dernek sayfalarının içeriklerini yönet.' },
    { href: '/super-admin/contracts', label: 'Sözleşmeler ve Politikalar', icon: 'FileText', description: 'Kullanıcı sözleşmesi, KVKK, gizlilik ve diğer hukuki metinleri düzenle veya yeni sözleşme ekle.' },
    { href: '/super-admin/pages', label: 'İçerik Sayfaları (Basın/Etkinlik vb.)', icon: 'Newspaper', description: 'Basın, etkinlik, kariyer gibi sayfaları oluştur ve düzenle.' },
    { href: '/super-admin/applications', label: 'Başvuru Yönetimi', icon: 'FileText', description: 'STK, marka ve kulüp başvurularını yönet.' },
    { href: '/super-admin/users', label: 'Kullanıcı Yönetimi', icon: 'UserCog', description: 'Platformdaki kullanıcıları görüntüle ve yönet.' },
    { href: '/super-admin/ngos', label: 'STK Yönetimi', icon: 'Building', description: 'Platformdaki STK\'ları görüntüle ve yönet.' },
    { href: '/super-admin/brands', label: 'Marka Yönetimi', icon: 'Store', description: 'Platformdaki markaları görüntüle ve yönet.' },
    { href: '/super-admin/clubs', label: 'Kulüp Yönetimi', icon: 'School', description: 'Öğrenci kulüplerini görüntüle ve yönet.' },
    { href: '/super-admin/volunteer', label: 'Gönüllülük Yönetimi', icon: 'HeartHandshake', description: 'Gönüllülük ilanlarını onayla ve yönet.' },
    { href: '/super-admin/events', label: 'Etkinlik Yönetimi', icon: 'Calendar', description: 'Öğrenci kulüplerinin oluşturduğu etkinlikleri onayla veya reddet.' },
    { href: '/super-admin/donations', label: 'Bağış Yönetimi', icon: 'HandCoins', description: 'Tüm bağış işlemlerini ve STK hak edişlerini yönetin.' },
    { href: '/super-admin/funds', label: 'Fon & Hibe Programları', icon: 'HandCoins', description: 'STK\'ların başvurabileceği hibe programlarını ve fon kaynaklarını yönetin.' },
    { href: '/super-admin/emergency', label: 'Acil Durum Yönetimi', icon: 'Siren', description: 'Acil kan talebi ve afet bildirimlerini yönet, hedef bildirimler gönder.' },
    { href: '/super-admin/posts', label: 'Gönderi Yönetimi', icon: 'Newspaper', description: 'Tüm gönderileri denetle ve yönet.' },
    { href: '/super-admin/surveys', label: 'Anket & Değerlendirmeler', icon: 'Star', description: 'Kullanıcı keşif anketleri ve uygulama değerlendirmelerini görüntüle.' },
    { href: '/super-admin/analytics', label: 'İstatistik, Analizler & Demografi', icon: 'BarChart3', description: 'Platformun genel metrikleri ve STK bazında destekçi demografi profili (yaş, cinsiyet, konum, meslek, ilgi alanları) birleşik panelde.' },
    { href: '/super-admin/activity', label: 'Aktiviteler & İşlem Logu', icon: 'Activity', description: 'Platform genelinde tüm aktivite ve sistem işlemlerinin merkezi listesi.' },
    { href: '/super-admin/transparency', label: 'Şeffaflık Yönetimi', icon: 'Shield', description: 'Yüklenen belgeleri kontrol et ve onayla.' },
    { href: '/super-admin/communications', label: 'DM & Uygulama-İçi Bildirim', icon: 'MessageSquare', description: 'Kullanıcılara uygulama-içi direkt mesaj ve anlık bildirim gönder.' },
    { href: '/super-admin/messaging', label: 'Toplu SMS & E-Posta', icon: 'Send', description: 'Kampanya, şablon, segment ve gönderim analitikleri.' },
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

  const { data: usersData, isLoading: usersLoading } = useCollection(usersQuery);
  const { data: ngosData, isLoading: ngosLoading } = useCollection(ngosQuery);
  const { data: brandsData, isLoading: brandsLoading } = useCollection(brandsQuery);
  const { data: appsData, isLoading: appsLoading } = useCollection(appsQuery);

  const pendingAppsCount = appsData?.filter(a => a.status === 'Beklemede').length || 0;

  return (
    <div className="space-y-8 animate-in fade-in-0 max-w-5xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-1">
        <div className="space-y-1">
            <h1 className="text-3xl font-black tracking-tighter text-[#1d1d1f]">Admin Paneli</h1>
            <p className="text-muted-foreground text-sm font-medium">Platform sağlığı ve operasyonel denetim merkezi.</p>
        </div>
        <Badge variant="outline" className="w-fit bg-green-50 text-green-700 border-green-200 font-bold flex items-center gap-1.5 px-3 py-1">
            <Activity className="h-3.5 w-3.5 animate-pulse" /> CANLI VERİ AKIŞI
        </Badge>
      </div>

       <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="rounded-2xl border-black/5 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">Kullanıcılar</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black tracking-tighter">{usersLoading ? '...' : (usersData?.length || 0)}</div>
              <p className="text-[10px] text-muted-foreground mt-1">Aktif kayıtlı üye</p>
            </CardContent>
          </Card>
          
          <Link href="/super-admin/applications" className="block group">
            <Card className={cn(
                "rounded-2xl border-black/5 shadow-sm transition-all",
                pendingAppsCount > 0 ? "bg-primary/5 border-primary/20 hover:bg-primary/10" : "hover:shadow-md"
            )}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className={cn("text-xs font-black uppercase tracking-widest", pendingAppsCount > 0 ? "text-primary" : "text-muted-foreground")}>Onay Bekleyenler</CardTitle>
                <FileText className={cn("h-4 w-4", pendingAppsCount > 0 ? "text-primary" : "text-muted-foreground")} />
                </CardHeader>
                <CardContent>
                <div className={cn("text-3xl font-black tracking-tighter", pendingAppsCount > 0 && "text-primary")}>{appsLoading ? '...' : pendingAppsCount}</div>
                <p className="text-[10px] text-muted-foreground mt-1">Yeni kurumsal başvuru</p>
                </CardContent>
            </Card>
          </Link>

          <Card className="rounded-2xl border-black/5 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">Aktif STK</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black tracking-tighter">{ngosLoading ? '...' : (ngosData?.length || 0)}</div>
              <p className="text-[10px] text-muted-foreground mt-1">Bağışçı kabul eden dernekler</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-black/5 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">Aktif Marka</CardTitle>
              <Store className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black tracking-tighter">{brandsLoading ? '...' : (brandsData?.length || 0)}</div>
              <p className="text-[10px] text-muted-foreground mt-1">İş ortağı işletmeler</p>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-xl rounded-[2.5rem] border-black/5 overflow-hidden bg-white">
            <CardHeader className="bg-muted/30 p-8 border-b">
                <CardTitle className="text-xl font-bold">Yönetim Araçları</CardTitle>
                <CardDescription>Platformun teknik ve içerik operasyonlarını buradan yönetin.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
                <div className="divide-y border-black/5">
                    {superAdminNavItems.map(item => {
                        const Icon = ((Icons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[item.icon] || Icons.HelpCircle) as React.ComponentType<{ className?: string }>;
                        const color = iconColorMap[item.icon as keyof typeof iconColorMap] || 'bg-gray-500';
                        return (
                            <Link href={item.href} key={item.href} className="block hover:bg-muted/30 transition-all group">
                                <div className="flex items-center p-6">
                                    <div className={cn("h-12 w-12 flex items-center justify-center mr-6 rounded-2xl shadow-sm transition-transform group-hover:scale-110", color)}>
                                        <Icon className="h-6 w-6 text-white" />
                                    </div>
                                    <div className="flex-1 space-y-0.5">
                                        <p className="font-bold text-lg text-[#1d1d1f] group-hover:text-primary transition-colors">{item.label}</p>
                                        <p className="text-sm text-muted-foreground font-medium leading-tight">{item.description}</p>
                                    </div>
                                    <ChevronRight className="h-6 w-6 text-muted-foreground/30 group-hover:text-primary transition-all group-hover:translate-x-1" />
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
