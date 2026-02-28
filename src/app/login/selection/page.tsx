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
    Twitter, 
    Linkedin, 
    Sparkles, 
    HandCoins, 
    HeartHandshake, 
    Info, 
    ShieldCheck, 
    UserPlus, 
    LogIn, 
    Loader2,
    Landmark,
    Building2,
    CheckCircle,
    Facebook,
    Youtube,
    Link as LinkIcon,
    Trash2,
    Smartphone,
    Mail,
    Globe
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { marketCategories, allUniversities, provincialDirectorates, countryPhoneCodes } from '@/lib/data';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { HangelLogo } from '@/components/icons';

// --- Icons ---
const XIcon = (props: React.ComponentProps<'svg'>) => (
    <svg
      role="img"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      fill="currentColor"
      {...props}
    >
      <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.931ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
    </svg>
);

// --- Expanded Mock Data for Cascade ---
const allProvinces = ["Adana", "Adıyaman", "Afyonkarahisar", "Ağrı", "Aksaray", "Amasya", "Ankara", "Antalya", "Ardahan", "Artvin", "Aydın", "Balıkesir", "Bartın", "Batman", "Bayburt", "Bilecik", "Bingöl", "Bitlis", "Bolu", "Burdur", "Bursa", "Çanakkale", "Çankırı", "Çorum", "Denizli", "Diyarbakır", "Düzce", "Edirne", "Elazığ", "Erzincan", "Erzurum", "Eskişehir", "Gaziantep", "Giresun", "Gümüşhane", "Hakkari", "Hatay", "Iğdır", "Isparta", "İstanbul", "İzmir", "Kahramanmaraş", "Karabük", "Karaman", "Kars", "Kastamonu", "Kayseri", "Kırıkkale", "Kırklareli", "Kırşehir", "Kilis", "Kocaeli", "Konya", "Kütahya", "Malatya", "Manisa", "Mardin", "Mersin", "Muğla", "Muş", "Nevşehir", "Niğde", "Ordu", "Osmaniye", "Rize", "Sakarya", "Samsun", "Siirt", "Sinop", "Sivas", "Şanlıurfa", "Şırnak", "Tekirdağ", "Tokat", "Trabzon", "Tunceli", "Uşak", "Van", "Yalova", "Yozgat", "Zonguldak"];

const districtsData: { [key: string]: string[] } = {
    'İstanbul': ['Kadıköy', 'Beşiktaş', 'Fatih', 'Üsküdar', 'Sarıyer', 'Şişli', 'Bakırköy', 'Beykoz'],
    'Ankara': ['Çankaya', 'Mamak', 'Keçiören', 'Etimesgut', 'Yenimahalle', 'Gölbaşı'],
    'İzmir': ['Konak', 'Bornova', 'Karşıyaka', 'Buca', 'Çiğli'],
};

const neighborhoodsData: { [key: string]: string[] } = {
    'Kadıköy': ['Caferağa', 'Osmanağa', 'Moda', 'Rasimpaşa', 'Fenerbahçe'],
    'Beşiktaş': ['Levent', 'Etiler', 'Bebek', 'Arnavutköy', 'Ortaköy'],
    'Çankaya': ['Kızılay', 'Kavaklıdere', 'Bahçelievler', 'Ayrancı', 'Dikmen'],
};

const clubCategories = [
    "E-Spor", "Robotik", "Yapay Zekâ", "Siber Güvenlik", "Veri Bilimi", "Gastronomi", "Moda ve Tasarım", "Mimarlık ve Tasarım", "Hak Temelli Çalışmalar", "Mülteci ve Uyum", "Sürdürülebilirlık", "Psikoloji", "Kişisel Gelişim", "Medya ve Yayıncılık", "Yeni Medya", "Gazetecilik", "Radyo", "Gönüllülük", "Afet ve Arama Kurtarma", "Satranç", "Yazılım Geliştirme", "Oyun Geliştirme", "Donanım Geliştirme", "Eğlence", "Münazara", "Erasmus", "Mesleki", "Tiyatro", "Müzik", "Fotoğrafçılık", "Sinema", "Edebiyat", "Dans", "Resim ve Görsel Sanatlar", "Bilim ve Araştırma", "Hayvan Hakları", "Yabancı Dil", "Felsefe", "İnovasyon", "Girişimcilik", "Kariyer ve Gelişim", "Fikir ve Tartışma", "Politika ve Kamu Yönetimi", "İnsan Hakları", "Futbol", "Basketbol", "Voleybol", "Dağcılık ve Trekking", "Su Sporları", "Diğer Spor Kulüpleri", "Savunma Sporları", "Kampçılık", "Sosyal Sorumluluk", "Ekonomi", "Hukuk", "Sağlık ve Toplum Sağlığı", "Beslenme ve Diyetetik", "Sosyal Girişimcilik", "Diğer"
];

