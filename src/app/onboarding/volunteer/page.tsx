'use client';

// ---------------------------------------------------------------------------
// Gönüllü Profil Onboarding Sihirbazı
// ---------------------------------------------------------------------------
// Yeni kullanıcıya birkaç adımda volunteerInfo'yu (interests, skills,
// availabilityDays/Times) + personalInfo.address.city doldurtur. 156 kullanıcının
// yalnız 5'i profilini doldurduğu için eşleşme motoru boş kalıyor — bu sihirbaz
// o boşluğu kapatmak için hızlı, mobil, Apple-temiz bir akış sunar.
//
// ÇAKIŞMA NOTU: Bu dosya tamamen yeni. Seçenek sabitleri paylaşılan kaynaklardan
// SALT-OKUNUR import edilir (dosyalar DEĞİŞTİRİLMEZ) — böylece eşleşme motoruyla
// (volunteer-matching.ts) birebir aynı string'ler kullanılır.

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import {
  ArrowLeft, ArrowRight, Check, Loader2, Sparkles, Heart, MapPin, CheckCircle2,
} from 'lucide-react';

import { useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { COLLECTIONS } from '@/firebase/collections';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

// Salt-okunur seçenek kaynakları — eşleşme motoruyla aynı sözlük.
import { INTERESTS, SKILLS } from '@/lib/volunteer-data';
import { allProvinces } from '@/lib/data';

// Müsaitlik seçenekleri — settings/volunteer AvailabilitySection ile aynı
// etiketler (matching availabilityDays/Times ile uyumlu tutulur).
const AVAILABILITY_DAYS = ['Hafta içi', 'Hafta sonu'] as const;
const AVAILABILITY_TIMES = ['Gündüz', 'Akşam'] as const;

type StepDef = {
  key: 'interests' | 'skills' | 'location' | 'summary';
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
};

const STEPS: StepDef[] = [
  { key: 'interests', title: 'İlgi alanların', subtitle: 'Hangi konular kalbine dokunuyor? Sana en uygun görevleri buna göre öneririz.', icon: Heart },
  { key: 'skills', title: 'Yetkinliklerin', subtitle: 'Neleri iyi yaparsın? STK’lar tam da bu becerileri arıyor.', icon: Sparkles },
  { key: 'location', title: 'Şehir & müsaitlik', subtitle: 'Nerede ve ne zaman gönüllü olabilirsin?', icon: MapPin },
  { key: 'summary', title: 'Özet', subtitle: 'Son bir göz at, hazırsan kaydedelim.', icon: CheckCircle2 },
];

// Çip (chip) seçim bileşeni — çoklu seçim, dokunmatik hedefi geniş.
function ChipGroup({
  options,
  selected,
  onToggle,
}: {
  options: readonly string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const isOn = selected.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onToggle(opt)}
            aria-pressed={isOn}
            className={[
              'inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition-all active:scale-[0.97]',
              isOn
                ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                : 'border-border bg-background text-foreground hover:bg-accent/40',
            ].join(' ')}
          >
            {isOn && <Check className="h-3.5 w-3.5" />}
            {opt}
          </button>
        );
      })}
    </div>
  );
}

