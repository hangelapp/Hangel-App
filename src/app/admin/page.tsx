"use client";
import React from 'react';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building, School, Store, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { managedItems } from '@/lib/data';

export default function AdminPage() {
  return (
    <div className="p-4 space-y-4 animate-in fade-in-0">
      <h1 className="text-2xl font-bold">Yönetim Paneli</h1>
      <p className="text-muted-foreground">Yönettiğiniz kuruluşlara, markalara ve kulüplere buradan erişin.</p>
      
      <div className="space-y-4">
        {managedItems.map(item => (
            <Link href={item.href} key={item.name} passHref>
                <Card className="hover:bg-accent transition-colors">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div className='flex items-center gap-4'>
                            <item.icon className="h-8 w-8 text-primary" />
                            <div>
                                <CardTitle className="text-lg">{item.name}</CardTitle>
                                <CardDescription>{item.type}</CardDescription>
                            </div>
                        </div>
                        <ChevronRight className="h-6 w-6 text-muted-foreground" />
                    </CardHeader>
                </Card>
            </Link>
        ))}
      </div>
    </div>
  );
}