const allBeneficiaries = ['Çocuklar', 'Hak mücadelesi verenler', 'Afetzedeler', 'Hayvanlar', 'Yaşlılar', 'Engelliler', 'Öğrenciler', 'Mülteciler', 'Gençler', 'Çevre', 'Aile', 'Bölgesel', 'İş Dünyası', 'Girişimciler'];
const allSdgs = ['1. Yoksulluğa Son', '2. Açlığa Son', '3. Sağlıklı ve Kaliteli Yaşam', '4. Nitelikli Eğitim', '5. Toplumsal Cinsiyet Eşitliği', '6. Temiz Su ve Sanitasyon', '7. Erişilebilir ve Temiz Enerji', '8. İnsana Yakışır İş ve Ekonomik Büyüme', '9. Sanayi, Yenilikçilik ve Altyapı', '10. Eşitsizliklerin Azaltılması', '11. Sürdürülebilir Şehirler ve Topluluklar', '12. Sorumlu Üretim ve Tüketim', '13. İklim Eylemi', '14. Sudaki Yaşam', '15. Karasal Yaşam', '16. Barış, Adalet ve Güçlü Kurumlar', '17. Amaçlar için Ortaklıklar'];

const marketCategoryLabels = marketCategories
    .filter(c => c.mainCategory !== 'Öne çıkanlar' && c.mainCategory !== 'Tümü')
    .map(c => c.mainCategory);

// --- Shared Components ---

const CheckboxGroup = ({ title, options }: { title: string, options: string[] }) => (
    <div className="space-y-3">
        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{title}</Label>
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
        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{label}</Label>
        <div className="flex items-center gap-4 p-4 border rounded-2xl bg-muted/20 border-dashed border-primary/20">
            <input id={`${label}-upload`} type="file" className="hidden" accept={accept} />
            <Button asChild variant="outline" size="sm" className="rounded-xl border-primary/20 hover:bg-primary/5">
                <label htmlFor={`${label}-upload`} className="cursor-pointer font-bold"><Upload className="mr-2 h-4 w-4" />Belge Seç</label>
            </Button>
            <div className="flex-1">
                <p className="text-[10px] text-muted-foreground leading-tight">{hint || "Lütfen resmi formatta bir dosya yükleyin."}</p>
            </div>
        </div>
    </div>
);

