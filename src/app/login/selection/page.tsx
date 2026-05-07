'use client';

import React, { useState, Suspense, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Mail,
    Activity,
    Target,
    Trash2,
    Users,
    Instagram,
    Linkedin,
    X,
    ArrowLeft,
    Upload,
    Loader2,
    Building2,
    CheckCircle,
    FileText,
    ShieldAlert,
    Sparkles,
    Store,
    Globe,
    UserCircle,
    MapPin,
    School,
    MessageCircle,
    Smartphone
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import {
    marketCategories, countryPhoneCodes, allCountries, allUniversities,
    allProvinces, districtsData, neighborhoodsData,
    allBeneficiaries, allSdgs, allMemberships
} from '@/lib/data';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth, useFirestore, useUser, setDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase';
import { updateProfile, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { initiateEmailVerification, initiatePasswordResetEmail } from '@/firebase/non-blocking-login';
import { doc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { HangelLogo } from '@/components/icons';

// --- Static Data ---

const universities = [
  "Abdullah Gül Üniversitesi", "Acıbadem Mehmet Ali Aydınlar Üniversitesi",
  "Adana Alparslan Türkeş Bilim Ve Teknoloji Üniversitesi", "Adıyaman Üniversitesi",
  "Afyon Kocatepe Üniversitesi", "Afyonkarahisar Sağlık Bilimleri Üniversitesi",
  "Ağrı İbrahim Çeçen Üniversitesi", "Akdeniz Üniversitesi", "Aksaray Üniversitesi",
  "Alanya Alaaddin Keykubat Üniversitesi", "Alanya Üniversitesi", "Altınbaş Üniversitesi",
  "Amasya Üniversitesi", "Anadolu Üniversitesi", "Ankara Bilim Üniversitesi",
  "Ankara Hacı Bayram Veli Üniversitesi", "Ankara Medipol Üniversitesi",
  "Ankara Müzik Ve Güzel Sanatlar Üniversitesi", "Ankara Sosyal Bilimler Üniversitesi",
  "Ankara Üniversitesi", "Ankara Yıldırım Beyazıt Üniversitesi", "Antalya Belek Üniversitesi",
  "Antalya Bilim Üniversitesi", "Ardahan Üniversitesi", "Artvin Çoruh Üniversitesi",
  "Ataşehir Adıgüzel Meslek Yüksekokulu", "Atatürk Üniversitesi", "Atılım Üniversitesi",
  "Avrasya Üniversitesi", "Aydın Adnan Menderes Üniversitesi", "Bahçeşehir Üniversitesi",
  "Balıkesir Üniversitesi", "Bandırma Onyedi Eylül Üniversitesi", "Bartın Üniversitesi",
  "Başkent Üniversitesi", "Batman Üniversitesi", "Bayburt Üniversitesi",
  "Beykoz Üniversitesi", "Bezm-İ Âlem Vakıf Üniversitesi", "Bilecik Şeyh Edebali Üniversitesi",
  "Bingöl Üniversitesi", "Biruni Üniversitesi", "Bitlis Eren Üniversitesi",
  "Boğaziçi Üniversitesi", "Bolu Abant İzzet Baysal Üniversitesi",
  "Burdur Mehmet Akif Ersoy Üniversitesi", "Bursa Teknik Üniversitesi",
  "Bursa Uludağ Üniversitesi", "Çağ Üniversitesi", "Çanakkale Onsekiz Mart Üniversitesi",
  "Çankaya Üniversitesi", "Çankırı Karatekin Üniversitesi", "Çukurova Üniversitesi",
  "Demiroğlu Bilim Üniversitesi", "Dicle Üniversitesi", "Doğuş Üniversitesi",
  "Dokuz Eylül Üniversitesi", "Düzce Üniversitesi", "Ege Üniversitesi",
  "Erciyes Üniversitesi", "Erzincan Binali Yıldırım Üniversitesi",
  "Erzurum Teknik Üniversitesi", "Eskişehir Osmangazi Üniversitesi",
  "Eskişehir Teknik Üniversitesi", "Fatih Sultan Mehmet Vakıf Üniversitesi",
  "Fenerbahçe Üniversitesi", "Fırat Üniversitesi", "Galatasaray Üniversitesi",
  "Gazi Üniversitesi", "Gaziantep İslam Bilim Ve Teknoloji Üniversitesi",
  "Gaziantep Üniversitesi", "Gebze Teknik Üniversitesi", "Giresun Üniversitesi",
  "Gümüşhane Üniversitesi", "Hacettepe Üniversitesi", "Hakkari Üniversitesi",
  "Haliç Üniversitesi", "Harran Üniversitesi", "Hasan Kalyoncu Üniversitesi",
  "Hatay Mustafa Kemal Üniversitesi", "Hitit Üniversitesi", "Iğdır Üniversitesi",
  "Isparta Uygulamalı Bilimler Üniversitesi", "Işık Üniversitesi",
  "İbn Haldun Üniversitesi", "İhsan Doğramacı Bilkent Üniversitesi",
  "İnönü Üniversitesi", "İskenderun Teknik Üniversitesi", "İstanbul 29 Mayıs Üniversitesi",
  "İstanbul Arel Üniversitesi", "İstanbul Atlas Üniversitesi", "İstanbul Aydın Üniversitesi",
  "İstanbul Beykent Üniversitesi", "İstanbul Bilgi Üniversitesi",
  "İstanbul Esenyurt Üniversitesi", "İstanbul Galata Üniversitesi",
  "İstanbul Gedik Üniversitesi", "İstanbul Gelişim Üniversitesi",
  "İstanbul Kent Üniversitesi", "İstanbul Kültür Üniversitesi",
  "İstanbul Medeniyet Üniversitesi", "İstanbul Medipol Üniversitesi",
  "İstanbul Nişantaşı Üniversitesi", "İstanbul Okan Üniversitesi",
  "İstanbul Rumeli Üniversitesi", "İstanbul Sabahattin Zaim Üniversitesi",
  "İstanbul Sağlık Ve Sosyal Bilimler Meslek Yüksekokulu",
  "İstanbul Sağlık Ve Teknoloji Üniversitesi", "İstanbul Şişli Meslek Yüksekokulu",
  "İstanbul Teknik Üniversitesi", "İstanbul Ticaret Üniversitesi",
  "İstanbul Topkapı Üniversitesi", "İstanbul Üniversitesi",
  "İstanbul Üniversitesi-Cerrahpaşa", "İstanbul Yeni Yüzyıl Üniversitesi",
  "İstinye Üniversitesi", "İzmir Bakırçay Üniversitesi", "İzmir Demokrasi Üniversitesi",
  "İzmir Ekonomi Üniversitesi", "İzmir Katip Çelebi Üniversitesi",
  "İzmir Kavram Meslek Yüksekokulu", "İzmir Tınaztepe Üniversitesi",
  "İzmir Yüksek Teknoloji Enstitüsü", "Kadir Has Üniversitesi", "Kafkas Üniversitesi",
  "Kahramanmaraş İstiklal Üniversitesi", "Kahramanmaraş Sütçü İmam Üniversitesi",
  "Kapadokya Üniversitesi", "Karabük Üniversitesi", "Karadeniz Teknik Üniversitesi",
  "Karamanoğlu Mehmetbey Üniversitesi", "Kastamonu Üniversitesi", "Kayseri Üniversitesi",
  "Kırıkkale Üniversitesi", "Kırklareli Üniversitesi", "Kırşehir Ahi Evran Üniversitesi",
  "Kilis 7 Aralık Üniversitesi", "Kocaeli Sağlık Ve Teknoloji Üniversitesi",
  "Kocaeli Üniversitesi", "Koç Üniversitesi", "Konya Gıda Ve Tarım Üniversitesi",
  "Konya Teknik Üniversitesi", "Kto Karatay Üniversitesi",
  "Kütahya Dumlupınar Üniversitesi", "Kütahya Sağlık Bilimleri Üniversitesi",
  "Lokman Hekim Üniversitesi", "Malatya Turgut Özal Üniversitesi",
  "Maltepe Üniversitesi", "Manisa Celâl Bayar Üniversitesi", "Mardin Artuklu Üniversitesi",
  "Marmara Üniversitesi", "Mef Üniversitesi", "Mersin Üniversitesi",
  "Mimar Sinan Güzel Sanatlar Üniversitesi", "Mudanya Üniversitesi",
  "Muğla Sıtkı Koçman Üniversitesi", "Munzur Üniversitesi", "Muş Alparslan Üniversitesi",
  "Necmettin Erbakan Üniversitesi", "Nevşehir Hacı Bektaş Veli Üniversitesi",
  "Niğde Ömer Halisdemir Üniversitesi", "Nuh Naci Yazgan Üniversitesi",
  "Ondokuz Mayıs Üniversitesi", "Ordu Üniversitesi", "Orta Doğu Teknik Üniversitesi",
  "Osmaniye Korkut Ata Üniversitesi", "Ostim Teknik Üniversitesi",
  "Özyeğin Üniversitesi", "Pamukkale Üniversitesi", "Piri Reis Üniversitesi",
  "Recep Tayyip Erdoğan Üniversitesi", "Sabancı Üniversitesi",
  "Sağlık Bilimleri Üniversitesi", "Sakarya Uygulamalı Bilimler Üniversitesi",
  "Sakarya Üniversitesi", "Samsun Üniversitesi", "Sanko Üniversitesi",
  "Selçuk Üniversitesi", "Siirt Üniversitesi", "Sinop Üniversitesi",
  "Sivas Bilim Ve Teknoloji Üniversitesi", "Sivas Cumhuriyet Üniversitesi",
  "Süleyman Demirel Üniversitesi", "Şırnak Üniversitesi", "Tarsus Üniversitesi",
  "Ted Üniversitesi", "Tekirdağ Namık Kemal Üniversitesi",
  "Tobb Ekonomi Ve Teknoloji Üniversitesi", "Tokat Gaziosmanpaşa Üniversitesi",
  "Toros Üniversitesi", "Trabzon Üniversitesi", "Trakya Üniversitesi",
  "Türk Hava Kurumu Üniversitesi", "Türk-Alman Üniversitesi", "Ufuk Üniversitesi",
  "Uşak Üniversitesi", "Üsküdar Üniversitesi", "Van Yüzüncü Yıl Üniversitesi",
  "Yalova Üniversitesi", "Yaşar Üniversitesi", "Yeditepe Üniversitesi",
  "Yıldız Teknik Üniversitesi", "Yozgat Bozok Üniversitesi",
  "Yüksek İhtisas Üniversitesi", "Zonguldak Bülent Ecevit Üniversitesi",
];

const clubCategories = [
  "Teknoloji & Bilim", "Yapay Zeka", "Siber Güvenlik", "Veri Bilimi",
  "Yazılım Geliştirme", "Oyun Geliştirme", "Donanım / Robotik", "Bilim ve Araştırma",
  "Sanat & Kültür", "Müzik", "Tiyatro", "Sinema", "Fotoğrafçılık",
  "Resim ve Görsel Sanatlar", "Edebiyat", "Dans",
  "Sosyal Etki & Toplum", "Gönüllülük", "Sosyal Sorumluluk", "Sosyal Girişimcilik",
  "Hak Temelli Çalışmalar", "İnsan Hakları", "Mülteci ve Uyum", "Hayvan Hakları",
  "Sürdürülebilirlik", "Afet ve Arama Kurtarma",
  "Kariyer & Gelişim", "Girişimcilik", "Kariyer ve Gelişim", "İnovasyon",
  "Mesleki Gelişim", "Kişisel Gelişim",
  "Akademik & Düşünsel", "Felsefe", "Ekonomi", "Hukuk",
  "Politika ve Kamu Yönetimi", "Münazara", "Fikir ve Tartışma",
  "Erasmus / Uluslararası Programlar", "Yabancı Dil",
  "Spor & Outdoor", "Futbol", "Basketbol", "Satranç", "Voleybol",
  "Dağcılık & Trekking", "Su Sporları", "Kampçılık", "Diğer Sporlar",
];

const uniquePhoneCodes = Array.from(new Set(countryPhoneCodes)).sort();

// --- Shared UI Components ---

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

const FileUpload = ({label, accept, hint, required}: {label: string, accept?: string, hint?: string, required?: boolean}) => {
    const [fileName, setFileName] = React.useState<string | null>(null);
    const [uploadError, setUploadError] = React.useState<string | null>(null);
    const inputId = `${label.replace(/\s+/g, '-')}-upload`;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (accept) {
            const allowedExts = accept.split(',').map(a => a.trim().toLowerCase());
            const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();
            if (!allowedExts.includes(fileExt)) {
                setUploadError(`Desteklenmeyen dosya türü. İzin verilenler: ${accept}`);
                setFileName(null);
                e.target.value = '';
                return;
            }
        }
        setUploadError(null);
        setFileName(file.name);
    };

    const status = uploadError ? 'error' : fileName ? 'success' : 'idle';

    return (
        <div className="space-y-2 text-left">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{label} {required && "*"}</Label>
            <div className={cn("flex items-center gap-4 p-4 border rounded-2xl border-dashed transition-all",
                status === 'success' && "bg-green-50 border-green-400 dark:bg-green-900/20 dark:border-green-600",
                status === 'error'   && "bg-red-50 border-red-400 dark:bg-red-900/20 dark:border-red-600",
                status === 'idle'    && "bg-muted/20 border-primary/20 hover:bg-muted/30",
            )}>
                <input id={inputId} type="file" className="hidden" accept={accept} required={required} onChange={handleChange} />
                <Button asChild variant="outline" size="sm" className={cn("rounded-xl hover:bg-primary/5 bg-background h-10 px-4",
                    status === 'success' && "border-green-500 text-green-700",
                    status === 'error'   && "border-red-500 text-red-700",
                    status === 'idle'    && "border-primary/20",
                )}>
                    <label htmlFor={inputId} className="cursor-pointer font-bold flex items-center">
                        {status === 'success' ? <><CheckCircle className="mr-2 h-4 w-4 text-green-600" />Değiştir</> :
                         status === 'error'   ? <><X className="mr-2 h-4 w-4 text-red-600" />Tekrar Seç</> :
                         <><Upload className="mr-2 h-4 w-4" />Belge Seç</>}
                    </label>
                </Button>
                <div className="flex-1">
                    {status === 'success' && <p className="text-[11px] font-bold text-green-700 dark:text-green-400 truncate">✓ {fileName}</p>}
                    {status === 'error'   && <p className="text-[11px] font-bold text-red-600 leading-tight">{uploadError}</p>}
                    {status === 'idle'    && <p className="text-[10px] text-muted-foreground leading-tight">{hint || "Lütfen resmi formatta bir dosya yükleyin."}</p>}
                </div>
            </div>
        </div>
    );
};

const FilteredSelect = ({
    value, onChange, options, placeholder, triggerClassName
}: {
    value: string;
    onChange: (val: string) => void;
    options: string[];
    placeholder?: string;
    triggerClassName?: string;
}) => {
    const [filter, setFilter] = React.useState('');
    const filtered = filter
        ? options.filter(o => o.toLowerCase().includes(filter.toLowerCase()))
        : options;
    return (
        <Select value={value} onValueChange={(v) => { onChange(v); setFilter(''); }}>
            <SelectTrigger className={triggerClassName ?? "h-12 rounded-xl bg-primary/5 border-primary shadow-sm font-bold text-left"}>
                <SelectValue placeholder={placeholder ?? "Seçiniz..."} />
            </SelectTrigger>
            <SelectContent className="max-h-72">
                <div className="px-2 py-1 sticky top-0 bg-popover z-10">
                    <input
                        className="w-full h-8 px-2 text-sm rounded-md border border-input bg-background outline-none"
                        placeholder="Filtrele..."
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        onKeyDown={(e) => e.stopPropagation()}
                    />
                </div>
                {filtered.length === 0
                    ? <div className="px-3 py-2 text-xs text-muted-foreground">Sonuç bulunamadı</div>
                    : filtered.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)
                }
            </SelectContent>
        </Select>
    );
};

const YearSelect = ({ value, onChange }: { value: string; onChange: (val: string) => void }) => {
    const [yearFilter, setYearFilter] = React.useState('');
    const allYears = Array.from({ length: 2025 - 1850 }, (_, i) => (2024 - i).toString());
    const filtered = yearFilter ? allYears.filter(y => y.includes(yearFilter)) : allYears;
    return (
        <Select value={value} onValueChange={onChange}>
            <SelectTrigger className="h-12 rounded-xl bg-card border-none shadow-sm">
                <SelectValue placeholder="Yıl seçin" />
            </SelectTrigger>
            <SelectContent className="max-h-64">
                <div className="px-2 py-1 sticky top-0 bg-popover z-10">
                    <input
                        className="w-full h-8 px-2 text-sm rounded-md border border-input bg-background outline-none"
                        placeholder="Yıl filtrele..."
                        value={yearFilter}
                        onChange={(e) => setYearFilter(e.target.value)}
                        onKeyDown={(e) => e.stopPropagation()}
                    />
                </div>
                {filtered.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
            </SelectContent>
        </Select>
    );
};

const SectionTitle = ({ children, icon: Icon }: { children: React.ReactNode, icon?: any }) => (
    <div className="flex items-start gap-2 mb-4 pt-4 first:pt-0">
        {Icon && <Icon className="h-5 w-5 text-primary shrink-0 mt-0.5" />}
        <h3 className="text-sm font-black uppercase tracking-[0.1em] text-primary text-left">{children}</h3>
    </div>
);

const FormLabel = ({ children, required }: { children: React.ReactNode, required?: boolean }) => (
    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 mb-2 block text-left">
        {children} {required && <span className="text-primary">*</span>}
    </Label>
);

const FormInput = (props: React.ComponentProps<typeof Input>) => (
    <Input {...props} className={cn("h-12 rounded-xl bg-card border-none shadow-sm focus-visible:ring-1 focus-visible:ring-primary/30", props.className)} />
);

const IconInput = ({ icon: Icon, ...props }: React.ComponentProps<typeof Input> & { icon: React.ComponentType<any> }) => (
    <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input {...props} className={cn("h-12 rounded-xl bg-card border-none shadow-sm focus-visible:ring-1 focus-visible:ring-primary/30 pl-10", props.className)} />
    </div>
);

const brandCategoryOptions = [
    "Giyim & Aksesuar", "Elektronik", "Kozmetik & Kişisel Bakım",
    "Ev & Yaşam", "Gıda & İçecek", "Spor & Outdoor",
    "Kitap & Kırtasiye", "Oyuncak & Hobi", "Sağlık & Medikal",
    "Otomotiv", "Mücevher & Saat", "Diğer"
];

type IndividualStep = 'email' | 'login' | 'register' | 'verify-sent' | 'forgot' | 'forgot-sent';

const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

const IndividualForm = ({ onComplete }: { onComplete: (isNewUser: boolean) => void }) => {
    const auth = useAuth();
    const db = useFirestore();
    const { toast } = useToast();

    const [step, setStep] = useState<IndividualStep>('email');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [phoneCode, setPhoneCode] = useState('90');
    const [existingName, setExistingName] = useState('');
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const normalizedEmail = email.trim().toLowerCase();
    const fullPhone = `+${phoneCode}${phone.replace(/\D/g, '')}`;

    const goToEmailStep = () => {
        setStep('email');
        setPassword('');
        setPasswordConfirm('');
        setName('');
        setPhone('');
        setPhoneCode('90');
        setExistingName('');
    };

    // Adım 1: E-posta kontrolü
    const handleCheckEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isValidEmail(email)) {
            toast({ variant: 'destructive', title: 'Hata', description: 'Geçerli bir e-posta girin.' });
            return;
        }
        setIsLoading(true);
        try {
            const res = await fetch('/api/auth/check-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: normalizedEmail }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Kontrol başarısız');

            if (data.unsupported) {
                toast({
                    variant: 'destructive',
                    title: 'Desteklenmiyor',
                    description: 'Bu e-posta adresi desteklenmiyor. Farklı bir adres kullanın.'
                });
                return;
            }

            if (data.exists) {
                setExistingName(data.name || '');
                setStep('login');
            } else {
                setStep('register');
            }
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Hata', description: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    // Adım 2a: Mevcut kullanıcı girişi
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await signInWithEmailAndPassword(auth, normalizedEmail, password);
            onComplete(false);
        } catch (error: any) {
            const code = error.code;
            const msg =
                code === 'auth/wrong-password' || code === 'auth/invalid-credential' || code === 'auth/user-not-found'
                    ? 'E-posta veya şifre hatalı.'
                    : code === 'auth/too-many-requests'
                    ? 'Çok fazla deneme. Biraz sonra tekrar deneyin.'
                    : error.message || 'Giriş başarısız.';
            toast({ variant: 'destructive', title: 'Hata', description: msg });
        } finally {
            setIsLoading(false);
        }
    };

    // Adım 2b: Yeni kullanıcı kaydı
    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password.length < 6) {
            toast({ variant: 'destructive', title: 'Hata', description: 'Şifre en az 6 karakter olmalıdır.' });
            return;
        }
        if (password !== passwordConfirm) {
            toast({ variant: 'destructive', title: 'Hata', description: 'Şifreler uyuşmuyor.' });
            return;
        }
        if (!phone.trim()) {
            toast({ variant: 'destructive', title: 'Hata', description: 'Telefon numarası gerekli.' });
            return;
        }
        setIsLoading(true);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, normalizedEmail, password);
            const userId = userCredential.user.uid;
            if (name) {
                try { await updateProfile(userCredential.user, { displayName: name }); } catch {}
            }
            setDocumentNonBlocking(doc(db, 'users', userId), {
                id: userId,
                name: name || '',
                role: 'user',
                personalInfo: {
                    email: normalizedEmail,
                    phone: fullPhone,
                },
                stats: { totalDonation: 0, volunteerHours: 0, impactScore: 0 },
                createdAt: serverTimestamp(),
                joinDate: new Date().toISOString().split('T')[0],
            }, { merge: true });

            try {
                await initiateEmailVerification(userCredential.user);
            } catch {
                // Doğrulama maili başarısız olsa bile akışı bloklama — banner'dan tekrar gönderilebilir.
            }
            setStep('verify-sent');
        } catch (error: any) {
            const code = error.code;
            const msg =
                code === 'auth/weak-password'
                    ? 'Şifre çok zayıf. En az 6 karakter kullanın.'
                    : code === 'auth/email-already-in-use'
                    ? 'Bu e-posta zaten kayıtlı. Giriş yapın.'
                    : error.message || 'Kayıt başarısız.';
            toast({ variant: 'destructive', title: 'Hata', description: msg });
        } finally {
            setIsLoading(false);
        }
    };

    // Şifremi unuttum: e-posta gönder
    const handleSendReset = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isValidEmail(email)) {
            toast({ variant: 'destructive', title: 'Hata', description: 'Geçerli bir e-posta girin.' });
            return;
        }
        setIsLoading(true);
        try {
            await initiatePasswordResetEmail(auth, normalizedEmail);
            setStep('forgot-sent');
        } catch (error: any) {
            const code = error.code;
            const msg =
                code === 'auth/too-many-requests'
                    ? 'Çok fazla deneme. Biraz sonra tekrar deneyin.'
                    : code === 'auth/user-not-found'
                    ? 'Bu e-posta ile kayıtlı hesap bulunamadı.'
                    : 'E-posta gönderilemedi.';
            toast({ variant: 'destructive', title: 'Hata', description: msg });
        } finally {
            setIsLoading(false);
        }
    };

    // Doğrulama e-postasını tekrar gönder
    const handleResendVerification = async () => {
        if (!auth.currentUser) return;
        setIsLoading(true);
        try {
            await initiateEmailVerification(auth.currentUser);
            toast({ title: 'Gönderildi', description: 'Doğrulama e-postası tekrar gönderildi.' });
        } catch (error: any) {
            const code = error.code;
            const msg =
                code === 'auth/too-many-requests'
                    ? 'Çok fazla deneme. Biraz sonra tekrar deneyin.'
                    : 'E-posta gönderilemedi.';
            toast({ variant: 'destructive', title: 'Hata', description: msg });
        } finally {
            setIsLoading(false);
        }
    };

    // — Adım 1: E-posta —
    if (step === 'email') {
        return (
            <form onSubmit={handleCheckEmail} className="space-y-5">
                <div className="space-y-2">
                    <FormLabel>E-posta *</FormLabel>
                    <FormInput
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        placeholder="ornek@mail.com"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="font-bold"
                        enterKeyHint="done"
                        autoFocus
                    />
                </div>
                <Button type="submit" className="w-full h-14 rounded-2xl text-base font-black shadow-xl" disabled={isLoading}>
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Devam Et'}
                </Button>
            </form>
        );
    }

    // — Adım 2a: Mevcut kullanıcı → sadece şifre —
    if (step === 'login') {
        return (
            <div className="space-y-6">
                <div className="text-center space-y-1">
                    <p className="text-base font-black">
                        {existingName ? `Tekrar hoş geldiniz, ${existingName.split(' ')[0]}! 👋` : 'Tekrar hoş geldiniz! 👋'}
                    </p>
                    <p className="text-xs text-muted-foreground">{normalizedEmail}</p>
                </div>
                <form onSubmit={handleLogin} className="space-y-5">
                    <div className="space-y-2">
                        <FormLabel>Şifre *</FormLabel>
                        <FormInput
                            type="password"
                            autoComplete="current-password"
                            placeholder="Şifrenizi girin"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            enterKeyHint="done"
                            autoFocus
                        />
                    </div>
                    <Button type="submit" className="w-full h-14 rounded-2xl text-base font-black shadow-xl" disabled={isLoading}>
                        {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Giriş Yap'}
                    </Button>
                    <Button type="button" variant="link" className="w-full text-sm" onClick={() => setStep('forgot')} disabled={isLoading}>
                        Şifremi unuttum
                    </Button>
                    <Button type="button" variant="ghost" className="w-full" onClick={goToEmailStep} disabled={isLoading}>
                        <ArrowLeft className="h-4 w-4 mr-2" /> E-postayı değiştir
                    </Button>
                </form>
            </div>
        );
    }

    // — Adım 2b: Yeni kullanıcı → ad + telefon + şifre + tekrar —
    if (step === 'register') {
        return (
            <div className="space-y-6">
                <div className="text-center space-y-1">
                    <p className="text-base font-black">Hesap oluşturun</p>
                    <p className="text-xs text-muted-foreground">{normalizedEmail}</p>
                </div>
                <form onSubmit={handleRegister} className="space-y-5">
                    <div className="space-y-2">
                        <FormLabel>Ad Soyad *</FormLabel>
                        <FormInput
                            placeholder="Ör.: İsmail Hilmi ADIGÜZEL"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            enterKeyHint="next"
                            autoFocus
                        />
                    </div>
                    <div className="space-y-2">
                        <FormLabel>Telefon *</FormLabel>
                        <div className="flex gap-2">
                            <div className="w-[100px] shrink-0">
                                <Select value={phoneCode} onValueChange={setPhoneCode}>
                                    <SelectTrigger className="h-12 rounded-xl bg-card border-none shadow-sm"><SelectValue /></SelectTrigger>
                                    <SelectContent className="max-h-60">
                                        {uniquePhoneCodes.map((code, idx) => (
                                            <SelectItem key={`${code}-${idx}`} value={code}>+{code}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <FormInput
                                type="tel"
                                placeholder="5XXXXXXXXX"
                                required
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="flex-1 font-bold"
                                enterKeyHint="next"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <FormLabel>Şifre *</FormLabel>
                        <FormInput
                            type="password"
                            autoComplete="new-password"
                            placeholder="En az 6 karakter"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            minLength={6}
                            enterKeyHint="next"
                        />
                    </div>
                    <div className="space-y-2">
                        <FormLabel>Şifre Tekrar *</FormLabel>
                        <FormInput
                            type="password"
                            autoComplete="new-password"
                            placeholder="Şifrenizi tekrar girin"
                            required
                            value={passwordConfirm}
                            onChange={(e) => setPasswordConfirm(e.target.value)}
                            minLength={6}
                            enterKeyHint="done"
                        />
                    </div>
                    <Button type="submit" className="w-full h-14 rounded-2xl text-base font-black shadow-xl" disabled={isLoading}>
                        {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Kayıt Ol'}
                    </Button>
                    <Button type="button" variant="ghost" className="w-full" onClick={goToEmailStep} disabled={isLoading}>
                        <ArrowLeft className="h-4 w-4 mr-2" /> E-postayı değiştir
                    </Button>
                </form>
            </div>
        );
    }

    // — Kayıt sonrası: e-posta doğrulama uyarısı —
    if (step === 'verify-sent') {
        return (
            <div className="space-y-6 text-center">
                <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                    <Mail className="h-7 w-7 text-primary" />
                </div>
                <div className="space-y-2">
                    <p className="text-base font-black">E-postanızı doğrulayın</p>
                    <p className="text-sm text-muted-foreground">
                        <span className="font-semibold">{normalizedEmail}</span> adresine doğrulama bağlantısı gönderdik. Linke tıklayarak hesabınızı aktifleştirin.
                    </p>
                </div>
                <div className="space-y-3">
                    <Button
                        type="button"
                        className="w-full h-12 rounded-2xl font-black"
                        onClick={() => onComplete(true)}
                    >
                        Devam Et
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        className="w-full h-12 rounded-2xl"
                        onClick={handleResendVerification}
                        disabled={isLoading}
                    >
                        {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'E-postayı tekrar gönder'}
                    </Button>
                </div>
            </div>
        );
    }

    // — Şifremi unuttum: e-posta gönder formu —
    if (step === 'forgot') {
        return (
            <div className="space-y-6">
                <div className="text-center space-y-1">
                    <p className="text-base font-black">Şifrenizi sıfırlayın</p>
                    <p className="text-xs text-muted-foreground">Size sıfırlama bağlantısı gönderelim.</p>
                </div>
                <form onSubmit={handleSendReset} className="space-y-5">
                    <div className="space-y-2">
                        <FormLabel>E-posta *</FormLabel>
                        <FormInput
                            type="email"
                            inputMode="email"
                            autoComplete="email"
                            placeholder="ornek@mail.com"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            enterKeyHint="done"
                            autoFocus
                        />
                    </div>
                    <Button type="submit" className="w-full h-14 rounded-2xl text-base font-black shadow-xl" disabled={isLoading}>
                        {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Sıfırlama linki gönder'}
                    </Button>
                    <Button type="button" variant="ghost" className="w-full" onClick={() => setStep('login')} disabled={isLoading}>
                        <ArrowLeft className="h-4 w-4 mr-2" /> Geri
                    </Button>
                </form>
            </div>
        );
    }

    // — Şifre sıfırlama: e-posta gönderildi —
    return (
        <div className="space-y-6 text-center">
            <div className="mx-auto w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-7 w-7 text-green-600" />
            </div>
            <div className="space-y-2">
                <p className="text-base font-black">Bağlantı gönderildi</p>
                <p className="text-sm text-muted-foreground">
                    <span className="font-semibold">{normalizedEmail}</span> adresine şifre sıfırlama bağlantısı gönderdik. E-postanızı kontrol edin.
                </p>
            </div>
            <Button type="button" variant="ghost" className="w-full" onClick={goToEmailStep}>
                <ArrowLeft className="h-4 w-4 mr-2" /> Girişe dön
            </Button>
        </div>
    );
};

const CorporateForm = ({ initialEntity }: { initialEntity: string }) => {
    const db = useFirestore();
    const router = useRouter();
    const { toast } = useToast();
    const { user: authUser } = useUser();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [entityType, setEntityType] = useState<string>(initialEntity);
    
    const [formData, setFormData] = useState({
        name: '',
        shortName: '',
        orgTag: '',
        orgSubType: '',
        communicationAddress: '',
        slogan: '',
        sector: '',
        affiliateId: '',
        trackingLink: '',
        pixelScript: '',
        cookieDuration: '',
        exceptions: '',
        city: '',
        district: '',
        neighborhood: '',
        addressLine: '',
        email: '',
        phone: '',
        phoneCode: '90',
        website: '',
        social: { instagram: '', twitter: '', linkedin: '' },
        legalTitle: '',
        iban: '',
        posDevice: false,
        clubType: '',
        universityName: '',
        cityMEB: '',
        clubCategory: '',
        authorized: { name: '', role: '', email: '', phone: '', phoneCode: '90' },
        registryNo: '',
        country: 'Türkiye',
        brandStatus: '',
    });

    const [selectedBeneficiaries, setSelectedBeneficiaries] = useState<string[]>([]);
    const [selectedServiceAreas, setSelectedServiceAreas] = useState<string[]>([]);
    const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
    const [donationCategories, setDonationCategories] = useState<{ id: string; category: string; rate: string; customCategory: string }[]>([
        { id: '1', category: '', rate: '', customCategory: '' }
    ]);
    const [isCheckingRegistry, setIsCheckingRegistry] = useState(false);
    const [registryNgoFound, setRegistryNgoFound] = useState<{ name: string } | null>(null);

    const toggleItem = (list: string[], setter: React.Dispatch<React.SetStateAction<string[]>>, item: string) => {
        setter(prev => prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]);
    };

    const handleRegistryNoCheck = async (value: string) => {
        setFormData(prev => ({ ...prev, registryNo: value }));
        if (value.length < 3) { setRegistryNgoFound(null); return; }
        setIsCheckingRegistry(true);
        try {
            const { getDocs, query, where } = await import('firebase/firestore');
            const q = query(collection(db, 'ngos'), where('registryNo', '==', value));
            const snap = await getDocs(q);
            if (!snap.empty) {
                const ngoData = snap.docs[0].data();
                setRegistryNgoFound({ name: ngoData.name || 'Bilinmeyen' });
                setFormData(prev => ({ ...prev, registryNo: value, name: ngoData.name || prev.name, shortName: ngoData.shortName || prev.shortName }));
            } else { setRegistryNgoFound(null); }
        } catch { setRegistryNgoFound(null); }
        finally { setIsCheckingRegistry(false); }
    };

    const addCategory = () => {
        setDonationCategories(prev => [...prev, { id: Date.now().toString(), category: '', rate: '', customCategory: '' }]);
    };

    const removeCategory = (id: string) => {
        setDonationCategories(prev => prev.filter(cat => cat.id !== id));
    };

    const validateForm = (): string | null => {
        if (!formData.name?.trim()) {
            return entityType === 'BRAND' ? 'Marka adı zorunludur.' : entityType === 'CLUB' ? 'Kulüp adı zorunludur.' : 'Kuruluş adı zorunludur.';
        }
        if (!formData.email?.trim()) return 'Kurumsal e-posta zorunludur.';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) return 'Geçerli bir e-posta adresi girin.';
        if (!formData.phone?.trim()) return 'Telefon numarası zorunludur.';
        if (!formData.authorized.name?.trim()) return 'Yetkili kişinin adı zorunludur.';
        if (!formData.authorized.role?.trim()) return 'Yetkili kişinin görevi zorunludur.';
        if (!formData.authorized.email?.trim()) return 'Yetkili kişinin e-postası zorunludur.';
        if (!formData.authorized.phone?.trim()) return 'Yetkili kişinin telefonu zorunludur.';
        if (entityType === 'CLUB' && !formData.clubType) return 'Kulüp türünü seçin.';
        return null;
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const validationError = validateForm();
        if (validationError) {
            toast({ variant: 'destructive', title: 'Eksik Bilgi', description: validationError });
            return;
        }

        setIsSubmitting(true);
        try {
            // /my-applications sayfası type='Kulüpler' / 'STK' / 'Marka' filtresiyle çalışır.
            // Onlara uyacak şekilde entityType'tan tab type'ı türetiyoruz.
            const tabType =
                entityType === 'NGO' ? 'STK' :
                entityType === 'BRAND' ? 'Marka' :
                entityType === 'CLUB' ? 'Kulüpler' : 'Kurumsal Başvuru';

            await addDoc(collection(db, 'applications'), {
                ...formData,
                entityType,
                type: tabType,
                title: formData.name || 'Kurumsal Başvuru',
                org: formData.name || '',
                location: [formData.city, formData.country].filter(Boolean).join(', ') || '',
                userId: authUser?.uid || null, // Login'liyse /my-applications'da görünür
                userName: authUser?.displayName || formData.authorized?.name || '',
                userEmail: authUser?.email || formData.email || '',
                selectedBeneficiaries,
                selectedServiceAreas,
                selectedPlatforms,
                donationCategories,
                date: new Date().toISOString().split('T')[0],
                createdAt: serverTimestamp(),
                status: 'Beklemede',
            });
            toast({ title: "Başvuru Alındı", description: "En kısa sürede sizinle iletişime geçeceğiz." });
            router.push(authUser ? '/my-applications' : '/login');
        } catch (error: any) {
            console.error('Application submit failed:', error);
            toast({
                variant: 'destructive',
                title: 'Başvuru Gönderilemedi',
                description: error?.code === 'permission-denied'
                    ? 'Sunucu izin vermedi. Yetkilerinizi kontrol edin.'
                    : (error?.message || 'Bilinmeyen bir hata oluştu.'),
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleFormSubmit} noValidate className="space-y-10 animate-in fade-in-0 pb-10">
            {/* Global Selectors */}
            <div className="space-y-6">
                <div className="space-y-2">
                    <FormLabel>Ülke</FormLabel>
                    <Select value={formData.country} onValueChange={(val) => setFormData({...formData, country: val})}>
                        <SelectTrigger className="h-12 rounded-xl bg-card border-none shadow-sm font-bold text-left"><SelectValue /></SelectTrigger>
                        <SelectContent className="max-h-60">
                            {(allCountries || []).map((c, idx) => <SelectItem key={`${c}-${idx}`} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <FormLabel>Kuruluş Türü</FormLabel>
                    <Select value={entityType} onValueChange={setEntityType}>
                        <SelectTrigger className="h-12 rounded-xl border-primary bg-primary/5 shadow-sm font-bold text-left"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="NGO">Sivil Toplum Kuruluşu (STK)</SelectItem>
                            <SelectItem value="BRAND">Marka / Sosyal İşletme</SelectItem>
                            <SelectItem value="CLUB">Öğrenci Kulübü</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <Separator className="border-dashed" />

            {entityType && (
                <div className="space-y-12 animate-in slide-in-from-top-4 duration-500">
                    
                    {/* Kuruluş Bilgileri */}
                    <div className="space-y-6">
                        <SectionTitle>{entityType === 'BRAND' ? 'MARKA KİMLİĞİ' : entityType === 'CLUB' ? 'KULÜP BİLGİLERİ' : 'KURULUŞ BİLGİLERİ'}</SectionTitle>
                        {entityType === 'CLUB' && (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <FormLabel>Kulüp Türü</FormLabel>
                                    <Select value={formData.clubType} onValueChange={(val) => setFormData({...formData, clubType: val, universityName: '', cityMEB: ''})}>
                                        <SelectTrigger className="h-12 rounded-xl bg-primary/5 border-primary shadow-sm font-bold text-left"><SelectValue placeholder="Seçiniz..." /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="university">Üniversite</SelectItem>
                                            <SelectItem value="highschool">Lise</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                {formData.clubType === 'university' && (
                                    <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                                        <FormLabel>Üniversite</FormLabel>
                                        <FilteredSelect
                                            value={formData.universityName}
                                            onChange={(val) => setFormData({...formData, universityName: val})}
                                            options={universities}
                                            placeholder="Üniversite seçin..."
                                        />
                                    </div>
                                )}
                                {formData.clubType === 'highschool' && (
                                    <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                                        <FormLabel>Bağlı Olduğu İl Milli Eğitim Müdürlüğü</FormLabel>
                                        <FilteredSelect
                                            value={formData.cityMEB}
                                            onChange={(val) => setFormData({...formData, cityMEB: val})}
                                            options={allProvinces}
                                            placeholder="İl seçin..."
                                        />
                                    </div>
                                )}
                            </div>
                        )}
                        {entityType === 'BRAND' && (
                            <div className="space-y-2">
                                <FormLabel>İşletme Statüsü</FormLabel>
                                <Select value={formData.brandStatus} onValueChange={(val) => setFormData({...formData, brandStatus: val})}>
                                    <SelectTrigger className="h-12 rounded-xl bg-primary/5 border-primary shadow-sm font-bold text-left"><SelectValue placeholder="Seçiniz..." /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="brand">Ticari Marka</SelectItem>
                                        <SelectItem value="cooperative">Kooperatif</SelectItem>
                                        <SelectItem value="social-enterprise">Sosyal İşletme</SelectItem>
                                        <SelectItem value="economic-enterprise">İktisadi İşletme</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        {entityType === 'NGO' && (
                            <>
                                <div className="space-y-2">
                                    <FormLabel>Kuruluş Alt Türü</FormLabel>
                                    <Select value={formData.orgSubType} onValueChange={(val) => setFormData({...formData, orgSubType: val})}>
                                        <SelectTrigger className="h-12 rounded-xl bg-card border-none shadow-sm font-bold text-left"><SelectValue placeholder="Seçiniz..." /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Dernek">Dernek</SelectItem>
                                            <SelectItem value="Vakıf">Vakıf</SelectItem>
                                            <SelectItem value="Spor Kulübü">Spor Kulübü</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <FormLabel>Kütük Numarası</FormLabel>
                                    <div className="relative">
                                        <FormInput
                                            placeholder="Dernek/vakıf kütük numaranızı girin"
                                            value={formData.registryNo}
                                            onChange={(e) => handleRegistryNoCheck(e.target.value)}
                                        />
                                        {isCheckingRegistry && (
                                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                            </div>
                                        )}
                                    </div>
                                    {registryNgoFound && (
                                        <p className="text-xs text-green-600 font-semibold flex items-center gap-1">
                                            ✓ Kayıtlı kuruluş bulundu: <span className="font-bold">{registryNgoFound.name}</span>. Bilgiler otomatik dolduruldu.
                                        </p>
                                    )}
                                    <p className="text-xs text-muted-foreground">Mevcut bir dernek/vakfı sisteme bağlamak için kütük numarasını girin.</p>
                                </div>
                            </>
                        )}
                        <div className="space-y-2">
                            <FormLabel>{entityType === 'BRAND' ? 'Marka Adı' : entityType === 'CLUB' ? 'Kulüp Adı' : 'Kuruluş Adı'} *</FormLabel>
                            <FormInput placeholder={entityType === 'BRAND' ? 'Markanın adı' : entityType === 'CLUB' ? 'Kulübün tam adı' : 'Kuruluşun tam resmi adı'} value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
                        </div>
                        {entityType === 'NGO' && (
                            <>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <FormLabel>Kuruluş Kısa Adı</FormLabel>
                                        <FormInput placeholder="hangel Dernek" value={formData.shortName} onChange={(e) => setFormData({...formData, shortName: e.target.value})} />
                                    </div>
                                    <div className="space-y-2">
                                        <FormLabel>Kuruluş Yılı</FormLabel>
                                        <YearSelect value={formData.orgTag} onChange={(val) => setFormData({...formData, orgTag: val})} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <FormLabel>Hakkinizda</FormLabel>
                                    <div className="relative">
                                        <Textarea
                                            className="min-h-[80px] rounded-xl bg-card border-none shadow-sm resize-none pr-16 text-sm"
                                            placeholder="Kuruluşunuzu anlatan kısa bir metin"
                                            maxLength={500}
                                            value={formData.slogan}
                                            onChange={(e) => setFormData({...formData, slogan: e.target.value})}
                                        />
                                        <span className="absolute bottom-3 right-3 text-[10px] text-muted-foreground font-bold">{formData.slogan.length}/500</span>
                                    </div>
                                </div>
                            </>
                        )}
                        {entityType === 'CLUB' && (
                            <div className="space-y-2">
                                <FormLabel>Kulüp Kategorisi</FormLabel>
                                <FilteredSelect
                                    value={formData.clubCategory}
                                    onChange={(val) => setFormData({...formData, clubCategory: val})}
                                    options={clubCategories}
                                    placeholder="Kategori seçin..."
                                />
                            </div>
                        )}
                        {entityType === 'BRAND' && (
                            <div className="space-y-2">
                                <FormLabel>Sektör</FormLabel>
                                <Select value={formData.sector} onValueChange={(val) => setFormData({...formData, sector: val})}>
                                    <SelectTrigger className="h-12 rounded-xl bg-primary/5 border-primary shadow-sm font-bold text-left"><SelectValue placeholder="Seçiniz..." /></SelectTrigger>
                                    <SelectContent className="max-h-60">
                                        <SelectItem value="Teknoloji & Yazılım">Teknoloji & Yazılım</SelectItem>
                                        <SelectItem value="Finans & Bankacılık">Finans & Bankacılık</SelectItem>
                                        <SelectItem value="Eğitim">Eğitim</SelectItem>
                                        <SelectItem value="Sağlık">Sağlık</SelectItem>
                                        <SelectItem value="Hukuk">Hukuk</SelectItem>
                                        <SelectItem value="Pazarlama & Reklam">Pazarlama & Reklam</SelectItem>
                                        <SelectItem value="Medya & İletişim">Medya & İletişim</SelectItem>
                                        <SelectItem value="E-Ticaret">E-Ticaret</SelectItem>
                                        <SelectItem value="Perakende">Perakende</SelectItem>
                                        <SelectItem value="Lojistik & Tedarik Zinciri">Lojistik & Tedarik Zinciri</SelectItem>
                                        <SelectItem value="Üretim & Sanayi">Üretim & Sanayi</SelectItem>
                                        <SelectItem value="Enerji">Enerji</SelectItem>
                                        <SelectItem value="İnşaat & Gayrimenkul">İnşaat & Gayrimenkul</SelectItem>
                                        <SelectItem value="Turizm & Otelcilik">Turizm & Otelcilik</SelectItem>
                                        <SelectItem value="Tarım & Gıda">Tarım & Gıda</SelectItem>
                                        <SelectItem value="Kamu & Devlet">Kamu & Devlet</SelectItem>
                                        <SelectItem value="Sivil Toplum (STK)">Sivil Toplum (STK)</SelectItem>
                                        <SelectItem value="Uluslararası Kuruluşlar">Uluslararası Kuruluşlar</SelectItem>
                                        <SelectItem value="Danışmanlık">Danışmanlık</SelectItem>
                                        <SelectItem value="İnsan Kaynakları">İnsan Kaynakları</SelectItem>
                                        <SelectItem value="Araştırma & Akademi">Araştırma & Akademi</SelectItem>
                                        <SelectItem value="Spor">Spor</SelectItem>
                                        <SelectItem value="Sanat & Kültür">Sanat & Kültür</SelectItem>
                                        <SelectItem value="Sosyal Girişimcilik">Sosyal Girişimcilik</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>

                    {entityType === 'NGO' && (
                        <>
                            {/* Hedef Kitleler */}
                            <div className="space-y-4">
                                <SectionTitle icon={Users}>Faydalanıcılarınız</SectionTitle>
                                <div className="grid grid-cols-2 gap-2">
                                    {allBeneficiaries.map(item => (
                                        <label key={item} className="flex items-center gap-2 cursor-pointer group">
                                            <Checkbox
                                                checked={selectedBeneficiaries.includes(item)}
                                                onCheckedChange={() => toggleItem(selectedBeneficiaries, setSelectedBeneficiaries, item)}
                                                className="rounded-md"
                                            />
                                            <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">{item}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Hizmet Alanları (SDGs) */}
                            <div className="space-y-4">
                                <SectionTitle icon={Target}>Sürdürülebilir Kalkınma Amaçlarını kapsamaktadır? (Birden fazla seçebilirsiniz)</SectionTitle>
                                <div className="grid grid-cols-1 gap-2">
                                    {allSdgs.map(item => (
                                        <label key={item} className="flex items-center gap-2 cursor-pointer group">
                                            <Checkbox
                                                checked={selectedServiceAreas.includes(item)}
                                                onCheckedChange={() => toggleItem(selectedServiceAreas, setSelectedServiceAreas, item)}
                                                className="rounded-md"
                                            />
                                            <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">{item}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Platform Üyelikleri */}
                            <div className="space-y-4">
                                <SectionTitle icon={Activity}>Aşağıdaki platform, ağ ve oluşumlardan hangilerinde aktif olarak yer alıyorsunuz? (Birden fazla seçebilirsiniz)</SectionTitle>
                                <div className="grid grid-cols-2 gap-2">
                                    {allMemberships.map(item => (
                                        <label key={item} className="flex items-center gap-2 cursor-pointer group">
                                            <Checkbox
                                                checked={selectedPlatforms.includes(item)}
                                                onCheckedChange={() => toggleItem(selectedPlatforms, setSelectedPlatforms, item)}
                                                className="rounded-md"
                                            />
                                            <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">{item}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    {entityType === 'BRAND' && (
                        <>
                            {/* Kategori Bazlı Bağış Oranları */}
                            <div className="space-y-6">
                                <SectionTitle>KATEGORİ BAZLI BAĞIŞ ORANLARI</SectionTitle>
                                <p className="text-[10px] text-muted-foreground leading-tight ml-1 -mt-2">Satışlardan bağışlanacak oranları kategorilere göre belirleyebilirsiniz.</p>
                                <div className="space-y-3">
                                    <div className="grid grid-cols-12 gap-2 mb-1 px-1">
                                        <div className="col-span-7"><Label className="text-[9px] font-black uppercase text-muted-foreground">Kategori</Label></div>
                                        <div className="col-span-4"><Label className="text-[9px] font-black uppercase text-muted-foreground">Oran (%)</Label></div>
                                    </div>
                                    {donationCategories.map((cat, idx) => (
                                        <div key={cat.id} className="space-y-2 animate-in fade-in-0 duration-300">
                                            <div className="grid grid-cols-12 gap-2">
                                                <div className="col-span-7">
                                                    <Select value={cat.category} onValueChange={(val) => {
                                                        const newCats = [...donationCategories];
                                                        newCats[idx].category = val;
                                                        newCats[idx].customCategory = val === 'Diğer' ? newCats[idx].customCategory : '';
                                                        setDonationCategories(newCats);
                                                    }}>
                                                        <SelectTrigger className="h-12 rounded-xl bg-card border-none shadow-sm"><SelectValue placeholder="Kategori seçin" /></SelectTrigger>
                                                        <SelectContent className="max-h-60">
                                                            {brandCategoryOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="col-span-4 relative">
                                                    <FormInput type="number" value={cat.rate} onChange={(e) => {
                                                        const newCats = [...donationCategories];
                                                        newCats[idx].rate = e.target.value;
                                                        setDonationCategories(newCats);
                                                    }} />
                                                </div>
                                                <div className="col-span-1 flex items-center justify-center">
                                                    {donationCategories.length > 1 && (
                                                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeCategory(cat.id)}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                            {cat.category === 'Diğer' && (
                                                <FormInput
                                                    placeholder="Kategori adını yazınız"
                                                    value={cat.customCategory}
                                                    onChange={(e) => {
                                                        const newCats = [...donationCategories];
                                                        newCats[idx].customCategory = e.target.value;
                                                        setDonationCategories(newCats);
                                                    }}
                                                />
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <Button type="button" variant="outline" className="w-full h-12 border-dashed border-primary/30 rounded-xl text-primary font-bold hover:bg-primary/5" onClick={addCategory}>
                                    + YENİ KATEGORİ EKLE
                                </Button>
                                <div className="space-y-3 pt-2">
                                    <p className="text-[11px] font-black uppercase text-muted-foreground ml-1">Fiziksel Alışverişlerde de Bağışlar Geçerli Olsun</p>
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <Checkbox
                                            checked={formData.posDevice}
                                            onCheckedChange={(checked) => setFormData({...formData, posDevice: !!checked})}
                                            className="rounded-md"
                                        />
                                        <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">Pos Cihazı Talep Ediyorum</span>
                                    </label>
                                </div>
                            </div>

                            {/* Affiliate Marketing & Teknik Takip */}
                            <div className="space-y-6">
                                <SectionTitle>AFFILIATE MARKETING & TEKNİK TAKİP</SectionTitle>
                                <p className="text-[10px] text-muted-foreground leading-tight ml-1 -mt-2">Satışların hangel platformu üzerinden takip edilmesi için teknik verilerin doğru girilmesi zorunludur.</p>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <FormLabel>AFFILIATE ID VEYA REFERRAL ID</FormLabel>
                                        <FormInput placeholder="Örnek: HAN_2024_PRO_001" value={formData.affiliateId} onChange={(e) => setFormData({...formData, affiliateId: e.target.value})} />
                                    </div>
                                    <div className="space-y-2">
                                        <FormLabel>AFFILIATE / TRACKING LINK (DEEP LINK)</FormLabel>
                                        <FormInput placeholder="Örnek: https://marka.com/product?ref=hangel" value={formData.trackingLink} onChange={(e) => setFormData({...formData, trackingLink: e.target.value})} />
                                    </div>
                                    <div className="space-y-2">
                                        <FormLabel>CONVERSION PIXEL / EVENT SCRIPTS (JS/HTML)</FormLabel>
                                        <Textarea className="min-h-[100px] rounded-xl bg-muted/20 border-none font-mono text-[10px]" placeholder="<script> window.hangelConversion = { amount: '120.00', currency: 'TRY', ... } </script>" value={formData.pixelScript} onChange={(e) => setFormData({...formData, pixelScript: e.target.value})} />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <FormLabel>COOKIE SÜRESİ</FormLabel>
                                            <FormInput placeholder="Örn: 30 Gün" value={formData.cookieDuration} onChange={(e) => setFormData({...formData, cookieDuration: e.target.value})} />
                                        </div>
                                        <div className="space-y-2">
                                            <FormLabel>KATEGORİ / MARKA İSTİSNASI</FormLabel>
                                            <FormInput placeholder="Örn: Tüm Ürünler" value={formData.exceptions} onChange={(e) => setFormData({...formData, exceptions: e.target.value})} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Adres Bilgileri */}
                    <div className="space-y-6">
                        <SectionTitle>ADRES BİLGİLERİ</SectionTitle>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <FormLabel>İL / EYALET</FormLabel>
                                <Select value={formData.city} onValueChange={(val) => setFormData({...formData, city: val, district: ''})}>
                                    <SelectTrigger className="h-12 rounded-xl bg-muted/20 border-none"><SelectValue placeholder="Şehir / Eyalet girin" /></SelectTrigger>
                                    <SelectContent className="max-h-60">{(allProvinces || []).map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <FormLabel>İLÇE / BÖLGE</FormLabel>
                                <Select value={formData.district} onValueChange={(val) => setFormData({...formData, district: val, neighborhood: ''})} disabled={!formData.city}>
                                    <SelectTrigger className="h-12 rounded-xl bg-card border-none shadow-sm"><SelectValue placeholder="İlçe / Bölge girin" /></SelectTrigger>
                                    <SelectContent className="max-h-60">{formData.city && (districtsData[formData.city] || []).map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <FormLabel>MAHALLE</FormLabel>
                            <Select value={formData.neighborhood} onValueChange={(val) => setFormData({...formData, neighborhood: val})} disabled={!formData.district}>
                                <SelectTrigger className="h-12 rounded-xl bg-card border-none shadow-sm"><SelectValue placeholder="Mahalle seçin" /></SelectTrigger>
                                <SelectContent className="max-h-60">
                                    {formData.city && formData.district && (neighborhoodsData[formData.city]?.[formData.district] || []).length > 0
                                        ? (neighborhoodsData[formData.city]?.[formData.district] || []).map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)
                                        : <SelectItem value="_none" disabled>Bu ilçe için mahalle verisi henüz eklenmedi</SelectItem>
                                    }
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <FormLabel>AÇIK ADRES</FormLabel>
                            <FormInput placeholder="Sokak, kapı no..." value={formData.addressLine} onChange={(e) => setFormData({...formData, addressLine: e.target.value})} />
                        </div>
                    </div>

                    {/* İletişim ve Sosyal Medya */}
                    <div className="space-y-6">
                        <SectionTitle>İLETİŞİM VE SOSYAL MEDYA</SectionTitle>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <FormLabel>KURUMSAL E-POSTA</FormLabel>
                                <IconInput icon={Mail} placeholder="brand@marka.com" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required />
                            </div>
                            <div className="space-y-2">
                                <FormLabel>KURUMSAL TELEFON</FormLabel>
                                <div className="flex gap-2">
                                    <div className="w-[100px] shrink-0">
                                        <Select value={formData.phoneCode} onValueChange={(val) => setFormData({...formData, phoneCode: val})}>
                                            <SelectTrigger className="h-12 rounded-xl bg-card border-none shadow-sm"><SelectValue /></SelectTrigger>
                                            <SelectContent className="max-h-60">{uniquePhoneCodes.map((c, i) => <SelectItem key={`${c}-${i}`} value={c}>+{c}</SelectItem>)}</SelectContent>
                                        </Select>
                                    </div>
                                    <FormInput placeholder="5XXXXXXXXX" className="flex-1" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} required />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <FormLabel>WEB SİTESİ</FormLabel>
                                <IconInput icon={Globe} placeholder="https://www.marka.com" value={formData.website} onChange={(e) => setFormData({...formData, website: e.target.value})} />
                            </div>
                            
                            <div className="pt-4 space-y-4">
                                <Label className="text-[9px] font-black uppercase text-muted-foreground ml-1">SOSYAL MEDYA HESAPLARI</Label>
                                <div className="space-y-3">
                                    <IconInput icon={Instagram} placeholder="instagram.com/kurumadi" value={formData.social.instagram} onChange={(e) => setFormData({...formData, social: {...formData.social, instagram: e.target.value}})} />
                                    <IconInput icon={XIcon} placeholder="x.com/kullaniciadi" value={formData.social.twitter} onChange={(e) => setFormData({...formData, social: {...formData.social, twitter: e.target.value}})} />
                                    <IconInput icon={Linkedin} placeholder="linkedin.com/company/kurumadi" value={formData.social.linkedin} onChange={(e) => setFormData({...formData, social: {...formData.social, linkedin: e.target.value}})} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Yasal & Finansal - sadece NGO için */}
                    {entityType === 'NGO' && (
                    <div className="space-y-6">
                        <SectionTitle>YASAL & FİNANSAL</SectionTitle>
                        <div className="space-y-2">
                            <FormLabel>YASAL UNVAN</FormLabel>
                            <FormInput placeholder="Hesap Adı" value={formData.legalTitle} onChange={(e) => setFormData({...formData, legalTitle: e.target.value})} required />
                        </div>
                        <div className="space-y-2">
                            <FormLabel>IBAN NUMARASI</FormLabel>
                            <FormInput placeholder="TR..." value={formData.iban} onChange={(e) => setFormData({...formData, iban: e.target.value})} required />
                        </div>
                    </div>
                    )}

                    {/* Yasal Belgeler & Logolar */}
                    <div className="space-y-6">
                        <SectionTitle>YASAL BELGELER & LOGOLAR</SectionTitle>
                        {entityType === 'NGO' && (
                            <>
                                <FileUpload label="KURULUŞ SENEDİ / TÜZÜK" accept=".pdf" hint="Dernek tüzüğü veya vakıf senedini yükleyin." />
                                <FileUpload label="FAALİYET BELGESİ" accept=".pdf,.png,.jpg" hint="Kuruluşun faaliyet durumunu gösteren resmi belge." />
                            </>
                        )}
                        {entityType === 'BRAND' && (
                            <FileUpload label="MARKA LOGOSU *" accept=".png,.jpg" hint="Arkaplansız (transparan) .png ve en az 512x512px olmalıdır." required />
                        )}
                        {entityType === 'CLUB' && (
                            <>
                                <FileUpload label="KULÜP LOGOSU *" accept=".png,.jpg" hint="Arkaplansız (transparan) .png ve en az 512x512px olmalıdır." required />
                                <FileUpload label="FAALİYET BELGESİ" accept=".pdf,.png,.jpg" hint="Kulübün üniversite / okul tarafından onaylı faaliyet belgesi." />
                            </>
                        )}
                    </div>

                    {/* Yetkili Kişi Bilgileri */}
                    <div className="space-y-6">
                        <SectionTitle>YETKİLİ KİŞİ BİLGİLERİ</SectionTitle>
                        <div className="space-y-2">
                            <FormLabel>AD SOYAD</FormLabel>
                            <FormInput placeholder="Ör.: İsmail Hilmi ADIGÜZEL" value={formData.authorized.name} onChange={(e) => setFormData({...formData, authorized: {...formData.authorized, name: e.target.value}})} required />
                        </div>
                        <div className="space-y-2">
                            <FormLabel>GÖREVİ</FormLabel>
                            <FormInput placeholder="Örn: Genel Sekreter, Pazarlama Md. vb." value={formData.authorized.role} onChange={(e) => setFormData({...formData, authorized: {...formData.authorized, role: e.target.value}})} required />
                        </div>
                        <div className="space-y-2">
                            <FormLabel>{entityType === 'NGO' ? 'BİREYSEL E-POSTA' : 'BİREYSEL E-POSTA'}</FormLabel>
                            <FormInput type="email" placeholder={entityType === 'NGO' ? 'ornek@example.com' : 'ornek@marka.com'} value={formData.authorized.email} onChange={(e) => setFormData({...formData, authorized: {...formData.authorized, email: e.target.value}})} required />
                        </div>
                        <div className="space-y-2">
                            <FormLabel>{entityType === 'NGO' ? 'BİREYSEL TELEFON' : 'BİREYSEL TELEFON'}</FormLabel>
                            <div className="flex gap-2">
                                <div className="w-[100px] shrink-0">
                                    <Select value={formData.authorized.phoneCode} onValueChange={(val) => setFormData({...formData, authorized: {...formData.authorized, phoneCode: val}})}>
                                        <SelectTrigger className="h-12 rounded-xl bg-card border-none shadow-sm"><SelectValue /></SelectTrigger>
                                        <SelectContent className="max-h-60">{uniquePhoneCodes.map((c, i) => <SelectItem key={`${c}-${i}`} value={c}>+{c}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                <FormInput placeholder="5XXXXXXXXX" className="flex-1" value={formData.authorized.phone} onChange={(e) => setFormData({...formData, authorized: {...formData.authorized, phone: e.target.value}})} required />
                            </div>
                        </div>
                    </div>

                    {/* Zorunlu Onaylar */}
                    <div className="space-y-4 pt-6">
                        <div className="flex items-start space-x-3 text-left">
                            <Checkbox id="terms-brand" required />
                            <Label htmlFor="terms-brand" className="text-[10px] font-medium leading-relaxed text-muted-foreground cursor-pointer">
                                <span className="text-primary font-bold">{entityType === 'NGO' ? 'STK Katılım Sözleşmesi' : entityType === 'CLUB' ? 'Öğrenci Kulüp Sözleşmesi' : 'Marka Katılım Sözleşmesi'}</span>'ni ve <span className="text-primary font-bold">Etik İlkeleri</span> okudum, kabul ediyorum.
                            </Label>
                        </div>
                        <div className="flex items-start space-x-3 text-left">
                            <Checkbox id="privacy-brand" required />
                            <Label htmlFor="privacy-brand" className="text-[10px] font-medium leading-relaxed text-muted-foreground cursor-pointer">
                                <span className="text-primary font-bold">Gizlilik Politikası</span> kapsamında verilerimin işlenmesine onay veriyorum.
                            </Label>
                        </div>
                        <div className="flex items-start space-x-3 text-left">
                            <Checkbox id="marketing-brand" />
                            <Label htmlFor="marketing-brand" className="text-[10px] font-medium leading-relaxed text-muted-foreground cursor-pointer">
                                hangel ve ortaklarından kurumsal duyuru ve ticari ileti almayı kabul ediyorum.
                            </Label>
                        </div>
                    </div>

                    <Button type="submit" className="w-full h-16 rounded-2xl text-lg font-black shadow-2xl bg-primary hover:bg-primary/90" disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="animate-spin h-6 w-6" /> : "BAŞVURUYU GÖNDER"}
                    </Button>
                </div>
            )}

        </form>
    );
};

const FormRenderer = () => {
    const searchParams = useSearchParams();
    const router = useRouter();
    // "tab" is canonical; "type" is an alias kept for older links
    // (e.g. /login/selection?action=register&type=corporate&entity=BRAND)
    const rawTab = searchParams.get('tab') || searchParams.get('type');
    const hasEntity = !!searchParams.get('entity');
    const activeTab = rawTab === 'corporate' || (hasEntity && rawTab !== 'individual')
      ? 'corporate'
      : (rawTab || 'individual');
    const initialEntity = searchParams.get('entity') || 'NGO';

    return (
        <div className="min-h-screen bg-secondary flex items-start justify-center p-4 pt-8">
            <div className="w-full max-w-sm">
                <Card className="rounded-[2.5rem] shadow-2xl border-none overflow-hidden bg-background">
                    <CardHeader className="text-center pt-10 pb-6">
                        <HangelLogo className="text-3xl mx-auto mb-2" />
                        <CardTitle className="text-3xl font-black tracking-tighter">Hoş Geldiniz</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6 px-8 pb-10">
                        <Tabs value={activeTab} onValueChange={(val) => router.push(`/login/selection?tab=${val}&entity=${initialEntity}`)}>
                            <TabsList className="grid w-full grid-cols-2 h-12 rounded-xl bg-muted/50 p-1">
                                <TabsTrigger value="individual" className="rounded-lg font-bold">Bireysel</TabsTrigger>
                                <TabsTrigger value="corporate" className="rounded-lg font-bold">Kurumsal</TabsTrigger>
                            </TabsList>
                            <TabsContent value="individual" className="pt-4">
                                <IndividualForm onComplete={(isNewUser) => {
                                    if (isNewUser) {
                                        localStorage.setItem('onboardingStep', 'profile');
                                        router.push('/settings/profile');
                                    } else {
                                        router.push('/market');
                                    }
                                }} />
                            </TabsContent>
                            <TabsContent value="corporate" className="pt-4">
                                <CorporateForm initialEntity={initialEntity} />
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
                <p className="text-[10px] leading-relaxed text-muted-foreground text-center px-4 mt-4 max-w-md mx-auto">
                    Devam ederek <span className="underline">Aydınlatma Metni</span>'ni, <span className="underline">Açık Rıza Metni</span>'ni ve <span className="underline">Kullanıcı Sözleşmesi</span>'ni okuduğunu ve anladığını kabul etmiş olursun. <span className="underline">Ticari Elektronik İleti Aydınlatma Metni</span> kapsamında SMS, e-posta ve arama almaya rıza göstermiş olursun.
                </p>
            </div>
        </div>
    );
};

export default function LoginSelectionPage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>}>
      <FormRenderer />
    </Suspense>
  );
}