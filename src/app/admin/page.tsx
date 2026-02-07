'use client';
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, Store, FileText, HeartHandshake, Users, LayoutGrid, Calendar, Building, Building2, Briefcase, Landmark, Smartphone, MessageCircle, Database, PhoneCall, GraduationCap, MapPin, HandCoins, Globe, Network, LineChart } from 'lucide-react';
import * as Icons from 'lucide-react';
import Link from 'next/link';
import { managedItems } from '@/lib/data';
import { cn } from '@/lib/utils';

const iconColorMap: { [key: string]: string } = {
  'store': 'bg-green-500',
  'file-text': 'bg-sky-500',
  'heart-handshake': 'bg-red-500',
  'users': 'bg-blue-500',
  'layout-grid': 'bg-slate-500',
  'calendar': 'bg-red-400',
};

const toolItems = [
    { name: 'Profili Yönet', icon: Building2, color: 'bg-gray-500', href: '/ngo-admin/manage-profile' },
    { name: 'Gönderiler', icon: FileText, color: 'bg-blue-500', href: '/ngo-admin/posts' },
    { name: 'Bağış Takibi', icon: HandCoins, color: 'bg-green-600', href: '/ngo-admin/donations' },
    { name: 'Gönüllülük Yönetimi', icon: HeartHandshake, color: 'bg-red-500', href: '/ngo-admin/volunteer' },
    { name: 'Web Sitesi Yönetimi', icon: Globe, color: 'bg-cyan-500', href: '/ngo-admin/website' },
    { name: 'CRM Yönetimi', icon: Database, color: 'bg-indigo-600', href: '/ngo-admin/crm' },
    { name: 'Sanal Santral Yönetimi', icon: PhoneCall, color: 'bg-orange-600', href: '/ngo-admin/virtual-pbx' },
    { name: 'Sanal ve Fiziki Ofis', icon: Building, color: 'bg-slate-600', href: '/ngo-admin/virtual-office' },
    { name: 'Üniversite Gönüllük Dersi', icon: GraduationCap, color: 'bg-blue-700', href: '/ngo-admin/university-volunteering' },
    { name: 'Saha Ekip Yönetimi', icon: MapPin, color: 'bg-teal-600', href: '/ngo-admin/field-team' },
    { name: 'DM Mesajlaşma Merkezi', icon: MessageCircle, color: 'bg-sky-500', href: '/ngo-admin/dm' },
    { name: 'İK Şirketleri Entegrasyonu', icon: Briefcase, color: 'bg-blue-600', href: '/ngo-admin/hr-integration' },
    { name: 'Gönüllülük Portalı Entegrasyonu', icon: Network, color: 'bg-rose-500', href: '/ngo-admin/volunteer-portal' },
    { name: 'Web Analiz Araçları', icon: LineChart, color: 'bg-amber-600', href: '/ngo-admin/analytics-tools' },
];

const statusVariantMap = {
    'approved': "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 border-green-300/50",
    'pending': "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300 border-yellow-300/50",
};

export default function AdminPage() {
  return (
    <div className="space-y-8 animate-in fade-in-0 max-w-5xl mx-auto pb-12">
      <div className="space-y-1 px-1">
        <h1 className="text-3xl font-bold font-headline">Yönetim Paneli</h1>
        <p className="text-muted-foreground text-sm">Varlıklarınızı ve yönetim araçlarınızı buradan yönetin.</p>
      </div>
      
      <Card className="shadow-sm">
        <CardHeader className="bg-muted/20">
            <CardTitle className="text-lg">Yönettiğim Varlıklar</CardTitle>
            <CardDescription>Aktif olarak yönetiminde bulunduğunuz STK ve markalar.</CardDescription>
        </CardHeader>
        <CardContent className='p-0'>
            <div className="divide-y">
            {managedItems.map(item => {
                // @ts-ignore
                const Icon = Icons[item.icon.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('')] || Icons.HelpCircle;
                return (
                <Link href={item.href} key={item.name} className="block hover:bg-accent transition-colors">
                    <div className="flex items-center p-4">
                        <div className={cn("p-2 rounded-lg mr-4", iconColorMap[item.icon] || 'bg-gray-500')}>
                            <Icon className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1">
                            <p className="font-semibold">{item.name}</p>
                            <p className="text-xs text-muted-foreground">{item.type}</p>
                        </div>
                        <div className="flex items-center gap-2">
                             <Badge variant="outline" className={cn("text-[10px] font-bold px-2 py-0.5", statusVariantMap[item.status as keyof typeof statusVariantMap])}>
                                {item.status === 'approved' ? 'Onaylı' : 'Onay Bekliyor'}
                            </Badge>
                            <ChevronRight className="h-5 w-5 text-muted-foreground/50" />
                        </div>
                    </div>
                </Link>
            )})}
            </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="bg-muted/20">
            <CardTitle className="text-lg">Entegrasyon ve Yönetim Araçları</CardTitle>
            <CardDescription>Kuruluşunuzu daha etkili yönetmek için kullanabileceğiniz araçlar.</CardDescription>
        </CardHeader>
        <CardContent className='p-0'>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 divide-x divide-y border-t">
                {toolItems.map(item => (
                    <Link href={item.href} key={item.name} className="flex items-center p-4 hover:bg-accent transition-colors group">
                        <div className={cn("p-2 rounded-lg mr-4 text-white shadow-sm", item.color)}>
                            <item.icon className="h-5 w-5" />
                        </div>
                        <span className="text-sm font-medium flex-1">{item.name}</span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                ))}
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
