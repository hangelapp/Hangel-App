
"use client";
import React from 'react';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building, School, Store, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { managedItems } from '@/lib/data';

export default function AdminPage() {
  return (
    <div className="p-4 space-y-4 animate-in fade-in-0">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold font-headline">Yönetim Paneli</h1>
        <p className="text-muted-foreground text-sm">Yönettiğiniz kuruluşlara, markalara ve kulüplere buradan erişin.</p>
      </div>
      
      <div className="space-y-3">
        {managedItems.map(item => (
            <Link href={item.href} key={item.name} passHref>
                <Card className="hover:bg-accent transition-colors">
                    <CardHeader className="flex flex-row items-center justify-between p-4">
                        <div className='flex items-center gap-4'>
                            <div className="p-3 bg-muted rounded-lg">
                                <item.icon className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <CardTitle className="text-base">{item.name}</CardTitle>
                                <CardDescription>{item.type}</CardDescription>
                            </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </CardHeader>
                </Card>
            </Link>
        ))}
      </div>
    </div>
  );
}
