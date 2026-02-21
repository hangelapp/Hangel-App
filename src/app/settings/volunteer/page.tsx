
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { user as staticUser } from '@/lib/data';
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
    const [isOnboarding, setIsOnboarding] = useState(false);

    // Main state for volunteer info
    const [volunteerInfo, setVolunteerInfo] = useState(staticUser.volunteerInfo);

    useEffect(() => {
        const onboardingStep = localStorage.getItem('onboardingStep');
        if (onboardingStep === 'volunteer') {
            setIsOnboarding(true);
        }
        const savedUser = localStorage.getItem('hangel-user');
        if (savedUser) {
            setVolunteerInfo(JSON.parse(savedUser).volunteerInfo || staticUser.volunteerInfo);
        }
    }, []);

    const handleChange = (field: string, value: any) => {
        setVolunteerInfo(prev => ({ ...prev, [field]: value }));
    };

    const handleNestedChange = (section: keyof typeof volunteerInfo, field: string, value: any) => {
        setVolunteerInfo(prev => ({
            ...prev,
            [section]: {
                ...(prev[section] as object),
                [field]: value,
            },
        }));
    };
    
    const handleEducationChange = (level: 'Lisans' | 'Lise', field: 'school', value: string) => {
        setVolunteerInfo(prev => {
            const newEducation = [...prev.education];
            const eduIndex = newEducation.findIndex(e => e.level === level);
            if (eduIndex > -1) {
                newEducation[eduIndex] = { ...newEducation[eduIndex], [field]: value };
            } else {
                newEducation.push({ level, school: value });
            }
            return { ...prev, education: newEducation };
        });
    };

    const handleEmergencyContactChange = (index: number, field: 'name' | 'phone', value: string) => {
        setVolunteerInfo(prev => {
            const newContacts = [...prev.emergency.emergencyContacts];
            if (!newContacts[index]) newContacts[index] = { name: '', phone: ''};
            newContacts[index][field] = value;
            return { ...prev, emergency: { ...prev.emergency, emergencyContacts: newContacts } };
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const currentData = JSON.parse(localStorage.getItem('hangel-user') || '{}');
        const updatedData = { ...currentData, volunteerInfo };
        localStorage.setItem('hangel-user', JSON.stringify(updatedData));
        toast({
            title: "Gönüllülük Bilgileri Güncellendi",
            description: "Bilgileriniz başarıyla kaydedildi.",
        });
        if (isOnboarding) {
            localStorage.removeItem('onboardingStep');
            router.push('/market');
        } else {
            router.push('/settings');
        }
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
                        <MultiSelect title="Sosyal Hassasiyetler" options={allInterests} selected={volunteerInfo.interests} onSelectedChange={(val) => handleChange('interests', val)} />
                        <MultiSelect title="Profesyonel Yetkinlikler" options={allSkills} selected={volunteerInfo.skills} onSelectedChange={(val) => handleChange('skills', val)} />
                        <MultiSelect title="Sosyal Yetkinlikler" options={allDailySkills} selected={volunteerInfo.dailySkills} onSelectedChange={(val) => handleChange('dailySkills', val)} />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Eğitim ve Kariyer</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         <div className="space-y-2">
                            <Label>Üniversite</Label>
                            <Select value={volunteerInfo.education.find(e => e.level === 'Lisans')?.school || ''} onValueChange={(value) => handleEducationChange('Lisans', 'school', value)}>
                                <SelectTrigger><SelectValue placeholder="Üniversite seçin..." /></SelectTrigger>
                                <SelectContent>
                                    {allUniversities.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                         <div className="space-y-2">
                            <Label>Lise</Label>
                            <Select value={volunteerInfo.education.find(e => e.level === 'Lise')?.school || ''} onValueChange={(value) => handleEducationChange('Lise', 'school', value)}>
                                <SelectTrigger><SelectValue placeholder="Lise seçin..." /></SelectTrigger>
                                <SelectContent>
                                    {allHighSchools.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div className="space-y-2">
                                <Label htmlFor="sector">Çalıştığınız Sektör</Label>
                                <Select value={volunteerInfo.sector || ''} onValueChange={(val) => handleChange('sector', val)}>
                                    <SelectTrigger id="sector"><SelectValue placeholder="Sektör seçin..." /></SelectTrigger>
                                    <SelectContent>
                                        {allSectors.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="profession">Çalıştığınız Pozisyon</Label>
                                <Select value={volunteerInfo.profession || ''} onValueChange={(val) => handleChange('profession', val)}>
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
                        <MultiSelect title="Yabancı Diller" options={allLanguages} selected={volunteerInfo.languages} onSelectedChange={(val) => handleChange('languages', val)} />
                        <MultiSelect title="Bildiği Programlar" options={allPrograms} selected={volunteerInfo.programs} onSelectedChange={(val) => handleChange('programs', val)} />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Belgeler ve Lisanslar</CardTitle>
                    </CardHeader>
                     <CardContent className="space-y-4">
                        <MultiSelect title="Lisanslar" options={allLicenses} selected={volunteerInfo.licenses} onSelectedChange={(val) => handleChange('licenses', val)} />
                        <MultiSelect title="Belgeler" options={allDocuments} selected={volunteerInfo.documents} onSelectedChange={(val) => handleChange('documents', val)} />
                    </CardContent>
                </Card>
                
                 <Card>
                    <CardHeader>
                        <CardTitle>Seyahat Uygunluğu</CardTitle>
                    </CardHeader>
                     <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                           <Label htmlFor="domestic-travel" className="font-medium">Yurtiçi seyahat engelim yok</Label>
                           <Switch id="domestic-travel" checked={!volunteerInfo.travelInfo.domesticObstacle} onCheckedChange={(val) => handleNestedChange('travelInfo', 'domesticObstacle', !val)} />
                        </div>
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                           <Label htmlFor="international-travel" className="font-medium">Yurtdışı seyahat engelim yok</Label>
                           <Switch id="international-travel" checked={!volunteerInfo.travelInfo.internationalObstacle} onCheckedChange={(val) => handleNestedChange('travelInfo', 'internationalObstacle', !val)} />
                        </div>
                         <div className="space-y-2">
                           <MultiSelect title="Sahip Olunan Vizeler" options={allVisas} selected={volunteerInfo.travelInfo.visas} onSelectedChange={(val) => handleNestedChange('travelInfo', 'visas', val)} />
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
                                    <Input id="emergency-contact-name-1" value={volunteerInfo.emergency.emergencyContacts[0]?.name || ''} onChange={(e) => handleEmergencyContactChange(0, 'name', e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="emergency-contact-phone-1">Telefon</Label>
                                    <Input id="emergency-contact-phone-1" type="tel" value={volunteerInfo.emergency.emergencyContacts[0]?.phone || ''} onChange={(e) => handleEmergencyContactChange(0, 'phone', e.target.value)} />
                                </div>
                            </div>
                        </div>
                        <div className="border-t pt-6">
                            <h4 className="font-medium text-base mb-2">Acil Durum Kişisi 2</h4>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="emergency-contact-name-2">Ad Soyad</Label>
                                    <Input id="emergency-contact-name-2" value={volunteerInfo.emergency.emergencyContacts[1]?.name || ''} onChange={(e) => handleEmergencyContactChange(1, 'name', e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="emergency-contact-phone-2">Telefon</Label>
                                    <Input id="emergency-contact-phone-2" type="tel" value={volunteerInfo.emergency.emergencyContacts[1]?.phone || ''} onChange={(e) => handleEmergencyContactChange(1, 'phone', e.target.value)} />
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
                           <Switch id="emergency-available" checked={volunteerInfo.emergency.available} onCheckedChange={(val) => handleNestedChange('emergency', 'available', val)} />
                        </div>
                        <div className="flex items-center space-x-2 p-4 border rounded-lg">
                            <Checkbox id="chronic-illness" checked={volunteerInfo.emergency.hasChronicIllness} onCheckedChange={(checked) => handleNestedChange('emergency', 'hasChronicIllness', checked)} />
                            <Label htmlFor="chronic-illness">Kronik bir rahatsızlığım var.</Label>
                        </div>
                        <div className="flex items-center space-x-2 p-4 border rounded-lg">
                            <Checkbox id="regular-medication" checked={volunteerInfo.emergency.usesRegularMedication} onCheckedChange={(checked) => handleNestedChange('emergency', 'usesRegularMedication', checked)} />
                            <Label htmlFor="regular-medication">Düzenli olarak kullandığım bir ilaç var.</Label>
                        </div>
                         <div className="flex items-center space-x-2 p-4 border rounded-lg">
                            <Checkbox id="physical-limitation" checked={volunteerInfo.emergency.hasPhysicalLimitation} onCheckedChange={(checked) => handleNestedChange('emergency', 'hasPhysicalLimitation', checked)} />
                            <Label htmlFor="physical-limitation">Fiziksel bir kısıtlılığım var.</Label>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end">
                    <Button type="submit">{isOnboarding ? "Bitir ve Keşfetmeye Başla" : "Değişiklikleri Kaydet"}</Button>
                </div>
            </form>
        </div>
    );
}
