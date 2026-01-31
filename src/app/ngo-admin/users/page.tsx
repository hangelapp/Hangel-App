'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import React, { useState } from 'react';
import { User, Plus, Trash2, ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const initialUsers = [
    { name: 'İsmail Hilmi Adıgüzel', email: 'i.adiguzel@ahbap.org', role: 'Kurucu', status: 'Onaylandı' as const },
    { name: 'Ayşe Yılmaz', email: 'ayse.yilmaz@ahbap.org', role: 'Yönetici', status: 'Onaylandı' as const },
    { name: 'Mehmet Öztürk', email: 'mehmet.ozturk@example.com', role: 'Editör', status: 'Beklemede' as const },
];

const statusVariantMap = {
    'Onaylandı': "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 border-green-300/50",
    'Beklemede': "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300 border-yellow-300/50",
} as const;

export default function UsersPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [users, setUsers] = useState(initialUsers);

  const handleRemoveUser = (email: string) => {
    setUsers(prev => prev.filter(u => u.email !== email));
    toast({
        variant: "destructive",
        title: "Yetkili Kaldırıldı",
        description: "Kullanıcının panel erişimi sonlandırıldı.",
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in-0">
      <div className="flex items-center gap-2">
        <Button onClick={() => router.back()} variant="ghost" size="icon" className="-ml-2">
            <ArrowLeft className="h-6 w-6" />
        </Button>
        <div>
            <h1 className="text-2xl font-bold font-headline">Yetkili Yönetimi</h1>
            <p className="text-muted-foreground text-sm">
              Panele erişebilecek ve kuruluşunuzu temsil edecek kullanıcıları yönetin.
            </p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Yetkili Listesi</CardTitle>
            <CardDescription>Aktif ve onay bekleyen yetkililer.</CardDescription>
          </div>
          <Button asChild size="sm">
            <Link href="/ngo-admin/users/new">
                <Plus className="mr-2 h-4 w-4"/> Yeni Yetkili Ekle
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="space-y-3">
                {users.length > 0 ? users.map(user => (
                    <div key={user.email} className="flex justify-between items-center p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                        <div>
                            <p className="font-medium">{user.name} <span className="text-xs text-muted-foreground ml-1">({user.role})</span></p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                        <div className="flex items-center gap-3">
                             <Badge variant="outline" className={cn("text-[10px] font-bold px-2 py-0", statusVariantMap[user.status])}>
                                {user.status}
                            </Badge>
                             <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                onClick={() => handleRemoveUser(user.email)}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )) : (
                    <div className="text-center py-12 border-2 border-dashed rounded-lg">
                        <User className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                        <p className="text-muted-foreground">Kayıtlı yetkili bulunmuyor.</p>
                    </div>
                )}
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
