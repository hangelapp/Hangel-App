'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import React from 'react';
import { Bell, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';


const userList = [
    { name: 'İsmail Hilmi Adıgüzel', email: 'i.adiguzel@ahbap.org', role: 'Kurucu', status: 'Onaylandı' as const },
    { name: 'Ayşe Yılmaz', email: 'ayse.yilmaz@ahbap.org', role: 'Yönetici', status: 'Onaylandı' as const },
    { name: 'Mehmet Öztürk', email: 'mehmet.ozturk@example.com', role: 'Editör', status: 'Beklemede' as const },
];

const statusVariantMap = {
    'Onaylandı': "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 border-green-300/50",
    'Beklemede': "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300 border-yellow-300/50",
} as const;

export default function UsersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Yetkili Yönetimi</h1>
        <p className="text-muted-foreground">
          Panele erişebilecek kullanıcıları yönetin.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Kullanıcı Yönetimi</CardTitle>
          <CardDescription>Panele erişebilecek kullanıcıları yönetin.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="space-y-3">
                {userList.map(user => (
                    <div key={user.email} className="flex justify-between items-center p-3 border rounded-lg">
                        <div>
                            <p className="font-medium">{user.name} <span className="text-xs text-muted-foreground">({user.role})</span></p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                        <div className="flex items-center gap-2">
                             <Badge variant="outline" className={cn("text-xs font-medium", statusVariantMap[user.status])}>{user.status}</Badge>
                             <Button variant="outline" size="sm">Kaldır</Button>
                        </div>
                    </div>
                ))}
            </div>
             <Button>
                <User className="mr-2 h-4 w-4"/> Yeni Kullanıcı Ekle
            </Button>
        </CardContent>
      </Card>
    </div>
  );
}
