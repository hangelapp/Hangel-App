'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  countryPhoneCodes, allProvinces, districtsData, neighborhoodsData,
} from '@/lib/data';
import {
  PROFESSIONS, SKILLS, DAILY_SKILLS, INTERESTS,
  LANGUAGES, LANGUAGE_LEVELS, SIGN_LANGUAGES,
  DRIVER_LICENSES, CERTIFICATES_BY_CATEGORY,
  PROGRAMS_BY_CATEGORY, VISAS,
} from '@/lib/volunteer-data';
import {
  ArrowLeft, Loader2, Sparkles, Languages as LanguagesIcon,
  FileText, Plane, Briefcase, HeartPulse, Phone,
  Car, Award, MapPin, ChevronDown, Search, X,
  Clock, ShieldCheck, Heart,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';

// ---------------------------------------------------------------------------
// FilteredMultiSelect — searchable multi-select with optional categories
// ---------------------------------------------------------------------------
interface CategorizedOption { category: string; items: string[]; }

const FilteredMultiSelect = ({
  title,
  options,
  categorized,
  selected,
  onSelectedChange,
}: {
  title: string;
  options?: string[];
  categorized?: CategorizedOption[];
  selected: string[];
  onSelectedChange: (v: string[]) => void;
}) => {
  const [filter, setFilter] = useState('');
  const [open, setOpen] = useState(false);
  const allItems = useMemo(
    () => categorized ? categorized.flatMap(c => c.items) : (options ?? []),
    [options, categorized],
  );

  const toggle = (item: string) => {
    onSelectedChange(selected.includes(item) ? selected.filter(x => x !== item) : [...selected, item]);
  };

  const renderItems = (items: string[]) => {
    const q = filter.toLowerCase();
    const filtered = q ? items.filter(i => i.toLowerCase().includes(q)) : items;
    if (filtered.length === 0) return null;
    return filtered.map(item => (
      <label key={item} className="flex items-center gap-2 px-3 py-1.5 hover:bg-muted cursor-pointer rounded-sm text-sm">
        <Checkbox checked={selected.includes(item)} onCheckedChange={() => toggle(item)} />
        <span>{item}</span>
      </label>
    ));
  };

  return (
    <div className="space-y-2">
      <Label>{title}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-between text-left font-normal h-auto min-h-10">
            {selected.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {selected.map(item => (
                  <Badge key={item} variant="secondary" className="font-normal">{item}</Badge>
                ))}
              </div>
            ) : <span className="text-muted-foreground">{title} seçin...</span>}
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50 ml-2" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <div className="flex items-center border-b px-3">
            <Search className="h-4 w-4 shrink-0 opacity-50 mr-2" />
            <input
              className="flex h-9 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
              placeholder="Ara..."
              value={filter}
              onChange={e => setFilter(e.target.value)}
            />
            {filter && <X className="h-4 w-4 shrink-0 opacity-50 cursor-pointer" onClick={() => setFilter('')} />}
          </div>
          <div className="max-h-60 overflow-y-auto p-1">
            {categorized ? (
              categorized.map(cat => {
                const rows = renderItems(cat.items);
                if (!rows) return null;
                return (
                  <div key={cat.category}>
                    <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{cat.category}</p>
                    {rows}
                  </div>
                );
              })
            ) : renderItems(allItems)}
          </div>
          {selected.length > 0 && (
            <div className="border-t p-2">
              <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground" onClick={() => onSelectedChange([])}>
                Seçimi Temizle ({selected.length})
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
};

// ---------------------------------------------------------------------------
// FilteredSingleSelect — searchable single-select with optional "Diğer"
// ---------------------------------------------------------------------------
const FilteredSingleSelect = ({
  title,
  options,
  value,
  onValueChange,
  withOther = false,
  otherValue = '',
  onOtherChange,
}: {
  title: string;
  options: string[];
  value: string;
  onValueChange: (v: string) => void;
  withOther?: boolean;
  otherValue?: string;
  onOtherChange?: (v: string) => void;
}) => {
  const [filter, setFilter] = useState('');
  const [open, setOpen] = useState(false);
  const isOther = value === 'Diğer';

  const filtered = useMemo(() => {
    const q = filter.toLowerCase();
    return q ? options.filter(o => o.toLowerCase().includes(q)) : options;
  }, [filter, options]);

  const select = (item: string) => {
    onValueChange(item);
    setOpen(false);
    setFilter('');
  };

  return (
    <div className="space-y-2">
      <Label>{title}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-between text-left font-normal h-10">
            <span className={value ? '' : 'text-muted-foreground'}>{value || `${title} seçin...`}</span>
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50 ml-2" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <div className="flex items-center border-b px-3">
            <Search className="h-4 w-4 shrink-0 opacity-50 mr-2" />
            <input
              className="flex h-9 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
              placeholder="Ara..."
              value={filter}
              onChange={e => setFilter(e.target.value)}
            />
            {filter && <X className="h-4 w-4 shrink-0 opacity-50 cursor-pointer" onClick={() => setFilter('')} />}
          </div>
          <div className="max-h-60 overflow-y-auto p-1">
            {filtered.map(item => (
              <button
                key={item}
                type="button"
                className={`w-full text-left px-3 py-1.5 text-sm rounded-sm hover:bg-muted ${value === item ? 'bg-muted font-medium' : ''}`}
                onClick={() => select(item)}
              >
                {item}
              </button>
            ))}
            {withOther && (
              <button
                type="button"
                className={`w-full text-left px-3 py-1.5 text-sm rounded-sm hover:bg-muted ${isOther ? 'bg-muted font-medium' : ''}`}
                onClick={() => select('Diğer')}
              >
                Diğer
              </button>
            )}
          </div>
        </PopoverContent>
      </Popover>
      {isOther && withOther && (
        <Input
          placeholder="Mesleğinizi yazın..."
          value={otherValue}
          onChange={e => onOtherChange?.(e.target.value)}
          className="mt-1"
        />
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// LanguageSelect — multi-select languages with per-language level picker
// ---------------------------------------------------------------------------
const LanguageSelect = ({
  selected,
  onSelectedChange,
  levels,
  onLevelChange,
}: {
  selected: string[];
  onSelectedChange: (v: string[]) => void;
  levels: Record<string, string>;
  onLevelChange: (lang: string, level: string) => void;
}) => {
  const [filter, setFilter] = useState('');
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = filter.toLowerCase();
    return q ? LANGUAGES.filter(l => l.toLowerCase().includes(q)) : LANGUAGES;
  }, [filter]);

  const toggle = (lang: string) => {
    onSelectedChange(selected.includes(lang) ? selected.filter(x => x !== lang) : [...selected, lang]);
  };

  return (
    <div className="space-y-2">
      <Label>Yabancı Diller</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-between text-left font-normal h-auto min-h-10">
            {selected.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {selected.map(lang => (
                  <Badge key={lang} variant="secondary" className="font-normal">{lang}</Badge>
                ))}
              </div>
            ) : <span className="text-muted-foreground">Dil seçin...</span>}
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50 ml-2" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <div className="flex items-center border-b px-3">
            <Search className="h-4 w-4 shrink-0 opacity-50 mr-2" />
            <input
              className="flex h-9 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
              placeholder="Dil ara..."
              value={filter}
              onChange={e => setFilter(e.target.value)}
            />
            {filter && <X className="h-4 w-4 shrink-0 opacity-50 cursor-pointer" onClick={() => setFilter('')} />}
          </div>
          <div className="max-h-60 overflow-y-auto p-1">
            {filtered.map(lang => (
              <label key={lang} className="flex items-center gap-2 px-3 py-1.5 hover:bg-muted cursor-pointer rounded-sm text-sm">
                <Checkbox checked={selected.includes(lang)} onCheckedChange={() => toggle(lang)} />
                <span>{lang}</span>
              </label>
            ))}
          </div>
          {selected.length > 0 && (
            <div className="border-t p-2">
              <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground" onClick={() => onSelectedChange([])}>
                Seçimi Temizle ({selected.length})
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>

      {selected.length > 0 && (
        <div className="space-y-2 pt-1">
          {selected.map(lang => (
            <div key={lang} className="flex items-center gap-2">
              <span className="text-sm flex-1">{lang}</span>
              <Select value={levels[lang] || ''} onValueChange={v => onLevelChange(lang, v)}>
                <SelectTrigger className="w-36 h-8 text-sm">
                  <SelectValue placeholder="Seviye..." />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGE_LEVELS.map(l => (
                    <SelectItem key={l} value={l}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function VolunteerSettingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user: authUser, isUserLoading } = useUser();
  const db = useFirestore();

  const [isOnboarding, setIsOnboarding] = useState(false);

  // ---- form state ----
  const [profession, setProfession] = useState('');
  const [professionOther, setProfessionOther] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [dailySkills, setDailySkills] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [languages, setLanguages] = useState<string[]>([]);
  const [languageLevels, setLanguageLevels] = useState<Record<string, string>>({});
  const [signLanguages, setSignLanguages] = useState<string[]>([]);
  const [certificates, setCertificates] = useState<string[]>([]);
  const [driverLicenses, setDriverLicenses] = useState<string[]>([]);
  const [programs, setPrograms] = useState<string[]>([]);
  const [visas, setVisas] = useState<string[]>([]);
  const [isMuhtar, setIsMuhtar] = useState(false);
  const [muhtarIl, setMuhtarIl] = useState('');
  const [muhtarIlce, setMuhtarIlce] = useState('');
  const [muhtarMahalle, setMuhtarMahalle] = useState('');

  // Existing emergency / education fields
  const [emergencyContacts, setEmergencyContacts] = useState([{ name: '', phone: '' }, { name: '', phone: '' }]);
  const [emergencyAvailable, setEmergencyAvailable] = useState(false);
  const [hasChronicIllness, setHasChronicIllness] = useState(false);
  const [usesRegularMedication, setUsesRegularMedication] = useState(false);
  const [bloodType, setBloodType] = useState('');

  // Müsaitlik & çalışma şekli
  const [availabilityDays, setAvailabilityDays] = useState<string[]>([]);
  const [availabilityTimes, setAvailabilityTimes] = useState<string[]>([]);
  const [workModes, setWorkModes] = useState<string[]>([]);

  // Motivasyonlar (çok seçimli)
  const [motivations, setMotivations] = useState<string[]>([]);

  // Onaylar (zorunlu)
  const [consents, setConsents] = useState({
    contract: false,
    rights: false,
    ethics: false,
    socialImpact: false,
    privacy: false,
  });

  const userDocRef = useMemoFirebase(() => {
    if (!db || !authUser) return null;
    return doc(db, 'users', authUser.uid);
  }, [db, authUser]);

  const { data: userData, isLoading: isUserDataLoading } = useDoc(userDocRef);

  useEffect(() => {
    if (localStorage.getItem('onboardingStep') === 'volunteer') setIsOnboarding(true);
  }, []);

  useEffect(() => {
    if (!userData) return;
    const vi = (userData as any).volunteerInfo;
    if (!vi) return;

    if (vi.profession) {
      if (PROFESSIONS.includes(vi.profession)) {
        setProfession(vi.profession);
      } else if (vi.profession) {
        setProfession('Diğer');
        setProfessionOther(vi.profession);
      }
    }
    if (vi.professionOther) setProfessionOther(vi.professionOther);
    if (vi.skills) setSkills(vi.skills);
    if (vi.dailySkills) setDailySkills(vi.dailySkills);
    if (vi.interests) setInterests(vi.interests);
    if (vi.languages) setLanguages(vi.languages);
    if (vi.languageLevels) setLanguageLevels(vi.languageLevels);
    if (vi.signLanguages) setSignLanguages(vi.signLanguages);
    if (vi.certificates) setCertificates(vi.certificates);
    if (vi.driverLicenses) setDriverLicenses(vi.driverLicenses);
    if (vi.programs) setPrograms(vi.programs);
    if (vi.travelInfo?.visas) setVisas(vi.travelInfo.visas);
    if (vi.muhtarInfo) {
      setIsMuhtar(vi.muhtarInfo.isMuhtar ?? false);
      setMuhtarIl(vi.muhtarInfo.il ?? '');
      setMuhtarIlce(vi.muhtarInfo.ilce ?? '');
      setMuhtarMahalle(vi.muhtarInfo.mahalle ?? '');
    }
    if (vi.emergency?.emergencyContacts) {
      const ec = vi.emergency.emergencyContacts;
      setEmergencyContacts([
        ec[0] ?? { name: '', phone: '' },
        ec[1] ?? { name: '', phone: '' },
      ]);
    }
    if (typeof vi.emergency?.available === 'boolean') setEmergencyAvailable(vi.emergency.available);
    if (typeof vi.emergency?.hasChronicIllness === 'boolean') setHasChronicIllness(vi.emergency.hasChronicIllness);
    if (typeof vi.emergency?.usesRegularMedication === 'boolean') setUsesRegularMedication(vi.emergency.usesRegularMedication);
    if ((userData as any).personalInfo?.bloodType) setBloodType((userData as any).personalInfo.bloodType);

    if (Array.isArray(vi.availabilityDays)) setAvailabilityDays(vi.availabilityDays);
    if (Array.isArray(vi.availabilityTimes)) setAvailabilityTimes(vi.availabilityTimes);
    if (Array.isArray(vi.workModes)) setWorkModes(vi.workModes);
    if (Array.isArray(vi.motivations)) setMotivations(vi.motivations);
    if (vi.consents) setConsents(prev => ({ ...prev, ...vi.consents }));
  }, [userData]);

  const handleLevelChange = (lang: string, level: string) => {
    setLanguageLevels(prev => ({ ...prev, [lang]: level }));
  };

  const handleEmergencyContactChange = (index: number, field: 'name' | 'phone', value: string) => {
    setEmergencyContacts(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const ilceler = useMemo(() => muhtarIl ? (districtsData[muhtarIl] ?? []) : [], [muhtarIl]);
  const mahalleler = useMemo(
    () => (muhtarIl && muhtarIlce) ? ((neighborhoodsData as any)[muhtarIl]?.[muhtarIlce] ?? []) : [],
    [muhtarIl, muhtarIlce],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userDocRef) return;

    const requiredConsents: (keyof typeof consents)[] = ['contract', 'rights', 'ethics', 'socialImpact', 'privacy'];
    const missingConsent = requiredConsents.find(k => !consents[k]);
    if (missingConsent) {
      toast({
        variant: 'destructive',
        title: 'Onaylar Eksik',
        description: 'Tüm zorunlu Gönüllülük Beyanı maddelerini onaylamanız gerekir.',
      });
      return;
    }

    const finalProfession = profession === 'Diğer' ? professionOther : profession;

    const volunteerInfo = {
      profession: finalProfession,
      professionOther: profession === 'Diğer' ? professionOther : '',
      skills,
      dailySkills,
      interests,
      languages,
      languageLevels,
      signLanguages,
      certificates,
      driverLicenses,
      programs,
      travelInfo: { visas },
      muhtarInfo: { isMuhtar, il: muhtarIl, ilce: muhtarIlce, mahalle: muhtarMahalle },
      emergency: {
        emergencyContacts,
        available: emergencyAvailable,
        hasChronicIllness,
        usesRegularMedication,
      },
      availabilityDays,
      availabilityTimes,
      workModes,
      motivations,
      consents,
      consentsAcceptedAt: new Date().toISOString(),
    };

    const personalInfoPatch = bloodType
      ? { personalInfo: { ...((userData as any)?.personalInfo ?? {}), bloodType } }
      : {};

    updateDocumentNonBlocking(userDocRef, { volunteerInfo, ...personalInfoPatch });

    if (isOnboarding) {
      toast({ title: "Gönüllülük Bilgilerin Kaydedildi", description: "Şimdi bağış yapacağın STK'ları seçelim." });
      localStorage.setItem('onboardingStep', 'ngo-selection');
      router.push('/settings/ngo-selection');
    } else {
      toast({ title: "Bilgiler Güncellendi", description: "Değişiklikler kaydedildi." });
      router.push('/settings');
    }
  };

  if (isUserLoading || isUserDataLoading) {
    return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="p-4 space-y-6 animate-in fade-in-0 max-w-2xl mx-auto">
      <Button onClick={() => router.back()} variant="ghost" size="icon" className="mb-2 -ml-2">
        <ArrowLeft className="h-6 w-6" />
      </Button>
      <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-b border-primary/20 -mx-4 -mt-4 px-4 py-8 space-y-4 mb-6">
        <div className="max-w-2xl mx-auto space-y-4 text-center">
          <h2 className="text-3xl md:text-4xl font-black tracking-tight text-[#1d1d1f]">
            Yeteneklerinle topluma değer katmaya başla.
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed font-medium">
            Yeteneklerini ekle, hassasiyetlerine, yetkinliklerine ve konumuna uygun gönüllülük fırsatlarını keşfet. Kimse yalnız başına mücadele etmesin.
          </p>
          <Button asChild variant="outline" className="rounded-xl font-bold h-11 px-6">
            <Link href="/market">Daha Sonra</Link>
          </Button>
        </div>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>

        {/* Meslek */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Briefcase className="h-5 w-5 text-primary" /> Meslek</CardTitle></CardHeader>
          <CardContent>
            <FilteredSingleSelect
              title="Mesleğiniz"
              options={PROFESSIONS}
              value={profession}
              onValueChange={setProfession}
              withOther
              otherValue={professionOther}
              onOtherChange={setProfessionOther}
            />
          </CardContent>
        </Card>

        {/* Yetkinlikler & Hassasiyetler */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" /> Yetkinlikler & Hassasiyetler</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <FilteredMultiSelect
              title="Profesyonel Yetkinlikleriniz"
              options={SKILLS}
              selected={skills}
              onSelectedChange={setSkills}
            />
            <FilteredMultiSelect
              title="Sosyal Yetkinlikleriniz"
              options={DAILY_SKILLS}
              selected={dailySkills}
              onSelectedChange={setDailySkills}
            />
            <FilteredMultiSelect
              title="Sosyal Hassasiyetleriniz"
              options={INTERESTS}
              selected={interests}
              onSelectedChange={setInterests}
            />
          </CardContent>
        </Card>

        {/* Diller */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><LanguagesIcon className="h-5 w-5 text-primary" /> Diller</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <LanguageSelect
              selected={languages}
              onSelectedChange={setLanguages}
              levels={languageLevels}
              onLevelChange={handleLevelChange}
            />
            <FilteredMultiSelect
              title="Bildiğiniz İşaret Dili"
              options={SIGN_LANGUAGES}
              selected={signLanguages}
              onSelectedChange={setSignLanguages}
            />
          </CardContent>
        </Card>

        {/* Sertifika ve Belgeler */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Award className="h-5 w-5 text-primary" /> Sertifika ve Belgeler</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <FilteredMultiSelect
              title="Sertifikalar"
              categorized={CERTIFICATES_BY_CATEGORY}
              selected={certificates}
              onSelectedChange={setCertificates}
            />
          </CardContent>
        </Card>

        {/* Sürücü Belgesi */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Car className="h-5 w-5 text-primary" /> Sürücü Belgesi</CardTitle></CardHeader>
          <CardContent>
            <FilteredMultiSelect
              title="Sürücü Belgeniz"
              options={DRIVER_LICENSES}
              selected={driverLicenses}
              onSelectedChange={setDriverLicenses}
            />
          </CardContent>
        </Card>

        {/* Programlar */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-primary" /> Bildiğiniz Programlar</CardTitle></CardHeader>
          <CardContent>
            <FilteredMultiSelect
              title="Programlar"
              categorized={PROGRAMS_BY_CATEGORY}
              selected={programs}
              onSelectedChange={setPrograms}
            />
          </CardContent>
        </Card>

        {/* Vizeler */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Plane className="h-5 w-5 text-primary" /> Vizeler</CardTitle></CardHeader>
          <CardContent>
            <FilteredMultiSelect
              title="Sahip Olunan Vizeler"
              options={VISAS}
              selected={visas}
              onSelectedChange={setVisas}
            />
          </CardContent>
        </Card>

        {/* Müsaitlik & Çalışma Şekli */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5 text-primary" /> Müsaitlik & Çalışma Şekli</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Hangi günlerde uygunsun?</Label>
              <div className="grid grid-cols-2 gap-2">
                {['Hafta içi', 'Hafta sonu'].map(d => (
                  <label key={d} className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-accent/30 transition-colors">
                    <Checkbox
                      checked={availabilityDays.includes(d)}
                      onCheckedChange={c => setAvailabilityDays(prev => c ? [...prev, d] : prev.filter(x => x !== d))}
                    />
                    <span className="text-sm">{d}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Hangi saatlerde uygunsun?</Label>
              <div className="grid grid-cols-2 gap-2">
                {['Gündüz', 'Akşam'].map(t => (
                  <label key={t} className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-accent/30 transition-colors">
                    <Checkbox
                      checked={availabilityTimes.includes(t)}
                      onCheckedChange={c => setAvailabilityTimes(prev => c ? [...prev, t] : prev.filter(x => x !== t))}
                    />
                    <span className="text-sm">{t}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Çalışma Şekli</Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {['Sahada', 'Online', 'Hibrit'].map(m => (
                  <label key={m} className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-accent/30 transition-colors">
                    <Checkbox
                      checked={workModes.includes(m)}
                      onCheckedChange={c => setWorkModes(prev => c ? [...prev, m] : prev.filter(x => x !== m))}
                    />
                    <span className="text-sm">{m}</span>
                  </label>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Motivasyonlar */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Heart className="h-5 w-5 text-primary" /> Bir Projede Seni Ne Motive Eder?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {[
              {
                title: 'İnsanlara dokunmak',
                subtitle: 'Etki odaklı',
                items: [
                  'Sahada aktif görev', 'Birebir insan teması', 'Hızlı sonuç beklentisi',
                  'Somut fayda üretme', 'Duygusal bağlılık yüksek', 'Bürokrasiye düşük tolerans',
                  'Hikaye ve sonuç odaklı projeler', 'Sosyal hassasiyet uyumu kritik',
                  'Uzun vadeli bağlılık potansiyeli',
                ],
              },
              {
                title: 'Yeni şeyler öğrenmek',
                subtitle: 'Gelişim odaklı',
                items: [
                  'Deneyim kazanma motivasyonu', 'Farklı alanlara açıklık', 'Yenilik ve keşif isteği',
                  'Proje kurulum süreçlerine yatkınlık', 'Dinamik ortamlarda yüksek performans',
                  'Tekrara düşük tolerans', 'Eğitim ve mentorluk ilgisi',
                  'Çok yönlü beceri geliştirme', 'Gelecekte yön değiştirme eğilimi',
                ],
              },
              {
                title: 'Sosyal çevre edinmek',
                subtitle: 'Bağlantı odaklı',
                items: [
                  'Ekip içinde çalışma isteği', 'İletişim gücü yüksek',
                  'Etkinlik ve organizasyon ilgisi', 'Topluluk içinde motivasyon',
                  'Yalnız çalışmaya düşük ilgi', 'Sosyal görünürlük isteği',
                  'Network oluşturma hedefi', 'Grup enerjisiyle performans artışı',
                  'Aidiyet duygusu önemli',
                ],
              },
              {
                title: 'Kariyer katkısı',
                subtitle: 'Stratejik odaklı',
                items: [
                  'CV ve deneyim geliştirme', 'Profesyonel gönüllülük ilgisi', 'Networking hedefi',
                  'Kurumsal projelere yatkınlık', 'Sonuç ve çıktı odaklı',
                  'Planlı ve yapılandırılmış iş tercihi', 'Yetkinlik geliştirme motivasyonu',
                  'Mentorluk ve danışmanlık ilgisi', 'Uzun vadeli kariyer entegrasyonu',
                ],
              },
            ].map(group => (
              <div key={group.title} className="border rounded-xl p-4 bg-muted/20">
                <div className="mb-3">
                  <p className="font-bold text-sm">{group.title}</p>
                  <p className="text-xs text-muted-foreground">{group.subtitle}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {group.items.map(item => (
                    <label key={item} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-accent/30 cursor-pointer">
                      <Checkbox
                        checked={motivations.includes(item)}
                        onCheckedChange={c => setMotivations(prev => c ? [...prev, item] : prev.filter(x => x !== item))}
                      />
                      <span className="text-xs">{item}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Mahalle Muhtarıyım */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5 text-primary" /> Mahalle Muhtarıyım</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <Label htmlFor="is-muhtar" className="font-medium">Mahalle muhtarıyım</Label>
              <Switch id="is-muhtar" checked={isMuhtar} onCheckedChange={setIsMuhtar} />
            </div>
            {isMuhtar && (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>İl</Label>
                  <Select value={muhtarIl} onValueChange={v => { setMuhtarIl(v); setMuhtarIlce(''); setMuhtarMahalle(''); }}>
                    <SelectTrigger><SelectValue placeholder="İl seçiniz..." /></SelectTrigger>
                    <SelectContent className="max-h-60">
                      {allProvinces.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                {muhtarIl && (
                  <div className="space-y-2">
                    <Label>İlçe</Label>
                    <Select value={muhtarIlce} onValueChange={v => { setMuhtarIlce(v); setMuhtarMahalle(''); }}>
                      <SelectTrigger><SelectValue placeholder="İlçe seçiniz..." /></SelectTrigger>
                      <SelectContent className="max-h-60">
                        {ilceler.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {muhtarIlce && mahalleler.length > 0 && (
                  <div className="space-y-2">
                    <Label>Mahalle</Label>
                    <Select value={muhtarMahalle} onValueChange={setMuhtarMahalle}>
                      <SelectTrigger><SelectValue placeholder="Mahalle seçiniz..." /></SelectTrigger>
                      <SelectContent className="max-h-60">
                        {mahalleler.map((m: string) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Acil Durum Kişileri */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Phone className="h-5 w-5 text-primary" /> Acil Durum Kişileri (İsteğe Bağlı)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <Label className="text-xs font-bold uppercase text-muted-foreground">Birinci Kişi</Label>
              <Input placeholder="Ad Soyad" value={emergencyContacts[0]?.name || ''} onChange={e => handleEmergencyContactChange(0, 'name', e.target.value)} />
              <div className="flex gap-2">
                <div className="w-[80px] shrink-0">
                  <Select defaultValue="90">
                    <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                    <SelectContent>{[...new Set(countryPhoneCodes)].map(c => <SelectItem key={c} value={c}>+{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <Input type="tel" placeholder="5XX..." value={emergencyContacts[0]?.phone || ''} onChange={e => handleEmergencyContactChange(0, 'phone', e.target.value)} className="flex-1" />
              </div>
            </div>
            <div className="space-y-4 pt-4 border-t border-dashed">
              <Label className="text-xs font-bold uppercase text-muted-foreground">İkinci Kişi</Label>
              <Input placeholder="Ad Soyad" value={emergencyContacts[1]?.name || ''} onChange={e => handleEmergencyContactChange(1, 'name', e.target.value)} />
              <div className="flex gap-2">
                <div className="w-[80px] shrink-0">
                  <Select defaultValue="90">
                    <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                    <SelectContent>{[...new Set(countryPhoneCodes)].map(c => <SelectItem key={c} value={c}>+{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <Input type="tel" placeholder="5XX..." value={emergencyContacts[1]?.phone || ''} onChange={e => handleEmergencyContactChange(1, 'phone', e.target.value)} className="flex-1" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sağlık Durumu */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><HeartPulse className="h-5 w-5 text-primary" /> Sağlık Durumu</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2 p-4 border rounded-lg">
              <Label>Kan Grubu</Label>
              <Select value={bloodType || ''} onValueChange={setBloodType}>
                <SelectTrigger><SelectValue placeholder="Seçiniz..." /></SelectTrigger>
                <SelectContent>
                  {['A Rh+', 'A Rh-', 'B Rh+', 'B Rh-', 'AB Rh+', 'AB Rh-', '0 Rh+', '0 Rh-', 'Bilinmiyor'].map(b => (
                    <SelectItem key={b} value={b}>{b}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <Label htmlFor="emergency-available" className="font-medium">Acil durumlarda gönüllülüğe uygunum</Label>
              <Switch id="emergency-available" checked={emergencyAvailable} onCheckedChange={setEmergencyAvailable} />
            </div>
            <div className="flex items-center space-x-2 p-4 border rounded-lg">
              <Checkbox id="chronic-illness" checked={hasChronicIllness} onCheckedChange={c => setHasChronicIllness(!!c)} />
              <Label htmlFor="chronic-illness" className="text-sm">Kronik bir rahatsızlığım var.</Label>
            </div>
            <div className="flex items-center space-x-2 p-4 border rounded-lg">
              <Checkbox id="regular-medication" checked={usesRegularMedication} onCheckedChange={c => setUsesRegularMedication(!!c)} />
              <Label htmlFor="regular-medication" className="text-sm">Düzenli ilaç kullanıyorum.</Label>
            </div>
          </CardContent>
        </Card>

        {/* Hangel Gönüllülük Katılım ve Onay Beyanı */}
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-primary" /> Hangel Gönüllülük Katılım ve Onay Beyanı</CardTitle>
            <p className="text-xs text-muted-foreground leading-relaxed mt-2">
              Hangel topluluğunun bir parçası olarak, kolektif bilinç ile hareket etmeyi, hangel etik değerlerine bağlı kalmayı, tüm canlılara saygıyla yaklaşmayı ve sosyal fayda üretirken sorumluluk almayı kabul ediyorum.
            </p>
            <p className="text-[11px] font-bold text-primary uppercase tracking-widest mt-1">Tüm maddeler zorunludur</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { key: 'contract', label: 'Gönüllülük Sözleşmesi\'ni okudum ve kabul ediyorum.' },
              { key: 'rights', label: 'Gönüllü Hakları ve Sorumluluklarını kabul ediyorum.' },
              { key: 'ethics', label: 'Etik İlkeler ve İnsan Hakları Politikası\'na uyacağımı beyan ederim.' },
              { key: 'socialImpact', label: 'Sosyal Etki yaklaşımını ve katkı modelini anladım.' },
              { key: 'privacy', label: 'Gizlilik ve KVKK kapsamında verilerimin işlenmesini kabul ediyorum.' },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-start gap-3 p-3 border bg-background rounded-lg cursor-pointer hover:bg-accent/30 transition-colors">
                <Checkbox
                  checked={consents[key as keyof typeof consents]}
                  onCheckedChange={c => setConsents(prev => ({ ...prev, [key]: !!c }))}
                />
                <span className="text-sm leading-snug">{label}</span>
              </label>
            ))}
          </CardContent>
        </Card>

        <div className="flex justify-end pt-4 pb-10">
          <Button type="submit" size="lg" className="px-12 rounded-2xl font-black shadow-xl">Profili Tamamla</Button>
        </div>
      </form>
    </div>
  );
}
