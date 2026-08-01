'use client';

import React, { useEffect, useState } from 'react';
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
import { getCurrentPositionUnified } from '@/lib/native-geolocation';
import { maybeRequestAttPermission } from '@/lib/native-att';
import { registerNativePushToken } from '@/lib/native-push';
import { requestContactsPermission } from '@/lib/native-contacts-permission';
import { trackOnboardingStep } from '@/lib/onboarding-analytics';
import { Input } from '@/components/ui/input';
import { allProvinces } from '@/lib/data';

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
// NOT: Konum izni intent seçimine bakılmaksızın HER welcome submit'te
// istenir. Etkinlik/gönüllülük aktivitelerini kişisel konum bazlı sunmak
// için kritik (yakın STK, etkinlik, kan ilanı, acil çağrı).
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
  const [city, setCity] = useState('');
  const [saving, setSaving] = useState(false);

  // Intent (amaç) ekranı görüntülendiğinde analitik 'view' olayı.
  useEffect(() => {
    if (step === 'intents') trackOnboardingStep(firestore, 'intent', 'view');
  }, [step, firestore]);

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
      // Şehir girildiyse (il listesinde geçerli eşleşme) profile yaz. Dot-path:
      // updateDoc nested objeyi REPLACE eder, bu yüzden diğer address alanlarını
      // ezmemek için tek tek path yazılır. Profil %17→ yükseltir + il/ilçe mail
      // hedeflemesini açar (2026-07 UX raporu).
      const matchedCity = allProvinces.find((p) => p.toLocaleLowerCase('tr') === city.trim().toLocaleLowerCase('tr'));
      const cityFields = matchedCity ? { 'personalInfo.address.city': matchedCity } : {};
      await updateDoc(doc(firestore, COLLECTIONS.users, user.uid), {
        'preferences.intents': intents,
        'preferences.intentsSelectedAt': serverTimestamp(),
        ...cityFields,
      });
      // Konum + ATT + Push + Contacts izinleri paralel iste (her zaman, fail open).
      // - Konum: yakın etkinlik, kan ilanı, acil çağrı için
      // - ATT: Firebase Analytics IDFA için Apple zorunlu prompt
      // - Push: bildirim akışı (FCM token register, kullanıcı reddederse de devam)
      // - Contacts: rehberde Hangel kullanıcılarını eşleştirmek için
      //   (iOS Settings → Hangel'da görünmesi için bu çağrı şart)
      await Promise.all([
        getCurrentPositionUnified().catch(() => null),
        maybeRequestAttPermission().catch(() => null),
        registerNativePushToken(user.uid).catch(() => null),
        requestContactsPermission().catch(() => null),
      ]);
      trackOnboardingStep(firestore, 'intent', 'complete', { intents });
      // İlk seçili intent'in nextPath'ı varsa oraya, yoksa /market
      const firstWithPath = INTENT_KEYS.find((k) => selected.has(k) && INTENT_PATHS[k]);
      router.replace((firstWithPath && INTENT_PATHS[firstWithPath]) ?? '/market');
    } catch (e) {
      toast({ variant: 'destructive', title: t('welcome.saveError'), description: e instanceof Error ? e.message : t('welcomeExtra.unknownError') });
    } finally {
      setSaving(false);
    }
  };

  if (step === 'welcome') {
    return (
      <div className="min-h-dvh bg-secondary flex items-center justify-center p-4 animate-in fade-in duration-500">
        <Card className="w-full max-w-sm rounded-[2.5rem] shadow-2xl border-none overflow-hidden animate-in zoom-in-95 duration-500">
          <CardContent className="pt-10 pb-8 px-6 sm:px-8 space-y-6">
            {/* Progress: 1/2 */}
            <div className="flex items-center gap-1.5 justify-center">
              <div className="h-1.5 w-12 rounded-full bg-primary" />
              <div className="h-1.5 w-12 rounded-full bg-muted" />
            </div>
            <div className="text-center space-y-3">
              <div className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
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
    <div className="min-h-dvh bg-secondary flex items-start justify-center p-4 pt-8 animate-in fade-in duration-300">
      <Card className="w-full max-w-md rounded-[2.5rem] shadow-2xl border-none overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
        <CardContent className="pt-8 pb-8 px-5 sm:px-7 space-y-5">
          {/* Progress: 2/2 */}
          <div className="flex items-center gap-1.5 justify-center">
            <div className="h-1.5 w-12 rounded-full bg-primary" />
            <div className="h-1.5 w-12 rounded-full bg-primary" />
          </div>
          <div className="text-center space-y-2">
            <h2 className="text-xl font-black tracking-tight">{t('welcome.intentTitle')}</h2>
            <p className="text-xs text-muted-foreground">{t('welcome.intentSubtitle')}</p>
            {/* Seçim sayacı */}
            {selected.size > 0 && (
              <p className="text-[11px] text-primary font-bold">{selected.size} {t('welcomeExtra.selectionSuffix')}</p>
            )}
          </div>

          {/* Şehir — isteğe bağlı ama teşvikli. Yakın etkinlik/STK/kan çağrısını
              gösterebilmek + size özel içerik için. Zorunlu değil (sürtünmesiz). */}
          <div className="space-y-1.5">
            <label htmlFor="welcome-city" className="text-xs font-semibold text-foreground/80">
              Hangi şehirdesin? <span className="font-normal text-muted-foreground">(size yakın fırsatları göstermek için)</span>
            </label>
            <Input
              id="welcome-city"
              list="welcome-province-list"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Örn. İstanbul"
              className="h-11 rounded-xl"
            />
            <datalist id="welcome-province-list">
              {allProvinces.map((p) => <option key={p} value={p} />)}
            </datalist>
          </div>

          <div className="space-y-2">
            {INTENT_KEYS.map((key) => {
              const checked = selected.has(key);
              const isBrowse = key === 'browse_only';
              // Form süresi label'ı varsa göster (yalnızca form gerektiren intent'ler için)
              const timeKey = `welcome.intentTimes.${key}`;
              const timeLabel = t(timeKey);
              const hasTime = timeLabel !== timeKey;
              return (
                <label
                  key={key}
                  className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all duration-200 active:scale-[0.98] ${
                    checked ? 'border-primary bg-primary/10 shadow-sm scale-[1.02]' : 'border-border hover:border-primary/40 hover:bg-accent/30'
                  }`}
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={() => toggle(key)}
                    className="mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold leading-snug">{t(`welcome.intents.${key}`)}</p>
                    {hasTime && (
                      <p className="text-[10px] text-primary/70 mt-0.5 font-medium">{timeLabel}</p>
                    )}
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
          {/* Sürtünmesiz onboarding: kullanıcı amaç seçmeden de doğrudan ana akışa
              (/market) girebilir. Zorunlu zincire hapsolmaz. */}
          <button
            type="button"
            onClick={() => {
              trackOnboardingStep(firestore, 'intent', 'skip');
              router.replace('/market');
            }}
            className="w-full text-center text-xs font-bold text-muted-foreground underline underline-offset-4 disabled:opacity-50"
            disabled={saving}
          >
            Şimdilik geç
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
