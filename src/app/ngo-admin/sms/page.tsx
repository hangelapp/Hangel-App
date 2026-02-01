
'use client';

import React, { useState, useMemo, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Send, Upload, History, Users, MessageSquare, Sparkles, AlertCircle, FileText, CheckCircle2, ShieldAlert } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const pastSmsLogs = [
    { id: 'sms1', title: 'Haftalık Bilgilendirme', recipient: 'Aktif Gönüllüler', date: '2024-07-20 10:30', count: 150, status: 'Gönderildi' },
    { id: 'sms2', title: 'Acil Yardım Çağrısı', recipient: 'Tüm Bağışçılar', date: '2024-07-15 14:20', count: 2500, status: 'Gönderildi' },
    { id: 'sms3', title: 'Toplantı Hatırlatması', recipient: 'Yüklenen Liste', date: '2024-07-10 09:00', count: 45, status: 'Gönderildi' },
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

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setUploadedFile(file);
            toast({
                title: "Liste Yüklendi",
                description: `"${file.name}" dosyası başarıyla yüklendi.`,
            });
        }
    };

    const handleSendSms = (e: React.FormEvent) => {
        e.preventDefault();
        if (!recipientType || !smsContent) {
            toast({
                variant: "destructive",
                title: "Eksik Bilgi",
                description: "Lütfen alıcı grubunu ve mesaj içeriğini doldurun.",
            });
            return;
        }

        setIsLoading(true);
        setTimeout(() => {
            toast({
                title: "SMS Gönderildi",
                description: "Mesajınız kuyruğa alındı ve gönderilmeye başlandı.",
            });
            setIsLoading(false);
            setSmsContent('');
            setRecipientType('');
            setUploadedFile(null);
        }, 2000);
    };

    return (
        <div className="space-y-6 animate-in fade-in-0 max-w-5xl mx-auto p-4 sm:p-6">
            <div className="flex items-center gap-2">
                <Button onClick={() => router.back()} variant="ghost" size="icon" className="-ml-2">
                    <ArrowLeft className="h-6 w-6" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold font-headline">SMS Gönderimi</h1>
                    <p className="text-muted-foreground text-sm">Gönüllülerinize ve bağışçılarınıza anlık SMS bildirimleri gönderin.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <Tabs defaultValue="new-sms">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="new-sms">
                                <Send className="mr-2 h-4 w-4" /> Yeni SMS
                            </TabsTrigger>
                            <TabsTrigger value="history">
                                <History className="mr-2 h-4 w-4" /> Gönderim Geçmişi
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="new-sms" className="mt-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Mesaj Detayları</CardTitle>
                                    <CardDescription>Hedef kitlenizi seçin ve mesajınızı oluşturun.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <form id="sms-form" onSubmit={handleSendSms} className="space-y-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="recipient-group">Alıcı Grubu</Label>
                                            <Select required onValueChange={setRecipientType} value={recipientType}>
                                                <SelectTrigger id="recipient-group">
                                                    <SelectValue placeholder="Alıcı grubunu seçin..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="volunteers">Aktif Gönüllülerim</SelectItem>
                                                    <SelectItem value="donors">Tüm Bağışçılarım</SelectItem>
                                                    <SelectItem value="custom-list">Yeni Liste Yükle (Excel/CSV)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {recipientType === 'custom-list' && (
                                            <div 
                                                className="border-2 border-dashed rounded-lg p-8 text-center space-y-4 hover:bg-accent transition-colors cursor-pointer"
                                                onClick={() => fileInputRef.current?.click()}
                                            >
                                                <input 
                                                    type="file" 
                                                    ref={fileInputRef} 
                                                    className="hidden" 
                                                    accept=".xlsx, .xls, .csv" 
                                                    onChange={handleFileChange}
                                                />
                                                <div className="flex flex-col items-center">
                                                    <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                                                    {uploadedFile ? (
                                                        <div className="flex items-center gap-2 text-primary font-medium">
                                                            <FileText className="h-4 w-4" />
                                                            {uploadedFile.name}
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <p className="font-semibold">Dosya yüklemek için tıklayın</p>
                                                            <p className="text-xs text-muted-foreground mt-1">Sadece .xlsx, .xls veya .csv formatları desteklenir.</p>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <Label htmlFor="sms-message">Mesaj İçeriği</Label>
                                                <span className={cn(
                                                    "text-[10px] font-bold uppercase",
                                                    smsContent.length > SMS_LIMIT ? "text-destructive" : "text-muted-foreground"
                                                )}>
                                                    {smsContent.length} / {SMS_LIMIT} Karakter
                                                </span>
                                            </div>
                                            <div className="relative">
                                                <Textarea 
                                                    id="sms-message" 
                                                    placeholder="Mesajınızı buraya yazın..." 
                                                    rows={6} 
                                                    required 
                                                    maxLength={320}
                                                    value={smsContent}
                                                    onChange={(e) => setSmsContent(e.target.value)}
                                                />
                                                <Button 
                                                    type="button" 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    className="absolute bottom-2 right-2 text-primary text-xs flex items-center gap-1"
                                                    onClick={() => toast({ title: "Yapay zeka önerisi yakında burada olacak!" })}
                                                >
                                                    <Sparkles className="h-3 w-3" /> AI Taslak
                                                </Button>
                                            </div>
                                            <p className="text-[10px] text-muted-foreground">Not: Türkçe karakterler ve özel semboller karakter sayısını etkileyebilir.</p>
                                        </div>
                                    </form>
                                </CardContent>
                                <CardFooter className="flex justify-end gap-3 border-t pt-6 bg-muted/10">
                                    <Button variant="outline" type="button" onClick={() => { setSmsContent(''); setRecipientType(''); setUploadedFile(null); }}>Temizle</Button>
                                    <Button type="submit" form="sms-form" disabled={isLoading || (recipientType === 'custom-list' && !uploadedFile)} className="px-8">
                                        {isLoading ? "Gönderiliyor..." : (
                                            <>
                                                <Send className="mr-2 h-4 w-4" /> Hemen Gönder
                                            </>
                                        )}
                                    </Button>
                                </CardFooter>
                            </Card>
                        </TabsContent>

                        <TabsContent value="history" className="mt-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Gönderim Kayıtları</CardTitle>
                                    <CardDescription>Son gönderilen SMS kampanyalarınız.</CardDescription>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="divide-y">
                                        {pastSmsLogs.map(log => (
                                            <div key={log.id} className="p-4 flex items-center justify-between hover:bg-accent/30 transition-colors">
                                                <div className="space-y-1">
                                                    <p className="font-bold text-sm">{log.title}</p>
                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                        <Users className="h-3 w-3" /> {log.recipient} • {log.count} Alıcı
                                                    </div>
                                                    <p className="text-[10px] text-muted-foreground">{log.date}</p>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">
                                                        <CheckCircle2 className="h-3 w-3 mr-1" /> {log.status}
                                                    </Badge>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <ArrowLeft className="h-4 w-4 rotate-180" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>

                <div className="space-y-6">
                    <Card className="bg-primary/5 border-primary/10">
                        <CardHeader>
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <MessageSquare className="h-4 w-4 text-primary" /> SMS Bakiyesi
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="text-center py-4 border rounded-xl bg-background shadow-inner">
                                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Kalan Kredi</p>
                                <p className="text-4xl font-black text-primary">1,450</p>
                            </div>
                            <Button variant="outline" className="w-full text-xs" onClick={() => toast({ title: "Kredi Yükleme", description: "Kredi yükleme talebiniz alınmıştır." })}>
                                Kredi Yükleme Talebi Oluştur
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <AlertCircle className="h-4 w-4 text-muted-foreground" /> Önemli Hatırlatmalar
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="text-xs space-y-4 text-muted-foreground leading-relaxed">
                            <p>● Mesajlarınızda kurum isminizin yer alması güvenilirlik açısından önemlidir.</p>
                            <p>● Gece 22:00 ile sabah 09:00 saatleri arasında bilgilendirme SMS'i gönderilmesi tavsiye edilmez.</p>
                            <p>● Kişisel Verilerin Korunması Kanunu (KVKK) gereği, sadece onaylı listelere gönderim yapmalısınız.</p>
                        </CardContent>
                    </Card>

                    <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 flex items-start gap-3">
                        <ShieldAlert className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                        <p className="text-[10px] text-amber-800 leading-tight">
                            SMS gönderimleri yasal denetime tabidir. Nefret söylemi, siyasi propaganda veya yanıltıcı içerik tespiti durumunda üyelik askıya alınır.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