export default function VolunteerOnboardingPage() {
  const router = useRouter();
  const { user: authUser, isUserLoading } = useUser();
  const db = useFirestore();

  const [stepIndex, setStepIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Form durumu
  const [interests, setInterests] = useState<string[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [city, setCity] = useState('');
  const [availabilityDays, setAvailabilityDays] = useState<string[]>([]);
  const [availabilityTimes, setAvailabilityTimes] = useState<string[]>([]);

  const userDocRef = useMemoFirebase(() => {
    if (!db || !authUser) return null;
    return doc(db, COLLECTIONS.users, authUser.uid);
  }, [db, authUser]);

  const step = STEPS[stepIndex];
  const isLast = stepIndex === STEPS.length - 1;
  const progress = Math.round(((stepIndex + 1) / STEPS.length) * 100);

  const toggle = (setter: React.Dispatch<React.SetStateAction<string[]>>) => (value: string) =>
    setter((prev) => (prev.includes(value) ? prev.filter((x) => x !== value) : [...prev, value]));

  const cityOptions = useMemo(() => allProvinces.slice().sort((a, b) => a.localeCompare(b, 'tr')), []);

  const goNext = () => setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
  const goBack = () => setStepIndex((i) => Math.max(i - 1, 0));

  const handleSkip = () => {
    // Sihirbazı atla — kullanıcıyı gönüllülük akışına bırak (boş da olsa girebilsin).
    router.push('/volunteering');
  };

  const handleSave = async () => {
    if (!userDocRef) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      // MERGE yaz — mevcut personalInfo / volunteerInfo alanlarını ezmeden
      // yalnızca sihirbazın topladığı alanları günceller.
      await setDoc(
        userDocRef,
        {
          volunteerInfo: {
            interests,
            skills,
            availabilityDays,
            availabilityTimes,
            onboardingUpdatedAt: serverTimestamp(),
          },
          personalInfo: {
            address: {
              ...(city ? { city } : {}),
            },
          },
        },
        { merge: true },
      );
      // Eşleşmeler artık dolu gelir.
      router.push('/volunteering');
    } catch (err) {
      setSaveError(err instanceof Error ? err.message.slice(0, 200) : 'Kayıt sırasında bir hata oluştu.');
      setIsSaving(false);
    }
  };

  if (isUserLoading) {
    return (
      <div className="flex items-center justify-center min-h-dvh">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const StepIcon = step.icon;

  return (
    <div
      className="mx-auto flex min-h-dvh w-full max-w-xl flex-col px-4"
      style={{
        paddingTop: 'max(1rem, env(safe-area-inset-top))',
        paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
      }}
    >
      {/* Üst çubuk: geri + ilerleme + atla */}
      <div className="flex items-center gap-3 py-3">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="-ml-2 shrink-0"
          onClick={stepIndex === 0 ? handleSkip : goBack}
          aria-label="Geri"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <Progress value={progress} className="h-2" />
        </div>
        <button
          type="button"
          onClick={handleSkip}
          className="shrink-0 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          Atla
        </button>
      </div>

      <p className="pb-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Adım {stepIndex + 1} / {STEPS.length}
      </p>

      {/* Başlık */}
      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <StepIcon className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">{step.title}</h1>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{step.subtitle}</p>
        </div>
      </div>

      {/* İçerik */}
      <div className="flex-1">
        {step.key === 'interests' && (
          <ChipGroup options={INTERESTS} selected={interests} onToggle={toggle(setInterests)} />
        )}

        {step.key === 'skills' && (
          <ChipGroup options={SKILLS} selected={skills} onToggle={toggle(setSkills)} />
        )}

        {step.key === 'location' && (
          <div className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="onb-city" className="text-sm font-semibold text-foreground">
                Şehir
              </label>
              <select
                id="onb-city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="h-12 w-full rounded-xl border border-border bg-background px-3 text-base text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="">Şehir seç…</option>
                {cityOptions.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold text-foreground">Hangi günlerde uygunsun?</p>
              <ChipGroup options={AVAILABILITY_DAYS} selected={availabilityDays} onToggle={toggle(setAvailabilityDays)} />
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold text-foreground">Hangi saatlerde uygunsun?</p>
              <ChipGroup options={AVAILABILITY_TIMES} selected={availabilityTimes} onToggle={toggle(setAvailabilityTimes)} />
            </div>
          </div>
        )}

        {step.key === 'summary' && (
          <div className="space-y-3">
            <SummaryCard label="İlgi alanları" values={interests} />
            <SummaryCard label="Yetkinlikler" values={skills} />
            <SummaryCard label="Şehir" values={city ? [city] : []} />
            <SummaryCard label="Uygun günler" values={availabilityDays} />
            <SummaryCard label="Uygun saatler" values={availabilityTimes} />
            {saveError && (
              <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{saveError}</p>
            )}
          </div>
        )}
      </div>

      {/* Alt gezinme */}
      <div className="sticky bottom-0 mt-6 flex gap-3 bg-gradient-to-t from-background via-background to-transparent pt-4 pb-2">
        {stepIndex > 0 && (
          <Button type="button" variant="outline" size="lg" className="flex-1 rounded-2xl font-bold" onClick={goBack}>
            <ArrowLeft className="mr-1.5 h-4 w-4" /> Geri
          </Button>
        )}
        {!isLast ? (
          <Button type="button" size="lg" className="flex-1 rounded-2xl font-black shadow-lg" onClick={goNext}>
            İleri <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>
        ) : (
          <Button
            type="button"
            size="lg"
            className="flex-1 rounded-2xl font-black shadow-lg"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Kaydediliyor…
              </>
            ) : (
              <>
                Kaydet <Check className="ml-1.5 h-4 w-4" />
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ label, values }: { label: string; values: string[] }) {
  return (
    <Card className="rounded-2xl">
      <CardContent className="p-4">
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
        {values.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {values.map((v) => (
              <Badge key={v} variant="secondary" className="rounded-full">
                {v}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-sm italic text-muted-foreground">Seçilmedi (atlanabilir)</p>
        )}
      </CardContent>
    </Card>
  );
}
