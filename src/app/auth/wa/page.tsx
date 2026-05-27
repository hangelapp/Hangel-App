'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signInWithCustomToken } from 'firebase/auth';
import { useAuth } from '@/firebase';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

function WhatsAppLinkAuthInner() {
    const router = useRouter();
    const params = useSearchParams();
    const auth = useAuth();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [errorMessage, setErrorMessage] = useState<string>('');
    const token = params.get('t');

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setErrorMessage('Bağlantı eksik.');
            return;
        }
        if (!auth) return;
        let cancelled = false;
        (async () => {
            try {
                const res = await fetch(`/api/auth/whatsapp/verify-link?t=${encodeURIComponent(token)}`);
                const data = await res.json().catch(() => ({}));
                if (cancelled) return;
                if (!res.ok || !data.ok || !data.customToken) {
                    setStatus('error');
                    setErrorMessage(data.message || 'Bağlantı doğrulanamadı.');
                    return;
                }
                await signInWithCustomToken(auth, data.customToken);
                if (cancelled) return;
                setStatus('success');
                // Yeni kullanıcı → onboarding zinciri (NGO seçimi, profil, vb.)
                // Mevcut kullanıcı → /timeline
                const isNewUser = Boolean(data.isNewUser);
                if (isNewUser && typeof window !== 'undefined') {
                    localStorage.setItem('onboardingStep', 'ngo-selection');
                }
                const target = isNewUser ? '/settings/ngo-selection' : '/timeline';
                setTimeout(() => router.push(target), 1200);
            } catch (e) {
                if (cancelled) return;
                setStatus('error');
                setErrorMessage(e instanceof Error ? e.message : 'Beklenmeyen hata.');
            }
        })();
        return () => { cancelled = true; };
    }, [token, auth, router]);

    return (
        <div className="min-h-dvh flex items-center justify-center bg-background p-6">
            <div className="max-w-sm w-full text-center space-y-6">
                {status === 'loading' && (
                    <>
                        <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary" />
                        <div className="space-y-2">
                            <p className="font-bold text-lg">WhatsApp bağlantın doğrulanıyor...</p>
                            <p className="text-sm text-muted-foreground">Birkaç saniye sürebilir.</p>
                        </div>
                    </>
                )}
                {status === 'success' && (
                    <>
                        <CheckCircle2 className="h-12 w-12 mx-auto text-green-600" />
                        <div className="space-y-2">
                            <p className="font-bold text-lg">Hoş geldin!</p>
                            <p className="text-sm text-muted-foreground">hangel hesabın hazır. Yönlendiriliyorsun...</p>
                        </div>
                    </>
                )}
                {status === 'error' && (
                    <>
                        <XCircle className="h-12 w-12 mx-auto text-destructive" />
                        <div className="space-y-2">
                            <p className="font-bold text-lg">Bağlantı çalışmadı</p>
                            <p className="text-sm text-muted-foreground">{errorMessage}</p>
                        </div>
                        <Button asChild className="w-full">
                            <Link href="/login/selection?action=register">Yeni Bağlantı İste</Link>
                        </Button>
                    </>
                )}
            </div>
        </div>
    );
}

export default function WhatsAppLinkAuth() {
    return (
        <Suspense fallback={
            <div className="min-h-dvh flex items-center justify-center bg-background p-6">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        }>
            <WhatsAppLinkAuthInner />
        </Suspense>
    );
}
