'use client';
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronRight } from 'lucide-react';
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
    </div>
  );
}
