'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import React from 'react';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Panel Ayarları</h1>
        <p className="text-muted-foreground">
          Hesap işlemlerini buradan yönetin.
        </p>
      </div>
      
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
