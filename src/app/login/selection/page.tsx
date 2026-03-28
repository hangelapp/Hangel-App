
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

const IndividualForm = ({ onComplete }: { onComplete: () => void }) => {
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
    const recaptchaVerifierRef = React.useRef<RecaptchaVerifier | null>(null);

    const uniquePhoneCodes = useMemo(() => Array.from(new Set(countryPhoneCodes)).sort((a, b) => parseInt(a) - parseInt(b)), []);

    const getRecaptchaVerifier = () => {
        if (!recaptchaVerifierRef.current) {
            recaptchaVerifierRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', { size: 'invisible' });
        }
        return recaptchaVerifierRef.current;
    };

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
            recaptchaVerifierRef.current = null;
            toast({ variant: "destructive", title: "Hata", description: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!confirmationResult) return;
        setIsLoading(true);
        try {
            const userCredential = await confirmationResult.confirm(otp);
            const userId = userCredential.user.uid;
            const fullPhone = `+${phoneCode}${phone.replace(/\D/g, '')}`;

            const { getDoc: fsGetDoc } = await import('firebase/firestore');
            const userDocSnap = await fsGetDoc(doc(db, 'users', userId));
            if (!userDocSnap.exists()) {
                setDocumentNonBlocking(doc(db, 'users', userId), {
                    id: userId,
                    name: name || userCredential.user.displayName || '',
                    username: `@${phone.replace(/\D/g, '')}`,
                    role: 'user',
                    personalInfo: { phone: fullPhone, address: { country: 'Türkiye' } },
                    stats: { totalDonation: 0, volunteerHours: 0, impactScore: 0 }
                }, { merge: true });
                if (name) await updateProfile(userCredential.user, { displayName: name });
            }
            onComplete();
        } catch (error: any) {
            toast({ variant: "destructive", title: "Hata", description: "Doğrulama kodu hatalı." });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div id="recaptcha-container" />
            {step === 'phone' ? (
                <form onSubmit={handleSendOtp} className="space-y-5">
                    <div className="space-y-2">
                        <FormLabel>Ad Soyad</FormLabel>
                        <FormInput placeholder="Ör.: İsmail Hilmi ADIGÜZEL" value={name} onChange={(e) => setName(e.target.value)} required />
                    </div>
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
                    <div className="space-y-4 pt-2">
                        <div className="flex items-start space-x-2 text-left">
                            <Checkbox id="terms-ind" required />
                            <Label htmlFor="terms-ind" className="text-[10px] font-medium leading-relaxed text-muted-foreground cursor-pointer">
                                <Link href="/settings/contracts/kullanici-sozlesmesi" className="text-primary font-bold">Kullanıcı Sözleşmesini</Link> ve <Link href="/settings/contracts/gizlilik-politikasi" className="text-primary font-bold">Gizlilik Politikasını</Link> okudum, kabul ediyorum.
                            </Label>
                        </div>
                    </div>
                    <Button type="submit" className="w-full h-14 rounded-2xl text-base font-black shadow-xl" disabled={isLoading}>
                        {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Doğrulama Kodu Gönder"}
                    </Button>
                </form>
            ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-5">
                    <div className="text-center space-y-2">
                        <p className="text-sm text-muted-foreground">Kodu girin</p>
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
                    <Button type="button" variant="ghost" className="w-full text-sm font-bold" onClick={() => setStep('phone')}>Numarayı Değiştir</Button>
                </form>
            )}
        </div>
    );
};

// --- Corporate Form Component ---

const brandCategoryOptions = [
    'Moda', 'Elektronik', 'Ev & Yaşam', 'Market', 'Kozmetik & Kişisel Bakım', 'Anne, Bebek & Çocuk', 'Etkinlik', 'Seyahat Bilet', 'Otomotiv & Motosiklet', 'Spor & Outdoor', 'Tatil & Otel Rezervasyonu', 'Pazaryeri', 'Kitap, Kırtasiye & Hobi', 'Süpermarket & Pet Shop', 'Mücevher & Saat', 'Sigorta', 'Oyun, Film & Müzik', 'Yapı Market & Hırdavat', 'Sağlık & Medikal', 'Endüstriyel & Ofis', 'Diğer'
];

const CorporateForm = ({ initialEntity }: { initialEntity: string }) => {
    const db = useFirestore();
    const router = useRouter();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [entityType, setEntityType] = useState<string>(initialEntity);
    
    const [formData, setFormData] = useState({
        country: 'Türkiye',
        brandStatus: '',
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
        authorized: { name: '', role: '', email: '', phone: '', phoneCode: '90' },
        registryNo: '',
        university: '',
    });

    const [selectedBeneficiaries, setSelectedBeneficiaries] = useState<string[]>([]);
    const [selectedServiceAreas, setSelectedServiceAreas] = useState<string[]>([]);
    const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
    const [donationCategories, setDonationCategories] = useState([{ id: Date.now().toString(), category: '', rate: '5', customCategory: '' }]);

    const toggleItem = (list: string[], setList: (v: string[]) => void, item: string) => {
        setList(list.includes(item) ? list.filter(i => i !== item) : [...list, item]);
    };

    const addCategory = () => setDonationCategories([...donationCategories, { id: Date.now().toString(), category: '', rate: '5', customCategory: '' }]);
    const removeCategory = (id: string) => setDonationCategories(donationCategories.filter(c => c.id !== id));

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await addDocumentNonBlocking(collection(db, 'applications'), {
                ...formData,
                donationCategories,
                entityType,
                beneficiaries: selectedBeneficiaries,
                serviceAreas: selectedServiceAreas,
                platforms: selectedPlatforms,
                date: new Date().toISOString().split('T')[0],
                status: 'Beklemede'
            });
            toast({ title: "Başvuru Alındı", description: "Kurumsal ekibimiz inceleme sonrası sizinle iletişime geçecektir." });
            router.push('/login');
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Hata', description: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    const uniquePhoneCodes = useMemo(() => Array.from(new Set(countryPhoneCodes)).sort((a, b) => parseInt(a) - parseInt(b)), []);
    const isTurkey = formData.country === 'Türkiye';

    return (
        <form onSubmit={handleFormSubmit} className="space-y-10 animate-in fade-in-0 pb-10">
            {/* Global Selectors */}
            <div className="space-y-6">
                <div className="space-y-2">
                    <FormLabel>Ülke</FormLabel>
                    <Select value={formData.country} onValueChange={(val) => setFormData({...formData, country: val, city: '', district: '', neighborhood: ''})}>
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

            {/* Dinamik Form Alanları */}
            <div className="space-y-12">
                
                {/* 1. Kimlik Bilgileri */}
                <div className="space-y-6">
                    <SectionTitle icon={entityType === 'BRAND' ? Store : Building2}>
                        {entityType === 'BRAND' ? 'MARKA KİMLİĞİ' : entityType === 'CLUB' ? 'KULÜP KİMLİĞİ' : 'KURULUŞ KİMLİĞİ'}
                    </SectionTitle>
                    {entityType === 'BRAND' && (
                        <div className="space-y-2">
                            <FormLabel>İşletme Statüsü</FormLabel>
                            <Select value={formData.brandStatus} onValueChange={(val) => setFormData({...formData, brandStatus: val})}>
                                <SelectTrigger className="h-12 rounded-xl bg-muted/20 border-none text-left font-bold"><SelectValue placeholder="Seçiniz..." /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="brand">Ticari Marka</SelectItem>
                                    <SelectItem value="cooperative">Kooperatif</SelectItem>
                                    <SelectItem value="social-enterprise">Sosyal İşletme</SelectItem>
                                    <SelectItem value="economic-enterprise">İktisadi İşletme</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                    {entityType === 'CLUB' && (
                        <div className="space-y-2">
                            <FormLabel>Üniversite / Lise Adı</FormLabel>
                            <Select value={formData.university} onValueChange={(val) => setFormData({...formData, university: val})}>
                                <SelectTrigger className="h-12 rounded-xl bg-muted/20 border-none text-left font-bold"><SelectValue placeholder="Kurum Seçiniz..." /></SelectTrigger>
                                <SelectContent className="max-h-60">
                                    {allUniversities.map(uni => <SelectItem key={uni} value={uni}>{uni}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                    <div className="space-y-2">
                        <FormLabel>{entityType === 'BRAND' ? 'Marka Adı' : 'Kuruluş Adı'} *</FormLabel>
                        <FormInput placeholder="Kuruluşun resmi adı" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required />
                    </div>
                    {entityType === 'NGO' && (
                        <div className="space-y-2">
                            <FormLabel>Kütük Numarası</FormLabel>
                            <FormInput placeholder="Resmi kütük no" value={formData.registryNo} onChange={(e) => setFormData({...formData, registryNo: e.target.value})} />
                        </div>
                    )}
                </div>

                {/* 2. Etki Alanları (Sadece STK) */}
                {entityType === 'NGO' && (
                    <>
                        <div className="space-y-4">
                            <SectionTitle icon={Users}>FAYDALANICI GRUPLAR</SectionTitle>
                            <div className="grid grid-cols-2 gap-3">
                                {allBeneficiaries.map(item => (
                                    <label key={item} className="flex items-center gap-2 cursor-pointer group">
                                        <Checkbox checked={selectedBeneficiaries.includes(item)} onCheckedChange={() => toggleItem(selectedBeneficiaries, setSelectedBeneficiaries, item)} />
                                        <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground">{item}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-4">
                            <SectionTitle icon={Target}>HİZMET ALANLARI (SKA)</SectionTitle>
                            <div className="grid grid-cols-1 gap-3">
                                {allSdgs.map(item => (
                                    <label key={item} className="flex items-center gap-2 cursor-pointer group">
                                        <Checkbox checked={selectedServiceAreas.includes(item)} onCheckedChange={() => toggleItem(selectedServiceAreas, setSelectedServiceAreas, item)} />
                                        <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground">{item}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </>
                )}

                {/* 3. Marka Özel Bölümleri */}
                {entityType === 'BRAND' && (
                    <div className="space-y-10">
                        <div className="space-y-6">
                            <SectionTitle icon={Percent}>KATEGORİ BAZLI BAĞIŞ ORANLARI</SectionTitle>
                            <div className="space-y-3">
                                {donationCategories.map((cat, idx) => (
                                    <div key={cat.id} className="grid grid-cols-12 gap-2 items-end">
                                        <div className="col-span-7">
                                            <FormLabel>Kategori</FormLabel>
                                            <Select value={cat.category} onValueChange={(val) => {
                                                const newCats = [...donationCategories];
                                                newCats[idx].category = val;
                                                setDonationCategories(newCats);
                                            }}>
                                                <SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="Seç..." /></SelectTrigger>
                                                <SelectContent className="max-h-60">{brandCategoryOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                                            </Select>
                                        </div>
                                        <div className="col-span-4">
                                            <FormLabel>Oran (%)</FormLabel>
                                            <FormInput type="number" value={cat.rate} onChange={(e) => {
                                                const newCats = [...donationCategories];
                                                newCats[idx].rate = e.target.value;
                                                setDonationCategories(newCats);
                                            }} />
                                        </div>
                                        <div className="col-span-1 pb-2">
                                            <Button type="button" variant="ghost" size="icon" className="text-destructive" onClick={() => removeCategory(cat.id)}><Trash2 className="h-4 w-4" /></Button>
                                        </div>
                                    </div>
                                ))}
                                <Button type="button" variant="outline" className="w-full border-dashed border-primary/30" onClick={addCategory}>+ Kategori Ekle</Button>
                            </div>
                        </div>
                        <div className="space-y-6">
                            <SectionTitle icon={Code}>TEKNİK TAKİP (AFFILIATE)</SectionTitle>
                            <div className="space-y-4">
                                <div className="space-y-2"><FormLabel>AFFILIATE ID</FormLabel><FormInput placeholder="Mağaza ID" value={formData.affiliateId} onChange={e => setFormData({...formData, affiliateId: e.target.value})} /></div>
                                <div className="space-y-2"><FormLabel>TRACKING LINK</FormLabel><FormInput placeholder="https://..." value={formData.trackingLink} onChange={e => setFormData({...formData, trackingLink: e.target.value})} /></div>
                                <div className="space-y-2"><FormLabel>PIXEL SCRIPT</FormLabel><Textarea className="min-h-[100px] font-mono text-[10px]" placeholder="<script>...</script>" value={formData.pixelScript} onChange={e => setFormData({...formData, pixelScript: e.target.value})} /></div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 4. Adres Bilgileri */}
                <div className="space-y-6">
                    <SectionTitle icon={MapPin}>ADRES BİLGİLERİ</SectionTitle>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <FormLabel>İL / ŞEHİR</FormLabel>
                            {isTurkey ? (
                                <Select value={formData.city} onValueChange={v => setFormData({...formData, city: v, district: '', neighborhood: ''})}>
                                    <SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="Seçiniz..." /></SelectTrigger>
                                    <SelectContent className="max-h-60">{allProvinces.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                                </Select>
                            ) : <FormInput value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} placeholder="Şehir girin" />}
                        </div>
                        <div className="space-y-2">
                            <FormLabel>İLÇE / BÖLGE</FormLabel>
                            {isTurkey ? (
                                <Select value={formData.district} onValueChange={v => setFormData({...formData, district: v, neighborhood: ''})} disabled={!formData.city}>
                                    <SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="Seçiniz..." /></SelectTrigger>
                                    <SelectContent className="max-h-60">{formData.city && (districtsData[formData.city] || []).map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                                </Select>
                            ) : <FormInput value={formData.district} onChange={e => setFormData({...formData, district: e.target.value})} placeholder="Bölge girin" />}
                        </div>
                    </div>
                    {isTurkey && (
                        <div className="space-y-2">
                            <FormLabel>MAHALLE</FormLabel>
                            {formData.district && neighborhoodsData["İstanbul"]?.[formData.district] ? (
                                <Select value={formData.neighborhood} onValueChange={v => setFormData({...formData, neighborhood: v})}>
                                    <SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="Seçiniz..." /></SelectTrigger>
                                    <SelectContent className="max-h-60">{neighborhoodsData["İstanbul"][formData.district].map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                                </Select>
                            ) : <FormInput value={formData.neighborhood} onChange={e => setFormData({...formData, neighborhood: e.target.value})} placeholder="Mahalle girin" />}
                        </div>
                    )}
                    <div className="space-y-2"><FormLabel>AÇIK ADRES</FormLabel><FormInput placeholder="Cadde, kapı no..." value={formData.addressLine} onChange={e => setFormData({...formData, addressLine: e.target.value})} /></div>
                </div>

                {/* 5. İletişim */}
                <div className="space-y-6">
                    <SectionTitle icon={Mail}>İLETİŞİM VE SOSYAL MEDYA</SectionTitle>
                    <div className="space-y-4">
                        <IconInput icon={Mail} type="email" placeholder="kurumsal@eposta.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
                        <div className="flex gap-2">
                            <div className="w-[100px] shrink-0">
                                <Select value={formData.phoneCode} onValueChange={v => setFormData({...formData, phoneCode: v})}>
                                    <SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger>
                                    <SelectContent className="max-h-60">{uniquePhoneCodes.map((c, i) => <SelectItem key={`${c}-${i}`} value={c}>+{c}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <FormInput placeholder="5XXXXXXXXX" className="flex-1" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} required />
                        </div>
                        <IconInput icon={Globe} placeholder="https://www.kuruluş.org" value={formData.website} onChange={e => setFormData({...formData, website: e.target.value})} />
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <IconInput icon={Instagram} placeholder="Instagram" value={formData.social.instagram} onChange={e => setFormData({...formData, social: {...formData.social, instagram: e.target.value}})} />
                            <IconInput icon={XIcon} placeholder="X (Twitter)" value={formData.social.twitter} onChange={e => setFormData({...formData, social: {...formData.social, twitter: e.target.value}})} />
                            <IconInput icon={Linkedin} placeholder="LinkedIn" value={formData.social.linkedin} onChange={e => setFormData({...formData, social: {...formData.social, linkedin: e.target.value}})} />
                        </div>
                    </div>
                </div>

                {/* 6. Finansal & Yasal */}
                <div className="space-y-6">
                    <SectionTitle icon={Landmark}>YASAL & FİNANSAL</SectionTitle>
                    <div className="space-y-4">
                        <div className="space-y-2"><FormLabel>YASAL UNVAN</FormLabel><FormInput placeholder="Resmi Hesap Adı" value={formData.legalTitle} onChange={e => setFormData({...formData, legalTitle: e.target.value})} required /></div>
                        <div className="space-y-2"><FormLabel>IBAN NUMARASI</FormLabel><FormInput placeholder="TR..." value={formData.iban} onChange={e => setFormData({...formData, iban: e.target.value})} required /></div>
                    </div>
                </div>

                {/* 7. Belgeler */}
                <div className="space-y-6">
                    <SectionTitle icon={FileText}>BELGELER & LOGO</SectionTitle>
                    <div className="space-y-4">
                        <FileUpload label="LOGONUZ (PNG/JPG)" required />
                        {entityType === 'NGO' && <FileUpload label="FAALİYET BELGESİ" required />}
                        {entityType === 'NGO' && <FileUpload label="TÜZÜK / VAKIF SENEDİ" required />}
                    </div>
                </div>

                {/* 8. Yetkili */}
                <div className="space-y-6">
                    <SectionTitle icon={UserCircle}>YETKİLİ KİŞİ BİLGİLERİ</SectionTitle>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2"><FormLabel>AD SOYAD</FormLabel><FormInput placeholder="Yetkili ad soyad" value={formData.authorized.name} onChange={e => setFormData({...formData, authorized: {...formData.authorized, name: e.target.value}})} required /></div>
                        <div className="space-y-2"><FormLabel>GÖREVİ</FormLabel><FormInput placeholder="Kurumdaki görevi" value={formData.authorized.role} onChange={e => setFormData({...formData, authorized: {...formData.authorized, role: e.target.value}})} required /></div>
                    </div>
                </div>

                {/* 9. Onaylar */}
                <div className="space-y-4 pt-6">
                    <div className="flex items-start space-x-3 text-left">
                        <Checkbox id="terms-corp" required />
                        <Label htmlFor="terms-corp" className="text-[10px] font-medium leading-relaxed text-muted-foreground cursor-pointer">
                            <span className="text-primary font-bold">Kurumsal Katılım Sözleşmesi</span>'ni ve <span className="text-primary font-bold">Platform Etik İlkeleri</span>'ni okudum, kabul ediyorum.
                        </Label>
                    </div>
                    <div className="flex items-start space-x-3 text-left">
                        <Checkbox id="privacy-corp" required />
                        <Label htmlFor="privacy-corp" className="text-[10px] font-medium leading-relaxed text-muted-foreground cursor-pointer">
                            Kuruluş verilerimizin <span className="text-primary font-bold">Gizlilik Politikası</span> kapsamında işlenmesine ve platformda sergilenmesine onay veriyorum.
                        </Label>
                    </div>
                </div>

                <Button type="submit" className="w-full h-16 rounded-2xl text-lg font-black shadow-2xl bg-primary hover:bg-primary/90" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="animate-spin h-6 w-6" /> : "BAŞVURUYU TAMAMLA"}
                </Button>
            </div>
        </form>
    );
};

const FormRenderer = () => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const activeTab = searchParams.get('tab') || 'individual';
    const initialEntity = searchParams.get('entity') || 'NGO';

    if (process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === 'true') {
        useEffect(() => {
            router.replace(searchParams.get('redirect') || '/events');
        }, [router, searchParams]);
        return <div className="h-screen flex items-center justify-center bg-secondary"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
    }

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
                        <CardTitle className="text-3xl font-black tracking-tighter">İyiliğe İlk Adım</CardTitle>
                        <CardDescription>Toplumsal etki için aramıza katılın.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 px-8 pb-10 text-center">
                        <Tabs value={activeTab} onValueChange={(val) => router.push(`/login/selection?tab=${val}&entity=${initialEntity}`)}>
                            <TabsList className="grid w-full grid-cols-2 h-12 rounded-xl bg-muted/50 p-1">
                                <TabsTrigger value="individual" className="rounded-lg font-bold">Bireysel</TabsTrigger>
                                <TabsTrigger value="corporate" className="rounded-lg font-bold">Kurumsal</TabsTrigger>
                            </TabsList>
                            <TabsContent value="individual" className="pt-4">
                                <IndividualForm onComplete={() => router.push('/timeline')} />
                            </TabsContent>
                            <TabsContent value="corporate" className="pt-4">
                                <CorporateForm initialEntity={initialEntity} />
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
    <Suspense fallback={<div className="h-screen flex items-center justify-center bg-secondary"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>}>
      <FormRenderer />
    </Suspense>
  );
}
