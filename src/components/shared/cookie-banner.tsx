'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Cookie, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { contractsData } from '@/lib/contracts';
import { useUser } from '@/firebase';

const STORAGE_KEY = 'hangel.cookie-consent';

type Consent = 'accepted' | 'rejected';

export function CookieBanner() {
    const [visible, setVisible] = useState(false);
    const { user, isUserLoading } = useUser();

    useEffect(() => {
        if (isUserLoading) return;
        if (user) { setVisible(false); return; }
        try {
            const stored = window.localStorage.getItem(STORAGE_KEY);
            if (!stored) setVisible(true);
        } catch {
            setVisible(true);
        }
    }, [user, isUserLoading]);

    const handleConsent = (consent: Consent) => {
        try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ consent, at: new Date().toISOString() }));
        } catch {
            // localStorage may be unavailable (private mode); banner still closes
        }
        setVisible(false);
    };

    if (!visible) return null;

    const policy = contractsData.find(c => c.slug === 'cerez-politikasi');
    const policyTitle = policy?.title || 'Çerez Politikası';

    return (
        <div
            role="dialog"
            aria-label={policyTitle}
            className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-md z-50 animate-in slide-in-from-bottom-4"
            style={{ bottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
        >
            <div className="bg-card border rounded-2xl shadow-2xl p-4 backdrop-blur-xl">
                <div className="flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-primary/10 text-primary shrink-0">
                        <Cookie className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm leading-tight">{policyTitle}</p>
                        <p className="text-[12px] text-muted-foreground leading-snug mt-1">
                            Hangel deneyimini iyileştirmek için analitik ve işlevsel çerezler kullanırız.{' '}
                            <Link href="/settings/contracts/cerez-politikasi" className="font-bold text-primary underline">
                                Detayları incele
                            </Link>
                            .
                        </p>
                        <div className="flex items-center gap-2 mt-3">
                            <Button size="sm" className="h-8 rounded-xl flex-1" onClick={() => handleConsent('accepted')}>
                                Kabul Et
                            </Button>
                            <Button size="sm" variant="outline" className="h-8 rounded-xl flex-1" onClick={() => handleConsent('rejected')}>
                                Reddet
                            </Button>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => handleConsent('rejected')}
                        aria-label="Kapat"
                        className="text-muted-foreground hover:text-foreground shrink-0 -m-1 p-1"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
