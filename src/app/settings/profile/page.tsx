
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { neighborhoodsData } from '@/lib/data';
import { COUNTRY_PHONE_CODES } from '@/lib/phone-codes';
import { Country, State, City } from 'country-state-city';
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
import { ArrowLeft, Camera, Trash2, Loader2, Globe, Linkedin, Github, Instagram, Twitter, Palette, Plus, Link as LinkIcon, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { COLLECTIONS } from '@/firebase/collections';
import { useTranslation } from '@/components/providers/language-provider';

export default function ProfileSettingsPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user: authUser, isUserLoading } = useUser();
  const db = useFirestore();
  
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [_isPhotoEditorOpen, setIsPhotoEditorOpen] = useState(false);
  const [_zoom, _setZoom] = useState([1]);

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

  const handleSocialChange = (field: string, value: string) => {
    setProfile(prev => {
        const newProfile = JSON.parse(JSON.stringify(prev));
        newProfile.personalInfo.social = {
            ...(newProfile.personalInfo.social || {}),
            [field]: value || null,
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

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              handleChange('avatarUrl', 'avatarUrl', reader.result as string);
              setIsPhotoEditorOpen(true);
          };
          reader.readAsDataURL(file);
      }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userDocRef) return;

    updateDocumentNonBlocking(userDocRef, {
        name: profile.name,
        username: profile.username,
        avatarUrl: profile.avatarUrl,
        personalInfo: profile.personalInfo
    });

    toast({ title: t('dashboard.settingsProfile.toastSavedTitle'), description: t('dashboard.settingsProfile.toastSavedDesc') });
    
    if (isOnboarding) {
        localStorage.setItem('onboardingStep', 'volunteer');
        router.push('/settings/volunteer');
    } else {
        router.push('/settings');
    }
  };

  const currentCountry = profile.personalInfo.address.country;
  const currentCity = profile.personalInfo.address.city;
  const currentDistrict = profile.personalInfo.address.district;
  const currentNeighborhood = (profile.personalInfo.address as { neighborhood?: string }).neighborhood || '';
  const currentStreet = (profile.personalInfo.address as { fullAddress?: string }).fullAddress || '';
  const isTurkey = currentCountry === 'Türkiye' || currentCountry === 'Turkey' || currentCountry === 'TR';

  // Country dropdown options: Türkiye + KKTC pinned, then rest alphabetically
  const countryOptions = useMemo(() => {
    const rest = Country.getAllCountries()
      .map(c => ({ name: c.name, code: c.isoCode }))
      .filter(c => c.name !== 'Turkey' && c.name !== 'Cyprus')
      .sort((a, b) => a.name.localeCompare(b.name));
    return [
      { name: 'Türkiye', code: 'TR' },
      { name: 'KKTC (Kuzey Kıbrıs)', code: 'CY-KKTC' },
      ...rest,
    ];
  }, []);

  const countryISO = useMemo(() => {
    if (!currentCountry) return null;
    if (isTurkey) return 'TR';
    return Country.getAllCountries().find(c => c.name === currentCountry || c.isoCode === currentCountry)?.isoCode || null;
  }, [currentCountry, isTurkey]);

  // For Türkiye, list of il from neighborhoodsData; otherwise country-state-city states/cities
  const cityOptions = useMemo<string[]>(() => {
    if (isTurkey) {
      return Object.keys(neighborhoodsData).sort((a, b) => a.localeCompare(b, 'tr'));
    }
    if (!countryISO) return [];
    const states = State.getStatesOfCountry(countryISO).map(s => s.name);
    if (states.length > 0) return states.sort((a, b) => a.localeCompare(b));
    return City.getCitiesOfCountry(countryISO)?.map(c => c.name).sort((a, b) => a.localeCompare(b)) || [];
  }, [isTurkey, countryISO]);

  // İlçe options (Türkiye: neighborhoodsData[il] keys; diğer: ülke şehirleri)
  const districtOptions = useMemo<string[]>(() => {
    if (isTurkey) {
      if (!currentCity || !neighborhoodsData[currentCity]) return [];
      return Object.keys(neighborhoodsData[currentCity]).sort((a, b) => a.localeCompare(b, 'tr'));
    }
    if (!countryISO) return [];
    const stateObj = State.getStatesOfCountry(countryISO).find(s => s.name === currentCity);
    if (!stateObj) return [];
    return City.getCitiesOfState(countryISO, stateObj.isoCode)?.map(c => c.name).sort((a, b) => a.localeCompare(b)) || [];
  }, [isTurkey, countryISO, currentCity]);

  // Mahalle options (only Türkiye)
  const neighborhoodOptions = useMemo<string[]>(() => {
    if (!isTurkey) return [];
    if (!currentCity || !currentDistrict) return [];
    const list = neighborhoodsData[currentCity]?.[currentDistrict];
    if (!list) return [];
    return list.slice().sort((a, b) => a.localeCompare(b, 'tr'));
  }, [isTurkey, currentCity, currentDistrict]);

  if (isUserLoading || isUserDataLoading) {
      return (
          <div className="flex items-center justify-center min-h-screen">
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
                <div className="space-y-2">
                    <Label className="flex items-center gap-2"><Globe className="h-4 w-4" /> Ülke</Label>
                    <Select value={currentCountry || 'Türkiye'} onValueChange={(val) => handleChange('personalInfo', 'address', { country: val, city: '', district: '', neighborhood: '', fullAddress: '' })}>
                        <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="Türkiye" /></SelectTrigger>
                        <SelectContent className="max-h-72">
                            {countryOptions.map(c => (
                                <SelectItem key={c.code} value={c.name}>{c.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-2">
                        <Label>{isTurkey ? 'İl' : 'Şehir'}</Label>
                        {cityOptions.length > 0 ? (
                            <Select value={currentCity || ''} onValueChange={(v) => handleChange('personalInfo', 'address', { city: v, district: '', neighborhood: '' })}>
                                <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="İl seçin..." /></SelectTrigger>
                                <SelectContent className="max-h-60">{cityOptions.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                            </Select>
                        ) : (
                            <Input value={currentCity || ''} onChange={(e) => handleChange('personalInfo', 'address', { city: e.target.value })} placeholder="Şehir" className="h-11 rounded-xl" />
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label>{isTurkey ? 'İlçe' : 'Bölge'}</Label>
                        {isTurkey ? (
                            <Select
                                value={currentDistrict || ''}
                                onValueChange={(v) => handleChange('personalInfo', 'address', { district: v, neighborhood: '' })}
                                disabled={!currentCity || districtOptions.length === 0}
                            >
                                <SelectTrigger className="h-11 rounded-xl">
                                    <SelectValue placeholder={!currentCity ? 'Önce il seçin' : 'İlçe seçin...'} />
                                </SelectTrigger>
                                <SelectContent className="max-h-60">{districtOptions.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                            </Select>
                        ) : districtOptions.length > 0 ? (
                            <Select value={currentDistrict || ''} onValueChange={(v) => handleChange('personalInfo', 'address', { district: v, neighborhood: '' })} disabled={!currentCity}>
                                <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="Seçiniz..." /></SelectTrigger>
                                <SelectContent className="max-h-60">{districtOptions.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                            </Select>
                        ) : (
                            <Input value={currentDistrict || ''} onChange={(e) => handleChange('personalInfo', 'address', { district: e.target.value })} placeholder="Bölge" className="h-11 rounded-xl" />
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label>Mahalle</Label>
                        {isTurkey ? (
                            <Select
                                value={currentNeighborhood || ''}
                                onValueChange={(v) => handleChange('personalInfo', 'address', { neighborhood: v })}
                                disabled={!currentDistrict || neighborhoodOptions.length === 0}
                            >
                                <SelectTrigger className="h-11 rounded-xl">
                                    <SelectValue placeholder={!currentDistrict ? 'Önce ilçe seçin' : 'Mahalle seçin...'} />
                                </SelectTrigger>
                                <SelectContent className="max-h-60">{neighborhoodOptions.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}</SelectContent>
                            </Select>
                        ) : (
                            <Input value={currentNeighborhood} onChange={(e) => handleChange('personalInfo', 'address', { neighborhood: e.target.value })} placeholder="Mahalle" className="h-11 rounded-xl" />
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label>Sokak / Açık Adres</Label>
                        <Input
                            value={currentStreet}
                            onChange={(e) => handleChange('personalInfo', 'address', { fullAddress: e.target.value })}
                            placeholder="Sokak, kapı no..."
                            className="h-11 rounded-xl"
                        />
                    </div>
                </div>
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
                    <Input type="url" value={profile.personalInfo.social?.linkedin || ''} onChange={(e) => handleSocialChange('linkedin', e.target.value)} placeholder="https://linkedin.com/in/kullaniciadi" />
                </div>
                <div className="space-y-2">
                    <Label className="flex items-center gap-2"><Github className="h-4 w-4" /> GitHub</Label>
                    <Input type="url" value={profile.personalInfo.social?.github || ''} onChange={(e) => handleSocialChange('github', e.target.value)} placeholder="https://github.com/kullaniciadi" />
                </div>
                <div className="space-y-2">
                    <Label className="flex items-center gap-2"><Palette className="h-4 w-4" /> Behance</Label>
                    <Input type="url" value={profile.personalInfo.social?.behance || ''} onChange={(e) => handleSocialChange('behance', e.target.value)} placeholder="https://behance.net/kullaniciadi" />
                </div>
                <div className="space-y-2">
                    <Label className="flex items-center gap-2"><Instagram className="h-4 w-4" /> Instagram</Label>
                    <Input type="url" value={profile.personalInfo.social?.instagram || ''} onChange={(e) => handleSocialChange('instagram', e.target.value)} placeholder="https://instagram.com/kullaniciadi" />
                </div>
                <div className="space-y-2">
                    <Label className="flex items-center gap-2"><Twitter className="h-4 w-4" /> X (Twitter)</Label>
                    <Input type="url" value={profile.personalInfo.social?.twitter || ''} onChange={(e) => handleSocialChange('twitter', e.target.value)} placeholder="https://x.com/kullaniciadi" />
                </div>

                {customLinks.length > 0 && (
                    <div className="space-y-3 pt-2 border-t">
                        <Label className="text-xs uppercase tracking-wider text-muted-foreground">Diğer Bağlantılar</Label>
                        {customLinks.map((link, index) => (
                            <div key={index} className="flex items-end gap-2">
                                <div className="space-y-1 flex-1">
                                    <Label className="text-xs flex items-center gap-1.5"><LinkIcon className="h-3 w-3" /> Platform</Label>
                                    <Input
                                        value={link.platform}
                                        onChange={(e) => updateCustomLink(index, 'platform', e.target.value)}
                                        placeholder="TikTok, Threads, Mastodon..."
                                    />
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
                        ))}
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

        <div className="flex justify-end pt-4">
          <Button type="submit" size="lg" className="px-12 rounded-2xl font-black shadow-xl">{t('dashboard.settingsProfile.saveCta')}</Button>
        </div>
      </form>
    </div>
  );
}
