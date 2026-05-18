'use client';

import React, { useState, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { useRouter, useSearchParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Mail,
    Activity,
    Target,
    X,
    Upload,
    Loader2,
    Building2,
    CheckCircle,
    FileText,
    Store,
    UserCircle,
    MapPin,
    School
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import {
    allCountries, allSdgs,
} from '@/lib/data';
import { COUNTRY_PHONE_CODES } from '@/lib/phone-codes';
import { useToast } from '@/hooks/use-toast';
import { useAuth, useFirestore, useUser, setDocumentNonBlocking } from '@/firebase';
import { updateProfile, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { initiateEmailVerification } from '@/firebase/non-blocking-login';
import { doc, collection, addDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { HangelLogo } from '@/components/icons';

// --- Shared UI Components ---

const _XIcon = (props: React.ComponentProps<'svg'>) => (
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

const SectionTitle = ({ children, icon: Icon }: { children: React.ReactNode, icon?: React.ComponentType<{ className?: string }> }) => (
    <div className="flex items-start gap-2 mb-4 pt-4 first:pt-0 border-t border-dashed first:border-t-0">
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

const IconInput = ({ icon: Icon, ...props }: React.ComponentProps<typeof Input> & { icon: React.ComponentType<{ className?: string }> }) => (
    <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input {...props} className={cn("h-12 rounded-xl bg-card border-none shadow-sm focus-visible:ring-1 focus-visible:ring-primary/30 pl-10", props.className)} />
    </div>
);

const _brandCategoryOptions = [
    "Giyim & Aksesuar", "Elektronik", "Kozmetik & Kişisel Bakım",
    "Ev & Yaşam", "Gıda & İçecek", "Spor & Outdoor",
    "Kitap & Kırtasiye", "Oyuncak & Hobi", "Sağlık & Medikal",
    "Otomotiv", "Mücevher & Saat", "Diğer"
];

const _isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

// TODO: Full Turkish address dataset (İl/İlçe/Mahalle) will be loaded from /lib/data.ts later.
// For now, a minimal placeholder list lives inline for the registration forms.
const placeholderCities = [
    "İstanbul", "Ankara", "İzmir", "Bursa", "Antalya",
    "Adana", "Konya", "Gaziantep", "Mersin", "Diyarbakır", "Diğer",
];

// Hardcoded university list, mirrored from /settings/volunteer flow.
const clubUniversityOptions = [
    "Boğaziçi Üniversitesi", "İstanbul Teknik Üniversitesi", "Orta Doğu Teknik Üniversitesi",
    "Bilkent Üniversitesi", "Koç Üniversitesi", "Sabancı Üniversitesi",
    "Hacettepe Üniversitesi", "Ankara Üniversitesi", "İstanbul Üniversitesi",
    "Marmara Üniversitesi", "Ege Üniversitesi", "Dokuz Eylül Üniversitesi",
    "Yıldız Teknik Üniversitesi", "Gazi Üniversitesi", "Anadolu Üniversitesi", "Diğer",
];

const brandSectorOptions = [
    "Gıda", "Tekstil", "Teknoloji", "Sağlık", "Eğitim", "Finans", "Lojistik",
    "Turizm", "İnşaat", "Otomotiv", "Enerji", "Tarım", "Hizmet", "Perakende",
    "Üretim", "Medya", "Kozmetik", "Mobilya", "Diğer",
];

const ngoPlatformOptions = [
    "Afet Platformu", "Açık Açık", "Tüsev", "Adım Adım", "Ability Pool",
    "HelpSteps", "Candid", "Global Compact",
    "Idealist", "gonulluyuzbiz.gov.tr", "TGSP", "Diğer",
];

const ngoBeneficiaryOptions = [
    "Çocuklar", "Hak mücadelesi verenler", "Afetzedeler", "Hayvanlar", "Yaşlılar",
    "Engelliler", "Öğrenciler", "Mülteciler", "Gençler", "Çevre", "Kadınlar",
    "Yoksullar", "Bölgesel", "Diğer",
];

const clubCategoryGroups: { group: string; items: string[] }[] = [
    { group: "Teknoloji & Bilim", items: ["Yapay Zeka", "Siber Güvenlik", "Veri Bilimi", "Yazılım Geliştirme", "Oyun Geliştirme", "Donanım/Robotik", "Bilim ve Araştırma"] },
    { group: "Sanat & Kültür", items: ["Müzik", "Tiyatro", "Sinema", "Fotoğrafçılık", "Resim ve Görsel Sanatlar", "Edebiyat", "Dans"] },
    { group: "Sosyal Etki & Toplum", items: ["Gönüllülük", "Sosyal Sorumluluk", "Sosyal Girişimcilik", "Hak Temelli Çalışmalar", "İnsan Hakları", "Mülteci ve Uyum", "Hayvan Hakları", "Sürdürülebilirlik", "Afet ve Arama Kurtarma"] },
    { group: "Kariyer & Gelişim", items: ["Girişimcilik", "Kariyer ve Gelişim", "İnovasyon", "Mesleki Gelişim", "Kişisel Gelişim"] },
    { group: "Akademik & Düşünsel", items: ["Felsefe", "Ekonomi", "Hukuk", "Politika ve Kamu Yönetimi", "Münazara", "Fikir ve Tartışma", "Erasmus/Uluslararası Programlar", "Yabancı Dil"] },
    { group: "Spor & Outdoor", items: ["Futbol", "Basketbol", "Satranç", "Voleybol", "Dağcılık & Trekking", "Su Sporları", "Kampçılık", "Diğer Sporlar"] },
];

const currentYear = new Date().getFullYear();
const yearOptions = Array.from({ length: currentYear - 1900 + 1 }, (_, i) => String(currentYear - i));

const IndividualForm = ({ onComplete }: { onComplete: (isNewUser: boolean) => void }) => {
    const auth = useAuth();
    const db = useFirestore();
    const { toast } = useToast();
    const searchParams = useSearchParams();

    type IndividualStep = 'email' | 'login' | 'register' | 'verify-sent' | 'forgot' | 'forgot-sent';
    const [step, setStep] = useState<IndividualStep>('email');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [phoneCountryCode, setPhoneCountryCode] = useState('+90');
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleCheckEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const res = await fetch('/api/auth/check-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.trim().toLowerCase() }),
            });
            const data = await res.json();
            if (data.exists) setStep('login');
            else setStep('register');
        } catch {
            setStep('register');
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
            onComplete(false);
        } catch {
            toast({ variant: 'destructive', title: 'Giriş Başarısız', description: 'E-posta veya şifre hatalı.' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== passwordConfirm) {
            toast({ variant: 'destructive', title: 'Hata', description: 'Şifreler uyuşmuyor.' });
            return;
        }
        setIsLoading(true);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
            const userId = userCredential.user.uid;
            if (name) {
                try { await updateProfile(userCredential.user, { displayName: name }); } catch {}
            }
            const referrerId = searchParams.get('ref') || null;

            // QR/davet linki ile gelen otomatik aksiyon: ref=<kind>:<id> formatı
            // - ngo:X  → supportedNgos + volunteerNgos (STK destekçisi + gönüllüsü)
            // - club:X → joinedClubs (kulübe katılmış)
            // - brand:X → followedBrands (marka takip)
            let autoActionFields: Record<string, unknown> = {};
            let autoActionKind: 'ngo' | 'club' | 'brand' | null = null;
            let autoActionEntityId = '';
            if (referrerId && referrerId.includes(':')) {
                const [kind, entityId] = referrerId.split(':');
                if (entityId) {
                    if (kind === 'ngo') {
                        autoActionKind = 'ngo';
                        autoActionEntityId = entityId;
                        autoActionFields = {
                            supportedNgos: [entityId],
                            volunteerNgos: [entityId],
                        };
                    } else if (kind === 'club') {
                        autoActionKind = 'club';
                        autoActionEntityId = entityId;
                        autoActionFields = { joinedClubs: [entityId] };
                    } else if (kind === 'brand') {
                        autoActionKind = 'brand';
                        autoActionEntityId = entityId;
                        autoActionFields = { followedBrands: [entityId] };
                    }
                }
            }

            setDocumentNonBlocking(doc(db, 'users', userId), {
                id: userId,
                name: name,
                // Yeni kullanıcılarda demo profil fotoğrafı olmasın; boş bırakıldığında
                // arayüzde AvatarFallback (baş harfler) gösterilir.
                avatarUrl: '',
                personalInfo: {
                    email: email.trim().toLowerCase(),
                    phone: phone.replace(/\D/g, ''),
                    phoneCountryCode,
                },
                stats: { totalDonation: 0, volunteerHours: 0, impactScore: 0 },
                ...(referrerId ? { invitedBy: referrerId } : {}),
                ...autoActionFields,
                createdAt: serverTimestamp(),
                joinDate: new Date().toISOString().split('T')[0],
            }, { merge: true });

            // Auto-action toast: davet edilen kuruluşun adını çekip kullanıcıya bilgi ver.
            if (autoActionKind && autoActionEntityId) {
                try {
                    const collectionName = autoActionKind === 'ngo' ? 'ngos' : autoActionKind === 'club' ? 'clubs' : 'brands';
                    const entitySnap = await getDoc(doc(db, collectionName, autoActionEntityId));
                    const entityName = (entitySnap.exists() && (entitySnap.data() as { name?: string }).name) || '';
                    const roleLabel =
                        autoActionKind === 'ngo' ? 'STK destekçisi ve gönüllüsü' :
                        autoActionKind === 'club' ? 'Kulüp üyesi' :
                        'Marka takipçisi';
                    toast({
                        title: 'Davet kabul edildi',
                        description: entityName
                            ? `${entityName} kuruluşundan davet aldınız ve otomatik olarak ${roleLabel} oldunuz.`
                            : `Davet aldınız ve otomatik olarak ${roleLabel} oldunuz.`,
                    });
                } catch {
                    // sessiz geç — auto-action toast opsiyonel
                }
            }

            await initiateEmailVerification(userCredential.user);
            setStep('verify-sent');
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Bir hata oluştu.';
            toast({ variant: 'destructive', title: 'Kayıt Başarısız', description: message });
        } finally {
            setIsLoading(false);
        }
    };

    const selectedIndividualPhone = COUNTRY_PHONE_CODES.find(c => c.code === phoneCountryCode) ?? COUNTRY_PHONE_CODES[0];

    if (step === 'email') {
        return (
            <form onSubmit={handleCheckEmail} className="space-y-4">
                <div className="space-y-2">
                    <FormLabel required>E-posta</FormLabel>
                    <FormInput type="email" placeholder="ornek@mail.com" required value={email} onChange={e => setEmail(e.target.value)} />
                </div>
                <Button type="submit" className="w-full h-12 rounded-xl font-bold" disabled={isLoading}>
                    {isLoading ? <Loader2 className="animate-spin" /> : "Devam Et"}
                </Button>
            </form>
        );
    }

    if (step === 'login') {
        return (
            <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                    <FormLabel required>Şifre</FormLabel>
                    <FormInput type="password" placeholder="••••••••" required value={password} onChange={e => setPassword(e.target.value)} />
                </div>
                <Button type="submit" className="w-full h-12 rounded-xl font-bold" disabled={isLoading}>Giriş Yap</Button>
                <Button type="button" variant="link" className="w-full text-xs" onClick={() => setStep('forgot')}>Şifremi Unuttum</Button>
            </form>
        );
    }

    if (step === 'register') {
        return (
            <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                    <FormLabel required>Ad Soyad</FormLabel>
                    <FormInput placeholder="İsmail Hilmi ADIGÜZEL" required value={name} onChange={e => setName(e.target.value)} />
                </div>
                <div className="space-y-2">
                    <FormLabel required>Telefon</FormLabel>
                    <div className="grid grid-cols-[140px_1fr] gap-2">
                        <Select value={phoneCountryCode} onValueChange={setPhoneCountryCode}>
                            <SelectTrigger className="h-12 rounded-xl bg-card border-none shadow-sm font-bold">
                                <SelectValue>
                                    <span className="text-base">{selectedIndividualPhone.flag}</span>
                                    <span className="ml-1">{selectedIndividualPhone.code}</span>
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent className="max-h-60">
                                {COUNTRY_PHONE_CODES.map((c) => (
                                    <SelectItem key={`${c.iso}-${c.code}`} value={c.code}>
                                        <span className="text-base mr-2">{c.flag}</span>
                                        {c.country} ({c.code})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormInput type="tel" placeholder="5XXXXXXXXX" required value={phone} onChange={e => setPhone(e.target.value)} />
                    </div>
                </div>
                <div className="space-y-2">
                    <FormLabel required>Şifre</FormLabel>
                    <FormInput type="password" placeholder="En az 6 karakter" required value={password} onChange={e => setPassword(e.target.value)} />
                </div>
                <div className="space-y-2">
                    <FormLabel required>Şifre Tekrar</FormLabel>
                    <FormInput type="password" placeholder="Şifrenizi tekrar girin" required value={passwordConfirm} onChange={e => setPasswordConfirm(e.target.value)} />
                </div>
                <div className="space-y-4 pt-4 border-t border-dashed">
                    <label className="flex items-start gap-2 cursor-pointer">
                        <Checkbox required />
                        <span className="text-[10px] text-muted-foreground leading-snug">Kullanıcı Sözleşmesini ve Gizlilik Politikasını okudum, kabul ediyorum.</span>
                    </label>
                </div>
                <Button type="submit" className="w-full h-12 rounded-xl font-bold" disabled={isLoading}>Kayıt Ol</Button>
            </form>
        );
    }

    if (step === 'verify-sent') {
        return (
            <div className="space-y-6 text-center py-4">
                <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Mail className="h-8 w-8 text-primary" />
                </div>
                <div className="space-y-2">
                    <h3 className="text-xl font-bold">E-postanızı Doğrulayın</h3>
                    <p className="text-sm text-muted-foreground">{email} adresine bir doğrulama linki gönderdik.</p>
                </div>
                <Button className="w-full h-12 rounded-xl font-bold" onClick={() => onComplete(true)}>Devam Et</Button>
            </div>
        );
    }

    return null;
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
        orgSubType: '',
        sector: '',
        email: '',
        phone: '',
        phoneCountryCode: '+90',
        website: '',
        legalTitle: '',
        iban: '',
        registryNo: '',
        country: 'Türkiye',
        city: '',
        district: '',
        neighborhood: '',
        addressLine: '',
        brandStatus: '',
        clubType: '',
        clubAffiliation: '',
        universityName: '',
        clubCategory: '',
        foundedYear: '',
        about: '',
        physicalDonationsEnabled: false,
        posRequested: false,
        authorized: { name: '', role: '', email: '', phone: '', phoneCountryCode: '+90' },
        affiliateId: '',
        trackingLink: '',
        pixelScript: '',
    });

    const [selectedBeneficiaries, setSelectedBeneficiaries] = useState<string[]>([]);
    const [selectedSdgs, setSelectedSdgs] = useState<string[]>([]);
    const [selectedNetworks, setSelectedNetworks] = useState<string[]>([]);
    const [selectedClubCategories, setSelectedClubCategories] = useState<string[]>([]);
    const [donationCategories, _setDonationCategories] = useState([{ id: '1', category: '', rate: '' }]);

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
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
                selectedSdgs,
                selectedNetworks,
                selectedClubCategories,
                categories: selectedClubCategories,
                donationCategories,
                status: 'Beklemede',
                createdAt: serverTimestamp(),
            });
            toast({ title: "Başvuru Alındı", description: "En kısa sürede sizinle iletişime geçeceğiz." });
            router.push(authUser ? '/my-applications' : '/login');
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Bir hata oluştu.';
            toast({ variant: 'destructive', title: 'Hata', description: message });
        } finally {
            setIsSubmitting(false);
        }
    };

    const selectedCorporatePhone = COUNTRY_PHONE_CODES.find(c => c.code === formData.phoneCountryCode) ?? COUNTRY_PHONE_CODES[0];

    return (
        <form onSubmit={handleFormSubmit} className="space-y-10 animate-in fade-in-0 pb-10">
            <div className="space-y-6">
                <div className="space-y-2">
                    <FormLabel>Ülke</FormLabel>
                    <Select value={formData.country} onValueChange={(val) => setFormData({...formData, country: val})}>
                        <SelectTrigger className="h-12 rounded-xl bg-card border-none shadow-sm font-bold text-left"><SelectValue /></SelectTrigger>
                        <SelectContent className="max-h-60">
                            {allCountries.map((c, i) => <SelectItem key={`${c}-${i}`} value={c}>{c}</SelectItem>)}
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

            {entityType === 'NGO' && (
                <div className="space-y-12">
                    {/* Kimlik */}
                    <div className="space-y-6">
                        <SectionTitle icon={Building2}>KURULUŞ KİMLİĞİ</SectionTitle>
                        <div className="space-y-2">
                            <FormLabel required>Kuruluş Tam Adı</FormLabel>
                            <FormInput placeholder="Dernek veya vakfın tam resmi adı" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <FormLabel>Kuruluş Alt Türü</FormLabel>
                                <Select value={formData.orgSubType} onValueChange={v => setFormData({...formData, orgSubType: v})}>
                                    <SelectTrigger className="h-12 rounded-xl bg-card border-none"><SelectValue placeholder="Seçiniz" /></SelectTrigger>
                                    <SelectContent><SelectItem value="Dernek">Dernek</SelectItem><SelectItem value="Vakıf">Vakıf</SelectItem><SelectItem value="Diğer">Diğer</SelectItem></SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <FormLabel>Kuruluş Yılı</FormLabel>
                                <Select value={formData.foundedYear} onValueChange={v => setFormData({...formData, foundedYear: v})}>
                                    <SelectTrigger className="h-12 rounded-xl bg-card border-none"><SelectValue placeholder="Yıl Seç" /></SelectTrigger>
                                    <SelectContent className="max-h-60">
                                        {yearOptions.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <FormLabel>Hakkınızda</FormLabel>
                            <Textarea
                                className="rounded-2xl bg-card border-none shadow-sm focus-visible:ring-1 focus-visible:ring-primary/30 min-h-[96px]"
                                placeholder="Kuruluşunuzu kısaca tanıtın"
                                value={formData.about}
                                onChange={e => setFormData({...formData, about: e.target.value})}
                            />
                        </div>
                    </div>

                    {/* Faydalanıcılar */}
                    <div className="space-y-6">
                        <SectionTitle icon={Target}>FAYDALANICILARINIZ</SectionTitle>
                        <div className="space-y-3">
                            <FormLabel>Faydalanıcı Gruplar (Birden fazla seçebilirsiniz)</FormLabel>
                            <div className="grid grid-cols-2 gap-2 p-4 border rounded-2xl bg-card">
                                {ngoBeneficiaryOptions.map(item => (
                                    <label key={item} className="flex items-center gap-2 cursor-pointer group">
                                        <Checkbox checked={selectedBeneficiaries.includes(item)} onCheckedChange={checked => setSelectedBeneficiaries(prev => checked ? [...prev, item] : prev.filter(i => i !== item))} />
                                        <span className="text-[11px] font-medium text-muted-foreground group-hover:text-foreground">{item}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* SKA */}
                    <div className="space-y-6">
                        <SectionTitle icon={Target}>Sürdürülebilir Kalkınma Amaçlarını kapsamaktadır? (Birden fazla seçebilirsiniz)</SectionTitle>
                        <div className="grid grid-cols-1 gap-2 p-4 border rounded-2xl bg-card">
                            {allSdgs.slice(0, 8).map(item => (
                                <label key={item} className="flex items-center gap-2 cursor-pointer group">
                                    <Checkbox checked={selectedSdgs.includes(item)} onCheckedChange={checked => setSelectedSdgs(prev => checked ? [...prev, item] : prev.filter(i => i !== item))} />
                                    <span className="text-[11px] font-medium text-muted-foreground group-hover:text-foreground">{item}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* STK Olarak Platformlar */}
                    <div className="space-y-6">
                        <SectionTitle icon={Activity}>STK OLARAK PLATFORMLAR</SectionTitle>
                        <div className="grid grid-cols-2 gap-2 p-4 border rounded-2xl bg-card">
                            {ngoPlatformOptions.map(item => (
                                <label key={item} className="flex items-center gap-2 cursor-pointer group">
                                    <Checkbox checked={selectedNetworks.includes(item)} onCheckedChange={checked => setSelectedNetworks(prev => checked ? [...prev, item] : prev.filter(i => i !== item))} />
                                    <span className="text-[11px] font-medium text-muted-foreground group-hover:text-foreground">{item}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Adres */}
                    <div className="space-y-6">
                        <SectionTitle icon={MapPin}>ADRES BİLGİLERİ</SectionTitle>
                        {/* TODO: Replace placeholder city list with full Turkish address dataset (il/ilçe/mahalle). */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <FormLabel>İl</FormLabel>
                                <Select value={formData.city} onValueChange={v => setFormData({...formData, city: v, district: '', neighborhood: ''})}>
                                    <SelectTrigger className="h-12 rounded-xl bg-card border-none"><SelectValue placeholder="İl Seç" /></SelectTrigger>
                                    <SelectContent className="max-h-60">{placeholderCities.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <FormLabel>İlçe</FormLabel>
                                <FormInput placeholder="İlçe" value={formData.district} onChange={e => setFormData({...formData, district: e.target.value})} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <FormLabel>Mahalle</FormLabel>
                            <FormInput placeholder="Mahalle" value={formData.neighborhood} onChange={e => setFormData({...formData, neighborhood: e.target.value})} />
                        </div>
                    </div>

                    {/* İletişim */}
                    <div className="space-y-6">
                        <SectionTitle icon={Mail}>İLETİŞİM & SOSYAL MEDYA</SectionTitle>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <FormLabel required>Kurumsal E-posta</FormLabel>
                                <IconInput icon={Mail} type="email" placeholder="iletisim@kurum.org" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                            </div>
                            <div className="space-y-2">
                                <FormLabel required>Kurumsal Telefon</FormLabel>
                                <div className="grid grid-cols-[140px_1fr] gap-2">
                                    <Select value={formData.phoneCountryCode} onValueChange={v => setFormData({...formData, phoneCountryCode: v})}>
                                        <SelectTrigger className="h-12 rounded-xl bg-card border-none shadow-sm font-bold">
                                            <SelectValue>
                                                <span className="text-base">{selectedCorporatePhone.flag}</span>
                                                <span className="ml-1">{selectedCorporatePhone.code}</span>
                                            </SelectValue>
                                        </SelectTrigger>
                                        <SelectContent className="max-h-60">
                                            {COUNTRY_PHONE_CODES.map((c) => (
                                                <SelectItem key={`${c.iso}-${c.code}`} value={c.code}>
                                                    <span className="text-base mr-2">{c.flag}</span>
                                                    {c.country} ({c.code})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormInput type="tel" placeholder="5XXXXXXXXX" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Yasal & Finansal */}
                    <div className="space-y-6">
                        <SectionTitle icon={FileText}>YASAL & FİNANSAL</SectionTitle>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <FormLabel>Kütük Numarası</FormLabel>
                                <FormInput placeholder="Kütük No" value={formData.registryNo} onChange={e => setFormData({...formData, registryNo: e.target.value})} />
                            </div>
                            <div className="space-y-2">
                                <FormLabel>IBAN</FormLabel>
                                <FormInput placeholder="TR..." value={formData.iban} onChange={e => setFormData({...formData, iban: e.target.value})} />
                            </div>
                        </div>
                    </div>

                    {/* Belgeler */}
                    <div className="space-y-6">
                        <SectionTitle icon={Upload}>YASAL BELGELER</SectionTitle>
                        <FileUpload label="TÜZÜK / VAKIF SENEDİ" accept=".pdf" required />
                        <FileUpload label="FAALİYET BELGESİ" accept=".pdf,.png,.jpg" required />
                    </div>

                    {/* Yetkili */}
                    <div className="space-y-6">
                        <SectionTitle icon={UserCircle}>YETKİLİ KİŞİ BİLGİLERİ</SectionTitle>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <FormLabel required>Ad Soyad</FormLabel>
                                <FormInput placeholder="Yetkili ad soyad" required value={formData.authorized.name} onChange={e => setFormData({...formData, authorized: {...formData.authorized, name: e.target.value}})} />
                            </div>
                            <div className="space-y-2">
                                <FormLabel required>Görevi</FormLabel>
                                <FormInput placeholder="Örn: Genel Sekreter" required value={formData.authorized.role} onChange={e => setFormData({...formData, authorized: {...formData.authorized, role: e.target.value}})} />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 pt-6">
                        <label className="flex items-start gap-2 cursor-pointer">
                            <Checkbox required />
                            <span className="text-[10px] text-muted-foreground leading-snug">STK Katılım Sözleşmesini ve Şeffaflık İlkelerini okudum, kabul ediyorum.</span>
                        </label>
                    </div>

                    <Button type="submit" className="w-full h-16 rounded-2xl text-lg font-black shadow-2xl bg-primary hover:bg-primary/90" disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="animate-spin" /> : "BAŞVURUYU TAMAMLA"}
                    </Button>
                </div>
            )}

            {entityType === 'BRAND' && (
                <div className="space-y-12">
                    <div className="space-y-6">
                        <SectionTitle icon={Store}>MARKA KİMLİĞİ</SectionTitle>
                        <div className="space-y-2">
                            <FormLabel required>Marka Adı</FormLabel>
                            <FormInput placeholder="Markanızın adı" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                            <FormLabel>İşletme Statüsü</FormLabel>
                            <Select value={formData.brandStatus} onValueChange={v => setFormData({...formData, brandStatus: v})}>
                                <SelectTrigger className="h-12 rounded-xl bg-card border-none"><SelectValue placeholder="Seçiniz" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="brand">Ticari Marka</SelectItem>
                                    <SelectItem value="cooperative">Kooperatif</SelectItem>
                                    <SelectItem value="social-enterprise">Sosyal İşletme</SelectItem>
                                    <SelectItem value="economic-enterprise">İktisadi İşletme</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <FormLabel>Sektör</FormLabel>
                            <Select value={formData.sector} onValueChange={v => setFormData({...formData, sector: v})}>
                                <SelectTrigger className="h-12 rounded-xl bg-card border-none"><SelectValue placeholder="Sektör Seçin" /></SelectTrigger>
                                <SelectContent className="max-h-60">
                                    {brandSectorOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Adres */}
                    <div className="space-y-6">
                        <SectionTitle icon={MapPin}>ADRES BİLGİLERİ</SectionTitle>
                        {/* TODO: Replace placeholder city list with full Turkish address dataset (il/ilçe/mahalle). */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <FormLabel>İl</FormLabel>
                                <Select value={formData.city} onValueChange={v => setFormData({...formData, city: v, district: '', neighborhood: ''})}>
                                    <SelectTrigger className="h-12 rounded-xl bg-card border-none"><SelectValue placeholder="İl Seç" /></SelectTrigger>
                                    <SelectContent className="max-h-60">{placeholderCities.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <FormLabel>İlçe</FormLabel>
                                <FormInput placeholder="İlçe" value={formData.district} onChange={e => setFormData({...formData, district: e.target.value})} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <FormLabel>Mahalle</FormLabel>
                            <FormInput placeholder="Mahalle" value={formData.neighborhood} onChange={e => setFormData({...formData, neighborhood: e.target.value})} />
                        </div>
                    </div>

                    <div className="space-y-6">
                        <SectionTitle icon={Target}>AFFILIATE & TEKNİK TAKİP</SectionTitle>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <FormLabel>Affiliate ID</FormLabel>
                                <FormInput placeholder="HNG-2024-X" value={formData.affiliateId} onChange={e => setFormData({...formData, affiliateId: e.target.value})} />
                            </div>
                            <div className="space-y-2">
                                <FormLabel>Tracking Link</FormLabel>
                                <FormInput placeholder="https://..." value={formData.trackingLink} onChange={e => setFormData({...formData, trackingLink: e.target.value})} />
                            </div>
                            <div className="space-y-2">
                                <FormLabel>Pixel Script</FormLabel>
                                <Textarea className="font-mono text-xs h-24 rounded-xl" placeholder="<script>...</script>" value={formData.pixelScript} onChange={e => setFormData({...formData, pixelScript: e.target.value})} />
                            </div>
                        </div>
                    </div>

                    {/* Kategori Bazlı Bağış Oranları */}
                    <div className="space-y-6">
                        <SectionTitle icon={Target}>KATEGORİ BAZLI BAĞIŞ ORANLARI</SectionTitle>
                        <p className="text-[11px] text-muted-foreground -mt-2">
                            Bağış oranlarınızı kategori bazında yönetim panelinden detaylandırabilirsiniz.
                        </p>

                        {/* Fiziksel Alışveriş alt başlığı */}
                        <div className="space-y-3 pt-4 border-t border-dashed">
                            <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Fiziksel Alışveriş</h4>
                            <label className="flex items-start gap-3 cursor-pointer p-3 rounded-2xl bg-card border">
                                <Checkbox
                                    checked={formData.physicalDonationsEnabled}
                                    onCheckedChange={checked => setFormData({...formData, physicalDonationsEnabled: !!checked})}
                                />
                                <span className="text-[12px] font-medium leading-snug">Fiziksel alışverişlerde de bağışlar geçerli olsun</span>
                            </label>
                            <label className="flex items-start gap-3 cursor-pointer p-3 rounded-2xl bg-card border">
                                <Checkbox
                                    checked={formData.posRequested}
                                    onCheckedChange={checked => setFormData({...formData, posRequested: !!checked})}
                                />
                                <span className="text-[12px] font-medium leading-snug">Pos Cihazı talep ediyorum</span>
                            </label>
                        </div>
                    </div>

                    <div className="space-y-4 pt-6 border-t border-dashed">
                        <label className="flex items-start gap-2 cursor-pointer">
                            <Checkbox required />
                            <span className="text-[10px] text-muted-foreground leading-snug">Marka Katılım Sözleşmesini ve Sosyal Etki Politikasını okudum, kabul ediyorum.</span>
                        </label>
                    </div>

                    <Button type="submit" className="w-full h-16 rounded-2xl text-lg font-black shadow-2xl bg-primary hover:bg-primary/90" disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="animate-spin" /> : "KAYDI TAMAMLA"}
                    </Button>
                </div>
            )}
            
            {entityType === 'CLUB' && (
                <div className="space-y-12">
                    <div className="space-y-6">
                        <SectionTitle icon={School}>KULÜP BİLGİLERİ</SectionTitle>
                        <div className="space-y-2">
                            <FormLabel required>Kulüp Adı</FormLabel>
                            <FormInput placeholder="Kulübün tam adı" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                            <FormLabel required>Kulüp Türü</FormLabel>
                            <Select value={formData.clubType} onValueChange={v => setFormData({...formData, clubType: v, clubAffiliation: ''})}>
                                <SelectTrigger className="h-12 rounded-xl bg-card border-none"><SelectValue placeholder="Kulüp Türünü Seçin" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Üniversite">Üniversite</SelectItem>
                                    <SelectItem value="Lise">Lise</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {formData.clubType === 'Üniversite' && (
                            <div className="space-y-2">
                                <FormLabel>Bağlı olduğunuz Üniversite</FormLabel>
                                <Select value={formData.clubAffiliation} onValueChange={v => setFormData({...formData, clubAffiliation: v, universityName: v})}>
                                    <SelectTrigger className="h-12 rounded-xl bg-card border-none"><SelectValue placeholder="Üniversite Seçin" /></SelectTrigger>
                                    <SelectContent className="max-h-60">
                                        {clubUniversityOptions.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {formData.clubType === 'Lise' && (
                            <div className="space-y-2">
                                <FormLabel>Bağlı olduğunuz İl Milli Eğitim Müdürlüğü</FormLabel>
                                <Select value={formData.clubAffiliation} onValueChange={v => setFormData({...formData, clubAffiliation: v})}>
                                    <SelectTrigger className="h-12 rounded-xl bg-card border-none"><SelectValue placeholder="İl Seçin" /></SelectTrigger>
                                    <SelectContent className="max-h-60">
                                        {placeholderCities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    </div>

                    {/* Kulüp Kategorisi */}
                    <div className="space-y-6">
                        <SectionTitle icon={Target}>KULÜP KATEGORİSİ</SectionTitle>
                        <p className="text-[11px] text-muted-foreground -mt-2">
                            Birden fazla kategori seçebilirsiniz.
                        </p>
                        <div className="space-y-5">
                            {clubCategoryGroups.map(group => (
                                <div key={group.group} className="space-y-2">
                                    <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground">{group.group}</h4>
                                    <div className="grid grid-cols-2 gap-2 p-4 border rounded-2xl bg-card">
                                        {group.items.map(item => (
                                            <label key={item} className="flex items-center gap-2 cursor-pointer group">
                                                <Checkbox
                                                    checked={selectedClubCategories.includes(item)}
                                                    onCheckedChange={checked => setSelectedClubCategories(prev => checked ? [...prev, item] : prev.filter(i => i !== item))}
                                                />
                                                <span className="text-[11px] font-medium text-muted-foreground group-hover:text-foreground">{item}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Yasal Belgeler & Logolar */}
                    <div className="space-y-6">
                        <SectionTitle icon={Upload}>YASAL BELGELER & LOGOLAR</SectionTitle>
                        <FileUpload label="KULÜP LOGOSU" accept=".png,.jpg,.jpeg,.svg" hint="PNG, JPG veya SVG formatında logonuzu yükleyin." />
                        <FileUpload
                            label="FAALİYET BELGESİ"
                            accept=".pdf,.png,.jpg,.jpeg"
                            hint="Bağlı olduğunuz okuldan veya ilgili makamdan aldığınız faaliyet belgesini yükleyin (PDF veya resim)."
                        />
                    </div>

                    <div className="space-y-4 pt-6 border-t border-dashed">
                        <label className="flex items-start gap-2 cursor-pointer">
                            <Checkbox required />
                            <span className="text-[10px] text-muted-foreground leading-snug">Öğrenci Kulüp Sözleşmesini ve Kampüs Kurallarını okudum, kabul ediyorum.</span>
                        </label>
                    </div>

                    <Button type="submit" className="w-full h-16 rounded-2xl text-lg font-black shadow-2xl bg-primary hover:bg-primary/90" disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="animate-spin" /> : "KAYDI TAMAMLA"}
                    </Button>
                </div>
            )}
        </form>
    );
};

const FormRenderer = () => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const tab = searchParams.get('tab') || 'individual';
    const entity = searchParams.get('entity') || 'NGO';

    return (
        <div className="min-h-screen bg-secondary flex items-start justify-center p-4 pt-8">
            <div className="w-full max-w-sm">
                <Card className="rounded-[2.5rem] shadow-2xl border-none overflow-hidden bg-background">
                    <CardHeader className="text-center pt-10 pb-6">
                        <HangelLogo className="text-3xl mx-auto mb-2" />
                        <CardTitle className="text-3xl font-black tracking-tighter">Hoş Geldiniz</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6 px-8 pb-10">
                        <Tabs value={tab} onValueChange={(val) => router.push(`/login/selection?tab=${val}&entity=${entity}`)}>
                            <TabsList className="grid w-full grid-cols-2 h-12 rounded-xl bg-muted/50 p-1">
                                <TabsTrigger value="individual" className="rounded-lg font-bold">Bireysel</TabsTrigger>
                                <TabsTrigger value="corporate" className="rounded-lg font-bold">Kurumsal</TabsTrigger>
                            </TabsList>
                            <TabsContent value="individual" className="pt-4">
                                <IndividualForm onComplete={() => router.push('/market')} />
                            </TabsContent>
                            <TabsContent value="corporate" className="pt-4">
                                <CorporateForm initialEntity={entity} />
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
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
