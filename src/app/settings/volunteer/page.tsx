'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { user } from '@/lib/data';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

const allInterests = ['Hayvan Hakları', 'Çevre', 'Eğitim', 'Sağlık', 'Afet', 'Çocuk', 'Kadın Hakları', 'Kültür & Sanat', 'İnsan Hakları', 'Yoksullukla Mücadele'];
const allSkills = ['Proje Yönetimi', 'Sosyal Medya Yönetimi', 'Grafik Tasarım', 'Web Geliştirme', 'Kaynak Geliştirme', 'Hukuki Danışmanlık', 'Tercümanlık', 'Fotoğrafçılık', 'Video Kurgu'];
const allDailySkills = ['Yemek Yapma', 'Temizlik', 'El Becerileri', 'Organizasyon', 'İletişim', 'Tamirat', 'Bahçe İşleri', 'Çocuk Bakımı'];
const allLanguages = ['Türkçe', 'İngilizce', 'Almanca', 'Fransızca', 'Arapça', 'İspanyolca', 'Rusça', 'İşaret Dili'];
const allPrograms = ['MS Office', 'Google Workspace', 'Figma', 'Adobe Photoshop', 'Adobe Premiere', 'VS Code', 'Docker', 'Google Analytics'];
const allLicenses = ['B Sınıfı Ehliyet', 'A Sınıfı Ehliyet', 'SRC Belgesi', 'İş Güvenliği Uzmanlığı', 'Profesyonel Turist Rehberi Kokartı'];
const allDocuments = ['İlk Yardım Sertifikası', 'Hijyen Belgesi', 'Scrum Master Sertifikası', 'Pedagojik Formasyon', 'Afet Bilinci Eğitimi Sertifikası'];
const allVisas = ['Schengen', 'ABD (B1/B2)', 'İngiltere', 'Kanada'];
const allSectors = ['Teknoloji', 'Sağlık', 'Eğitim', 'Finans', 'Sanat ve Kültür', 'Hukuk', 'Kamu', 'Perakende', 'Turizm', 'Gıda', 'İnşaat'];
const allPositions = ['Yazılım Geliştirici', 'Doktor', 'Öğretmen', 'Avukat', 'Grafik Tasarımcı', 'Proje Yöneticisi', 'Öğrenci', 'Emekli', 'Serbest Çalışan'];
const allUniversities = ['Boğaziçi Üniversitesi', 'İstanbul Teknik Üniversitesi', 'Orta Doğu Teknik Üniversitesi', 'Galatasaray Üniversitesi', 'Koç Üniversitesi', 'Sabancı Üniversitesi', 'Hacettepe Üniversitesi', 'Bilkent Üniversitesi'];
const allHighSchools = ['Kabataş Erkek Lisesi', 'Galatasaray Lisesi', 'İstanbul Erkek Lisesi', 'Robert Kolej', 'Ankara Fen Lisesi', 'İzmir Fen Lisesi'];

const faculties = {
    'Boğaziçi Üniversitesi': ['Mühendislik Fakültesi', 'İİBF', 'Fen-Edebiyat Fakültesi'],
    'İstanbul Teknik Üniversitesi': ['İnşaat Fakültesi', 'Mimarlık Fakültesi', 'Makine Fakültesi', 'Elektrik-Elektronik Fakültesi'],
};
const departments = {
    'Mühendislik Fakültesi': ['Bilgisayar Müh.', 'Endüstri Müh.', 'İnşaat Müh.'],
    'İİBF': ['İşletme', 'Ekonomi', 'Siyaset Bilimi ve Uluslararası İlişkiler'],
};

