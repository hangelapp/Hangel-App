
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { user as staticUser, countryPhoneCodes, allProvinces, districtsData, neighborhoodsData, globalCitiesData, globalDistrictsData } from '@/lib/data';
import { ArrowLeft, Camera, Trash2, Save, Loader2, MapPin, Globe } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import Image from 'next/image';
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';

const bloodGroups = ['A Rh+', 'A Rh-', 'B Rh+', 'B Rh-', 'AB Rh+', 'AB Rh-', '0 Rh+', '0 Rh-', 'Bilinmiyor'];

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
  const [profile, setProfile] = useState(staticUser);

  useEffect(() => {
    const onboardingStep = localStorage.getItem('onboardingStep');
    if (onboardingStep === 'profile') {
        setIsOnboarding(true);
    }
  }, []);

  useEffect(() => {
    if (userData) {
        setProfile({
            ...staticUser,
            ...userData,
            personalInfo: { ...staticUser.personalInfo, ...(userData.personalInfo || {}) },
            volunteerInfo: { ...staticUser.volunteerInfo, ...(userData.volunteerInfo || {}) },
        });
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
  const isTurkey = currentCountry === 'Türkiye';

  const countryOptions = ["Türkiye", "Almanya", "ABD", "Azerbaycan", "İngiltere"];
  const cityOptions = isTurkey ? allProvinces : (globalCitiesData[currentCountry] || []);
  const districtOptions = isTurkey ? (districtsData[currentCity] || []) : (globalDistrictsData[currentCity] || []);

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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Kan Grubu</Label>
                        <Select value={profile.personalInfo.bloodType || ''} onValueChange={(v) => handleChange('personalInfo', 'bloodType', v)} required>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>{bloodGroups.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                        </Select>
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
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5 text-primary" /> Adres Bilgileri</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label className="flex items-center gap-2"><Globe className="h-4 w-4" /> Ülke</Label>
                    <Select value={currentCountry} onValueChange={(val) => handleChange('personalInfo', 'address', { country: val, city: '', district: '', neighborhood: '' })}>
                        <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                        <SelectContent>{countryOptions.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
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
                        <Input value={profile.personalInfo.address.street || ''} onChange={(e) => handleChange('personalInfo', 'address', { street: e.target.value })} placeholder="Örn: Moda Cad." required />
                    </div>
                    <div className="space-y-2">
                        <Label>Bina / Kapı No</Label>
                        <Input value={profile.personalInfo.address.doorNo || ''} onChange={(e) => handleChange('personalInfo', 'address', { doorNo: e.target.value })} placeholder="Örn: 12/4" required />
                    </div>
                </div>
            </CardContent>
        </Card>

        <div className="flex justify-end pt-4">
          <Button type="submit" size="lg" className="px-12 rounded-2xl font-black shadow-xl">Kaydet ve Devam Et</Button>
        </div>
      </form>
    </div>
  );
}
