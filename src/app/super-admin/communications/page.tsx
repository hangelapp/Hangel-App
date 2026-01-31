'use client';

import React, { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Send, Bell, History, MessageSquare, ShieldAlert, Eye, User, Building, School } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { ngos, studentClubs } from '@/lib/data';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// Mock users for admin with phone numbers
const mockUsers = [
    { id: 'u1', name: 'Ahmet Yılmaz', username: '@ahmtylmz', phone: '5551234567', avatarUrl: 'https://i.pravatar.cc/150?u=u1' },
    { id: 'u2', name: 'Zeynep Kaya', username: '@zeynepk', phone: '5559876543', avatarUrl: 'https://i.pravatar.cc/150?u=u2' },
    { id: 'u3', name: 'Mustafa Demir', username: '@mdemir', phone: '5550001122', avatarUrl: 'https://i.pravatar.cc/150?u=u3' },
];

const initialMessageLog = [
    { id: 'l1', sender: 'Ahbap Derneği', recipient: 'İsmail Hilmi', timestamp: '2024-07-22 14:20', subject: 'Başvuru Onayı', type: 'direct' },
    { id: 'l2', sender: 'Sistem Admin', recipient: 'Tüm Kullanıcılar', timestamp: '2024-07-22 10:00', subject: 'Bakım Çalışması', type: 'broadcast' },
    { id: 'l3', sender: 'İTÜ Girişimcilik', recipient: 'Zeynep Kaya', timestamp: '2024-07-21 18:45', subject: 'Kulüp Toplantısı', type: 'direct' },
];

