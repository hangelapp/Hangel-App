'use client';

import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Send, Upload, History, Users, MessageSquare, Sparkles, AlertCircle, FileText, CheckCircle2, ShieldAlert, Settings2, KeyRound } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const pastSmsLogs = [
    { id: 'sms1', title: 'Haftalık Bilgilendirme', recipient: 'Aktif Gönüllüler', date: '2024-07-20 10:30', count: 150, status: 'Gönderildi' },
    { id: 'sms2', title: 'Acil Yardım Çağrısı', recipient: 'Tüm Bağışçılar', date: '2024-07-15 14:20', count: 2500, status: 'Gönderildi' },
];

export default function SmsSendingPage() {
    const { toast } = useToast();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [recipientType, setRecipientType] = useState<string>('');
    const [smsContent, setSmsContent] = useState('');
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const SMS_LIMIT = 160;

    const handleSendSms = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setTimeout(() => {
            toast({ title: "SMS Gönderildi", description: "Mesajınız kuyruğa alındı." });
            setIsLoading(false);
        }, 2000);
    };

    return (
        <div className="space-y-6 animate-in fade-in-0 max-w-5xl mx-auto p-4 sm:p-6">
            <div className="flex items-center gap-2">
                <Button onClick={() => router.back()} variant="ghost" size="icon" className="-ml-2">
                    <ArrowLeft className="h-6 w-6" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold font-headline">SMS Yönetimi & Entegrasyon</h1>
                    <p className="text-muted-foreground text-sm">Üçüncü parti servislerle entegre SMS gönderimi.</p>
                </div>
            </div>

            <Tabs defaultValue="new-sms">
                <TabsList className="grid w-full grid-cols-3 max-w-lg">
                    <TabsTrigger value="new-sms"><Send className="mr-2 h-4 w-4" /> Yeni SMS</TabsTrigger>
                    <TabsTrigger value="history"><History className="mr-2 h-4 w-4" /> Geçmiş</TabsTrigger>
                    <TabsTrigger value="integration"><Settings2 className="mr-2 h-4 w-4" /> API Ayarları</TabsTrigger>
                </TabsList>

                <TabsContent value="new-sms" className="mt-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Mesaj Oluştur</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="space-y-2">
                                        <Label>Alıcı Grubu</Label>
                                        <Select onValueChange={setRecipientType}>
                                            <SelectTrigger><SelectValue placeholder="Seçiniz..." /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="volunteers">Gönüllüler</SelectItem>
                                                <SelectItem value="donors">Bağışçılar</SelectItem>
                                                <SelectItem value="custom">Özel Liste Yükle</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between"><Label>Mesaj</Label><span className="text-[10px]">{smsContent.length}/{SMS_LIMIT}</span></div>
                                        <Textarea rows={5} value={smsContent} onChange={(e) => setSmsContent(e.target.value)} placeholder="Mesajınızı buraya yazın..." />
                                    </div>
                                    <Button className="w-full" onClick={handleSendSms} disabled={isLoading}>Gönder</Button>
                                </CardContent>
                            </Card>
                        </div>
                        <Card className="bg-muted/30">
                            <CardHeader><CardTitle className="text-sm font-bold">Aktif Servis</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="p-3 border rounded-lg bg-background flex items-center gap-3">
                                    <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center font-bold text-primary text-xs">API</div>
                                    <div className="text-xs">
                                        <p className="font-bold">Netgsm Entegrasyonu</p>
                                        <p className="text-green-600">Bağlantı Aktif</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="integration" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Servis Sağlayıcı Bağlantısı</CardTitle>
                            <CardDescription>SMS gönderimi yapmak için kullandığınız şirketin API bilgilerini girin.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label>Servis Sağlayıcı</Label>
                                <Select defaultValue="netgsm">
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="netgsm">Netgsm</SelectItem>
                                        <SelectItem value="iletimerkezi">İleti Merkezi</SelectItem>
                                        <SelectItem value="mutlucell">MutluCell</SelectItem>
                                        <SelectItem value="twilio">Twilio (Global)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>API Key / Kullanıcı Adı</Label>
                                    <Input placeholder="API Anahtarınızı girin" />
                                </div>
                                <div className="space-y-2">
                                    <Label>API Secret / Şifre</Label>
                                    <Input type="password" placeholder="••••••••" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Gönderen Başlığı (Alpha Numeric ID)</Label>
                                <Input placeholder="AHBAP, TEMA vb." />
                                <p className="text-[10px] text-muted-foreground">Operatör tarafından onaylanmış başlığınızı girin.</p>
                            </div>
                            <Button onClick={() => toast({title: "Entegrasyon Kaydedildi"})}>Ayarları Kaydet</Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="history" className="mt-6">
                    <Card>
                        <CardHeader><CardTitle>Gönderim Kayıtları</CardTitle></CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y">
                                {pastSmsLogs.map(log => (
                                    <div key={log.id} className="p-4 flex items-center justify-between">
                                        <div className="space-y-1">
                                            <p className="font-bold text-sm">{log.title}</p>
                                            <p className="text-xs text-muted-foreground">{log.date} • {log.count} Alıcı</p>
                                        </div>
                                        <Badge variant="outline" className="bg-green-50 text-green-700">{log.status}</Badge>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
