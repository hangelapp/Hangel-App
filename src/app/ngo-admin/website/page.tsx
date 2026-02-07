'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Globe, Palette, Code, ShieldCheck, ArrowLeft, Copy, Check, Upload, Image as ImageIcon } from 'lucide-react';
import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const analyticsProviders = [
    { id: 'google-analytics', name: 'Google Analytics', logo: 'GA', color: 'bg-[#f9ab00]', status: 'Bağlı' },
    { id: 'meta-pixel', name: 'Meta Pixel', logo: 'MP', color: 'bg-[#0668E1]', status: 'Bağlanabilir' },
    { id: 'hotjar', name: 'Hotjar', logo: 'HJ', color: 'bg-[#ff1c1c]', status: 'Bağlanabilir' },
    { id: 'yandex-metrica', name: 'Yandex Metrica', logo: 'YM', color: 'bg-[#ff0000]', status: 'Bağlanabilir' },
];

const colorOptions = [
    { name: 'Hangel Mercan', value: '#f34723' },
    { name: 'Gece Mavisi', value: '#042654' },
    { name: 'Orman Yeşili', value: '#10b981' },
    { name: 'Kraliyet Moru', value: '#8b5cf6' },
];

const domainRegistrars = [
    "GoDaddy", "Natro", "Turhost", "Google Domains", "Namecheap", "IHS Telekom", "Metunic", "Diğer"
];

