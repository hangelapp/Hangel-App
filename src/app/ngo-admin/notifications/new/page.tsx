'use server';
'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Send, Sparkles, Target, Users, ShieldAlert, Search, Building, School } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { ngos, studentClubs } from '@/lib/data';

// Mock users with phone numbers
const mockUsers = [
    { id: 'u1', name: 'Ahmet Yılmaz', username: '@ahmtylmz', phone: '5551234567', avatarUrl: 'https://i.pravatar.cc/150?u=u1' },
    { id: 'u2', name: 'Zeynep Kaya', username: '@zeynepk', phone: '5559876543', avatarUrl: 'https://i.pravatar.cc/150?u=u2' },
    { id: 'u3', name: 'Mustafa Demir', username: '@mdemir', phone: '5550001122', avatarUrl: 'https://i.pravatar.cc/150?u=u3' },
];

export default function NewMessagePage() {
    const { toast } = useToast();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [recipientType, setRecipientType] = useState<string>('');
    const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredEntities = useMemo(() => {
        const lowercased = searchTerm.toLowerCase();
        
        if (recipientType === 'individual-user') {
            return mockUsers.filter(u => 
                u.name.toLowerCase().includes(lowercased) || 
                u.username.toLowerCase().includes(lowercased) ||
                u.phone.includes(searchTerm)
            ).map(u => ({ id: u.id, name: u.name, sub: u.username, phone: u.phone, avatar: u.avatarUrl }));
        }
        
        if (recipientType === 'individual-ngo') {
            return ngos.filter(n => 
                n.name.toLowerCase().includes(lowercased) ||
                (n.shortName && n.shortName.toLowerCase().includes(lowercased))
            ).map(n => ({ id: n.id, name: n.name, sub: n.category, avatar: n.avatarUrl }));
        }

        if (recipientType === 'individual-club') {
            return studentClubs.filter(c => 
                c.name.toLowerCase().includes(lowercased) ||
                c.university.toLowerCase().includes(lowercased)
            ).map(c => ({ id: c.id, name: c.name, sub: c.university, avatar: c.avatarUrl }));
        }

        return [];
    }, [recipientType, searchTerm]);

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
                            <CardDescription>Topluluğunuza veya diğer kurumlara iletmek istediğiniz mesajı buraya yazın.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form id="message-form" onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="recipient-type">Hedef Kitle / Alıcı Türü</Label>
                                    <Select required onValueChange={(val) => { setRecipientType(val); setSelectedEntityId(null); setSearchTerm(''); }}>
                                        <SelectTrigger id="recipient-type">
                                            <SelectValue placeholder="Alıcı grubunu seçin..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="group-volunteers">Aktif Gönüllülerim (Grup)</SelectItem>
                                            <SelectItem value="group-donors">Düzenli Bağışçılarım (Grup)</SelectItem>
                                            <SelectItem value="individual-user">Bireysel Kullanıcı</SelectItem>
                                            <SelectItem value="individual-ngo">Sivil Toplum Kuruluşu (STK)</SelectItem>
                                            <SelectItem value="individual-club">Öğrenci Kulübü</SelectItem>
                                            <SelectItem value="admin">Hangel Sistem Yöneticisi</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {['individual-user', 'individual-ngo', 'individual-club'].includes(recipientType) && (
                                    <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                                        <Label>
                                            {recipientType === 'individual-user' ? 'Kullanıcı Seçin' : recipientType === 'individual-ngo' ? 'STK Seçin' : 'Kulüp Seçin'}
                                        </Label>
                                        <div className="relative">
                                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input 
                                                placeholder={recipientType === 'individual-user' ? "İsim, @kullanıcıadı veya telefon ile ara..." : "İsim ile ara..."}
                                                className="pl-8"
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                            />
                                        </div>
                                        <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                                            {filteredEntities.length > 0 ? filteredEntities.map(entity => (
                                                <div 
                                                    key={entity.id} 
                                                    onClick={() => setSelectedEntityId(entity.id)}
                                                    className={cn(
                                                        "flex items-center gap-3 p-2 rounded-md cursor-pointer transition-colors border",
                                                        selectedEntityId === entity.id ? "bg-primary/10 border-primary" : "hover:bg-accent border-transparent"
                                                    )}
                                                >
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarImage src={entity.avatar} />
                                                        <AvatarFallback>{entity.name[0]}</AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1">
                                                        <p className="text-sm font-medium">{entity.name}</p>
                                                        <p className="text-xs text-muted-foreground">{entity.sub} {entity.phone && `• ${entity.phone}`}</p>
                                                    </div>
                                                    {selectedEntityId === entity.id && <div className="w-2 h-2 rounded-full bg-primary" />}
                                                </div>
                                            )) : (
                                                <p className="text-center py-4 text-xs text-muted-foreground">Eşleşen sonuç bulunamadı.</p>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label htmlFor="subject">Konu Başlığı</Label>
                                    <Input id="subject" placeholder="Örn: İşbirliği Hakkında" required />
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
                            <Button type="submit" form="message-form" disabled={isLoading || (['individual-user', 'individual-ngo', 'individual-club'].includes(recipientType) && !selectedEntityId)} className="px-8">
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
                            <p><strong>Kurumsal İşbirliği:</strong> Diğer STK veya kulüplerle ortak projeler geliştirmek için bireysel mesajlaşmayı kullanın.</p>
                            <p><strong>Gönüllü Desteği:</strong> Gönüllülerinize telefon numaraları üzerinden ulaşarak daha hızlı koordinasyon sağlayabilirsiniz.</p>
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
                                <span className="text-muted-foreground">Destekçi Markalar:</span>
                                <span className="font-bold">12 Marka</span>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 flex items-start gap-3">
                        <ShieldAlert className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                        <p className="text-[10px] text-amber-800 leading-tight">
                            Platform içi mesajlar kurumsal etik kurallara tabidir. Tüm yazışmalar platform güvenliği için sistem tarafından loglanmaktadır.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
