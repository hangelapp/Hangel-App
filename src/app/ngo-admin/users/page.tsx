'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import React, { useState } from 'react';
import { User, Plus, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  const [users, setUsers] = useState(initialUsers);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  
  // New user form state
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState('Yönetici');

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName || !newUserEmail) {
        toast({
            variant: "destructive",
            title: "Eksik Bilgi",
            description: "Lütfen ad soyad ve e-posta adresini girin.",
        });
        return;
    }

    const newUser = {
        name: newUserName,
        email: newUserEmail,
        role: newUserRole,
        status: 'Beklemede' as const
    };

    setUsers(prev => [...prev, newUser]);
    setIsAddDialogOpen(false);
    
    // Reset form
    setNewUserName('');
    setNewUserEmail('');
    setNewUserRole('Yönetici');

    toast({
        title: "Yetkili Eklendi",
        description: `${newUserName} için yetki başvurusu oluşturuldu.`,
    });
  };

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
      <div>
        <h1 className="text-2xl font-bold font-headline">Yetkili Yönetimi</h1>
        <p className="text-muted-foreground text-sm">
          Panele erişebilecek ve kuruluşunuzu temsil edecek kullanıcıları yönetin.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Yetkili Listesi</CardTitle>
            <CardDescription>Aktif ve onay bekleyen yetkililer.</CardDescription>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
                <Button size="sm">
                    <Plus className="mr-2 h-4 w-4"/> Yeni Yetkili Ekle
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Yeni Yetkili Davet Et</DialogTitle>
                    <DialogDescription>
                        Kuruluşunuza yeni bir yönetici veya editör ekleyin. Davet edilen kişiye onay bildirimi gidecektir.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleAddUser} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="new-user-name">Ad Soyad</Label>
                        <Input 
                            id="new-user-name" 
                            placeholder="Örn: Can Demir" 
                            value={newUserName}
                            onChange={(e) => setNewUserName(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="new-user-email">E-posta Adresi</Label>
                        <Input 
                            id="new-user-email" 
                            type="email" 
                            placeholder="eposta@kurum.org" 
                            value={newUserEmail}
                            onChange={(e) => setNewUserEmail(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="new-user-role">Rol</Label>
                        <Select value={newUserRole} onValueChange={setNewUserRole}>
                            <SelectTrigger id="new-user-role">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Yönetici">Yönetici</SelectItem>
                                <SelectItem value="Editör">Editör</SelectItem>
                                <SelectItem value="Gönüllü Sorumlusu">Gönüllü Sorumlusu</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <DialogFooter className="pt-4">
                        <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>İptal</Button>
                        <Button type="submit">Davet Gönder</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
          </Dialog>
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
