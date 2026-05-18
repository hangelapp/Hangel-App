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
    countryPhoneCodes, allCountries, allUniversities,
    allProvinces, districtsData, neighborhoodsData,
    allBeneficiaries, allSdgs, allMemberships
} from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { useAuth, useFirestore, useUser, setDocumentNonBlocking } from '@/firebase';
import { updateProfile, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { initiateEmailVerification } from '@/firebase/non-blocking-login';
import { doc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
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

const IndividualForm = ({ onComplete }: { onComplete: (isNewUser: boolean) => void }) => {
    const auth = useAuth();
    const db = useFirestore();
    const { toast } = useToast();
    const searchParams = useSearchParams();

    type IndividualStep = 'email' | 'login' | 'register' | 'verify-sent' | 'forgot' | 'forgot-sent';
    const [step, setStep] = useState<IndividualStep>('email');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [phoneCode, setPhoneCode] = useState('90');
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
            setDocumentNonBlocking(doc(db, 'users', userId), {
                id: userId,
                name: name,
                personalInfo: {
                    email: email.trim().toLowerCase(),
                    phone: `+${phoneCode}${phone.replace(/\D/g, '')}`,
                },
                stats: { totalDonation: 0, volunteerHours: 0, impactScore: 0 },
                ...(referrerId ? { invitedBy: referrerId } : {}),
                createdAt: serverTimestamp(),
                joinDate: new Date().toISOString().split('T')[0],
            }, { merge: true });

            await initiateEmailVerification(userCredential.user);
            setStep('verify-sent');
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Bir hata oluştu.';
            toast({ variant: 'destructive', title: 'Kayıt Başarısız', description: message });
        } finally {
            setIsLoading(false);
        }
    };

    const uniquePhoneCodes = Array.from(new Set(countryPhoneCodes)).sort();

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
                    <div className="flex gap-2">
                        <Select value={phoneCode} onValueChange={setPhoneCode}>
                            <SelectTrigger className="w-[90px] h-12 rounded-xl bg-card border-none shadow-sm"><SelectValue /></SelectTrigger>
                            <SelectContent className="max-h-60">
                                {uniquePhoneCodes.map((code, idx) => <SelectItem key={`${code}-${idx}`} value={code}>+{code}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <FormInput type="tel" placeholder="5XXXXXXXXX" required value={phone} onChange={e => setPhone(e.target.value)} className="flex-1" />
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
        phoneCode: '90',
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
        universityName: '',
        clubCategory: '',
        authorized: { name: '', role: '', email: '', phone: '', phoneCode: '90' },
        affiliateId: '',
        trackingLink: '',
        pixelScript: '',
    });

    const [selectedBeneficiaries, setSelectedBeneficiaries] = useState<string[]>([]);
    const [selectedSdgs, setSelectedSdgs] = useState<string[]>([]);
    const [selectedNetworks, setSelectedNetworks] = useState<string[]>([]);
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

    const uniquePhoneCodes = Array.from(new Set(countryPhoneCodes)).sort();

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
                                <FormLabel>Sektör / Alan</FormLabel>
                                <FormInput placeholder="Örn: Eğitim, Çevre" value={formData.sector} onChange={e => setFormData({...formData, sector: e.target.value})} />
                            </div>
                        </div>
                    </div>

                    {/* Etki Alanları */}
                    <div className="space-y-6">
                        <SectionTitle icon={Target}>ETKİ ALANLARI</SectionTitle>
                        <div className="space-y-3">
                            <FormLabel>Faydalanıcı Gruplar</FormLabel>
                            <div className="grid grid-cols-2 gap-2 p-4 border rounded-2xl bg-card">
                                {allBeneficiaries.slice(0, 10).map(item => (
                                    <label key={item} className="flex items-center gap-2 cursor-pointer group">
                                        <Checkbox checked={selectedBeneficiaries.includes(item)} onCheckedChange={checked => setSelectedBeneficiaries(prev => checked ? [...prev, item] : prev.filter(i => i !== item))} />
                                        <span className="text-[11px] font-medium text-muted-foreground group-hover:text-foreground">{item}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-3">
                            <FormLabel>Sürdürülebilir Kalkınma Amaçları (SKA)</FormLabel>
                            <div className="grid grid-cols-1 gap-2 p-4 border rounded-2xl bg-card">
                                {allSdgs.slice(0, 8).map(item => (
                                    <label key={item} className="flex items-center gap-2 cursor-pointer group">
                                        <Checkbox checked={selectedSdgs.includes(item)} onCheckedChange={checked => setSelectedSdgs(prev => checked ? [...prev, item] : prev.filter(i => i !== item))} />
                                        <span className="text-[11px] font-medium text-muted-foreground group-hover:text-foreground">{item}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Network */}
                    <div className="space-y-6">
                        <SectionTitle icon={Activity}>KURUMSAL NETWORK</SectionTitle>
                        <div className="grid grid-cols-2 gap-2 p-4 border rounded-2xl bg-card">
                            {allMemberships.slice(0, 8).map(item => (
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
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <FormLabel>İl</FormLabel>
                                <Select value={formData.city} onValueChange={v => setFormData({...formData, city: v, district: '', neighborhood: ''})}>
                                    <SelectTrigger className="h-12 rounded-xl bg-card border-none"><SelectValue placeholder="İl Seç" /></SelectTrigger>
                                    <SelectContent className="max-h-60">{allProvinces.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <FormLabel>İlçe</FormLabel>
                                <Select value={formData.district} onValueChange={v => setFormData({...formData, district: v, neighborhood: ''})} disabled={!formData.city}>
                                    <SelectTrigger className="h-12 rounded-xl bg-card border-none"><SelectValue placeholder="İlçe Seç" /></SelectTrigger>
                                    <SelectContent className="max-h-60">{formData.city && districtsData[formData.city]?.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <FormLabel>Mahalle</FormLabel>
                            <Select value={formData.neighborhood} onValueChange={v => setFormData({...formData, neighborhood: v})} disabled={!formData.district}>
                                <SelectTrigger className="h-12 rounded-xl bg-card border-none"><SelectValue placeholder="Mahalle Seç" /></SelectTrigger>
                                <SelectContent className="max-h-60">{formData.city && formData.district && (neighborhoodsData as Record<string, Record<string, string[]>>)[formData.city]?.[formData.district]?.map((n: string) => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent>
                            </Select>
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
                                <div className="flex gap-2">
                                    <Select value={formData.phoneCode} onValueChange={v => setFormData({...formData, phoneCode: v})}>
                                        <SelectTrigger className="w-[90px] h-12 rounded-xl bg-card border-none"><SelectValue /></SelectTrigger>
                                        <SelectContent className="max-h-60">{uniquePhoneCodes.map((c, i) => <SelectItem key={`${c}-${i}`} value={c}>+{c}</SelectItem>)}</SelectContent>
                                    </Select>
                                    <FormInput type="tel" placeholder="5XXXXXXXXX" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="flex-1" />
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
                        <SectionTitle icon={Upload}>RESMİ BELGELER</SectionTitle>
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
                                <SelectContent><SelectItem value="brand">Ticari Marka</SelectItem><SelectItem value="cooperative">Kooperatif</SelectItem><SelectItem value="social-enterprise">Sosyal İşletme</SelectItem></SelectContent>
                            </Select>
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
                            <FormLabel>Üniversite</FormLabel>
                            <Select value={formData.universityName} onValueChange={v => setFormData({...formData, universityName: v})}>
                                <SelectTrigger className="h-12 rounded-xl bg-card border-none"><SelectValue placeholder="Üniversite Seçin" /></SelectTrigger>
                                <SelectContent className="max-h-60">{allUniversities.map((u: string) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-4 pt-6 border-t border-dashed">
                        <label className="flex items-start gap-2 cursor-pointer">
                            <Checkbox required />
                            <span className="text-[10px] text-muted-foreground leading-snug">Kulüp Katılım Beyanını ve Kampüs Kurallarını okudum, kabul ediyorum.</span>
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
