'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Send, Mail, Users, Sparkles, Layout, History, CheckCircle2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';

export default function MailManagementPage() {
    const { toast } = useToast();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setTimeout(() => {
            toast({ title: "Kampanya Başlatıldı", description: "Mailleriniz gönderim kuyruğuna alındı." });
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
                    <h1 className="text-2xl font-bold font-headline">Mail Gönderimi</h1>
                    <p className="text-muted-foreground text-sm">Topluluğunuza profesyonel bültenler ve duyurular gönderin.</p>
                </div>
            </div>

            <Tabs defaultValue="new-mail">
                <TabsList className="grid w-full grid-cols-2 max-w-md">
                    <TabsTrigger value="new-mail"><Mail className="mr-2 h-4 w-4" /> Yeni Kampanya</TabsTrigger>
                    <TabsTrigger value="history"><History className="mr-2 h-4 w-4" /> Gönderim Geçmişi</TabsTrigger>
                </TabsList>

                <TabsContent value="new-mail" className="mt-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2">
                            <Card>
                                <CardHeader>
                                    <CardTitle>E-Posta Hazırla</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <form id="mail-form" onSubmit={handleSend} className="space-y-6">
                                        <div className="space-y-2">
                                            <Label>Alıcı Grubu</Label>
                                            <Select required>
                                                <SelectTrigger><SelectValue placeholder="Grup seçin..." /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">Tüm Kayıtlı Kullanıcılar</SelectItem>
                                                    <SelectItem value="volunteers">Aktif Gönüllüler</SelectItem>
                                                    <SelectItem value="donors">Düzenli Bağışçılar</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Konu Başlığı (Subject)</Label>
                                            <Input placeholder="Örn: Temmuz Ayı Bültenimiz Yayında!" required />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Mesaj İçeriği</Label>
                                            <Textarea rows={12} placeholder="Mail içeriğini buraya HTML veya metin olarak yazın..." required />
                                        </div>
                                    </form>
                                </CardContent>
                                <CardFooter className="justify-end gap-3 border-t pt-6">
                                    <Button variant="outline">Taslağı Kaydet</Button>
                                    <Button type="submit" form="mail-form" disabled={isLoading}>
                                        {isLoading ? "Gönderiliyor..." : <><Send className="mr-2 h-4 w-4" /> Gönderimi Başlat</>}
                                    </Button>
                                </CardFooter>
                            </Card>
                        </div>
                        <div className="space-y-6">
                            <Card className="bg-primary/5">
                                <CardHeader><CardTitle className="text-sm font-bold flex items-center gap-2"><Layout className="h-4 w-4" /> Şablonlar</CardTitle></CardHeader>
                                <CardContent className="space-y-2">
                                    <Button variant="outline" className="w-full text-xs justify-start">Aylık Bülten Şablonu</Button>
                                    <Button variant="outline" className="w-full text-xs justify-start">Acil Yardım Çağrısı</Button>
                                    <Button variant="outline" className="w-full text-xs justify-start">Etkinlik Davetiyesi</Button>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader><CardTitle className="text-sm font-bold flex items-center gap-2"><Sparkles className="h-4 w-4" /> AI Asistan</CardTitle></CardHeader>
                                <CardContent>
                                    <p className="text-xs text-muted-foreground">Mail içeriğinizi optimize etmek veya başlık önerileri almak için AI asistanı kullanın.</p>
                                    <Button variant="secondary" size="sm" className="w-full mt-4">AI ile İçerik Üret</Button>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="history" className="mt-6">
                    <Card>
                        <CardHeader><CardTitle>Geçmiş Kampanyalar</CardTitle></CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y">
                                {[
                                    { title: 'Haziran Bülteni', recipients: '12,450', date: '15.06.2024', open: '45%' },
                                    { title: 'Deprem Yardımı Bilgilendirme', recipients: '45,000', date: '10.06.2024', open: '68%' }
                                ].map((mail, i) => (
                                    <div key={i} className="p-4 flex items-center justify-between">
                                        <div>
                                            <p className="font-bold text-sm">{mail.title}</p>
                                            <p className="text-xs text-muted-foreground">{mail.date} • {mail.recipients} Alıcı</p>
                                        </div>
                                        <div className="text-right">
                                            <Badge variant="outline" className="bg-green-50 text-green-700">Açılma: {mail.open}</Badge>
                                        </div>
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
