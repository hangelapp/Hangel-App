'use client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import React, { useState, useMemo, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type User = {
    id: string;
    name: string;
    email: string;
    role: 'Kullanıcı' | 'Yönetici';
    status: 'Aktif' | 'Askıda';
    avatarUrl: string;
};

const mockUsers: User[] = [
    { id: '1', name: 'İsmail Hilmi Adıgüzel', email: 'i.adiguzel@email.com', role: 'Yönetici', status: 'Aktif', avatarUrl: 'https://images.unsplash.com/photo-1521119989659-a83eee488004?w=100' },
    { id: '2', name: 'Ayşe Yılmaz', email: 'ayse.yilmaz@example.com', role: 'Kullanıcı', status: 'Aktif', avatarUrl: 'https://i.pravatar.cc/150?u=ayse' },
    { id: '3', name: 'Mehmet Kaya', email: 'mehmet.kaya@example.com', role: 'Kullanıcı', status: 'Askıda', avatarUrl: 'https://i.pravatar.cc/150?u=mehmet' },
    { id: '4', name: 'Fatma Demir', email: 'fatma.demir@example.com', role: 'Kullanıcı', status: 'Aktif', avatarUrl: 'https://i.pravatar.cc/150?u=fatma' },
];

const EditUserDialog = ({ user, open, onOpenChange, onSave }: { user: User | null, open: boolean, onOpenChange: (open: boolean) => void, onSave: (updatedUser: User) => void }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [role, setRole] = useState<'Kullanıcı' | 'Yönetici'>('Kullanıcı');

    useEffect(() => {
        if (user) {
            setName(user.name);
            setEmail(user.email);
            setRole(user.role);
        }
    }, [user]);

    if (!user) return null;

    const handleSave = () => {
        onSave({ ...user, name, email, role });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Kullanıcıyı Düzenle</DialogTitle>
                    <DialogDescription>{user.name} kullanıcısının bilgilerini güncelleyin.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Ad Soyad</Label>
                        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">E-posta</Label>
                        <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="role">Rol</Label>
                        <Select value={role} onValueChange={(value) => setRole(value as 'Kullanıcı' | 'Yönetici')}>
                            <SelectTrigger id="role">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Kullanıcı">Kullanıcı</SelectItem>
                                <SelectItem value="Yönetici">Yönetici</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>İptal</Button>
                    <Button onClick={handleSave}>Kaydet</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default function UsersPage() {
    const [users, setUsers] = useState(mockUsers);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeSearch, setActiveSearch] = useState('');
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [deletingUser, setDeletingUser] = useState<User | null>(null);
    const { toast } = useToast();

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setActiveSearch(searchTerm);
    };

    const filteredUsers = useMemo(() => {
        if (!activeSearch) return users;
        return users.filter(u => 
            u.name.toLowerCase().includes(activeSearch.toLowerCase()) || 
            u.email.toLowerCase().includes(activeSearch.toLowerCase())
        );
    }, [activeSearch, users]);

    const handleToggleStatus = (userId: string) => {
        setUsers(prevUsers =>
            prevUsers.map(user => {
                if (user.id === userId) {
                    const newStatus = user.status === 'Aktif' ? 'Askıda' : 'Aktif';
                    toast({
                        title: `Kullanıcı durumu güncellendi`,
                        description: `${user.name} kullanıcısı ${newStatus.toLowerCase()} olarak ayarlandı.`,
                    });
                    return { ...user, status: newStatus };
                }
                return user;
            })
        );
    };

    const handleDelete = () => {
        if (!deletingUser) return;
        setUsers(prevUsers => prevUsers.filter(user => user.id !== deletingUser.id));
        toast({
            variant: 'destructive',
            title: 'Kullanıcı Silindi',
            description: `${deletingUser.name} kullanıcısı başarıyla silindi.`,
        });
        setDeletingUser(null);
    };

    const handleSaveUser = (updatedUser: User) => {
        setUsers(prevUsers =>
            prevUsers.map(user => (user.id === updatedUser.id ? updatedUser : user))
        );
        toast({
            title: 'Kullanıcı Güncellendi',
            description: `${updatedUser.name} kullanıcısının bilgileri başarıyla güncellendi.`,
        });
        setEditingUser(null);
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
                    <form onSubmit={handleSearch} className="flex items-center gap-2">
                        <div className="relative flex-grow">
                            <Input 
                                placeholder="Kullanıcı adı veya e-posta ile ara..." 
                                value={searchTerm} 
                                onChange={e => setSearchTerm(e.target.value)} 
                            />
                        </div>
                        <Button type="submit" size="icon">
                            <Search className="h-4 w-4" />
                        </Button>
                    </form>
                    <div className="space-y-3">
                        {filteredUsers.map(user => (
                           <div key={user.id} className="p-4 border rounded-lg flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <div className="flex items-center gap-4">
                                    <Avatar>
                                        <AvatarImage src={user.avatarUrl} alt={user.name} />
                                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <p className="font-semibold">{user.name}</p>
                                            <Badge variant={user.status === 'Aktif' ? 'default' : 'secondary'}>{user.status}</Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground">{user.email}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 sm:flex gap-2">
                                    <Button variant="outline" size="sm" onClick={() => setEditingUser(user)}>Düzenle</Button>
                                    <Button variant="outline" size="sm" onClick={() => handleToggleStatus(user.id)}>{user.status === 'Aktif' ? 'Askıya Al' : 'Aktif Et'}</Button>
                                    <Button variant="destructive" size="sm" onClick={() => setDeletingUser(user)}>Sil</Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <EditUserDialog 
                user={editingUser}
                open={!!editingUser}
                onOpenChange={() => setEditingUser(null)}
                onSave={handleSaveUser}
            />

            <AlertDialog open={!!deletingUser} onOpenChange={() => setDeletingUser(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{deletingUser?.name} kullanıcısını silmek istediğinizden emin misiniz?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bu işlem geri alınamaz. Kullanıcı kalıcı olarak silinecektir.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Vazgeç</AlertDialogCancel>
                        <AlertDialogAction className={cn(buttonVariants({ variant: "destructive" }))} onClick={handleDelete}>
                            Evet, Sil
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
