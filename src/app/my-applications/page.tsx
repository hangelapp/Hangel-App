"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { applications } from '@/lib/data';
import Link from 'next/link';

const statusVariantMap = {
    'Onaylandı': 'default',
    'Beklemede': 'secondary',
    'Reddedildi': 'destructive',
} as const;

export default function MyApplicationsPage() {
  return (
    <div className="p-4 space-y-4 animate-in fade-in-0">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Başvurularım</h1>
        <Link href="/my-applications/new" passHref asChild>
          <Button>Yeni Başvuru Yap</Button>
        </Link>
      </div>
      <p className="text-muted-foreground">Gönüllülük ve diğer başvurularınızın durumunu buradan takip edin.</p>
      
      <div className="space-y-4">
        {applications.map(app => (
          <Card key={app.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{app.title}</CardTitle>
                  <CardDescription>{app.org}</CardDescription>
                </div>
                <Badge variant={statusVariantMap[app.status]}>{app.status}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                <p>Tarih: {app.date}</p>
                <p>Konum: {app.location}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
       <div className="text-center text-muted-foreground py-12">
        <p>Başka başvuru bulunmuyor.</p>
      </div>
    </div>
  );
}
