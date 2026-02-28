'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { user as staticUser, countryPhoneCodes } from '@/lib/data';
import { ArrowLeft, Github, Linkedin, Globe, Palette, Instagram, Camera, Trash2, ShieldCheck, User as UserIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';

const XIcon = (props: React.ComponentProps<'svg'>) => (
    <svg
      role="img"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      fill="currentColor"
      {...props}
    >
      <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.931ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
    </svg>
);

const allProvinces = ["Adana", "Adıyaman", "Afyonkarahisar", "Ağrı", "Aksaray", "Amasya", "Ankara", "Antalya", "Ardahan", "Artvin", "Aydın", "Balıkesir", "Bartın", "Batman", "Bayburt", "Bilecik", "Bingöl", "Bitlis", "Bolu", "Burdur", "Bursa", "Çanakkale", "Çankırı", "Çorum", "Denizli", "Diyarbakır", "Düzce", "Edirne", "Elazığ", "Erzincan", "Erzurum", "Eskişehir", "Gaziantep", "Giresun", "Gümüşhane", "Hakkari", "Hatay", "Iğdır", "Isparta", "İstanbul", "İzmir", "Kahramanmaraş", "Karabük", "Karaman", "Kars", "Kastamonu", "Kayseri", "Kırıkkale", "Kırklareli", "Kırşehir", "Kilis", "Kocaeli", "Konya", "Kütahya", "Malatya", "Manisa", "Mardin", "Mersin", "Muğla", "Muş", "Nevşehir", "Niğde", "Ordu", "Osmaniye", "Rize", "Sakarya", "Samsun", "Siirt", "Sinop", "Sivas", "Şanlıurfa", "Şırnak", "Tekirdağ", "Tokat", "Trabzon", "Tunceli", "Uşak", "Van", "Yalova", "Yozgat", "Zonguldak"];

const nationalities = ['Türkiye Cumhuriyeti', 'Diğer'];
const bloodGroups = ['A Rh+', 'A Rh-', 'B Rh+', 'B Rh-', 'AB Rh+', 'AB Rh-', '0 Rh+', '0 Rh-', 'Bilinmiyor'];
const cities = allProvinces;
const districts: { [key: string]: string[] } = {
    'İstanbul': ['Kadıköy', 'Beşiktaş', 'Fatih', 'Üsküdar', 'Sarıyer'],
    'Ankara': ['Çankaya', 'Mamak', 'Keçiören'],
    'İzmir': ['Konak', 'Bornova', 'Karşıyaka'],
};

export default function ProfileSettingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isOnboarding, setIsOnboarding] = useState(false);
  const [profile, setProfile] = useState(staticUser);
  const [isPhotoEditorOpen, setIsPhotoEditorOpen] = useState(false);
  const [zoom, setZoom] = useState([1]);

  useEffect(() => {
    const onboardingStep = localStorage.getItem('onboardingStep');
    if (onboardingStep === 'profile') {
        setIsOnboarding(true);
    }
    const savedUser = localStorage.getItem('hangel-user');
    if (savedUser) {
        setProfile(JSON.parse(savedUser));
    }
  }, []);

  const handleChange = (section: string, field: string, value: any) => {
    setProfile(prev => {
        const newProfile = JSON.parse(JSON.stringify(prev));
        if (section === 'personalInfo' && field === 'address') {
            newProfile.personalInfo.address = { ...newProfile.personalInfo.address, ...value };
        } else if (section === 'personalInfo' && field === 'social') {
            newProfile.personalInfo.social = { ...newProfile.personalInfo.social, ...value };
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
    localStorage.setItem('hangel-user', JSON.stringify(profile));
    toast({ title: "Profil Güncellendi", description: "Tüm değişiklikler başarıyla kaydedildi." });
    if (isOnboarding) {
        localStorage.setItem('onboardingStep', 'volunteer');
        router.push('/settings/volunteer');
    } else {
        router.push('/settings');
    }
  };

  return (
    <div className="p-4 space-y-6 animate-in fade-in-0 max-w-2xl mx-auto">
       <Button onClick={() => router.back()} variant="ghost" size="icon" className="mb-2 -ml-2">
            <ArrowLeft className="h-6 w-6" />
        </Button>
      <div>
        <h1 className="text-3xl font-bold font-headline">Profil Ayarları</h1>
        <p className="text-muted-foreground text-sm">Kişisel bilgilerinizi ve profil fotoğrafınızı yönetin.</p>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        {/* Photo Section */}
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
                    <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById('photo-upload')?.click()}>Fotoğrafı Değiştir</Button>
                    <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={() => handleChange('avatarUrl', 'avatarUrl', '')}>
                        <Trash2 className="h-4 w-4 mr-2" /> Kaldır
                    </Button>
                </div>
            </CardContent>
        </Card>

        {/* Info Cards - Same as before but with updated state handlers */}
        <Card>
            <CardHeader><CardTitle>Temel Bilgiler</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Ad Soyad</Label>
                        <Input value={profile.name} onChange={(e) => handleChange('name', 'name', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label>Kullanıcı Adı</Label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
                            <Input value={profile.username.replace('@','')} onChange={(e) => handleChange('username', 'username', `@${e.target.value}`)} className="pl-8"/>
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>E-posta</Label>
                        <Input value={profile.personalInfo.email} readOnly className="bg-muted" />
                    </div>
                     <div className="space-y-2">
                        <Label>Telefon</Label>
                        <div className="flex gap-2">
                            <div className="w-[100px] shrink-0">
                                <Select defaultValue="90">
                                    <SelectTrigger>
                                        <SelectValue placeholder="Kod" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {countryPhoneCodes.map(code => (
                                            <SelectItem key={code} value={code}>+{code}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Input value={profile.personalInfo.phone} onChange={(e) => handleChange('personalInfo', 'phone', e.target.value)} className="flex-1" />
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader><CardTitle>Adres ve Diğer</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>İl</Label>
                        <Select value={profile.personalInfo.address.city} onValueChange={(v) => handleChange('personalInfo', 'address', { city: v })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>{cities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>İlçe</Label>
                        <Select value={profile.personalInfo.address.district} onValueChange={(v) => handleChange('personalInfo', 'address', { district: v })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>{districts[profile.personalInfo.address.city]?.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Kan Grubu</Label>
                        <Select value={profile.personalInfo.bloodType} onValueChange={(v) => handleChange('personalInfo', 'bloodType', v)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>{bloodGroups.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Cinsiyet</Label>
                        <Select value={profile.personalInfo.gender} onValueChange={(v) => handleChange('personalInfo', 'gender', v)}>
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

        <div className="flex justify-end pt-4">
          <Button type="submit" size="lg" className="px-12 rounded-2xl font-black shadow-xl">Kaydet ve Devam Et</Button>
        </div>
      </form>

      {/* Rich Photo Editor Dialog */}
      <Dialog open={isPhotoEditorOpen} onOpenChange={setIsPhotoEditorOpen}>
          <DialogContent className="sm:max-w-md rounded-[2.5rem]">
              <DialogHeader>
                  <DialogTitle>Fotoğrafı Düzenle</DialogTitle>
                  <DialogDescription>Görseli merkeze alarak istediğiniz alanı seçin.</DialogDescription>
              </DialogHeader>
              <div className="py-8 space-y-8 flex flex-col items-center">
                  <div className="relative w-64 h-64 rounded-full overflow-hidden border-4 border-primary/20 shadow-2xl">
                      <div className="absolute inset-0 flex items-center justify-center">
                          <Image 
                            src={profile.avatarUrl} 
                            alt="Preview" 
                            width={256} 
                            height={256} 
                            className="object-cover transition-transform duration-200" 
                            style={{ transform: `scale(${zoom[0]})` }}
                          />
                      </div>
                  </div>
                  <div className="w-full px-8 space-y-2">
                      <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-muted-foreground">
                          <span>Yakınlaştır</span>
                          <span>{Math.round(zoom[0] * 100)}%</span>
                      </div>
                      <Slider value={zoom} onValueChange={setZoom} min={1} max={3} step={0.1} />
                  </div>
              </div>
              <DialogFooter>
                  <Button variant="ghost" onClick={() => setIsPhotoEditorOpen(false)}>Vazgeç</Button>
                  <Button onClick={() => setIsPhotoEditorOpen(false)}>Uygula</Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
    </div>
  );
}
