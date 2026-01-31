
'use client';

import React, { useState } from 'react';
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
import { Search, Send, Bell, Mail, Eye, ShieldAlert, History, MessageSquare, Users, Building, School } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

// Mock message log for admin
const initialMessageLog = [
    { id: 'l1', sender: 'Ahbap Derneği', recipient: 'İsmail Hilmi', timestamp: '2024-07-22 14:20', subject: 'Başvuru Onayı', type: 'direct' },
    { id: 'l2', sender: 'Sistem Admin', recipient: 'Tüm Kullanıcılar', timestamp: '2024-07-22 10:00', subject: 'Bakım Çalışması', type: 'broadcast' },
    { id: 'l3', sender: 'İTÜ Girişimcilik', recipient: 'Zeynep Kaya', timestamp: '2024-07-21 18:45', subject: 'Kulüp Toplantısı', type: 'direct' },
];

export default function CommunicationsPage() {
    const { toast } = useToast();
    const [messageLog, setMessageLog] = useState(initialMessageLog);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredLog = messageLog.filter(l => 
        l.sender.toLowerCase().includes(searchTerm.toLowerCase()) || 
        l.recipient.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.subject.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                        <MessageSquare className="mr-2 h-4 w-4" /> Bireysel/Grup Mesaj
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
                                <CardDescription>Platformdaki tüm kullanıcılara veya kurumlara bildirim gönderin.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Hedef Kitle</Label>
                                    <Select>
                                        <SelectTrigger><SelectValue placeholder="Seçiniz..." /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Tüm Kullanıcılar</SelectItem>
                                            <SelectItem value="ngos">Tüm STK'lar</SelectItem>
                                            <SelectItem value="clubs">Tüm Kulüpler</SelectItem>
                                            <SelectItem value="brands">Tüm Markalar</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Duyuru Başlığı</Label>
                                    <Input placeholder="Önemli Güncelleme Hakkında" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Mesaj İçeriği</Label>
                                    <Textarea rows={6} placeholder="Duyuru detaylarını buraya yazın..." />
                                </div>
                                <div className="flex items-center space-x-2 pt-2">
                                    <Label className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <ShieldAlert className="h-3 w-3" /> Bu işlem geri alınamaz ve tüm hedef kitleye anlık bildirim gider.
                                    </Label>
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
                            <Card>
                                <CardHeader><CardTitle className="text-sm">İstatistikler</CardTitle></CardHeader>
                                <CardContent className="space-y-4 text-xs">
                                    <div className="flex justify-between"><span>Toplam Abone:</span><span className="font-bold">14,234</span></div>
                                    <div className="flex justify-between"><span>E-posta İzinli:</span><span className="font-bold">12,100</span></div>
                                    <div className="flex justify-between"><span>Push İzinli:</span><span className="font-bold">8,540</span></div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="individual" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Bireysel veya Kurumsal Özel Mesaj</CardTitle>
                            <CardDescription>Belirli bir kullanıcıya veya kuruma direkt mesaj gönderin.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Alıcı Türü</Label>
                                    <Select>
                                        <SelectTrigger><SelectValue placeholder="Seçiniz..." /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="user">Kullanıcı</SelectItem>
                                            <SelectItem value="ngo">STK</SelectItem>
                                            <SelectItem value="club">Kulüp</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Alıcı Ara</Label>
                                    <div className="relative">
                                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input placeholder="İsim veya ID ile ara..." className="pl-8" />
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Konu</Label>
                                <Input placeholder="Bilgilendirme" />
                            </div>
                            <div className="space-y-2">
                                <Label>Mesaj</Label>
                                <Textarea rows={4} placeholder="Mesajınızı yazın..." />
                            </div>
                            <Button className="w-full" onClick={() => toast({ title: "Mesaj Gönderildi" })}>
                                <Send className="mr-2 h-4 w-4" /> Mesajı Gönder
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="monitor" className="mt-6">
                    <Card>
                        <CardHeader>
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <CardTitle>Mesaj Trafiği Logları</CardTitle>
                                    <CardDescription>Platformda gerçekleşen tüm iletişim hareketlerini izleyin.</CardDescription>
                                </div>
                                <div className="relative w-full md:w-64">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input 
                                        placeholder="Loglarda ara..." 
                                        className="pl-8 h-9"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
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
                                                <TableCell className="font-medium">{log.sender}</TableCell>
                                                <TableCell>{log.recipient}</TableCell>
                                                <TableCell className="max-w-[200px] truncate">{log.subject}</TableCell>
                                                <TableCell>
                                                    <Badge variant={log.type === 'broadcast' ? 'default' : 'secondary'}>
                                                        {log.type === 'broadcast' ? 'Toplu' : 'Özel'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right text-xs text-muted-foreground">{log.timestamp}</TableCell>
                                                <TableCell>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toast({ title: "Mesaj İçeriği", description: "Admin denetimi için mesaj detayları burada açılır." })}>
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
