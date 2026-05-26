'use client';

import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useSearchParams } from 'next/navigation';
import { Mail, Loader2, Phone, ShieldCheck, MessageCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { COUNTRY_PHONE_CODES } from '@/lib/phone-codes';
import { useToast } from '@/hooks/use-toast';
import { useAuth, useFirestore, setDocumentNonBlocking } from '@/firebase';
import { updateProfile, createUserWithEmailAndPassword, signInWithEmailAndPassword, RecaptchaVerifier, signInWithPhoneNumber, signInWithCustomToken, getAuth, type ConfirmationResult } from 'firebase/auth';
import { initiateEmailVerification } from '@/firebase/non-blocking-login';
import { arrayUnion, doc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { COLLECTIONS } from '@/firebase/collections';
import { FormLabel, FormInput } from './shared';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getLanguageFromPhoneCode } from '@/lib/phone-locale';

// IndividualForm — extracted verbatim from login/selection/page.tsx (P2-6c).
// IMPORTANT: auth/Firestore flow MUST stay identical. Do not refactor logic.
export const IndividualForm = ({ onComplete }: { onComplete: (isNewUser: boolean) => void }) => {
    const auth = useAuth();
    const db = useFirestore();
    const { toast } = useToast();
    const searchParams = useSearchParams();

    type IndividualStep = 'email' | 'login' | 'register' | 'verify-sent' | 'forgot' | 'forgot-sent' | 'phone-enter' | 'phone-otp' | 'whatsapp-enter' | 'whatsapp-otp';
    const [step, setStep] = useState<IndividualStep>('email');
    const [authMode, setAuthMode] = useState<'mail' | 'phone' | 'whatsapp'>('mail');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [phoneCountryCode, setPhoneCountryCode] = useState('+90');
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    // Phone OTP state
    const [otpCode, setOtpCode] = useState('');
    const confirmationResultRef = useRef<ConfirmationResult | null>(null);
    const recaptchaContainerRef = useRef<HTMLDivElement | null>(null);
    const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);
    const [agreements, setAgreements] = useState({
        userAgreement: false,
        kvkk: false,
        privacy: false,
        cookies: false,
    });
    const allIndividualAgreementsAccepted =
        agreements.userAgreement && agreements.kvkk && agreements.privacy && agreements.cookies;

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
            const userCredential = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
            // QR/davet linki ile gelen mevcut kullanıcı için de auto-action uygula
            // (PDF #6 — kayıtlı kullanıcı QR ile gelirse de seçili gelmeli).
            const referrerId = searchParams.get('ref') || null;
            if (referrerId && referrerId.includes(':')) {
                const [kind, entityId] = referrerId.split(':');
                if (entityId) {
                    try {
                        const userDocRef = doc(db, COLLECTIONS.users, userCredential.user.uid);
                        const userSnap = await getDoc(userDocRef);
                        const userData = (userSnap.exists() ? userSnap.data() : {}) as {
                            supportedNgos?: string[];
                            volunteerInfo?: { education?: { level?: string; school?: string }[] };
                            lastNgoSelectionChange?: { toDate?: () => Date } | string;
                        };
                        let update: Record<string, unknown> | null = null;
                        let roleLabel = '';
                        let collectionName: 'ngos' | 'clubs' | 'brands' | null = null;
                        let lockedAsVolunteer = false;
                        let lockRemainingDays = 0;
                        if (kind === 'ngo') {
                            collectionName = 'ngos';
                            // 30 günlük STK değişim kilidi: kullanıcının desteklediği STK varsa ve
                            // lastNgoSelectionChange 30 gün dolmadıysa, mevcut STK'sını DEĞİŞTİRMEYİZ;
                            // sadece bu STK'nın GÖNÜLLÜSÜ yaparız ve durumu kullanıcıya bildiririz.
                            const supportedIds = Array.isArray(userData.supportedNgos) ? userData.supportedNgos : [];
                            const lockRaw = userData.lastNgoSelectionChange;
                            let lockDate: Date | null = null;
                            if (lockRaw && typeof lockRaw === 'object' && typeof lockRaw.toDate === 'function') {
                                try { lockDate = lockRaw.toDate(); } catch { lockDate = null; }
                            } else if (typeof lockRaw === 'string') {
                                const parsed = new Date(lockRaw);
                                if (!isNaN(parsed.getTime())) lockDate = parsed;
                            }
                            const daysSinceChange = lockDate ? (Date.now() - lockDate.getTime()) / (24 * 60 * 60 * 1000) : Infinity;
                            const alreadyMember = supportedIds.includes(entityId);
                            const isLocked = supportedIds.length > 0 && daysSinceChange < 30 && !alreadyMember;
                            if (isLocked) {
                                update = { volunteerNgos: arrayUnion(entityId) };
                                roleLabel = 'STK gönüllüsü';
                                lockedAsVolunteer = true;
                                lockRemainingDays = Math.max(1, Math.ceil(30 - daysSinceChange));
                            } else {
                                update = {
                                    supportedNgos: arrayUnion(entityId),
                                    volunteerNgos: arrayUnion(entityId),
                                };
                                roleLabel = 'STK destekçisi ve gönüllüsü';
                            }
                        } else if (kind === 'club') {
                            collectionName = 'clubs';
                            update = { joinedClubs: arrayUnion(entityId) };
                            roleLabel = 'Kulüp üyesi';
                        } else if (kind === 'brand') {
                            collectionName = 'brands';
                            update = { followedBrands: arrayUnion(entityId) };
                            roleLabel = 'Marka takipçisi';
                        }
                        if (update && collectionName) {
                            // Kulüp ise: profile okul ekle (mevcut education[] ile birleştirilir)
                            if (kind === 'club') {
                                try {
                                    const clubSnap = await getDoc(doc(db, collectionName, entityId));
                                    const university = (clubSnap.exists() && (clubSnap.data() as { university?: string }).university) || '';
                                    if (university) {
                                        const existingEdu = userData.volunteerInfo?.education || [];
                                        const hasSchool = existingEdu.some((e) => (e?.school || '').trim().toLowerCase() === university.trim().toLowerCase());
                                        if (!hasSchool) {
                                            update = {
                                                ...update,
                                                'volunteerInfo.education': [...existingEdu, { level: 'Lisans', school: university }],
                                            };
                                        }
                                    }
                                } catch { /* okul auto-fill best-effort */ }
                            }
                            await updateDoc(userDocRef, update);
                            try {
                                const entitySnap = await getDoc(doc(db, collectionName, entityId));
                                const entityName = (entitySnap.exists() && (entitySnap.data() as { name?: string }).name) || '';
                                if (lockedAsVolunteer) {
                                    toast({
                                        title: 'STK gönüllüsü oldun',
                                        description: entityName
                                            ? `${entityName} STK'sının gönüllüsü oldun. Bağışçısı olduğun STK'yı değiştirme süren ${lockRemainingDays} gün sonra dolacak; süre dolunca /settings/ngo-selection'dan değiştirebilirsin.`
                                            : `Bu STK'nın gönüllüsü oldun. Bağışçısı olduğun STK'yı değiştirme süren ${lockRemainingDays} gün sonra dolacak.`,
                                    });
                                } else {
                                    toast({
                                        title: 'Davet kabul edildi',
                                        description: entityName
                                            ? `${entityName} kuruluşundan davet aldınız ve otomatik olarak ${roleLabel} oldunuz.`
                                            : `Davet aldınız ve otomatik olarak ${roleLabel} oldunuz.`,
                                    });
                                }
                            } catch {
                                // sessiz geç — toast opsiyonel
                            }
                        }
                    } catch {
                        // auto-action best-effort; login akışını kırma
                    }
                }
            }
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
                        // Kulübün üniversitesini profile otomatik ekle — kullanıcı sonra
                        // /settings/profile'da değiştirebilir. Yeni hesapta education[]
                        // boştur; bu tek elemanlı bir dizi olarak başlatılır.
                        try {
                            const clubSnap = await getDoc(doc(db, 'clubs', entityId));
                            const university = (clubSnap.exists() && (clubSnap.data() as { university?: string }).university) || '';
                            if (university) {
                                autoActionFields = {
                                    ...autoActionFields,
                                    volunteerInfo: { education: [{ level: 'Lisans', school: university }] },
                                };
                            }
                        } catch { /* okul auto-fill best-effort */ }
                    } else if (kind === 'brand') {
                        autoActionKind = 'brand';
                        autoActionEntityId = entityId;
                        autoActionFields = { followedBrands: [entityId] };
                    }
                }
            }

            setDocumentNonBlocking(doc(db, COLLECTIONS.users, userId), {
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

    // PHONE FLOW — SMS OTP ile parolasız kayıt (Firebase Phone Auth)
    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!allIndividualAgreementsAccepted) {
            toast({ variant: 'destructive', title: 'Sözleşmeler', description: 'Devam etmek için sözleşmeleri kabul edin.' });
            return;
        }
        const cleanPhone = phone.replace(/\D/g, '');
        if (!name.trim() || cleanPhone.length < 7) {
            toast({ variant: 'destructive', title: 'Eksik bilgi', description: 'Ad soyad ve geçerli telefon gerekli.' });
            return;
        }
        if (!auth) return;
        setIsLoading(true);
        try {
            // ÖNCE dili set et (verifier ve signInWithPhoneNumber'dan önce). Verifier dili
            // yaratılırken yakaladığı için her seferinde dil değişebilecek diye eski verifier'ı
            // temizleyip yeniden oluştur.
            const sharedAuth = getAuth();
            sharedAuth.languageCode = getLanguageFromPhoneCode(phoneCountryCode);

            // Eski verifier varsa temizle (dil değişmiş olabilir; reCAPTCHA fresh kurulsun)
            if (recaptchaVerifierRef.current) {
                try { recaptchaVerifierRef.current.clear(); } catch { /* ignore */ }
                recaptchaVerifierRef.current = null;
            }
            if (recaptchaContainerRef.current) {
                recaptchaVerifierRef.current = new RecaptchaVerifier(auth, recaptchaContainerRef.current, {
                    size: 'invisible',
                });
            }
            const verifier = recaptchaVerifierRef.current;
            if (!verifier) throw new Error('reCAPTCHA verifier hazırlanamadı.');
            const fullPhone = `${phoneCountryCode}${cleanPhone.replace(/^0+/, '')}`;
            const confirmation = await signInWithPhoneNumber(auth, fullPhone, verifier);
            confirmationResultRef.current = confirmation;
            setStep('phone-otp');
            toast({ title: 'Kod gönderildi', description: `${fullPhone} numarasına 6 haneli doğrulama kodu gönderildi.` });
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Kod gönderilemedi.';
            toast({ variant: 'destructive', title: 'SMS gönderilemedi', description: msg });
            // Verifier'ı sıfırla (sonraki deneme için)
            try { recaptchaVerifierRef.current?.clear(); } catch { /* ignore */ }
            recaptchaVerifierRef.current = null;
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        const code = otpCode.trim();
        if (code.length < 6) {
            toast({ variant: 'destructive', title: 'Kod eksik', description: '6 haneli kodu girin.' });
            return;
        }
        const confirmation = confirmationResultRef.current;
        if (!confirmation) {
            toast({ variant: 'destructive', title: 'Oturum geçersiz', description: 'Kod yeniden istenmeli.' });
            setStep('phone-enter');
            return;
        }
        if (!auth || !db) return;
        setIsLoading(true);
        try {
            const cred = await confirmation.confirm(code);
            await updateProfile(cred.user, { displayName: name.trim() });
            const userId = cred.user.uid;
            const cleanPhone = phone.replace(/\D/g, '').replace(/^0+/, '');
            setDocumentNonBlocking(doc(db, COLLECTIONS.users, userId), {
                id: userId,
                name: name.trim(),
                avatarUrl: '',
                personalInfo: {
                    email: '',
                    phone: cleanPhone,
                    phoneCountryCode,
                },
                stats: { totalDonation: 0, volunteerHours: 0, impactScore: 0 },
                createdAt: serverTimestamp(),
                joinDate: new Date().toISOString().split('T')[0],
                signupMethod: 'phone',
            }, { merge: true });
            toast({ title: 'Hoş geldin', description: `${name.trim()}, hesabın oluşturuldu.` });
            onComplete(true);
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Kod hatalı.';
            toast({ variant: 'destructive', title: 'Doğrulanamadı', description: msg });
        } finally {
            setIsLoading(false);
        }
    };

    const renderAuthModeTabs = () => (
        <Tabs value={authMode} onValueChange={(v) => {
            const m = v as 'mail' | 'phone' | 'whatsapp';
            setAuthMode(m);
            setStep(m === 'mail' ? 'email' : m === 'phone' ? 'phone-enter' : 'whatsapp-enter');
        }} className="w-full mb-2">
            <TabsList className="grid grid-cols-3 w-full h-11 p-1 rounded-2xl">
                <TabsTrigger value="mail" className="rounded-xl text-[11px] font-bold gap-1.5"><Mail className="h-3.5 w-3.5" /> E-posta</TabsTrigger>
                <TabsTrigger value="phone" className="rounded-xl text-[11px] font-bold gap-1.5"><Phone className="h-3.5 w-3.5" /> SMS</TabsTrigger>
                <TabsTrigger value="whatsapp" className="rounded-xl text-[11px] font-bold gap-1.5"><MessageCircle className="h-3.5 w-3.5" /> WhatsApp</TabsTrigger>
            </TabsList>
        </Tabs>
    );

    // WhatsApp OTP handlers
    const handleSendWhatsAppOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!allIndividualAgreementsAccepted) {
            toast({ variant: 'destructive', title: 'Sözleşmeler', description: 'Devam etmek için sözleşmeleri kabul edin.' });
            return;
        }
        const cleanPhone = phone.replace(/\D/g, '');
        if (!name.trim() || cleanPhone.length < 7) {
            toast({ variant: 'destructive', title: 'Eksik bilgi', description: 'Ad soyad ve geçerli telefon gerekli.' });
            return;
        }
        setIsLoading(true);
        try {
            const res = await fetch('/api/auth/whatsapp/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phone: cleanPhone,
                    phoneCountryCode,
                    name: name.trim(),
                    lang: getLanguageFromPhoneCode(phoneCountryCode),
                }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok || !data.ok) {
                toast({ variant: 'destructive', title: 'WhatsApp ile gönderilemedi', description: data.message || 'SMS seçeneğini deneyin.' });
                return;
            }
            setStep('whatsapp-otp');
            toast({ title: 'WhatsApp\'a kod gönderildi', description: `${phoneCountryCode}${cleanPhone.replace(/^0+/, '')} numarasına 6 haneli kod gönderildi.` });
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Kod gönderilemedi.';
            toast({ variant: 'destructive', title: 'Hata', description: msg });
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyWhatsAppOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        const code = otpCode.trim();
        if (code.length < 6) {
            toast({ variant: 'destructive', title: 'Kod eksik', description: '6 haneli kodu girin.' });
            return;
        }
        if (!auth) return;
        setIsLoading(true);
        try {
            const cleanPhone = phone.replace(/\D/g, '');
            const res = await fetch('/api/auth/whatsapp/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phone: cleanPhone,
                    phoneCountryCode,
                    code,
                    name: name.trim(),
                }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok || !data.ok || !data.customToken) {
                toast({ variant: 'destructive', title: 'Doğrulanamadı', description: data.message || 'Kod yanlış veya süresi dolmuş.' });
                return;
            }
            await signInWithCustomToken(auth, data.customToken);
            toast({ title: 'Hoş geldin', description: `${name.trim()}, hesabın oluşturuldu.` });
            onComplete(true);
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Bir hata oluştu.';
            toast({ variant: 'destructive', title: 'Hata', description: msg });
        } finally {
            setIsLoading(false);
        }
    };

    // PHONE STEPS
    if (step === 'phone-enter') {
        return (
            <div className="space-y-4">
                {renderAuthModeTabs()}
                <form onSubmit={handleSendOtp} className="space-y-4">
                    <div className="space-y-2">
                        <FormLabel required>Ad Soyad</FormLabel>
                        <FormInput placeholder="Adınız Soyadınız" required value={name} onChange={e => setName(e.target.value)} />
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
                    <div className="space-y-2 pt-4 border-t border-dashed">
                        <label className="flex items-start gap-2 cursor-pointer">
                            <Checkbox checked={agreements.userAgreement} onCheckedChange={(c) => setAgreements(prev => ({ ...prev, userAgreement: !!c }))} />
                            <span className="text-[10px] text-muted-foreground leading-snug">
                                <a href="/settings/contracts/kullanici-sozlesmesi" target="_blank" rel="noopener noreferrer" className="font-bold text-primary underline">Kullanıcı Sözleşmesi</a>&apos;ni okudum ve kabul ediyorum
                            </span>
                        </label>
                        <label className="flex items-start gap-2 cursor-pointer">
                            <Checkbox checked={agreements.kvkk} onCheckedChange={(c) => setAgreements(prev => ({ ...prev, kvkk: !!c }))} />
                            <span className="text-[10px] text-muted-foreground leading-snug">
                                <a href="/settings/contracts/kvkk-aydinlatma-metni" target="_blank" rel="noopener noreferrer" className="font-bold text-primary underline">KVKK Aydınlatma Metni</a>&apos;ni okudum ve kabul ediyorum
                            </span>
                        </label>
                        <label className="flex items-start gap-2 cursor-pointer">
                            <Checkbox checked={agreements.privacy} onCheckedChange={(c) => setAgreements(prev => ({ ...prev, privacy: !!c }))} />
                            <span className="text-[10px] text-muted-foreground leading-snug">
                                <a href="/settings/contracts/gizlilik-politikasi" target="_blank" rel="noopener noreferrer" className="font-bold text-primary underline">Gizlilik Politikası</a>&apos;nı okudum ve kabul ediyorum
                            </span>
                        </label>
                        <label className="flex items-start gap-2 cursor-pointer">
                            <Checkbox checked={agreements.cookies} onCheckedChange={(c) => setAgreements(prev => ({ ...prev, cookies: !!c }))} />
                            <span className="text-[10px] text-muted-foreground leading-snug">
                                <a href="/settings/contracts/cerez-politikasi" target="_blank" rel="noopener noreferrer" className="font-bold text-primary underline">Çerez Politikası</a>&apos;nı kabul ediyorum
                            </span>
                        </label>
                    </div>
                    <Button type="submit" className="w-full h-12 rounded-xl font-bold" disabled={isLoading || !allIndividualAgreementsAccepted}>
                        {isLoading ? <Loader2 className="animate-spin" /> : 'Doğrulama Kodu Gönder'}
                    </Button>
                    {/* Invisible reCAPTCHA için container */}
                    <div ref={recaptchaContainerRef} />
                </form>
            </div>
        );
    }

    if (step === 'phone-otp') {
        return (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="text-center space-y-2">
                    <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <ShieldCheck className="h-6 w-6 text-primary" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                        {phoneCountryCode}{phone.replace(/\D/g, '').replace(/^0+/, '')} numarasına gönderilen <span className="font-bold text-foreground">6 haneli kodu</span> girin.
                    </p>
                </div>
                <div className="space-y-2">
                    <FormLabel required>Doğrulama Kodu</FormLabel>
                    <FormInput
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        maxLength={6}
                        placeholder="123456"
                        required
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                        className="text-center text-2xl tracking-[0.5em] font-bold"
                    />
                </div>
                <Button type="submit" className="w-full h-12 rounded-xl font-bold" disabled={isLoading || otpCode.length < 6}>
                    {isLoading ? <Loader2 className="animate-spin" /> : 'Kayıt Ol'}
                </Button>
                <Button type="button" variant="link" className="w-full text-xs" onClick={() => setStep('phone-enter')}>
                    Numarayı değiştir / Tekrar gönder
                </Button>
            </form>
        );
    }

    // WHATSAPP STEPS
    if (step === 'whatsapp-enter') {
        return (
            <div className="space-y-4">
                {renderAuthModeTabs()}
                <div className="rounded-2xl bg-emerald-50 border border-emerald-200 px-3 py-2 text-[11px] text-emerald-800 leading-snug">
                    📱 Doğrulama kodu hangel resmi WhatsApp numarasından gönderilir. Mesaj WhatsApp dilinde gelir.
                </div>
                <form onSubmit={handleSendWhatsAppOtp} className="space-y-4">
                    <div className="space-y-2">
                        <FormLabel required>Ad Soyad</FormLabel>
                        <FormInput placeholder="Adınız Soyadınız" required value={name} onChange={e => setName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <FormLabel required>WhatsApp Telefonu</FormLabel>
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
                                        <SelectItem key={`wa-${c.iso}-${c.code}`} value={c.code}>
                                            <span className="text-base mr-2">{c.flag}</span>
                                            {c.country} ({c.code})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormInput type="tel" placeholder="5XXXXXXXXX" required value={phone} onChange={e => setPhone(e.target.value)} />
                        </div>
                    </div>
                    <div className="space-y-2 pt-4 border-t border-dashed">
                        <label className="flex items-start gap-2 cursor-pointer">
                            <Checkbox checked={agreements.userAgreement} onCheckedChange={(c) => setAgreements(prev => ({ ...prev, userAgreement: !!c }))} />
                            <span className="text-[10px] text-muted-foreground leading-snug">
                                <a href="/settings/contracts/kullanici-sozlesmesi" target="_blank" rel="noopener noreferrer" className="font-bold text-primary underline">Kullanıcı Sözleşmesi</a>&apos;ni okudum
                            </span>
                        </label>
                        <label className="flex items-start gap-2 cursor-pointer">
                            <Checkbox checked={agreements.kvkk} onCheckedChange={(c) => setAgreements(prev => ({ ...prev, kvkk: !!c }))} />
                            <span className="text-[10px] text-muted-foreground leading-snug">
                                <a href="/settings/contracts/kvkk-aydinlatma-metni" target="_blank" rel="noopener noreferrer" className="font-bold text-primary underline">KVKK</a>&apos;yı kabul ediyorum
                            </span>
                        </label>
                        <label className="flex items-start gap-2 cursor-pointer">
                            <Checkbox checked={agreements.privacy} onCheckedChange={(c) => setAgreements(prev => ({ ...prev, privacy: !!c }))} />
                            <span className="text-[10px] text-muted-foreground leading-snug">
                                <a href="/settings/contracts/gizlilik-politikasi" target="_blank" rel="noopener noreferrer" className="font-bold text-primary underline">Gizlilik Politikası</a>
                            </span>
                        </label>
                        <label className="flex items-start gap-2 cursor-pointer">
                            <Checkbox checked={agreements.cookies} onCheckedChange={(c) => setAgreements(prev => ({ ...prev, cookies: !!c }))} />
                            <span className="text-[10px] text-muted-foreground leading-snug">
                                <a href="/settings/contracts/cerez-politikasi" target="_blank" rel="noopener noreferrer" className="font-bold text-primary underline">Çerez Politikası</a>
                            </span>
                        </label>
                    </div>
                    <Button type="submit" className="w-full h-12 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700" disabled={isLoading || !allIndividualAgreementsAccepted}>
                        {isLoading ? <Loader2 className="animate-spin" /> : <><MessageCircle className="mr-2 h-4 w-4" /> {'WhatsApp\'tan Kod Gönder'}</>}
                    </Button>
                </form>
            </div>
        );
    }

    if (step === 'whatsapp-otp') {
        return (
            <form onSubmit={handleVerifyWhatsAppOtp} className="space-y-4">
                <div className="text-center space-y-2">
                    <div className="mx-auto w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                        <MessageCircle className="h-6 w-6 text-emerald-600" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                        {phoneCountryCode}{phone.replace(/\D/g, '').replace(/^0+/, '')} numarasının <span className="font-bold text-foreground">WhatsApp</span>{"'"}ına 6 haneli kod gönderildi.
                    </p>
                </div>
                <div className="space-y-2">
                    <FormLabel required>Doğrulama Kodu</FormLabel>
                    <FormInput
                        type="text"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        maxLength={6}
                        placeholder="123456"
                        required
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                        className="text-center text-2xl tracking-[0.5em] font-bold"
                    />
                </div>
                <Button type="submit" className="w-full h-12 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700" disabled={isLoading || otpCode.length < 6}>
                    {isLoading ? <Loader2 className="animate-spin" /> : 'Kayıt Ol'}
                </Button>
                <Button type="button" variant="link" className="w-full text-xs" onClick={() => setStep('whatsapp-enter')}>
                    Numarayı değiştir / Tekrar gönder
                </Button>
            </form>
        );
    }

    if (step === 'email') {
        return (
            <div className="space-y-4">
                {renderAuthModeTabs()}
                <form onSubmit={handleCheckEmail} className="space-y-4">
                    <div className="space-y-2">
                        <FormLabel required>E-posta</FormLabel>
                        <FormInput type="email" placeholder="ornek@mail.com" required value={email} onChange={e => setEmail(e.target.value)} />
                    </div>
                    <Button type="submit" className="w-full h-12 rounded-xl font-bold" disabled={isLoading}>
                        {isLoading ? <Loader2 className="animate-spin" /> : "Devam Et"}
                    </Button>
                </form>
            </div>
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
                <div className="space-y-2 pt-4 border-t border-dashed">
                    <label className="flex items-start gap-2 cursor-pointer">
                        <Checkbox
                            checked={agreements.userAgreement}
                            onCheckedChange={(checked) => setAgreements(prev => ({ ...prev, userAgreement: !!checked }))}
                        />
                        <span className="text-[10px] text-muted-foreground leading-snug">
                            <a href="/settings/contracts/kullanici-sozlesmesi" target="_blank" rel="noopener noreferrer" className="font-bold text-primary underline">Kullanıcı Sözleşmesi</a>&apos;ni okudum ve kabul ediyorum
                        </span>
                    </label>
                    <label className="flex items-start gap-2 cursor-pointer">
                        <Checkbox
                            checked={agreements.kvkk}
                            onCheckedChange={(checked) => setAgreements(prev => ({ ...prev, kvkk: !!checked }))}
                        />
                        <span className="text-[10px] text-muted-foreground leading-snug">
                            <a href="/settings/contracts/kvkk-aydinlatma-metni" target="_blank" rel="noopener noreferrer" className="font-bold text-primary underline">KVKK Aydınlatma Metni</a>&apos;ni okudum ve kabul ediyorum
                        </span>
                    </label>
                    <label className="flex items-start gap-2 cursor-pointer">
                        <Checkbox
                            checked={agreements.privacy}
                            onCheckedChange={(checked) => setAgreements(prev => ({ ...prev, privacy: !!checked }))}
                        />
                        <span className="text-[10px] text-muted-foreground leading-snug">
                            <a href="/settings/contracts/gizlilik-politikasi" target="_blank" rel="noopener noreferrer" className="font-bold text-primary underline">Gizlilik Politikası</a>&apos;nı okudum ve kabul ediyorum
                        </span>
                    </label>
                    <label className="flex items-start gap-2 cursor-pointer">
                        <Checkbox
                            checked={agreements.cookies}
                            onCheckedChange={(checked) => setAgreements(prev => ({ ...prev, cookies: !!checked }))}
                        />
                        <span className="text-[10px] text-muted-foreground leading-snug">
                            <a href="/settings/contracts/cerez-politikasi" target="_blank" rel="noopener noreferrer" className="font-bold text-primary underline">Çerez Politikası</a>&apos;nı kabul ediyorum
                        </span>
                    </label>
                </div>
                <Button type="submit" className="w-full h-12 rounded-xl font-bold" disabled={isLoading || !allIndividualAgreementsAccepted}>Kayıt Ol</Button>
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
                <Button className="w-full h-12 rounded-xl font-bold" onClick={() => {
                    // Yeni kullanıcı onboarding zinciri: ngo-selection → profile → volunteer → market
                    if (typeof window !== 'undefined') {
                        localStorage.setItem('onboardingStep', 'ngo-selection');
                        // QR ile gelen STK (ref=ngo:<id>) onboarding'in STK seçimi adımında
                        // ÖN SEÇİLİ gelsin diye id'yi sakla. Kulüp/marka auto-join davranışı
                        // değişmez; yalnızca STK ön seçimi için kullanılır.
                        const ref = searchParams.get('ref') || '';
                        if (ref.includes(':')) {
                            const [kind, entityId] = ref.split(':');
                            if (kind === 'ngo' && entityId) {
                                localStorage.setItem('onboardingPreselectNgo', entityId);
                            }
                        }
                    }
                    onComplete(true);
                }}>Devam Et</Button>
            </div>
        );
    }

    return null;
};
