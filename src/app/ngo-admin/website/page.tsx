'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Globe, Palette, Code, ShieldCheck, ArrowLeft, Copy, Upload, Image as ImageIcon, MessageSquare, Monitor, Check, X } from 'lucide-react';
import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

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
    const [domainName, setDomainName] = useState('');
    const [presidentsMessage, setPresidentsMessage] = useState('');

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast({
            title: "Kopyalandı",
            description: `${label} başarıyla panoya kopyalandı.`,
        });
    };

    return (
        <div className="space-y-8 animate-in fade-in-0 max-w-5xl mx-auto p-4 sm:p-6 pb-24">
            <div className="flex items-center gap-2">
                <Button onClick={() => router.back()} variant="ghost" size="icon" className="-ml-2">
                    <ArrowLeft className="h-6 w-6" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold font-headline">Web Sitesi Yönetimi</h1>
                    <p className="text-muted-foreground text-sm">Kurumsal kimliğinizi ve web varlığınızı tek ekrandan yönetin.</p>
                </div>
            </div>

            {/* 1. Tasarım & Görsel Kimlik */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Palette className="h-5 w-5 text-primary" />
                        Görsel Kimlik & Tasarım
                    </CardTitle>
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
                    </div>

                    <div className="space-y-4 pt-6 border-t">
                        <Label className="text-base">Web Sitesi Bannerları (Maksimum 4)</Label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Slot 1 - Active */}
                            <div className="relative aspect-[16/9] rounded-xl overflow-hidden border-2 border-primary group">
                                <img src="https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?q=80&w=2070&auto=format&fit=crop" alt="Banner 1" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button variant="secondary" size="sm" className="h-7 text-[10px] px-2"><ImageIcon className="mr-1 h-3 w-3"/> Değiştir</Button>
                                </div>
                                <div className="absolute top-1 left-1">
                                    <Badge className="bg-primary text-[8px] h-4 font-bold px-1.5 border-none">ANA BANNER</Badge>
                                </div>
                            </div>
                            
                            {/* Slot 2 - Empty */}
                            <div 
                                className="border-2 border-dashed rounded-xl aspect-[16/9] flex flex-col items-center justify-center gap-1 hover:bg-muted/50 transition-colors cursor-pointer group"
                                onClick={() => toast({title: "Dosya Seçici Açılıyor"})}
                            >
                                <Upload className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                <p className="text-[10px] font-bold">Banner 2 Yükle</p>
                            </div>

                            {/* Slot 3 - Empty */}
                            <div 
                                className="border-2 border-dashed rounded-xl aspect-[16/9] flex flex-col items-center justify-center gap-1 hover:bg-muted/50 transition-colors cursor-pointer group"
                                onClick={() => toast({title: "Dosya Seçici Açılıyor"})}
                            >
                                <Upload className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                <p className="text-[10px] font-bold">Banner 3 Yükle</p>
                            </div>

                            {/* Slot 4 - Empty */}
                            <div 
                                className="border-2 border-dashed rounded-xl aspect-[16/9] flex flex-col items-center justify-center gap-1 hover:bg-muted/50 transition-colors cursor-pointer group"
                                onClick={() => toast({title: "Dosya Seçici Açılıyor"})}
                            >
                                <Upload className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                <p className="text-[10px] font-bold">Banner 4 Yükle</p>
                            </div>
                        </div>
                        <p className="text-[10px] text-muted-foreground">Önerilen boyut: 1920x600px. İlk banner ana sayfa kapak görseli olarak kullanılır.</p>
                    </div>
                </CardContent>
            </Card>

            {/* 2. Başkanın Mesajı */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-primary" />
                        Başkanın Mesajı
                    </CardTitle>
                    <CardDescription>Web sitesi ana sayfasında yer alacak resmi kurumsal mesaj.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="president-name">Başkanın Adı Soyadı</Label>
                        <Input id="president-name" placeholder="Örn: Haluk Levent" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="president-message">Mesaj İçeriği</Label>
                        <Textarea 
                            id="president-message" 
                            rows={6} 
                            placeholder="Geleceğe dair vizyonunuzu ve toplumsal mesajınızı buraya yazın..."
                            value={presidentsMessage}
                            onChange={(e) => setPresidentsMessage(e.target.value)}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* 3. Alan Adı (Domain) Ayarları */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Globe className="h-5 w-5 text-primary" />
                        Alan Adı (Domain) Ayarları
                    </CardTitle>
                    <CardDescription>Kendi alan adınızı bağlayarak kurumsal kimliğinizi güçlendirin.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="domain-name">Alan Adınız (Domain)</Label>
                            <div className="relative">
                                <Input 
                                    id="domain-name" 
                                    placeholder="kurulusunuz.org" 
                                    value={domainName}
                                    onChange={(e) => setDomainName(e.target.value)}
                                    className="pl-9"
                                />
                                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            </div>
                        </div>
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
                    </div>

                    <div className="space-y-4 p-4 border rounded-2xl bg-indigo-50/50">
                        <h3 className="text-sm font-bold text-indigo-900 flex items-center gap-2">
                            <Monitor className="h-4 w-4" /> NameServer (NS) Kayıtları
                        </h3>
                        <p className="text-xs text-indigo-700">Bağlantıyı tamamlamak için domain panelinizden bu NS kayıtlarını tanımlayın:</p>
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
                        <p>DNS değişikliklerinin yayılması 24-48 saat sürebilir. Doğrulama sonrası SSL sertifikanız otomatik kurulacaktır.</p>
                    </div>
                </CardContent>
            </Card>

            {/* 4. Web Analiz Araçları Entegrasyonu */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Code className="h-5 w-5 text-primary" />
                        Web Analiz Araçları Entegrasyonu
                    </CardTitle>
                    <CardDescription>Popüler analiz ve takip servislerini sitenize bağlayın.</CardDescription>
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
                            <textarea 
                                className="w-full h-32 bg-background font-mono text-xs p-3 border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary" 
                                placeholder="<!-- Script buraya gelecek -->"
                            ></textarea>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Yayınla Alanı */}
            <div className="sticky bottom-6 z-40 px-2 sm:px-0">
                <Card className="bg-background/80 backdrop-blur-xl border-primary/20 shadow-2xl">
                    <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="text-left hidden sm:block">
                            <p className="font-bold text-sm">Yayınlanmaya Hazır</p>
                            <p className="text-[10px] text-muted-foreground">Profil ve ilan verilerinizle otomatik senkronize.</p>
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto">
                            <Button variant="outline" className="flex-1 sm:flex-none" onClick={() => toast({title: "Ayarlar Kaydedildi"})}>Ayarları Kaydet</Button>
                            <Button 
                                className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700 text-white font-bold"
                                onClick={() => {
                                    toast({ title: "Siteniz Yayınlandı!", description: "Önizleme açılıyor..." });
                                    window.open('/ngo-admin/website/preview', '_blank');
                                }}
                            >
                                <Globe className="mr-2 h-4 w-4" /> Siteyi Yayınla ve Görüntüle
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
