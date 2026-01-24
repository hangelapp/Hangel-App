"use client";
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronRight } from 'lucide-react';
import * as Icons from 'lucide-react';
import Link from 'next/link';
import { managedItems } from '@/lib/data';
import { cn } from '@/lib/utils';
import type { SideNavItem } from '@/lib/types';


const adminMenuItems: SideNavItem[] = [
  { label: 'Genel Bakış', href: '/admin', icon: 'layout-grid' },
  { label: 'Öğrenci Kulüpleri', href: '/admin/clubs', icon: 'users' },
  { label: 'Kulüp Etkinlikleri', href: '/admin/events', icon: 'calendar' },
];


const iconColorMap: { [key: string]: string } = {
  store: 'bg-green-500',
  'file-text': 'bg-sky-500',
  'heart-handshake': 'bg-red-500',
  users: 'bg-blue-500',
  'layout-grid': 'bg-slate-500',
  calendar: 'bg-red-400',
};

const statusVariantMap = {
    'approved': "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 border-green-300/50",
    'pending': "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300 border-yellow-300/50",
};

export default function AdminPage() {
  return (
    <div className="space-y-6 animate-in fade-in-0">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold font-headline">Yönetim Paneli</h1>
        <p className="text-muted-foreground text-sm">Yönetim araçlarına ve yönettiğiniz kuruluşlara buradan erişin.</p>
      </div>
      
      <Card>
          <CardHeader>
              <CardTitle>Yönetim Araçları</CardTitle>
          </CardHeader>
          <CardContent className='p-0'>
              <div className="divide-y">
                  {adminMenuItems.map(item => {
                      if (item.href === '/admin') return null;
                      // @ts-ignore
                      const Icon = Icons[item.icon.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('')] || Icons.HelpCircle;
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
      
      <Card>
        <CardHeader>
            <CardTitle>Yönettiğim Varlıklar</CardTitle>
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
                            <p className="text-sm text-muted-foreground">{item.type}</p>
                        </div>
                        <div className="flex items-center gap-2">
                             <Badge variant="outline" className={cn("text-xs font-medium", statusVariantMap[item.status as keyof typeof statusVariantMap])}>
                                {item.status === 'approved' ? 'Onaylı' : 'Onay Bekliyor'}
                            </Badge>
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
                        </div>
                    </div>
                </Link>
            )})}
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
