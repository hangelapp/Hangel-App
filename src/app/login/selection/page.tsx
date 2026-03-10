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
    Globe,
    Code,
    UserCircle,
    FileText,
    ShieldAlert
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { marketCategories, allUniversities, provincialDirectorates, countryPhoneCodes, sportsFederations, allProvinces, districtsData, neighborhoodsData, globalCitiesData, globalDistrictsData } from '@/lib/data';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth, useFirestore, setDocumentNonBlocking } from '@/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc } from 'firebase/firestore';
import { HangelLogo } from '@/components/icons';
import { Badge } from '@/components/ui/badge';

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

const clubCategories = [
    "E-Spor", "Robotik", "Yapay Zekâ", "Siber Güvenlik", "Veri Bilimi", "Gastronomi", "Moda ve Tasarım", "Mimarlık ve Tasarım", "Hak Temelli Çalışmalar", "Mülteci ve Uyum", "Sürdürülebilirlik", "Psikoloji", "Kişisel Gelişim", "Medya ve Yayıncılık", "Yeni Medya", "Gazetecilik", "Radyo", "Gönüllülük", "Afet ve Arama Kurtarma", "Satranç", "Yazılım Geliştirme", "Oyun Geliştirme", "Donanım Geliştirme", "Eğlence", "Münazara", "Erasmus", "Mesleki", "Tiyatro", "Müzik", "Fotoğrafçılık", "Sinema", "Edebiyat", "Dans", "Resim ve Görsel Sanatlar", "Bilim ve Araştırma", "Hayvan Hakları", "Yabancı Dil", "Felsefe", "İnovasyon", "Girişimcilik", "Kariyer ve Gelişim", "Fikir ve Tartışma", "Politika ve Kamu Yönetimi", "İnsan Hakları", "Futbol", "Basketbol", "Voleybol", "Dağcılık ve Trekking", "Su Sporları", "Diğer Spor Kulüpleri", "Savunma Sporları", "Kampçılık", "Sosyal Sorumluluk", "Ekonomi", "Hukuk", "Sağlık ve Toplum Sağlığı", "Beslenme ve Diyetetik", "Sosyal Girişimcilik", "Diğer"
];

const allBeneficiaries = ['Çocuklar', 'Hak mücadelesi verenler', 'Afetzedeler', 'Hayvanlar', 'Yaşlılar', 'Engelliler', 'Öğrenciler', 'Mülteciler', 'Gençler', 'Çevre', 'Aile', 'Bölgesel', 'İş Dünyası', 'Girişimciler'];
const allSdgs = ['1. Yoksulluğa Son', '2. Açlığa Son', '3. Sağlıklı ve Kaliteli Yaşam', '4. Nitelikli Eğitim', '5. Toplumsal Cinsiyet Eşitliği', '6. Temiz Su ve Sanitasyon', '7. Erişilebilir ve Temiz Enerji', '8. İnsana Yakışır İş ve Ekonomik Büyüme', '9. Sanayi, Yenilikçilik ve Altyapı', '10. Eşitsizliklerin Azaltılması', '11. Sürdürülebilir Şehirler ve Topluluklar', '12. Sorumlu Üretim ve Tüketim', '13. İklim Eylemi', '14. Sudaki Yaşam', '15. Karasal Yaşam', '16. Barış, Adalet ve Güçlü Kurumlar', '17. Amaçlar için Ortaklıklar'];
const allMemberships = ['Afet Platformu', 'Açık Açık', 'Tüsev', 'Adım Adım', 'Ability Pool', 'HelpSteps', 'Candid'];
const years = Array.from({ length: 2025 - 1900 }, (_, i) => (2024 - i).toString());

const marketCategoryLabels = marketCategories
    .filter(c => c.mainCategory !== 'Öne çıkanlar' && c.mainCategory !== 'Tümü')
    .map(c => c.mainCategory);

