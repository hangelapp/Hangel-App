'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Globe, Palette, BarChart3, Settings2, Code, ShieldCheck, ArrowLeft, Languages, CheckCircle2 } from 'lucide-react';
import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const analyticsProviders = [
    { id: 'google-analytics', name: 'Google Analytics', logo: 'GA', color: 'bg-[#f9ab00]', status: 'Bağlı' },
    { id: 'meta-pixel', name: 'Meta Pixel', logo: 'MP', color: 'bg-[#0668E1]', status: 'Bağlanabilir' },
    { id: 'hotjar', name: 'Hotjar', logo: 'HJ', color: 'bg-[#ff1c1c]', status: 'Bağlanabilir' },
    { id: 'yandex-metrica', name: 'Yandex Metrica', logo: 'YM', color: 'bg-[#ff0000]', status: 'Bağlanabilir' },
];

export default function WebsiteBuilderPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [primaryColor, setPrimaryColor] = useState('#f34723');

    return (
        <div className="space-y-6 animate-in fade-in-0 max-w-5xl mx-auto p-4 sm:p-6">
            <div className="flex items-center gap-2">
                <Button onClick={() => router.back()} variant="ghost" size="icon" className="-ml-2">
                    <ArrowLeft className="h-6 w-6" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold font-headline">Web Sitesi Yönetimi</h1>
                    <p className="text-muted-foreground text-sm">Kurumsal kimliğinizi ve harici scriptlerinizi yönetin.</p>
                </div>
            </div>

            <Tabs defaultValue="integration">
                <TabsList className="grid w-full grid-cols-3 max-w-lg">
                    <TabsTrigger value="integration"><Code className="mr-2 h-4 w-4" /> Script & Analiz</TabsTrigger>
                    <TabsTrigger value="design"><Palette className="mr-2 h-4 w-4" /> Tasarım</TabsTrigger>
                    <TabsTrigger value="domain"><Globe className="mr-2 h-4 w-4" /> Domain</TabsTrigger>
                </TabsList>

                <TabsContent value="integration" className="mt-6 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {analyticsProviders.map((ap) => (
                            <Card key={ap.id} className="hover:border-primary transition-colors cursor-pointer group">
                                <CardContent className="p-4 flex flex-col items-center text-center space-y-3">
                                    <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg", ap.color)}>
                                        {ap.logo}
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm">{ap.name}</p>
                                        <Badge variant={ap.status === 'Bağlı' ? 'default' : 'secondary'} className="text-[10px] mt-1">
                                            {ap.status}
                                        </Badge>
                                    </div>
                                    <Button variant="outline" size="sm" className="w-full">Bağla</Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Özel Script Entegrasyonu (GTM, Pixel, vb.)</CardTitle>
                            <CardDescription>Sitenizin &lt;head&gt; bölümüne eklenecek kodları buraya girin.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Tracking ID / Tag ID</Label>
                                <Input placeholder="G-XXXXXXXXXX" />
                            </div>
                            <div className="p-4 border rounded-xl bg-muted/20">
                                <Label className="text-xs uppercase font-bold text-muted-foreground mb-2 block">Özel HTML / Script</Label>
                                <textarea className="w-full h-32 bg-background font-mono text-xs p-3 border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary" placeholder="<!-- Script buraya gelecek -->"></textarea>
                            </div>
                            <Button onClick={() => toast({title: "Scriptler Kaydedildi"})}>Sitede Aktifleştir</Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="design" className="mt-6 space-y-6">
                    <Card>
                        <CardHeader><CardTitle>Görsel Kimlik</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Ana Renk</Label>
                                <div className="flex gap-2">
                                    <Input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} className="w-16 h-10 p-1" />
                                    <Input value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} className="font-mono" />
                                </div>
                            </div>
                            <Button onClick={() => toast({title: "Tasarım Kaydedildi"})}>Kaydet</Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="domain" className="mt-6 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Özel Domain Bağla</CardTitle>
                            <CardDescription>Kendi alan adınızı STK web sitenize bağlayın.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Domain Adınız</Label>
                                <Input placeholder="kurumunuz.org" />
                            </div>
                            <Button variant="outline" onClick={() => toast({title: "DNS Kontrol Ediliyor", description: "Alan adınızın DNS kayıtları sorgulanıyor."})}>DNS Kayıtlarını Doğrula</Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">DNS Kayıt Bilgileri</CardTitle>
                            <CardDescription>Alan adı yönetim panelinizde (GoDaddy, Namecheap, vb.) aşağıdaki kayıtları oluşturmanız gerekmektedir.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="rounded-lg border overflow-hidden">
                                <table className="w-full text-xs text-left">
                                    <thead className="bg-muted">
                                        <tr>
                                            <th className="p-2 border-b">Tür</th>
                                            <th className="p-2 border-b">İsim (Host)</th>
                                            <th className="p-2 border-b">Değer (Value)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        <tr>
                                            <td className="p-2 font-mono">A</td>
                                            <td className="p-2 font-mono">@</td>
                                            <td className="p-2 font-mono text-primary">34.102.136.180</td>
                                        </tr>
                                        <tr>
                                            <td className="p-2 font-mono">CNAME</td>
                                            <td className="p-2 font-mono">www</td>
                                            <td className="p-2 font-mono text-primary">sites.hangel.org</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            <div className="p-4 border rounded-xl bg-blue-50 text-blue-800 text-[10px] flex items-center gap-3">
                                <ShieldCheck className="h-5 w-5 shrink-0" />
                                <p>DNS değişikliklerinin yayılması 24-48 saat sürebilir. Kayıtlar doğrulandıktan sonra SSL sertifikanız otomatik olarak aktif edilecektir.</p>
                            </div>
                        </CardContent>
                        <CardFooter className="bg-muted/20 border-t p-6 flex flex-col gap-4">
                            <div className="w-full text-center space-y-4">
                                <h3 className="font-bold text-foreground">Web Siteniz Yayınlanmaya Hazır</h3>
                                <p className="text-xs text-muted-foreground">Profil bilgileriniz, güncel gönderileriniz ve gönüllülük ilanlarınız otomatik olarak senkronize edilir.</p>
                                <Button 
                                    size="lg"
                                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold shadow-lg shadow-green-600/20"
                                    onClick={() => {
                                        toast({ title: "Siteniz Yayınlandı!", description: "Yönlendiriliyorsunuz..." });
                                        window.open('/ngo-admin/website/preview', '_blank');
                                    }}
                                >
                                    Siteyi Yayınla ve Görüntüle
                                </Button>
                            </div>
                        </CardFooter>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
