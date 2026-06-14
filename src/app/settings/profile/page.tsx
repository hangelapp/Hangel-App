
'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { COUNTRY_PHONE_CODES } from '@/lib/phone-codes';
import { Country } from 'country-state-city';
import { LocationFields } from '@/components/shared/location-fields';
import Link from 'next/link';
import type { User } from '@/lib/types';

const emptyUser: User = {
    id: '',
    name: '',
    username: '',
    avatarUrl: '',
    coverPhotoUrl: '',
    impactScore: 0,
    personalInfo: {
        email: '',
        phone: '',
        birthDate: '',
        gender: '',
        nationality: '',
        bloodType: '',
        bloodNotifications: false,
        address: { country: '', city: '', district: '', neighborhood: '', fullAddress: '' },
        website: null,
        social: { linkedin: null, github: null, behance: null, instagram: null, twitter: null }
    } as User['personalInfo'],
    volunteerInfo: {
        skills: [],
        dailySkills: [],
        interests: [],
        education: [],
        profession: null,
        sector: null,
        position: null,
        languages: [],
        programs: [],
        licenses: [],
        documents: [],
        travelInfo: { domesticObstacle: false, internationalObstacle: false, visas: [] },
        emergency: { available: false, hasChronicIllness: false, usesRegularMedication: false, hasPhysicalLimitation: false, emergencyContacts: [] }
    },
    stats: {
        totalDonation: 0, donationCount: 0, highestSingleDonation: 0, supportedNgosCount: 0,
        mostSupportedNgo: '', avgDonation: 0, volunteerHours: 0, completedProjects: 0,
        volunteerRank: { country: '', city: '', school: '', interest: '' },
        mostActiveVolunteerArea: '', avgVolunteerDuration: '', totalImpactValue: 0
    },
    progress: {},
    supportedNgos: [],
    volunteerNgos: []
};
import { ArrowLeft, Camera, Trash2, Loader2, Globe, Linkedin, Instagram, Twitter, Plus, Link as LinkIcon, X, GraduationCap, UserCircle, Calendar } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { COLLECTIONS } from '@/firebase/collections';
import { useTranslation } from '@/components/providers/language-provider';
import { trackOnboardingStep } from '@/lib/onboarding-analytics';

