'use client';
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Users, Heart } from 'lucide-react';
import { user } from '@/lib/data';

export default function NgoDashboardPage() {
    const userName = user.name.split(' ')[0] + ' ' + user.name.split(' ')[1].toLowerCase();
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold font-headline">Kuruluş Yönetim Paneli</h1>
        <p className="text-muted-foreground">Hoş geldin, {userName}</p>
      </div>

       <div className="grid gap-4 md:grid-cols-3">
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
            <CardTitle className="text-sm font-medium">Destekçi Sayısı</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+2.350</div>
            <p className="text-xs text-muted-foreground">Bu ay +180 yeni destekçi</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Yeni Etkileşimler</CardTitle>
             <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+12</div>
            <p className="text-xs text-muted-foreground">Onay bekleyen etkileşimler</p>
          </CardContent>
        </Card>
      </div>
      
        <Card>
            <CardHeader>
                <CardTitle>Hızlı Bakış</CardTitle>
                <CardDescription>Son aktiviteler ve önemli metrikler yakında burada olacak.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                    <p>Yakında daha fazla gösterge paneli bileşeni eklenecektir.</p>
                </div>
            </CardContent>
        </Card>
    </div>
  );
}
