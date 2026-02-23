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
    CheckCircle
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { marketCategories, allUniversities, provincialDirectorates } from '@/lib/data';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { HangelLogo } from '@/components/icons';

const allProvinces = ["Adana", "Adıyaman", "Afyonkarahisar", "Ağrı", "Aksaray", "Amasya", "Ankara", "Antalya", "Ardahan", "Artvin", "Aydın", "Balıkesir", "Bartın", "Batman", "Bayburt", "Bilecik", "Bingöl", "Bitlis", "Bolu", "Burdur", "Bursa", "Çanakkale", "Çankırı", "Çorum", "Denizli", "Diyarbakır", "Düzce", "Edirne", "Elazığ", "Erzincan", "Erzurum", "Eskişehir", "Gaziantep", "Giresun", "Gümüşhane", "Hakkari", "Hatay", "Iğdır", "Isparta", "İstanbul", "İzmir", "Kahramanmaraş", "Karabük", "Karaman", "Kars", "Kastamonu", "Kayseri", "Kırıkkale", "Kırklareli", "Kırşehir", "Kilis", "Kocaeli", "Konya", "Kütahya", "Malatya", "Manisa", "Mardin", "Mersin", "Muğla", "Muş", "Nevşehir", "Niğde", "Ordu", "Osmaniye", "Rize", "Sakarya", "Samsun", "Siirt", "Sinop", "Sivas", "Şanlıurfa", "Şırnak", "Tekirdağ", "Tokat", "Trabzon", "Tunceli", "Uşak", "Van", "Yalova", "Yozgat", "Zonguldak"];

const districts: { [key: string]: string[] } = {
    'İstanbul': ['Kadıköy', 'Beşiktaş', 'Fatih', 'Üsküdar', 'Sarıyer'],
    'Ankara': ['Çankaya', 'Mamak', 'Keçiören'],
};

const neighborhoods: { [key: string]: string[] } = {
    'Kadıköy': ['Caferağa', 'Osmanağa', 'Moda'],
};

const marketCategoryLabels = marketCategories
    .filter(c => c.mainCategory !== 'Öne çıkanlar' && c.mainCategory !== 'Tümü')
    .map(c => c.mainCategory);

const CheckboxGroup = ({ title, options }: { title: string, options: string[] }) => (
    <div className="space-y-3">
        <Label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">{title}</Label>
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
        <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{label}</Label>
        <div className="flex items-center gap-4 p-4 border rounded-2xl bg-muted/20 border-dashed border-primary/20">
            <Input id={`${label}-upload`} type="file" className="hidden" accept={accept} />
            <Button asChild variant="outline" size="sm" className="rounded-xl border-primary/20 hover:bg-primary/5">
                <label htmlFor={`${label}-upload`} className="cursor-pointer font-bold"><Upload className="mr-2 h-4 w-4" />Belge Seç</label>
            </Button>
            <div className="flex-1">
                <p className="text-[10px] text-muted-foreground leading-tight">{hint || "Lütfen resmi formatta bir dosya yükleyin."}</p>
            </div>
        </div>
    </div>
);