export default function ProfileSettingsPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user: authUser, isUserLoading } = useUser();
  const db = useFirestore();
  
  const [isOnboarding, setIsOnboarding] = useState(false);
  // Photo editor (zoom + pan + crop circle 256x256 → data URL)
  const [photoEditorSrc, setPhotoEditorSrc] = useState<string | null>(null);
  const [zoom, setZoom] = useState([1]);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const dragRef = useRef<{ startX: number; startY: number; startOffsetX: number; startOffsetY: number } | null>(null);

  const userDocRef = useMemoFirebase(() => {
    if (!db || !authUser) return null;
    return doc(db, COLLECTIONS.users, authUser.uid);
  }, [db, authUser]);

  const { data: userData, isLoading: isUserDataLoading } = useDoc(userDocRef);
  const [profile, setProfile] = useState(emptyUser);

  useEffect(() => {
    const onboardingStep = localStorage.getItem('onboardingStep');
    if (onboardingStep === 'profile') {
        setIsOnboarding(true);
    }
  }, []);

  // Onboarding profil adımı görüntülendiğinde analitik 'view' (bir kez).
  const profileViewTrackedRef = useRef(false);
  useEffect(() => {
    if (isOnboarding && db && !profileViewTrackedRef.current) {
      profileViewTrackedRef.current = true;
      trackOnboardingStep(db, 'profile', 'view');
    }
  }, [isOnboarding, db]);

  useEffect(() => {
    if (userData) {
        setProfile(prev => ({
            ...prev,
            ...userData,
            personalInfo: {
                ...prev.personalInfo,
                ...(userData.personalInfo || {}),
                address: {
                    ...prev.personalInfo.address,
                    ...((userData.personalInfo && userData.personalInfo.address) || {})
                }
            },
            volunteerInfo: {
                ...prev.volunteerInfo,
                ...(userData.volunteerInfo || {})
            }
        }));
    }
  }, [userData]);

  const handleChange = (section: string, field: string, value: unknown) => {
    setProfile(prev => {
        const newProfile = JSON.parse(JSON.stringify(prev));
        if (section === 'personalInfo' && field === 'address') {
            newProfile.personalInfo.address = { ...newProfile.personalInfo.address, ...(value as Record<string, unknown>) };
        } else if (section === 'personalInfo') {
            newProfile.personalInfo[field] = value;
        } else if (section === 'username') {
            newProfile.username = value;
        } else if (section === 'name') {
            newProfile.name = value;
        } else if (section === 'avatarUrl') {
            newProfile.avatarUrl = value;
        }
        return newProfile;
    });
  };

  // Sosyal medya girişini @handle biçimine normalize eder.
  // Kullanıcı tam URL yapıştırsa son segmenti, sade kullanıcı adı yazsa başına @ ekler.
  // Boş/sadece @ ise null döner (alan temizlenir).
  const normalizeHandle = (value: string): string | null => {
    let handle = value.trim();
    if (!handle) return null;
    if (/^https?:\/\//i.test(handle) || handle.includes('/')) {
      const segments = handle.replace(/\/+$/, '').split('/');
      handle = segments[segments.length - 1] || '';
    }
    handle = handle.replace(/^@+/, '').replace(/\s+/g, '');
    if (!handle) return null;
    return `@${handle}`;
  };

  const handleSocialChange = (field: string, value: string) => {
    setProfile(prev => {
        const newProfile = JSON.parse(JSON.stringify(prev));
        newProfile.personalInfo.social = {
            ...(newProfile.personalInfo.social || {}),
            [field]: normalizeHandle(value),
        };
        return newProfile;
    });
  };

  const customLinks: { platform: string; url: string }[] =
    (profile.personalInfo.social as (User['personalInfo']['social'] & { custom?: { platform: string; url: string }[] }) | undefined)?.custom ?? [];

  const setCustomLinks = (links: { platform: string; url: string }[]) => {
    setProfile(prev => {
        const newProfile = JSON.parse(JSON.stringify(prev));
        newProfile.personalInfo.social = {
            ...(newProfile.personalInfo.social || {}),
            custom: links,
        };
        return newProfile;
    });
  };

  const addCustomLink = () => {
    setCustomLinks([...customLinks, { platform: '', url: '' }]);
  };

  const updateCustomLink = (index: number, field: 'platform' | 'url', value: string) => {
    const next = customLinks.map((link, i) => i === index ? { ...link, [field]: value } : link);
    setCustomLinks(next);
  };

  const removeCustomLink = (index: number) => {
    setCustomLinks(customLinks.filter((_, i) => i !== index));
  };

  // Eğitim bilgileri /settings/education (Eğitim Geçmişi) sayfasına taşındı — tek kaynak.

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onloadend = () => {
          // Düzenleyiciye gönder; avatarUrl yalnızca "Uygula" sonrası set edilir.
          setPhotoEditorSrc(reader.result as string);
          setZoom([1]);
          setOffset({ x: 0, y: 0 });
      };
      reader.readAsDataURL(file);
      // Aynı dosya tekrar seçilebilsin diye input'u sıfırla.
      e.target.value = '';
  };

  const PREVIEW_SIZE = 256;
  const handlePreviewPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    dragRef.current = { startX: e.clientX, startY: e.clientY, startOffsetX: offset.x, startOffsetY: offset.y };
  };
  const handlePreviewPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setOffset({ x: dragRef.current.startOffsetX + dx, y: dragRef.current.startOffsetY + dy });
  };
  const handlePreviewPointerUp = () => { dragRef.current = null; };

  const applyPhotoEditor = async () => {
    if (!photoEditorSrc) return;
    // Browser-side render: 512x512 PNG (preview 256, ×2 for retina)
    const OUT = 512;
    const previewToOut = OUT / PREVIEW_SIZE;
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const el = new Image();
        el.crossOrigin = 'anonymous';
        el.onload = () => resolve(el);
        el.onerror = reject;
        el.src = photoEditorSrc;
      });
      const canvas = document.createElement('canvas');
      canvas.width = OUT;
      canvas.height = OUT;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      // Object-fit: cover hesabı (preview ile birebir)
      const scale = Math.max(PREVIEW_SIZE / img.width, PREVIEW_SIZE / img.height) * zoom[0];
      const drawW = img.width * scale;
      const drawH = img.height * scale;
      const cx = PREVIEW_SIZE / 2 + offset.x;
      const cy = PREVIEW_SIZE / 2 + offset.y;
      const drawX = cx - drawW / 2;
      const drawY = cy - drawH / 2;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, OUT, OUT);
      ctx.drawImage(img, drawX * previewToOut, drawY * previewToOut, drawW * previewToOut, drawH * previewToOut);
      const dataUrl = canvas.toDataURL('image/png');
      handleChange('avatarUrl', 'avatarUrl', dataUrl);
      setPhotoEditorSrc(null);
    } catch (err) {
      console.error('photo editor apply failed:', err);
      toast({ variant: 'destructive', title: 'Düzenleme başarısız', description: 'Görsel işlenirken bir hata oluştu.' });
    }
  };

  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userDocRef || isSaving) return;
    setIsSaving(true);

    // Uniqueness check: telefon + email bir kullanıcıda sadece 1 kere
    // bulunabilir. Server-side endpoint duplicate'i kontrol eder.
    try {
        const checks: { field: 'phone' | 'email'; value: string; original: string | null | undefined }[] = [
            { field: 'phone', value: (profile.personalInfo.phone || '').toString(), original: userData?.personalInfo?.phone },
            { field: 'email', value: (profile.personalInfo.email || '').toString(), original: userData?.personalInfo?.email },
        ];
        const idToken = authUser ? await authUser.getIdToken() : '';
        for (const c of checks) {
            const cleaned = c.field === 'email' ? c.value.toLowerCase() : c.value.replace(/\D/g, '');
            const origCleaned = c.field === 'email' ? (c.original || '').toString().toLowerCase() : (c.original || '').toString().replace(/\D/g, '');
            if (!cleaned || cleaned === origCleaned) continue; // boş veya değişmemiş → skip
            const res = await fetch('/api/users/check-uniqueness', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
                body: JSON.stringify({ field: c.field, value: c.value, excludeUid: authUser?.uid }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok || !data.ok || data.available === false) {
                const label = c.field === 'phone' ? 'telefon numarası' : 'e-posta adresi';
                toast({
                    variant: 'destructive',
                    title: 'Bu ' + label + ' zaten kullanımda',
                    description: 'Başka bir hesap bu ' + label + 'ni kullanıyor. Lütfen farklı bir ' + label + ' girin.',
                });
                setIsSaving(false);
                return;
            }
        }
    } catch (err) {
        console.warn('[profile uniqueness check] failed (ignoring):', err);
        // Soft fail — uniqueness check fail ederse kayıt devam eder.
        // Server-side enforcement yok şu an (Firestore rules duplicate engellemez).
    }

    // Address normalize: undefined yerine '' (Firestore undefined kabul etmez,
    // empty string ok). Kullanılmayan eski alanlar (street, doorNo) state'te
    // varsa korunur — handleChange merge mantığı sayesinde.
    const addr = profile.personalInfo.address || {};
    const normalizedAddress = {
        ...addr,
        country: addr.country ?? '',
        city: addr.city ?? '',
        district: addr.district ?? '',
        neighborhood: (addr as { neighborhood?: string }).neighborhood ?? '',
        fullAddress: (addr as { fullAddress?: string }).fullAddress ?? '',
    };

    // Why: updateDoc nested object'i REPLACE eder (deep merge YOK). Bu
    // payload personalInfo'yu full spread'le yazıyor → tüm alanlar saved
    // olur. Ek olarak address için dot-path da kullanıyoruz — defansif
    // yedek (eski client cache'te eksik field varsa korunsun diye).
    const payload: Record<string, unknown> = {
        name: profile.name ?? '',
        username: profile.username ?? '',
        avatarUrl: profile.avatarUrl ?? '',
        personalInfo: {
            ...profile.personalInfo,
            address: normalizedAddress,
        },
        // Defansif dot-path yedek (sub-field guarantee):
        'personalInfo.address.country': normalizedAddress.country,
        'personalInfo.address.city': normalizedAddress.city,
        'personalInfo.address.district': normalizedAddress.district,
        'personalInfo.address.neighborhood': normalizedAddress.neighborhood,
        'personalInfo.address.fullAddress': normalizedAddress.fullAddress,
    };

    try {
        await updateDoc(userDocRef, payload);
        toast({ title: t('dashboard.settingsProfile.toastSavedTitle'), description: t('dashboard.settingsProfile.toastSavedDesc') });

        if (isOnboarding) {
            trackOnboardingStep(db, 'profile', 'complete');
            localStorage.setItem('onboardingStep', 'volunteer');
            router.push('/settings/volunteer');
        } else {
            router.push('/settings');
        }
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        toast({
            variant: 'destructive',
            title: 'Kayıt başarısız',
            description: msg.slice(0, 200),
        });
        console.error('[profile save] failed:', err);
    } finally {
        setIsSaving(false);
    }
  };

  // Adres state: country boş → 'Türkiye' default (BUG-21). LocationFields cascading
  // bölgeyi yönetir; fullAddress (sokak/açık adres) openAddress slot'una map'lenir.
  if (isUserLoading || isUserDataLoading) {
      return (
          <div className="flex items-center justify-center min-h-dvh">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
      );
  }

  return (
    <div className="p-4 space-y-6 animate-in fade-in-0 max-w-2xl mx-auto">
       <Button onClick={() => router.back()} variant="ghost" size="icon" className="mb-2 -ml-2" aria-label={t('aria.back')}>
            <ArrowLeft className="h-6 w-6" />
        </Button>
      <div>
        <h1 className="text-3xl font-bold font-headline">{t('dashboard.settingsProfile.heading')}</h1>
        <p className="text-muted-foreground text-sm">{t('dashboard.settingsProfile.subheading')}</p>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        <Card className="overflow-hidden border-none shadow-lg">
            <CardHeader className="bg-primary/5 border-b border-primary/10">
                <CardTitle className="text-lg">{t('dashboard.settingsProfile.photoCardTitle')}</CardTitle>
            </CardHeader>
            <CardContent className="pt-8 flex flex-col items-center gap-6">
                <div className="relative group">
                    <Avatar className="w-32 h-32 border-4 border-background shadow-2xl">
                        <AvatarImage src={profile.avatarUrl} className="object-cover" />
                        <AvatarFallback className="text-3xl font-black bg-muted text-muted-foreground">
                            {profile.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                    </Avatar>
                    <label htmlFor="photo-upload" className="absolute inset-0 flex items-center justify-center bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                        <Camera className="h-8 w-8" />
                    </label>
                    <input id="photo-upload" type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                </div>
                <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById('photo-upload')?.click()}>Değiştir</Button>
                    <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={() => handleChange('avatarUrl', 'avatarUrl', '')}><Trash2 className="h-4 w-4 mr-2" /> Kaldır</Button>
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader><CardTitle>{t('dashboard.settingsProfile.personalCardTitle')}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label>Ad Soyad</Label>
                    <Input value={profile.name} onChange={(e) => handleChange('name', 'name', e.target.value)} required />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>E-posta</Label>
                        <Input
                            type="email"
                            value={profile.personalInfo.email || ''}
                            onChange={(e) => handleChange('personalInfo', 'email', e.target.value)}
                            placeholder="ornek@hangel.org"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Telefon</Label>
                        {(() => {
                            const currentPhoneCountryCode =
                                (profile.personalInfo as User['personalInfo'] & { phoneCountryCode?: string }).phoneCountryCode || '+90';
                            const selectedPhone = COUNTRY_PHONE_CODES.find(c => c.code === currentPhoneCountryCode) ?? COUNTRY_PHONE_CODES[0];
                            return (
                                <div className="grid grid-cols-[140px_1fr] gap-2">
                                    <Select
                                        value={currentPhoneCountryCode}
                                        onValueChange={(v) => handleChange('personalInfo', 'phoneCountryCode', v)}
                                    >
                                        <SelectTrigger className="h-10 rounded-xl font-bold">
                                            <SelectValue>
                                                <span className="text-base">{selectedPhone.flag}</span>
                                                <span className="ml-1">{selectedPhone.code}</span>
                                            </SelectValue>
                                        </SelectTrigger>
                                        <SelectContent className="max-h-60">
                                            {COUNTRY_PHONE_CODES.map((c) => (
                                                <SelectItem key={`${c.iso}-${c.code}`} value={c.code}>
                                                    <span className="text-base mr-2">{c.flag}</span>
                                                    {c.country} ({c.code})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Input
                                        type="tel"
                                        value={profile.personalInfo.phone || ''}
                                        onChange={(e) => handleChange('personalInfo', 'phone', e.target.value)}
                                        placeholder="5XX XXX XX XX"
                                    />
                                </div>
                            );
                        })()}
                    </div>
                </div>
                <LocationFields
                    value={{
                        country: profile.personalInfo.address.country || 'Türkiye',
                        city: profile.personalInfo.address.city,
                        district: profile.personalInfo.address.district,
                        neighborhood: (profile.personalInfo.address as { neighborhood?: string }).neighborhood || '',
                        openAddress: (profile.personalInfo.address as { fullAddress?: string }).fullAddress || '',
                    }}
                    onChange={(next) => handleChange('personalInfo', 'address', {
                        country: next.country ?? '',
                        city: next.city ?? '',
                        district: next.district ?? '',
                        neighborhood: next.neighborhood ?? '',
                        fullAddress: next.openAddress ?? '',
                    })}
                    showCountry
                    showOpenAddress
                    labelOpenAddress="Sokak / Açık Adres"
                />
            </CardContent>
        </Card>

        {/* Demografik Bilgiler (önceden Gönüllülük sayfasındaydı, buraya taşındı). */}
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><UserCircle className="h-5 w-5 text-primary" /> Demografik Bilgiler</CardTitle>
                <CardDescription>Doğum tarihin, uyruğun ve cinsiyetin. Sadece sen ve süper admin görür.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2"><Calendar className="h-4 w-4" /> Doğum Tarihi</Label>
                        <Input
                            type="date"
                            value={profile.personalInfo.birthDate || ''}
                            onChange={(e) => handleChange('personalInfo', 'birthDate', e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2"><Globe className="h-4 w-4" /> Uyruk</Label>
                        <Select
                            value={profile.personalInfo.nationality || ''}
                            onValueChange={(v) => handleChange('personalInfo', 'nationality', v)}
                        >
                            <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="Uyruk seçin..." /></SelectTrigger>
                            <SelectContent className="max-h-72">
                                <SelectItem value="Türkiye">Türkiye</SelectItem>
                                <SelectItem value="KKTC (Kuzey Kıbrıs)">KKTC (Kuzey Kıbrıs)</SelectItem>
                                {Country.getAllCountries()
                                    .map(c => c.name)
                                    .filter(n => n !== 'Turkey' && n !== 'Cyprus')
                                    .sort((a, b) => a.localeCompare(b))
                                    .map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)
                                }
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="space-y-2">
                    <Label className="flex items-center gap-2"><UserCircle className="h-4 w-4" /> Cinsiyet</Label>
                    <Select
                        value={profile.personalInfo.gender || ''}
                        onValueChange={(v) => handleChange('personalInfo', 'gender', v)}
                    >
                        <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="Seçiniz..." /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Erkek">Erkek</SelectItem>
                            <SelectItem value="Kadın">Kadın</SelectItem>
                            <SelectItem value="Belirtmek istemiyorum">Belirtmek istemiyorum</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><GraduationCap className="h-5 w-5 text-primary" /> Eğitim Bilgileri</CardTitle>
                <CardDescription>Eğitim geçmişin (lise, üniversite, yüksek lisans, doktora) ve kulüp üyeliklerin artık tek sayfada — Eğitim Geçmişi.</CardDescription>
            </CardHeader>
            <CardContent>
                <Button asChild variant="outline" className="h-11 rounded-xl gap-2">
                    <Link href="/settings/education"><GraduationCap className="h-4 w-4" /> Eğitim Geçmişini Düzenle</Link>
                </Button>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5 text-primary" /> {t('dashboard.settingsProfile.socialCardTitle')}</CardTitle>
                <CardDescription>Profilinizde görünecek bağlantıları ekleyin. Boş bırakabilirsiniz.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label className="flex items-center gap-2"><Globe className="h-4 w-4" /> Web Sitesi</Label>
                    <Input type="url" value={profile.personalInfo.website || ''} onChange={(e) => handleChange('personalInfo', 'website', e.target.value || null)} placeholder="https://ornek.com" />
                </div>
                <div className="space-y-2">
                    <Label className="flex items-center gap-2"><Linkedin className="h-4 w-4" /> LinkedIn</Label>
                    <Input type="text" inputMode="text" value={profile.personalInfo.social?.linkedin || ''} onChange={(e) => handleSocialChange('linkedin', e.target.value)} placeholder="@kullaniciadi" />
                </div>
                <div className="space-y-2">
                    <Label className="flex items-center gap-2"><Instagram className="h-4 w-4" /> Instagram</Label>
                    <Input type="text" inputMode="text" value={profile.personalInfo.social?.instagram || ''} onChange={(e) => handleSocialChange('instagram', e.target.value)} placeholder="@kullaniciadi" />
                </div>
                <div className="space-y-2">
                    <Label className="flex items-center gap-2"><Twitter className="h-4 w-4" /> X (Twitter)</Label>
                    <Input type="text" inputMode="text" value={profile.personalInfo.social?.twitter || ''} onChange={(e) => handleSocialChange('twitter', e.target.value)} placeholder="@kullaniciadi" />
                </div>
                <p className="text-xs text-muted-foreground -mt-1">Sosyal medya hesaplarınızı kullanıcı adınızla girin (örn. @kullaniciadi).</p>

                {customLinks.length > 0 && (
                    <div className="space-y-3 pt-2 border-t">
                        <Label className="text-xs uppercase tracking-wider text-muted-foreground">Diğer Bağlantılar</Label>
                        {customLinks.map((link, index) => {
                            const PLATFORM_OPTIONS = [
                                'GitHub', 'Behance', 'LinkedIn', 'Instagram', 'X (Twitter)', 'Facebook',
                                'TikTok', 'YouTube', 'Threads', 'Mastodon', 'Pinterest', 'Snapchat',
                                'Reddit', 'Twitch', 'Discord', 'Telegram', 'WhatsApp',
                                'Medium', 'Substack', 'Dev.to', 'Dribbble', 'Figma',
                                'Spotify', 'SoundCloud', 'Apple Music', 'Bandcamp',
                                'Patreon', 'Buy Me a Coffee', 'Ko-fi', 'GoFundMe',
                                'Vimeo', 'Twitch', 'Steam', 'GitLab', 'Stack Overflow',
                                'Hashnode', 'Notion', 'Personal Website', 'Diğer (manuel)'
                            ];
                            const isCustom = link.platform === 'Diğer (manuel)' || (link.platform && !PLATFORM_OPTIONS.includes(link.platform));
                            return (
                                <div key={index} className="flex items-end gap-2">
                                    <div className="space-y-1 flex-1">
                                        <Label className="text-xs flex items-center gap-1.5"><LinkIcon className="h-3 w-3" /> Platform</Label>
                                        <Select
                                            value={isCustom ? 'Diğer (manuel)' : link.platform}
                                            onValueChange={(v) => updateCustomLink(index, 'platform', v === 'Diğer (manuel)' ? '' : v)}
                                        >
                                            <SelectTrigger><SelectValue placeholder="Seç..." /></SelectTrigger>
                                            <SelectContent className="max-h-60">
                                                {PLATFORM_OPTIONS.map(p => (
                                                    <SelectItem key={p} value={p}>{p}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {isCustom && (
                                            <Input
                                                value={link.platform}
                                                onChange={(e) => updateCustomLink(index, 'platform', e.target.value)}
                                                placeholder="Platform adı"
                                                className="mt-1"
                                            />
                                        )}
                                    </div>
                                    <div className="space-y-1 flex-[2]">
                                        <Label className="text-xs">URL</Label>
                                        <Input
                                            type="url"
                                            value={link.url}
                                            onChange={(e) => updateCustomLink(index, 'url', e.target.value)}
                                            placeholder="https://..."
                                        />
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-10 w-10 text-destructive shrink-0"
                                        onClick={() => removeCustomLink(index)}
                                        title="Kaldır"
                                        aria-label="Kaldır"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            );
                        })}
                    </div>
                )}

                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full h-10 border-dashed gap-2 mt-2"
                    onClick={addCustomLink}
                >
                    <Plus className="h-4 w-4" />
                    Sosyal Hesap Ekle
                </Button>
            </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-3 sm:justify-end pt-4 pb-2">
          {isOnboarding && (
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="px-8 rounded-2xl font-bold border-2"
              onClick={() => {
                // Onboarding'i atla → bir sonraki adıma (gönüllülük tercihleri) geç.
                // Kullanıcı profili sonra doldurabilir; zincire hapsolmaz.
                trackOnboardingStep(db, 'profile', 'skip');
                localStorage.setItem('onboardingStep', 'volunteer');
                router.push('/settings/volunteer');
              }}
            >
              Şimdilik geç
            </Button>
          )}
          <Button type="submit" size="lg" disabled={isSaving} className="px-12 rounded-2xl font-black shadow-xl">
            {isSaving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Kaydediliyor...</> : t('dashboard.settingsProfile.saveCta')}
          </Button>
        </div>
      </form>

      <Dialog open={!!photoEditorSrc} onOpenChange={(open) => !open && setPhotoEditorSrc(null)}>
        <DialogContent className="rounded-3xl max-w-md">
          <DialogHeader>
            <DialogTitle>Profil Fotoğrafını Düzenle</DialogTitle>
            <DialogDescription>Yakınlaştır ve sürükleyerek konumlandır. Dairesel alan kaydedilecek görüntüyü gösterir.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-2">
            <div
              className="relative overflow-hidden bg-muted shadow-inner select-none touch-none"
              style={{ width: PREVIEW_SIZE, height: PREVIEW_SIZE, borderRadius: '50%' }}
              onPointerDown={handlePreviewPointerDown}
              onPointerMove={handlePreviewPointerMove}
              onPointerUp={handlePreviewPointerUp}
              onPointerCancel={handlePreviewPointerUp}
            >
              {photoEditorSrc && (
                 
                <img
                  src={photoEditorSrc}
                  alt="Düzenlenen fotoğraf"
                  draggable={false}
                  className="absolute pointer-events-none"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom[0]})`,
                    transformOrigin: 'center center',
                  }}
                />
              )}
              <div className="absolute inset-0 ring-2 ring-primary/60 rounded-full pointer-events-none" />
            </div>
            <div className="w-full space-y-2">
              <Label className="text-xs text-muted-foreground flex items-center justify-between">
                <span>Yakınlaştırma</span>
                <span className="font-mono">{zoom[0].toFixed(1)}×</span>
              </Label>
              <Slider value={zoom} onValueChange={setZoom} min={1} max={3} step={0.1} />
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={() => { setZoom([1]); setOffset({ x: 0, y: 0 }); }}>
              Sıfırla
            </Button>
          </div>
          <DialogFooter className="flex flex-row gap-2 sm:flex-row">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setPhotoEditorSrc(null)}>İptal</Button>
            <Button type="button" className="flex-1" onClick={applyPhotoEditor}>Uygula</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