export default function CommunicationsPage() {
    const { toast } = useToast();
    const [messageLog] = useState(initialMessageLog);
    const [logSearchTerm, setLogSearchTerm] = useState('');
    const [recipientType, setRecipientType] = useState<string>('');
    const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
    const [entitySearchTerm, setEntitySearchTerm] = useState('');

    const filteredLog = messageLog.filter(l => 
        l.sender.toLowerCase().includes(logSearchTerm.toLowerCase()) || 
        l.recipient.toLowerCase().includes(logSearchTerm.toLowerCase()) ||
        l.subject.toLowerCase().includes(logSearchTerm.toLowerCase())
    );

    const filteredEntities = useMemo(() => {
        const lowercased = entitySearchTerm.toLowerCase();
        
        if (recipientType === 'user') {
            return mockUsers.filter(u => 
                u.name.toLowerCase().includes(lowercased) || 
                u.username.toLowerCase().includes(lowercased) ||
                u.phone.includes(entitySearchTerm)
            ).map(u => ({ id: u.id, name: u.name, sub: u.username, phone: u.phone, avatar: u.avatarUrl, icon: User }));
        }
        
        if (recipientType === 'ngo') {
            return ngos.filter(n => 
                n.name.toLowerCase().includes(lowercased) ||
                (n.shortName && n.shortName.toLowerCase().includes(lowercased))
            ).map(n => ({ id: n.id, name: n.name, sub: n.category, avatar: n.avatarUrl, icon: Building }));
        }

        if (recipientType === 'club') {
            return studentClubs.filter(c => 
                c.name.toLowerCase().includes(lowercased) ||
                c.university.toLowerCase().includes(lowercased)
            ).map(c => ({ id: c.id, name: c.name, sub: c.university, avatar: c.avatarUrl, icon: School }));
        }

        return [];
    }, [recipientType, entitySearchTerm]);

    return (
        <div className="space-y-6 animate-in fade-in-0">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold font-headline">İletişim ve Mesaj Merkezi</h1>
            </div>

            <Tabs defaultValue="broadcast">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="broadcast">
                        <Bell className="mr-2 h-4 w-4" /> Toplu Duyuru
                    </TabsTrigger>
                    <TabsTrigger value="individual">
                        <MessageSquare className="mr-2 h-4 w-4" /> Bireysel/Kurumsal Mesaj
                    </TabsTrigger>
                    <TabsTrigger value="monitor">
                        <History className="mr-2 h-4 w-4" /> Mesaj Trafiği İzle
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="broadcast" className="mt-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <Card className="lg:col-span-2">
                            <CardHeader>
                                <CardTitle>Yeni Toplu Duyuru Oluştur</CardTitle>
                                <CardDescription>Platformdaki tüm kullanıcılara veya belirli gruplara sistem mesajı gönderin.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Hedef Grup</Label>
                                    <Select>
                                        <SelectTrigger><SelectValue placeholder="Grup seçiniz..." /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Tüm Kullanıcılar</SelectItem>
                                            <SelectItem value="all-ngos">Tüm STK'lar</SelectItem>
                                            <SelectItem value="all-clubs">Tüm Kulüpler</SelectItem>
                                            <SelectItem value="all-brands">Tüm Markalar</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Duyuru Başlığı</Label>
                                    <Input placeholder="Önemli Bilgilendirme" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Mesaj İçeriği</Label>
                                    <Textarea rows={6} placeholder="Duyuru detaylarını buraya yazın..." />
                                </div>
                            </CardContent>
                            <CardFooter className="justify-end gap-2">
                                <Button variant="outline">Taslağı Kaydet</Button>
                                <Button onClick={() => toast({ title: "Duyuru Gönderildi", description: "Toplu bildirim kuyruğa alındı." })}>
                                    <Send className="mr-2 h-4 w-4" /> Duyuruyu Yayınla
                                </Button>
                            </CardFooter>
                        </Card>
                        <div className="space-y-6">
                            <Card className="bg-muted/30 border-none">
                                <CardHeader><CardTitle className="text-sm">Erişim İstatistikleri</CardTitle></CardHeader>
                                <CardContent className="space-y-4 text-xs">
                                    <div className="flex justify-between"><span>Toplam Abone:</span><span className="font-bold">14,234</span></div>
                                    <div className="flex justify-between"><span>Aktif STK:</span><span className="font-bold">128</span></div>
                                    <div className="flex justify-between"><span>Aktif Kulüp:</span><span className="font-bold">21</span></div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="individual" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Bireysel veya Kurumsal Özel Mesaj</CardTitle>
                            <CardDescription>Belirli bir kullanıcıya, STK'ya veya öğrenci kulübüne direkt mesaj gönderin.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="admin-recipient-type">Alıcı Türü</Label>
                                    <Select required onValueChange={(val) => { setRecipientType(val); setSelectedEntityId(null); setEntitySearchTerm(''); }}>
                                        <SelectTrigger id="admin-recipient-type">
                                            <SelectValue placeholder="Seçiniz..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="user">Kullanıcı</SelectItem>
                                            <SelectItem value="ngo">Sivil Toplum Kuruluşu (STK)</SelectItem>
                                            <SelectItem value="club">Öğrenci Kulübü</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {recipientType && (
                                    <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
                                        <Label>Alıcı Ara ve Seç</Label>
                                        <div className="relative">
                                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input 
                                                placeholder={recipientType === 'user' ? "İsim, @kullanıcı veya telefon..." : "İsim ile ara..."}
                                                className="pl-8"
                                                value={entitySearchTerm}
                                                onChange={(e) => setEntitySearchTerm(e.target.value)}
                                            />
                                        </div>
                                        <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-2">
                                            {filteredEntities.length > 0 ? filteredEntities.map(entity => {
                                                const Icon = entity.icon;
                                                return (
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
                                                        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                                                            <Icon className="h-2.5 w-2.5" /> {entity.sub} {entity.phone && `• ${entity.phone}`}
                                                        </p>
                                                    </div>
                                                    {selectedEntityId === entity.id && <div className="w-2 h-2 rounded-full bg-primary" />}
                                                </div>
                                            )}) : (
                                                <p className="text-center py-4 text-xs text-muted-foreground">Eşleşen alıcı bulunamadı.</p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Mesaj Konusu</Label>
                                    <Input placeholder="Resmi Bilgilendirme" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Mesaj İçeriği</Label>
                                    <Textarea rows={5} placeholder="İletmek istediğiniz mesajı yazın..." />
                                </div>
                                <Button 
                                    className="w-full" 
                                    disabled={!selectedEntityId}
                                    onClick={() => toast({ title: "Mesaj Gönderildi", description: "Özel mesaj alıcıya ulaştırıldı." })}
                                >
                                    <Send className="mr-2 h-4 w-4" /> Mesajı Gönder
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="monitor" className="mt-6">
                    <Card>
                        <CardHeader>
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <CardTitle>Mesaj Trafiği Logları</CardTitle>
                                    <CardDescription>Platformda gerçekleşen tüm iletişim hareketlerini denetleyin.</CardDescription>
                                </div>
                                <div className="relative w-full md:w-64">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input 
                                        placeholder="Loglarda ara..." 
                                        className="pl-8 h-9"
                                        value={logSearchTerm}
                                        onChange={(e) => setLogSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border overflow-hidden">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/50">
                                            <TableHead>Gönderen</TableHead>
                                            <TableHead>Alıcı</TableHead>
                                            <TableHead>Konu</TableHead>
                                            <TableHead>Tür</TableHead>
                                            <TableHead className="text-right">Tarih</TableHead>
                                            <TableHead className="w-[50px]"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredLog.length > 0 ? filteredLog.map((log) => (
                                            <TableRow key={log.id}>
                                                <TableCell className="font-medium text-sm">{log.sender}</TableCell>
                                                <TableCell className="text-sm">{log.recipient}</TableCell>
                                                <TableCell className="max-w-[200px] truncate text-sm">{log.subject}</TableCell>
                                                <TableCell>
                                                    <Badge variant={log.type === 'broadcast' ? 'default' : 'secondary'} className="text-[10px]">
                                                        {log.type === 'broadcast' ? 'Toplu' : 'Özel'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right text-xs text-muted-foreground">{log.timestamp}</TableCell>
                                                <TableCell>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toast({ title: "Mesaj İçeriği", description: "Denetleme için mesaj içeriği burada açılır." })}>
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        )) : (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Log kaydı bulunamadı.</TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