const CommunicationAndSocialMedia = ({ title = "İletişim ve Sosyal Medya" }: { title?: string }) => (
    <div className="space-y-6">
        <h3 className="text-sm font-black uppercase tracking-widest text-primary border-b pb-2">{title}</h3>
        
        {/* Core Contact Info */}
        <div className="space-y-4">
            <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Kurumsal E-posta</Label>
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-muted rounded-lg"><Mail className="h-4 w-4 text-muted-foreground" /></div>
                    <Input type="email" placeholder="kurumsal@ornek.com" className="h-11 rounded-xl" />
                </div>
            </div>
            <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Kurumsal Telefon</Label>
                <div className="flex gap-2">
                    <div className="w-[100px] shrink-0">
                        <Select defaultValue="90">
                            <SelectTrigger className="h-11 rounded-xl">
                                <SelectValue placeholder="Kod" />
                            </SelectTrigger>
                            <SelectContent>
                                {countryPhoneCodes.map(code => (
                                    <SelectItem key={code} value={code}>+{code}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <Input type="tel" placeholder="5XX XXX XX XX" className="h-11 rounded-xl flex-1" />
                </div>
            </div>
            <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Web Sitesi</Label>
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-muted rounded-lg"><Globe className="h-4 w-4 text-muted-foreground" /></div>
                    <Input placeholder="https://www.ornek.com" className="h-11 rounded-xl" />
                </div>
            </div>
        </div>

        {/* Social Accounts */}
        <div className="space-y-4 pt-4 border-t border-dashed">
            <p className="text-[10px] text-muted-foreground italic px-1">Sosyal medya hesap linklerini ekleyin.</p>
            <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Instagram</Label>
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-muted rounded-lg"><Instagram className="h-4 w-4 text-muted-foreground" /></div>
                    <Input placeholder="instagram.com/kullaniciadi" className="h-11 rounded-xl" />
                </div>
            </div>
            <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">X (Twitter)</Label>
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-muted rounded-lg"><XIcon className="h-4 w-4 text-muted-foreground" /></div>
                    <Input placeholder="x.com/kullaniciadi" className="h-11 rounded-xl" />
                </div>
            </div>
            <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">LinkedIn</Label>
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-muted rounded-lg"><Linkedin className="h-4 w-4 text-muted-foreground" /></div>
                    <Input placeholder="linkedin.com/company/kurumadi" className="h-11 rounded-xl" />
                </div>
            </div>
        </div>
    </div>
);

const AddressFields = ({ city, setCity, district, setDistrict, neighborhood, setNeighborhood }: any) => (
    <div className="space-y-4">
        <h3 className="text-sm font-black uppercase tracking-widest text-primary border-b pb-2">Adres Bilgileri</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">İl</Label>
                <Select value={city} onValueChange={(val) => { setCity(val); setDistrict(''); setNeighborhood(''); }}>
                    <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="Seç" /></SelectTrigger>
                    <SelectContent>
                        {allProvinces.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">İlçe</Label>
                <Select value={district} onValueChange={(val) => { setDistrict(val); setNeighborhood(''); }} disabled={!city}>
                    <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="Seç" /></SelectTrigger>
                    <SelectContent>
                        {city && (districtsData[city] || ['Merkez']).map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Mahalle</Label>
                <Select value={neighborhood} onValueChange={setNeighborhood} disabled={!district}>
                    <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="Seç" /></SelectTrigger>
                    <SelectContent>
                        {district && (neighborhoodsData[district] || ['Merkez', 'Cumhuriyet', 'Hürriyet']).map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
        </div>
        <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Açık Adres</Label>
            <Input placeholder="Sokak, kapı no..." className="h-11 rounded-xl" />
        </div>
    </div>
);

const FinancialFields = ({ type = 'STK' }: { type?: 'STK' | 'Marka' }) => (
    <div className="space-y-4">
        <h3 className="text-sm font-black uppercase tracking-widest text-primary border-b pb-2">Yasal & Finansal</h3>
        <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Yasal Unvan</Label>
            <Input placeholder="Hesap Adı" className="h-11 rounded-xl" />
        </div>
        <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">IBAN Numarası</Label>
            <Input placeholder="TR..." className="h-11 rounded-xl font-mono" />
        </div>
    </div>
);

// --- Agreement Components ---

const AgreementList = ({ type }: { type: 'individual' | 'corporate' }) => {
    if (type === 'individual') {
        return (
            <div className="pt-2">
                <div className="flex items-start space-x-3 mb-4">
                    <Checkbox id="terms-accept" required />
                    <Label htmlFor="terms-accept" className="text-[10px] font-medium leading-relaxed text-muted-foreground cursor-pointer">
                        <Link href="/settings/contracts/kullanici-sozlesmesi" className="text-primary font-bold hover:underline">Kullanıcı Sözleşmesi</Link>, <Link href="/settings/contracts/kvkk-aydinlatma-metni" className="text-primary font-bold hover:underline">Aydınlatma Metni</Link> ve <Link href="/settings/contracts/gizlilik-politikasi" className="text-primary font-bold hover:underline">Gizlilik Politikası</Link>'nı okudum ve kabul ediyorum.
                    </Label>
                </div>
            </div>
        );
    }

    return (
        <div className="pt-4 space-y-4">
            <div className="flex items-start space-x-3">
                <Checkbox id="corp-terms-1" required />
                <Label htmlFor="corp-terms-1" className="text-[10px] font-medium leading-relaxed text-muted-foreground cursor-pointer">
                    <Link href="/settings/contracts/kurulus-sozlesmesi" className="text-primary font-bold hover:underline">Kuruluş Sözleşmesi</Link> ve <Link href="/settings/contracts/sosyal-etki-politikasi" className="text-primary font-bold hover:underline">Sosyal Etki Politikası</Link>'nı okudum, kuruluşum adına onaylıyorum.
                </Label>
            </div>
            <div className="flex items-start space-x-3">
                <Checkbox id="corp-terms-2" required />
                <Label htmlFor="corp-terms-2" className="text-[10px] font-medium leading-relaxed text-muted-foreground cursor-pointer">
                    <Link href="/settings/contracts/gizlilik-politikasi" className="text-primary font-bold hover:underline">Gizlilik Politikası</Link>, <Link href="/settings/contracts/kvkk-aydinlatma-metni" className="text-primary font-bold hover:underline">Aydınlatma Metni</Link> ve <Link href="/settings/contracts/acik-riza-metni" className="text-primary font-bold hover:underline">Açık Rıza Metni</Link>'ni okudum ve kabul ediyorum.
                </Label>
            </div>
            <div className="flex items-start space-x-3">
                <Checkbox id="corp-terms-3" required />
                <Label htmlFor="corp-terms-3" className="text-[10px] font-medium leading-relaxed text-muted-foreground cursor-pointer">
                    <Link href="/settings/contracts/bagis-ve-yardim-politikasi" className="text-primary font-bold hover:underline">Bağış ve Yardım Politikası</Link> ile <Link href="/settings/contracts/etik-ilkeler" className="text-primary font-bold hover:underline">Etik İlkeler</Link>'e uyacağımızı taahhüt ediyorum.
                </Label>
            </div>
        </div>
    );
};

// --- Form Renderer Component ---

const FormRenderer = () => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const action = searchParams.get('action') || 'login';
    const type = searchParams.get('type') || 'individual';
    const entity = searchParams.get('entity') || '';
    const redirectParam = searchParams.get('redirect');
    
    const [showSurvey, setShowSurvey] = useState(false);
    const [aboutText, setAboutText] = useState("");
    const ABOUT_LIMIT = 1000;

    const [city, setCity] = useState('');
    const [district, setDistrict] = useState('');
    const [neighborhood, setNeighborhood] = useState('');

    // Dynamic Donation Rates for Brands
    const [brandDonationRates, setBrandDonationRates] = useState([{ category: '', rate: '' }]);

    const addDonationRate = () => {
        if (brandDonationRates.length < 10) {
            setBrandDonationRates([...brandDonationRates, { category: '', rate: '' }]);
        }
    };

    const removeDonationRate = (index: number) => {
        if (brandDonationRates.length > 1) {
            setBrandDonationRates(brandDonationRates.filter((_, i) => i !== index));
        }
    };

    const updateDonationRate = (index: number, field: 'category' | 'rate', value: string) => {
        const updated = [...brandDonationRates];
        updated[index][field] = value;
        setBrandDonationRates(updated);
    };

    const handleActionChange = (value: string) => {
        const typePart = type !== 'individual' ? `&type=${type}` : '';
        const entityPart = entity ? `&entity=${entity}` : '';
        const redirectPart = redirectParam ? `&redirect=${encodeURIComponent(redirectParam)}` : '';
        router.push(`/login/selection?action=${value}${typePart}${entityPart}${redirectPart}`);
    };

    const handleTypeChange = (value: string) => {
        const redirectPart = redirectParam ? `&redirect=${encodeURIComponent(redirectParam)}` : '';
        if (value === 'individual') {
            router.push(`/login/selection?action=${action}${redirectPart}`);
        } else {
            router.push(`/login/selection?action=${action}&type=corporate${redirectPart}`);
        }
    };

    const handleEntityChange = (value: string) => {
        const redirectPart = redirectParam ? `&redirect=${encodeURIComponent(redirectParam)}` : '';
        router.push(`/login/selection?action=${action}&type=corporate&entity=${value}${redirectPart}`);
    };

    const handleRegistrationComplete = () => {
        setShowSurvey(true);
    };

    const handleLoginComplete = () => {
        if (redirectParam) {
            router.push(redirectParam);
        } else {
            router.push('/market');
        }
    };

    const handleSurveyComplete = () => {
        setShowSurvey(false);
        if (redirectParam) {
            router.push(redirectParam);
        } else {
            localStorage.setItem('onboardingStep', 'ngo-selection');
            router.push('/settings/ngo-selection');
        }
    };

    const IndividualForm = ({ isRegister = false, onComplete }: { isRegister?: boolean; onComplete: () => void }) => {
        const { toast } = useToast();
        const auth = useAuth();
        const [phone, setPhone] = useState('');
        const [password, setPassword] = useState('');
        const [name, setName] = useState('');
        const [isLoading, setIsLoading] = useState(false);
    
        const handleSubmit = async (e: React.FormEvent) => {
            e.preventDefault();
            setIsLoading(true);
            const email = `${phone.replace(/\D/g, '')}@hangel.org`;
            try {
                if (isRegister) {
                    await createUserWithEmailAndPassword(auth, email, password);
                } else {
                    await signInWithEmailAndPassword(auth, email, password);
                }
                onComplete();
            } catch (error: any) {
                toast({ variant: "destructive", title: "Hata", description: "İşlem başarısız oldu." });
            } finally {
                setIsLoading(false);
            }
        };
    
        return (
            <form onSubmit={handleSubmit} className="space-y-5 animate-in fade-in-0">
                {isRegister && (
                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Adınız ve Soyadınız</Label>
                        <Input id="name" placeholder="İsmail Hilmi ADIGÜZEL" required value={name} onChange={e => setName(e.target.value)} className="h-12 rounded-xl" />
                    </div>
                )}
                <div className="space-y-2">
                    <Label htmlFor="phone" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Telefon Numarası</Label>
                    <div className="flex gap-2">
                        <div className="w-[100px] shrink-0">
                            <Select defaultValue="90">
                                <SelectTrigger className="h-12 rounded-xl font-bold">
                                    <SelectValue placeholder="Kod" />
                                </SelectTrigger>
                                <SelectContent>
                                    {countryPhoneCodes.map(code => (
                                        <SelectItem key={code} value={code}>+{code}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <Input id="phone" type="tel" placeholder="5XXXXXXXXX" required value={phone} onChange={e => setPhone(e.target.value)} className="h-12 rounded-xl flex-1 font-bold tracking-widest" />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="password" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Şifre</Label>
                    <Input id="password" type="password" placeholder="En az 6 karakter" required value={password} onChange={e => setPassword(e.target.value)} className="h-12 rounded-xl" />
                </div>
                {isRegister && <AgreementList type="individual" />}
                <Button type="submit" className="w-full h-14 rounded-2xl text-base font-black shadow-xl" disabled={isLoading}>
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : (isRegister ? "Kayıt Ol ve Başla" : "Giriş Yap")}
                </Button>
            </form>
        );
    };

    const NgoRegistrationForm = () => {
        const { toast } = useToast();
        const handleSubmit = (e: React.FormEvent) => {
            e.preventDefault();
            toast({ title: "Başvuru Alındı", description: "STK başvurunuz incelemeye alınmıştır." });
            handleRegistrationComplete();
        };

        return (
            <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in-0">
                <div className="space-y-6">
                    <div className="space-y-4">
                        <h3 className="text-sm font-black uppercase tracking-widest text-primary border-b pb-2">Kuruluş Bilgileri</h3>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Kuruluş Adı</Label>
                            <Input placeholder="Kuruluşunuzun tam adı" required className="h-11 rounded-xl" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Kuruluş Kısa Adı</Label>
                                <Input placeholder="hangel Derneği" className="h-11 rounded-xl" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Kuruluş Yılı</Label>
                                <Input type="number" placeholder="1983" className="h-11 rounded-xl" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Kuruluş Türü</Label>
                            <Select required>
                                <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="Seçiniz..." /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="dernek">Dernek</SelectItem>
                                    <SelectItem value="vakif">Vakıf</SelectItem>
                                    <SelectItem value="spor-kulubu">Spor Kulübü</SelectItem>
                                    <SelectItem value="ozel-izinli">Özel İzinli</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between items-end mb-1 px-1">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Hakkında</Label>
                                <span className={cn("text-[10px] font-bold", aboutText.length > ABOUT_LIMIT ? "text-destructive" : "text-muted-foreground")}>
                                    {aboutText.length} / {ABOUT_LIMIT} (Kalan: {ABOUT_LIMIT - aboutText.length})
                                </span>
                            </div>
                            <Textarea 
                                value={aboutText} 
                                onChange={(e) => setAboutText(e.target.value)} 
                                maxLength={ABOUT_LIMIT} 
                                placeholder="Kuruluşunuzu anlatan kısa bir metin." 
                                className="min-h-[120px] rounded-2xl p-4"
                                required
                            />
                        </div>
                    </div>

                    <CheckboxGroup title="Faydalanıcılar" options={allBeneficiaries} />
                    <CheckboxGroup title="Sürdürülebilir Kalkınma Hedefleri" options={allSdgs} />
                    
                    <AddressFields city={city} setCity={setCity} district={district} setDistrict={setDistrict} neighborhood={neighborhood} setNeighborhood={setNeighborhood} />
                    <CommunicationAndSocialMedia />
                    <FinancialFields />

                    <div className="space-y-4">
                        <h3 className="text-sm font-black uppercase tracking-widest text-primary border-b pb-2">Yasal Belgeler</h3>
                        <FileUpload label="Logo" accept=".jpg,.jpeg" hint="Desteklenen format: .jpg" />
                        <FileUpload label="Faaliyet Belgesi" accept=".pdf" hint="Desteklenen format: .pdf" />
                        <FileUpload label="Tüzük" accept=".pdf" hint="Desteklenen format: .pdf" />
                    </div>

                    <AgreementList type="corporate" />
                </div>
                <Button type="submit" className="w-full h-14 rounded-2xl text-base font-black shadow-xl">Başvuruyu Gönder</Button>
            </form>
        );
    };

    const BrandRegistrationForm = () => {
        const { toast } = useToast();
        const handleSubmit = (e: React.FormEvent) => {
            e.preventDefault();
            toast({ title: "Başvuru Alındı", description: "Marka başvurunuz incelemeye alınmıştır." });
            handleRegistrationComplete();
        };

        return (
            <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in-0">
                <div className="space-y-6">
                    <div className="space-y-4">
                        <h3 className="text-sm font-black uppercase tracking-widest text-primary border-b pb-2">Marka Kimliği</h3>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Marka Adı</Label>
                            <Input placeholder="Markanızın adı" required className="h-11 rounded-xl" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Sektör</Label>
                            <Select required>
                                <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="Seçiniz..." /></SelectTrigger>
                                <SelectContent>
                                    {marketCategoryLabels.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Category Based Donation Rates */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-black uppercase tracking-widest text-primary border-b pb-2">Kategori Bazlı Bağış Oranları</h3>
                        <p className="text-[10px] text-muted-foreground italic px-1">En fazla 10 kategori için farklı bağış oranları belirleyebilirsiniz.</p>
                        <div className="space-y-3">
                            {brandDonationRates.map((item, index) => (
                                <div key={index} className="flex gap-2 items-end group animate-in slide-in-from-top-2 duration-300">
                                    <div className="flex-1 space-y-1">
                                        <Label className="text-[9px] uppercase font-bold text-muted-foreground">Kategori</Label>
                                        <Input 
                                            placeholder="Örn: Giyim, Aksesuar..." 
                                            value={item.category} 
                                            onChange={(e) => updateDonationRate(index, 'category', e.target.value)}
                                            className="h-10 rounded-xl"
                                        />
                                    </div>
                                    <div className="w-24 space-y-1">
                                        <Label className="text-[9px] uppercase font-bold text-muted-foreground">Oran (%)</Label>
                                        <Input 
                                            type="number" 
                                            placeholder="5" 
                                            value={item.rate} 
                                            onChange={(e) => updateDonationRate(index, 'rate', e.target.value)}
                                            className="h-10 rounded-xl"
                                        />
                                    </div>
                                    <Button 
                                        type="button" 
                                        variant="ghost" 
                                        size="icon" 
                                        className="text-destructive h-10 w-10 hover:bg-destructive/10 rounded-xl"
                                        onClick={() => removeDonationRate(index)}
                                        disabled={brandDonationRates.length === 1}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                        {brandDonationRates.length < 10 && (
                            <Button type="button" variant="outline" size="sm" className="w-full mt-2 rounded-xl border-dashed" onClick={addDonationRate}>
                                <Plus className="mr-2 h-4 w-4" /> Yeni Kategori Ekle
                            </Button>
                        )}
                    </div>

                    {/* Affiliate Marketing Info */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-black uppercase tracking-widest text-primary border-b pb-2">Affiliate Marketing</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Ajans / Network</Label>
                                <Select>
                                    <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="Seçiniz..." /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="gelir-ortaklari">Gelir Ortakları</SelectItem>
                                        <SelectItem value="reklamaction">ReklamAction</SelectItem>
                                        <SelectItem value="affocean">Affocean</SelectItem>
                                        <SelectItem value="ozel">Özel Altyapı</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Program / Campaign ID</Label>
                                <Input placeholder="ID numaranız" className="h-11 rounded-xl" />
                            </div>
                        </div>
                    </div>

                    <AddressFields city={city} setCity={setCity} district={district} setDistrict={setDistrict} neighborhood={neighborhood} setNeighborhood={setNeighborhood} />
                    <CommunicationAndSocialMedia />
                    <FinancialFields type="Marka" />

                    <div className="space-y-4">
                        <h3 className="text-sm font-black uppercase tracking-widest text-primary border-b pb-2">Yasal Belgeler & Logolar</h3>
                        <FileUpload label="Vergi Levhası" accept=".pdf" hint="Desteklenen format: .pdf" />
                        <FileUpload label="Marka Logosu" accept=".jpg,.jpeg,.png" hint="Yüksek çözünürlüklü .png veya .jpg" />
                    </div>

                    <AgreementList type="corporate" />
                </div>
                <Button type="submit" className="w-full h-14 rounded-2xl text-base font-black shadow-xl">Başvuruyu Gönder</Button>
            </form>
        );
    };

    const ClubRegistrationForm = () => {
        const { toast } = useToast();
        const [clubType, setClubType] = useState<string>('');
        const [otherClubType, setOtherClubType] = useState<string>('');
        const [clubCategory, setClubCategory] = useState<string>('');
        const [otherClubCategory, setOtherClubCategory] = useState<string>('');
        
        const handleSubmit = (e: React.FormEvent) => {
            e.preventDefault();
            toast({ title: "Başvuru Alındı", description: "Öğrenci kulübü başvurunuz incelemeye alınmıştır." });
            handleRegistrationComplete();
        };

        return (
            <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in-0">
                <div className="space-y-6">
                    <div className="space-y-4">
                        <h3 className="text-sm font-black uppercase tracking-widest text-primary border-b pb-2">Kulüp Bilgileri</h3>
                        
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Kulüp Türü</Label>
                            <Select required onValueChange={setClubType} value={clubType}>
                                <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="Seçiniz..." /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="university">Üniversite Kulübü</SelectItem>
                                    <SelectItem value="high-school">Lise Kulübü</SelectItem>
                                    <SelectItem value="other">Diğer</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {clubType === 'other' && (
                            <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Kulüp Türünü Belirtin</Label>
                                <Input 
                                    placeholder="Elle yazınız..." 
                                    value={otherClubType} 
                                    onChange={(e) => setOtherClubType(e.target.value)}
                                    className="h-11 rounded-xl"
                                    required
                                />
                            </div>
                        )}

                        {(clubType === 'university' || clubType === 'high-school') && (
                            <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                                    {clubType === 'university' ? 'Üniversite' : 'İl Millî Eğitim Müdürlüğü'}
                                </Label>
                                <Select required>
                                    <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="Seçiniz..." /></SelectTrigger>
                                    <SelectContent>
                                        {(clubType === 'university' ? allUniversities : provincialDirectorates).map(u => (
                                            <SelectItem key={u} value={u}>{u}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Kulüp Kategorisi</Label>
                            <Select required onValueChange={setClubCategory} value={clubCategory}>
                                <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="Seçiniz..." /></SelectTrigger>
                                <SelectContent>
                                    {clubCategories.map(cat => (
                                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {clubCategory === 'Diğer' && (
                            <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Kulüp Kategorisini Belirtin</Label>
                                <Input 
                                    placeholder="Elle yazınız..." 
                                    value={otherClubCategory} 
                                    onChange={(e) => setOtherClubCategory(e.target.value)}
                                    className="h-11 rounded-xl"
                                    required
                                />
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Kulüp Adı</Label>
                            <Input placeholder="Kulübünüzün tam adı" required className="h-11 rounded-xl" />
                        </div>
                    </div>

                    <AddressFields city={city} setCity={setCity} district={district} setDistrict={setDistrict} neighborhood={neighborhood} setNeighborhood={setNeighborhood} />
                    <CommunicationAndSocialMedia />

                    <div className="space-y-4">
                        <h3 className="text-sm font-black uppercase tracking-widest text-primary border-b pb-2">Görseller</h3>
                        <FileUpload label="Kulüp Logosu" accept=".jpg,.jpeg,.png" />
                        <FileUpload label="Kapak Fotoğrafı" accept=".jpg,.jpeg,.png" />
                    </div>

                    <AgreementList type="corporate" />
                </div>
                <Button type="submit" className="w-full h-14 rounded-2xl text-base font-black shadow-xl" disabled={!clubType}>Başvuruyu Gönder</Button>
            </form>
        );
    };

    return (
        <div className="min-h-screen bg-secondary flex items-center justify-center p-4 sm:p-6 lg:p-8 pt-20 pb-20">
            <div className="w-full max-w-sm lg:max-w-md xl:max-w-lg">
                <Button onClick={() => router.push('/login')} variant="ghost" size="icon" className="absolute top-6 left-6 rounded-full bg-background/50 h-10 w-10">
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
                        <CardDescription className="text-sm font-medium px-4">
                            {action === 'register' ? 'Toplumsal etki için aramıza katılın.' : 'İyilik yolculuğuna kaldığın yerden devam et.'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 px-8 pb-10">
                         <Tabs defaultValue={action} onValueChange={handleActionChange} className="w-full">
                            <TabsList className="grid w-full grid-cols-2 h-12 rounded-xl bg-muted/50 p-1">
                                <TabsTrigger value="login" className="rounded-lg font-bold">Giriş Yap</TabsTrigger>
                                <TabsTrigger value="register" className="rounded-lg font-bold">Kayıt Ol</TabsTrigger>
                            </TabsList>
                        </Tabs>

                        {action === 'login' ? (
                            <IndividualForm onComplete={handleLoginComplete} />
                        ) : (
                            <div className="space-y-6 pt-4 border-t border-dashed">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Hesap Tipi</Label>
                                    <Select onValueChange={handleTypeChange} value={type}>
                                        <SelectTrigger className="h-12 rounded-xl font-bold border-muted">
                                            <SelectValue placeholder="Hesap tipi seçin..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="individual">Bireysel Gönüllü / Bağışçı</SelectItem>
                                            <SelectItem value="corporate">Kurumsal (STK, Marka, Kulüp)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {type === 'corporate' && (
                                    <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Kuruluş Türü</Label>
                                        <Select onValueChange={handleEntityChange} value={entity}>
                                            <SelectTrigger className="h-12 rounded-xl font-bold border-muted">
                                                <SelectValue placeholder="Kuruluş türünü seçin..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="NGO">STK (Dernek, Vakıf, Spor Kulübü, Özel İzinli)</SelectItem>
                                                <SelectItem value="BRAND">Marka / Sosyal İşletme</SelectItem>
                                                <SelectItem value="CLUB">Öğrenci Kulübü</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}

                                {type === 'individual' ? (
                                    <IndividualForm isRegister={true} onComplete={handleRegistrationComplete} />
                                ) : (
                                    <div className="pt-4">
                                        {entity === 'NGO' && <NgoRegistrationForm />}
                                        {entity === 'BRAND' && <BrandRegistrationForm />}
                                        {entity === 'CLUB' && <ClubRegistrationForm />}
                                        {!entity && (
                                            <div className="p-12 text-center border-2 border-dashed rounded-[2rem] opacity-40">
                                                <p className="text-sm font-medium italic">Lütfen kuruluş türünü seçin.</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
                <div className="text-center mt-8 space-y-4">
                    <div className="flex justify-center items-center gap-4 opacity-40">
                        <ShieldCheck className="h-6 w-6" />
                        <Landmark className="h-6 w-6" />
                        <Building2 className="h-6 w-6" />
                    </div>
                    <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Güvenli ve Şeffaf Altyapı</p>
                </div>
            </div>
             <PostRegistrationSurvey open={showSurvey} onOpenChange={setShowSurvey} onComplete={handleSurveyComplete} />
        </div>
    );
};

const PostRegistrationSurvey = ({ open, onOpenChange, onComplete }: { open: boolean, onOpenChange: (open: boolean) => void, onComplete: () => void }) => {
    const [step, setStep] = useState(1);
    const [friendPhone, setFriendPhone] = useState('');
    const { toast } = useToast();
    
    const surveyOptions1 = ["Sosyal Medya", "Arkadaş Tavsiyesi", "Haberler", "Reklam", "Okul", "Diğer"];

    const handleInviteFriend = () => {
        if (friendPhone.trim()) {
            toast({
                title: "Harika Bir Arkadaşsın!",
                description: "Arkadaşına puan kazandırdın, sen ne güzel bir arkadaşsın!",
            });
        }
        setStep(3);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md rounded-[2.5rem]">
                <DialogHeader>
                    <DialogTitle className="text-center text-2xl font-bold flex items-center justify-center gap-2">
                        <Sparkles className="h-6 w-6 text-primary" />
                        {step === 1 && "Kısa Bir Anket"}
                        {step === 2 && "İyiliği Paylaş"}
                        {step === 3 && "Hoş Geldin"}
                    </DialogTitle>
                </DialogHeader>
                <div className="py-4">
                    {step === 1 && (
                        <div className="space-y-6">
                            <Label className="text-center block font-semibold text-lg">hangel'i nereden duydunuz?</Label>
                            <div className="grid grid-cols-2 gap-3">
                                {surveyOptions1.map(option => (
                                    <Button key={option} variant="outline" className="rounded-2xl h-14 font-bold" onClick={() => setStep(2)}>
                                        {option}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    )}
                    {step === 2 && (
                         <div className="space-y-6">
                            <div className="text-center space-y-2">
                                <Label className="block font-semibold text-lg">İyilik zincirine bir halka da sen ekle!</Label>
                                <p className="text-muted-foreground text-sm leading-relaxed">Arkadaşını davet et, o da kazansın sen de!</p>
                            </div>
                             <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Arkadaşının Telefon Numarası</Label>
                                <div className="flex gap-2">
                                    <div className="w-[100px] shrink-0">
                                        <Select defaultValue="90">
                                            <SelectTrigger className="h-12 rounded-xl font-bold">
                                                <SelectValue placeholder="Kod" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {countryPhoneCodes.map(code => (
                                                    <SelectItem key={code} value={code}>+{code}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <Input type="tel" placeholder="5XX XXX XX XX" value={friendPhone} onChange={(e) => setFriendPhone(e.target.value)} className="h-12 rounded-xl text-center text-lg font-bold flex-1" />
                                </div>
                            </div>
                            <Button onClick={handleInviteFriend} className="w-full h-12 rounded-2xl font-bold">Davet Et</Button>
                             <Button variant="link" onClick={() => setStep(3)} className="w-full text-muted-foreground font-bold">Atla</Button>
                        </div>
                    )}
                    {step === 3 && (
                         <div className="space-y-6 text-center">
                            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
                            <Label className="block font-semibold text-lg">Kaydın Başarıyla Tamamlandı!</Label>
                            <p className="text-muted-foreground text-sm">Profilini kişiselleştirmeye ve iyilik dünyasını keşfetmeye hazırsın.</p>
                            <Button onClick={onComplete} className="w-full h-12 rounded-2xl font-bold">Hadi Başlayalım</Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default function LoginSelectionPage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center bg-secondary"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>}>
      <FormRenderer />
    </Suspense>
  );
}
