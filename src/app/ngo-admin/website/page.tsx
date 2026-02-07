
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
    ExternalLink,
    Loader2,
    Smartphone,
    Users,
    Calendar,
    ShoppingCart,
    Handshake
} from 'lucide-react';
import React, { useState, useCallback, useEffect } from 'react';
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

const transparencyDocs = [
    { id: 'faaliyet', label: 'Faaliyet Belgesi' },
    { id: 'tuzuk', label: 'Tüzük / Vakıf Senedi' },
    { id: 'yonetim', label: 'Yönetim Kurulu Listesi' },
    { id: 'mali', label: 'Finansal Tablolar' },
    { id: 'denetim', label: 'Bağımsız Denetim Raporu' },
    { id: 'etki', label: 'Sosyal Etki Raporu' },
];

export default function WebsiteBuilderPage() {
    const router = useRouter();
    const { toast } = useToast();
    
    // Website Section Visibility States
    const [sections, setSections] = useState({
        colors: true,
        banners: true,
        about: true,
        president: true,
        stats: true,
        donations: true,
        volunteering: true,
        news: true,
        sdg: true,
        transparency: true,
        contact: true,
        domain: true,
        analytics: true,
        events: true,
        ecommerce: false,
        board: false,
        partners: true
    });

    // Content States
    const [primaryColor, setPrimaryColor] = useState('#f34723');
    const [selectedRegistrar, setSelectedRegistrar] = useState('');
    const [domainName, setDomainName] = useState('');
    const [presidentName, setPresidentName] = useState('Haluk Levent');
    const [presidentsMessage, setPresidentsMessage] = useState('Geleceğe dair vizyonumuz, dayanışmanın gücüyle her bir ihtiyaç sahibine ulaşmak ve toplumsal faydayı kalıcı hale getirmektir.');
    const [isSaving, setIsSaving] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<string | null>(null);
    
    const MESSAGE_LIMIT = 1000;

    useEffect(() => {
        setLastUpdated(new Date().toLocaleTimeString('tr-TR'));
    }, []);

    const toggleSection = (key: keyof typeof sections) => {
        setSections(prev => ({ ...prev, [key]: !prev[key] }));
        toast({
            title: "Görünüm Güncellendi",
            description: `${key.toUpperCase()} bölümü ${!sections[key] ? 'aktif' : 'pasif'} hale getirildi.`
        });
    };

    const handleSave = async (silent = false) => {
        setIsSaving(true);
        await new Promise(resolve => setTimeout(resolve, 800));
        setIsSaving(false);
        setLastUpdated(new Date().toLocaleTimeString('tr-TR'));
        
        if (!silent) {
            toast({
                title: "Tüm Değişiklikler Kaydedildi",
                description: "Web siteniz güncel bilgilerle yayına hazır.",
            });
        }
    };

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
            <Card className={cn(!sections.colors && "opacity-60")}>
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
                    <Switch 
                        checked={sections.colors} 
                        onCheckedChange={() => toggleSection('colors')}
                        className="data-[state=checked]:bg-green-600" 
                    />
                </CardHeader>
                {sections.colors && (
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
                )}
            </Card>

            {/* 2. Görsel Yönetimi (Banner) */}
            <Card className={cn(!sections.banners && "opacity-60")}>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 rounded-xl bg-muted">
                            <ImageIcon className="h-6 w-6 text-primary" />
                        </div>
                        <div className="space-y-1">
                            <CardTitle className="text-lg">Görsel Yönetimi (Banner)</CardTitle>
                            <CardDescription>Web sitesi ana sayfasında dönecek görselleri yönetin.</CardDescription>
                        </div>
                    </div>
                    <Switch 
                        checked={sections.banners} 
                        onCheckedChange={() => toggleSection('banners')}
                        className="data-[state=checked]:bg-green-600" 
                    />
                </CardHeader>
                {sections.banners && (
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="relative aspect-[16/9] rounded-xl overflow-hidden border-2 border-primary group">
                                <img src="https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?q=80&w=2070&auto=format&fit=crop" alt="Banner 1" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button variant="secondary" size="sm" className="h-7 text-[10px] px-2" onClick={() => toast({title: "Görsel Seçiliyor", description: "Dosya yöneticisi açılıyor..."})}><ImageIcon className="mr-1 h-3 w-3"/> Değiştir</Button>
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
                        <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 text-primary">
                            <p className="text-xs font-medium italic leading-relaxed">
                                <span className="font-bold">Önerilen boyut:</span> 1920x600px. İlk banner ana sayfa kapak görseli (Hero) olarak kullanılır.
                            </p>
                        </div>
                    </CardContent>
                )}
            </Card>

            {/* 3. Hakkımızda */}
            <Card className={cn(!sections.about && "opacity-60")}>
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
                    <Switch 
                        checked={sections.about} 
                        onCheckedChange={() => toggleSection('about')}
                        className="data-[state=checked]:bg-green-600" 
                    />
                </CardHeader>
                {sections.about && (
                    <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">Bu bölümdeki veriler kuruluş profilinizle senkronize çalışır.</p>
                        <div className="grid grid-cols-1 gap-4">
                            <Button asChild variant="outline" className="w-full">
                                <Link href="/ngo-admin/manage-profile">
                                    <ExternalLink className="mr-2 h-4 w-4" />
                                    Profilde Düzenle
                                </Link>
                            </Button>
                        </div>
                    </CardContent>
                )}
            </Card>

            {/* 4. Başkanın Mesajı */}
            <Card className={cn(!sections.president && "opacity-60")}>
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
                    <Switch 
                        checked={sections.president} 
                        onCheckedChange={() => toggleSection('president')}
                        className="data-[state=checked]:bg-green-600" 
                    />
                </CardHeader>
                {sections.president && (
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="president-name">Başkanın Adı Soyadı</Label>
                            <Input 
                                id="president-name" 
                                value={presidentName} 
                                onChange={(e) => setPresidentName(e.target.value)}
                                placeholder="Örn: Haluk Levent" 
                            />
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
                        <Button className="w-full" onClick={() => handleSave()}><Save className="mr-2 h-4 w-4" /> Mesajı Kaydet</Button>
                    </CardContent>
                )}
            </Card>

            {/* 5. Kurumsal İstatistikler */}
            <Card className={cn(!sections.stats && "opacity-60")}>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 rounded-xl bg-muted">
                            <BarChart3 className="h-6 w-6 text-primary" />
                        </div>
                        <div className="space-y-1">
                            <CardTitle className="text-lg">Kurumsal İstatistikler</CardTitle>
                            <CardDescription>Web sitesinde gösterilecek sayaçları yönetin.</CardDescription>
                        </div>
                    </div>
                    <Switch 
                        checked={sections.stats} 
                        onCheckedChange={() => toggleSection('stats')}
                        className="data-[state=checked]:bg-green-600" 
                    />
                </CardHeader>
                {sections.stats && (
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Gönüllü Sayısı</Label>
                                <Input type="number" defaultValue="150000" />
                            </div>
                            <div className="space-y-2">
                                <Label>Bağışçı Sayısı</Label>
                                <Input type="number" defaultValue="250000" />
                            </div>
                            <div className="space-y-2">
                                <Label>Kuruluş Yılı</Label>
                                <Input type="number" defaultValue="2017" />
                            </div>
                            <div className="space-y-2">
                                <Label>Aktif Kampanya</Label>
                                <Input type="number" defaultValue="12" />
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button asChild variant="outline" className="flex-1">
                                <Link href="/ngo-admin/dashboard"><BarChart3 className="mr-2 h-4 w-4" /> Performans Paneli</Link>
                            </Button>
                            <Button className="flex-1" onClick={() => handleSave()}>Verileri Güncelle</Button>
                        </div>
                    </CardContent>
                )}
            </Card>

            {/* 6. Bağış Yöntemleri */}
            <Card className={cn(!sections.donations && "opacity-60")}>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 rounded-xl bg-muted">
                            <Heart className="h-6 w-6 text-primary" />
                        </div>
                        <div className="space-y-1">
                            <CardTitle className="text-lg">Bağış ve Destek Yöntemleri</CardTitle>
                            <CardDescription>Aktif bağış kanallarını yapılandırın.</CardDescription>
                        </div>
                    </div>
                    <Switch 
                        checked={sections.donations} 
                        onCheckedChange={() => toggleSection('donations')}
                        className="data-[state=checked]:bg-green-600" 
                    />
                </CardHeader>
                {sections.donations && (
                    <CardContent className="space-y-6">
                        <div className="space-y-4">
                            <div className="p-4 border rounded-2xl space-y-4 bg-muted/5">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-bold">hangel ile Bağış</span>
                                    <Switch defaultChecked className="data-[state=checked]:bg-green-600" />
                                </div>
                            </div>
                            <div className="p-4 border rounded-2xl space-y-4 bg-muted/5">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-bold">HelpSteps ile Bağış</span>
                                    <Switch defaultChecked className="data-[state=checked]:bg-green-600" />
                                </div>
                            </div>
                            <div className="p-4 border rounded-2xl space-y-4 bg-muted/5">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Smartphone className="h-4 w-4 text-primary" />
                                        <span className="text-sm font-bold">SMS ile Bağış</span>
                                    </div>
                                    <Switch defaultChecked className="data-[state=checked]:bg-green-600" />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs">Kısa Kod</Label>
                                        <Input placeholder="Örn: 3406" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs">Anahtar Kelime</Label>
                                        <Input placeholder="Örn: AHBAP" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs">SMS Tutarı (₺)</Label>
                                        <Input type="number" placeholder="20" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs">Operatörler</Label>
                                        <div className="flex flex-wrap gap-4">
                                            <div className="flex items-center space-x-2">
                                                <Checkbox id="op-turkcell" defaultChecked />
                                                <Label htmlFor="op-turkcell" className="text-xs">Turkcell</Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Checkbox id="op-vodafone" defaultChecked />
                                                <Label htmlFor="op-vodafone" className="text-xs">Vodafone</Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Checkbox id="op-ttelekom" defaultChecked />
                                                <Label htmlFor="op-ttelekom" className="text-xs">T.Telekom</Label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="p-4 border rounded-2xl space-y-4 bg-muted/5">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-bold">Banka EFT/Havale</span>
                                    <Switch defaultChecked className="data-[state=checked]:bg-green-600" />
                                </div>
                            </div>
                        </div>
                        <Button asChild variant="outline" className="w-full">
                            <Link href="/ngo-admin/manage-profile">
                                <Landmark className="mr-2 h-4 w-4" /> Banka Bilgilerini Düzenle
                            </Link>
                        </Button>
                    </CardContent>
                )}
            </Card>

            {/* 7. Gönüllülük İlanları */}
            <Card className={cn(!sections.volunteering && "opacity-60")}>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 rounded-xl bg-muted">
                            <HeartHandshake className="h-6 w-6 text-primary" />
                        </div>
                        <div className="space-y-1">
                            <CardTitle className="text-lg">Gönüllülük İlanları</CardTitle>
                            <CardDescription>İlanların web sitesindeki görünümünü yönetin.</CardDescription>
                        </div>
                    </div>
                    <Switch 
                        checked={sections.volunteering} 
                        onCheckedChange={() => toggleSection('volunteering')}
                        className="data-[state=checked]:bg-green-600" 
                    />
                </CardHeader>
                {sections.volunteering && (
                    <CardContent className="space-y-4">
                        <div className="space-y-3">
                            <div className="flex items-center space-x-2">
                                <Checkbox id="only-active" defaultChecked />
                                <Label htmlFor="only-active">Sadece Aktif İlanları Göster</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox id="show-all" />
                                <Label htmlFor="show-all">Tüm İlanları Göster</Label>
                            </div>
                        </div>
                        <Button asChild variant="outline" className="w-full">
                            <Link href="/ngo-admin/volunteer">
                                <PlusCircle className="mr-2 h-4 w-4" /> Gönüllülük Paneline Git
                            </Link>
                        </Button>
                    </CardContent>
                )}
            </Card>

            {/* 14. Etkinlikler (YENİ) */}
            <Card className={cn(!sections.events && "opacity-60")}>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 rounded-xl bg-muted">
                            <Calendar className="h-6 w-6 text-primary" />
                        </div>
                        <div className="space-y-1">
                            <CardTitle className="text-lg">Etkinlik Takvimi</CardTitle>
                            <CardDescription>Web sitesinde yaklaşan etkinliklerinizi listeleyin.</CardDescription>
                        </div>
                    </div>
                    <Switch 
                        checked={sections.events} 
                        onCheckedChange={() => toggleSection('events')}
                        className="data-[state=checked]:bg-green-600" 
                    />
                </CardHeader>
                {sections.events && (
                    <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">Etkinlikleriniz, mekan rezervasyonlarınız ve takvim verileriniz burada listelenir.</p>
                        <Button asChild variant="outline" className="w-full">
                            <Link href="/ngo-admin/events">
                                <ExternalLink className="mr-2 h-4 w-4" /> Etkinlikleri Yönet
                            </Link>
                        </Button>
                    </CardContent>
                )}
            </Card>

            {/* 15. İktisadi İşletme (YENİ) */}
            <Card className={cn(!sections.ecommerce && "opacity-60")}>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 rounded-xl bg-muted">
                            <ShoppingCart className="h-6 w-6 text-primary" />
                        </div>
                        <div className="space-y-1">
                            <CardTitle className="text-lg">İktisadi İşletme Mağazası</CardTitle>
                            <CardDescription>Ürünlerinizi web sitesi vitrininde sergileyin.</CardDescription>
                        </div>
                    </div>
                    <Switch 
                        checked={sections.ecommerce} 
                        onCheckedChange={() => toggleSection('ecommerce')}
                        className="data-[state=checked]:bg-green-600" 
                    />
                </CardHeader>
                {sections.ecommerce && (
                    <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">Pazar yeri entegrasyonu ve aktif ürün listesi ayarlarını yönetin.</p>
                        <Button asChild variant="outline" className="w-full">
                            <Link href="/ngo-admin/ecommerce">
                                <ShoppingCart className="mr-2 h-4 w-4" /> Mağaza Paneline Git
                            </Link>
                        </Button>
                    </CardContent>
                )}
            </Card>

            {/* 8. Haberler ve Duyurular */}
            <Card className={cn(!sections.news && "opacity-60")}>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 rounded-xl bg-muted">
                            <Newspaper className="h-6 w-6 text-primary" />
                        </div>
                        <div className="space-y-1">
                            <CardTitle className="text-lg">Haberler ve Duyurular</CardTitle>
                            <CardDescription>Mini Blog içeriklerini yayına alın.</CardDescription>
                        </div>
                    </div>
                    <Switch 
                        checked={sections.news} 
                        onCheckedChange={() => toggleSection('news')}
                        className="data-[state=checked]:bg-green-600" 
                    />
                </CardHeader>
                {sections.news && (
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Listelenecek Haber Sayısı</Label>
                            <Select defaultValue="3">
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="3">Son 3 Haber</SelectItem>
                                    <SelectItem value="6">Son 6 Haber</SelectItem>
                                    <SelectItem value="9">Son 9 Haber</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <Button asChild variant="outline" className="w-full">
                            <Link href="/ngo-admin/posts">
                                <Megaphone className="mr-2 h-4 w-4" /> Mini Blog Sayfasına Git
                            </Link>
                        </Button>
                    </CardContent>
                )}
            </Card>

            {/* 16. Yönetim Kurulu / Ekibimiz (YENİ) */}
            <Card className={cn(!sections.board && "opacity-60")}>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 rounded-xl bg-muted">
                            <Users className="h-6 w-6 text-primary" />
                        </div>
                        <div className="space-y-1">
                            <CardTitle className="text-lg">Yönetim Kurulu & Ekibimiz</CardTitle>
                            <CardDescription>Kuruluş yetkililerini web sitesinde tanıtın.</CardDescription>
                        </div>
                    </div>
                    <Switch 
                        checked={sections.board} 
                        onCheckedChange={() => toggleSection('board')}
                        className="data-[state=checked]:bg-green-600" 
                    />
                </CardHeader>
                {sections.board && (
                    <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">Yetkili listesi ve görev tanımlarını yönetin.</p>
                        <Button asChild variant="outline" className="w-full">
                            <Link href="/ngo-admin/users">
                                <Users className="mr-2 h-4 w-4" /> Yetkilileri Yönet
                            </Link>
                        </Button>
                    </CardContent>
                )}
            </Card>

            {/* 17. Destekçi Markalar (YENİ) */}
            <Card className={cn(!sections.partners && "opacity-60")}>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 rounded-xl bg-muted">
                            <Handshake className="h-6 w-6 text-primary" />
                        </div>
                        <div className="space-y-1">
                            <CardTitle className="text-lg">Destekçi Markalar</CardTitle>
                            <CardDescription>Sizi destekleyen iş ortaklarınızın logolarını listeleyin.</CardDescription>
                        </div>
                    </div>
                    <Switch 
                        checked={sections.partners} 
                        onCheckedChange={() => toggleSection('partners')}
                        className="data-[state=checked]:bg-green-600" 
                    />
                </CardHeader>
                {sections.partners && (
                    <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">Pazarlama ve görünürlük ayarlarından destekçi marka listesini güncelleyin.</p>
                        <Button asChild variant="outline" className="w-full">
                            <Link href="/ngo-admin/marketing">
                                <Target className="mr-2 h-4 w-4" /> Partnerleri Yönet
                            </Link>
                        </Button>
                    </CardContent>
                )}
            </Card>

            {/* 9. Küresel Amaçlar (SKA) */}
            <Card className={cn(!sections.sdg && "opacity-60")}>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 rounded-xl bg-muted">
                            <Target className="h-6 w-6 text-primary" />
                        </div>
                        <div className="space-y-1">
                            <CardTitle className="text-lg">Küresel Amaçlar (SKA)</CardTitle>
                            <CardDescription>Desteklediğiniz 17 amacı web sitenizde listeleyin.</CardDescription>
                        </div>
                    </div>
                    <Switch 
                        checked={sections.sdg} 
                        onCheckedChange={() => toggleSection('sdg')}
                        className="data-[state=checked]:bg-green-600" 
                    />
                </CardHeader>
                {sections.sdg && (
                    <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">SKA seçimlerinizi profilinizden yönetebilirsiniz.</p>
                        <Button asChild variant="outline" className="w-full">
                            <Link href="/ngo-admin/manage-profile">
                                <Target className="mr-2 h-4 w-4" /> SKA Hedeflerini Düzenle
                            </Link>
                        </Button>
                    </CardContent>
                )}
            </Card>

            {/* 10. Şeffaflık Endeksi */}
            <Card className={cn(!sections.transparency && "opacity-60")}>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 rounded-xl bg-muted">
                            <Shield className="h-6 w-6 text-primary" />
                        </div>
                        <div className="space-y-1">
                            <CardTitle className="text-lg">Şeffaflık Endeksi</CardTitle>
                            <CardDescription>Güven puanınızı ve belgelerinizi gösterin.</CardDescription>
                        </div>
                    </div>
                    <Switch 
                        checked={sections.transparency} 
                        onCheckedChange={() => toggleSection('transparency')}
                        className="data-[state=checked]:bg-green-600" 
                    />
                </CardHeader>
                {sections.transparency && (
                    <CardContent className="space-y-6">
                        <div className="space-y-4">
                            <Label className="text-sm font-bold">Yayınlanacak Belgeleri Onayla</Label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {transparencyDocs.map(doc => (
                                    <div key={doc.id} className="flex items-center space-x-2 p-2.5 border rounded-xl bg-muted/10 hover:bg-muted/30 transition-colors">
                                        <Checkbox id={`pub-doc-${doc.id}`} defaultChecked />
                                        <Label htmlFor={`pub-doc-${doc.id}`} className="text-xs font-medium cursor-pointer">{doc.label}</Label>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <Button asChild variant="outline" className="w-full">
                            <Link href="/ngo-admin/transparency">
                                <ShieldCheck className="mr-2 h-4 w-4" /> Belgeleri Profilde Güncelle
                            </Link>
                        </Button>
                    </CardContent>
                )}
            </Card>

            {/* 11. İletişim Bilgileri */}
            <Card className={cn(!sections.contact && "opacity-60")}>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 rounded-xl bg-muted">
                            <Phone className="h-6 w-6 text-primary" />
                        </div>
                        <div className="space-y-1">
                            <CardTitle className="text-lg">İletişim Bilgileri</CardTitle>
                            <CardDescription>İletişim kanallarını yapılandırın.</CardDescription>
                        </div>
                    </div>
                    <Switch 
                        checked={sections.contact} 
                        onCheckedChange={() => toggleSection('contact')}
                        className="data-[state=checked]:bg-green-600" 
                    />
                </CardHeader>
                {sections.contact && (
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="flex items-center space-x-2 p-3 border rounded-xl">
                                <Checkbox id="show-phone" defaultChecked />
                                <Label htmlFor="show-phone">Telefon</Label>
                            </div>
                            <div className="flex items-center space-x-2 p-3 border rounded-xl">
                                <Checkbox id="show-email" defaultChecked />
                                <Label htmlFor="show-email">E-posta</Label>
                            </div>
                            <div className="flex items-center space-x-2 p-3 border rounded-xl">
                                <Checkbox id="show-address" defaultChecked />
                                <Label htmlFor="show-address">Adres</Label>
                            </div>
                            <div className="flex items-center space-x-2 p-3 border rounded-xl">
                                <Checkbox id="show-social" defaultChecked />
                                <Label htmlFor="show-social">Sosyal Medya</Label>
                            </div>
                        </div>
                        <Button asChild variant="outline" className="w-full">
                            <Link href="/ngo-admin/manage-profile">
                                <Settings2 className="mr-2 h-4 w-4" /> İletişim Bilgilerini Düzenle
                            </Link>
                        </Button>
                    </CardContent>
                )}
            </Card>

            {/* 12. Alan Adı Ayarları */}
            <Card className={cn(!sections.domain && "opacity-60")}>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 rounded-xl bg-muted">
                            <Globe className="h-6 w-6 text-primary" />
                        </div>
                        <div className="space-y-1">
                            <CardTitle className="text-lg">Alan Adı (Domain) Ayarları</CardTitle>
                            <CardDescription>Web sitenizi markanıza bağlayın.</CardDescription>
                        </div>
                    </div>
                    <Switch 
                        checked={sections.domain} 
                        onCheckedChange={() => toggleSection('domain')}
                        className="data-[state=checked]:bg-green-600" 
                    />
                </CardHeader>
                {sections.domain && (
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="domain-name">Alan Adınız</Label>
                                <Input 
                                    id="domain-name" 
                                    placeholder="kurulusunuz.org" 
                                    value={domainName} 
                                    onChange={(e) => setDomainName(e.target.value)} 
                                />
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
                )}
            </Card>

            {/* 13. Web Analiz Araçları */}
            <Card className={cn(!sections.analytics && "opacity-60")}>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 rounded-xl bg-muted">
                            <Code className="h-6 w-6 text-primary" />
                        </div>
                        <div className="space-y-1">
                            <CardTitle className="text-lg">Web Analiz Araçları</CardTitle>
                            <CardDescription>Takip kodlarını sitenize entegre edin.</CardDescription>
                        </div>
                    </div>
                    <Switch 
                        checked={sections.analytics} 
                        onCheckedChange={() => toggleSection('analytics')}
                        className="data-[state=checked]:bg-green-600" 
                    />
                </CardHeader>
                {sections.analytics && (
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {analyticsProviders.map((ap) => (
                                <div key={ap.id} className="p-3 border rounded-xl flex flex-col items-center gap-2 bg-muted/10">
                                    <span className="text-[10px] font-bold">{ap.name}</span>
                                    <Button variant="outline" size="sm" className="h-7 text-[10px] w-full" onClick={() => toast({title: `${ap.name} Bağlantısı`, description: "Entegrasyon penceresi açılıyor..."})}>Bağla</Button>
                                </div>
                            ))}
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase text-muted-foreground">Özel Script (Head/Body)</Label>
                            <Textarea 
                                className="font-mono text-[10px]" 
                                rows={5}
                                placeholder="<!-- Google Tag Manager, FB Pixel vb. -->"
                            />
                        </div>
                        <Button className="w-full" onClick={() => handleSave()}><Save className="mr-2 h-4 w-4"/> Kodları Kaydet</Button>
                    </CardContent>
                )}
            </Card>

            {/* Sabit Yayınla Paneli */}
            <div className="fixed bottom-6 inset-x-4 z-50 flex justify-center pointer-events-none">
                <Card className="bg-background/90 backdrop-blur-xl border-primary/20 shadow-2xl max-w-lg w-full pointer-events-auto">
                    <CardContent className="p-4 flex items-center justify-between gap-4">
                        <div className="text-left hidden sm:block">
                            <p className="font-bold text-sm">Site Yayınlanmaya Hazır</p>
                            <p className="text-[10px] text-muted-foreground">Son güncelleme: {lastUpdated || '--:--:--'}</p>
                        </div>
                        <Button 
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold h-12 rounded-xl"
                            disabled={isSaving}
                            onClick={async () => {
                                await handleSave(true);
                                toast({ title: "Siteniz Yayınlandı!", description: "Önizleme yeni sekmede açılıyor..." });
                                window.open(`/ngo-admin/website/preview?primary=${primaryColor.replace('#', '')}`, '_blank');
                            }}
                        >
                            {isSaving ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Globe className="mr-2 h-4 w-4" />
                            )}
                            Siteyi Yayınla ve Görüntüle
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
    