
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { user } from '@/lib/data';
import { ArrowLeft, Github, Linkedin, Globe, Palette, Instagram } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

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
    'İstanbul': ['Adalar', 'Arnavutköy', 'Ataşehir', 'Avcılar', 'Bağcılar', 'Bahçelievler', 'Bakırköy', 'Başakşehir', 'Bayrampaşa', 'Beşiktaş', 'Beykoz', 'Beylikdüzü', 'Beyoğlu', 'Büyükçekmece', 'Çatalca', 'Çekmeköy', 'Esenler', 'Esenyurt', 'Eyüpsultan', 'Fatih', 'Gaziosmanpaşa', 'Güngören', 'Kadıköy', 'Kağıthane', 'Kartal', 'Küçükçekmece', 'Maltepe', 'Pendik', 'Sancaktepe', 'Sarıyer', 'Silivri', 'Sultanbeyli', 'Sultangazi', 'Şile', 'Şişli', 'Tuzla', 'Ümraniye', 'Üsküdar', 'Zeytinburnu'],
    'Ankara': ['Akyurt', 'Altındağ', 'Ayaş', 'Balâ', 'Beypazarı', 'Çamlıdere', 'Çankaya', 'Çubuk', 'Elmadağ', 'Etimesgut', 'Evren', 'Gölbaşı', 'Güdül', 'Haymana', 'Kahramankazan', 'Kalecik', 'Keçiören', 'Kızılcahamam', 'Mamak', 'Nallıhan', 'Polatlı', 'Pursaklar', 'Sincan', 'Şereflikoçhisar', 'Yenimahalle'],
    'İzmir': ['Aliağa', 'Balçova', 'Bayındır', 'Bayraklı', 'Bergama', 'Beydağ', 'Bornova', 'Buca', 'Çeşme', 'Çiğli', 'Dikili', 'Foça', 'Gaziemir', 'Güzelbahçe', 'Karabağlar', 'Karaburun', 'Karşıyaka', 'Kemalpaşa', 'Kınık', 'Kiraz', 'Konak', 'Menderes', 'Menemen', 'Narlıdere', 'Ödemiş', 'Seferihisar', 'Selçuk', 'Tire', 'Torbalı', 'Urla'],
};

export default function ProfileSettingsPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [name, setName] = useState(user.name);
  const [username, setUsername] = useState(user.username.replace('@', ''));
  const [email, setEmail] = useState(user.personalInfo.email);
  const [phone, setPhone] = useState(user.personalInfo.phone);
  const [birthDate, setBirthDate] = useState(user.personalInfo.birthDate);
  const [gender, setGender] = useState(user.personalInfo.gender);
  const [nationality, setNationality] = useState(user.personalInfo.nationality);
  const [bloodType, setBloodType] = useState(user.personalInfo.bloodType);
  const [city, setCity] = useState(user.personalInfo.address.city);
  const [district, setDistrict] = useState(user.personalInfo.address.district);
  const [fullAddress, setFullAddress] = useState(user.personalInfo.address.fullAddress);
  const [website, setWebsite] = useState(user.personalInfo.website ?? '');
  const [linkedin, setLinkedin] = useState(user.personalInfo.social?.linkedin ?? '');
  const [github, setGithub] = useState(user.personalInfo.social?.github ?? '');
  const [twitter, setTwitter] = useState(user.personalInfo.social?.twitter ?? '');
  const [instagram, setInstagram] = useState(user.personalInfo.social?.instagram ?? '');
  const [behance, setBehance] = useState(user.personalInfo.social?.behance ?? '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Profil Güncellendi",
      description: "Kişisel bilgileriniz başarıyla kaydedildi.",
    });
  };

  return (
    <div className="p-4 space-y-6 animate-in fade-in-0">
       <Button onClick={() => router.back()} variant="ghost" size="icon" className="mb-2 -ml-2">
            <ArrowLeft className="h-6 w-6" />
        </Button>
      <div>
        <h1 className="text-2xl font-bold font-headline">Kişisel Bilgileri Düzenle</h1>
        <p className="text-muted-foreground text-sm">Platformdaki profil bilgilerinizi güncelleyin.</p>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit}>
        <Card>
            <CardHeader>
                <CardTitle>Temel Bilgiler</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Ad Soyad</Label>
                        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="username">Kullanıcı Adı (Profil Linki)</Label>
                        <div className="relative">
                            <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} className="pl-8"/>
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">@</span>
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">E-posta</Label>
                        <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="phone">Telefon</Label>
                        <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
                    </div>
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="birthDate">Doğum Tarihi</Label>
                        <Input id="birthDate" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="gender">Cinsiyet</Label>
                        <Select value={gender} onValueChange={setGender}>
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
                        <Select value={nationality} onValueChange={setNationality}>
                            <SelectTrigger id="nationality"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {nationalities.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="bloodType">Kan Grubu</Label>
                         <Select value={bloodType} onValueChange={setBloodType}>
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
                        <Select value={city} onValueChange={setCity}>
                            <SelectTrigger id="city"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {cities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="district">İlçe</Label>
                        <Select value={district} onValueChange={setDistrict} disabled={!city}>
                            <SelectTrigger id="district"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {city && districts[city] && districts[city].map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="fullAddress">Açık Adres</Label>
                    <Input id="fullAddress" placeholder="Mahalle, cadde, sokak, no..." value={fullAddress} onChange={(e) => setFullAddress(e.target.value)} />
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
                        <Input id="website" placeholder="https://..." value={website} onChange={(e) => setWebsite(e.target.value)} />
                    </div>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="linkedin">LinkedIn</Label>
                    <div className="flex items-center gap-2">
                        <Linkedin className="h-5 w-5 text-muted-foreground" />
                        <Input id="linkedin" placeholder="linkedin.com/in/kullaniciadi" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} />
                    </div>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="github">GitHub</Label>
                    <div className="flex items-center gap-2">
                        <Github className="h-5 w-5 text-muted-foreground" />
                        <Input id="github" placeholder="kullaniciadi" value={github} onChange={(e) => setGithub(e.target.value)} />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="twitter">X.com</Label>
                    <div className="flex items-center gap-2">
                        <XIcon className="h-5 w-5 text-muted-foreground" />
                        <Input id="twitter" placeholder="kullaniciadi" value={twitter} onChange={(e) => setTwitter(e.target.value)} />
                    </div>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="instagram">Instagram</Label>
                    <div className="flex items-center gap-2">
                        <Instagram className="h-5 w-5 text-muted-foreground" />
                        <Input id="instagram" placeholder="kullaniciadi" value={instagram} onChange={(e) => setInstagram(e.target.value)} />
                    </div>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="behance">Behance</Label>
                    <div className="flex items-center gap-2">
                        <Palette className="h-5 w-5 text-muted-foreground" />
                        <Input id="behance" placeholder="kullaniciadi" value={behance} onChange={(e) => setBehance(e.target.value)} />
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
