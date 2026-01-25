'use client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import React, { useState, useMemo } from 'react';
import { useToast } from "@/hooks/use-toast";

const mockUsers = [
    { id: '1', name: 'İsmail Hilmi Adıgüzel', email: 'i.adiguzel@email.com', role: 'Kullanıcı', status: 'Aktif', avatarUrl: 'https://images.unsplash.com/photo-1521119989659-a83eee488004?w=100' },
    { id: '2', name: 'Ayşe Yılmaz', email: 'ayse.yilmaz@example.com', role: 'Kullanıcı', status: 'Aktif', avatarUrl: 'https://i.pravatar.cc/150?u=ayse' },
    { id: '3', name: 'Mehmet Kaya', email: 'mehmet.kaya@example.com', role: 'Yönetici', status: 'Askıda', avatarUrl: 'https://i.pravatar.cc/150?u=mehmet' },
    { id: '4', name: 'Fatma Demir', email: 'fatma.demir@example.com', role: 'Kullanıcı', status: 'Aktif', avatarUrl: 'https://i.pravatar.cc/150?u=fatma' },
];

export default function UsersPage() {
    const [users, setUsers] = useState(mockUsers);
    const [searchTerm, setSearchTerm] = useState('');
    const { toast } = useToast();

    const filteredUsers = useMemo(() => {
        return users.filter(u => 
            u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            u.email.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm, users]);

    const handleAction = (action: string, userName: string) => {
        toast({
            title: 'İşlem Başarısız',
            description: `${userName} için "${action}" işlemi henüz uygulanmadı.`,
            variant: 'destructive'
        });
    };

    return (
        <>
            <h1 className="text-lg font-semibold md:text-2xl">Kullanıcı Yönetimi</h1>
            <Card>
                <CardHeader>
                    <CardTitle>Tüm Kullanıcılar</CardTitle>
                    <CardDescription>
                        Platformdaki tüm kullanıcıları arayın ve yönetin.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Kullanıcı adı veya e-posta ile ara..." 
                            className="pl-10" 
                            value={searchTerm} 
                            onChange={e => setSearchTerm(e.target.value)} 
                        />
                    </div>
                    <div className="space-y-3">
                        {filteredUsers.map(user => (
                            <div key={user.id} className="p-3 border rounded-lg flex items-center justify-between">
                               <div className="flex items-center gap-3">
                                   <Avatar>
                                       <AvatarImage src={user.avatarUrl} alt={user.name} />
                                       <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                   </Avatar>
                                   <div>
                                       <p className="font-semibold">{user.name}</p>
                                       <p className="text-sm text-muted-foreground">{user.email}</p>
                                   </div>
                               </div>
                               <div className="flex items-center gap-2">
                                   <Badge variant={user.status === 'Aktif' ? 'default' : 'secondary'}>{user.status}</Badge>
                                   <Button variant="outline" size="sm" onClick={() => handleAction('Profili Düzenle', user.name)}>Profili Düzenle</Button>
                                   <Button variant="outline" size="sm" onClick={() => handleAction('Askıya Al', user.name)}>Askıya Al</Button>
                                   <Button variant="destructive" size="sm" onClick={() => handleAction('Sil', user.name)}>Sil</Button>
                               </div>
                           </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </>
    )
}