const FormRenderer = () => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const action = searchParams.get('action') || 'login';
    const type = searchParams.get('type');
    const redirectParam = searchParams.get('redirect');
    const [showSurvey, setShowSurvey] = useState(false);
  
    const handleActionChange = (value: string) => {
        router.push(`/login/selection?action=${value}${type ? `&type=${type}`: ''}${redirectParam ? `&redirect=${encodeURIComponent(redirectParam)}` : ''}`);
    };

    const handleTypeChange = (value: string) => {
        const currentAction = action || 'register';
        const redirectSuffix = redirectParam ? `&redirect=${encodeURIComponent(redirectParam)}` : '';
        if (value === 'individual') {
            router.push(`/login/selection?action=${currentAction}${redirectSuffix}`);
        } else {
            router.push(`/login/selection?action=${currentAction}&type=${value}${redirectSuffix}`);
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
        const [name, setName] = useState('');
        const [phone, setPhone] = useState('');
        const [password, setPassword] = useState('');
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
                        <div className="flex justify-between items-end mb-1">
                            <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Adınız ve Soyadınız</Label>
                            <span className="text-[9px] text-primary font-bold uppercase tracking-tighter">Kimlikteki gibi</span>
                        </div>
                        <Input id="name" placeholder="Örn: Can Demir" required value={name} onChange={e => setName(e.target.value)} className="h-12 rounded-xl" />
                    </div>
                )}
                <div className="space-y-2">
                    <Label htmlFor="phone" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Telefon Numarası</Label>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">+90</span>
                        <Input id="phone" type="tel" placeholder="5XXXXXXXXX" required value={phone} onChange={e => setPhone(e.target.value)} className="h-12 rounded-xl pl-12 font-bold tracking-widest" />
                    </div>
                    <p className="text-[10px] text-muted-foreground ml-1">Doğrulama kodu SMS ile gönderilecektir.</p>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="password" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Şifre</Label>
                    <Input id="password" type="password" placeholder="En az 6 karakter" required value={password} onChange={e => setPassword(e.target.value)} className="h-12 rounded-xl" />
                </div>
                <div className="pt-2">
                    <div className="flex items-start space-x-3 mb-4">
                        <Checkbox id="terms-accept" required />
                        <Label htmlFor="terms-accept" className="text-[10px] font-medium leading-relaxed text-muted-foreground cursor-pointer">
                            <Link href="/settings/contracts/kullanici-sozlesmesi" className="text-primary font-bold hover:underline">Kullanıcı Sözleşmesi</Link>, <Link href="/settings/contracts/kvkk-aydinlatma-metni" className="text-primary font-bold hover:underline">Aydınlatma Metni</Link> ve <Link href="/settings/contracts/gizlilik-politikasi" className="text-primary font-bold hover:underline">Gizlilik Politikası</Link>'nı okudum ve kabul ediyorum.
                        </Label>
                    </div>
                </div>
                <Button type="submit" className="w-full h-14 rounded-2xl text-base font-black shadow-xl" disabled={isLoading}>
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : (isRegister ? "Kayıt Ol ve Başla" : "Giriş Yap")}
                </Button>
            </form>
        );
    };

    return (
        <div className="min-h-screen bg-secondary flex items-center justify-center p-4 sm:p-6 lg:p-8">
            <div className="w-full max-w-sm lg:max-w-md">
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
                            {action === 'register' ? 'Dünyayı güzelleştiren topluluğumuza katılmak için formu doldurun.' : 'İyilik yolculuğuna kaldığın yerden devam et.'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 px-8 pb-10">
                         <Tabs defaultValue={action} onValueChange={handleActionChange} className="w-full">
                            <TabsList className="grid w-full grid-cols-2 h-12 rounded-xl bg-muted/50 p-1">
                                <TabsTrigger value="login" className="rounded-lg font-bold">Giriş Yap</TabsTrigger>
                                <TabsTrigger value="register" className="rounded-lg font-bold">Kayıt Ol</TabsTrigger>
                            </TabsList>
                        </Tabs>
                        {action === 'login' ? <IndividualForm onComplete={handleLoginComplete} /> : (
                            <div className="space-y-6 pt-4 border-t border-dashed">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Kayıt Türü Seçin</Label>
                                    <Select onValueChange={handleTypeChange} defaultValue={type ? 'corporate' : 'individual'}>
                                        <SelectTrigger className="h-12 rounded-xl font-bold border-muted">
                                            <SelectValue placeholder="Hesap tipi seçin..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="individual">Bireysel Gönüllü / Bağışçı</SelectItem>
                                            <SelectItem value="corporate">Kurumsal (STK, Marka, Kulüp)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <p className="text-[9px] text-muted-foreground italic px-1">Kurumsal başvurular ekip denetiminden geçmektedir.</p>
                                </div>
                                <IndividualForm isRegister={true} onComplete={handleRegistrationComplete} />
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
                                <Input type="tel" placeholder="5XX XXX XX XX" value={friendPhone} onChange={(e) => setFriendPhone(e.target.value)} className="h-12 rounded-xl text-center text-lg font-bold" />
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
