'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { 
    Globe, 
    Palette, 
    Code, 
    ShieldCheck, 
    ArrowLeft, 
    Copy, 
    Upload, 
    Image as ImageIcon, 
    MessageSquare, 
    Monitor, 
    BarChart3, 
    Heart, 
    ShoppingBag, 
    Megaphone, 
    HeartHandshake, 
    Newspaper, 
    Target, 
    Shield, 
    Settings2, 
    Save, 
    PlusCircle, 
    ArrowRight, 
    Landmark, 
    Info, 
    CheckCircle2, 
    Phone, 
    MapPin, 
    Share2,
    Building2,
    ExternalLink
} from 'lucide-react';
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

            {/* 1. Kurumsal Renk Seçimi - Web Specific */}
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
                        <Label className="text-sm font-bold">Özel Renk Girişi</Label>
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
                            <p className="text-xs text-muted-foreground">Renk paletinden seçmek için dairesel alana tıklayın.</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* 2. Görsel Yönetimi (Banner) - Web Specific */}
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

            {/* 3. Hakkımızda - Hangel Core */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 rounded-xl bg-muted">
                            <Building2 className="h-6 w-6 text-primary" />
                        </div>
                        <div className="space-y-1">
                            <CardTitle className="text-lg">Hakkımızda Bölümü</CardTitle>
                            <CardDescription>Kuruluş hikayesi ve misyon bilgilerini yönetin.</CardDescription>
                        </div>
                    </div>
                    <Switch defaultChecked className="data-[state=checked]:bg-green-600" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">Bu bölümdeki ana metinler Hangel STK profilinizden çekilmektedir. Özel bir web metni oluşturmak isterseniz aşağıdaki alanı kullanabilir veya ana profilinizi güncelleyebilirsiniz.</p>
                    <div className="space-y-2">
                        <Label>Web Sitesine Özel Hakkımızda Metni (Opsiyonel)</Label>
                        <Textarea rows={4} placeholder="Eğer profil metninden farklı bir metin isterseniz buraya yazın..." />
                    </div>
                    <Button asChild variant="outline" className="w-full">
                        <Link href="/ngo-admin/manage-profile">
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Kuruluş Profilini Düzenle
                        </Link>
                    </Button>
                </CardContent>
            </Card>

            {/* 4. Başkanın Mesajı - Web Specific */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 rounded-xl bg-muted">
                            <MessageSquare className="h-6 w-6 text-primary" />
                        </div>
                        <div className="space-y-1">
                            <CardTitle className="text-lg">Başkanın Mesajı</CardTitle>
                            <CardDescription>Web sitesi ana sayfasında yer alacak kurumsal mesaj.</CardDescription>
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
                                {presidentsMessage.length} / {MESSAGE_LIMIT}
                            </span>
                        </div>
                        <Textarea 
                            id="president-message" 
                            rows={6} 
                            maxLength={MESSAGE_LIMIT}
                            placeholder="Geleceğe dair vizyonunuzu buraya yazın..."
                            value={presidentsMessage}
                            onChange={(e) => setPresidentsMessage(e.target.value)}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* 5. Kurumsal İstatistikler - Hangel Core (Hybrid) */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 rounded-xl bg-muted">
                            <BarChart3 className="h-6 w-6 text-primary" />
                        </div>
                        <div className="space-y-1">
                            <CardTitle className="text-lg">Kurumsal İstatistikler</CardTitle>
                            <CardDescription>Gönüllü ve bağış verilerini web sitesinde gösterin.</CardDescription>
                        </div>
                    </div>
                    <Switch defaultChecked className="data-[state=checked]:bg-green-600" />
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Gönüllü Sayısı (Manuel Müdahale)</Label>
                            <Input defaultValue="150.000" />
                        </div>
                        <div className="space-y-2">
                            <Label>Bağışçı Sayısı (Manuel Müdahale)</Label>
                            <Input defaultValue="250.000" />
                        </div>
                    </div>
                    <div className="p-4 border rounded-xl bg-muted/30">
                        <p className="text-xs text-muted-foreground mb-3">Sistemdeki gerçek zamanlı verilerinizi görmek ve raporlamak için performans paneline gidin.</p>
                        <Button asChild variant="outline" size="sm" className="w-full">
                            <Link href="/ngo-admin/dashboard">
                                <BarChart3 className="mr-2 h-4 w-4" /> Performans Paneline Git
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* 6. Bağış Yöntemleri - Hangel Core */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 rounded-xl bg-muted">
                            <Heart className="h-6 w-6 text-primary" />
                        </div>
                        <div className="space-y-1">
                            <CardTitle className="text-lg">Bağış ve Destek Yöntemleri</CardTitle>
                            <CardDescription>Bağış kanallarını ve IBAN bilgilerini yönetin.</CardDescription>
                        </div>
                    </div>
                    <Switch defaultChecked className="data-[state=checked]:bg-green-600" />
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 border rounded-2xl bg-muted/10">
                            <span className="text-sm font-bold">hangel ile Bağış</span>
                            <Switch defaultChecked className="data-[state=checked]:bg-green-600" />
                        </div>
                        <div className="flex items-center justify-between p-4 border rounded-2xl bg-muted/10">
                            <span className="text-sm font-bold">HelpSteps ile Bağış</span>
                            <Switch defaultChecked className="data-[state=checked]:bg-green-600" />
                        </div>
                    </div>
                    <Button asChild variant="outline" className="w-full">
                        <Link href="/ngo-admin/manage-profile">
                            <Landmark className="mr-2 h-4 w-4" /> Banka ve IBAN Bilgilerini Düzenle
                        </Link>
                    </Button>
                </CardContent>
            </Card>

            {/* 7. Gönüllülük İlanları - Hangel Core */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 rounded-xl bg-muted">
                            <HeartHandshake className="h-6 w-6 text-primary" />
                        </div>
                        <div className="space-y-1">
                            <CardTitle className="text-lg">Gönüllülük İlanları</CardTitle>
                            <CardDescription>Aktif görevleri web sitenizde listeleyin.</CardDescription>
                        </div>
                    </div>
                    <Switch defaultChecked className="data-[state=checked]:bg-green-600" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">İlanların içeriği, başvuru formları ve gönüllü yönetimi ana panelden gerçekleştirilir.</p>
                    <Button asChild variant="outline" className="w-full">
                        <Link href="/ngo-admin/volunteer">
                            <PlusCircle className="mr-2 h-4 w-4" /> Gönüllülük Paneline Git
                        </Link>
                    </Button>
                </CardContent>
            </Card>

            {/* 8. Haberler ve Duyurular - Hangel Core */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 rounded-xl bg-muted">
                            <Newspaper className="h-6 w-6 text-primary" />
                        </div>
                        <div className="space-y-1">
                            <CardTitle className="text-lg">Haberler ve Duyurular</CardTitle>
                            <CardDescription>Mini Blog içeriklerini web sitenizde yayınlayın.</CardDescription>
                        </div>
                    </div>
                    <Switch defaultChecked className="data-[state=checked]:bg-green-600" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">Haber ve duyuru paylaşımlarınızı Mini Blog üzerinden yapabilirsiniz.</p>
                    <Button asChild variant="outline" className="w-full">
                        <Link href="/ngo-admin/posts">
                            <Megaphone className="mr-2 h-4 w-4" /> Mini Blog Sayfasına Git
                        </Link>
                    </Button>
                </CardContent>
            </Card>

            {/* 9. Küresel Amaçlar (SKA) - Hangel Core */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 rounded-xl bg-muted">
                            <Target className="h-6 w-6 text-primary" />
                        </div>
                        <div className="space-y-1">
                            <CardTitle className="text-lg">Küresel Amaçlar (SKA)</CardTitle>
                            <CardDescription>Desteklediğiniz hedefleri gösterin.</CardDescription>
                        </div>
                    </div>
                    <Switch defaultChecked className="data-[state=checked]:bg-green-600" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">Desteklediğiniz Sürdürülebilir Kalkınma Amaçlarını profilinizden seçebilirsiniz.</p>
                    <Button asChild variant="outline" className="w-full">
                        <Link href="/ngo-admin/manage-profile">
                            <Target className="mr-2 h-4 w-4" /> SKA Hedeflerini Düzenle
                        </Link>
                    </Button>
                </CardContent>
            </Card>

            {/* 10. Şeffaflık Endeksi - Hangel Core */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 rounded-xl bg-muted">
                            <Shield className="h-6 w-6 text-primary" />
                        </div>
                        <div className="space-y-1">
                            <CardTitle className="text-lg">Şeffaflık Endeksi</CardTitle>
                            <CardDescription>Şeffaflık puanı ve belgeleri yönetin.</CardDescription>
                        </div>
                    </div>
                    <Switch defaultChecked className="data-[state=checked]:bg-green-600" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">Şeffaflık puanınızı artırmak için gerekli belgeleri yükleyin ve onaylatın.</p>
                    <Button asChild variant="outline" className="w-full">
                        <Link href="/ngo-admin/transparency">
                            <ShieldCheck className="mr-2 h-4 w-4" /> Şeffaflık Panelini Yönet
                        </Link>
                    </Button>
                </CardContent>
            </Card>

            {/* 11. İletişim Bilgileri - Hangel Core */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 rounded-xl bg-muted">
                            <Phone className="h-6 w-6 text-primary" />
                        </div>
                        <div className="space-y-1">
                            <CardTitle className="text-lg">İletişim Bilgileri</CardTitle>
                            <CardDescription>E-posta, telefon ve adres bilgilerini yönetin.</CardDescription>
                        </div>
                    </div>
                    <Switch defaultChecked className="data-[state=checked]:bg-green-600" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">Resmi iletişim bilgileriniz ve sosyal medya hesaplarınız ana profilinizle senkronize çalışır.</p>
                    <Button asChild variant="outline" className="w-full">
                        <Link href="/ngo-admin/manage-profile">
                            <Settings2 className="mr-2 h-4 w-4" /> İletişim Bilgilerini Düzenle
                        </Link>
                    </Button>
                </CardContent>
            </Card>

            {/* 12. Alan Adı (Domain) Ayarları - Web Specific */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 rounded-xl bg-muted">
                            <Globe className="h-6 w-6 text-primary" />
                        </div>
                        <div className="space-y-1">
                            <CardTitle className="text-lg">Alan Adı (Domain) Ayarları</CardTitle>
                            <CardDescription>Kendi alan adınızı web sitenize bağlayın.</CardDescription>
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
                    <div className="p-4 border rounded-2xl bg-indigo-50/50">
                        <h3 className="text-xs font-bold text-indigo-900 flex items-center gap-2 mb-3">
                            <Monitor className="h-4 w-4" /> DNS (NameServer) Bilgileri
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
                </CardContent>
            </Card>

            {/* 13. Web Analiz Araçları - Web Specific */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 rounded-xl bg-muted">
                            <Code className="h-6 w-6 text-primary" />
                        </div>
                        <div className="space-y-1">
                            <CardTitle className="text-lg">Web Analiz Araçları</CardTitle>
                            <CardDescription>İstatistik ve takip kodlarını sitenize ekleyin.</CardDescription>
                        </div>
                    </div>
                    <Switch defaultChecked className="data-[state=checked]:bg-green-600" />
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {analyticsProviders.map((ap) => (
                            <div key={ap.id} className="p-3 border rounded-xl flex flex-col items-center gap-2 bg-muted/10">
                                <span className="text-[10px] font-bold">{ap.name}</span>
                                <Button variant="outline" size="sm" className="h-7 text-[10px] w-full">Bağla</Button>
                            </div>
                        ))}
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase text-muted-foreground">Özel Script (Head/Body)</Label>
                        <textarea 
                            className="w-full h-32 bg-muted/20 font-mono text-[10px] p-3 border rounded-xl focus:outline-none focus:ring-1 focus:ring-primary" 
                            placeholder="<!-- Google Tag Manager, FB Pixel vb. -->"
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
                            <p className="text-[10px] text-muted-foreground">Tüm ayarlar kaydedildi.</p>
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

const FileUpload = ({label, currentFile}: {label: string, currentFile?: string}) => (
    <div className="space-y-2">
        <Label>{label}</Label>
        <div className="flex items-center gap-4">
            <Input id={`${label}-upload`} type="file" className="hidden" />
            <Button asChild variant="outline" size="sm">
                <label htmlFor={`${label}-upload`} className="cursor-pointer"><Upload className="mr-2 h-4 w-4" />{currentFile ? 'Değiştir' : 'Yükle'}</label>
            </Button>
            {currentFile && <span className="text-xs text-muted-foreground">Mevcut: {currentFile}</span>}
        </div>
    </div>
);