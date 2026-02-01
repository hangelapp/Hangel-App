'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Send, Mail, Users, Sparkles, Layout, History, Settings2, Globe, MailCheck } from 'lucide-react';
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
            toast({ title: "Kampanya Başlatıldı", description: "Mailler gönderim kuyruğuna alındı." });
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
                    <h1 className="text-2xl font-bold font-headline">E-Bülten & Mail Yönetimi</h1>
                    <p className="text-muted-foreground text-sm">Topluluğunuza profesyonel e-postalar gönderin.</p>
                </div>
            </div>

            <Tabs defaultValue="new-mail">
                <TabsList className="grid w-full grid-cols-3 max-w-lg">
                    <TabsTrigger value="new-mail"><Mail className="mr-2 h-4 w-4" /> Yeni Bülten</TabsTrigger>
                    <TabsTrigger value="history"><History className="mr-2 h-4 w-4" /> Gönderimler</TabsTrigger>
                    <TabsTrigger value="integration"><Settings2 className="mr-2 h-4 w-4" /> Entegrasyon</TabsTrigger>
                </TabsList>

                <TabsContent value="new-mail" className="mt-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-6">
                            <Card>
                                <CardHeader><CardTitle>İçerik Hazırla</CardTitle></CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Konu Başlığı</Label>
                                        <Input placeholder="Ayın Sosyal Etki Özeti" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Mesaj (HTML Destekli)</Label>
                                        <Textarea rows={10} placeholder="E-posta içeriğinizi buraya yazın..." />
                                    </div>
                                    <Button className="w-full" onClick={handleSend} disabled={isLoading}>Gönderimi Başlat</Button>
                                </CardContent>
                            </Card>
                        </div>
                        <div className="space-y-6">
                            <Card className="bg-primary/5">
                                <CardHeader><CardTitle className="text-sm">Hızlı Şablonlar</CardTitle></CardHeader>
                                <CardContent className="space-y-2">
                                    <Button variant="outline" className="w-full text-xs justify-start">Gönüllü Çağrısı</Button>
                                    <Button variant="outline" className="w-full text-xs justify-start">Bağış Teşekkür</Button>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="integration" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>E-Posta Servis Sağlayıcı Ayarları</CardTitle>
                            <CardDescription>Toplu mail gönderimi için kullandığınız servisi bağlayın.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label>Servis Seçin</Label>
                                <Select defaultValue="sendgrid">
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="sendgrid">SendGrid</SelectItem>
                                        <SelectItem value="mailchimp">Mailchimp</SelectItem>
                                        <SelectItem value="aws-ses">Amazon SES</SelectItem>
                                        <SelectItem value="smtp">Özel SMTP</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>API Key / Bağlantı Kodu</Label>
                                <Input type="password" placeholder="SG.xxxxxxxxxxxx" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Gönderen Adı</Label>
                                    <Input placeholder="Ahbap Bilgilendirme" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Gönderen E-Posta</Label>
                                    <Input placeholder="bulten@kurum.org" />
                                </div>
                            </div>
                            <div className="p-4 border rounded-lg bg-green-50 text-green-800 text-xs flex items-center gap-3">
                                <MailCheck className="h-5 w-5" />
                                <p>Kurumsal e-posta adresinizin (SPF/DKIM) doğrulanmış olması, maillerin spam kutusuna düşmesini engeller.</p>
                            </div>
                            <Button onClick={() => toast({title: "Mail Ayarları Kaydedildi"})}>Entegrasyonu Kaydet</Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="history" className="mt-6">
                    <Card>
                        <CardHeader><CardTitle>Gönderim Kayıtları</CardTitle></CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y">
                                {[
                                    { title: 'Haziran Bülteni', recipients: '12,450', date: '15.06.2024', open: '45%' },
                                    { title: 'Deprem Yardımı Bilgilendirme', recipients: '45,000', date: '10.06.2024', open: '68%' }
                                ].map((mail, i) => (
                                    <div key={i} className="p-4 flex items-center justify-between">
                                        <div>
                                            <p className="font-bold text-sm">{mail.title}</p>
                                            <p className="text-[10px] text-muted-foreground">{mail.date} • {mail.recipients} Alıcı</p>
                                        </div>
                                        <Badge variant="outline" className="bg-green-50 text-green-700">Açılma: {mail.open}</Badge>
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
