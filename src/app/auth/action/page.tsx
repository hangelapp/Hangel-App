'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    applyActionCode,
    confirmPasswordReset,
    verifyPasswordResetCode,
    signInWithEmailAndPassword,
} from 'firebase/auth';
import { Loader2, CheckCircle2, AlertTriangle, MailCheck, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { HangelLogo } from '@/components/icons';

type Phase =
    | { kind: 'loading' }
    | { kind: 'verify-success' }
    | { kind: 'reset-form'; email: string }
    | { kind: 'reset-success' }
    | { kind: 'error'; message: string };

function mapAuthError(code: string | undefined): string {
    switch (code) {
        case 'auth/invalid-action-code':
        case 'auth/expired-action-code':
            return 'Bağlantı geçersiz veya süresi dolmuş. Lütfen yeni bir link isteyin.';
        case 'auth/user-disabled':
            return 'Hesabınız devre dışı bırakılmış.';
        case 'auth/user-not-found':
            return 'Hesap bulunamadı.';
        case 'auth/weak-password':
            return 'Şifre çok zayıf. En az 6 karakter kullanın.';
        default:
            return 'Bir hata oluştu. Lütfen tekrar deneyin.';
    }
}

function ActionInner() {
    const auth = useAuth();
    const router = useRouter();
    const params = useSearchParams();
    const { toast } = useToast();

    const mode = params.get('mode');
    const oobCode = params.get('oobCode') || '';

    const [phase, setPhase] = useState<Phase>({ kind: 'loading' });
    const [newPassword, setNewPassword] = useState('');
    const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!auth) return;
        if (!oobCode || !mode) {
            setPhase({ kind: 'error', message: 'Geçersiz bağlantı.' });
            return;
        }

        let cancelled = false;

        (async () => {
            try {
                if (mode === 'verifyEmail') {
                    await applyActionCode(auth, oobCode);
                    if (!cancelled) setPhase({ kind: 'verify-success' });
                } else if (mode === 'resetPassword') {
                    const email = await verifyPasswordResetCode(auth, oobCode);
                    if (!cancelled) setPhase({ kind: 'reset-form', email });
                } else {
                    if (!cancelled) setPhase({ kind: 'error', message: 'Desteklenmeyen işlem.' });
                }
            } catch (err: any) {
                if (!cancelled) setPhase({ kind: 'error', message: mapAuthError(err?.code) });
            }
        })();

        return () => { cancelled = true; };
    }, [auth, mode, oobCode]);

    const handleResetSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (phase.kind !== 'reset-form' || !auth) return;
        if (newPassword.length < 6) {
            toast({ variant: 'destructive', title: 'Hata', description: 'Şifre en az 6 karakter olmalıdır.' });
            return;
        }
        if (newPassword !== newPasswordConfirm) {
            toast({ variant: 'destructive', title: 'Hata', description: 'Şifreler uyuşmuyor.' });
            return;
        }
        setIsSubmitting(true);
        try {
            await confirmPasswordReset(auth, oobCode, newPassword);
            try {
                await signInWithEmailAndPassword(auth, phase.email, newPassword);
            } catch {
                // Auto-login başarısız olursa kullanıcıyı login sayfasına yönlendiririz.
            }
            setPhase({ kind: 'reset-success' });
        } catch (err: any) {
            toast({ variant: 'destructive', title: 'Hata', description: mapAuthError(err?.code) });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12">
            <div className="mb-8">
                <HangelLogo className="text-3xl" />
            </div>
            <Card className="w-full max-w-md rounded-3xl shadow-xl border-none">
                {phase.kind === 'loading' && (
                    <CardContent className="py-16 flex flex-col items-center gap-4">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground">İşleniyor...</p>
                    </CardContent>
                )}

                {phase.kind === 'verify-success' && (
                    <>
                        <CardHeader className="text-center space-y-3 pt-10">
                            <div className="mx-auto w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
                                <CheckCircle2 className="h-7 w-7 text-green-600" />
                            </div>
                            <CardTitle className="text-xl font-black">E-posta doğrulandı</CardTitle>
                            <CardDescription>Hesabınız aktif. Uygulamayı kullanmaya başlayabilirsiniz.</CardDescription>
                        </CardHeader>
                        <CardContent className="pb-10">
                            <Button
                                className="w-full h-12 rounded-2xl font-black"
                                onClick={() => router.push('/market')}
                            >
                                Uygulamaya dön
                            </Button>
                        </CardContent>
                    </>
                )}

                {phase.kind === 'reset-form' && (
                    <>
                        <CardHeader className="text-center space-y-3 pt-10">
                            <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                                <KeyRound className="h-7 w-7 text-primary" />
                            </div>
                            <CardTitle className="text-xl font-black">Yeni şifre belirleyin</CardTitle>
                            <CardDescription>{phase.email}</CardDescription>
                        </CardHeader>
                        <CardContent className="pb-10">
                            <form onSubmit={handleResetSubmit} className="space-y-5">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 block text-left">
                                        Yeni Şifre *
                                    </Label>
                                    <Input
                                        type="password"
                                        placeholder="En az 6 karakter"
                                        required
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        minLength={6}
                                        className="h-12 rounded-xl bg-card border-none shadow-sm"
                                        autoFocus
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 block text-left">
                                        Şifre Tekrar *
                                    </Label>
                                    <Input
                                        type="password"
                                        placeholder="Şifrenizi tekrar girin"
                                        required
                                        value={newPasswordConfirm}
                                        onChange={(e) => setNewPasswordConfirm(e.target.value)}
                                        minLength={6}
                                        className="h-12 rounded-xl bg-card border-none shadow-sm"
                                    />
                                </div>
                                <Button type="submit" className="w-full h-14 rounded-2xl text-base font-black shadow-xl" disabled={isSubmitting}>
                                    {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Şifreyi Güncelle'}
                                </Button>
                            </form>
                        </CardContent>
                    </>
                )}

                {phase.kind === 'reset-success' && (
                    <>
                        <CardHeader className="text-center space-y-3 pt-10">
                            <div className="mx-auto w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
                                <MailCheck className="h-7 w-7 text-green-600" />
                            </div>
                            <CardTitle className="text-xl font-black">Şifreniz güncellendi</CardTitle>
                            <CardDescription>Giriş yapıldı, devam edebilirsiniz.</CardDescription>
                        </CardHeader>
                        <CardContent className="pb-10">
                            <Button
                                className="w-full h-12 rounded-2xl font-black"
                                onClick={() => router.push('/market')}
                            >
                                Uygulamaya dön
                            </Button>
                        </CardContent>
                    </>
                )}

                {phase.kind === 'error' && (
                    <>
                        <CardHeader className="text-center space-y-3 pt-10">
                            <div className="mx-auto w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
                                <AlertTriangle className="h-7 w-7 text-red-600" />
                            </div>
                            <CardTitle className="text-xl font-black">Bir sorun oluştu</CardTitle>
                            <CardDescription>{phase.message}</CardDescription>
                        </CardHeader>
                        <CardContent className="pb-10">
                            <Button
                                className="w-full h-12 rounded-2xl font-black"
                                onClick={() => router.push('/login/selection')}
                            >
                                Giriş sayfasına dön
                            </Button>
                        </CardContent>
                    </>
                )}
            </Card>
        </div>
    );
}

export default function AuthActionPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        }>
            <ActionInner />
        </Suspense>
    );
}
