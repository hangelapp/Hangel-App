'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { user } from '@/lib/data';
import { ArrowLeft, Github, Linkedin, Twitter, Globe, Palette, Instagram } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ProfileSettingsPage() {
  const router = useRouter();

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
                        <Input id="nationality" defaultValue={user.personalInfo.nationality} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="bloodType">Kan Grubu</Label>
                        <Input id="bloodType" defaultValue={user.personalInfo.bloodType} />
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
                        <Input id="city" defaultValue={user.personalInfo.address.city} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="district">İlçe</Label>
                        <Input id="district" defaultValue={user.personalInfo.address.district} />
                    </div>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="fullAddress">Açık Adres</Label>
                    <Input id="fullAddress" defaultValue={user.personalInfo.address.fullAddress} />
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
