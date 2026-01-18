'use client';
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronRight, DollarSign, Users, Heart } from 'lucide-react';
import * as Icons from 'lucide-react';
import Link from 'next/link';

const menuItems = [
  { label: 'Gönüllülük', description: "İlanları ve başvuruları yönet", href: '/ngo-admin/volunteer', icon: 'heart-handshake' },
  { label: 'Bağış Takibi', description: "Bağış geçmişini ve hak edişleri görüntüle", href: '/ngo-admin/donations', icon: 'dollar-sign' },
  { label: 'Demografi', description: "Destekçi demografisini analiz et", href: '/ngo-admin/demographics', icon: 'bar-chart-3' },
  { label: 'Gönderiler', description: "Toplulukla etkileşim kur", href: '/ngo-admin/posts', icon: 'newspaper' },
  { label: 'STK Profil QR Kodu', description: "Profilini kolayca paylaş", href: '/ngo-admin/qr', icon: 'qr-code' },
  { label: 'Raporlar', description: "Finansal ve etki raporlarını indir", href: '/ngo-admin/reports', icon: 'file-text' },
  { label: 'Şeffaflık Endeksi', description: "Şeffaflık puanını yükselt", href: '/ngo-admin/transparency', icon: 'shield-check' },
  { label: 'Profili Yönet', description: "Kuruluş bilgilerini güncelle", href: '/ngo-admin/manage-profile', icon: 'building' },
];

const secondaryMenuItems = [
  { label: 'Destek', description: "Yardım al veya talep oluştur", href: '/ngo-admin/support', icon: 'help-circle' },
  { label: 'Ayarlar', description: "Panel ve kullanıcı ayarları", href: '/ngo-admin/settings', icon: 'settings' },
];

export default function NgoDashboardPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold font-headline">STK Yönetim Paneli</h1>
        <p className="text-muted-foreground">Hoş geldin, Ahbap Derneği! İşte genel bir bakış.</p>
      </div>

       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Bağış</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1.245,78 ₺</div>
            <p className="text-xs text-muted-foreground">+%20.1 geçen aydan</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Gönüllü</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+2.350</div>
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
            <p className="text-xs text-muted-foreground">Onay bekleyen gönüllü başvuruları</p>
          </CardContent>
        </Card>
      </div>
      
      <div>
         <h2 className="text-lg font-semibold mb-4">Yönetim Araçları</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {menuItems.map(item => {
                // @ts-ignore
                const Icon = Icons[item.icon.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('')] || Icons.HelpCircle;
                return (
                <Link href={item.href} key={item.label} passHref>
                    <Card className="hover:bg-accent transition-colors h-full flex flex-col justify-center">
                        <CardHeader className="flex flex-row items-center justify-between p-4">
                            <div className='flex items-start gap-4'>
                                <div className="p-3 bg-muted rounded-lg">
                                    <Icon className="h-6 w-6 text-primary" />
                                </div>
                                <div className="space-y-1">
                                    <CardTitle className="text-base">{item.label}</CardTitle>
                                    <CardDescription className="text-xs">{item.description}</CardDescription>
                                </div>
                            </div>
                            <ChevronRight className="h-5 w-5 text-muted-foreground self-center" />
                        </CardHeader>
                    </Card>
                </Link>
            )})}
        </div>
      </div>


      <div>
        <h2 className="text-lg font-semibold mt-8 mb-4">Diğer</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {secondaryMenuItems.map(item => {
              // @ts-ignore
              const Icon = Icons[item.icon.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('')] || Icons.HelpCircle;
              return (
              <Link href={item.href} key={item.label} passHref>
                  <Card className="hover:bg-accent transition-colors h-full flex flex-col justify-center">
                      <CardHeader className="flex flex-row items-center justify-between p-4">
                          <div className='flex items-start gap-4'>
                              <div className="p-3 bg-muted rounded-lg">
                                  <Icon className="h-6 w-6 text-primary" />
                              </div>
                              <div className="space-y-1">
                                    <CardTitle className="text-base">{item.label}</CardTitle>
                                    <CardDescription className="text-xs">{item.description}</CardDescription>
                                </div>
                          </div>
                          <ChevronRight className="h-5 w-5 text-muted-foreground self-center" />
                      </CardHeader>
                  </Card>
              </Link>
          )})}
        </div>
      </div>
    </div>
  );
}