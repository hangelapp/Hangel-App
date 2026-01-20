'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { user } from '@/lib/data';
import { ArrowLeft, Github, Linkedin, Twitter, Globe, Palette, Instagram } from 'lucide-react';
import { useRouter } from 'next/navigation';

const nationalities = ['Türkiye Cumhuriyeti', 'Diğer'];
const bloodGroups = ['A Rh+', 'A Rh-', 'B Rh+', 'B Rh-', 'AB Rh+', 'AB Rh-', '0 Rh+', '0 Rh-', 'Bilinmiyor'];
const cities = ['İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya'];
const districts: { [key: string]: string[] } = {
    'İstanbul': ['Adalar', 'Arnavutköy', 'Ataşehir', 'Avcılar', 'Bağcılar', 'Bahçelievler', 'Bakırköy', 'Başakşehir', 'Bayrampaşa', 'Beşiktaş', 'Beykoz', 'Beylikdüzü', 'Beyoğlu', 'Büyükçekmece', 'Çatalca', 'Çekmeköy', 'Esenler', 'Esenyurt', 'Eyüpsultan', 'Fatih', 'Gaziosmanpaşa', 'Güngören', 'Kadıköy', 'Kağıthane', 'Kartal', 'Küçükçekmece', 'Maltepe', 'Pendik', 'Sancaktepe', 'Sarıyer', 'Silivri', 'Sultanbeyli', 'Sultangazi', 'Şile', 'Şişli', 'Tuzla', 'Ümraniye', 'Üsküdar', 'Zeytinburnu'],
    'Ankara': ['Akyurt', 'Altındağ', 'Ayaş', 'Balâ', 'Beypazarı', 'Çamlıdere', 'Çankaya', 'Çubuk', 'Elmadağ', 'Etimesgut', 'Evren', 'Gölbaşı', 'Güdül', 'Haymana', 'Kahramankazan', 'Kalecik', 'Keçiören', 'Kızılcahamam', 'Mamak', 'Nallıhan', 'Polatlı', 'Pursaklar', 'Sincan', 'Şereflikoçhisar', 'Yenimahalle'],
    'İzmir': ['Aliağa', 'Balçova', 'Bayındır', 'Bayraklı', 'Bergama', 'Beydağ', 'Bornova', 'Buca', 'Çeşme', 'Çiğli', 'Dikili', 'Foça', 'Gaziemir', 'Güzelbahçe', 'Karabağlar', 'Karaburun', 'Karşıyaka', 'Kemalpaşa', 'Kınık', 'Kiraz', 'Konak', 'Menderes', 'Menemen', 'Narlıdere', 'Ödemiş', 'Seferihisar', 'Selçuk', 'Tire', 'Torbalı', 'Urla'],
};

export default function ProfileSettingsPage() {
  const router = useRouter();
  const [selectedCity, setSelectedCity] = useState(user.personalInfo.address.city);

  return (
    <div className="p-4 space-y-6 animate-in fade-in-0">
       <Button onClick={() => router.back()} variant="ghost" size="icon" className="mb-2 -ml-2">
            <ArrowLeft className="h-6 w-6" />
        </Button>
      <div>
        <h1 className="text-2xl font-bold font-headline">Kişisel Bilgileri Düzenle</h1>
        <p className="text-muted-foreground text-sm">Platformdaki profil bilgilerinizi güncelleyin.</p>
      </div>

      <form className="space-y-6">
        <Card>
            <CardHeader>
                <CardTitle>Temel Bilgiler</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="name">Ad Soyad</Label>
                    <Input id="name" defaultValue={user.name} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">E-posta</Label>
                        <Input id="email" type="email" defaultValue={user.personalInfo.email} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="phone">Telefon</Label>
                        <Input id="phone" type="tel" defaultValue={user.personalInfo.phone} />
                    </div>
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="birthDate">Doğum Tarihi</Label>
                        <Input id="birthDate" type="date" defaultValue={user.personalInfo.birthDate} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="gender">Cinsiyet</Label>
                        <Select defaultValue={user.personalInfo.gender}>
                            <SelectTrigger id="gender"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Erkek">Erkek</SelectItem>
                                <SelectItem value="Kadın">Kadın</SelectItem>
                                <SelectItem value="Belirtmek istemiyorum">Belirtmek istemiyorum</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="nationality">Uyruk</Label>
                        <Select defaultValue={user.personalInfo.nationality}>
                            <SelectTrigger id="nationality"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {nationalities.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="bloodType">Kan Grubu</Label>
                         <Select defaultValue={user.personalInfo.bloodType}>
                            <SelectTrigger id="bloodType"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {bloodGroups.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Adres Bilgileri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="city">Şehir</Label>
                        <Select defaultValue={user.personalInfo.address.city} onValueChange={setSelectedCity}>
                            <SelectTrigger id="city"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {cities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="district">İlçe</Label>
                        <Select defaultValue={user.personalInfo.address.district} disabled={!selectedCity}>
                            <SelectTrigger id="district"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {selectedCity && districts[selectedCity] && districts[selectedCity].map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="fullAddress">Açık Adres</Label>
                    <Input id="fullAddress" placeholder="Mahalle, cadde, sokak, no..." defaultValue={user.personalInfo.address.fullAddress} />
                </div>
            </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle>Sosyal Medya ve Web</CardTitle>
                <CardDescription>Profesyonel ve yaratıcı kimliğinizi yansıtan linkleri ekleyin.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="space-y-2">
                    <Label htmlFor="website">Web Sitesi</Label>
                    <div className="flex items-center gap-2">
                        <Globe className="h-5 w-5 text-muted-foreground" />
                        <Input id="website" placeholder="https://..." defaultValue={user.personalInfo.website ?? ''} />
                    </div>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="linkedin">LinkedIn</Label>
                    <div className="flex items-center gap-2">
                        <Linkedin className="h-5 w-5 text-muted-foreground" />
                        <Input id="linkedin" placeholder="linkedin.com/in/kullaniciadi" defaultValue={user.personalInfo.social?.linkedin ?? ''} />
                    </div>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="github">GitHub</Label>
                    <div className="flex items-center gap-2">
                        <Github className="h-5 w-5 text-muted-foreground" />
                        <Input id="github" placeholder="kullaniciadi" defaultValue={user.personalInfo.social?.github ?? ''} />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="twitter">X (Twitter)</Label>
                    <div className="flex items-center gap-2">
                        <Twitter className="h-5 w-5 text-muted-foreground" />
                        <Input id="twitter" placeholder="kullaniciadi" defaultValue={user.personalInfo.social?.twitter ?? ''} />
                    </div>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="instagram">Instagram</Label>
                    <div className="flex items-center gap-2">
                        <Instagram className="h-5 w-5 text-muted-foreground" />
                        <Input id="instagram" placeholder="kullaniciadi" defaultValue={user.personalInfo.social?.instagram ?? ''} />
                    </div>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="behance">Behance</Label>
                    <div className="flex items-center gap-2">
                        <Palette className="h-5 w-5 text-muted-foreground" />
                        <Input id="behance" placeholder="kullaniciadi" defaultValue={user.personalInfo.social?.behance ?? ''} />
                    </div>
                </div>
            </CardContent>
        </Card>
        
        <div className="flex justify-end">
          <Button type="submit">Değişiklikleri Kaydet</Button>
        </div>
      </form>
    </div>
  );
}
