'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Globe, Palette, Code, ShieldCheck, ArrowLeft, Copy, Upload, Image as ImageIcon, MessageSquare, Monitor, BarChart3, Heart, ShoppingBag, Megaphone, HeartHandshake, Newspaper, Target, Shield, Settings2, Save, PlusCircle, ArrowRight } from 'lucide-react';
import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import Link from 'next/link';

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
    const MESSAGE_LIMIT = 1000;

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast({
            title: "Kopyalandı",
            description: `${label} başarıyla panoya kopyalandı.`,
        });
    };

    const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPrimaryColor(e.target.value);
    };

    return (
        <div className="space-y-8 animate-in fade-in-0 max-w-5xl mx-auto p-4 sm:p-6 pb-32">
            <div className="flex items-center gap-2">
                <Button onClick={() => router.back()} variant="ghost" size="icon" className="-ml-2">
                    <ArrowLeft className="h-6 w-6" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold font-headline">Web Sitesi Yönetimi</h1>
                    <p className="text-muted-foreground text-sm">Kurumsal kimliğinizi ve web varlığınızı tek ekrandan yönetin.</p>
                </div>
            </div>

            {/* 1. Kurumsal Renk Seçimi */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 rounded-xl bg-muted">
                            <Palette className="h-6 w-6 text-primary" />
                        </div>
                        <div className="space-y-1">
                            <CardTitle className="text-lg">Kurumsal Renk Seçimi</CardTitle>
                            <CardDescription>Sitenizin ana temasını belirleyecek kurumsal rengi seçin.</CardDescription>
                        </div>
                    </div>
                    <Switch defaultChecked className="data-[state=checked]:bg-green-600" />
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {colorOptions.map((color) => (
                            <div 
                                key={color.value}
                                onClick={() => setPrimaryColor(color.value)}
                                className={cn(
                                    "p-4 border-2 rounded-xl cursor-pointer transition-all flex flex-col items-center gap-2",
                                    primaryColor.toLowerCase() === color.value.toLowerCase() ? "border-primary bg-primary/5 shadow-md scale-105" : "hover:border-primary/30"
                                )}
                            >
                                <div className="w-10 h-10 rounded-full shadow-inner border-2 border-white" style={{ backgroundColor: color.value }} />
                                <span className="text-[10px] font-bold font-mono text-muted-foreground uppercase">{color.value}</span>
                                <span className="text-xs font-semibold">{color.name}</span>
                            </div>
                        ))}
                    </div>

                    <div className="pt-4 border-t space-y-4">
                        <Label className="text-sm font-bold">Özel Renk Seçimi</Label>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 flex-1 max-w-sm">
                                <span className="text-sm font-mono text-muted-foreground">#</span>
                                <Input 
                                    value={primaryColor.replace('#', '')} 
                                    onChange={(e) => setPrimaryColor(`#${e.target.value}`)}
                                    placeholder="FFFFFF"
                                    className="font-mono uppercase"
                                    maxLength={6}
                                />
                            </div>
                            <div className="relative group">
                                <input 
                                    type="color" 
                                    value={primaryColor} 
                                    onChange={handleColorChange}
                                    className="w-12 h-12 rounded-full cursor-pointer border-2 border-white shadow-md appearance-none overflow-hidden"
                                />
                                <div className="absolute inset-0 rounded-full border border-black/5 pointer-events-none" />
                            </div>
                            <p className="text-xs text-muted-foreground">Renk paletinden seçmek için daireye tıklayın.</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* 2. Görsel Yönetimi (Banner) */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 rounded-xl bg-muted">
                            <ImageIcon className="h-6 w-6 text-primary" />
                        </div>
                        <div className="space-y-1">
                            <CardTitle className="text-lg">Görsel Yönetimi (Banner)</CardTitle>
                            <CardDescription>Web sitesi ana sayfasında dönecek görselleri yönetin (Maksimum 4).</CardDescription>
                        </div>
                    </div>
                    <Switch defaultChecked className="data-[state=checked]:bg-green-600" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="relative aspect-[16/9] rounded-xl overflow-hidden border-2 border-primary group">
                            <img src="https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?q=80&w=2070&auto=format&fit=crop" alt="Banner 1" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button variant="secondary" size="sm" className="h-7 text-[10px] px-2"><ImageIcon className="mr-1 h-3 w-3"/> Değiştir</Button>
                            </div>
                            <div className="absolute top-1 left-1">
                                <Badge className="bg-primary text-[8px] h-4 font-bold px-1.5 border-none">ANA BANNER</Badge>
                            </div>
                        </div>
                        {[2, 3, 4].map(i => (
                            <div 
                                key={i}
                                className="border-2 border-dashed rounded-xl aspect-[16/9] flex flex-col items-center justify-center gap-1 hover:bg-muted/50 transition-colors cursor-pointer group"
                                onClick={() => toast({title: "Dosya Seçici Açılıyor"})}
                            >
                                <Upload className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                <p className="text-[10px] font-bold">Banner {i} Yükle</p>
                            </div>
                        ))}
                    </div>
                    <div className="p-4 rounded-xl bg-orange-50 border border-orange-100 text-orange-800">
                        <p className="text-xs font-medium italic leading-relaxed">
                            <span className="font-bold">Önerilen boyut:</span> 1920x600px. İlk banner ana sayfa kapak görseli (Hero) olarak kullanılır.
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* 3. Başkanın Mesajı */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 rounded-xl bg-muted">
                            <MessageSquare className="h-6 w-6 text-primary" />
                        </div>
                        <div className="space-y-1">
                            <CardTitle className="text-lg">Başkanın Mesajı</CardTitle>
                            <CardDescription>Web sitesi ana sayfasında yer alacak resmi kurumsal mesaj.</CardDescription>
                        </div>
                    </div>
                    <Switch defaultChecked className="data-[state=checked]:bg-green-600" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="president-name">Başkanın Adı Soyadı</Label>
                        <Input id="president-name" placeholder="Örn: Haluk Levent" />
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between items-end mb-1">
                            <Label htmlFor="president-message">Mesaj İçeriği</Label>
                            <span className={cn(
                                "text-[10px] font-black uppercase px-2 py-0.5 rounded-full",
                                presidentsMessage.length > MESSAGE_LIMIT * 0.9 ? "bg-red-100 text-red-600" : "bg-muted text-muted-foreground"
                            )}>
                                {presidentsMessage.length} / {MESSAGE_LIMIT} (Kalan: {MESSAGE_LIMIT - presidentsMessage.length})
                            </span>
                        </div>
                        <Textarea 
                            id="president-message" 
                            rows={6} 
                            maxLength={MESSAGE_LIMIT}
                            placeholder="Geleceğe dair vizyonunuzu ve toplumsal mesajınızı buraya yazın..."
                            value={presidentsMessage}
                            onChange={(e) => setPresidentsMessage(e.target.value)}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* 4. Kurumsal İstatistikler */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 rounded-xl bg-muted">
                            <BarChart3 className="h-6 w-6 text-primary" />
                        </div>
                        <div className="space-y-1">
                            <CardTitle className="text-lg">Kurumsal İstatistikler</CardTitle>
                            <CardDescription>Gönüllü, bağış, yıl ve proje rakamlarını gösterir.</CardDescription>
                        </div>
                    </div>
                    <Switch defaultChecked className="data-[state=checked]:bg-green-600" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Gönüllü Sayısı</Label>
                            <Input defaultValue="150.000" />
                        </div>
                        <div className="space-y-2">
                            <Label>Bağışçı Sayısı</Label>
                            <Input defaultValue="250.000" />
                        </div>
                        <div className="space-y-2">
                            <Label>Kuruluş Yılı</Label>
                            <Input defaultValue="2017" />
                        </div>
                        <div className="space-y-2">
                            <Label>Aktif Kampanya Sayısı</Label>
                            <Input defaultValue="12" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Bölüm Sloganı</Label>
                        <Input defaultValue="İyilik her zaman kazanır." />
                    </div>
                </CardContent>
            </Card>

            {/* 5. Bağış Yöntemleri */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 rounded-xl bg-muted">
                            <Heart className="h-6 w-6 text-primary" />
                        </div>
                        <div className="space-y-1">
                            <CardTitle className="text-lg">Bağış ve Destek Yöntemleri</CardTitle>
                            <CardDescription>Aktif bağış kanallarını ve açıklamalarını düzenleyin.</CardDescription>
                        </div>
                    </div>
                    <Switch defaultChecked className="data-[state=checked]:bg-green-600" />
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 gap-4">
                        {[
                            { id: 'h-pay', label: 'hangel ile Bağış', desc: 'Alışverişlerinizle ek ücret ödemeden destek olun.' },
                            { id: 'sms-pay', label: 'SMS ile Bağış', desc: '3406\'ya mesaj atarak katkı sağlayın.' },
                            { id: 'card-pay', label: 'Kredi Kartı', desc: 'Online ödeme sistemimizle güvenle bağış yapın.' },
                            { id: 'bank-pay', label: 'Banka EFT/Havale', desc: 'Resmi hesaplarımıza doğrudan transfer yapın.' },
                        ].map(item => (
                            <div key={item.id} className="p-4 border rounded-2xl bg-muted/10 space-y-3">
                                <div className="flex items-center justify-between">
                                    <Input defaultValue={item.label} className="h-8 text-sm font-bold bg-background max-w-[200px]" />
                                    <Switch defaultChecked className="data-[state=checked]:bg-green-600" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] uppercase font-black text-muted-foreground">Görünecek Açıklama</Label>
                                    <Input defaultValue={item.desc} className="h-8 text-xs bg-background" />
                                </div>
                                {item.id === 'sms-pay' && (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-dashed mt-2">
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] uppercase font-black text-muted-foreground">Kısa Kod</Label>
                                            <Input defaultValue="3406" className="h-8 text-xs bg-background" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] uppercase font-black text-muted-foreground">Anahtar Kelime</Label>
                                            <Input defaultValue="AHBAP" className="h-8 text-xs bg-background" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-[10px] uppercase font-black text-muted-foreground">SMS Tutarı (₺)</Label>
                                            <Input defaultValue="20" type="number" className="h-8 text-xs bg-background" />
                                        </div>
                                        <div className="md:col-span-3 space-y-2">
                                            <Label className="text-[10px] uppercase font-black text-muted-foreground">Aktif Operatörler</Label>
                                            <div className="flex gap-4">
                                                {['Turkcell', 'Vodafone', 'Türk Telekom'].map(op => (
                                                    <div key={op} className="flex items-center gap-2">
                                                        <Checkbox id={`op-${op}`} defaultChecked />
                                                        <Label htmlFor={`op-${op}`} className="text-xs">{op}</Label>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* 6. Gönüllülük İlanları */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 rounded-xl bg-muted">
                            <HeartHandshake className="h-6 w-6 text-primary" />
                        </div>
                        <div className="space-y-1">
                            <CardTitle className="text-lg">Gönüllülük İlanları</CardTitle>
                            <CardDescription>Aktif saha ve online görevleri listeler.</CardDescription>
                        </div>
                    </div>
                    <Switch defaultChecked className="data-[state=checked]:bg-green-600" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>İlan Listeleme Filtresi</Label>
                        <Select defaultValue="active">
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="active">Sadece Aktif İlanlar</SelectItem>
                                <SelectItem value="all">Tüm İlan Geçmişi</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* 7. Haberler ve Duyurular */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 rounded-xl bg-muted">
                            <Newspaper className="h-6 w-6 text-primary" />
                        </div>
                        <div className="space-y-1">
                            <CardTitle className="text-lg">Haberler ve Duyurular</CardTitle>
                            <CardDescription>Gönderilerinizi blog tarzında sunar.</CardDescription>
                        </div>
                    </div>
                    <Switch defaultChecked className="data-[state=checked]:bg-green-600" />
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Görünüm Modu</Label>
                            <Select defaultValue="grid">
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="grid">Izgara (Grid)</SelectItem>
                                    <SelectItem value="list">Liste (List)</SelectItem>
                                    <SelectItem value="slider">Slider</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Haber Sayısı</Label>
                            <Input type="number" defaultValue="6" />
                        </div>
                    </div>
                    <div className="pt-4 border-t">
                        <Button asChild className="w-full h-12 rounded-xl bg-muted text-foreground hover:bg-muted/80 border border-dashed border-primary/20">
                            <Link href="/ngo-admin/posts">
                                <PlusCircle className="mr-2 h-5 w-5 text-primary" />
                                Mini Blog'da Yeni Paylaşım Yap
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* 8. Alan Adı (Domain) Ayarları */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 rounded-xl bg-muted">
                            <Globe className="h-6 w-6 text-primary" />
                        </div>
                        <div className="space-y-1">
                            <CardTitle className="text-lg">Alan Adı (Domain) Ayarları</CardTitle>
                            <CardDescription>Kendi alan adınızı bağlayarak kurumsal kimliğinizi güçlendirin.</CardDescription>
                        </div>
                    </div>
                    <Switch defaultChecked className="data-[state=checked]:bg-green-600" />
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="domain-name">Alan Adınız (Domain)</Label>
                            <Input id="domain-name" placeholder="kurulusunuz.org" value={domainName} onChange={(e) => setDomainName(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Domain Sağlayıcı</Label>
                            <Select value={selectedRegistrar} onValueChange={setSelectedRegistrar}>
                                <SelectTrigger><SelectValue placeholder="Seçiniz..." /></SelectTrigger>
                                <SelectContent>
                                    {domainRegistrars.map(reg => <SelectItem key={reg} value={reg}>{reg}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-4 p-4 border rounded-2xl bg-indigo-50/50">
                        <h3 className="text-xs font-bold text-indigo-900 flex items-center gap-2">
                            <Monitor className="h-4 w-4" /> NameServer (NS) Kayıtları
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="flex items-center justify-between p-3 bg-white border rounded-xl shadow-sm">
                                <code className="text-[10px] font-bold font-mono">ns1.hangel.org</code>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyToClipboard('ns1.hangel.org', 'NS1')}>
                                    <Copy className="h-4 w-4 text-indigo-600" />
                                </Button>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-white border rounded-xl shadow-sm">
                                <code className="text-[10px] font-bold font-mono">ns2.hangel.org</code>
                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyToClipboard('ns2.hangel.org', 'NS2')}>
                                    <Copy className="h-4 w-4 text-indigo-600" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 border rounded-xl bg-blue-50 text-blue-800 text-[10px] flex items-center gap-3">
                        <ShieldCheck className="h-5 w-5 shrink-0" />
                        <p>DNS değişikliklerinin yayılması 24-48 saat sürebilir. Bağlantı sonrası SSL otomatik kurulur.</p>
                    </div>
                </CardContent>
            </Card>

            {/* 9. Web Analiz Araçları */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 rounded-xl bg-muted">
                            <Code className="h-6 w-6 text-primary" />
                        </div>
                        <div className="space-y-1">
                            <CardTitle className="text-lg">Web Analiz Araçları</CardTitle>
                            <CardDescription>Analiz ve takip servislerini sitenize bağlayın.</CardDescription>
                        </div>
                    </div>
                    <Switch defaultChecked className="data-[state=checked]:bg-green-600" />
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                        {analyticsProviders.map((ap) => (
                            <div key={ap.id} className="p-3 border rounded-xl flex flex-col items-center gap-2 bg-muted/10">
                                <Badge className={cn("text-[10px]", ap.id === 'google-analytics' ? "bg-orange-500" : "bg-blue-600")}>{ap.logo}</Badge>
                                <span className="text-[10px] font-bold">{ap.name}</span>
                                <Button variant="outline" size="sm" className="h-7 text-[10px] w-full">Bağla</Button>
                            </div>
                        ))}
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase text-muted-foreground">Özel Script / HTML</Label>
                        <textarea 
                            className="w-full h-32 bg-muted/20 font-mono text-[10px] p-3 border rounded-xl focus:outline-none focus:ring-1 focus:ring-primary" 
                            placeholder="<!-- Script buraya gelecek -->"
                        ></textarea>
                    </div>
                </CardContent>
            </Card>

            {/* Yayınla Paneli */}
            <div className="fixed bottom-6 inset-x-4 z-50 flex justify-center pointer-events-none">
                <Card className="bg-background/90 backdrop-blur-xl border-primary/20 shadow-2xl max-w-lg w-full pointer-events-auto">
                    <CardContent className="p-4 flex items-center justify-between gap-4">
                        <div className="text-left hidden sm:block">
                            <p className="font-bold text-sm">Site Yayınlanmaya Hazır</p>
                            <p className="text-[10px] text-muted-foreground">Tüm veriler profilinizle senkronize.</p>
                        </div>
                        <Button 
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold h-12 rounded-xl"
                            onClick={() => {
                                toast({ title: "Siteniz Yayınlandı!", description: "Önizleme açılıyor..." });
                                window.open('/ngo-admin/website/preview', '_blank');
                            }}
                        >
                            <Globe className="mr-2 h-4 w-4" /> Siteyi Yayınla ve Görüntüle
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