const corporateCountries = [
    "Almanya", "ABD", "Azerbaycan", "Danimarka", "Endonezya", "İran", "Makedonya", "Nijerya", "Suriye", "Ukrayna", "Ürdün", "Türkiye"
].sort((a, b) => a.localeCompare(b, 'tr'));

// --- Shared Components ---

const CheckboxGroup = ({ title, options, limit, onLimitExceeded }: { title: string, options: string[], limit?: number, onLimitExceeded?: () => void }) => {
    const [selected, setSelected] = useState<string[]>([]);

    const handleToggle = (option: string, checked: boolean) => {
        if (checked) {
            if (limit && selected.length >= limit) {
                onLimitExceeded?.();
                return;
            }
            setSelected([...selected, option]);
        } else {
            setSelected(selected.filter(s => s !== option));
        }
    };

    return (
        <div className="space-y-3">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{title}</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 rounded-2xl border p-4 bg-background">
                {options.map(option => (
                    <div key={option} className="flex items-center gap-2">
                        <Checkbox 
                            id={`${title.replace(/\s/g, '-')}-${option.replace(/\s/g, '-')}`} 
                            checked={selected.includes(option)}
                            onCheckedChange={(checked) => handleToggle(option, !!checked)}
                        />
                        <Label htmlFor={`${title.replace(/\s/g, '-')}-${option.replace(/\s/g, '-')}`} className="text-xs font-medium cursor-pointer leading-none">{option}</Label>
                    </div>
                ))}
            </div>
        </div>
    );
};

const FileUpload = ({label, accept, hint, required}: {label: string, accept?: string, hint?: string, required?: boolean}) => (
    <div className="space-y-2">
        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{label} {required && "*"}</Label>
        <div className="flex items-center gap-4 p-4 border rounded-2xl bg-muted/20 border-dashed border-primary/20">
            <input id={`${label}-upload`} type="file" className="hidden" accept={accept} required={required} />
            <Button asChild variant="outline" size="sm" className="rounded-xl border-primary/20 hover:bg-primary/5">
                <label htmlFor={`${label}-upload`} className="cursor-pointer font-bold"><Upload className="mr-2 h-4 w-4" />Belge Seç</label>
            </Button>
            <div className="flex-1">
                <p className="text-[10px] text-muted-foreground leading-tight">{hint || "Lütfen resmi formatta bir dosya yükleyin."}</p>
            </div>
        </div>
    </div>
);

const AuthorizedPersonFields = () => (
    <div className="space-y-6">
        <h3 className="text-sm font-black uppercase tracking-widest text-primary border-b pb-2">Yetkili Kişi Bilgileri</h3>
        <div className="space-y-4">
            <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Ad Soyad</Label>
                <Input placeholder="Ör.: İsmail Hilmi ADIGÜZEL" required className="h-11 rounded-xl" />
            </div>
            <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Görevi</Label>
                <Input placeholder="Örn: Genel Sekreter, Pazarlama Müdürü" required className="h-11 rounded-xl" />
            </div>
            <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Kurumsal E-posta</Label>
                <Input type="email" placeholder="örnek@marka.com" required className="h-11 rounded-xl" />
            </div>
            <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Kurumsal Telefon</Label>
                <div className="flex gap-2">
                    <div className="w-[100px] shrink-0">
                        <Select defaultValue="90" required>
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
                    <Input type="tel" placeholder="5XX XXX XX XX" className="h-11 rounded-xl flex-1" required />
                </div>
            </div>
        </div>
    </div>
);

