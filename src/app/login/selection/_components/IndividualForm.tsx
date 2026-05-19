'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useSearchParams } from 'next/navigation';
import { Mail, Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { COUNTRY_PHONE_CODES } from '@/lib/phone-codes';
import { useToast } from '@/hooks/use-toast';
import { useAuth, useFirestore, setDocumentNonBlocking } from '@/firebase';
import { updateProfile, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { initiateEmailVerification } from '@/firebase/non-blocking-login';
import { doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { COLLECTIONS } from '@/firebase/collections';
import { FormLabel, FormInput } from './shared';

// IndividualForm — extracted verbatim from login/selection/page.tsx (P2-6c).
// IMPORTANT: auth/Firestore flow MUST stay identical. Do not refactor logic.
export const IndividualForm = ({ onComplete }: { onComplete: (isNewUser: boolean) => void }) => {
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
                            <a href="/settings/contracts/kvkk" target="_blank" rel="noopener noreferrer" className="font-bold text-primary underline">KVKK Aydınlatma Metni</a>&apos;ni okudum ve kabul ediyorum
                        </span>
                    </label>
                    <label className="flex items-start gap-2 cursor-pointer">
                        <Checkbox
                            checked={agreements.privacy}
                            onCheckedChange={(checked) => setAgreements(prev => ({ ...prev, privacy: !!checked }))}
                        />
                        <span className="text-[10px] text-muted-foreground leading-snug">
                            <a href="/settings/contracts/gizlilik" target="_blank" rel="noopener noreferrer" className="font-bold text-primary underline">Gizlilik Politikası</a>&apos;nı okudum ve kabul ediyorum
                        </span>
                    </label>
                    <label className="flex items-start gap-2 cursor-pointer">
                        <Checkbox
                            checked={agreements.cookies}
                            onCheckedChange={(checked) => setAgreements(prev => ({ ...prev, cookies: !!checked }))}
                        />
                        <span className="text-[10px] text-muted-foreground leading-snug">
                            <a href="/settings/contracts/cerez" target="_blank" rel="noopener noreferrer" className="font-bold text-primary underline">Çerez Politikası</a>&apos;nı kabul ediyorum
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
                <Button className="w-full h-12 rounded-xl font-bold" onClick={() => onComplete(true)}>Devam Et</Button>
            </div>
        );
    }

    return null;
};
