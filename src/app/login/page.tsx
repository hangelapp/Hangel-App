'use client';

import { Button } from '@/components/ui/button';
import { HangelLogo } from '@/components/icons';
import { useRouter } from 'next/navigation';
import React from 'react';
import Link from 'next/link';
import { useTranslation } from '@/components/providers/language-provider';

export default function LoginPage() {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-6 text-center space-y-12">
      <div className="space-y-4">
        <HangelLogo className="text-6xl" />
        <h1 className="text-3xl font-bold font-headline tracking-tight text-foreground max-w-sm mx-auto leading-tight">
          {t('title')}
        </h1>
        <p className="text-muted-foreground text-lg max-w-xs mx-auto">
          {t('subtitle')}
        </p>
      </div>

      <div className="w-full max-w-xs space-y-4">
        <Button asChild className="w-full h-12 text-base font-bold rounded-xl shadow-lg shadow-primary/20" size="lg">
          <Link href="/login/selection?action=login">{t('nav.login')}</Link>
        </Button>
        <Button asChild variant="outline" className="w-full h-12 text-base font-bold rounded-xl border-2" size="lg">
          <Link href="/login/selection?action=register">{t('nav.register')}</Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 w-full max-w-sm pt-8">
        <Link href="/about" className="text-sm text-muted-foreground hover:text-primary transition-colors">{t('nav.about')}</Link>
        <Link href="/support" className="text-sm text-muted-foreground hover:text-primary transition-colors">{t('nav.support')}</Link>
        <Link href="/ngo-onboarding" className="text-sm text-muted-foreground hover:text-primary transition-colors">{t('nav.ngoOnboarding')}</Link>
        <Link href="/merchant" className="text-sm text-muted-foreground hover:text-primary transition-colors">{t('nav.merchant')}</Link>
      </div>

      <footer className="pt-12 text-xs text-muted-foreground opacity-60">
        <p>© 2026 hangel Hub Inc.</p>
      </footer>
    </div>
  );
}
