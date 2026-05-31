'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { Loader2, Sparkles } from 'lucide-react';

import { useUser, useFirestore } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { HangelLogo } from '@/components/icons';
import { COLLECTIONS } from '@/firebase/collections';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/components/providers/language-provider';

type IntentKey =
  | 'donate'
  | 'volunteer'
  | 'blood'
  | 'follow_csr'
  | 'discover_ngos'
  | 'emergency'
  | 'student_clubs'
  | 'library'
  | 'browse_only';

const INTENT_PATHS: Partial<Record<IntentKey, string>> = {
  donate: '/settings/ngo-selection',
  volunteer: '/settings/volunteer',
  blood: '/settings/emergency',
  discover_ngos: '/ngos',
  emergency: '/settings/emergency',
  student_clubs: '/settings/education',
};
const INTENT_KEYS: IntentKey[] = [
  'donate', 'volunteer', 'blood', 'follow_csr', 'discover_ngos',
  'emergency', 'student_clubs', 'library', 'browse_only',
];

export default function WelcomePage() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [step, setStep] = useState<'welcome' | 'intents'>('welcome');
  const [selected, setSelected] = useState<Set<IntentKey>>(new Set());
  const [saving, setSaving] = useState(false);

  if (isUserLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!user) {
    router.replace('/login/selection');
    return null;
  }

  const toggle = (key: IntentKey) => {
    setSelected((prev) => {
      const next = new Set(prev);
      // browse_only diğerleri ile birlikte seçilemez
      if (key === 'browse_only') {
        if (next.has('browse_only')) next.delete('browse_only');
        else { next.clear(); next.add('browse_only'); }
        return next;
      }
      if (next.has('browse_only')) next.delete('browse_only');
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const submit = async () => {
    if (!firestore || !user) return;
    if (selected.size === 0) {
      toast({ variant: 'destructive', title: t('welcome.atLeastOne'), description: t('welcome.atLeastOneDesc') });
      return;
    }
    setSaving(true);
    try {
      const intents = Array.from(selected);
      await updateDoc(doc(firestore, COLLECTIONS.users, user.uid), {
        'preferences.intents': intents,
        'preferences.intentsSelectedAt': serverTimestamp(),
      });
      // İlk seçili intent'in nextPath'ı varsa oraya, yoksa /market
      const firstWithPath = INTENT_KEYS.find((k) => selected.has(k) && INTENT_PATHS[k]);
      router.replace((firstWithPath && INTENT_PATHS[firstWithPath]) ?? '/market');
    } catch (e) {
      toast({ variant: 'destructive', title: t('welcome.saveError'), description: e instanceof Error ? e.message : 'Bilinmeyen hata.' });
    } finally {
      setSaving(false);
    }
  };

  if (step === 'welcome') {
    return (
      <div className="min-h-dvh bg-secondary flex items-center justify-center p-4">
        <Card className="w-full max-w-sm rounded-[2.5rem] shadow-2xl border-none overflow-hidden">
          <CardContent className="pt-10 pb-8 px-6 sm:px-8 space-y-6">
            <div className="text-center space-y-3">
              <div className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-10 w-10 text-primary" />
              </div>
              <HangelLogo className="text-2xl mx-auto" />
              <h1 className="text-2xl font-black tracking-tight">{t('welcome.title')}</h1>
            </div>
            <div className="space-y-3 text-sm leading-relaxed text-foreground/90">
              <p>{t('welcome.assistantIntro')}</p>
              <p>{t('welcome.assistantRole')}</p>
              <p>{t('welcome.assistantDesc')}</p>
              <p className="font-bold">{t('welcome.assistantInvite')}</p>
            </div>
            <Button
              onClick={() => setStep('intents')}
              className="w-full h-12 rounded-xl font-bold"
            >
              {t('welcome.startButton')}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-secondary flex items-start justify-center p-4 pt-8">
      <Card className="w-full max-w-md rounded-[2.5rem] shadow-2xl border-none overflow-hidden">
        <CardContent className="pt-8 pb-8 px-5 sm:px-7 space-y-5">
          <div className="text-center space-y-2">
            <h2 className="text-xl font-black tracking-tight">{t('welcome.intentTitle')}</h2>
            <p className="text-xs text-muted-foreground">{t('welcome.intentSubtitle')}</p>
          </div>
          <div className="space-y-2">
            {INTENT_KEYS.map((key) => {
              const checked = selected.has(key);
              const isBrowse = key === 'browse_only';
              return (
                <label
                  key={key}
                  className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    checked ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
                  }`}
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={() => toggle(key)}
                    className="mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold leading-snug">{t(`welcome.intents.${key}`)}</p>
                    {isBrowse && (
                      <p className="text-[11px] text-muted-foreground mt-1 leading-snug">{t('welcome.intents.browseOnlyNote')}</p>
                    )}
                  </div>
                </label>
              );
            })}
          </div>
          <Button
            onClick={submit}
            disabled={saving || selected.size === 0}
            className="w-full h-12 rounded-xl font-bold"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : t('welcome.submitButton')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
