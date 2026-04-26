
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { countryPhoneCodes, allProvinces, districtsData, neighborhoodsData } from '@/lib/data';
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
        address: { country: '', city: '', district: '', neighborhood: '', fullAddress: '' },
        website: null,
        social: { linkedin: null, github: null, behance: null, instagram: null, twitter: null }
    },
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
import { ArrowLeft, Camera, Trash2, Save, Loader2, MapPin, Globe, Linkedin, Github, Instagram, Twitter, Palette, Plus, Link as LinkIcon, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import Image from 'next/image';
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';

export default function ProfileSettingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user: authUser, isUserLoading } = useUser();
  const db = useFirestore();
  
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [isPhotoEditorOpen, setIsPhotoEditorOpen] = useState(false);
  const [zoom, setZoom] = useState([1]);

  const userDocRef = useMemoFirebase(() => {
    if (!db || !authUser) return null;
    return doc(db, 'users', authUser.uid);
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

  const handleChange = (section: string, field: string, value: any) => {
    setProfile(prev => {
        const newProfile = JSON.parse(JSON.stringify(prev));
        if (section === 'personalInfo' && field === 'address') {
            newProfile.personalInfo.address = { ...newProfile.personalInfo.address, ...value };
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
    (profile.personalInfo.social as any)?.custom ?? [];

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

    toast({ title: "Profil Güncellendi", description: "Bilgileriniz başarıyla kaydedildi." });
    
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
  const currentNeighborhood = profile.personalInfo.address.neighborhood;
  const isTurkey = currentCountry === 'Türkiye' || currentCountry === 'Turkey' || currentCountry === 'TR';

  const allCountriesList = useMemo(() => {
    return Country.getAllCountries()
      .map(c => ({ name: c.name, code: c.isoCode }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  const countryISO = useMemo(() => {
    if (!currentCountry) return null;
    if (isTurkey) return 'TR';
    return Country.getAllCountries().find(c => c.name === currentCountry || c.isoCode === currentCountry)?.isoCode || null;
  }, [currentCountry, isTurkey]);

  const cityOptions = useMemo(() => {
    if (isTurkey) return (allProvinces || []).slice().sort((a, b) => a.localeCompare(b, 'tr'));
    if (!countryISO) return [];
    const states = State.getStatesOfCountry(countryISO).map(s => s.name);
    if (states.length > 0) return states.sort((a, b) => a.localeCompare(b));
    return City.getCitiesOfCountry(countryISO)?.map(c => c.name).sort((a, b) => a.localeCompare(b)) || [];
  }, [isTurkey, countryISO]);

  const districtOptions = useMemo(() => {
    if (isTurkey) return (districtsData[currentCity] || []).slice().sort((a, b) => a.localeCompare(b, 'tr'));
    if (!countryISO) return [];
    const stateObj = State.getStatesOfCountry(countryISO).find(s => s.name === currentCity);
    if (!stateObj) return [];
    return City.getCitiesOfState(countryISO, stateObj.isoCode)?.map(c => c.name).sort((a, b) => a.localeCompare(b)) || [];
  }, [isTurkey, countryISO, currentCity]);

  if (isUserLoading || isUserDataLoading) {
      return (
          <div className="flex items-center justify-center min-h-screen">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
      );
  }

  return (
    <div className="p-4 space-y-6 animate-in fade-in-0 max-w-2xl mx-auto">
       <Button onClick={() => router.back()} variant="ghost" size="icon" className="mb-2 -ml-2">
            <ArrowLeft className="h-6 w-6" />
        </Button>
      <div>
        <h1 className="text-3xl font-bold font-headline">Profil Bilgileri</h1>
        <p className="text-muted-foreground text-sm">İyilik yolculuğundaki kimliğini oluştur.</p>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        <Card className="overflow-hidden border-none shadow-lg">
            <CardHeader className="bg-primary/5 border-b border-primary/10">
                <CardTitle className="text-lg">Profil Fotoğrafı</CardTitle>
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
            <CardHeader><CardTitle>Kimlik Bilgileri</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label>Ad Soyad</Label>
                    <Input value={profile.name} onChange={(e) => handleChange('name', 'name', e.target.value)} required />
                </div>
                <div className="space-y-2">
                    <Label>Cinsiyet</Label>
                    <Select value={profile.personalInfo.gender || ''} onValueChange={(v) => handleChange('personalInfo', 'gender', v)} required>
                        <SelectTrigger><SelectValue /></SelectTrigger>
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
            <CardHeader><CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5 text-primary" /> Adres Bilgileri</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label className="flex items-center gap-2"><Globe className="h-4 w-4" /> Ülke</Label>
                    <Select value={currentCountry || ''} onValueChange={(val) => handleChange('personalInfo', 'address', { country: val, city: '', district: '', neighborhood: '' })}>
                        <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="Ülke seçin..." /></SelectTrigger>
                        <SelectContent className="max-h-72">
                            <SelectItem value="Türkiye">Türkiye</SelectItem>
                            {allCountriesList.filter(c => c.name !== 'Turkey').map(c => (
                                <SelectItem key={c.code} value={c.name}>{c.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>{isTurkey ? 'İl' : 'Şehir'}</Label>
                        {cityOptions.length > 0 ? (
                            <Select value={currentCity || ''} onValueChange={(v) => handleChange('personalInfo', 'address', { city: v, district: '', neighborhood: '' })} required>
                                <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="Seçiniz..." /></SelectTrigger>
                                <SelectContent className="max-h-60">{cityOptions.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                            </Select>
                        ) : (
                            <Input value={currentCity || ''} onChange={(e) => handleChange('personalInfo', 'address', { city: e.target.value })} placeholder="Giriş yapın" required />
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label>{isTurkey ? 'İlçe' : 'Bölge'}</Label>
                        {districtOptions.length > 0 ? (
                            <Select value={currentDistrict || ''} onValueChange={(v) => handleChange('personalInfo', 'address', { district: v, neighborhood: '' })} required disabled={!currentCity}>
                                <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="Seçiniz..." /></SelectTrigger>
                                <SelectContent className="max-h-60">{districtOptions.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                            </Select>
                        ) : (
                            <Input value={currentDistrict || ''} onChange={(e) => handleChange('personalInfo', 'address', { district: e.target.value })} placeholder="Giriş yapın" required />
                        )}
                    </div>
                </div>
                
                <div className="space-y-2">
                    <Label>Mahalle</Label>
                    {isTurkey && currentCity && currentDistrict && neighborhoodsData[currentCity]?.[currentDistrict] ? (
                        <Select value={currentNeighborhood || ''} onValueChange={(v) => handleChange('personalInfo', 'address', { neighborhood: v })} required>
                            <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="Seçiniz..." /></SelectTrigger>
                            <SelectContent className="max-h-60">{neighborhoodsData[currentCity][currentDistrict].map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                        </Select>
                    ) : (
                        <Input value={currentNeighborhood || ''} onChange={(e) => handleChange('personalInfo', 'address', { neighborhood: e.target.value })} placeholder="Mahalle" required disabled={isTurkey && !currentDistrict} className="h-11 rounded-xl" />
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Sokak / Cadde</Label>
                        <Input value={(profile.personalInfo.address as any).street || ''} onChange={(e) => handleChange('personalInfo', 'address', { street: e.target.value })} placeholder="Örn: Moda Cad." required />
                    </div>
                    <div className="space-y-2">
                        <Label>Bina / Kapı No</Label>
                        <Input value={(profile.personalInfo.address as any).doorNo || ''} onChange={(e) => handleChange('personalInfo', 'address', { doorNo: e.target.value })} placeholder="Örn: 12/4" required />
                    </div>
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5 text-primary" /> Web Sitesi ve Sosyal Medya</CardTitle>
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
          <Button type="submit" size="lg" className="px-12 rounded-2xl font-black shadow-xl">Kaydet ve Devam Et</Button>
        </div>
      </form>
    </div>
  );
}
