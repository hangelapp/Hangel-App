
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
    Percent,
    X,
    ShieldCheck,
    Landmark,
    Plus,
    Trash2,
    Mail,
    Phone,
    Instagram,
    Linkedin,
    Code,
    ExternalLink,
    MousePointer2,
    Target,
    Users,
    DollarSign,
    Activity,
    ChevronDown,
    Link as LinkIcon
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { 
    marketCategories, 
    countryPhoneCodes, 
    allCountries, 
    allUniversities, 
    allBeneficiaries, 
    allSdgs, 
    allMemberships, 
    years, 
    allProvinces, 
    districtsData, 
    neighborhoodsData,
    allInterests 
} from '@/lib/data';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth, useFirestore, setDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase';
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult, updateProfile } from 'firebase/auth';
import { doc, collection } from 'firebase/firestore';
import { HangelLogo } from '@/components/icons';

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

const FileUpload = ({label, accept, hint, required}: {label: string, accept?: string, hint?: string, required?: boolean}) => (
    <div className="space-y-2 text-left">
        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{label} {required && "*"}</Label>
        <div className="flex items-center gap-4 p-4 border rounded-2xl bg-muted/20 border-dashed border-primary/20 transition-all hover:bg-muted/30">
            <input id={`${label.replace(/\s+/g, '-')}-upload`} type="file" className="hidden" accept={accept} required={required} />
            <Button asChild variant="outline" size="sm" className="rounded-xl border-primary/20 hover:bg-primary/5 bg-background h-10 px-4">
                <label htmlFor={`${label.replace(/\s+/g, '-')}-upload`} className="cursor-pointer font-bold flex items-center"><Upload className="mr-2 h-4 w-4" />Belge Seç</label>
            </Button>
            <div className="flex-1">
                <p className="text-[10px] text-muted-foreground leading-tight">{hint || "Lütfen resmi formatta bir dosya yükleyin."}</p>
            </div>
        </div>
    </div>
);

const SectionTitle = ({ children, icon: Icon }: { children: React.ReactNode, icon?: any }) => (
    <div className="flex items-center gap-2 mb-4 pt-4 first:pt-0">
        {Icon && <Icon className="h-5 w-5 text-primary" />}
        <h3 className="text-sm font-black uppercase tracking-[0.1em] text-primary">{children}</h3>
    </div>
);

const FormLabel = ({ children, required }: { children: React.ReactNode, required?: boolean }) => (
    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 mb-2 block text-left">
        {children} {required && <span className="text-primary">*</span>}
    </Label>
);

const FormInput = (props: React.ComponentProps<typeof Input>) => (
    <Input {...props} className={cn("h-12 rounded-xl bg-muted/20 border-none shadow-sm focus-visible:ring-1 focus-visible:ring-primary/30", props.className)} />
);

const IconInput = ({ icon: Icon, ...props }: React.ComponentProps<typeof Input> & { icon: any }) => (
    <div className="relative group">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
            <Icon className="h-4 w-4" />
        </div>
        <FormInput {...props} className={cn("pl-11", props.className)} />
    </div>
);

// --- Individual Form Component ---

