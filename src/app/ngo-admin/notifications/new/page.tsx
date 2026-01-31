
'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Send, Sparkles, Target, Users, ShieldAlert, User, Search } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// Mock users for selection
const mockUsers = [
    { id: 'u1', name: 'Ahmet Yılmaz', username: '@ahmtylmz', avatarUrl: 'https://i.pravatar.cc/150?u=u1' },
    { id: 'u2', name: 'Zeynep Kaya', username: '@zeynepk', avatarUrl: 'https://i.pravatar.cc/150?u=u2' },
    { id: 'u3', name: 'Mustafa Demir', username: '@mdemir', avatarUrl: 'https://i.pravatar.cc/150?u=u3' },
];

export default function NewMessagePage() {
    const { toast } = useToast();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [recipientType, setRecipientType] = useState<string>('');
    const [selectedUser, setSelectedUser] = useState<string | null>(null);
    const [userSearch, setUserSearch] = useState('');

    const filteredUsers = mockUsers.filter(u => 
        u.name.toLowerCase().includes(userSearch.toLowerCase()) || 
        u.username.toLowerCase().includes(userSearch.toLowerCase())
    );

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        
        setTimeout(() => {
            toast({
                title: "Mesaj Gönderildi",
                description: "Mesajınız alıcılara başarıyla ulaştırıldı.",
            });
            setIsLoading(false);
            router.push('/ngo-admin/notifications');
        }, 1500);
    };

    return (
        <div className="space-y-6 animate-in fade-in-0 max-w-4xl mx-auto p-4 sm:p-6">
            <div className="flex items-center gap-2">
                <Button onClick={() => router.back()} variant="ghost" size="icon" className="-ml-2">
                    <ArrowLeft className="h-6 w-6" />
                </Button>
                <h1 className="text-2xl font-bold font-headline">Yeni İletişim Oluştur</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle>Mesaj İçeriği</CardTitle>
                            <CardDescription>Topluluğunuza veya yöneticilere iletmek istediğiniz mesajı buraya yazın.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form id="message-form" onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="recipient-type">Hedef Kitle / Alıcı Türü</Label>
                                    <Select required onValueChange={setRecipientType}>
                                        <SelectTrigger id="recipient-type">
                                            <SelectValue placeholder="Alıcı grubunu seçin..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="group-volunteers">Aktif Gönüllülerim (Grup)</SelectItem>
                                            <SelectItem value="group-donors">Düzenli Bağışçılarım (Grup)</SelectItem>
                                            <SelectItem value="individual-user">Bireysel Kullanıcı</SelectItem>
                                            <SelectItem value="individual-club">Öğrenci Kulübü</SelectItem>
                                            <SelectItem value="admin">Hangel Sistem Yöneticisi</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {recipientType === 'individual-user' && (
                                    <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                                        <Label>Kullanıcı Seçin</Label>
                                        <div className="relative">
                                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input 
                                                placeholder="İsim veya kullanıcı adı ile ara..." 
                                                className="pl-8"
                                                value={userSearch}
                                                onChange={(e) => setUserSearch(e.target.value)}
                                            />
                                        </div>
                                        <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto">
                                            {filteredUsers.map(user => (
                                                <div 
                                                    key={user.id} 
                                                    onClick={() => setSelectedUser(user.id)}
                                                    className={cn(
                                                        "flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors border",
                                                        selectedUser === user.id ? "bg-primary/10 border-primary" : "hover:bg-accent border-transparent"
                                                    )}
                                                >
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarImage src={user.avatarUrl} />
                                                        <AvatarFallback>{user.name[0]}</AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1">
                                                        <p className="text-sm font-medium">{user.name}</p>
                                                        <p className="text-xs text-muted-foreground">{user.username}</p>
                                                    </div>
                                                    {selectedUser === user.id && <div className="w-2 h-2 rounded-full bg-primary" />}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label htmlFor="subject">Konu Başlığı</Label>
                                    <Input id="subject" placeholder="Örn: Etkinlik Bilgilendirmesi" required />
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <Label htmlFor="message">Mesajınız</Label>
                                        <Button type="button" variant="ghost" size="sm" className="h-7 text-primary text-xs flex items-center gap-1" onClick={() => toast({title: "Yapay zeka asistanı yakında burada olacak!"})}>
                                            <Sparkles className="h-3 w-3" /> AI ile Taslağı Hazırla
                                        </Button>
                                    </div>
                                    <Textarea 
                                        id="message" 
                                        placeholder="Mesajınızı buraya detaylıca yazın..." 
                                        rows={10} 
                                        required 
                                    />
                                </div>
                            </form>
                        </CardContent>
                        <CardFooter className="flex justify-end gap-3 border-t pt-6 bg-muted/10">
                            <Button type="button" variant="outline" onClick={() => router.back()}>İptal</Button>
                            <Button type="submit" form="message-form" disabled={isLoading || (recipientType === 'individual-user' && !selectedUser)} className="px-8">
                                {isLoading ? (
                                    "Gönderiliyor..."
                                ) : (
                                    <>
                                        <Send className="mr-2 h-4 w-4" />
                                        Hemen Gönder
                                    </>
                                )}
                            </Button>
                        </CardFooter>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card className="bg-primary/5 border-primary/10">
                        <CardHeader>
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <Target className="h-4 w-4 text-primary" /> İletişim İpuçları
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-xs space-y-4 text-muted-foreground leading-relaxed">
                            <p><strong>Bireysel Mesajlaşma:</strong> Gönüllülerinizle özel durumları görüşmek için bireysel mesaj özelliğini kullanabilirsiniz.</p>
                            <p><strong>Kurumsal Dil:</strong> Mesajlarınızda kuruluşunuzun kimliğini yansıtan nazik ve açıklayıcı bir dil kullanmaya özen gösterin.</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <Users className="h-4 w-4 text-muted-foreground" /> Mevcut Erişim
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">Aktif Gönüllüler:</span>
                                <span className="font-bold">150 Kişi</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">Takipçiler:</span>
                                <span className="font-bold">12.4k Kişi</span>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 flex items-start gap-3">
                        <ShieldAlert className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                        <p className="text-[10px] text-amber-800 leading-tight">
                            Bireysel mesajlar da platform güvenlik kurallarına tabidir. Taciz veya reklam amaçlı kullanım hesap kısıtlamasına yol açabilir.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