const MultiSelect = ({ title, options, selected, onSelectedChange }: { title: string, options: string[], selected: string[], onSelectedChange: (selected: string[]) => void }) => {
    return (
        <div className="space-y-2">
            <Label>{title}</Label>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal h-auto min-h-10">
                        {selected.length > 0 ? (
                             <div className="flex flex-wrap gap-1">
                                {selected.map((item) => (
                                    <Badge key={item} variant="secondary" className="font-normal">{item}</Badge>
                                ))}
                            </div>
                        ) : `${title} seçin...`}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width]">
                    {options.map((option) => (
                        <DropdownMenuCheckboxItem
                            key={option}
                            checked={selected.includes(option)}
                            onCheckedChange={(checked) => {
                                if (checked) {
                                    onSelectedChange([...selected, option]);
                                } else {
                                    onSelectedChange(selected.filter((item) => item !== option));
                                }
                            }}
                        >
                            {option}
                        </DropdownMenuCheckboxItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
};


export default function VolunteerSettingsPage() {
    const router = useRouter();
    const { toast } = useToast();

    const [interests, setInterests] = useState(user.volunteerInfo.interests);
    const [skills, setSkills] = useState(user.volunteerInfo.skills);
    const [dailySkills, setDailySkills] = useState(user.volunteerInfo.dailySkills);
    const [languages, setLanguages] = useState(user.volunteerInfo.languages);
    const [programs, setPrograms] = useState(user.volunteerInfo.programs);
    const [licenses, setLicenses] = useState(user.volunteerInfo.licenses);
    const [documents, setDocuments] = useState(user.volunteerInfo.documents);
    const [visas, setVisas] = useState(user.volunteerInfo.travelInfo.visas);
    
    const [university, setUniversity] = useState(user.volunteerInfo.education.find(e => e.level === 'Lisans')?.school || '');
    const [highSchool, setHighSchool] = useState(user.volunteerInfo.education.find(e => e.level === 'Lise')?.school || '');
    const [faculty, setFaculty] = useState('');
    const [department, setDepartment] = useState('');
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        toast({
            title: "Gönüllülük Bilgileri Güncellendi",
            description: "Bilgileriniz başarıyla kaydedildi.",
        });
    };

    return (
        <div className="p-4 space-y-6 animate-in fade-in-0">
            <Button onClick={() => router.back()} variant="ghost" size="icon" className="mb-2 -ml-2">
                <ArrowLeft className="h-6 w-6" />
            </Button>
            <div>
                <h1 className="text-2xl font-bold font-headline">Gönüllülük Bilgilerini Düzenle</h1>
                <p className="text-muted-foreground text-sm">Size en uygun fırsatları önerebilmemiz için bilgilerinizi güncel tutun.</p>
            </div>
            
            <form className="space-y-6" onSubmit={handleSubmit}>
                <Card>
                    <CardHeader>
                        <CardTitle>Yetkinlik ve Sosyal Hassasiyetler</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <MultiSelect title="Sosyal Hassasiyetler" options={allInterests} selected={interests} onSelectedChange={setInterests} />
                        <MultiSelect title="Profesyonel Yetkinlikler" options={allSkills} selected={skills} onSelectedChange={setSkills} />
                        <MultiSelect title="Sosyal Yetkinlikler" options={allDailySkills} selected={dailySkills} onSelectedChange={setDailySkills} />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Eğitim ve Kariyer</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         <div className="space-y-2">
                            <Label>Üniversite</Label>
                            <Select value={university} onValueChange={(value) => { setUniversity(value); setFaculty(''); setDepartment(''); }}>
                                <SelectTrigger><SelectValue placeholder="Üniversite seçin..." /></SelectTrigger>
                                <SelectContent>
                                    {allUniversities.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Fakülte</Label>
                                <Select value={faculty} onValueChange={(value) => { setFaculty(value); setDepartment(''); }} disabled={!university}>
                                    <SelectTrigger><SelectValue placeholder="Fakülte seçin..." /></SelectTrigger>
                                    <SelectContent>
                                        {(faculties[university as keyof typeof faculties] || []).map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Bölüm</Label>
                                <Select value={department} onValueChange={setDepartment} disabled={!faculty}>
                                    <SelectTrigger><SelectValue placeholder="Bölüm seçin..." /></SelectTrigger>
                                    <SelectContent>
                                         {(departments[faculty as keyof typeof departments] || []).map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                         <div className="space-y-2">
                            <Label>Lise</Label>
                            <Select value={highSchool} onValueChange={setHighSchool}>
                                <SelectTrigger><SelectValue placeholder="Lise seçin..." /></SelectTrigger>
                                <SelectContent>
                                    {allHighSchools.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div className="space-y-2">
                                <Label htmlFor="sector">Çalıştığınız Sektör</Label>
                                <Select defaultValue={user.volunteerInfo.sector ?? ''}>
                                    <SelectTrigger id="sector"><SelectValue placeholder="Sektör seçin..." /></SelectTrigger>
                                    <SelectContent>
                                        {allSectors.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="profession">Çalıştığınız Pozisyon</Label>
                                <Select defaultValue={user.volunteerInfo.profession ?? ''}>
                                    <SelectTrigger id="profession"><SelectValue placeholder="Pozisyon seçin..." /></SelectTrigger>
                                    <SelectContent>
                                        {allPositions.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader>
                        <CardTitle>Dil ve Program Bilgisi</CardTitle>
                    </CardHeader>
                     <CardContent className="space-y-4">
                        <MultiSelect title="Yabancı Diller" options={allLanguages} selected={languages} onSelectedChange={setLanguages} />
                        <MultiSelect title="Bildiği Programlar" options={allPrograms} selected={programs} onSelectedChange={setPrograms} />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Belgeler ve Lisanslar</CardTitle>
                    </CardHeader>
                     <CardContent className="space-y-4">
                        <MultiSelect title="Lisanslar" options={allLicenses} selected={licenses} onSelectedChange={setLicenses} />
                        <MultiSelect title="Belgeler" options={allDocuments} selected={documents} onSelectedChange={setDocuments} />
                    </CardContent>
                </Card>
                
                 <Card>
                    <CardHeader>
                        <CardTitle>Seyahat Uygunluğu</CardTitle>
                    </CardHeader>
                     <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                           <Label htmlFor="domestic-travel" className="font-medium">Yurtiçi seyahat engelim yok</Label>
                           <Switch id="domestic-travel" defaultChecked={!user.volunteerInfo.travelInfo.domesticObstacle} />
                        </div>
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                           <Label htmlFor="international-travel" className="font-medium">Yurtdışı seyahat engelim yok</Label>
                           <Switch id="international-travel" defaultChecked={!user.volunteerInfo.travelInfo.internationalObstacle} />
                        </div>
                         <div className="space-y-2">
                           <MultiSelect title="Sahip Olunan Vizeler" options={allVisas} selected={visas} onSelectedChange={setVisas} />
                        </div>
                     </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Acil Durum Kişileri</CardTitle>
                        <CardDescription>Acil bir durumda ulaşılacak kişilerin bilgilerini girin. Bu bilgiler sadece acil durum prosedürleri için kullanılacaktır.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div>
                            <h4 className="font-medium text-base mb-2">Acil Durum Kişisi 1</h4>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="emergency-contact-name-1">Ad Soyad</Label>
                                    <Input id="emergency-contact-name-1" defaultValue={user.volunteerInfo.emergency.emergencyContacts[0]?.name} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="emergency-contact-phone-1">Telefon</Label>
                                    <Input id="emergency-contact-phone-1" type="tel" defaultValue={user.volunteerInfo.emergency.emergencyContacts[0]?.phone} />
                                </div>
                            </div>
                        </div>
                        <div className="border-t pt-6">
                            <h4 className="font-medium text-base mb-2">Acil Durum Kişisi 2</h4>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="emergency-contact-name-2">Ad Soyad</Label>
                                    <Input id="emergency-contact-name-2" defaultValue={user.volunteerInfo.emergency.emergencyContacts[1]?.name || ''} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="emergency-contact-phone-2">Telefon</Label>
                                    <Input id="emergency-contact-phone-2" type="tel" defaultValue={user.volunteerInfo.emergency.emergencyContacts[1]?.phone || ''} />
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Sağlık Bilgileri</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                           <Label htmlFor="emergency-available" className="font-medium">Acil durumlarda gönüllülüğe uygunum</Label>
                           <Switch id="emergency-available" defaultChecked={user.volunteerInfo.emergency.available} />
                        </div>
                        <div className="flex items-center space-x-2 p-4 border rounded-lg">
                            <Checkbox id="chronic-illness" defaultChecked={user.volunteerInfo.emergency.hasChronicIllness} />
                            <Label htmlFor="chronic-illness">Kronik bir rahatsızlığım var.</Label>
                        </div>
                        <div className="flex items-center space-x-2 p-4 border rounded-lg">
                            <Checkbox id="regular-medication" defaultChecked={user.volunteerInfo.emergency.usesRegularMedication} />
                            <Label htmlFor="regular-medication">Düzenli olarak kullandığım bir ilaç var.</Label>
                        </div>
                         <div className="flex items-center space-x-2 p-4 border rounded-lg">
                            <Checkbox id="physical-limitation" defaultChecked={user.volunteerInfo.emergency.hasPhysicalLimitation} />
                            <Label htmlFor="physical-limitation">Fiziksel bir kısıtlılığım var.</Label>
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
