'use client';
import React from 'react';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronRight } from 'lucide-react';
import * as Icons from 'lucide-react';
import Link from 'next/link';

const menuItems = [
  { label: 'Genel Bakış', href: '/ngo-admin/dashboard', icon: 'layout-dashboard' },
  { label: 'Gönüllülük', href: '/ngo-admin/volunteer', icon: 'heart-handshake' },
  { label: 'Bağış Takibi', href: '/ngo-admin/donations', icon: 'dollar-sign' },
  { label: 'Demografi', href: '/ngo-admin/demographics', icon: 'bar-chart-3' },
  { label: 'Gönderiler', href: '/ngo-admin/posts', icon: 'newspaper' },
  { label: 'STK Profil QR Kodu', href: '/ngo-admin/qr', icon: 'qr-code' },
  { label: 'Raporlar', href: '/ngo-admin/reports', icon: 'file-text' },
  { label: 'Şeffaflık Endeksi', href: '/ngo-admin/transparency', icon: 'shield-check' },
  { label: 'Profili Yönet', href: '/ngo-admin/manage-profile', icon: 'building' },
];

const secondaryMenuItems = [
  { label: 'Destek', href: '/ngo-admin/support', icon: 'help-circle' },
  { label: 'Ayarlar', href: '/ngo-admin/settings', icon: 'settings' },
];

export default function NgoDashboardPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold font-headline">STK Yönetim Paneli</h1>
        <p className="text-muted-foreground text-sm">Kuruluşunuzla ilgili tüm araçlara ve bilgilere buradan erişin.</p>
      </div>
      
      <div className="space-y-3">
        {menuItems.map(item => {
            // @ts-ignore
            const Icon = Icons[item.icon.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('')] || Icons.HelpCircle;
            return (
            <Link href={item.href} key={item.label} passHref>
                <Card className="hover:bg-accent transition-colors">
                    <CardHeader className="flex flex-row items-center justify-between p-4">
                        <div className='flex items-center gap-4'>
                            <div className="p-3 bg-muted rounded-lg">
                                <Icon className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <CardTitle className="text-base">{item.label}</CardTitle>
                            </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </CardHeader>
                </Card>
            </Link>
        )})}
      </div>

      <div>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-6 mb-2">Diğer</h2>
        <div className="space-y-3">
          {secondaryMenuItems.map(item => {
              // @ts-ignore
              const Icon = Icons[item.icon.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('')] || Icons.HelpCircle;
              return (
              <Link href={item.href} key={item.label} passHref>
                  <Card className="hover:bg-accent transition-colors">
                      <CardHeader className="flex flex-row items-center justify-between p-4">
                          <div className='flex items-center gap-4'>
                              <div className="p-3 bg-muted rounded-lg">
                                  <Icon className="h-6 w-6 text-primary" />
                              </div>
                              <div>
                                  <CardTitle className="text-base">{item.label}</CardTitle>
                              </div>
                          </div>
                          <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      </CardHeader>
                  </Card>
              </Link>
          )})}
        </div>
      </div>
    </div>
  );
}
