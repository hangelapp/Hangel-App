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
    Landmark,
    Building2,
    CheckCircle,
    FileText,
    ShieldAlert,
    Sparkles,
    Briefcase,
    Store,
    Globe,
    UserCircle,
    Phone,
    Info,
    MapPin
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { marketCategories, countryPhoneCodes, allProvinces, districtsData, neighborhoodsData } from '@/lib/data';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth, useFirestore, setDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, collection } from 'firebase/firestore';
import { HangelLogo } from '@/components/icons';
import { Badge } from '@/components/ui/badge';

// --- Form Constants ---

const allBeneficiaries = [
    'Çocuklar', 'Hak mücadelesi verenler', 'Afetzedeler', 'Hayvanlar', 'Yaşlılar', 
    'Engelliler', 'Öğrenciler', 'Mülteciler', 'Gençler', 'Çevre', 'Aile', 
    'Bölgesel', 'İş Dünyası', 'Girişimciler'
];

const allSdgs = [
    '1. Yoksulluğa Son', '2. Açlığa Son', '3. Sağlıklı ve Kaliteli Yaşam', 
    '4. Nitelikli Eğitim', '5. Toplumsal Cinsiyet Eşitliği', '6. Temiz Su ve Sanitasyon', 
    '7. Erişilebilir ve Temiz Enerji', '8. İnsana Yakışır İş ve Ekonomik Büyüme',
    '9. Sanayi, Yenilikçilik ve Altyapı', '10. Eşitsizliklerin Azaltılması', 
    '11. Sürdürülebilir Şehirler ve Topluluklar', '12. Sorumlu Üretim ve Tüketim', 
    '13. İklim Eylemi', '14. Sudaki Yaşam', '15. Karasal Yaşam',
    '16. Barış, Adalet ve Güçlü Kurumlar', '17. Amaçlar için Ortaklıklar'
];

const allMemberships = ['Afet Platformu', 'Açık Açık', 'Tüsev', 'Adım Adım', 'Ability Pool', 'HelpSteps', 'Candid'];

const years = Array.from({ length: 126 }, (_, i) => (2025 - i).toString());

// --- Shared Form Components ---

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

const MultiCheckboxGroup = ({ title, options, selected, onChange }: { title: string, options: string[], selected: string[], onChange: (val: string[]) => void }) => (
    <div className="space-y-3">
        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{title}</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 rounded-2xl border p-4 bg-muted/10 max-h-60 overflow-y-auto no-scrollbar">
            {options.map(option => (
                <div key={option} className="flex items-center space-x-2">
                    <Checkbox 
                        id={`${title}-${option}`} 
                        checked={selected.includes(option)}
                        onCheckedChange={(checked) => {
                            if (checked) onChange([...selected, option]);
                            else onChange(selected.filter(s => s !== option));
                        }}
                    />
                    <Label htmlFor={`${title}-${option}`} className="text-xs font-medium cursor-pointer leading-tight">{option}</Label>
                </div>
            ))}
        </div>
    </div>
);

// --- Main Page Component ---

