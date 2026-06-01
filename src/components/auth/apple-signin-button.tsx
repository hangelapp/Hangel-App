'use client';

/**
 * Sign in with Apple butonu — sadece iOS Capacitor uygulamasında render olur.
 *
 * Apple App Store Review Guideline 4.8 gereği (Google login eklendiğinde)
 * Sign in with Apple zorunlu olur. Hangel'in Google login eklemesinden önce
 * proaktif olarak iOS'ta Apple Sign In sunuyoruz — onboarding'i hızlandırır
 * (kayıt formuna gerek yok, Apple ile 2 saniye).
 *
 * Web platformlarında null döner; web'de Apple OAuth Firebase popup ile
 * eklenmesi sonraki bir iteration. iPhone'da `apple-itunes-app` meta tag
 * zaten Safari'de "Open in App" banner gösteriyor, kullanıcı app'i açar +
 * Apple ile giriş yapar.
 */

import { useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Loader2 } from 'lucide-react';
import { signInWithCustomToken } from 'firebase/auth';

import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { signInWithAppleNative } from '@/lib/apple-signin';
import { useAuth } from '@/firebase';
import { EVENTS, logHangelEvent } from '@/lib/analytics';

interface Props {
  onComplete: (isNewUser: boolean) => void;
}

export function AppleSignInButton({ onComplete }: Props) {
  const { toast } = useToast();
  const auth = useAuth();
  const [loading, setLoading] = useState(false);

  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'ios') {
    return null;
  }

  const handleClick = async () => {
    setLoading(true);
    const result = await signInWithAppleNative();

    if (!result.ok) {
      setLoading(false);
      if (result.errorCode === 'APPLE_CANCELLED') return; // sessiz iptal
      toast({
        variant: 'destructive',
        title: 'Apple ile giriş başarısız',
        description: result.message ?? 'Bilinmeyen bir hata oluştu.',
      });
      return;
    }

    if (!result.customToken) {
      setLoading(false);
      toast({ variant: 'destructive', title: 'Hata', description: 'Custom token alınamadı.' });
      return;
    }

    try {
      await signInWithCustomToken(auth, result.customToken);
    } catch (e) {
      setLoading(false);
      toast({
        variant: 'destructive',
        title: 'Firebase oturum hatası',
        description: e instanceof Error ? e.message : 'Bilinmeyen hata.',
      });
      return;
    }

    // Analytics: Apple login (yeni vs mevcut kullanıcı segmentasyonu).
    logHangelEvent(EVENTS.login_apple, { is_new_user: Boolean(result.isNewUser) });
    if (result.isNewUser) {
      logHangelEvent(EVENTS.signup_complete, { provider: 'apple' });
    }

    setLoading(false);
    onComplete(result.isNewUser ?? false);
  };

  return (
    <div className="space-y-3 pb-2">
      <Button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="w-full h-12 rounded-2xl font-bold bg-black text-white hover:bg-neutral-800"
      >
        {loading
          ? <Loader2 className="h-4 w-4 animate-spin" />
          : <>
              <AppleLogo className="mr-2 h-5 w-5" />
              Apple ile devam et
            </>
        }
      </Button>
      <div className="relative flex items-center">
        <div className="flex-grow border-t border-muted-foreground/20" />
        <span className="flex-shrink mx-3 text-[10px] uppercase tracking-wider text-muted-foreground">veya</span>
        <div className="flex-grow border-t border-muted-foreground/20" />
      </div>
    </div>
  );
}

function AppleLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.08zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  );
}
