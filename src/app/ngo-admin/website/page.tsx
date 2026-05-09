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
    Megaphone, 
    HeartHandshake, 
    Newspaper, 
    Target, 
    Shield, 
    Settings2, 
    Save, 
    PlusCircle, 
    Landmark, 
    Info, 
    Phone, 
    MapPin, 
    Building2,
    ExternalLink,
    Loader2,
    Smartphone,
    Calendar,
    ShoppingCart,
    Trash2,
    Plus
} from 'lucide-react';
import React, { useState, useEffect, useMemo } from 'react';
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
import { useFirestore, useUser, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, doc, query, serverTimestamp, updateDoc, where } from 'firebase/firestore';

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

const REQUIRED_NS = ['ns1.hangel.org', 'ns2.hangel.org'];

async function checkDnsRecords(domain: string): Promise<{ ok: boolean; foundNS: string[]; error?: string }> {
    try {
        const res = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=NS`, { cache: 'no-store' });
        if (!res.ok) return { ok: false, foundNS: [], error: `DNS sorgusu başarısız: HTTP ${res.status}` };
        const data = await res.json();
        const answers: any[] = data?.Answer || [];
        const foundNS = answers
            .filter(a => a?.type === 2)
            .map(a => String(a.data || '').toLowerCase().replace(/\.$/, ''));
        const ok = REQUIRED_NS.every(ns => foundNS.some(found => found.endsWith(ns)));
        return { ok, foundNS };
    } catch (e: any) {
        return { ok: false, foundNS: [], error: e?.message || 'DNS sorgusu başarısız' };
    }
}

export default function WebsiteBuilderPage() {
    const router = useRouter();
    const { toast } = useToast();
    const db = useFirestore();
    const { user: authUser } = useUser();

    // Yönetici olduğu varlığı tespit et (NGO öncelikli)
    const adminNgosQ = useMemoFirebase(
        () => (db && authUser?.uid ? query(collection(db, 'ngos'), where('adminUserId', '==', authUser.uid)) : null),
        [db, authUser?.uid],
    );
    const { data: adminNgos } = useCollection<any>(adminNgosQ);
    const userDocRef = useMemoFirebase(
        () => (db && authUser?.uid ? doc(db, 'users', authUser.uid) : null),
        [db, authUser?.uid],
    );
    const { data: userData } = useDoc<any>(userDocRef);
    const fallbackNgoRef = useMemoFirebase(
        () => (db && userData?.managedNgoId ? doc(db, 'ngos', userData.managedNgoId) : null),
        [db, userData?.managedNgoId],
    );
    const { data: fallbackNgo } = useDoc<any>(fallbackNgoRef);

    const ngoData = useMemo(() => (adminNgos && adminNgos[0]) || fallbackNgo || null, [adminNgos, fallbackNgo]);
    const ngoId: string | null = ngoData?.id || null;

    // Website Section Visibility States
    const defaultSections = {
        domain: true,
        colors: true,
        banners: true,
        about: true,
        president: true,
        stats: true,
        donations: true,
        volunteering: true,
        events: true,
        ecommerce: false,
        news: true,
        sdg: true,
        transparency: true,
        contact: true,
        analytics: true,
    };
    const [sections, setSections] = useState(defaultSections);

    // Content States
    const [primaryColor, setPrimaryColor] = useState('#f34723');
    const [selectedRegistrar, setSelectedRegistrar] = useState('');
    const [domainName, setDomainName] = useState('');
    const [presidentName, setPresidentName] = useState('');
    const [presidentsMessage, setPresidentsMessage] = useState('');
    const [stats, setStats] = useState({ volunteers: '', donors: '', foundedYear: '', activeCampaigns: '' });
    const [isSaving, setIsSaving] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<string | null>(null);
    const [hydrated, setHydrated] = useState(false);

    // Banner State
    const [banners, setBanners] = useState<Array<{ id: string; url: string; isPrimary: boolean }>>([]);

    const MESSAGE_LIMIT = 1000;

    // NGO verisi gelince state'i hydrate et (yalnızca bir kere)
    useEffect(() => {
        if (!ngoData || hydrated) return;
        const s = ngoData.siteSettings || {};
        setSections(prev => ({ ...prev, ...(s.sections || {}) }));
        setPrimaryColor(s.primaryColor || ngoData.primaryColor || '#f34723');
        setSelectedRegistrar(s.registrar || '');
        setDomainName(s.domain || ngoData.website || '');
        setPresidentName(s.presidentName || ngoData.presidentName || '');
        setPresidentsMessage(s.presidentMessage || ngoData.presidentMessage || '');
        setStats({
            volunteers: String(s.stats?.volunteers ?? ngoData.stats?.volunteers ?? ''),
            donors: String(s.stats?.donors ?? ngoData.stats?.donors ?? ''),
            foundedYear: String(s.stats?.foundedYear ?? ngoData.foundedYear ?? ''),
            activeCampaigns: String(s.stats?.activeCampaigns ?? ngoData.stats?.activeCampaigns ?? ''),
        });
        if (Array.isArray(s.banners) && s.banners.length > 0) {
            setBanners(s.banners.map((b: any, i: number) => ({
                id: b.id || String(i + 1),
                url: b.url,
                isPrimary: !!b.isPrimary || i === 0,
            })));
        } else if (ngoData.coverUrl) {
            setBanners([{ id: '1', url: ngoData.coverUrl, isPrimary: true }]);
        }
        if (s.publishedAt) {
            try {
                const d = s.publishedAt.toDate ? s.publishedAt.toDate() : new Date(s.publishedAt);
                setLastUpdated(d.toLocaleTimeString('tr-TR'));
            } catch {}
        }
        setHydrated(true);
    }, [ngoData, hydrated]);

    const toggleSection = (key: keyof typeof defaultSections) => {
        setSections(prev => ({ ...prev, [key]: !prev[key] }));
        toast({
            title: "Görünüm Güncellendi",
            description: `${String(key).toUpperCase()} bölümü ${!sections[key] ? 'aktif' : 'pasif'} hale getirildi.`,
        });
    };

    const buildPayload = () => ({
        siteSettings: {
            domain: domainName.trim(),
            registrar: selectedRegistrar,
            primaryColor,
            presidentName: presidentName.trim(),
            presidentMessage: presidentsMessage.trim(),
            banners: banners.map(b => ({ id: b.id, url: b.url, isPrimary: b.isPrimary })),
            sections,
            stats: {
                volunteers: Number(stats.volunteers) || 0,
                donors: Number(stats.donors) || 0,
                foundedYear: Number(stats.foundedYear) || 0,
                activeCampaigns: Number(stats.activeCampaigns) || 0,
            },
            updatedAt: serverTimestamp(),
        },
    });

    const handleSave = async (silent = false) => {
        if (!db || !ngoId) {
            toast({ variant: 'destructive', title: 'Yönetici varlık bulunamadı', description: 'Kaydetmek için yönettiğiniz bir STK olmalı.' });
            return false;
        }
        setIsSaving(true);
        try {
            await updateDoc(doc(db, 'ngos', ngoId), buildPayload() as any);
            setLastUpdated(new Date().toLocaleTimeString('tr-TR'));
            if (!silent) {
                toast({ title: 'Tüm Değişiklikler Kaydedildi', description: 'Web siteniz güncel bilgilerle yayına hazır.' });
            }
            return true;
        } catch (err: any) {
            toast({ variant: 'destructive', title: 'Kaydedilemedi', description: err?.message || 'Beklenmeyen bir hata oluştu.' });
            return false;
        } finally {
            setIsSaving(false);
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

    const addBanner = () => {
        const newId = (banners.length + 1).toString();
        setBanners([...banners, { id: newId, url: `https://picsum.photos/seed/banner${newId}/1920/600`, isPrimary: false }]);
        toast({ title: "Yeni Banner Eklendi", description: "Listeye yeni bir görsel alanı tanımlandı." });
    };

    const removeBanner = (id: string) => {
        setBanners(prev => prev.filter(b => b.id !== id));
        toast({ variant: "destructive", title: "Banner Kaldırıldı" });
    };

    return (
        <div className="p-4 space-y-6 animate-in fade-in-0 max-w-5xl mx-auto pb-32">
            <Button onClick={() => router.back()} variant="ghost" size="icon" className="mb-2 -ml-2">
                <ArrowLeft className="h-6 w-6" />
            </Button>
            <div>
                <h1 className="text-2xl font-bold font-headline">Web Sitesi Yönetimi</h1>
                <p className="text-muted-foreground text-sm">
                    {ngoData?.name ? (
                        <><span className="font-semibold text-foreground">{ngoData.name}</span> için web sitesinin görünüm ve içerik ayarları.</>
                    ) : (
                        'Kuruluşunuza özel web sitesinin tüm görünüm ve içerik ayarlarını yönetin.'
                    )}
                </p>
            </div>

            <div className="space-y-6">
                
                {/* 1. Alan Adı (Domain) Ayarları */}
                <Card className={cn(!sections.domain && "opacity-60")}>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-2 rounded-lg bg-blue-500">
                                <Globe className="h-5 w-5 text-white" />
                            </div>
                            <div className="space-y-0.5">
                                <CardTitle className="text-lg">Alan Adı (Domain) Ayarları</CardTitle>
                                <CardDescription className="text-xs">Web sitenizi kurumsal markanıza bağlayın.</CardDescription>
                            </div>
                        </div>
                        <Switch 
                            checked={sections.domain} 
                            onCheckedChange={() => toggleSection('domain')}
                            className="data-[state=checked]:bg-green-600" 
                        />
                    </CardHeader>
                    {sections.domain && (
                        <CardContent className="space-y-6 pt-0">
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
                            <div className="p-4 border rounded-xl bg-indigo-50/50">
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
                                <p className="mt-3 text-xs text-indigo-900/80 leading-relaxed">
                                    Lütfen Domain sağlayıcınıza DNS bilgilerimizi kaydediniz. Yayına alma işlemi için NS kayıtlarının yukarıdaki değerlerle eşleşmesi gerekir.
                                </p>
                            </div>
                        </CardContent>
                    )}
                </Card>

                {/* 2. Kurumsal Renk Seçimi */}
                <Card className={cn(!sections.colors && "opacity-60")}>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-2 rounded-lg bg-gray-500">
                                <Palette className="h-5 w-5 text-white" />
                            </div>
                            <div className="space-y-0.5">
                                <CardTitle className="text-lg">Kurumsal Renk Seçimi</CardTitle>
                                <CardDescription className="text-xs">Sitenizin ana temasını belirleyecek kurumsal rengi seçin.</CardDescription>
                            </div>
                        </div>
                        <Switch 
                            checked={sections.colors} 
                            onCheckedChange={() => toggleSection('colors')}
                            className="data-[state=checked]:bg-green-600" 
                        />
                    </CardHeader>
                    {sections.colors && (
                        <CardContent className="space-y-6 pt-0">
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
                                    <p className="text-xs text-muted-foreground">Renk paletinden seçmek için tıklayın.</p>
                                </div>
                            </div>
                        </CardContent>
                    )}
                </Card>

                {/* 3. Görsel Yönetimi (Banner) */}
                <Card className={cn(!sections.banners && "opacity-60")}>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-2 rounded-lg bg-orange-500">
                                <ImageIcon className="h-5 w-5 text-white" />
                            </div>
                            <div className="space-y-0.5">
                                <CardTitle className="text-lg">Görsel Yönetimi (Banner)</CardTitle>
                                <CardDescription className="text-xs">Web sitesi ana sayfasında dönecek görselleri yönetin.</CardDescription>
                            </div>
                        </div>
                        <Switch 
                            checked={sections.banners} 
                            onCheckedChange={() => toggleSection('banners')}
                            className="data-[state=checked]:bg-green-600" 
                        />
                    </CardHeader>
                    {sections.banners && (
                        <CardContent className="space-y-6 pt-0">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {banners.map((banner, index) => (
                                    <div key={banner.id} className="relative group">
                                        <div className="relative aspect-[16/9] rounded-xl overflow-hidden border-2 border-primary/20 hover:border-primary transition-all shadow-sm">
                                            <img src={banner.url} alt={`Banner ${banner.id}`} className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity gap-2">
                                                <Button variant="secondary" size="sm" className="h-8 text-xs font-bold" onClick={() => toast({title: "Görsel Değiştir", description: "Dosya seçici açılıyor..."})}>
                                                    <ImageIcon className="mr-1.5 h-3.5 w-3.5"/> Değiştir
                                                </Button>
                                                {!banner.isPrimary && (
                                                    <Button variant="destructive" size="icon" className="h-8 w-8" onClick={() => removeBanner(banner.id)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                            <div className="absolute top-2 left-2 flex gap-1.5">
                                                {banner.isPrimary ? (
                                                    <Badge className="bg-primary text-[9px] font-black uppercase tracking-wider h-5 px-2 border-none">ANA BANNER</Badge>
                                                ) : (
                                                    <Badge variant="secondary" className="bg-white/90 text-foreground text-[9px] font-black uppercase tracking-wider h-5 px-2 border-none">SIRALAMA: {index + 1}</Badge>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                
                                <div 
                                    className="border-2 border-dashed rounded-xl aspect-[16/9] flex flex-col items-center justify-center gap-2 hover:bg-muted/50 transition-colors cursor-pointer group bg-muted/10"
                                    onClick={addBanner}
                                >
                                    <div className="p-2 rounded-full bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                                        <Plus className="h-6 w-6" />
                                    </div>
                                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground group-hover:text-primary">Yeni Banner Ekle</p>
                                </div>
                            </div>

                            <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 text-primary">
                                <p className="text-xs font-medium italic leading-relaxed">
                                    <span className="font-bold">Önerilen boyut:</span> 1920x600px. İlk banner ana sayfa kapak görseli (Hero) olarak kullanılır.
                                </p>
                            </div>
                        </CardContent>
                    )}
                </Card>

                {/* 4. Hakkımızda */}
                <Card className={cn(!sections.about && "opacity-60")}>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-2 rounded-lg bg-blue-400">
                                <Building2 className="h-5 w-5 text-white" />
                            </div>
                            <div className="space-y-0.5">
                                <CardTitle className="text-lg">Hakkımızda Bölümü</CardTitle>
                                <CardDescription className="text-xs">Kuruluş hikayesi ve misyon bilgilerini yönetin.</CardDescription>
                            </div>
                        </div>
                        <Switch 
                            checked={sections.about} 
                            onCheckedChange={() => toggleSection('about')}
                            className="data-[state=checked]:bg-green-600" 
                        />
                    </CardHeader>
                    {sections.about && (
                        <CardContent className="space-y-4 pt-0">
                            <p className="text-sm text-muted-foreground">Bu bölümdeki veriler kuruluş profilinizle senkronize çalışır.</p>
                            <Button asChild variant="outline" className="w-full">
                                <Link href="/ngo-admin/manage-profile">
                                    <ExternalLink className="mr-2 h-4 w-4" />
                                    Profilde Düzenle
                                </Link>
                            </Button>
                        </CardContent>
                    )}
                </Card>

                {/* 5. Başkanın Mesajı */}
                <Card className={cn(!sections.president && "opacity-60")}>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-2 rounded-lg bg-blue-500">
                                <MessageSquare className="h-5 w-5 text-white" />
                            </div>
                            <div className="space-y-0.5">
                                <CardTitle className="text-lg">Başkanın Mesajı</CardTitle>
                                <CardDescription className="text-xs">Web sitesi ana sayfasında yer alacak kurumsal mesaj.</CardDescription>
                            </div>
                        </div>
                        <Switch 
                            checked={sections.president} 
                            onCheckedChange={() => toggleSection('president')}
                            className="data-[state=checked]:bg-green-600" 
                        />
                    </CardHeader>
                    {sections.president && (
                        <CardContent className="space-y-4 pt-0">
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

                {/* 6. Kurumsal İstatistikler */}
                <Card className={cn(!sections.stats && "opacity-60")}>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-2 rounded-lg bg-indigo-500">
                                <BarChart3 className="h-5 w-5 text-white" />
                            </div>
                            <div className="space-y-0.5">
                                <CardTitle className="text-lg">Kurumsal İstatistikler</CardTitle>
                                <CardDescription className="text-xs">Web sitesinde gösterilecek sayaçları yönetin.</CardDescription>
                            </div>
                        </div>
                        <Switch 
                            checked={sections.stats} 
                            onCheckedChange={() => toggleSection('stats')}
                            className="data-[state=checked]:bg-green-600" 
                        />
                    </CardHeader>
                    {sections.stats && (
                        <CardContent className="space-y-6 pt-0">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Gönüllü Sayısı</Label>
                                    <Input type="number" value={stats.volunteers} onChange={e => setStats(s => ({ ...s, volunteers: e.target.value }))} placeholder="0" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Bağışçı Sayısı</Label>
                                    <Input type="number" value={stats.donors} onChange={e => setStats(s => ({ ...s, donors: e.target.value }))} placeholder="0" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Kuruluş Yılı</Label>
                                    <Input type="number" value={stats.foundedYear} onChange={e => setStats(s => ({ ...s, foundedYear: e.target.value }))} placeholder="2020" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Aktif Kampanya</Label>
                                    <Input type="number" value={stats.activeCampaigns} onChange={e => setStats(s => ({ ...s, activeCampaigns: e.target.value }))} placeholder="0" />
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button asChild variant="outline" className="flex-1">
                                    <Link href="/ngo-admin/dashboard"><BarChart3 className="mr-2 h-4 w-4" /> Veri Paneli</Link>
                                </Button>
                                <Button className="flex-1" onClick={() => handleSave()}>Verileri Güncelle</Button>
                            </div>
                        </CardContent>
                    )}
                </Card>

                {/* 7. Bağış Yöntemleri */}
                <Card className={cn(!sections.donations && "opacity-60")}>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-2 rounded-lg bg-green-600">
                                <Heart className="h-5 w-5 text-white" />
                            </div>
                            <div className="space-y-0.5">
                                <CardTitle className="text-lg">Bağış ve Destek Yöntemleri</CardTitle>
                                <CardDescription className="text-xs">Aktif bağış kanallarını yapılandırın.</CardDescription>
                            </div>
                        </div>
                        <Switch 
                            checked={sections.donations} 
                            onCheckedChange={() => toggleSection('donations')}
                            className="data-[state=checked]:bg-green-600" 
                        />
                    </CardHeader>
                    {sections.donations && (
                        <CardContent className="space-y-6 pt-0">
                            <div className="space-y-4">
                                <div className="p-4 border rounded-2xl bg-muted/10">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-bold">hangel ile Bağış</span>
                                        <Switch defaultChecked className="data-[state=checked]:bg-green-600" />
                                    </div>
                                </div>
                                <div className="p-4 border rounded-2xl bg-muted/10">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-bold">HelpSteps ile Bağış</span>
                                        <Switch defaultChecked className="data-[state=checked]:bg-green-600" />
                                    </div>
                                </div>
                                <div className="p-4 border rounded-2xl bg-muted/10 space-y-4">
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
                                            <Input placeholder="3406" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs">Anahtar Kelime</Label>
                                            <Input placeholder="AHBAP" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs">Operatör Seçimi</Label>
                                            <div className="flex flex-wrap gap-4 pt-1">
                                                <div className="flex items-center space-x-2"><Checkbox id="op-tr" defaultChecked /><Label htmlFor="op-tr" className="text-xs">Turkcell</Label></div>
                                                <div className="flex items-center space-x-2"><Checkbox id="op-vd" defaultChecked /><Label htmlFor="op-vd" className="text-xs">Vodafone</Label></div>
                                                <div className="flex items-center space-x-2"><Checkbox id="op-tt" defaultChecked /><Label htmlFor="op-tt" className="text-xs">T.Telekom</Label></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-4 border rounded-2xl bg-muted/10">
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

                {/* 8. Gönüllülük İlanları */}
                <Card className={cn(!sections.volunteering && "opacity-60")}>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-2 rounded-lg bg-red-500">
                                <HeartHandshake className="h-5 w-5 text-white" />
                            </div>
                            <div className="space-y-0.5">
                                <CardTitle className="text-lg">Gönüllülük İlanları</CardTitle>
                                <CardDescription className="text-xs">İlanların web sitesindeki görünümünü yönetin.</CardDescription>
                            </div>
                        </div>
                        <Switch 
                            checked={sections.volunteering} 
                            onCheckedChange={() => toggleSection('volunteering')}
                            className="data-[state=checked]:bg-green-600" 
                        />
                    </CardHeader>
                    {sections.volunteering && (
                        <CardContent className="space-y-4 pt-0">
                            <div className="space-y-3 p-3 border rounded-xl bg-muted/5">
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

                {/* 9. Etkinlik Takvimi */}
                <Card className={cn(!sections.events && "opacity-60")}>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-2 rounded-lg bg-rose-500">
                                <Calendar className="h-5 w-5 text-white" />
                            </div>
                            <div className="space-y-0.5">
                                <CardTitle className="text-lg">Etkinlik Takvimi</CardTitle>
                                <CardDescription className="text-xs">Web sitesinde yaklaşan etkinliklerinizi listeleyin.</CardDescription>
                            </div>
                        </div>
                        <Switch 
                            checked={sections.events} 
                            onCheckedChange={() => toggleSection('events')}
                            className="data-[state=checked]:bg-green-600" 
                        />
                    </CardHeader>
                    {sections.events && (
                        <CardContent className="space-y-4 pt-0">
                            <p className="text-sm text-muted-foreground">Etkinlikleriniz ve takvim verileriniz buradan yönetilir.</p>
                            <Button asChild variant="outline" className="w-full">
                                <Link href="/ngo-admin/events">
                                    <ExternalLink className="mr-2 h-4 w-4" /> Etkinlikleri Yönet
                                </Link>
                            </Button>
                        </CardContent>
                    )}
                </Card>

                {/* 10. İktisadi İşletme Mağazası */}
                <Card className={cn(!sections.ecommerce && "opacity-60")}>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-2 rounded-lg bg-violet-500">
                                <ShoppingCart className="h-5 w-5 text-white" />
                            </div>
                            <div className="space-y-0.5">
                                <CardTitle className="text-lg">İktisadi İşletme Mağazası</CardTitle>
                                <CardDescription className="text-xs">Ürünlerinizi web sitesi vitrininde sergileyin.</CardDescription>
                            </div>
                        </div>
                        <Switch 
                            checked={sections.ecommerce} 
                            onCheckedChange={() => toggleSection('ecommerce')}
                            className="data-[state=checked]:bg-green-600" 
                        />
                    </CardHeader>
                    {sections.ecommerce && (
                        <CardContent className="space-y-4 pt-0">
                            <p className="text-sm text-muted-foreground">Pazar yeri entegrasyonu ve aktif ürün listesini yönetin.</p>
                            <Button asChild variant="outline" className="w-full">
                                <Link href="/ngo-admin/ecommerce">
                                    <ShoppingCart className="mr-2 h-4 w-4" /> Mağaza Paneline Git
                                </Link>
                            </Button>
                        </CardContent>
                    )}
                </Card>

                {/* 11. Haberler ve Duyurular */}
                <Card className={cn(!sections.news && "opacity-60")}>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-2 rounded-lg bg-orange-500">
                                <Newspaper className="h-5 w-5 text-white" />
                            </div>
                            <div className="space-y-0.5">
                                <CardTitle className="text-lg">Haberler ve Duyurular</CardTitle>
                                <CardDescription className="text-xs">Mini Blog içeriklerini yayına alın.</CardDescription>
                            </div>
                        </div>
                        <Switch 
                            checked={sections.news} 
                            onCheckedChange={() => toggleSection('news')}
                            className="data-[state=checked]:bg-green-600" 
                        />
                    </CardHeader>
                    {sections.news && (
                        <CardContent className="space-y-4 pt-0">
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

                {/* 12. Küresel Amaçlar (SKA) */}
                <Card className={cn(!sections.sdg && "opacity-60")}>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-2 rounded-lg bg-red-600">
                                <Target className="h-5 w-5 text-white" />
                            </div>
                            <div className="space-y-0.5">
                                <CardTitle className="text-lg">Küresel Amaçlar (SKA)</CardTitle>
                                <CardDescription className="text-xs">Desteklediğiniz 17 amacı web sitenizde listeleyin.</CardDescription>
                            </div>
                        </div>
                        <Switch 
                            checked={sections.sdg} 
                            onCheckedChange={() => toggleSection('sdg')}
                            className="data-[state=checked]:bg-green-600" 
                        />
                    </CardHeader>
                    {sections.sdg && (
                        <CardContent className="space-y-4 pt-0">
                            <p className="text-sm text-muted-foreground">SKA seçimlerinizi profilinizden yönetebilirsiniz.</p>
                            <Button asChild variant="outline" className="w-full">
                                <Link href="/ngo-admin/manage-profile">
                                    <Target className="mr-2 h-4 w-4" /> SKA Hedeflerini Düzenle
                                </Link>
                            </Button>
                        </CardContent>
                    )}
                </Card>

                {/* 13. Şeffaflık Endeksi */}
                <Card className={cn(!sections.transparency && "opacity-60")}>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-2 rounded-lg bg-green-600">
                                <Shield className="h-5 w-5 text-white" />
                            </div>
                            <div className="space-y-0.5">
                                <CardTitle className="text-lg">Şeffaflık Endeksi</CardTitle>
                                <CardDescription className="text-xs">Güven puanınızı ve belgelerinizi gösterin.</CardDescription>
                            </div>
                        </div>
                        <Switch 
                            checked={sections.transparency} 
                            onCheckedChange={() => toggleSection('transparency')}
                            className="data-[state=checked]:bg-green-600" 
                        />
                    </CardHeader>
                    {sections.transparency && (
                        <CardContent className="space-y-6 pt-0">
                            <div className="space-y-4 p-3 border rounded-xl bg-muted/5">
                                <Label className="text-xs font-bold uppercase text-muted-foreground">Yayınlanacak Belgeleri Onayla</Label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {transparencyDocs.map(doc => (
                                        <div key={doc.id} className="flex items-center space-x-2 p-2.5 border rounded-xl bg-background hover:bg-muted/30 transition-colors">
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

                {/* 14. İletişim Bilgileri */}
                <Card className={cn(!sections.contact && "opacity-60")}>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-2 rounded-lg bg-gray-500">
                                <Phone className="h-5 w-5 text-white" />
                            </div>
                            <div className="space-y-0.5">
                                <CardTitle className="text-lg">İletişim Bilgileri</CardTitle>
                                <CardDescription className="text-xs">İletişim kanallarını yapılandırın.</CardDescription>
                            </div>
                        </div>
                        <Switch 
                            checked={sections.contact} 
                            onCheckedChange={() => toggleSection('contact')}
                            className="data-[state=checked]:bg-green-600" 
                        />
                    </CardHeader>
                    {sections.contact && (
                        <CardContent className="space-y-4 pt-0">
                            <div className="grid grid-cols-2 gap-3 p-3 border rounded-xl bg-muted/5">
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="show-phone" defaultChecked />
                                    <Label htmlFor="show-phone" className="text-xs">Telefon</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="show-email" defaultChecked />
                                    <Label htmlFor="show-email" className="text-xs">E-posta</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="show-address" defaultChecked />
                                    <Label htmlFor="show-address" className="text-xs">Adres</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="show-social" defaultChecked />
                                    <Label htmlFor="show-social" className="text-xs">Sosyal Medya</Label>
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

                {/* 15. Web Analiz Araçları */}
                <Card className={cn(!sections.analytics && "opacity-60")}>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-2 rounded-lg bg-sky-500">
                                <Code className="h-5 w-5 text-white" />
                            </div>
                            <div className="space-y-0.5">
                                <CardTitle className="text-lg">Web Analiz Araçları</CardTitle>
                                <CardDescription className="text-xs">Takip kodlarını sitenize entegre edin.</CardDescription>
                            </div>
                        </div>
                        <Switch 
                            checked={sections.analytics} 
                            onCheckedChange={() => toggleSection('analytics')}
                            className="data-[state=checked]:bg-green-600" 
                        />
                    </CardHeader>
                    {sections.analytics && (
                        <CardContent className="space-y-6 pt-0">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                {analyticsProviders.map((ap) => (
                                    <div key={ap.id} className="p-3 border rounded-xl flex flex-col items-center gap-2 bg-muted/10">
                                        <span className="text-[10px] font-bold">{ap.name}</span>
                                        <Button variant="outline" size="sm" className="h-7 text-[10px] w-full" onClick={() => toast({title: `${ap.name} Bağlantısı`})}>Bağla</Button>
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

            </div>

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
                            disabled={isSaving || isVerifying}
                            onClick={async () => {
                                if (!ngoId) {
                                    toast({ variant: 'destructive', title: 'Yönetici varlık bulunamadı' });
                                    return;
                                }
                                if (!domainName.trim()) {
                                    toast({ variant: 'destructive', title: 'Alan adı eksik', description: 'Yayına almak için Alan Adınızı girin.' });
                                    return;
                                }
                                // 1) DNS doğrulaması
                                setIsVerifying(true);
                                const dns = await checkDnsRecords(domainName.trim());
                                setIsVerifying(false);
                                if (!dns.ok) {
                                    toast({
                                        variant: 'destructive',
                                        title: 'DNS doğrulanamadı',
                                        description: dns.error
                                            ? dns.error
                                            : `Alan adınızın NS kayıtları henüz ns1.hangel.org / ns2.hangel.org değerlerini göstermiyor. Bulunan: ${dns.foundNS.join(', ') || 'kayıt yok'}.`,
                                    });
                                    return;
                                }
                                // 2) Verileri kaydet ve yayın bilgisini ekle
                                setIsSaving(true);
                                try {
                                    await updateDoc(doc(db!, 'ngos', ngoId), {
                                        ...buildPayload(),
                                        'siteSettings.published': true,
                                        'siteSettings.publishedAt': serverTimestamp(),
                                        'siteSettings.dnsVerified': true,
                                        'siteSettings.dnsVerifiedAt': serverTimestamp(),
                                    } as any);
                                    setLastUpdated(new Date().toLocaleTimeString('tr-TR'));
                                    toast({ title: 'Siteniz Yayınlandı!', description: 'DNS doğrulandı, içerikler kaydedildi. Önizleme yeni sekmede açılıyor...' });
                                    window.open(`/ngo-admin/website/preview?primary=${primaryColor.replace('#', '')}&id=${ngoId}`, '_blank');
                                } catch (err: any) {
                                    toast({ variant: 'destructive', title: 'Yayınlama başarısız', description: err?.message || 'Beklenmeyen bir hata oluştu.' });
                                } finally {
                                    setIsSaving(false);
                                }
                            }}
                        >
                            {isVerifying ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> DNS doğrulanıyor…</>
                            ) : isSaving ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Yayınlanıyor…</>
                            ) : (
                                <><Globe className="mr-2 h-4 w-4" /> Siteyi Yayınla ve Görüntüle</>
                            )}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
