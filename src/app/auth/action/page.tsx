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
import { useTranslation } from '@/components/providers/language-provider';

type Phase =
    | { kind: 'loading' }
    | { kind: 'verify-success' }
    | { kind: 'reset-form'; email: string }
    | { kind: 'reset-success' }
    | { kind: 'error'; message: string };

function ActionInner() {
    const auth = useAuth();
    const router = useRouter();
    const params = useSearchParams();
    const { toast } = useToast();
    const { t } = useTranslation();

    const mapAuthError = (code: string | undefined): string => {
        switch (code) {
            case 'auth/invalid-action-code':
            case 'auth/expired-action-code':
                return t('authAction.errInvalidCode');
            case 'auth/user-disabled':
                return t('authAction.errDisabled');
            case 'auth/user-not-found':
                return t('authAction.errNotFound');
            case 'auth/weak-password':
                return t('authAction.errWeakPassword');
            default:
                return t('authAction.errGeneric');
        }
    };

    const mode = params.get('mode');
    const oobCode = params.get('oobCode') || '';

    const [phase, setPhase] = useState<Phase>({ kind: 'loading' });
    const [newPassword, setNewPassword] = useState('');
    const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!auth) return;
        if (!oobCode || !mode) {
            setPhase({ kind: 'error', message: t('authAction.errInvalidLink') });
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
                    if (!cancelled) setPhase({ kind: 'error', message: t('authAction.errUnsupported') });
                }
            } catch (err: unknown) {
                const code = (err as { code?: string } | null)?.code;
                if (!cancelled) setPhase({ kind: 'error', message: mapAuthError(code) });
            }
        })();

        return () => { cancelled = true; };
    }, [auth, mode, oobCode, t]);

    const handleResetSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (phase.kind !== 'reset-form' || !auth) return;
        if (newPassword.length < 6) {
            toast({ variant: 'destructive', title: t('common.errorTitle'), description: t('authAction.passwordTooShort') });
            return;
        }
        if (newPassword !== newPasswordConfirm) {
            toast({ variant: 'destructive', title: t('common.errorTitle'), description: t('authAction.passwordMismatch') });
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
        } catch (err: unknown) {
            const code = (err as { code?: string } | null)?.code;
            toast({ variant: 'destructive', title: t('common.errorTitle'), description: mapAuthError(code) });
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
                        <p className="text-sm text-muted-foreground">{t('authAction.processing')}</p>
                    </CardContent>
                )}

                {phase.kind === 'verify-success' && (
                    <>
                        <CardHeader className="text-center space-y-3 pt-10">
                            <div className="mx-auto w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
                                <CheckCircle2 className="h-7 w-7 text-green-600" />
                            </div>
                            <CardTitle className="text-xl font-black">{t('authAction.emailVerifiedTitle')}</CardTitle>
                            <CardDescription>{t('authAction.emailVerifiedDesc')}</CardDescription>
                        </CardHeader>
                        <CardContent className="pb-10">
                            <Button
                                className="w-full h-12 rounded-2xl font-black"
                                onClick={() => router.push('/market')}
                            >
                                {t('authAction.returnToApp')}
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
                            <CardTitle className="text-xl font-black">{t('authAction.setNewPassword')}</CardTitle>
                            <CardDescription>{phase.email}</CardDescription>
                        </CardHeader>
                        <CardContent className="pb-10">
                            <form onSubmit={handleResetSubmit} className="space-y-5">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 block text-left">
                                        {t('authAction.newPasswordLabel')}
                                    </Label>
                                    <Input
                                        type="password"
                                        placeholder={t('authAction.passwordMin')}
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
                                        {t('authAction.passwordRepeat')}
                                    </Label>
                                    <Input
                                        type="password"
                                        placeholder={t('authAction.passwordRepeatPh')}
                                        required
                                        value={newPasswordConfirm}
                                        onChange={(e) => setNewPasswordConfirm(e.target.value)}
                                        minLength={6}
                                        className="h-12 rounded-xl bg-card border-none shadow-sm"
                                    />
                                </div>
                                <Button type="submit" className="w-full h-14 rounded-2xl text-base font-black shadow-xl" disabled={isSubmitting}>
                                    {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : t('authAction.updatePassword')}
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
                            <CardTitle className="text-xl font-black">{t('authAction.passwordUpdatedTitle')}</CardTitle>
                            <CardDescription>{t('authAction.passwordUpdatedDesc')}</CardDescription>
                        </CardHeader>
                        <CardContent className="pb-10">
                            <Button
                                className="w-full h-12 rounded-2xl font-black"
                                onClick={() => router.push('/market')}
                            >
                                {t('authAction.returnToApp')}
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
                            <CardTitle className="text-xl font-black">{t('authAction.errorTitle')}</CardTitle>
                            <CardDescription>{phase.message}</CardDescription>
                        </CardHeader>
                        <CardContent className="pb-10">
                            <Button
                                className="w-full h-12 rounded-2xl font-black"
                                onClick={() => router.push('/login/selection')}
                            >
                                {t('authAction.backToLogin')}
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