const FormRenderer = () => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { toast } = useToast();
    
    const action = searchParams.get('action') || 'login';
    const type = searchParams.get('type') || 'individual';
    const entity = searchParams.get('entity') || 'NGO'; // NGO or BRAND
    const redirectParam = searchParams.get('redirect');
    
    const [showSurvey, setShowSurvey] = useState(false);

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
            router.push(`/login/selection?action=${action}&type=corporate&entity=${entity}${redirectPart}`);
        }
    };

    const handleRegistrationComplete = () => {
        setShowSurvey(true);
    };

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

    // --- Bireysel Kayıt Formu (Sıfır Bilgi Mantığı) ---
    const IndividualForm = ({ isRegister = false, onComplete }: { isRegister?: boolean; onComplete: () => void }) => {
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
                    
                    // SIFIR BİLGİ İLE BAŞLAT
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
                            social: { linkedin: '', github: '', behance: '', instagram: '', twitter: '' }
                        },
                        volunteerInfo: { interests: [], skills: [], dailySkills: [], languages: [], programs: [], licenses: [], documents: [], education: [], travelInfo: { domesticObstacle: false, internationalObstacle: false, visas: [] }, emergency: { available: true, hasChronicIllness: false, usesRegularMedication: false, hasPhysicalLimitation: false, emergencyContacts: [] } },
                        impactScore: 0,
                        stats: { totalDonation: 0, donationCount: 0, volunteerHours: 0, completedProjects: 0, totalImpactValue: 0, highestSingleDonation: 0, supportedNgosCount: 0, avgDonation: 0, volunteerRank: { country: '-', city: '-', school: '-', interest: '-' }, mostActiveVolunteerArea: '-', avgVolunteerDuration: '-' }
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
                        <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Ad Soyad</Label>
                        <Input id="name" placeholder="Ör.: İsmail Hilmi ADIGÜZEL" required value={name} onChange={e => setName(e.target.value)} className="h-12 rounded-xl" />
                    </div>
                )}
                <div className="space-y-2">
                    <Label htmlFor="phone" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Telefon</Label>
                    <div className="flex gap-2">
                        <div className="w-[100px] shrink-0">
                            <Select defaultValue="90" required>
                                <SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger>
                                <SelectContent>{countryPhoneCodes.map(code => <SelectItem key={code} value={code}>+{code}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <Input id="phone" type="tel" placeholder="5XXXXXXXXX" required value={phone} onChange={e => setPhone(e.target.value)} className="h-12 rounded-xl flex-1 font-bold" />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="password" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Şifre</Label>
                    <Input id="password" type="password" placeholder="••••••••" required value={password} onChange={e => setPassword(e.target.value)} className="h-12 rounded-xl" />
                </div>
                {!isRegister ? (
                    <Button type="submit" className="w-full h-14 rounded-2xl text-base font-black shadow-xl" disabled={isLoading}>
                        {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Giriş Yap"}
                    </Button>
                ) : (
                    <div className='space-y-4 pt-2'>
                        <div className="flex items-start space-x-3">
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

    // --- Kurumsal Kayıt Formu (STK / Marka / Kulüp) ---
    const CorporateForm = () => {
        const db = useFirestore();
        const [isSubmitting, setIsSubmitting] = useState(false);
        const [aboutText, setAboutText] = useState('');
        const ABOUT_LIMIT = 1000;

        const [formData, setFormData] = useState({
            country: 'Almanya',
            ngoType: '',
            fullName: '',
            shortName: 'hangel Derneği',
            foundationYear: '',
            enterpriseStatus: '',
            purpose: 'Bağış ve Gönüllülük ilanı vermek',
            beneficiaries: [] as string[],
            sdgs: [] as string[],
            memberships: [] as string[],
            cityState: '',
            districtRegion: '',
            addressLine: '',
            email: '',
            phone: '',
            website: '',
            social: { instagram: '', twitter: '', linkedin: '' },
            legalTitle: '',
            accountName: '',
            iban: 'TR',
            authorized: { name: '', role: '', email: '', phone: '' }
        });

        const handleFormSubmit = async (e: React.FormEvent) => {
            e.preventDefault();
            setIsSubmitting(true);
            try {
                const appRef = collection(db, 'applications');
                await addDocumentNonBlocking(appRef, {
                    ...formData,
                    about: aboutText,
                    type: entity === 'NGO' ? 'STK' : entity === 'BRAND' ? 'Marka' : 'Kulüp',
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

        return (
            <form onSubmit={handleFormSubmit} className="space-y-10 animate-in fade-in-0 pb-10">
                
                {/* 1. Kategori & Konum */}
                <div className="space-y-6">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Ülke</Label>
                        <Select value={formData.country} onValueChange={(val) => setFormData({...formData, country: val})}>
                            <SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {["Almanya", "Türkiye", "ABD", "İngiltere", "Fransa", "Hollanda"].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Kuruluş Türü</Label>
                        <Select value={formData.ngoType} onValueChange={(val) => setFormData({...formData, ngoType: val})} required>
                            <SelectTrigger className="h-12 rounded-xl font-bold"><SelectValue placeholder="Seçiniz..." /></SelectTrigger>
                            <SelectContent>
                                {entity === 'NGO' ? (
                                    <>
                                        <SelectItem value="Dernek">Dernek</SelectItem>
                                        <SelectItem value="Vakıf">Vakıf</SelectItem>
                                        <SelectItem value="Spor Kulübü">Spor Kulübü</SelectItem>
                                        <SelectItem value="Özel İzinli">Özel İzinli</SelectItem>
                                    </>
                                ) : (
                                    <>
                                        <SelectItem value="Global Marka">Global Marka</SelectItem>
                                        <SelectItem value="Yerel İşletme">Yerel İşletme</SelectItem>
                                        <SelectItem value="Kooperatif">Kooperatif</SelectItem>
                                        <SelectItem value="Sosyal Şirket">Sosyal Şirket</SelectItem>
                                    </>
                                )}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <Separator className="border-dashed" />

                {/* 2. Kuruluş Bilgileri */}
                <div className="space-y-6">
                    <div className="space-y-1">
                        <h3 className="font-bold text-lg flex items-center gap-2"><Info className="h-5 w-5 text-primary"/> Kuruluş Bilgileri</h3>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Kuruluş Adı</Label>
                        <Input placeholder="Kuruluşunuzun tam adı" required value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className="h-12 rounded-xl" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Kuruluş Kısa Adı</Label>
                            <Input placeholder="hangel Derneği" value={formData.shortName} onChange={e => setFormData({...formData, shortName: e.target.value})} className="h-12 rounded-xl" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Kuruluş Yılı</Label>
                            <Select onValueChange={(val) => setFormData({...formData, foundationYear: val})}>
                                <SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="Seç" /></SelectTrigger>
                                <SelectContent className="max-h-60">
                                    {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">İktisadi İşletme Durumu</Label>
                            <Select onValueChange={(val) => setFormData({...formData, enterpriseStatus: val})}>
                                <SelectTrigger className="h-12 rounded-xl"><SelectValue placeholder="Seçiniz..." /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Var">Var</SelectItem>
                                    <SelectItem value="Yok">Yok</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Kullanım Amacı</Label>
                            <Input value={formData.purpose} readOnly className="h-12 rounded-xl bg-muted/50 cursor-not-allowed" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between items-end mb-1">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Hakkında</Label>
                            <span className="text-[10px] font-bold text-muted-foreground">{aboutText.length} / {ABOUT_LIMIT} (Kalan: {ABOUT_LIMIT - aboutText.length})</span>
                        </div>
                        <Textarea 
                            placeholder="Kuruluşunuzu anlatan kısa bir metin." 
                            rows={5} 
                            maxLength={ABOUT_LIMIT} 
                            value={aboutText}
                            onChange={(e) => setAboutText(e.target.value)}
                            className="rounded-2xl p-4 leading-relaxed"
                            required
                        />
                    </div>
                </div>

                <div className="space-y-8">
                    <MultiCheckboxGroup title="Faydalanıcılar" options={allBeneficiaries} selected={formData.beneficiaries} onChange={(val) => setFormData({...formData, beneficiaries: val})} />
                    <MultiCheckboxGroup title="Sürdürülebilir Kalkınma Hedefleri" options={allSdgs} selected={formData.sdgs} onChange={(val) => setFormData({...formData, sdgs: val})} />
                    <MultiCheckboxGroup title="Üye Olunan Platformlar" options={allMemberships} selected={formData.memberships} onChange={(val) => setFormData({...formData, memberships: val})} />
                </div>

                <Separator className="border-dashed" />

                {/* 3. Adres Bilgileri */}
                <div className="space-y-6">
                    <div className="space-y-1">
                        <h3 className="font-bold text-lg flex items-center gap-2"><MapPin className="h-5 w-5 text-primary"/> Adres Bilgileri</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">İl / Eyalet</Label>
                            <Input placeholder="Şehir / Eyalet girin" required value={formData.cityState} onChange={e => setFormData({...formData, cityState: e.target.value})} className="h-12 rounded-xl" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">İlçe / Bölge</Label>
                            <Input placeholder="İlçe / Bölge girin" required value={formData.districtRegion} onChange={e => setFormData({...formData, districtRegion: e.target.value})} className="h-12 rounded-xl" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Açık Adres</Label>
                        <Input placeholder="Sokak, kapı no..." required value={formData.addressLine} onChange={e => setFormData({...formData, addressLine: e.target.value})} className="h-12 rounded-xl" />
                    </div>
                </div>

                <Separator className="border-dashed" />

                {/* 4. İletişim & Sosyal Medya */}
                <div className="space-y-6">
                    <div className="space-y-1">
                        <h3 className="font-bold text-lg flex items-center gap-2"><Globe className="h-5 w-5 text-primary"/> İletişim ve Sosyal Medya</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Kurumsal E-posta</Label>
                            <Input type="email" placeholder="örnek@marka.com" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="h-12 rounded-xl" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Kurumsal Telefon</Label>
                            <div className="flex gap-2">
                                <div className="w-[80px] shrink-0">
                                    <Select defaultValue="90"><SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger><SelectContent>{countryPhoneCodes.map(c => <SelectItem key={c} value={c}>+{c}</SelectItem>)}</SelectContent></Select>
                                </div>
                                <Input type="tel" placeholder="5XX XXX XX XX" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="h-12 rounded-xl flex-1 font-bold" />
                            </div>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Web Sitesi</Label>
                        <Input placeholder="https://www.ornek.com" value={formData.website} onChange={e => setFormData({...formData, website: e.target.value})} className="h-12 rounded-xl" />
                    </div>
                    <div className="space-y-4 pt-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Sosyal Medya Linkleri</p>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-muted rounded-lg"><UserCircle className="h-4 w-4" /></div>
                                <Input placeholder="instagram.com/kullaniciadi" value={formData.social.instagram} onChange={e => setFormData({...formData, social: {...formData.social, instagram: e.target.value}})} className="h-11 rounded-xl" />
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-muted rounded-lg"><Globe className="h-4 w-4" /></div>
                                <Input placeholder="x.com/kullaniciadi" value={formData.social.twitter} onChange={e => setFormData({...formData, social: {...formData.social, twitter: e.target.value}})} className="h-11 rounded-xl" />
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-muted rounded-lg"><Briefcase className="h-4 w-4" /></div>
                                <Input placeholder="linkedin.com/company/kurumadi" value={formData.social.linkedin} onChange={e => setFormData({...formData, social: {...formData.social, linkedin: e.target.value}})} className="h-11 rounded-xl" />
                            </div>
                        </div>
                    </div>
                </div>

                <Separator className="border-dashed" />

                {/* 5. Yasal & Finansal */}
                <div className="space-y-6">
                    <div className="space-y-1">
                        <h3 className="font-bold text-lg flex items-center gap-2"><Landmark className="h-5 w-5 text-primary"/> Yasal & Finansal</h3>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Yasal Unvan</Label>
                        <Input placeholder="Yasal Unvan" required value={formData.legalTitle} onChange={e => setFormData({...formData, legalTitle: e.target.value})} className="h-12 rounded-xl" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Hesap Adı</Label>
                            <Input placeholder="Hesap Adı" required value={formData.accountName} onChange={e => setFormData({...formData, accountName: e.target.value})} className="h-12 rounded-xl" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">IBAN Numarası</Label>
                            <Input placeholder="TR..." required value={formData.iban} onChange={e => setFormData({...formData, iban: e.target.value})} className="h-12 rounded-xl font-mono" />
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="space-y-1">
                        <h3 className="font-bold text-lg flex items-center gap-2"><FileText className="h-5 w-5 text-primary"/> Yasal Belgeler</h3>
                    </div>
                    <FileUpload label="Logo" accept=".jpg,.png" hint="Desteklenen format: .jpg, .png" required />
                    <FileUpload label="Faaliyet Belgesi" accept=".pdf,.png" hint="Desteklenen format: .pdf, .png" required />
                    <FileUpload label="Tüzük" accept=".pdf" hint="Desteklenen format: .pdf" required />
                </div>

                <Separator className="border-dashed" />

                {/* 6. Yetkili Kişi Bilgileri */}
                <div className="space-y-6">
                    <div className="space-y-1">
                        <h3 className="font-bold text-lg flex items-center gap-2"><UserCircle className="h-5 w-5 text-primary"/> Yetkili Kişi Bilgileri</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Ad Soyad</Label>
                            <Input placeholder="Ör.: İsmail Hilmi ADIGÜZEL" required value={formData.authorized.name} onChange={e => setFormData({...formData, authorized: {...formData.authorized, name: e.target.value}})} className="h-12 rounded-xl" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Görevi</Label>
                            <Input placeholder="Örn: Genel Sekreter, Pazarlama Müdürü" required value={formData.authorized.role} onChange={e => setFormData({...formData, authorized: {...formData.authorized, role: e.target.value}})} className="h-12 rounded-xl" />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Kurumsal E-posta</Label>
                            <Input type="email" placeholder="örnek@marka.com" required value={formData.authorized.email} onChange={e => setFormData({...formData, authorized: {...formData.authorized, email: e.target.value}})} className="h-12 rounded-xl" />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Kurumsal Telefon</Label>
                            <div className="flex gap-2">
                                <div className="w-[80px] shrink-0">
                                    <Select defaultValue="90"><SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger><SelectContent>{countryPhoneCodes.map(c => <SelectItem key={c} value={c}>+{c}</SelectItem>)}</SelectContent></Select>
                                </div>
                                <Input type="tel" placeholder="5XX XXX XX XX" required value={formData.authorized.phone} onChange={e => setFormData({...formData, authorized: {...formData.authorized, phone: e.target.value}})} className="h-12 rounded-xl flex-1 font-bold" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* 7. Onaylar */}
                <div className="space-y-4 pt-6 border-t">
                    <div className="flex items-start space-x-3">
                        <Checkbox id="check-1" required />
                        <Label htmlFor="check-1" className="text-[11px] font-medium leading-relaxed text-muted-foreground cursor-pointer">
                            <Link href="/settings/contracts/kurulus-sozlesmesi" className="text-primary font-bold hover:underline">Kuruluş Sözleşmesi</Link> ve <Link href="/settings/contracts/sosyal-etki-politikasi" className="text-primary font-bold hover:underline">Sosyal Etki Politikası</Link>'nı okudum, kuruluşum adına onaylıyorum.
                        </Label>
                    </div>
                    <div className="flex items-start space-x-3">
                        <Checkbox id="check-2" required />
                        <Label htmlFor="check-2" className="text-[11px] font-medium leading-relaxed text-muted-foreground cursor-pointer">
                            <Link href="/settings/contracts/gizlilik-politikasi" className="text-primary font-bold hover:underline">Gizlilik Politikası</Link>, <Link href="/settings/contracts/kvkk-aydinlatma-metni" className="text-primary font-bold hover:underline">Aydınlatma Metni</Link> ve <Link href="/settings/contracts/acik-riza-metni" className="text-primary font-bold hover:underline">Açık Rıza Metni</Link>'ni okudum ve kabul ediyorum.
                        </Label>
                    </div>
                    <div className="flex items-start space-x-3">
                        <Checkbox id="check-3" required />
                        <Label htmlFor="check-3" className="text-[11px] font-medium leading-relaxed text-muted-foreground cursor-pointer">
                            <Link href="/settings/contracts/bagis-ve-yardim-politikasi" className="text-primary font-bold hover:underline">Bağış ve Yardım Politikası</Link> ile <Link href="/settings/contracts/etik-ilkeler" className="text-primary font-bold hover:underline">Etik İlkeler</Link>'e uyacağımızı taahhüt ediyorum.
                        </Label>
                    </div>
                </div>

                <div className="space-y-4">
                    <Button type="submit" className="w-full h-16 rounded-2xl text-lg font-black shadow-2xl" disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="animate-spin h-6 w-6" /> : "Başvuruyu Gönder"}
                    </Button>
                    <div className="text-center">
                        <HangelLogo className="text-3xl opacity-20" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-1">Güvenli ve Şeffaf Altyapı</p>
                    </div>
                </div>
            </form>
        );
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
                        <CardTitle className="text-3xl font-black tracking-tighter">
                            {action === 'register' ? 'İyiliğe İlk Adım' : 'Tekrar Hoş Geldin'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6 px-8 pb-10">
                         <Tabs defaultValue={action} onValueChange={handleActionChange} className="w-full">
                            <TabsList className="grid w-full grid-cols-2 h-12 rounded-xl bg-muted/50 p-1">
                                <TabsTrigger value="login" className="rounded-lg font-bold">Geniş Yap</TabsTrigger>
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
                                    <CorporateForm />
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
                <div className="py-4">
                    {step === 1 && (
                        <div className="space-y-6">
                            <Label className="text-center block font-semibold text-lg">hangel'i nereden duydunuz?</Label>
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
                             <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Arkadaşının Numarası</Label>
                                <div className="flex gap-2">
                                    <div className="w-[80px] shrink-0">
                                        <Select defaultValue="90"><SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger><SelectContent>{countryPhoneCodes.map(c => <SelectItem key={c} value={c}>+{c}</SelectItem>)}</SelectContent></Select>
                                    </div>
                                    <Input type="tel" placeholder="5XX..." value={friendPhone} onChange={(e) => setFriendPhone(e.target.value)} className="h-12 rounded-xl flex-1 font-bold" />
                                </div>
                            </div>
                            <Button onClick={handleInviteFriend} className="w-full h-12 rounded-2xl font-bold">Onayla ve Devam Et</Button>
                        </div>
                    )}
                    {step === 3 && (
                         <div className="space-y-6 text-center">
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

export default function LoginSelectionPage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center bg-secondary"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>}>
      <FormRenderer />
    </Suspense>
  );
}
