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
    School
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { marketCategories, countryPhoneCodes, allCountries, allUniversities } from '@/lib/data';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth, useFirestore, setDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase';
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult, updateProfile } from 'firebase/auth';
import { doc, collection } from 'firebase/firestore';
import { HangelLogo } from '@/components/icons';

const FormLabel = ({ children, required }: { children: React.ReactNode, required?: boolean }) => (
    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 mb-2 block text-left">
        {children} {required && <span className="text-primary">*</span>}
    </Label>
);

const FormInput = (props: React.ComponentProps<typeof Input>) => (
    <Input {...props} className={cn("h-12 rounded-xl bg-muted/20 border-none shadow-sm focus-visible:ring-1 focus-visible:ring-primary/30", props.className)} />
);

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
            
            const { getDoc: fsGetDoc } = await import('firebase/firestore');
            const userDocSnap = await fsGetDoc(doc(db, 'users', userId));
            if (!userDocSnap.exists()) {
                setDocumentNonBlocking(doc(db, 'users', userId), {
                    id: userId,
                    name: name || userCredential.user.displayName || '',
                    role: 'user',
                    personalInfo: { phone: `+${phoneCode}${phone}` },
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
                                        {Array.from(new Set(countryPhoneCodes)).sort().map((code, idx) => (
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
                </form>
            )}
        </div>
    );
};

const CorporateForm = ({ initialEntity }: { initialEntity: string }) => {
    const db = useFirestore();
    const router = useRouter();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [entityType, setEntityType] = useState<string>(initialEntity);
    
    const [formData, setFormData] = useState({
        name: '',
        orgType: '',
        email: '',
        phone: '',
        website: '',
        authorized: { name: '', role: '' }
    });

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await addDocumentNonBlocking(collection(db, 'applications'), {
                ...formData,
                entityType,
                date: new Date().toISOString().split('T')[0],
                status: 'Beklemede'
            });
            toast({ title: "Başvuru Alındı", description: "En kısa sürede sizinle iletişime geçeceğiz." });
            router.push('/login');
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Hata', description: error.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleFormSubmit} className="space-y-6">
            <div className="space-y-2">
                <FormLabel>Kuruluş Türü</FormLabel>
                <Select value={entityType} onValueChange={setEntityType}>
                    <SelectTrigger className="h-12 rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="NGO">STK</SelectItem>
                        <SelectItem value="BRAND">Marka</SelectItem>
                        <SelectItem value="CLUB">Kulüp</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <FormLabel>Kuruluş Adı</FormLabel>
                <FormInput placeholder="Resmi Ad" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
            </div>
            <div className="space-y-2">
                <FormLabel>E-posta</FormLabel>
                <FormInput type="email" placeholder="kurumsal@mail.com" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
            </div>
            <div className="space-y-2">
                <FormLabel>Yetkili Ad Soyad</FormLabel>
                <FormInput placeholder="Ad Soyad" value={formData.authorized.name} onChange={e => setFormData({...formData, authorized: {...formData.authorized, name: e.target.value}})} required />
            </div>
            <Button type="submit" className="w-full h-14 rounded-2xl text-base font-black shadow-xl" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="animate-spin h-5 w-5" /> : "Başvuruyu Tamamla"}
            </Button>
        </form>
    );
};

const FormRenderer = () => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const activeTab = searchParams.get('tab') || 'individual';
    const initialEntity = searchParams.get('entity') || 'NGO';

    return (
        <div className="min-h-screen bg-secondary flex items-center justify-center p-4">
            <div className="w-full max-w-sm">
                <Button onClick={() => router.push('/login')} variant="ghost" size="icon" className="absolute top-6 left-6 rounded-full bg-background/50 h-10 w-10">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
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
    <Suspense fallback={<div className="h-screen flex items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>}>
      <FormRenderer />
    </Suspense>
  );
}