export default function WebsiteBuilderPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [primaryColor, setPrimaryColor] = useState('#f34723');
    const [selectedRegistrar, setSelectedRegistrar] = useState('');

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast({
            title: "Kopyalandı",
            description: `${label} başarıyla panoya kopyalandı.`,
        });
    };

    return (
        <div className="space-y-6 animate-in fade-in-0 max-w-5xl mx-auto p-4 sm:p-6">
            <div className="flex items-center gap-2">
                <Button onClick={() => router.back()} variant="ghost" size="icon" className="-ml-2">
                    <ArrowLeft className="h-6 w-6" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold font-headline">Web Sitesi Yönetimi</h1>
                    <p className="text-muted-foreground text-sm">Kurumsal kimliğinizi, alan adınızı ve analiz araçlarınızı yönetin.</p>
                </div>
            </div>

            <Tabs defaultValue="integration">
                <TabsList className="grid w-full grid-cols-3 max-w-lg">
                    <TabsTrigger value="integration"><Code className="mr-2 h-4 w-4" /> Script & Analiz</TabsTrigger>
                    <TabsTrigger value="design"><Palette className="mr-2 h-4 w-4" /> Tasarım</TabsTrigger>
                    <TabsTrigger value="domain"><Globe className="mr-2 h-4 w-4" /> Domain</TabsTrigger>
                </TabsList>

                <TabsContent value="integration" className="mt-6 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Web Analiz Araçları Entegrasyonu</CardTitle>
                            <CardDescription>Popüler analiz ve takip servislerini tek tıkla sitenize bağlayın.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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

                            <div className="space-y-4 pt-6 border-t">
                                <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Özel Script Ekleme</h3>
                                <div className="space-y-2">
                                    <Label>Script Başlığı</Label>
                                    <Input placeholder="Örn: Hotjar Tracking Code" />
                                </div>
                                <div className="p-4 border rounded-xl bg-muted/20">
                                    <Label className="text-xs uppercase font-bold text-muted-foreground mb-2 block">Özel HTML / Script</Label>
                                    <textarea className="w-full h-32 bg-background font-mono text-xs p-3 border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary" placeholder="<!-- Script buraya gelecek -->"></textarea>
                                </div>
                                <Button onClick={() => toast({title: "Scriptler Kaydedildi"})}>Sitede Aktifleştir</Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="design" className="mt-6 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Görsel Kimlik</CardTitle>
                            <CardDescription>Sitenizin renklerini ve görsellerini markanıza uygun hale getirin.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-8">
                            <div className="space-y-4">
                                <Label className="text-base">Temel Renk Seçimi</Label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                    {colorOptions.map((color) => (
                                        <div 
                                            key={color.value}
                                            onClick={() => setPrimaryColor(color.value)}
                                            className={cn(
                                                "p-4 border-2 rounded-xl cursor-pointer transition-all flex flex-col items-center gap-2",
                                                primaryColor === color.value ? "border-primary bg-primary/5" : "hover:border-primary/30"
                                            )}
                                        >
                                            <div className="w-8 h-8 rounded-full shadow-md" style={{ backgroundColor: color.value }} />
                                            <span className="text-xs font-medium">{color.name}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex gap-2 items-center mt-2">
                                    <Label className="text-xs text-muted-foreground whitespace-nowrap">Veya özel kod:</Label>
                                    <Input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} className="w-12 h-8 p-1" />
                                    <Input value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} className="font-mono text-xs h-8 w-24" />
                                </div>
                            </div>

                            <div className="space-y-4 pt-6 border-t">
                                <Label className="text-base">Web Sitesi Bannerı</Label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div 
                                        className="border-2 border-dashed rounded-2xl aspect-[16/9] flex flex-col items-center justify-center gap-2 hover:bg-muted/50 transition-colors cursor-pointer"
                                        onClick={() => toast({title: "Dosya Seçici Açılıyor"})}
                                    >
                                        <div className="p-3 bg-primary/10 rounded-full text-primary">
                                            <Upload className="h-6 w-6" />
                                        </div>
                                        <p className="text-sm font-bold">Yeni Banner Yükle</p>
                                        <p className="text-[10px] text-muted-foreground">Önerilen boyut: 1920x600px</p>
                                    </div>
                                    <div className="relative aspect-[16/9] rounded-2xl overflow-hidden border group">
                                        <img src="https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?q=80&w=2070&auto=format&fit=crop" alt="Current Banner" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button variant="secondary" size="sm"><ImageIcon className="mr-2 h-4 w-4"/> Değiştir</Button>
                                        </div>
                                        <div className="absolute top-2 left-2">
                                            <Badge className="bg-primary">Aktif Banner</Badge>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="bg-muted/30 border-t p-4 flex justify-end">
                            <Button onClick={() => toast({title: "Tasarım Ayarları Kaydedildi"})}>Değişiklikleri Uygula</Button>
                        </CardFooter>
                    </Card>
                </TabsContent>

                <TabsContent value="domain" className="mt-6 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Alan Adı Bağlantısı</CardTitle>
                            <CardDescription>Kendi alan adınızı (domain) sitenize bağlamak için gerekli adımları takip edin.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label>Domaini Aldığınız Kurum</Label>
                                <Select value={selectedRegistrar} onValueChange={setSelectedRegistrar}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Domain sağlayıcınızı seçin..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {domainRegistrars.map(reg => <SelectItem key={reg} value={reg}>{reg}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-4 p-4 border rounded-2xl bg-indigo-50/50">
                                <h3 className="text-sm font-bold text-indigo-900 flex items-center gap-2">
                                    <Globe className="h-4 w-4" /> NameServer (NS) Kayıtları
                                </h3>
                                <p className="text-xs text-indigo-700">En sağlıklı bağlantı için domain panelinizden NS kayıtlarını aşağıdakilerle değiştirin:</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="flex items-center justify-between p-3 bg-white border rounded-xl shadow-sm">
                                        <code className="text-xs font-bold font-mono">ns1.hangel.org</code>
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyToClipboard('ns1.hangel.org', 'NS1')}>
                                            <Copy className="h-4 w-4 text-indigo-600" />
                                        </Button>
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-white border rounded-xl shadow-sm">
                                        <code className="text-xs font-bold font-mono">ns2.hangel.org</code>
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyToClipboard('ns2.hangel.org', 'NS2')}>
                                            <Copy className="h-4 w-4 text-indigo-600" />
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Alternatif: DNS (A/CNAME) Kayıtları</h3>
                                <div className="rounded-xl border overflow-hidden">
                                    <table className="w-full text-xs text-left">
                                        <thead className="bg-muted">
                                            <tr>
                                                <th className="p-3 border-b">Tür</th>
                                                <th className="p-3 border-b">İsim (Host)</th>
                                                <th className="p-3 border-b">Değer (Value)</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            <tr>
                                                <td className="p-3 font-mono">A</td>
                                                <td className="p-3 font-mono">@</td>
                                                <td className="p-3 font-mono text-primary font-bold">34.102.136.180</td>
                                            </tr>
                                            <tr>
                                                <td className="p-3 font-mono">CNAME</td>
                                                <td className="p-3 font-mono">www</td>
                                                <td className="p-3 font-mono text-primary font-bold">sites.hangel.org</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="p-4 border rounded-xl bg-blue-50 text-blue-800 text-[10px] flex items-center gap-3">
                                <ShieldCheck className="h-5 w-5 shrink-0" />
                                <p>DNS değişikliklerinin yayılması 24-48 saat sürebilir. Kayıtlar doğrulandıktan sonra SSL sertifikanız otomatik olarak aktif edilecektir.</p>
                            </div>
                        </CardContent>
                        <CardFooter className="bg-muted/20 border-t p-6 flex flex-col gap-4">
                            <div className="w-full text-center space-y-4">
                                <h3 className="font-bold text-foreground">Web Siteniz Yayınlanmaya Hazır</h3>
                                <p className="text-xs text-muted-foreground">Tüm profil bilgileriniz, ilanlarınız ve ayarlarınız sitenize otomatik yansıtılacaktır.</p>
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
