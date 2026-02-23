'use client';

import React, { useState, Suspense, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
    ArrowLeft, 
    Upload, 
    Plus, 
    X, 
    Instagram, 
    Facebook, 
    Linkedin, 
    Twitter, 
    Youtube, 
    Link as LinkIcon, 
    Search, 
    Sparkles, 
    Building, 
    HandCoins, 
    HeartHandshake, 
    Info, 
    ShieldCheck, 
    UserPlus, 
    LogIn, 
    Loader2,
    Landmark,
    Building2
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { marketCategories, allUniversities, provincialDirectorates } from '@/lib/data';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { HangelLogo } from '@/components/icons';

// --- Shared Constants & Data ---
const allProvinces = ["Adana", "Adıyaman", "Afyonkarahisar", "Ağrı", "Aksaray", "Amasya", "Ankara", "Antalya", "Ardahan", "Artvin", "Aydın", "Balıkesir", "Bartın", "Batman", "Bayburt", "Bilecik", "Bingöl", "Bitlis", "Bolu", "Burdur", "Bursa", "Çanakkale", "Çankırı", "Çorum", "Denizli", "Diyarbakır", "Düzce", "Edirne", "Elazığ", "Erzincan", "Erzurum", "Eskişehir", "Gaziantep", "Giresun", "Gümüşhane", "Hakkari", "Hatay", "Iğdır", "Isparta", "İstanbul", "İzmir", "Kahramanmaraş", "Karabük", "Karaman", "Kars", "Kastamonu", "Kayseri", "Kırıkkale", "Kırklareli", "Kırşehir", "Kilis", "Kocaeli", "Konya", "Kütahya", "Malatya", "Manisa", "Mardin", "Mersin", "Muğla", "Muş", "Nevşehir", "Niğde", "Ordu", "Osmaniye", "Rize", "Sakarya", "Samsun", "Siirt", "Sinop", "Sivas", "Şanlıurfa", "Şırnak", "Tekirdağ", "Tokat", "Trabzon", "Tunceli", "Uşak", "Van", "Yalova", "Yozgat", "Zonguldak"];

const districts: { [key: string]: string[] } = {
    'Adana': ['Aladağ', 'Ceyhan', 'Çukurova', 'Feke', 'İmamoğlu', 'Karaisalı', 'Karataş', 'Kozan', 'Pozantı', 'Saimbeyli', 'Sarıçam', 'Seyhan', 'Tufanbeyli', 'Yumurtalık', 'Yüreğir'],
    'İstanbul': ['Adalar', 'Arnavutköy', 'Ataşehir', 'Avcılar', 'Bağcılar', 'Bahçelievler', 'Bakırköy', 'Başakşehir', 'Bayrampaşa', 'Beşiktaş', 'Beykoz', 'Beylikdüzü', 'Beyoğlu', 'Büyükçekmece', 'Çatalca', 'Çekmeköy', 'Esenler', 'Esenyurt', 'Eyüpsultan', 'Fatih', 'Gaziosmanpaşa', 'Güngören', 'Kadıköy', 'Kağıthane', 'Kartal', 'Küçükçekmece', 'Maltepe', 'Pendik', 'Sancaktepe', 'Sarıyer', 'Silivri', 'Sultanbeyli', 'Sultangazi', 'Şile', 'Şişli', 'Tuzla', 'Ümraniye', 'Üsküdar', 'Zeytinburnu'],
    'İzmir': ['Aliağa', 'Balçova', 'Bayındır', 'Bayraklı', 'Bergama', 'Beydağ', 'Bornova', 'Buca', 'Çeşme', 'Çiğli', 'Dikili', 'Foça', 'Gaziemir', 'Güzelbahçe', 'Karabağlar', 'Karaburun', 'Karşıyaka', 'Kemalpaşa', 'Kınık', 'Kiraz', 'Konak', 'Menderes', 'Menemen', 'Narlıdere', 'Ödemiş', 'Seferihisar', 'Selçuk', 'Tire', 'Torbalı', 'Urla'],
};

const neighborhoods: { [key: string]: string[] } = {
    'Kadıköy': ['Caferağa', 'Osmanağa', 'Rasimpaşa', 'Moda', 'Fenerbahçe', 'Eğitim', 'Göztepe', 'Merdivenköy', 'Bostancı', 'Caddebostan'],
};

const allBeneficiaries = ['Çocuklar', 'Hak mücadelesi verenler', 'Afetzedeler', 'Hayvanlar', 'Yaşlılar', 'Engelliler', 'Öğrenciler', 'Mülteciler', 'Gençler', 'Çevre', 'Aile', 'Bölgesel', 'İş Dünyası', 'Girişimciler'];
const allSdgs = ['1. Yoksulluğa Son', '2. Açlığa Son', '3. Sağlıklı ve Kaliteli Yaşam', '4. Nitelikli Eğitim', '5. Toplumsal Cinsiyet Eşitliği', '6. Temiz Su ve Sanitasyon', '7. Erişilebilir ve Temiz Enerji', '8. İnsana Yakışır İş ve Ekonomi Büyüme', '9. Sanayi, Yenilikçilik ve Altyapı', '10. Eşitsizliklerin Azaltılması', '11. Sürdürülebilir Şehirler ve Topluluklar', '12. Sorumlu Üretim ve Tüketim', '13. İklim Eylemi', '14. Sudaki Yaşam', '15. Karasal Yaşam', '16. Barış, Adalet ve Güçlü Kurumlar', '17. Amaçlar için Ortaklıklar'];

const marketCategoryLabels = marketCategories
    .filter(c => c.mainCategory !== 'Öne çıkanlar' && c.mainCategory !== 'Tümü')
    .map(c => c.mainCategory);

// --- Shared Components ---

const CheckboxGroup = ({ title, options }: { title: string, options: string[] }) => (
    <div className="space-y-3">
        <Label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">{title}</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 rounded-2xl border p-4 bg-background">
            {options.map(option => (
                <div key={option} className="flex items-center gap-2">
                    <Checkbox id={`${title.replace(/\s/g, '-')}-${option.replace(/\s/g, '-')}`} />
                    <Label htmlFor={`${title.replace(/\s/g, '-')}-${option.replace(/\s/g, '-')}`} className="text-xs font-medium cursor-pointer leading-none">{option}</Label>
                </div>
            ))}
        </div>
    </div>
);

const FileUpload = ({label, accept, hint}: {label: string, accept?: string, hint?: string}) => (
    <div className="space-y-2">
        <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{label}</Label>
        <div className="flex items-center gap-4 p-4 border rounded-2xl bg-muted/20 border-dashed border-primary/20">
            <Input id={`${label}-upload`} type="file" className="hidden" accept={accept} />
            <Button asChild variant="outline" size="sm" className="rounded-xl border-primary/20 hover:bg-primary/5">
                <label htmlFor={`${label}-upload`} className="cursor-pointer font-bold"><Upload className="mr-2 h-4 w-4" />Belge Seç</label>
            </Button>
            <div className="flex-1">
                <p className="text-[10px] text-muted-foreground leading-tight">{hint || "Lütfen resmi formatta bir dosya yükleyin."}</p>
            </div>
        </div>
    </div>
);

const SocialMediaFields = () => (
    <Card className="rounded-[2rem] overflow-hidden border-black/5 shadow-sm">
        <CardHeader className="bg-muted/30">
            <CardTitle className="text-lg">Sosyal Medya Hesapları</CardTitle>
            <CardDescription className="text-xs">Topluluğunuzun size ulaşabileceği kurumsal linkleri ekleyin.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
            <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Instagram</Label>
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-pink-50 text-pink-600 rounded-lg"><Instagram className="h-4 w-4" /></div>
                    <Input placeholder="instagram.com/kurumadiniz" className="rounded-xl" />
                </div>
            </div>
            <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">X (Twitter)</Label>
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-slate-900 text-white rounded-lg"><Twitter className="h-4 w-4" /></div>
                    <Input placeholder="x.com/kurumadiniz" className="rounded-xl" />
                </div>
            </div>
            <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">LinkedIn</Label>
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Linkedin className="h-4 w-4" /></div>
                    <Input placeholder="linkedin.com/company/kurumadiniz" className="rounded-xl" />
                </div>
            </div>
        </CardContent>
    </Card>
);

const AddressFields = ({ city, setCity, district, setDistrict, neighborhood, setNeighborhood }: any) => (
    <Card className="rounded-[2rem] overflow-hidden border-black/5 shadow-sm">
        <CardHeader className="bg-muted/30"><CardTitle className="text-lg">İletişim & Adres</CardTitle></CardHeader>
        <CardContent className="space-y-4 pt-6">
            <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Resmi E-posta</Label>
                <Input type="email" placeholder="iletisim@kurulusadiniz.org" required className="rounded-xl h-11" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">İl</Label>
                    <Select value={city} onValueChange={(val) => { setCity(val); setDistrict(''); setNeighborhood(''); }}>
                        <SelectTrigger className="rounded-xl"><SelectValue placeholder="Seç" /></SelectTrigger>
                        <SelectContent>
                            {allProvinces.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">İlçe</Label>
                    <Select value={district} onValueChange={(val) => { setDistrict(val); setNeighborhood(''); }} disabled={!city}>
                        <SelectTrigger className="rounded-xl"><SelectValue placeholder="Seç" /></SelectTrigger>
                        <SelectContent>
                            {city && (districts[city] || []).map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Mahalle</Label>
                    <Select value={neighborhood} onValueChange={setNeighborhood} disabled={!district}>
                        <SelectTrigger className="rounded-xl"><SelectValue placeholder="Seç" /></SelectTrigger>
                        <SelectContent>
                            {district && (neighborhoods[district] || ['Merkez', 'Cumhuriyet', 'Hürriyet']).map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Açık Adres</Label>
                <Input placeholder="Sokak, kapı no, kat..." className="rounded-xl h-11" />
            </div>
        </CardContent>
    </Card>
);

const NgoForm = () => {
    const [city, setCity] = useState('');
    const [district, setDistrict] = useState('');
    const [neighborhood, setNeighborhood] = useState('');
    const [aboutText, setAboutText] = useState("");
    const ABOUT_LIMIT = 1000;
    return (
        <div className='space-y-6'>
            <Card className="rounded-[2rem] overflow-hidden border-black/5 shadow-sm">
                <CardHeader className="bg-muted/30">
                    <CardTitle className="text-lg">Kuruluş Kimliği</CardTitle>
                    <CardDescription className="text-xs">Sivil toplum kuruluşunuzun temel bilgilerini sağlayın.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Kuruluş Adı (Resmi)</Label>
                        <Input placeholder="Kuruluşunuzun tam adı" required className="rounded-xl h-11" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Kısa Ad / Kısaltma</Label>
                            <Input placeholder="Örn: AHBAP" className="rounded-xl h-11" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Kuruluş Yılı</Label>
                            <Input type="number" placeholder="Örn: 2017" className="rounded-xl h-11" />
                        </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Tüzel Kişilik Türü</Label>
                      <Select>
                        <SelectTrigger className="rounded-xl"><SelectValue placeholder="Seçiniz..." /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="dernek">Dernek</SelectItem>
                          <SelectItem value="vakif">Vakıf</SelectItem>
                          <SelectItem value="spor">Spor Kulübü</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Misyon ve Vizyon Özeti</Label>
                            <span className={cn("text-[9px] font-bold", aboutText.length > ABOUT_LIMIT ? "text-destructive" : "text-muted-foreground")}>
                                {aboutText.length} / {ABOUT_LIMIT}
                            </span>
                        </div>
                        <Textarea 
                            value={aboutText} 
                            onChange={(e) => setAboutText(e.target.value)} 
                            maxLength={ABOUT_LIMIT} 
                            placeholder="Kuruluşunuzu ve etki alanınızı anlatan kısa bir metin." 
                            className="min-h-[120px] rounded-2xl p-4"
                        />
                    </div>
                </CardContent>
            </Card>
            <CheckboxGroup title="Faydalanıcı Odak Grupları" options={allBeneficiaries} />
            <CheckboxGroup title="BM 17 Sürdürülebilir Kalkınma Amacı (SKA)" options={allSdgs} />
            <AddressFields city={city} setCity={setCity} district={district} setDistrict={setDistrict} neighborhood={neighborhood} setNeighborhood={setNeighborhood} />
            <SocialMediaFields />
            <Card className="rounded-[2rem] overflow-hidden border-black/5 shadow-sm">
                <CardHeader className="bg-muted/30">
                    <CardTitle className="text-lg">Yasal Doğrulama</CardTitle>
                    <CardDescription className="text-xs">Şeffaflık Endeksi onayı için gerekli belgeler.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                    <FileUpload label="Resmi Logo" accept=".jpg,.jpeg,.png" hint="Profilinizde görünecek kurumsal logo." />
                    <FileUpload label="Güncel Faaliyet Belgesi" accept=".pdf" hint="Son 6 ay içinde alınmış resmi belge." />
                    <FileUpload label="Tüzük / Vakıf Senedi" accept=".pdf" hint="Kuruluşun resmi tüzük dökümanı." />
                </CardContent>
            </Card>
        </div>
    )
};

const BrandForm = () => {
    const [city, setCity] = useState('');
    const [district, setDistrict] = useState('');
    const [neighborhood, setNeighborhood] = useState('');
    const [donationRates, setDonationRates] = useState([{ category: '', rate: '' }]);
    const [ecommerceInfra, setEcommerceInfra] = useState('');

    const addDonationRate = () => setDonationRates([...donationRates, { category: '', rate: '' }]);
    const removeDonationRate = (index: number) => {
      if (donationRates.length > 1) {
          setDonationRates(donationRates.filter((_, i) => i !== index));
      }
    };
    const updateDonationRate = (index: number, field: 'category' | 'rate', value: string) => {
        const updated = [...donationRates];
        updated[index][field] = value;
        setDonationRates(updated);
    };

    return (
        <div className="space-y-6">
            <Card className="rounded-[2rem] overflow-hidden border-black/5 shadow-sm">
                <CardHeader className="bg-muted/30">
                    <CardTitle className="text-lg">Marka & İşletme Bilgileri</CardTitle>
                    <CardDescription className="text-xs">Mağazanızın platformdaki görünümü için gerekli bilgiler.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Mağaza / Marka Adı</Label>
                        <Input placeholder="Markanızın adı" required className="rounded-xl h-11" />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">İşletme Türü</Label>
                        <Select required>
                            <SelectTrigger className="rounded-xl"><SelectValue placeholder="Marka türünü seçin..." /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="brand">Ticari Şirket</SelectItem>
                                <SelectItem value="cooperative">Kooperatif</SelectItem>
                                <SelectItem value="social">Sosyal Şirket</SelectItem>
                                <SelectItem value="economic">İktisadi İşletme</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Kurumsal Web Sitesi</Label>
                        <Input placeholder="https://marka.com" className="rounded-xl h-11" />
                    </div>
                    <FileUpload label="Marka Logosu" accept=".jpg,.jpeg,.png" hint="Market sayfasında görünecek görsel." />
                    
                    <div className="space-y-4 border-t pt-6">
                        <Label className="text-sm font-bold">Kategori Bazlı Bağış Taahhüdü (%)</Label>
                        <p className="text-xs text-muted-foreground">Satışlarınızdan STK'lara aktarılacak ortalama bağış oranlarını belirleyin.</p>
                        <div className="space-y-3">
                            {donationRates.map((item, index) => (
                                <div key={index} className="flex gap-2 items-end">
                                    <div className="flex-1 space-y-1">
                                        <Label className="text-[9px] uppercase font-black text-muted-foreground/60">Kategori</Label>
                                        <Select value={item.category} onValueChange={(val) => updateDonationRate(index, 'category', val)}>
                                            <SelectTrigger className="rounded-xl h-10"><SelectValue placeholder="Seçiniz" /></SelectTrigger>
                                            <SelectContent>
                                                {marketCategoryLabels.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="w-24 space-y-1">
                                        <Label className="text-[9px] uppercase font-black text-muted-foreground/60">Oran (%)</Label>
                                        <Input type="number" placeholder="5" value={item.rate} onChange={(e) => updateDonationRate(index, 'rate', e.target.value)} className="rounded-xl h-10" />
                                    </div>
                                    <Button type="button" variant="ghost" size="icon" className="text-destructive h-10 w-10 hover:bg-destructive/10 rounded-xl" onClick={() => removeDonationRate(index)} disabled={donationRates.length === 1}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                        <Button type="button" variant="outline" size="sm" className="w-full mt-2 rounded-xl font-bold border-dashed" onClick={addDonationRate}>
                            <Plus className="mr-2 h-4 w-4" /> Yeni Kategori Ekle
                        </Button>
                    </div>
                </CardContent>
            </Card>
            <Card className="rounded-[2rem] overflow-hidden border-black/5 shadow-sm">
                 <CardHeader className="bg-muted/30">
                    <CardTitle className="text-lg">Affiliate & E-Ticaret</CardTitle>
                    <CardDescription className="text-xs">Bağışların otomatik hesaplanması için entegrasyon ayarları.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">E-ticaret Altyapısı</Label>
                        <Select value={ecommerceInfra} onValueChange={setEcommerceInfra}>
                            <SelectTrigger className="rounded-xl h-11"><SelectValue placeholder="Altyapı seçin..." /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="shopify">Shopify</SelectItem>
                                <SelectItem value="woocommerce">WooCommerce</SelectItem>
                                <SelectItem value="ticimax">Ticimax</SelectItem>
                                <SelectItem value="ikas">Ikas</SelectItem>
                                <SelectItem value="tsoft">Tsoft</SelectItem>
                                <SelectItem value="ideasoft">ideasoft</SelectItem>
                                <SelectItem value="custom">Özel Altyapı</SelectItem>
                                <SelectItem value="other">Diğer</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 flex items-start gap-3">
                        <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <p className="text-[10px] text-primary/80 leading-relaxed font-medium">Entegrasyon süreci, başvurunuz onaylandıktan sonra iş geliştirme ekibimiz tarafından teknik dokümanlarla desteklenecektir.</p>
                    </div>
                </CardContent>
            </Card>
            <AddressFields city={city} setCity={setCity} district={district} setDistrict={setDistrict} neighborhood={neighborhood} setNeighborhood={setNeighborhood} />
            <SocialMediaFields />
        </div>
    )
};

const ClubForm = () => {
    const [schoolType, setSchoolType] = useState('');
    const [highSchoolProvince, setHighSchoolProvince] = useState('');
    const [highSchoolDistrict, setHighSchoolDistrict] = useState('');

    return (
        <div className="space-y-6">
            <Card className="rounded-[2rem] overflow-hidden border-black/5 shadow-sm">
                <CardHeader className="bg-muted/30">
                    <CardTitle className="text-lg">Kulüp Kimliği</CardTitle>
                    <CardDescription className="text-xs">Öğrenci topluluğunuzun kampüsteki dijital varlığını oluşturun.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Kulüp / Topluluk Türü</Label>
                        <Select onValueChange={setSchoolType}>
                            <SelectTrigger className="rounded-xl h-11"><SelectValue placeholder="Seçiniz..." /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="university">Üniversite Kulübü</SelectItem>
                                <SelectItem value="high-school">Lise Kulübü</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    {schoolType === 'university' && (
                        <div className="space-y-2 animate-in fade-in-0">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Üniversite</Label>
                            <Select><SelectTrigger className="rounded-xl h-11"><SelectValue placeholder="Üniversite seçin..." /></SelectTrigger>
                                <SelectContent>
                                    {allUniversities.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                    {schoolType === 'high-school' && (
                        <div className="space-y-4 animate-in fade-in-0">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">İl Millî Eğitim Müdürlüğü</Label>
                                <Select onValueChange={(value) => {
                                    const province = value.replace(' İl Millî Eğitim Müdürlüğü', '');
                                    setHighSchoolProvince(province);
                                    setHighSchoolDistrict('');
                                }}>
                                    <SelectTrigger className="rounded-xl h-11"><SelectValue placeholder="İl müdürlüğü seçin..." /></SelectTrigger>
                                    <SelectContent>
                                        {provincialDirectorates.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            {highSchoolProvince && (
                                <div className="space-y-2 animate-in slide-in-from-top-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">İlçe Millî Eğitim Müdürlüğü</Label>
                                    <Select value={highSchoolDistrict} onValueChange={setHighSchoolDistrict}>
                                        <SelectTrigger className="rounded-xl h-11"><SelectValue placeholder="İlçe müdürlüğü seçin..." /></SelectTrigger>
                                        <SelectContent>
                                            {(districts[highSchoolProvince] || []).map(d => <SelectItem key={d} value={`${d} İlçe Millî Eğitim Müdürlüğü`}>{`${d} İlçe Millî Eğitim Müdürlüğü`}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </div>
                    )}
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Kulüp Tam Adı</Label>
                        <Input placeholder="Örn: Sosyal Sorumluluk ve Etki Kulübü" required className="rounded-xl h-11" />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Resmi Kulüp E-postası</Label>
                        <Input type="email" placeholder="kulup@okul.edu.tr" required className="rounded-xl h-11" />
                    </div>
                </CardContent>
            </Card>
             <Card className="rounded-[2rem] overflow-hidden border-black/5 shadow-sm">
                <CardHeader className="bg-muted/30">
                    <CardTitle className="text-lg">Yönetim Bilgileri</CardTitle>
                    <CardDescription className="text-xs">Kulüp başkanı ve akademik danışman detayları.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                    <div className="space-y-4">
                        <h4 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                            <UserPlus className="h-4 w-4" /> Kulüp Başkanı
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input placeholder="Adı Soyadı" className="rounded-xl h-11" />
                            <Input type="tel" placeholder="Telefon (5XX...)" className="rounded-xl h-11" />
                        </div>
                    </div>
                    <Separator className="bg-muted" />
                    <div className="space-y-4">
                        <h4 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4" /> Akademik Danışman
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input placeholder="Unvan, Adı Soyadı" className="rounded-xl h-11" />
                            <Input type="email" placeholder="Kurumsal E-posta" className="rounded-xl h-11" />
                        </div>
                    </div>
                </CardContent>
            </Card>
            <Card className="rounded-[2rem] overflow-hidden border-black/5 shadow-sm">
                <CardHeader className="bg-muted/30"><CardTitle className="text-lg">Görseller</CardTitle></CardHeader>
                <CardContent className="space-y-4 pt-6">
                    <FileUpload label="Kulüp Logosu" accept=".jpg,.jpeg,.png" hint="Kampüs sayfasında görünecek dairesel logo." />
                    <FileUpload label="Kapak Fotoğrafı" accept=".jpg,.jpeg,.png" hint="Profil üst kısmındaki geniş görsel." />
                </CardContent>
            </Card>
        </div>
    )
};

const PostRegistrationSurvey = ({ open, onOpenChange, onComplete }: { open: boolean, onOpenChange: (open: boolean) => void, onComplete: () => void }) => {
    const [step, setStep] = useState(1);
    const [friendPhone, setFriendPhone] = useState('');
    const { toast } = useToast();
    
    const surveyOptions1 = ["Sosyal Medya", "Arkadaş Tavsiyesi", "Haberler / Basın", "Reklam", "Okul / İş yeri", "Diğer"];
    const surveyOptions2 = ["Bağış Modeli", "Gönüllülük Fırsatları", "STK Çeşitliliği", "Topluluk ve Etkileşim", "Teknolojik Altyapı", "Diğer"];

    const handleInviteFriend = () => {
        if (friendPhone.trim()) {
            toast({
                title: "Davet Gönderildi!",
                description: "Arkadaşın hangel'e davet edildi. Katıldığında puan kazanacaksın!",
            });
        }
        setStep(3);
    };

    const handleFinalStep = () => {
        onComplete();
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md rounded-[2.5rem]">
                <DialogHeader>
                    <DialogTitle className="text-center text-2xl font-bold flex items-center justify-center gap-2">
                        <Sparkles className="h-6 w-6 text-primary" />
                        {step === 1 && "Kısa Bir Anket"}
                        {step === 2 && "İyiliği Paylaş"}
                        {step === 3 && "Neredeyse Bitti"}
                    </DialogTitle>
                </DialogHeader>
                <div className="py-4">
                    {step === 1 && (
                        <div className="space-y-6">
                            <Label className="text-center block font-semibold text-lg">hangel'i nereden duydunuz?</Label>
                            <RadioGroup defaultValue={surveyOptions1[0]} className="grid grid-cols-2 gap-3">
                                {surveyOptions1.map(option => (
                                    <div key={option} className="flex items-center">
                                        <RadioGroupItem value={option} id={`q1-${option}`} className="peer sr-only" />
                                        <Label htmlFor={`q1-${option}`} className="flex w-full h-full items-center justify-center rounded-2xl border-2 border-muted bg-popover p-4 text-center text-xs font-bold transition-all hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 [&:has([data-state=checked])]:border-primary">
                                            {option}
                                        </Label>
                                    </div>
                                ))}
                            </RadioGroup>
                            <Button onClick={() => setStep(2)} className="w-full h-12 rounded-2xl font-bold">İleri</Button>
                        </div>
                    )}
                    {step === 2 && (
                         <div className="space-y-6">
                            <div className="text-center space-y-2">
                                <Label className="block font-semibold text-lg">İyilik zincirine bir halka da sen ekle!</Label>
                                <p className="text-muted-foreground text-sm leading-relaxed">Arkadaşını davet et, o da kazansın sen de! İlk işleminizde her ikinize de sürpriz puanlar tanımlayalım.</p>
                            </div>
                             <div className="space-y-2">
                                <Label htmlFor="friend-phone" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Arkadaşının Telefon Numarası</Label>
                                <Input id="friend-phone" type="tel" placeholder="5XX XXX XX XX" value={friendPhone} onChange={(e) => setFriendPhone(e.target.value)} className="h-12 rounded-xl text-center text-lg font-bold tracking-widest" />
                            </div>
                            <Button onClick={handleInviteFriend} className="w-full h-12 rounded-2xl font-bold">Davet Et ve Devam Et</Button>
                             <Button variant="link" onClick={() => setStep(3)} className="w-full text-muted-foreground font-bold">Daha Sonra</Button>
                        </div>
                    )}
                    {step === 3 && (
                         <div className="space-y-6">
                            <Label className="text-center block font-semibold text-lg">Kayıt olma kararınızı en çok ne etkiledi?</Label>
                            <RadioGroup defaultValue={surveyOptions2[0]} className="grid grid-cols-2 gap-3">
                                {surveyOptions2.map(option => (
                                    <div key={option} className="flex items-center">
                                        <RadioGroupItem value={option} id={`q2-${option}`} className="peer sr-only" />
                                        <Label htmlFor={`q2-${option}`} className="flex w-full h-full items-center justify-center rounded-2xl border-2 border-muted bg-popover p-4 text-center text-xs font-bold transition-all hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 [&:has([data-state=checked])]:border-primary">
                                            {option}
                                        </Label>
                                    </div>
                                ))}
                            </RadioGroup>
                            <Button onClick={handleFinalStep} className="w-full h-12 rounded-2xl font-bold">İyilik Yolculuğuna Başla</Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

const Separator = ({ className }: { className?: string }) => <div className={cn("h-px w-full bg-border", className)} />;

const FormRenderer = () => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const action = searchParams.get('action') || 'login';
    const type = searchParams.get('type');
    const [showSurvey, setShowSurvey] = useState(false);
  
    const handleActionChange = (value: string) => {
        router.push(`/login/selection?action=${value}${type ? `&type=${type}`: ''}`);
    };

    const handleTypeChange = (value: string) => {
        const currentAction = action || 'register';
        if (value === 'individual') {
            router.push(`/login/selection?action=${currentAction}`);
        } else {
            router.push(`/login/selection?action=${currentAction}&type=${value}`);
        }
    };
    
    const handleRegistrationComplete = () => {
        setShowSurvey(true);
    };

    const handleLoginComplete = () => {
        router.push('/market');
    };

    const handleSurveyComplete = () => {
        setShowSurvey(false);
        localStorage.setItem('onboardingStep', 'ngo-selection');
        router.push('/settings/ngo-selection');
    };

    const IndividualForm = ({ isRegister = false, onComplete }: { isRegister?: boolean; onComplete: () => void }) => {
        const { toast } = useToast();
        const auth = useAuth();
        
        const [name, setName] = useState('');
        const [phone, setPhone] = useState('');
        const [password, setPassword] = useState('');
        const [isLoading, setIsLoading] = useState(false);
    
        const handleSubmit = async (e: React.FormEvent) => {
            e.preventDefault();
    
            if (isRegister && !name.trim()) {
                toast({ variant: "destructive", title: "Eksik Bilgi", description: "Lütfen adınızı ve soyadınızı girin." });
                return;
            }
    
            if (!phone.trim() || phone.length < 10) {
                toast({ variant: "destructive", title: "Geçersiz Numara", description: "Lütfen geçerli bir telefon numarası girin." });
                return;
            }
            
            if (!password || password.length < 6) {
                toast({ variant: "destructive", title: "Eksik Bilgi", description: "Şifreniz en az 6 karakter olmalıdır." });
                return;
            }
            
            setIsLoading(true);
            const email = `${phone.replace(/\D/g, '')}@hangel.org`;
    
            try {
                if (isRegister) {
                    await createUserWithEmailAndPassword(auth, email, password);
                    toast({ title: "Hoş Geldin!", description: "hangel iyilik ekosistemine başarıyla katıldın." });
                } else {
                    await signInWithEmailAndPassword(auth, email, password);
                    toast({ title: "Giriş Başarılı!", description: "Kaldığınız yerden devam edebilirsiniz." });
                }
                onComplete();
            } catch (error: any) {
                let description = "Bilinmeyen bir hata oluştu.";
                if (error.code === 'auth/email-already-in-use') {
                    description = "Bu telefon numarası zaten kayıtlı. Lütfen giriş yapmayı deneyin.";
                } else if (error.code === 'auth/invalid-email') {
                    description = "Girdiğiniz bilgilerde bir hata var.";
                } else if (error.code === 'auth/wrong-password') {
                    description = "Girdiğiniz şifre hatalı.";
                } else if (error.code === 'auth/user-not-found') {
                    description = "Bu bilgilerle kayıtlı bir kullanıcı bulunamadı.";
                }
                toast({
                    variant: "destructive",
                    title: isRegister ? "Kayıt Hatası" : "Giriş Hatası",
                    description: description
                });
            } finally {
                setIsLoading(false);
            }
        };
    
        return (
            <form onSubmit={handleSubmit} className="space-y-5 animate-in fade-in-0">
                <div className="text-center space-y-1 mb-2">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        {isRegister 
                            ? "İyilik dolu bir dünyaya adım atmak için bilgilerinizi girin." 
                            : "Etkinizi takip etmek ve yeni fırsatları keşfetmek için oturum açın."}
                    </p>
                </div>

                {isRegister && (
                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Adınız ve Soyadınız</Label>
                        <Input id="name" placeholder="Örn: Can Demir" required value={name} onChange={e => setName(e.target.value)} className="h-12 rounded-xl border-muted focus:ring-primary" />
                    </div>
                )}
                <div className="space-y-2">
                    <Label htmlFor="phone" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Telefon Numarası</Label>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">+90</span>
                        <Input id="phone" type="tel" placeholder="5XXXXXXXXX" required value={phone} onChange={e => setPhone(e.target.value)} className="h-12 rounded-xl pl-12 border-muted focus:ring-primary font-bold tracking-widest" />
                    </div>
                    <p className="text-[9px] text-muted-foreground ml-1 italic">Doğrulama ve güvenlik işlemleri için numaranız gereklidir.</p>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="password" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Şifre</Label>
                    <Input id="password" type="password" placeholder="En az 6 karakter" required value={password} onChange={e => setPassword(e.target.value)} className="h-12 rounded-xl border-muted focus:ring-primary" />
                </div>

                <div className="space-y-3 pt-2">
                    <div className="flex items-start space-x-3 p-3 bg-muted/20 rounded-xl">
                        <Checkbox id="terms-user" required className="mt-1" />
                        <Label htmlFor="terms-user" className="text-[11px] leading-tight font-medium text-muted-foreground cursor-pointer">
                            <span><Link href="/settings/contracts/kullanici-sozlesmesi" className="text-primary font-bold hover:underline">Kullanıcı Sözleşmesini</Link>, <Link href="/settings/contracts/gizlilik-politikasi" className="text-primary font-bold hover:underline">Gizlilik Politikası</Link> ve <Link href="/settings/contracts/kvkk-aydinlatma-metni" className="text-primary font-bold hover:underline">Aydınlatma Metnini</Link> okudum, onaylıyorum.</span>
                        </Label>
                    </div>
                    {isRegister && (
                        <div className="flex items-start space-x-3 p-3 bg-muted/20 rounded-xl">
                            <Checkbox id="terms-consent" required className="mt-1" />
                            <Label htmlFor="terms-consent" className="text-[11px] leading-tight font-medium text-muted-foreground cursor-pointer">
                                <span>Platformun sosyal etki analizleri için <Link href="/settings/contracts/acik-riza-metni" className="text-primary font-bold hover:underline">Açık Rıza Metnini</Link> ve <Link href="/settings/contracts/bagis-ve-yardim-politikasi" className="text-primary font-bold hover:underline">Bağış Politikasını</Link> kabul ediyorum.</span>
                            </Label>
                        </div>
                    )}
                </div>

                <Button type="submit" className="w-full h-14 rounded-2xl text-base font-black shadow-xl shadow-primary/20 transition-all active:scale-[0.98]" disabled={isLoading}>
                    {isLoading ? (
                        <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> İşleniyor...</>
                    ) : (
                        isRegister ? <><UserPlus className="mr-2 h-4 w-4" /> Aramıza Katıl</> : <><LogIn className="mr-2 h-4 w-4" /> Hesabama Giriş Yap</>
                    )}
                </Button>
            </form>
        );
    };

    const CorporateForm = ({ onComplete }: { onComplete: () => void }) => {
        const { toast } = useToast();
        const searchParams = useSearchParams();
        const router = useRouter();
        const entity = searchParams.get('entity');
    
        const handleEntityTypeChange = (value: string) => {
            router.push(`/login/selection?action=register&type=corporate&entity=${value}`);
        };
    
        const handleSubmit = (e: React.FormEvent) => {
            e.preventDefault();
            toast({
                title: "Başvuru Kuyruğa Alındı!",
                description: "Kurumsal üyeliğiniz, evrak kontrolü ve doğrulama süreçleri için ekibimize ulaştırıldı.",
            });
            onComplete();
        };
    
        return (
            <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in-0">
                 <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Kuruluş Türü</Label>
                    <Select required value={entity || ''} onValueChange={handleEntityTypeChange}>
                        <SelectTrigger className="h-12 rounded-xl font-bold border-primary/20 bg-primary/5 text-primary">
                            <SelectValue placeholder="Kuruluş türünü seçin..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="NGO"><div className="flex items-center gap-2"><HandCoins className="h-4 w-4" /><span>Sivil Toplum Kuruluşu (STK)</span></div></SelectItem>
                            <SelectItem value="BRAND"><div className="flex items-center gap-2"><HeartHandshake className="h-4 w-4" /><span>Marka / Sosyal İşletme</span></div></SelectItem>
                            <SelectItem value="CLUB"><div className="flex items-center gap-2"><Building className="h-4 w-4" /><span>Öğrenci Kulübü / Topluluğu</span></div></SelectItem>
                        </SelectContent>
                    </Select>
                </div>
    
                {entity === 'NGO' && <NgoForm />}
                {entity === 'BRAND' && <BrandForm />}
                {entity === 'CLUB' && <ClubForm />}
    
                <div className="space-y-4 pt-4 border-t border-dashed">
                    <div className="flex items-start space-x-3 p-4 bg-primary/5 rounded-2xl border border-primary/10">
                        <Checkbox id="terms-corp" required className="mt-1" />
                        <Label htmlFor="terms-corp" className="text-xs leading-relaxed font-medium text-muted-foreground cursor-pointer">
                            <span className="text-primary font-bold">Kuruluş Yetkilisi Beyanı:</span> <Link href="/settings/contracts/kurulus-sozlesmesi" className="underline font-bold">Kuruluş Sözleşmesini</Link> ve ekli tüm kurumsal politikaları kuruluşum adına okudum, temsil yetkisi ile onaylıyorum.
                        </Label>
                    </div>
                </div>
    
                <Button type="submit" className="w-full h-14 rounded-2xl text-lg font-black shadow-xl shadow-primary/20" disabled={!entity}>
                    Başvuruyu Tamamla ve Gönder
                </Button>
                <p className="text-center text-[10px] text-muted-foreground italic">Onay süreci ortalama 2-3 iş günü sürmektedir.</p>
            </form>
        );
    };

    return (
        <div className="min-h-screen bg-secondary flex items-center justify-center p-4 sm:p-6 lg:p-8">
            <div className="w-full max-w-sm lg:max-w-md">
                <Button onClick={() => router.back()} variant="ghost" size="icon" className="absolute top-6 left-6 rounded-full bg-background/50 hover:bg-background shadow-sm h-10 w-10">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <Card className="rounded-[2.5rem] shadow-2xl border-none overflow-hidden bg-background">
                     <CardHeader className="text-center pt-10 pb-6 space-y-2">
                        <div className="w-16 h-16 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-2">
                            <HangelLogo className="text-3xl" />
                        </div>
                        <CardTitle className="text-3xl font-black tracking-tighter">
                            {action === 'register' ? 'İyiliğe İlk Adım' : 'Tekrar Hoş Geldin'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6 px-8 pb-10">
                         <Tabs defaultValue={action} onValueChange={handleActionChange} className="w-full">
                            <TabsList className="grid w-full grid-cols-2 h-12 rounded-xl bg-muted/50 p-1">
                                <TabsTrigger value="login" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm font-bold">Giriş Yap</TabsTrigger>
                                <TabsTrigger value="register" className="rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm font-bold">Kayıt Ol</TabsTrigger>
                            </TabsList>
                        </Tabs>
                        {action === 'login' ? <IndividualForm onComplete={handleLoginComplete} /> : (
                            <div className="space-y-6 pt-4 border-t border-dashed">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Kayıt Türü Seçin</Label>
                                    <Select onValueChange={handleTypeChange} defaultValue={type ? 'corporate' : 'individual'}>
                                        <SelectTrigger className="h-12 rounded-xl font-bold border-muted">
                                            <SelectValue placeholder="Hesap tipi seçin..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="individual" className="font-medium">Bireysel Gönüllü / Bağışçı</SelectItem>
                                            <SelectItem value="corporate" className="font-medium">Kurumsal (STK, Marka, Kulüp)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                {type === 'corporate' ? <CorporateForm onComplete={handleRegistrationComplete} /> : <IndividualForm isRegister={true} onComplete={handleRegistrationComplete} />}
                            </div>
                        )}
                    </CardContent>
                </Card>
                <div className="text-center mt-8 space-y-4">
                    <p className="text-xs text-muted-foreground font-medium">Güvenliğiniz için tüm verileriniz uçtan uca şifrelenmektedir.</p>
                    <div className="flex justify-center items-center gap-4 opacity-40">
                        <ShieldCheck className="h-6 w-6" />
                        <Landmark className="h-6 w-6" />
                        <Building2 className="h-6 w-6" />
                    </div>
                </div>
            </div>
             <PostRegistrationSurvey open={showSurvey} onOpenChange={setShowSurvey} onComplete={handleSurveyComplete} />
        </div>
    );
};

export default function LoginSelectionPage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center bg-secondary"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>}>
      <FormRenderer />
    </Suspense>
  );
}