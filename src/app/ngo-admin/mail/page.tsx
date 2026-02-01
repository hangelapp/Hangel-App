'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Send, Mail, History, Settings2, ShieldCheck, MailCheck, KeyRound } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

const mailProviders = [
    { id: 'sendgrid', name: 'SendGrid', logo: 'S', color: 'bg-blue-500', status: 'Bağlı' },
    { id: 'mailchimp', name: 'Mailchimp', logo: 'M', color: 'bg-yellow-500', status: 'Bağlanabilir' },
    { id: 'aws-ses', name: 'Amazon SES', logo: 'A', color: 'bg-orange-600', status: 'Bağlanabilir' },
    { id: 'smtp', name: 'Özel SMTP', logo: 'P', color: 'bg-slate-600', status: 'Bağlanabilir' },
];

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

            <Tabs defaultValue="integration">
                <TabsList className="grid w-full grid-cols-3 max-w-lg">
                    <TabsTrigger value="integration"><Settings2 className="mr-2 h-4 w-4" /> Servis Bağla</TabsTrigger>
                    <TabsTrigger value="new-mail"><Mail className="mr-2 h-4 w-4" /> Yeni Bülten</TabsTrigger>
                    <TabsTrigger value="history"><History className="mr-2 h-4 w-4" /> Gönderimler</TabsTrigger>
                </TabsList>

                <TabsContent value="integration" className="mt-6 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {mailProviders.map((provider) => (
                            <Card key={provider.id} className="hover:border-primary transition-colors cursor-pointer group">
                                <CardContent className="p-4 flex flex-col items-center text-center space-y-3">
                                    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg", provider.color)}>
                                        {provider.logo}
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm">{provider.name}</p>
                                        <Badge variant={provider.status === 'Bağlı' ? 'default' : 'secondary'} className="text-[10px] mt-1">
                                            {provider.status}
                                        </Badge>
                                    </div>
                                    <Button variant="outline" size="sm" className="w-full">Ayarlar</Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2"><KeyRound className="h-5 w-5 text-primary"/> API & SMTP Ayarları</CardTitle>
                            <CardDescription>Toplu mail gönderimi için kullandığınız servisin bilgilerini girin.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>API Key / Kullanıcı Adı</Label>
                                    <Input placeholder="SG.xxxxxxxxxxxx" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Gönderen Adı</Label>
                                    <Input placeholder="Ahbap Bilgilendirme" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Gönderen E-Posta Adresi</Label>
                                <Input placeholder="bulten@kurum.org" />
                            </div>
                            <div className="p-4 border rounded-xl bg-green-50 text-green-800 text-xs flex items-center gap-3">
                                <MailCheck className="h-5 w-5 shrink-0" />
                                <p>SPF ve DKIM kayıtlarınızın doğrulanmış olması, gönderilerinizin spam klasörüne düşmesini engeller.</p>
                            </div>
                        </CardContent>
                        <CardFooter className="bg-muted/30 border-t p-4 flex justify-end">
                            <Button onClick={() => toast({title: "Mail Ayarları Kaydedildi"})}>Entegrasyonu Kaydet</Button>
                        </CardFooter>
                    </Card>
                </TabsContent>

                <TabsContent value="new-mail" className="mt-6">
                    <Card>
                        <CardHeader><CardTitle>İçerik Hazırla</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Konu Başlığı</Label>
                                <Input placeholder="Ayın Sosyal Etki Özeti" />
                            </div>
                            <div className="space-y-2">
                                <Label>E-posta İçeriği (HTML Destekli)</Label>
                                <Textarea rows={10} placeholder="E-posta içeriğinizi buraya yazın veya bir şablon seçin..." />
                            </div>
                            <Button className="w-full" onClick={handleSend} disabled={isLoading}>Gönderimi Başlat</Button>
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
                                    { title: 'Acil Yardım Bilgilendirme', recipients: '45,000', date: '10.06.2024', open: '68%' }
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