const CommunicationAndSocialMedia = ({ title = "İletişim ve Sosyal Medya", emailRequired = true, phoneRequired = true }: { title?: string, emailRequired?: boolean, phoneRequired?: boolean }) => (
    <div className="space-y-6">
        <h3 className="text-sm font-black uppercase tracking-widest text-primary border-b pb-2">{title}</h3>
        
        {/* Core Contact Info */}
        <div className="space-y-4">
            <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Kurumsal E-posta</Label>
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-muted rounded-lg"><Mail className="h-4 w-4 text-muted-foreground" /></div>
                    <Input type="email" placeholder="örnek@marka.com" required={emailRequired} className="h-11 rounded-xl" />
                </div>
            </div>
            <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Kurumsal Telefon</Label>
                <div className="flex gap-2">
                    <div className="w-[100px] shrink-0">
                        <Select defaultValue="90" required={phoneRequired}>
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
                    <Input type="tel" placeholder="5XX XXX XX XX" required={phoneRequired} className="h-11 rounded-xl flex-1" />
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

const AddressFields = ({ country, city, setCity, district, setDistrict, neighborhood, setNeighborhood, required = true }: any) => {
    const isTurkey = country === 'Türkiye';
    const cityOptions = isTurkey ? allProvinces : (globalCitiesData[country] || []);
    const districtOptions = isTurkey ? (districtsData[city] || []) : (globalDistrictsData[city] || []);

    return (
        <div className="space-y-4">
            <h3 className="text-sm font-black uppercase tracking-widest text-primary border-b pb-2">Adres Bilgileri</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{isTurkey ? 'İl' : 'Eyalet / Şehir'}</Label>
                    {cityOptions.length > 0 ? (
                        <Select value={city} onValueChange={(val) => { setCity(val); setDistrict(''); setNeighborhood(''); }} required={required}>
                            <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="Seçiniz..." /></SelectTrigger>
                            <SelectContent className="max-h-60">
                                {cityOptions.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    ) : (
                        <Input placeholder="Şehir / Eyalet girin" value={city} onChange={e => setCity(e.target.value)} required={required} className="h-11 rounded-xl" />
                    )}
                </div>
                <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{isTurkey ? 'İlçe' : 'Bölge'}</Label>
                    {districtOptions.length > 0 ? (
                        <Select value={district} onValueChange={(val) => { setDistrict(val); setNeighborhood(''); }} disabled={!city} required={required}>
                            <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="Seçiniz..." /></SelectTrigger>
                            <SelectContent className="max-h-60">
                                {districtOptions.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    ) : (
                        <Input placeholder="İlçe / Bölge girin" value={district} onChange={e => setDistrict(e.target.value)} required={required} className="h-11 rounded-xl" />
                    )}
                </div>
            </div>
            
            <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Mahalle</Label>
                {isTurkey && city && district && neighborhoodsData[city]?.[district] ? (
                    <Select value={neighborhood} onValueChange={setNeighborhood} required={required}>
                        <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="Mahalle Seçiniz..." /></SelectTrigger>
                        <SelectContent className="max-h-60">
                            {neighborhoodsData[city][district].map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                        </SelectContent>
                    </Select>
                ) : (
                    <Input placeholder="Mahalle girin" value={neighborhood} onChange={e => setNeighborhood(e.target.value)} required={required} className="h-11 rounded-xl" disabled={isTurkey && !district} />
                )}
            </div>

            <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Açık Adres</Label>
                <Input placeholder="Sokak, kapı no..." className="h-11 rounded-xl" required={required} />
            </div>
        </div>
    );
};

const FinancialFields = ({ type = 'STK', required = false }: { type?: 'STK' | 'Marka', required?: boolean }) => (
    <div className="space-y-4">
        <h3 className="text-sm font-black uppercase tracking-widest text-primary border-b pb-2">Yasal & Finansal</h3>
        <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Yasal Unvan</Label>
            <Input placeholder="Hesap Adı" className="h-11 rounded-xl" required={required} />
        </div>
        <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">IBAN Numarası</Label>
            <Input placeholder="TR..." className="h-11 rounded-xl font-mono" required={required} />
        </div>
    </div>
);

// --- Agreement Components ---

const AgreementList = ({ type, isLogin = false }: { type: 'individual' | 'corporate', isLogin?: boolean }) => {
    if (type === 'individual') {
        const prefix = isLogin ? "login" : "reg";
        return (
            <div className="pt-2 space-y-3">
                <div className="flex items-start space-x-3">
                    <Checkbox id={`${prefix}-terms-1`} required />
                    <Label htmlFor={`${prefix}-terms-1`} className="text-[10px] font-medium leading-relaxed text-muted-foreground cursor-pointer">
                        <Link href="/settings/contracts/kullanici-sozlesmesi" className="text-primary font-bold hover:underline">Kullanıcı Sözleşmesi</Link>'ni okudum ve kabul ediyorum.
                    </Label>
                </div>
                <div className="flex items-start space-x-3">
                    <Checkbox id={`${prefix}-terms-2`} required />
                    <Label htmlFor={`${prefix}-terms-2`} className="text-[10px] font-medium leading-relaxed text-muted-foreground cursor-pointer">
                        <Link href="/settings/contracts/kvkk-aydinlatma-metni" className="text-primary font-bold hover:underline">KVKK Aydınlatma Metni</Link> ve <Link href="/settings/contracts/gizlilik-politikasi" className="text-primary font-bold hover:underline">Gizlilik Politikası</Link>'nı okudum ve onaylıyorum.
                    </Label>
                </div>
                <div className="flex items-start space-x-3">
                    <Checkbox id={`${prefix}-terms-3`} required />
                    <Label htmlFor={`${prefix}-terms-3`} className="text-[10px] font-medium leading-relaxed text-muted-foreground cursor-pointer">
                        <Link href="/settings/contracts/cerez-politikasi" className="text-primary font-bold hover:underline">Çerez Politikası</Link> ve <Link href="/settings/contracts/acik-riza-metni" className="text-primary font-bold hover:underline">Açık Rıza Metni</Link>'ni kabul ediyorum.
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
    const { toast } = useToast();
    const action = searchParams.get('action') || 'login';
    const type = searchParams.get('type') || 'individual';
    const entity = searchParams.get('entity') || '';
    const redirectParam = searchParams.get('redirect');
    const [selectedCountry, setSelectedCountry] = useState<string>('');
    
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
        const db = useFirestore();
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
                    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                    const userId = userCredential.user.uid;
                    
                    // Initialize user profile in Firestore
                    const userRef = doc(db, 'users', userId);
                    setDocumentNonBlocking(userRef, {
                        id: userId,
                        name: name,
                        username: `@${phone.replace(/\D/g, '')}`,
                        avatarUrl: '',
                        coverPhotoUrl: '',
                        role: 'user', // Default role
                        personalInfo: {
                            email: email,
                            phone: phone,
                            address: { country: 'Türkiye', city: '', district: '', neighborhood: '', fullAddress: '' }
                        },
                        volunteerInfo: {
                            interests: [],
                            skills: [],
                            dailySkills: [],
                            languages: [],
                            programs: [],
                            licenses: [],
                            documents: [],
                            education: [],
                            travelInfo: { domesticObstacle: false, internationalObstacle: false, visas: [] },
                            emergency: { available: true, hasChronicIllness: false, usesRegularMedication: false, hasPhysicalLimitation: false, emergencyContacts: [] }
                        },
                        impactScore: 0,
                        stats: {
                            totalDonation: 0,
                            donationCount: 0,
                            volunteerHours: 0,
                            completedProjects: 0,
                            totalImpactValue: 0
                        }
                    }, { merge: true });

                    await updateProfile(userCredential.user, { displayName: name });
                } else {
                    await signInWithEmailAndPassword(auth, email, password);
                }
                onComplete();
            } catch (error: any) {
                // DO NOT use console.error(error) here to prevent the visual overlay from showing for expected errors
                if (error.code === 'auth/email-already-in-use') {
                    toast({ 
                        variant: "destructive", 
                        title: "Hesap Zaten Mevcut", 
                        description: "Bu telefon numarası ile kayıtlı bir hesap zaten var. Lütfen giriş yapın." 
                    });
                    handleActionChange('login');
                } else if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found') {
                    toast({ 
                        variant: "destructive", 
                        title: "Giriş Başarısız", 
                        description: "Telefon numarası veya şifre hatalı." 
                    });
                } else {
                    toast({ variant: "destructive", title: "Hata", description: error.message || "İşlem başarısız oldu." });
                }
            } finally {
                setIsLoading(false);
            }
        };
    
        return (
            <form onSubmit={handleSubmit} className="space-y-5 animate-in fade-in-0">
                {isRegister && (
                    <div className="space-y-2">
                        <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Adınız ve Soyadınız</Label>
                        <Input id="name" placeholder="Ör.: İsmail Hilmi ADIGÜZEL" required value={name} onChange={e => setName(e.target.value)} className="h-12 rounded-xl" />
                    </div>
                )}
                <div className="space-y-2">
                    <Label htmlFor="phone" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Telefon Numarası</Label>
                    <div className="flex gap-2">
                        <div className="w-[100px] shrink-0">
                            <Select defaultValue="90" required>
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
                
                <AgreementList type="individual" isLogin={!isRegister} />

                <Button type="submit" className="w-full h-14 rounded-2xl text-base font-black shadow-xl" disabled={isLoading}>
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : (isRegister ? "Kayıt Ol ve Başla" : "Giriş Yap")}
                </Button>
            </form>
        );
    };

    const NgoRegistrationForm = ({ selectedCountry }: { selectedCountry: string }) => {
        const [ngoType, setNgoType] = useState<string>('');
        const [selectedFeds, setSelectedFeds] = useState<string[]>([]);

        const handleSubmit = (e: React.FormEvent) => {
            e.preventDefault();
            toast({ title: "Başvuru Alındı", description: "STK başvurunuz incelemeye alınmıştır." });
            handleRegistrationComplete();
        };

        const toggleFed = (fed: string) => {
            if (selectedFeds.includes(fed)) {
                setSelectedFeds(selectedFeds.filter(f => f !== fed));
            } else if (selectedFeds.length < 3) {
                setSelectedFeds([...selectedFeds, fed]);
            } else {
                toast({ variant: 'destructive', title: 'Limit Aşıldı', description: 'En fazla 3 federasyon seçebilirsiniz.' });
            }
        };

        return (
            <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in-0">
                <div className="space-y-6">
                    <div className="space-y-4">
                        <h3 className="text-sm font-black uppercase tracking-widest text-primary border-b pb-2">Kuruluş Bilgileri</h3>
                        
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Kuruluş Türü</Label>
                            <Select required onValueChange={setNgoType} value={ngoType}>
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
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Kuruluş Adı</Label>
                            <Input placeholder="Kuruluşunuzun tam adı" required className="h-11 rounded-xl" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Kuruluş Kısa Adı</Label>
                                <Input placeholder="hangel Derneği" required className="h-11 rounded-xl" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Kuruluş Yılı</Label>
                                <Select required>
                                    <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="Seç" /></SelectTrigger>
                                    <SelectContent>
                                        {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">İktisadi İşletme Durumu</Label>
                                <Select required>
                                    <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="Seçiniz..." /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="var">Var</SelectItem>
                                        <SelectItem value="yok">Yok</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Kullanım Amacı</Label>
                                <Select defaultValue="both" required>
                                    <SelectTrigger className="h-11 rounded-xl text-[11px]"><SelectValue placeholder="Seçiniz..." /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="donation">Bağış toplamak</SelectItem>
                                        <SelectItem value="volunteer">Gönüllülük ilanı vermek</SelectItem>
                                        <SelectItem value="both">Bağış ve Gönüllülük ilanı vermek</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
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

                    {ngoType === 'spor-kulubu' && (
                        <div className="space-y-4 p-4 border rounded-[2rem] bg-primary/5 border-primary/10 animate-in slide-in-from-top-2">
                            <div className="space-y-1">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">Kayıt Olduğunuz Federasyonlar (En fazla 3)</Label>
                                <p className="text-[9px] text-muted-foreground ml-1">Alttan federasyon seçerek listenize ekleyebilirsiniz.</p>
                            </div>
                            
                            <Select onValueChange={toggleFed}>
                                <SelectTrigger className="h-11 rounded-xl bg-white shadow-sm">
                                    <SelectValue placeholder="Federasyon seçin ve ekleyin..." />
                                </SelectTrigger>
                                <SelectContent className="max-h-60">
                                    {sportsFederations.map(fed => (
                                        <SelectItem key={fed} value={fed} disabled={selectedFeds.includes(fed)}>
                                            {fed}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <div className="flex flex-wrap gap-2 mt-2">
                                {selectedFeds.map(fed => (
                                    <Badge key={fed} className="bg-white text-foreground border shadow-sm px-3 py-1.5 rounded-xl gap-2 h-auto flex items-center">
                                        <span className="text-[11px] font-medium leading-tight">{fed}</span>
                                        <button type="button" onClick={() => toggleFed(fed)} className="text-muted-foreground hover:text-destructive">
                                            <X className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                ))}
                                {selectedFeds.length === 0 && (
                                    <p className="text-[10px] text-muted-foreground italic p-2">Henüz federasyon seçilmedi.</p>
                                )}
                            </div>
                        </div>
                    )}

                    <CheckboxGroup title="Faydalanıcılar" options={allBeneficiaries} />
                    <CheckboxGroup title="Sürdürülebilir Kalkınma Hedefleri" options={allSdgs} />
                    <CheckboxGroup title="Üye Olunan Platformlar" options={allMemberships} />
                    
                    <AddressFields country={selectedCountry} city={city} setCity={setCity} district={district} setDistrict={setDistrict} neighborhood={neighborhood} setNeighborhood={setNeighborhood} required={true} />
                    <CommunicationAndSocialMedia title="İletişim ve Sosyal Medya" emailRequired={true} phoneRequired={true} />
                    <FinancialFields required={true} />

                    <div className="space-y-4">
                        <h3 className="text-sm font-black uppercase tracking-widest text-primary border-b pb-2">Yasal Belgeler</h3>
                        <FileUpload label="Logo" accept=".jpg,.jpeg,.png" hint="Desteklenen format: .jpg, .png" required={true} />
                        <FileUpload label="Faaliyet Belgesi" accept=".pdf,.png" hint="Desteklenen format: .pdf, .png" required={true} />
                        <FileUpload label={ngoType === 'vakif' ? 'Vakıf Senedi' : 'Tüzük'} accept=".pdf" hint="Desteklenen format: .pdf" required={true} />
                    </div>

                    <AuthorizedPersonFields />
                    <AgreementList type="corporate" />
                </div>
                <Button type="submit" className="w-full h-14 rounded-2xl text-base font-black shadow-xl">Başvuruyu Gönder</Button>
            </form>
        );
    };

    const BrandRegistrationForm = ({ selectedCountry }: { selectedCountry: string }) => {
        const [brandStatus, setBrandStatus] = useState<string>('');

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
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">İşletme Statüsü</Label>
                            <Select required onValueChange={setBrandStatus} value={brandStatus}>
                                <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="Seçiniz..." /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="brand">Ticari Marka</SelectItem>
                                    <SelectItem value="cooperative">Kooperatif</SelectItem>
                                    <SelectItem value="economic">İktisadi İşletme</SelectItem>
                                    <SelectItem value="social">Sosyal İşletme</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {brandStatus && brandStatus !== 'brand' && (
                            <div className="animate-in slide-in-from-top-2 duration-300">
                                <FileUpload label="İşletme Kanıt Belgesi" accept=".pdf,.png,.jpg" hint="Statünüzü belgeleyen resmi döküman (Tüzük, tescil vb.)" required={true} />
                            </div>
                        )}

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
                                            required
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
                                            required
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
                    <div className="space-y-6">
                        <h3 className="text-sm font-black uppercase tracking-widest text-primary border-b pb-2">Affiliate Marketing & Teknik Takip</h3>
                        <p className="text-xs text-muted-foreground leading-relaxed px-1">
                            Burada amaç, platformun markanın reklamını veya linklerini yayınlayabilmesi ve satışları takip edebilmesi.
                        </p>
                        
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Affiliate ID veya Referral ID</Label>
                                <Input placeholder="Örnek: HANGEL_REF_001" required className="h-11 rounded-xl" />
                                <p className="text-[9px] text-muted-foreground italic ml-1">Markanın affiliate sistemi varsa sana vereceği ID</p>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Affiliate / Tracking Link / Base URL</Label>
                                <Input placeholder="Örnek: https://marka.com/product/123?ref=HANGEL_REF_001" required className="h-11 rounded-xl" />
                                <p className="text-[9px] text-muted-foreground italic ml-1">Platform üzerinden yönlendirme için kullanılır</p>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Conversion Pixel / Event Script (opsiyonel ama önerilir)</Label>
                                <Textarea 
                                    placeholder='<script>
  window.hangelConversion({ orderId: "123", amount: 499.90, currency: "TRY" });
</script>' 
                                    className="min-h-[100px] rounded-xl font-mono text-xs" 
                                />
                                <p className="text-[9px] text-muted-foreground italic ml-1">Satın alma / işlem gerçekleştiğinde tetiklenecek kod</p>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">API Erişim Bilgileri (isteğe bağlı / ileri seviye)</Label>
                                <Textarea 
                                    placeholder="API Key / Secret / Endpoint bilgilerinizi buraya girebilirsiniz." 
                                    className="min-h-[80px] rounded-xl text-xs" 
                                />
                                <p className="text-[9px] text-muted-foreground italic ml-1">Ürün listesi, fiyat ve stok güncellemesi için</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Cookie Süresi veya Tracking Window</Label>
                                    <Input placeholder="Örn: 30 Gün" required className="h-11 rounded-xl" />
                                    <p className="text-[9px] text-muted-foreground italic ml-1">Kaç saat/gün içinde dönüşüm sayılacak</p>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Kategori / Ürün Bilgisi</Label>
                                    <Input placeholder="Örn: Tüm ürünler" required className="h-11 rounded-xl" />
                                    <p className="text-[9px] text-muted-foreground italic ml-1">Hangi ürünleri yayınlayabilirsin</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <AddressFields country={selectedCountry} city={city} setCity={setCity} district={district} setDistrict={setDistrict} neighborhood={neighborhood} setNeighborhood={setNeighborhood} required={true} />
                    <CommunicationAndSocialMedia title="İletişim ve Sosyal Medya" emailRequired={true} phoneRequired={true} />
                    <FinancialFields type="Marka" required={true} />

                    <div className="space-y-4">
                        <h3 className="text-sm font-black uppercase tracking-widest text-primary border-b pb-2">Yasal Belgeler & Logolar</h3>
                        <FileUpload label="Vergi Levhası" accept=".pdf,.jpg,.jpeg,.png" hint="Desteklenen formatlar: .pdf, .jpg, .png" required={true} />
                        <FileUpload label="Marka Logosu" accept=".jpg,.jpeg,.png" hint="Yüksek çözünürlüklü .png veya .jpg" required={true} />
                    </div>

                    <AuthorizedPersonFields />
                    <AgreementList type="corporate" />
                </div>
                <Button type="submit" className="w-full h-14 rounded-2xl text-base font-black shadow-xl">Başvuruyu Gönder</Button>
            </form>
        );
    };

    const ClubRegistrationForm = ({ selectedCountry }: { selectedCountry: string }) => {
        const [clubSchoolType, setClubSchoolType] = useState<string>('');
        const [clubCategory, setClubCategory] = useState<string>('');
        const [otherClubCategory, setOtherClubCategory] = useState<string>('');
        const isTurkey = selectedCountry === 'Türkiye';
        
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
                            <Select required onValueChange={setClubSchoolType} value={clubSchoolType}>
                                <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="Seçiniz..." /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="university">Üniversite Kulübü</SelectItem>
                                    <SelectItem value="high-school">Lise Kulübü</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {(clubSchoolType === 'university' || clubSchoolType === 'high-school') && (
                            <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                                    {clubSchoolType === 'university' ? 'Üniversite' : 'Okul Adı / Müdürlüğü'}
                                </Label>
                                {isTurkey ? (
                                    <Select required>
                                        <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="Seçiniz..." /></SelectTrigger>
                                        <SelectContent className="max-h-60">
                                            {(clubSchoolType === 'university' ? allUniversities : provincialDirectorates).map(u => (
                                                <SelectItem key={u} value={u}>{u}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <Input placeholder={clubSchoolType === 'university' ? "Üniversite adını girin" : "Okul adını girin"} required className="h-11 rounded-xl" />
                                )}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Kulüp Kategorisi</Label>
                            <Select required onValueChange={setClubCategory} value={clubCategory}>
                                <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="Seçiniz..." /></SelectTrigger>
                                <SelectContent className="max-h-60">
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

                    <AddressFields country={selectedCountry} city={city} setCity={setCity} district={district} setDistrict={setDistrict} neighborhood={neighborhood} setNeighborhood={setNeighborhood} required={true} />
                    <CommunicationAndSocialMedia title="İletişim ve Sosyal Medya" emailRequired={true} phoneRequired={true} />

                    <div className="space-y-4">
                        <h3 className="text-sm font-black uppercase tracking-widest text-primary border-b pb-2">Görseller</h3>
                        <FileUpload label="Kulüp Logosu" accept=".jpg,.jpeg,.png" hint="Desteklenen format: .jpg, .png" required={true} />
                        <FileUpload label="Kapak Fotoğrafı" accept=".jpg,.jpeg,.png" required={true} />
                    </div>

                    <AuthorizedPersonFields />
                    <AgreementList type="corporate" />
                </div>
                <Button type="submit" className="w-full h-14 rounded-2xl text-base font-black shadow-xl" disabled={!clubSchoolType}>Başvuruyu Gönder</Button>
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
                                    <Select onValueChange={handleTypeChange} value={type} required>
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
                                    <>
                                        <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Ülke</Label>
                                            <Select onValueChange={setSelectedCountry} value={selectedCountry} required>
                                                <SelectTrigger className="h-12 rounded-xl font-bold border-muted">
                                                    <SelectValue placeholder="Ülke seçin..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {corporateCountries.map(country => (
                                                        <SelectItem key={country} value={country}>{country}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {selectedCountry && (
                                            <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Kuruluş Türü</Label>
                                                <Select onValueChange={handleEntityChange} value={entity} required>
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
                                    </>
                                )}

                                {type === 'individual' ? (
                                    <IndividualForm isRegister={true} onComplete={handleRegistrationComplete} />
                                ) : (
                                    <div className="pt-4">
                                        {entity === 'NGO' && <NgoRegistrationForm selectedCountry={selectedCountry} />}
                                        {entity === 'BRAND' && <BrandRegistrationForm selectedCountry={selectedCountry} />}
                                        {entity === 'CLUB' && <ClubRegistrationForm selectedCountry={selectedCountry} />}
                                        {!entity && selectedCountry && (
                                            <div className="p-12 text-center border-2 border-dashed rounded-[2rem] opacity-40">
                                                <p className="text-sm font-medium italic">Lütfen kuruluş türünü seçin.</p>
                                            </div>
                                        )}
                                        {!selectedCountry && type === 'corporate' && (
                                            <div className="p-12 text-center border-2 border-dashed rounded-[2rem] opacity-40">
                                                <p className="text-sm font-medium italic">Lütfen önce ülke seçin.</p>
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
                        <span className="font-bold text-xs">hangel</span>
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
                                        <Select defaultValue="90" required>
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
                                    <Input type="tel" placeholder="5XX XXX XX XX" value={friendPhone} onChange={(e) => setFriendPhone(e.target.value)} className="h-12 rounded-xl text-center text-lg font-bold flex-1" required />
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
