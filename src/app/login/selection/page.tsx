
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

// --- Shared Components ---

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
            </div>
        );
    }

    return (
        <div className="pt-4 space-y-4">
            <div className="flex items-start space-x-3">
                <Checkbox id="corp-terms-1" required />
                <Label htmlFor="corp-terms-1" className="text-[10px] font-medium leading-relaxed text-muted-foreground cursor-pointer">
                    <Link href="/settings/contracts/kurulus-sozlesmesi" className="text-primary font-bold hover:underline">Kuruluş Sözleşmesi</Link>'ni okudum, kuruluşum adına onaylıyorum.
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
            router.push(`/login/selection?action=${action}&type=corporate${redirectPart}`);
        }
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
        // Yeni akış: Register -> Survey -> NGO Selection (Donation) -> Volunteer NGO Selection -> Profile Info -> Volunteer Info -> Market
        localStorage.setItem('onboardingStep', 'ngo-selection');
        router.push('/settings/ngo-selection');
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
                            address: { country: 'Türkiye', city: '', district: '', neighborhood: '', street: '', doorNo: '', fullAddress: '' }
                        },
                        volunteerInfo: { interests: [], skills: [], dailySkills: [], languages: [], programs: [], licenses: [], documents: [], education: [], travelInfo: { domesticObstacle: false, internationalObstacle: false, visas: [] }, emergency: { available: true, hasChronicIllness: false, usesRegularMedication: false, hasPhysicalLimitation: false, emergencyContacts: [] } },
                        impactScore: 0,
                        stats: { totalDonation: 0, donationCount: 0, volunteerHours: 0, completedProjects: 0, totalImpactValue: 0 }
                    }, { merge: true });

                    await updateProfile(userCredential.user, { displayName: name });
                } else {
                    await signInWithEmailAndPassword(auth, email, password);
                }
                onComplete();
            } catch (error: any) {
                if (error.code === 'auth/email-already-in-use') {
                    toast({ variant: "destructive", title: "Hesap Zaten Mevcut", description: "Bu numara ile kayıtlı bir hesap var. Lütfen giriş yapın." });
                    handleActionChange('login');
                } else {
                    toast({ variant: "destructive", title: "Hata", description: "İşlem başarısız oldu." });
                }
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
                <AgreementList type="individual" isLogin={!isRegister} />
                <Button type="submit" className="w-full h-14 rounded-2xl text-base font-black shadow-xl" disabled={isLoading}>
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : (isRegister ? "Kayıt Ol" : "Giriş Yap")}
                </Button>
            </form>
        );
    };

    return (
        <div className="min-h-screen bg-secondary flex items-center justify-center p-4 sm:p-6 pt-20 pb-20">
            <div className="w-full max-w-sm lg:max-w-md">
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
                                    <div className="text-center py-12 border-2 border-dashed rounded-[2rem] opacity-40">
                                        <p className="text-sm font-medium italic">Lütfen platform ana sayfasından ilgili başvuruyu yapın.</p>
                                    </div>
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
    const [source, setSource] = useState('');
    const { toast } = useToast();
    
    const surveyOptions = ["Sosyal Medya", "Arkadaş Tavsiyesi", "Haberler", "Reklam", "Okul", "Diğer"];

    const handleInviteFriend = () => {
        if (friendPhone.trim()) {
            toast({ title: "Davet İletildi!", description: "Arkadaşına iyilik zinciri bildirimi gönderdik." });
        }
        setStep(3);
    };

    const handleSourceSelection = (option: string) => {
        setSource(option);
        if (option === "Arkadaş Tavsiyesi") {
            setStep(2);
        } else {
            setStep(3);
        }
    };

    const handleBack = () => {
        if (step > 1) setStep(step - 1);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md rounded-[2.5rem]">
                <DialogHeader>
                    {step > 1 && (
                        <Button variant="ghost" size="icon" className="absolute left-4 top-4 h-8 w-8" onClick={handleBack}>
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    )}
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
                                    <Button key={option} variant="outline" className="rounded-2xl h-14 font-bold" onClick={() => handleSourceSelection(option)}>
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