const IndividualForm = ({ isRegister = false, onComplete }: { isRegister?: boolean; onComplete: () => void }) => {
    const auth = useAuth();
    const db = useFirestore();
    const { toast } = useToast();
    const [phone, setPhone] = useState('');
    const [phoneCode, setPhoneCode] = useState('90');
    const [name, setName] = useState('');
    const [otp, setOtp] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
    const [step, setStep] = useState<'phone' | 'otp'>('phone');
    const recaptchaContainerRef = React.useRef<HTMLDivElement>(null);
    const recaptchaVerifierRef = React.useRef<RecaptchaVerifier | null>(null);

    const uniquePhoneCodes = useMemo(() => Array.from(new Set(countryPhoneCodes)).sort((a, b) => parseInt(a) - parseInt(b)), []);

    // Initialize reCAPTCHA verifier
    const getRecaptchaVerifier = () => {
        if (!recaptchaVerifierRef.current) {
            recaptchaVerifierRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
                size: 'invisible',
            });
        }
        return recaptchaVerifierRef.current;
    };

    // Step 1: Send OTP
    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        const fullPhone = `+${phoneCode}${phone.replace(/\D/g, '')}`;
        try {
            const verifier = getRecaptchaVerifier();
            const result = await signInWithPhoneNumber(auth, fullPhone, verifier);
            setConfirmationResult(result);
            setStep('otp');
            toast({ title: "Kod Gönderildi", description: `${fullPhone} numarasına doğrulama kodu gönderildi.` });
        } catch (error: any) {
            // Reset reCAPTCHA on error
            recaptchaVerifierRef.current = null;
            toast({ variant: "destructive", title: "Hata", description: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    // Step 2: Verify OTP
    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!confirmationResult) return;
        setIsLoading(true);
        try {
            const userCredential = await confirmationResult.confirm(otp);
            const userId = userCredential.user.uid;
            const fullPhone = `+${phoneCode}${phone.replace(/\D/g, '')}`;

            if (isRegister && name) {
                setDocumentNonBlocking(doc(db, 'users', userId), {
                    id: userId,
                    name: name,
                    username: `@${phone.replace(/\D/g, '')}`,
                    role: 'user',
                    personalInfo: { phone: fullPhone, address: { country: 'Türkiye' } },
                    stats: { totalDonation: 0, volunteerHours: 0, impactScore: 0 }
                }, { merge: true });
                await updateProfile(userCredential.user, { displayName: name });
            }

            onComplete();
        } catch (error: any) {
            toast({ variant: "destructive", title: "Hata", description: "Doğrulama kodu hatalı. Lütfen tekrar deneyin." });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <div id="recaptcha-container" ref={recaptchaContainerRef} />
            {step === 'phone' ? (
                <form onSubmit={handleSendOtp} className="space-y-5">
                    {isRegister && (
                        <div className="space-y-2">
                            <FormLabel>Ad Soyad</FormLabel>
                            <FormInput placeholder="Ör.: İsmail Hilmi ADIGÜZEL" required value={name} onChange={(e) => setName(e.target.value)} />
                        </div>
                    )}
                    <div className="space-y-2">
                        <FormLabel>Telefon</FormLabel>
                        <div className="flex gap-2">
                            <div className="w-[100px] shrink-0">
                                <Select value={phoneCode} onValueChange={setPhoneCode}>
                                    <SelectTrigger className="h-12 rounded-xl bg-muted/20 border-none shadow-sm"><SelectValue /></SelectTrigger>
                                    <SelectContent className="max-h-60">
                                        {uniquePhoneCodes.map((code, idx) => (
                                            <SelectItem key={`${code}-${idx}`} value={code}>+{code}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <FormInput type="tel" placeholder="5XXXXXXXXX" required value={phone} onChange={(e) => setPhone(e.target.value)} className="flex-1 font-bold" />
                        </div>
                    </div>
                    <Button type="submit" className="w-full h-14 rounded-2xl text-base font-black shadow-xl" disabled={isLoading}>
                        {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Doğrulama Kodu Gönder"}
                    </Button>
                </form>
            ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-5">
                    <div className="text-center space-y-2">
                        <p className="text-sm text-muted-foreground">
                            <span className="font-bold text-foreground">+{phoneCode}{phone}</span> numarasına gönderilen kodu girin
                        </p>
                    </div>
                    <div className="space-y-2">
                        <FormLabel>Doğrulama Kodu</FormLabel>
                        <FormInput
                            type="text"
                            inputMode="numeric"
                            placeholder="123456"
                            required
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            className="text-center text-2xl font-black tracking-[0.5em]"
                            maxLength={6}
                        />
                    </div>
                    <Button type="submit" className="w-full h-14 rounded-2xl text-base font-black shadow-xl" disabled={isLoading || otp.length < 6}>
                        {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Doğrula ve Giriş Yap"}
                    </Button>
                    <Button type="button" variant="ghost" className="w-full text-sm" onClick={() => { setStep('phone'); setOtp(''); recaptchaVerifierRef.current = null; }}>
                        Numarayı Değiştir
                    </Button>
                </form>
            )}
        </>
    );
};

// --- Corporate Form Component ---

const CorporateForm = ({ initialEntity }: { initialEntity: string }) => {
    const db = useFirestore();
    const router = useRouter();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [entityType, setEntityType] = useState<string>(initialEntity);
    
    // State
    const [formData, setFormData] = useState({
        country: 'Türkiye',
        brandStatus: 'Seçiniz...',
        name: '',
        sector: 'Seçiniz...',
        affiliateId: '',
        trackingLink: '',
        pixelScript: '',
        cookieDuration: '',
        exceptions: '',
        city: '',
        district: '',
        addressLine: '',
        email: '',
        phone: '',
        phoneCode: '90',
        website: '',
        social: { instagram: '', twitter: '', linkedin: '' },
        legalTitle: '',
        iban: '',
        authorized: { name: '', role: '', email: '', phone: '', phoneCode: '90' }
    });

    const [donationCategories, setDonationCategories] = useState([{ id: Date.now().toString(), category: '', rate: '5' }]);

    const addCategory = () => setDonationCategories([...donationCategories, { id: Date.now().toString(), category: '', rate: '5' }]);
    const removeCategory = (id: string) => setDonationCategories(donationCategories.filter(c => c.id !== id));

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await addDocumentNonBlocking(collection(db, 'applications'), {
                ...formData,
                donationCategories,
                entityType,
                date: new Date().toISOString().split('T')[0],
                status: 'Beklemede'
            });
            toast({ title: "Başvuru Alındı", description: "Kurumsal ekibimiz en kısa sürede sizinle iletişime geçecektir." });
            router.push('/login');
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Hata', description: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    const uniquePhoneCodes = useMemo(() => Array.from(new Set(countryPhoneCodes)).sort((a, b) => parseInt(a) - parseInt(b)), []);

    return (
        <form onSubmit={handleFormSubmit} className="space-y-10 animate-in fade-in-0 pb-10">
            {/* Global Selectors */}
            <div className="space-y-6">
                <div className="space-y-2">
                    <FormLabel>Hesap Tipi</FormLabel>
                    <Select value="kurumsal">
                        <SelectTrigger className="h-12 rounded-xl bg-muted/20 border-none shadow-sm font-bold text-left"><SelectValue placeholder="Kurumsal (STK, Marka, Kulüp)" /></SelectTrigger>
                        <SelectContent><SelectItem value="kurumsal">Kurumsal (STK, Marka, Kulüp)</SelectItem></SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <FormLabel>Ülke</FormLabel>
                    <Select value={formData.country} onValueChange={(val) => setFormData({...formData, country: val})}>
                        <SelectTrigger className="h-12 rounded-xl bg-muted/20 border-none shadow-sm font-bold text-left"><SelectValue /></SelectTrigger>
                        <SelectContent className="max-h-60">
                            {allCountries.map((c, idx) => <SelectItem key={`${c}-${idx}`} value={c}>{c}</SelectItem>)}
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

            {entityType === 'BRAND' && (
                <div className="space-y-12 animate-in slide-in-from-top-4 duration-500">
                    
                    {/* Marka Kimliği */}
                    <div className="space-y-6">
                        <SectionTitle>MARKA KİMLİĞİ</SectionTitle>
                        <div className="space-y-2">
                            <FormLabel>İşletme Statüsü</FormLabel>
                            <Select value={formData.brandStatus} onValueChange={(val) => setFormData({...formData, brandStatus: val})}>
                                <SelectTrigger className="h-12 rounded-xl bg-muted/20 border-none"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="brand">Ticari Marka</SelectItem>
                                    <SelectItem value="cooperative">Kooperatif</SelectItem>
                                    <SelectItem value="social-enterprise">Sosyal İşletme</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <FormLabel>Marka Adı</FormLabel>
                            <FormInput placeholder="Markanın adı" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
                        </div>
                        <div className="space-y-2">
                            <FormLabel>Sektör</FormLabel>
                            <Select value={formData.sector} onValueChange={(val) => setFormData({...formData, sector: val})}>
                                <SelectTrigger className="h-12 rounded-xl bg-muted/20 border-none"><SelectValue /></SelectTrigger>
                                <SelectContent className="max-h-60">
                                    {marketCategories.filter(c => c.mainCategory !== 'Tümü').map(cat => <SelectItem key={cat.mainCategory} value={cat.mainCategory}>{cat.mainCategory}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

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
                                <div key={cat.id} className="grid grid-cols-12 gap-2 animate-in fade-in-0 duration-300">
                                    <div className="col-span-7">
                                        <FormInput placeholder="Örn: Giyim, Aksesuar" value={cat.category} onChange={(e) => {
                                            const newCats = [...donationCategories];
                                            newCats[idx].category = e.target.value;
                                            setDonationCategories(newCats);
                                        }} />
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
                            ))}
                        </div>
                        <Button type="button" variant="outline" className="w-full h-12 border-dashed border-primary/30 rounded-xl text-primary font-bold hover:bg-primary/5" onClick={addCategory}>
                            + YENİ KATEGORİ EKLE
                        </Button>
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

                    {/* Adres Bilgileri */}
                    <div className="space-y-6">
                        <SectionTitle>ADRES BİLGİLERİ</SectionTitle>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <FormLabel>İL / EYALET</FormLabel>
                                <Select value={formData.city} onValueChange={(val) => setFormData({...formData, city: val, district: ''})}>
                                    <SelectTrigger className="h-12 rounded-xl bg-muted/20 border-none"><SelectValue placeholder="Şehir / Eyalet girin" /></SelectTrigger>
                                    <SelectContent className="max-h-60">{allProvinces.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <FormLabel>İLÇE / BÖLGE</FormLabel>
                                <Select value={formData.district} onValueChange={(val) => setFormData({...formData, district: val})} disabled={!formData.city}>
                                    <SelectTrigger className="h-12 rounded-xl bg-muted/20 border-none"><SelectValue placeholder="İlçe / Bölge girin" /></SelectTrigger>
                                    <SelectContent className="max-h-60">{formData.city && (districtsData[formData.city] || []).map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
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
                                            <SelectTrigger className="h-12 rounded-xl bg-muted/20 border-none"><SelectValue /></SelectTrigger>
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

                    {/* Yasal & Finansal */}
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

                    {/* Yasal Belgeler & Logolar */}
                    <div className="space-y-6">
                        <SectionTitle>YASAL BELGELER & LOGOLAR</SectionTitle>
                        <FileUpload label="VERGİ LEVHASI *" accept=".pdf,.png,.jpg" required />
                        <FileUpload label="MARKA LOGOSU *" accept=".png,.jpg" hint="Arkaplansız (transparan) .png ve en az 512x512px olmalıdır." required />
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
                            <FormLabel>KURUMSAL E-POSTA</FormLabel>
                            <FormInput type="email" placeholder="ornek@marka.com" value={formData.authorized.email} onChange={(e) => setFormData({...formData, authorized: {...formData.authorized, email: e.target.value}})} required />
                        </div>
                        <div className="space-y-2">
                            <FormLabel>KURUMSAL TELEFON</FormLabel>
                            <div className="flex gap-2">
                                <div className="w-[100px] shrink-0">
                                    <Select value={formData.authorized.phoneCode} onValueChange={(val) => setFormData({...formData, authorized: {...formData.authorized, phoneCode: val}})}>
                                        <SelectTrigger className="h-12 rounded-xl bg-muted/20 border-none"><SelectValue /></SelectTrigger>
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
                                <span className="text-primary font-bold">Marka Katılım Sözleşmesi</span>'ni ve <span className="text-primary font-bold">Etik İlkeleri</span> okudum, kabul ediyorum.
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

            {/* STK ve Kulüp Formları (Görseldeki Marka Formu odaklı olduğu için benzer hiyerarşide tutuldu) */}
            {entityType !== 'BRAND' && (
                <div className="py-20 text-center space-y-4 animate-in fade-in-0">
                    <Building2 className="h-16 w-16 mx-auto text-muted-foreground/20" />
                    <p className="text-muted-foreground font-medium">Bu kuruluş türü için form yapılandırması Marka formuna benzer hiyerarşide hazırlanmaktadır.</p>
                    <Button variant="outline" onClick={() => setEntityType('BRAND')}>Marka Formunu İncele</Button>
                </div>
            )}
        </form>
    );
};

const FormRenderer = () => {
    const searchParams = useSearchParams();
    const router = useRouter();
    
    const action = searchParams.get('action') || 'login';
    const type = searchParams.get('type') || 'individual';
    const initialEntity = searchParams.get('entity') || 'NGO';
    
    return (
        <div className="min-h-screen bg-secondary flex items-center justify-center p-4 sm:p-6 pt-20 pb-20">
            <div className="w-full max-sm:max-w-sm lg:max-w-2xl">
                <Button onClick={() => router.push('/login')} variant="ghost" size="icon" className="absolute top-6 left-6 rounded-full bg-background/50 h-10 w-10">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <Card className="rounded-[2.5rem] shadow-2xl border-none overflow-hidden bg-background">
                    <CardHeader className="text-center pt-10 pb-6">
                        <div className="w-16 h-16 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-2">
                            <HangelLogo className="text-3xl" />
                        </div>
                        <CardTitle className="text-3xl font-black tracking-tighter">
                            İyiliğe İlk Adım
                        </CardTitle>
                        <CardDescription>Toplumsal etki için aramıza katılın.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 px-8 pb-10 text-center">
                        <Tabs value={action} onValueChange={(val) => router.push(`/login/selection?action=${val}&type=${type}&entity=${initialEntity}`)}>
                            <TabsList className="grid w-full grid-cols-2 h-12 rounded-xl bg-muted/50 p-1">
                                <TabsTrigger value="login" className="rounded-lg font-bold">Giriş Yap</TabsTrigger>
                                <TabsTrigger value="register" className="rounded-lg font-bold">Kayıt Ol</TabsTrigger>
                            </TabsList>
                        </Tabs>

                        {action === 'login' ? (
                            <IndividualForm onComplete={() => router.push('/timeline')} />
                        ) : (
                            <div className="space-y-6 pt-4">
                                {type === 'individual' ? (
                                    <IndividualForm isRegister={true} onComplete={() => router.push('/timeline')} />
                                ) : (
                                    <CorporateForm initialEntity={initialEntity} />
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
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
