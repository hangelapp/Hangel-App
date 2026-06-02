'use client';

/**
 * /link/[token]
 *
 * WhatsApp UTILITY template "hangel_device_link" CTA hedef sayfası.
 *
 * Akış:
 * 1. Path'ten token al
 * 2. /api/auth/whatsapp/device-link/[token] GET → { ok, customToken, isNewUser }
 * 3. signInWithCustomToken(auth, customToken)
 * 4. Başarılı → /market'e yönlendir
 *
 * Mevcut /auth/wa (welcome flow) akışından bağımsızdır. Welcome zinciri
 * tetiklemez (device-link akışı zaten üye varsayar).
 */
import { Suspense, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { signInWithCustomToken } from 'firebase/auth';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { useAuth } from '@/firebase';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/components/providers/language-provider';

type Status = 'loading' | 'success' | 'error';

function DeviceLinkInner() {
    const router = useRouter();
    const params = useParams<{ token: string | string[] }>();
    const auth = useAuth();
    const { t } = useTranslation();
    const [status, setStatus] = useState<Status>('loading');
    const [errorMessage, setErrorMessage] = useState<string>('');

    const rawToken = params?.token;
    const token = Array.isArray(rawToken) ? rawToken[0] : rawToken;

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setErrorMessage(t('authWa.missingLink'));
            return;
        }
        if (!auth) return;
        let cancelled = false;
        (async () => {
            try {
                const res = await fetch(`/api/auth/whatsapp/device-link/${encodeURIComponent(token)}`);
                const raw: unknown = await res.json().catch(() => null);
                const data = (raw && typeof raw === 'object') ? raw as Record<string, unknown> : {};
                if (cancelled) return;
                const ok = data.ok === true;
                const customToken = typeof data.customToken === 'string' ? data.customToken : '';
                if (!res.ok || !ok || !customToken) {
                    setStatus('error');
                    setErrorMessage(typeof data.message === 'string' ? data.message : t('authWa.verifyFailed'));
                    return;
                }
                await signInWithCustomToken(auth, customToken);
                if (cancelled) return;
                setStatus('success');
                setTimeout(() => router.push('/market'), 1200);
            } catch (e) {
                if (cancelled) return;
                setStatus('error');
                setErrorMessage(e instanceof Error ? e.message : t('authWa.unexpectedError'));
            }
        })();
        return () => { cancelled = true; };
    }, [token, auth, router, t]);

    return (
        <div className="min-h-dvh flex items-center justify-center bg-background p-6">
            <div className="max-w-sm w-full text-center space-y-6">
                {status === 'loading' && (
                    <>
                        <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary" />
                        <div className="space-y-2">
                            <p className="font-bold text-lg">{t('authWa.loadingTitle')}</p>
                            <p className="text-sm text-muted-foreground">{t('authWa.loadingDesc')}</p>
                        </div>
                    </>
                )}
                {status === 'success' && (
                    <>
                        <CheckCircle2 className="h-12 w-12 mx-auto text-green-600" />
                        <div className="space-y-2">
                            <p className="font-bold text-lg">{t('authWa.successTitle')}</p>
                            <p className="text-sm text-muted-foreground">{t('authWa.successDesc')}</p>
                        </div>
                    </>
                )}
                {status === 'error' && (
                    <>
                        <XCircle className="h-12 w-12 mx-auto text-destructive" />
                        <div className="space-y-2">
                            <p className="font-bold text-lg">{t('authWa.errorTitle')}</p>
                            <p className="text-sm text-muted-foreground">{errorMessage}</p>
                        </div>
                        <Button asChild className="w-full">
                            <Link href="/login/selection?action=register">{t('authWa.requestNew')}</Link>
                        </Button>
                    </>
                )}
            </div>
        </div>
    );
}

export default function DeviceLinkPage() {
    return (
        <Suspense fallback={
            <div className="min-h-dvh flex items-center justify-center bg-background p-6">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        }>
            <DeviceLinkInner />
        </Suspense>
    );
}
