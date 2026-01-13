'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import React from 'react';

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Raporlar</h1>
        <p className="text-muted-foreground">
          Kuruluşunuzun faaliyetleri, finansalları ve etkisiyle ilgili tüm raporlara buradan erişin.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Finansal Raporlar</CardTitle>
            <CardDescription>Detaylı hak ediş ve işlem raporlarınızı indirin.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-between">
              Temmuz 2024 Hak Ediş Raporu <Download className="h-4 w-4" />
            </Button>
            <Button variant="outline" className="w-full justify-between">
              2024 2. Çeyrek Raporu <Download className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Gönüllü Raporları</CardTitle>
            <CardDescription>Gönüllü faaliyetleriniz ve demografik yapıları hakkında raporlar.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-between">
              Temmuz 2024 Gönüllü Listesi <Download className="h-4 w-4" />
            </Button>
            <Button variant="outline" className="w-full justify-between">
              Gönüllü Demografi Raporu <Download className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Etki Raporları</CardTitle>
            <CardDescription>Projelerinizin ve faaliyetlerinizin yarattığı sosyal etki raporları.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-between">
              2023 Yıllık Etki Raporu <Download className="h-4 w-4" />
            </Button>
            <Button variant="outline" className="w-full justify-between">
              Ağaçlandırma Projesi Raporu <Download className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
