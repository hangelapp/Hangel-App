
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
import { Search, ShieldAlert, UserCog, Loader2 } from "lucide-react";
import React, { useState, useMemo } from 'react';
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
import { useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import type { User } from '@/lib/types';

const EditUserDialog = ({ user, open, onOpenChange, onSave }: { user: User | null, open: boolean, onOpenChange: (open: boolean) => void, onSave: (updatedUser: Partial<User>) => void }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [role, setRole] = useState<'user' | 'ngo-admin' | 'super-admin'>('user');

    React.useEffect(() => {
        if (user) {
            setName(user.name);
            setEmail(user.personalInfo.email);
            setRole(user.role || 'user');
        }
    }, [user]);

    if (!user) return null;

    const handleSave = () => {
        onSave({ name, role });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="rounded-[2rem]">
                <DialogHeader>
                    <DialogTitle>Kullanıcı Yetki Yönetimi</DialogTitle>
                    <DialogDescription>{user.name} kullanıcısının platform yetkilerini güncelleyin.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Ad Soyad</Label>
                        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="role">Platform Yetkisi</Label>
                        <Select value={role} onValueChange={(value) => setRole(value as any)}>
                            <SelectTrigger id="role">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="user">Standart Kullanıcı</SelectItem>
                                <SelectItem value="ngo-admin">Yönetici (Kurumsal)</SelectItem>
                                <SelectItem value="super-admin">Süper Admin</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    {role === 'super-admin' && (
                        <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3">
                            <ShieldAlert className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
                            <p className="text-xs text-red-800 leading-relaxed font-medium">Dikkat: Süper Admin yetkisi, kullanıcının bu paneli ve tüm sistem ayarlarını yönetmesini sağlar.</p>
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>İptal</Button>
                    <Button onClick={handleSave}>Yetkileri Güncelle</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default function UsersPage() {
    const db = useFirestore();
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [deletingUser, setDeletingUser] = useState<User | null>(null);

    const usersQuery = useMemoFirebase(() => collection(db, 'users'), [db]);
    const { data: users, isLoading } = useCollection<User>(usersQuery);

    const filteredUsers = useMemo(() => {
        if (!users) return [];
        if (!searchTerm) return users;
        const lower = searchTerm.toLowerCase();
        return users.filter(u => 
            u.name.toLowerCase().includes(lower) || 
            u.personalInfo.email.toLowerCase().includes(lower) ||
            u.username.toLowerCase().includes(lower)
        );
    }, [searchTerm, users]);

    const handleToggleStatus = (userId: string, name: string, currentStatus: string) => {
        const newStatus = currentStatus === 'Aktif' ? 'Askıda' : 'Aktif';
        const userRef = doc(db, 'users', userId);
        updateDocumentNonBlocking(userRef, { status: newStatus });
        toast({
            title: `Kullanıcı durumu güncellendi`,
            description: `${name} kullanıcısı ${newStatus.toLowerCase()} olarak ayarlandı.`,
        });
    };

    const handleDelete = () => {
        if (!deletingUser) return;
        const userRef = doc(db, 'users', deletingUser.id);
        deleteDocumentNonBlocking(userRef);
        toast({
            variant: 'destructive',
            title: 'Kullanıcı Silindi',
            description: `${deletingUser.name} kullanıcısı başarıyla silindi.`,
        });
        setDeletingUser(null);
    };

    const handleSaveUser = (updatedData: Partial<User>) => {
        if (!editingUser) return;
        const userRef = doc(db, 'users', editingUser.id);
        updateDocumentNonBlocking(userRef, updatedData);
        toast({
            title: 'Yetkiler Güncellendi',
            description: `${editingUser.name} kullanıcısına yeni yetkileri tanımlandı.`,
        });
        setEditingUser(null);
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Kullanıcılar Yükleniyor...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in-0">
            <div className="space-y-1">
                <h1 className="text-3xl font-black tracking-tighter text-[#1d1d1f]">Kullanıcı Yönetimi</h1>
                <p className="text-muted-foreground text-sm font-medium">Platformdaki tüm kullanıcıları denetleyin ve yetki seviyelerini belirleyin.</p>
            </div>

            <Card className="rounded-[2.5rem] border-black/5 shadow-xl">
                <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <CardTitle>Platform Üyeleri ({users?.length || 0})</CardTitle>
                        <div className="relative w-full md:w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder="İsim, @kullanıcı veya e-posta..." 
                                className="pl-9 h-10 rounded-xl"
                                value={searchTerm} 
                                onChange={e => setSearchTerm(e.target.value)} 
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="divide-y border-t border-black/5">
                        {filteredUsers.map(user => (
                           <div key={user.id} className="p-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between hover:bg-muted/30 transition-colors">
                                <div className="flex items-center gap-4">
                                    <Avatar className="h-12 w-12 border shadow-sm">
                                        <AvatarImage src={user.avatarUrl} alt={user.name} />
                                        <AvatarFallback className="font-bold">{user.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                                    </Avatar>
                                    <div className="space-y-0.5">
                                        <div className="flex items-center gap-2">
                                            <p className="font-bold text-[#1d1d1f]">{user.name}</p>
                                            <Badge variant={user.role === 'super-admin' ? 'default' : user.role === 'ngo-admin' ? 'secondary' : 'outline'} className="text-[9px] font-black uppercase tracking-widest">
                                                {user.role === 'super-admin' ? 'SÜPER ADMİN' : user.role === 'ngo-admin' ? 'YÖNETİCİ' : 'KULLANICI'}
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground font-medium">{user.personalInfo.email} • {user.username}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 w-full sm:w-auto">
                                    <Button variant="outline" size="sm" className="flex-1 sm:flex-none rounded-xl font-bold h-9" onClick={() => setEditingUser(user)}>
                                        <UserCog className="mr-2 h-4 w-4" /> Yetki
                                    </Button>
                                    <Button variant="outline" size="sm" className="flex-1 sm:flex-none rounded-xl font-bold h-9" onClick={() => handleToggleStatus(user.id, user.name, (user as any).status || 'Aktif')}>
                                        {(user as any).status === 'Askıda' ? 'Aktif Et' : 'Askıya Al'}
                                    </Button>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive hover:bg-destructive/10 rounded-xl">
                                                <Icons.Trash2 className="h-4 w-4" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent className="rounded-[2.5rem]">
                                            <AlertDialogHeader>
                                                <AlertDialogTitle className="text-xl font-bold">{user.name} siliniyor</AlertDialogTitle>
                                                <AlertDialogDescription className="text-base font-medium">
                                                    Bu işlem geri alınamaz. Kullanıcı kalıcı olarak silinecektir. Devam etmek istiyor musunuz?
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter className="gap-2">
                                                <AlertDialogCancel className="rounded-2xl font-bold">Vazgeç</AlertDialogCancel>
                                                <AlertDialogAction className={cn(buttonVariants({ variant: "destructive" }), "rounded-2xl font-bold")} onClick={handleDelete}>Evet, Sil</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </div>
                        ))}
                        {filteredUsers.length === 0 && (
                            <div className="p-20 text-center text-muted-foreground italic">Eşleşen kullanıcı bulunamadı.</div>
                        )}
                    </div>
                </CardContent>
            </Card>

            <EditUserDialog 
                user={editingUser}
                open={!!editingUser}
                onOpenChange={() => setEditingUser(null)}
                onSave={handleSaveUser}
            />
        </div>
    )
}
