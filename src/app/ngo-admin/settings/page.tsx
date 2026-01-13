'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import React from 'react';
import { Bell, User, Shield } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Panel Ayarları</h1>
        <p className="text-muted-foreground">
          Yönetim paneli ve profilinizle ilgili tercihleri buradan yapılandırın.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bildirim Tercihleri</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <Label htmlFor="new-volunteer-notif" className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <span>Yeni Gönüllü Başvurusu</span>
            </Label>
            <Switch id="new-volunteer-notif" defaultChecked />
          </div>
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <Label htmlFor="new-donation-notif" className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <span>Yeni Bağış Yapıldığında</span>
            </Label>
            <Switch id="new-donation-notif" defaultChecked />
          </div>
           <div className="flex items-center justify-between p-4 border rounded-lg">
            <Label htmlFor="platform-notif" className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <span>hangel Platform Duyuruları</span>
            </Label>
            <Switch id="platform-notif" />
          </div>
        </CardContent>
      </Card>
      
       <Card>
        <CardHeader>
          <CardTitle>Kullanıcı Yönetimi</CardTitle>
          <CardDescription>Panele erişebilecek kullanıcıları yönetin.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
            <div className="flex justify-between items-center">
                <div>
                    <p className="font-medium">İsmail Hilmi Adıgüzel</p>
                    <p className="text-sm text-muted-foreground">i.adiguzel@ahbap.org (Kurucu)</p>
                </div>
                <Button variant="outline" size="sm">Erişimi Kaldır</Button>
            </div>
             <Button>
                <User className="mr-2 h-4 w-4"/> Yeni Kullanıcı Ekle
            </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Hesap İşlemleri</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
            <div>
                <h3 className="font-medium">Profili Geçici Olarak Dondur</h3>
                <p className="text-sm text-muted-foreground">Profiliniz platformda görünmez olur, ancak verileriniz silinmez.</p>
                <Button variant="secondary" className="mt-2">Profili Dondur</Button>
            </div>
             <div>
                <h3 className="font-medium text-destructive">Hesabı Kalıcı Olarak Sil</h3>
                <p className="text-sm text-muted-foreground">Bu işlem geri alınamaz. Tüm verileriniz kalıcı olarak silinecektir.</p>
                <Button variant="destructive" className="mt-2">Hesabı Sil</Button>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
