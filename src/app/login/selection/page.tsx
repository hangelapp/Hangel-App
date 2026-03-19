
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
    Cookie,
    Target,
    Users,
    CheckCircle2,
    DollarSign,
    Activity
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
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
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

const GridCheckboxGroup = ({ options, selected, onToggle }: { options: string[], selected: string[], onToggle: (val: string) => void }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 rounded-2xl border p-4 bg-muted/5">
        {options.map(option => (
            <div key={option} className="flex items-center space-x-3 p-2 hover:bg-muted/30 rounded-lg transition-colors cursor-pointer" onClick={() => onToggle(option)}>
                <Checkbox id={option} checked={selected.includes(option)} onCheckedChange={() => onToggle(option)} />
                <Label htmlFor={option} className="text-xs font-medium cursor-pointer leading-tight">{option}</Label>
            </div>
        ))}
    </div>
);

// --- Form Logic Components ---

const IndividualForm = ({ isRegister = false, onComplete }: { isRegister?: boolean; onComplete: () => void }) => {
    const auth = useAuth();
    const db = useFirestore();
    const { toast } = useToast();
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Deduplicate and sort phone codes
    const uniquePhoneCodes = useMemo(() => Array.from(new Set(countryPhoneCodes)).sort((a, b) => parseInt(a) - parseInt(b)), []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        const email = `${phone.replace(/\D/g, '')}@hangel.org`;
        try {
            if (isRegister) {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const userId = userCredential.user.uid;
                
                const userRef = doc(db, 'users', userId);
                setDocumentNonBlocking(userRef, {
                    id: userId,
                    name: name,
                    username: `@${phone.replace(/\D/g, '')}`,
                    avatarUrl: '',
                    role: 'user',
                    personalInfo: {
                        email: email,
                        phone: phone,
                        birthDate: '',
                        gender: '',
                        nationality: '',
                        bloodType: '',
                        address: { country: 'Türkiye', city: '', district: '', neighborhood: '', street: '', doorNo: '', fullAddress: '' },
                        website: '',
                        social: { linkedin: '', github: '', instagram: '', twitter: '' }
                    },
                    volunteerInfo: { interests: [], skills: [], dailySkills: [], languages: [], programs: [], licenses: [], documents: [], education: [], travelInfo: { domesticObstacle: false, internationalObstacle: false, visas: [] }, emergency: { available: true, hasChronicIllness: false, usesRegularMedication: false, hasPhysicalLimitation: false, emergencyContacts: [] } },
                    impactScore: 0,
                    stats: { 
                        totalDonation: 0, 
                        donationCount: 0, 
                        volunteerHours: 0, 
                        completedProjects: 0, 
                        totalImpactValue: 0, 
                        highestSingleDonation: 0, 
                        supportedNgosCount: 0, 
                        avgDonation: 0, 
                        volunteerRank: { country: '-', city: '-', school: '-', interest: '-' }, 
                        mostActiveVolunteerArea: '-', 
                        avgVolunteerDuration: '-' 
                    }
                }, { merge: true });

                await updateProfile(userCredential.user, { displayName: name });
            } else {
                await signInWithEmailAndPassword(auth, email, password);
            }
            onComplete();
        } catch (error: any) {
            toast({ variant: "destructive", title: "İşlem Başarısız", description: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5 animate-in fade-in-0">
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
                        <Select defaultValue="90" required>
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
            <div className="space-y-2">
                <FormLabel>Şifre</FormLabel>
                <FormInput type="password" placeholder="••••••••" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            {!isRegister ? (
                <Button type="submit" className="w-full h-14 rounded-2xl text-base font-black shadow-xl" disabled={isLoading}>
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Giriş Yap"}
                </Button>
            ) : (
                <div className='space-y-4 pt-2'>
                    <div className="flex items-start space-x-3 text-left">
                        <Checkbox id="terms-reg" required />
                        <Label htmlFor="terms-reg" className="text-[10px] font-medium leading-relaxed text-muted-foreground cursor-pointer">
                            <Link href="/settings/contracts/kullanici-sozlesmesi" className="text-primary font-bold hover:underline">Kullanıcı Sözleşmesi</Link>'ni ve <Link href="/settings/contracts/gizlilik-politikasi" className="text-primary font-bold hover:underline">Gizlilik Politikası</Link>'nı okudum, onaylıyorum.
                        </Label>
                    </div>
                    <Button type="submit" className="w-full h-14 rounded-2xl text-base font-black shadow-xl" disabled={isLoading}>
                        {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Kayıt Ol"}
                    </Button>
                </div>
            )}
        </form>
    );
};

const CorporateForm = ({ initialEntity }: { initialEntity: string }) => {
    const db = useFirestore();
    const router = useRouter();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [entityType, setEntityType] = useState<string>(initialEntity);
    
    // Form State
    const [formData, setFormData] = useState({
        country: 'Türkiye',
        fullName: '',
        shortName: '',
        foundationYear: '',
        ngoType: 'Dernek',
        usagePurpose: 'both',
        beneficiaries: [] as string[],
        sdgs: [] as string[],
        memberships: [] as string[],
        enterpriseStatus: 'yok',
        marketCategory: 'Seçiniz...',
        donationRate: '5',
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
        authorized: { name: '', role: '', email: '', phone: '', phoneCode: '90' }
    });

    const [donationCategories, setDonationCategories] = useState([{ category: '', rate: '5' }]);

    const addCategory = () => setDonationCategories([...donationCategories, { category: '', rate: '5' }]);
    const removeCategory = (index: number) => setDonationCategories(donationCategories.filter((_, i) => i !== index));

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const appRef = collection(db, 'applications');
            await addDocumentNonBlocking(appRef, {
                ...formData,
                donationCategories,
                entityType: entityType,
                type: entityType === 'NGO' ? 'STK' : entityType === 'BRAND' ? 'Marka' : 'Kulüp',
                date: new Date().toISOString().split('T')[0],
                status: 'Beklemede',
                org: formData.fullName || formData.shortName
            });
            toast({ title: "Başvuru Alındı", description: "Kurumsal ekibimiz en kısa sürede sizinle iletişime geçecektir." });
            router.push('/login');
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Hata', description: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleMultiSelect = (field: 'beneficiaries' | 'sdgs' | 'memberships', value: string) => {
        setFormData(prev => {
            const current = [...prev[field]];
            const next = current.includes(value) ? current.filter(v => v !== value) : [...current, value];
            return { ...prev, [field]: next };
        });
    };

    const uniquePhoneCodes = useMemo(() => Array.from(new Set(countryPhoneCodes)).sort((a, b) => parseInt(a) - parseInt(b)), []);

    return (
        <form onSubmit={handleFormSubmit} className="space-y-8 animate-in fade-in-0 pb-10">
            {/* Common Fields */}
            <div className="space-y-6">
                <div className="space-y-2">
                    <FormLabel>Ülke</FormLabel>
                    <Select value={formData.country} onValueChange={(val) => setFormData({...formData, country: val, city: '', district: ''})}>
                        <SelectTrigger className="h-12 rounded-xl bg-muted/20 border-none shadow-sm font-bold text-left"><SelectValue /></SelectTrigger>
                        <SelectContent className="max-h-60">
                            {allCountries.map((c, idx) => <SelectItem key={`${c}-${idx}`} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                
                <div className="space-y-2">
                    <FormLabel>Kuruluş Türü</FormLabel>
                    <Select value={entityType} onValueChange={(val) => setEntityType(val)}>
                        <SelectTrigger className="h-12 rounded-xl bg-muted/20 border-none shadow-sm font-bold text-left">
                            <SelectValue />
                        </SelectTrigger>
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
                <div className="space-y-10 animate-in slide-in-from-top-4 duration-500">
                    <div className="space-y-6">
                        <SectionTitle icon={Building2}>Kurumsal Kimlik</SectionTitle>
                        <div className="space-y-2">
                            <FormLabel>Kuruluş Türü</FormLabel>
                            <Select value={formData.ngoType} onValueChange={(v) => setFormData({...formData, ngoType: v})}>
                                <SelectTrigger className="h-12 rounded-xl bg-muted/20 border-none"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Dernek">Dernek</SelectItem>
                                    <SelectItem value="Vakıf">Vakıf</SelectItem>
                                    <SelectItem value="Spor Kulübü">Spor Kulübü</SelectItem>
                                    <SelectItem value="Özel İzinli">Özel İzinli Kuruluş</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <FormLabel>Kuruluş Tam Adı</FormLabel>
                            <FormInput placeholder="Tüzükte yer alan tam ad" value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} required />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <FormLabel>Kuruluş Kısa Adı</FormLabel>
                                <FormInput placeholder="Örn: TEMA, AHBAP" value={formData.shortName} onChange={(e) => setFormData({...formData, shortName: e.target.value})} required />
                            </div>
                            <div className="space-y-2">
                                <FormLabel>Kuruluş Yılı</FormLabel>
                                <Select value={formData.foundationYear} onValueChange={(v) => setFormData({...formData, foundationYear: v})}>
                                    <SelectTrigger className="h-12 rounded-xl bg-muted/20 border-none"><SelectValue placeholder="Seçiniz..." /></SelectTrigger>
                                    <SelectContent className="max-h-60">{years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <SectionTitle icon={Target}>Etki Alanları</SectionTitle>
                        <div className="space-y-4">
                            <FormLabel>Faydalanıcı Gruplar</FormLabel>
                            <GridCheckboxGroup options={allBeneficiaries} selected={formData.beneficiaries} onToggle={(v) => toggleMultiSelect('beneficiaries', v)} />
                        </div>
                        <div className="space-y-4 pt-4">
                            <FormLabel>Sürdürülebilir Kalkınma Hedefleri (SKA)</FormLabel>
                            <GridCheckboxGroup options={allSdgs} selected={formData.sdgs} onToggle={(v) => toggleMultiSelect('sdgs', v)} />
                        </div>
                    </div>

                    <div className="space-y-6">
                        <SectionTitle icon={Users}>Kurumsal Network</SectionTitle>
                        <GridCheckboxGroup options={allMemberships} selected={formData.memberships} onToggle={(v) => toggleMultiSelect('memberships', v)} />
                    </div>

                    <div className="space-y-6">
                        <SectionTitle icon={MapPin}>Adres Bilgileri</SectionTitle>
                        {formData.country === 'Türkiye' ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <FormLabel>İl</FormLabel>
                                    <Select value={formData.city} onValueChange={(v) => setFormData({...formData, city: v, district: '', neighborhood: ''})}>
                                        <SelectTrigger className="h-12 rounded-xl bg-muted/20 border-none"><SelectValue placeholder="İl Seçiniz..." /></SelectTrigger>
                                        <SelectContent className="max-h-60">{allProvinces.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <FormLabel>İlçe</FormLabel>
                                    <Select value={formData.district} onValueChange={(v) => setFormData({...formData, district: v, neighborhood: ''})} disabled={!formData.city}>
                                        <SelectTrigger className="h-12 rounded-xl bg-muted/20 border-none"><SelectValue placeholder="İlçe Seçiniz..." /></SelectTrigger>
                                        <SelectContent className="max-h-60">{formData.city && (districtsData[formData.city] || []).map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2"><FormLabel>Şehir</FormLabel><FormInput value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} /></div>
                                <div className="space-y-2"><FormLabel>Bölge</FormLabel><FormInput value={formData.district} onChange={(e) => setFormData({...formData, district: e.target.value})} /></div>
                            </div>
                        )}
                        <FormInput placeholder="Açık Adres" value={formData.addressLine} onChange={(e) => setFormData({...formData, addressLine: e.target.value})} />
                    </div>

                    <div className="space-y-6">
                        <SectionTitle icon={Globe}>İletişim ve Sosyal Medya</SectionTitle>
                        <div className="space-y-4">
                            <IconInput icon={Mail} type="email" placeholder="kurumsal@kurum.org" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
                            <div className="flex gap-2">
                                <div className="w-[100px] shrink-0">
                                    <Select value={formData.phoneCode} onValueChange={(val) => setFormData({...formData, phoneCode: val})}>
                                        <SelectTrigger className="h-12 rounded-xl bg-muted/20 border-none"><SelectValue /></SelectTrigger>
                                        <SelectContent className="max-h-60">{uniquePhoneCodes.map((c, idx) => <SelectItem key={`${c}-${idx}`} value={c}>+{c}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                <FormInput placeholder="5XXXXXXXXX" className="flex-1" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
                            </div>
                            <IconInput icon={Globe} placeholder="https://www.kurum.org" value={formData.website} onChange={(e) => setFormData({...formData, website: e.target.value})} />
                            <IconInput icon={Instagram} placeholder="instagram.com/kurumadi" value={formData.social.instagram} onChange={(e) => setFormData({...formData, social: {...formData.social, instagram: e.target.value}})} />
                            <IconInput icon={XIcon} placeholder="x.com/kurumadi" value={formData.social.twitter} onChange={(e) => setFormData({...formData, social: {...formData.social, twitter: e.target.value}})} />
                            <IconInput icon={Linkedin} placeholder="linkedin.com/company/kurumadi" value={formData.social.linkedin} onChange={(e) => setFormData({...formData, social: {...formData.social, linkedin: e.target.value}})} />
                        </div>
                    </div>

                    <div className="space-y-6">
                        <SectionTitle icon={ShieldCheck}>Yasal Belgeler</SectionTitle>
                        <FileUpload label="Kuruluş Logosu" accept=".png,.jpg" hint="En az 512x512px, şeffaf PNG önerilir." required />
                        <FileUpload label="Faaliyet Belgesi" accept=".pdf,.png" hint="Son 6 aya ait resmi faaliyet belgesi." required />
                        <FileUpload label="Tüzük veya Vakıf Senedi" accept=".pdf" hint="Kuruluşun güncel tüzüğü/senedi." required />
                    </div>

                    <div className="space-y-6">
                        <SectionTitle icon={UserCircle}>Yetkili Kişi Bilgileri</SectionTitle>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormInput placeholder="Ad Soyad" value={formData.authorized.name} onChange={(e) => setFormData({...formData, authorized: {...formData.authorized, name: e.target.value}})} />
                            <FormInput placeholder="Görevi" value={formData.authorized.role} onChange={(e) => setFormData({...formData, authorized: {...formData.authorized, role: e.target.value}})} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <FormInput type="email" placeholder="yetkili@kurum.org" value={formData.authorized.email} onChange={(e) => setFormData({...formData, authorized: {...formData.authorized, email: e.target.value}})} />
                            <div className="flex gap-2">
                                <div className="w-[80px] shrink-0">
                                    <Select value={formData.authorized.phoneCode} onValueChange={(val) => setFormData({...formData, authorized: {...formData.authorized, phoneCode: val}})}>
                                        <SelectTrigger className="h-12 rounded-xl bg-muted/20 border-none"><SelectValue /></SelectTrigger>
                                        <SelectContent className="max-h-60">{uniquePhoneCodes.map((c, idx) => <SelectItem key={`${c}-${idx}`} value={c}>+{c}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                                <FormInput placeholder="5XXXXXXXXX" className="flex-1" value={formData.authorized.phone} onChange={(e) => setFormData({...formData, authorized: {...formData.authorized, phone: e.target.value}})} />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 pt-6">
                        <div className="flex items-start space-x-3 text-left">
                            <Checkbox id="terms-ngo" required />
                            <Label htmlFor="terms-ngo" className="text-[10px] font-medium leading-relaxed text-muted-foreground cursor-pointer">
                                <span className="text-primary font-bold">STK Katılım Sözleşmesi</span>'ni ve <span className="text-primary font-bold">Şeffaflık İlkelerini</span> okudum, kabul ediyorum.
                            </Label>
                        </div>
                        <div className="flex items-start space-x-3 text-left">
                            <Checkbox id="privacy-ngo" required />
                            <Label htmlFor="privacy-ngo" className="text-[10px] font-medium leading-relaxed text-muted-foreground cursor-pointer">
                                <span className="text-primary font-bold">Gizlilik Politikası</span> kapsamında verilerimin işlenmesine onay veriyorum.
                            </Label>
                        </div>
                    </div>

                    <Button type="submit" className="w-full h-16 rounded-2xl text-lg font-black shadow-2xl bg-primary hover:bg-primary/90" disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="animate-spin h-6 w-6" /> : "BAŞVURUYU GÖNDER"}
                    </Button>
                </div>
            )}

            {entityType === 'BRAND' && (
                <div className="space-y-10 animate-in slide-in-from-top-4 duration-500">
                    <SectionTitle icon={Store}>Marka Kimliği</SectionTitle>
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <FormLabel>Marka Adı</FormLabel>
                            <FormInput placeholder="Markanızın adı" value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} required />
                        </div>
                        <div className="space-y-2">
                            <FormLabel>Sektör</FormLabel>
                            <Select value={formData.marketCategory} onValueChange={(v) => setFormData({...formData, marketCategory: v})}>
                                <SelectTrigger className="h-12 rounded-xl bg-muted/20 border-none"><SelectValue /></SelectTrigger>
                                <SelectContent className="max-h-60">
                                    {marketCategories.filter(c => c.mainCategory !== 'Tümü').map(cat => <SelectItem key={cat.mainCategory} value={cat.mainCategory}>{cat.mainCategory}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <SectionTitle icon={Percent}>Kategori Bazlı Bağış Oranları</SectionTitle>
                        <div className="space-y-3">
                            {donationCategories.map((cat, idx) => (
                                <div key={idx} className="flex gap-2">
                                    <FormInput placeholder="Kategori" value={cat.category} onChange={(e) => {
                                        const newCats = [...donationCategories];
                                        newCats[idx].category = e.target.value;
                                        setDonationCategories(newCats);
                                    }} />
                                    <div className="w-24 relative">
                                        <FormInput type="number" value={cat.rate} onChange={(e) => {
                                            const newCats = [...donationCategories];
                                            newCats[idx].rate = e.target.value;
                                            setDonationCategories(newCats);
                                        }} />
                                        <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                    </div>
                                    {donationCategories.length > 1 && <Button type="button" variant="ghost" size="icon" onClick={() => removeCategory(idx)}><Trash2 className="h-4 w-4 text-destructive" /></Button>}
                                </div>
                            ))}
                        </div>
                        <Button type="button" variant="outline" className="w-full border-dashed" onClick={addCategory}>+ Kategori Ekle</Button>
                    </div>

                    <div className="space-y-6">
                        <SectionTitle icon={Code}>Teknik Takip</SectionTitle>
                        <div className="space-y-4">
                            <FormInput placeholder="Affiliate ID" value={formData.affiliateId} onChange={(e) => setFormData({...formData, affiliateId: e.target.value})} />
                            <FormInput placeholder="Tracking Link" value={formData.trackingLink} onChange={(e) => setFormData({...formData, trackingLink: e.target.value})} />
                            <Textarea placeholder="Pixel Script" value={formData.pixelScript} onChange={(e) => setFormData({...formData, pixelScript: e.target.value})} />
                        </div>
                    </div>

                    <div className="space-y-6">
                        <SectionTitle icon={UserCircle}>Yetkili Bilgileri</SectionTitle>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormInput placeholder="Ad Soyad" value={formData.authorized.name} onChange={(e) => setFormData({...formData, authorized: {...formData.authorized, name: e.target.value}})} />
                            <FormInput placeholder="Görevi" value={formData.authorized.role} onChange={(e) => setFormData({...formData, authorized: {...formData.authorized, role: e.target.value}})} />
                        </div>
                    </div>

                    <div className="space-y-4 pt-6">
                        <div className="flex items-start space-x-3 text-left">
                            <Checkbox id="terms-brand" required />
                            <Label htmlFor="terms-brand" className="text-[10px] font-medium leading-relaxed text-muted-foreground cursor-pointer">
                                <span className="text-primary font-bold">Marka Sözleşmesi</span>'ni ve <span className="text-primary font-bold">Sosyal Etki Politikası</span>'nı kabul ediyorum.
                            </Label>
                        </div>
                    </div>

                    <Button type="submit" className="w-full h-16 rounded-2xl text-lg font-black shadow-2xl bg-primary hover:bg-primary/90" disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="animate-spin h-6 w-6" /> : "KAYDI TAMAMLA"}
                    </Button>
                </div>
            )}

            {entityType === 'CLUB' && (
                <div className="space-y-10 animate-in slide-in-from-top-4 duration-500">
                    <SectionTitle icon={School}>Kulüp Bilgileri</SectionTitle>
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <FormLabel>Üniversite / Lise</FormLabel>
                            <Select value={formData.shortName} onValueChange={(v) => setFormData({...formData, shortName: v})}>
                                <SelectTrigger className="h-12 rounded-xl bg-muted/20 border-none"><SelectValue placeholder="Seçiniz..." /></SelectTrigger>
                                <SelectContent className="max-h-60">{allUniversities.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <FormLabel>Kulüp Tam Adı</FormLabel>
                            <FormInput placeholder="Örn: İTÜ Girişimcilik Kulübü" value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} required />
                        </div>
                        <FileUpload label="Okul Onay Belgesi" accept=".pdf" required />
                    </div>

                    <div className="space-y-6">
                        <SectionTitle icon={UserCircle}>Yetkili Bilgileri</SectionTitle>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormInput placeholder="Yetkili Ad Soyad" value={formData.authorized.name} onChange={(e) => setFormData({...formData, authorized: {...formData.authorized, name: e.target.value}})} />
                            <FormInput placeholder="Email" value={formData.authorized.email} onChange={(e) => setFormData({...formData, authorized: {...formData.authorized, email: e.target.value}})} />
                        </div>
                    </div>

                    <div className="space-y-4 pt-6">
                        <div className="flex items-start space-x-3 text-left">
                            <Checkbox id="terms-club" required />
                            <Label htmlFor="terms-club" className="text-[10px] font-medium leading-relaxed text-muted-foreground cursor-pointer">
                                <span className="text-primary font-bold">Kulüp Katılım Beyanı</span>'nı ve <span className="text-primary font-bold">Kampüs Kuralları</span>'nı kabul ediyorum.
                            </Label>
                        </div>
                    </div>

                    <Button type="submit" className="w-full h-16 rounded-2xl text-lg font-black shadow-2xl bg-primary hover:bg-primary/90" disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="animate-spin h-6 w-6" /> : "KULÜBÜ KAYDET"}
                    </Button>
                </div>
            )}
        </form>
    );
};

const PostRegistrationSurvey = ({ open, onOpenChange, onComplete }: { open: boolean, onOpenChange: (open: boolean) => void, onComplete: () => void }) => {
    const [step, setStep] = useState(1);
    const [friendPhone, setFriendPhone] = useState('');
    const { toast } = useToast();
    const surveyOptions = ["Sosyal Medya", "Arkadaş Tavsiyesi", "Haberler", "Reklam", "Okul", "Diğer"];

    const handleInviteFriend = () => {
        if (friendPhone.trim()) {
            toast({ title: "Davet İletildi!", description: "Arkadaşına iyilik zinciri bildirimi gönderdik." });
        }
        setStep(3);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md rounded-[2.5rem]">
                <DialogHeader>
                    <DialogTitle className="text-center text-2xl font-bold flex items-center justify-center gap-2">
                        <Sparkles className="h-6 w-6 text-primary" />
                        {step === 1 ? "Kısa Bir Anket" : step === 2 ? "İyiliği Paylaş" : "Hoş Geldin"}
                    </DialogTitle>
                </DialogHeader>
                <div className="py-4 text-center">
                    {step === 1 && (
                        <div className="space-y-6">
                            <Label className="block font-semibold text-lg">hangel'i nereden duydunuz?</Label>
                            <div className="grid grid-cols-2 gap-3">
                                {surveyOptions.map(option => (
                                    <Button key={option} variant="outline" className="rounded-2xl h-14 font-bold" onClick={() => setStep(option === "Arkadaş Tavsiyesi" ? 2 : 3)}>
                                        {option}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    )}
                    {step === 2 && (
                         <div className="space-y-6">
                            <div className="text-center space-y-2">
                                <Label className="block font-semibold text-lg">Hangi arkadaşın tavsiye etti?</Label>
                                <p className="text-muted-foreground text-sm">Numarasını girerek ona puan kazandırabilirsin.</p>
                            </div>
                             <div className="space-y-2 text-left">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Arkadaşının Numarası</Label>
                                <div className="flex gap-2">
                                    <div className="w-[80px] shrink-0">
                                        <Select defaultValue="90"><SelectTrigger className="h-12 rounded-xl bg-muted/20 border-none shadow-sm"><SelectValue /></SelectTrigger><SelectContent className="max-h-60">{countryPhoneCodes.map((c, idx) => <SelectItem key={`${c}-${idx}`} value={c}>+{c}</SelectItem>)}</SelectContent></Select>
                                    </div>
                                    <Input type="tel" placeholder="5XX..." value={friendPhone} onChange={(e) => setFriendPhone(e.target.value)} className="h-12 rounded-xl flex-1 font-bold" />
                                </div>
                            </div>
                            <Button onClick={handleInviteFriend} className="w-full h-12 rounded-2xl font-bold">Onayla ve Devam Et</Button>
                        </div>
                    )}
                    {step === 3 && (
                         <div className="space-y-6">
                            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
                            <Label className="block font-semibold text-lg">Kayıt Başarılı!</Label>
                            <p className="text-muted-foreground text-sm">Şimdi bağışçısı ve gönüllüsü olacağın STK'ları seçerek devam edelim.</p>
                            <Button onClick={onComplete} className="w-full h-12 rounded-2xl font-bold">Hadi Başlayalım</Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

const FormRenderer = () => {
    const searchParams = useSearchParams();
    const router = useRouter();
    
    const action = searchParams.get('action') || 'login';
    const type = searchParams.get('type') || 'individual';
    const initialEntity = searchParams.get('entity') || 'NGO'; 
    const redirectParam = searchParams.get('redirect');
    
    const [showSurvey, setShowSurvey] = useState(false);

    const handleActionChange = (value: string) => {
        const typePart = type !== 'individual' ? `&type=${type}` : '';
        const entityPart = initialEntity ? `&entity=${initialEntity}` : '';
        const redirectPart = redirectParam ? `&redirect=${encodeURIComponent(redirectParam)}` : '';
        router.push(`/login/selection?action=${value}${typePart}${entityPart}${redirectPart}`);
    };

    const handleTypeChange = (value: string) => {
        const redirectPart = redirectParam ? `&redirect=${encodeURIComponent(redirectPart)}` : '';
        if (value === 'individual') {
            router.push(`/login/selection?action=${action}${redirectPart}`);
        } else {
            router.push(`/login/selection?action=${action}&type=corporate&entity=${initialEntity}${redirectPart}`);
        }
    };

    const handleRegistrationComplete = () => setShowSurvey(true);

    const handleLoginComplete = () => {
        if (redirectParam) {
            router.push(redirectParam);
        } else {
            router.push('/timeline');
        }
    };

    const handleSurveyComplete = () => {
        setShowSurvey(false);
        localStorage.setItem('onboardingStep', 'ngo-selection');
        router.push('/settings/ngo-selection');
    };

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
                            {action === 'register' ? 'İyiliğe İlk Adım' : 'Tekrar Hoş Geldin'}
                        </CardTitle>
                        <CardDescription>Toplumsal etki için aramıza katılın.</CardDescription>
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
                                    <FormLabel>Hesap Tipi</FormLabel>
                                    <Select onValueChange={handleTypeChange} value={type} required>
                                        <SelectTrigger className="h-12 rounded-xl font-bold border-none shadow-sm bg-muted/20 text-left">
                                            <SelectValue placeholder="Seçiniz..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="individual">Bireysel Kullanıcı</SelectItem>
                                            <SelectItem value="corporate">Kurumsal (STK, Marka, Kulüp)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {type === 'individual' ? (
                                    <IndividualForm isRegister={true} onComplete={handleRegistrationComplete} />
                                ) : (
                                    <CorporateForm initialEntity={initialEntity} />
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
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
