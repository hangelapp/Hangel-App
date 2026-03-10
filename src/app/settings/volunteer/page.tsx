
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { user as staticUser, countryPhoneCodes, allInterests, allSkills, allDailySkills, allLanguages, allPrograms, allLicenses, allDocuments, allVisas, allSectors, allPositions, allUniversities } from '@/lib/data';
import { ArrowLeft, Loader2, Sparkles, Brain, Users, Cpu, Languages, FileText, Plane, Briefcase, HeartPulse, User as UserIcon, Phone } from 'lucide-react';
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
import { useUser, useFirestore, useDoc, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';

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
                <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] max-h-60 overflow-y-auto">
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
    const { user: authUser, isUserLoading } = useUser();
    const db = useFirestore();

    const [isOnboarding, setIsOnboarding] = useState(false);
    const [volunteerInfo, setVolunteerInfo] = useState(staticUser.volunteerInfo);

    const userDocRef = useMemoFirebase(() => {
        if (!db || !authUser) return null;
        return doc(db, 'users', authUser.uid);
    }, [db, authUser]);

    const { data: userData, isLoading: isUserDataLoading } = useDoc(userDocRef);

    useEffect(() => {
        const onboardingStep = localStorage.getItem('onboardingStep');
        if (onboardingStep === 'volunteer') {
            setIsOnboarding(true);
        }
    }, []);

    useEffect(() => {
        if (userData && userData.volunteerInfo) {
            setVolunteerInfo(userData.volunteerInfo);
        }
    }, [userData]);

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
        if (!userDocRef) return;

        updateDocumentNonBlocking(userDocRef, { volunteerInfo });

        if (isOnboarding) {
            toast({
                title: "Melek gibi insanlar topluluğuna hoş geldin!",
                description: "Profilin başarıyla tamamlandı.",
            });
            localStorage.removeItem('onboardingStep');
            router.push('/market');
        } else {
            toast({ title: "Bilgiler Güncellendi", description: "Değişiklikler kaydedildi." });
            router.push('/settings');
        }
    };

    if (isUserLoading || isUserDataLoading) {
        return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    return (
        <div className="p-4 space-y-6 animate-in fade-in-0 max-w-2xl mx-auto">
            <Button onClick={() => router.back()} variant="ghost" size="icon" className="mb-2 -ml-2">
                <ArrowLeft className="h-6 w-6" />
            </Button>
            <div>
                <h1 className="text-2xl font-bold font-headline">Gönüllülük Bilgileri</h1>
                <p className="text-muted-foreground text-sm">Yeteneklerinle topluma değer katmaya başla.</p>
            </div>
            
            <form className="space-y-6" onSubmit={handleSubmit}>
                <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" /> Hassasiyetler & Yetkinlikler</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        <MultiSelect title="Sosyal Hassasiyetler" options={allInterests} selected={volunteerInfo.interests} onSelectedChange={(val) => handleChange('interests', val)} />
                        <MultiSelect title="Profesyonel Yetkinlikler" options={allSkills} selected={volunteerInfo.skills} onSelectedChange={(val) => handleChange('skills', val)} />
                        <MultiSelect title="Sosyal/Günlük Yetkinlikler" options={allDailySkills} selected={volunteerInfo.dailySkills} onSelectedChange={(val) => handleChange('dailySkills', val)} />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2"><Briefcase className="h-5 w-5 text-primary" /> Eğitim & Kariyer</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                         <div className="space-y-2">
                            <Label>Üniversite</Label>
                            <Select value={volunteerInfo.education[0]?.school || ''} onValueChange={(v) => handleChange('education', [{ level: 'Lisans', school: v }])}>
                                <SelectTrigger><SelectValue placeholder="Seçiniz..." /></SelectTrigger>
                                <SelectContent className="max-h-60">{allUniversities.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div className="space-y-2">
                                <Label>Sektör</Label>
                                <Select value={volunteerInfo.sector || ''} onValueChange={(val) => handleChange('sector', val)}>
                                    <SelectTrigger><SelectValue placeholder="Seçiniz..." /></SelectTrigger>
                                    <SelectContent>{allSectors.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Pozisyon</Label>
                                <Select value={volunteerInfo.profession || ''} onValueChange={(val) => handleChange('profession', val)}>
                                    <SelectTrigger><SelectValue placeholder="Seçiniz..." /></SelectTrigger>
                                    <SelectContent className="max-h-60">{allPositions.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2"><Languages className="h-5 w-5 text-primary" /> Dil & Program & Vize</CardTitle></CardHeader>
                     <CardContent className="space-y-4">
                        <MultiSelect title="Yabancı Diller" options={allLanguages} selected={volunteerInfo.languages} onSelectedChange={(val) => handleChange('languages', val)} />
                        <MultiSelect title="Bildiği Programlar" options={allPrograms} selected={volunteerInfo.programs} onSelectedChange={(val) => handleChange('programs', val)} />
                        <MultiSelect title="Sahip Olunan Vizeler" options={allVisas} selected={volunteerInfo.travelInfo.visas} onSelectedChange={(val) => handleNestedChange('travelInfo', 'visas', val)} />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-primary" /> Lisanslar & Belgeler</CardTitle></CardHeader>
                     <CardContent className="space-y-4">
                        <MultiSelect title="Lisanslar" options={allLicenses} selected={volunteerInfo.licenses} onSelectedChange={(val) => handleChange('licenses', val)} />
                        <MultiSelect title="Onaylı Belgeler" options={allDocuments} selected={volunteerInfo.documents} onSelectedChange={(val) => handleChange('documents', val)} />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Phone className="h-5 w-5 text-primary" /> Acil Durum Kişileri (İsteğe Bağlı)</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-4">
                            <Label className="text-xs font-bold uppercase text-muted-foreground">Birinci Kişi</Label>
                            <Input placeholder="Ad Soyad" value={volunteerInfo.emergency.emergencyContacts[0]?.name || ''} onChange={(e) => handleEmergencyContactChange(0, 'name', e.target.value)} />
                            <div className="flex gap-2">
                                <div className="w-[80px] shrink-0">
                                    <Select defaultValue="90"><SelectTrigger className="h-10"><SelectValue /></SelectTrigger><SelectContent>{countryPhoneCodes.map(c => <SelectItem key={c} value={c}>+{c}</SelectItem>)}</SelectContent></Select>
                                </div>
                                <Input type="tel" placeholder="5XX..." value={volunteerInfo.emergency.emergencyContacts[0]?.phone || ''} onChange={(e) => handleEmergencyContactChange(0, 'phone', e.target.value)} className="flex-1" />
                            </div>
                        </div>
                        <div className="space-y-4 pt-4 border-t border-dashed">
                            <Label className="text-xs font-bold uppercase text-muted-foreground">İkinci Kişi</Label>
                            <Input placeholder="Ad Soyad" value={volunteerInfo.emergency.emergencyContacts[1]?.name || ''} onChange={(e) => handleEmergencyContactChange(1, 'name', e.target.value)} />
                            <div className="flex gap-2">
                                <div className="w-[80px] shrink-0">
                                    <Select defaultValue="90"><SelectTrigger className="h-10"><SelectValue /></SelectTrigger><SelectContent>{countryPhoneCodes.map(c => <SelectItem key={c} value={c}>+{c}</SelectItem>)}</SelectContent></Select>
                                </div>
                                <Input type="tel" placeholder="5XX..." value={volunteerInfo.emergency.emergencyContacts[1]?.phone || ''} onChange={(e) => handleEmergencyContactChange(1, 'phone', e.target.value)} className="flex-1" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader><CardTitle className="flex items-center gap-2"><HeartPulse className="h-5 w-5 text-primary" /> Sağlık Durumu</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                           <Label htmlFor="emergency-available" className="font-medium">Acil durumlarda gönüllülüğe uygunum</Label>
                           <Switch id="emergency-available" checked={volunteerInfo.emergency.available} onCheckedChange={(val) => handleNestedChange('emergency', 'available', val)} />
                        </div>
                        <div className="flex items-center space-x-2 p-4 border rounded-lg">
                            <Checkbox id="chronic-illness" checked={volunteerInfo.emergency.hasChronicIllness} onCheckedChange={(checked) => handleNestedChange('emergency', 'hasChronicIllness', !!checked)} />
                            <Label htmlFor="chronic-illness" className="text-sm">Kronik bir rahatsızlığım var.</Label>
                        </div>
                        <div className="flex items-center space-x-2 p-4 border rounded-lg">
                            <Checkbox id="regular-medication" checked={volunteerInfo.emergency.usesRegularMedication} onCheckedChange={(checked) => handleNestedChange('emergency', 'usesRegularMedication', !!checked)} />
                            <Label htmlFor="regular-medication" className="text-sm">Düzenli ilaç kullanıyorum.</Label>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end pt-4 pb-10">
                    <Button type="submit" size="lg" className="px-12 rounded-2xl font-black shadow-xl">Profili Tamamla</Button>
                </div>
            </form>
        </div>
    );
}
