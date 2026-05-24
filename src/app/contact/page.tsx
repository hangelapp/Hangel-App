
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, User, Building, Store, Briefcase, MapPin } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { countryPhoneCodes } from '@/lib/data';
import { LocationFields, type LocationValue } from '@/components/shared/location-fields';

const institutionTypeOptions = ["Belediye", "Bakanlık", "Üniversite", "Lise", "Şirket", "Diğer"];

const AddressSelection = ({ required = false }: { required?: boolean }) => {
    const [addr, setAddr] = useState<LocationValue>({ country: 'Türkiye', city: '', district: '', neighborhood: '' });

    return (
        <div className="space-y-4 pt-2 border-t border-dashed">
            <h4 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5" /> Adres Bilgileri
            </h4>
            <LocationFields value={addr} onChange={setAddr} required={required} />
        </div>
    );
};

// Individual Form Component
const IndividualContactForm = () => {
    const { toast } = useToast();
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        toast({ title: "Mesajınız Gönderildi", description: "Destek ekibimiz en kısa sürede sizinle iletişime geçecektir." });
    };
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="ind-name">Ad Soyad</Label>
                <Input id="ind-name" placeholder="İsmail Hilmi ADIGÜZEL" required />
            </div>
            <div className="space-y-2">
                <Label htmlFor="ind-email">E-posta</Label>
                <Input id="ind-email" type="email" placeholder="ornek@eposta.com" required />
            </div>
            <AddressSelection required={false} />
            <div className="space-y-2">
                <Label htmlFor="ind-subject">Konu</Label>
                <Input id="ind-subject" placeholder="Talebinizin konusu" required />
            </div>
            <div className="space-y-2">
                <Label htmlFor="ind-message">Mesajınız</Label>
                <Textarea id="ind-message" placeholder="Mesajınızı buraya yazın..." required />
            </div>
            <Button type="submit" className="w-full">Gönder</Button>
        </form>
    );
};

// NGO Form Component
const NgoContactForm = () => {
    const { toast } = useToast();
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        toast({ title: "Mesajınız Gönderildi", description: "STK ilişkileri ekibimiz sizinle iletişime geçecektir." });
    };
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="ngo-name">STK Adı</Label>
                <Input id="ngo-name" placeholder="Kuruluşunuzun tam adı" required />
            </div>
             <div className="space-y-2">
                <Label htmlFor="ngo-contact-name">Yetkili Adı</Label>
                <Input id="ngo-contact-name" placeholder="İsmail Hilmi ADIGÜZEL" required />
            </div>
            <div className="space-y-2">
                <Label htmlFor="ngo-email">E-posta</Label>
                <Input id="ngo-email" type="email" placeholder="iletisim@stk.org.tr" required />
            </div>
            <AddressSelection />
            <div className="space-y-2">
                <Label htmlFor="ngo-message">Mesajınız</Label>
                <Textarea id="ngo-message" placeholder="İşbirliği talebinizi veya sorunuzu detaylandırın..." required />
            </div>
            <Button type="submit" className="w-full">Gönder</Button>
        </form>
    );
};

// Brand Form Component
const BrandContactForm = () => {
    const { toast } = useToast();
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        toast({ title: "Mesajınız Gönderildi", description: "Marka ilişkileri ekibimiz sizinle iletişime geçecektir." });
    };
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="brand-name">Marka/Şirket Adı</Label>
                <Input id="brand-name" placeholder="Markanızın adı" required />
            </div>
             <div className="space-y-2">
                <Label htmlFor="brand-contact-name">Yetkili Adı</Label>
                <Input id="brand-contact-name" placeholder="İsmail Hilmi ADIGÜZEL" required />
            </div>
            <div className="space-y-2">
                <Label htmlFor="brand-email">E-posta</Label>
                <Input id="brand-email" type="email" placeholder="kurumsal@marka.com" required />
            </div>
            <AddressSelection />
             <div className="space-y-2">
                <Label htmlFor="brand-website">Web Sitesi</Label>
                <Input id="brand-website" placeholder="https://marka.com" />
            </div>
            <div className="space-y-2">
                <Label htmlFor="brand-message">Mesajınız</Label>
                <Textarea id="brand-message" placeholder="İşbirliği teklifinizi veya sorunuzu yazın..." required />
            </div>
            <Button type="submit" className="w-full">Gönder</Button>
        </form>
    );
};

// Public/Corporate Form Component
const CorporateContactForm = () => {
    const { toast } = useToast();
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        toast({ title: "Mesajınız Gönderildi", description: "hangel iş geliştirme ekibi en kısa sürede sizinle iletişime geçecektir." });
    };
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-muted-foreground">Kuruluşunuza özel bir plan oluşturalım. Öncelikle lütfen birkaç kısa soruyu yanıtlayın.</p>
            <div className="space-y-2">
                <Label htmlFor="institution-type">Kurum Türü</Label>
                <Select required>
                    <SelectTrigger id="institution-type"><SelectValue placeholder="Birini seçin" /></SelectTrigger>
                    <SelectContent>
                        {institutionTypeOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label htmlFor="purpose">İşbirliği Amacı</Label>
                <Textarea id="purpose" placeholder="Kurmak istediğiniz işbirliğinin amacını kısaca açıklayınız..." required />
            </div>
            <AddressSelection />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="first-name">İlk adı</Label>
                    <Input id="first-name" placeholder="İsmail Hilmi" required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="last-name">Soyadı</Label>
                    <Input id="last-name" placeholder="ADIGÜZEL" required />
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <Label htmlFor="email">E-posta</Label>
                    <Input id="email" type="email" placeholder="kurumsal@eposta.com" required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="phone">Telefon Numarası</Label>
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
                        <Input id="phone" type="tel" placeholder="5XX XXX XX XX" required className="flex-1" />
                    </div>
                </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="department">Departman</Label>
                <Input id="department" placeholder="Departmanınız (örn: Kurumsal İletişim)" />
            </div>
            <Button type="submit" className="w-full">Gönder</Button>
            <p className="text-xs text-muted-foreground pt-2">
                “Gönder” düğmesine tıklayarak, talebinizi karşılamak için bilgilerinizi yetkili ortaklarımızla paylaşmayı kabul ediyorsunuz.
            </p>
        </form>
    );
};

export default function ContactPage() {
    const router = useRouter();

    return (
        <div className="p-4 sm:p-6 space-y-8 animate-in fade-in-0">
            <Button onClick={() => router.back()} variant="ghost" size="icon" className="mb-2 -ml-2" aria-label="Geri">
                <ArrowLeft className="h-6 w-6" />
            </Button>
            <div className="text-center space-y-4">
                <h1 className="text-3xl font-bold font-headline">İletişim Merkezi</h1>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                    Doğru departmana daha hızlı ulaşmak için aşağıdaki kategorilerden birini seçin.
                </p>
            </div>

            <Card className="max-w-3xl mx-auto">
                 <Tabs defaultValue="individual" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="individual"><User className="mr-2 h-4 w-4" /> Bireysel</TabsTrigger>
                        <TabsTrigger value="ngo"><Building className="mr-2 h-4 w-4" /> STK</TabsTrigger>
                        <TabsTrigger value="brand"><Store className="mr-2 h-4 w-4" /> Marka</TabsTrigger>
                        <TabsTrigger value="corporate"><Briefcase className="mr-2 h-4 w-4" /> Kurumsal</TabsTrigger>
                    </TabsList>
                    <TabsContent value="individual">
                        <CardHeader>
                            <CardTitle>Bireysel Destek Talebi</CardTitle>
                            <CardDescription>Uygulama kullanımı, puanlar ve genel sorularınız için bize yazın.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <IndividualContactForm />
                        </CardContent>
                    </TabsContent>
                    <TabsContent value="ngo">
                        <CardHeader>
                            <CardTitle>STK İşbirliği Formu</CardTitle>
                            <CardDescription>Kuruluşunuzu hangel'e dahil etmek veya işbirliği için bize ulaşın.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <NgoContactForm />
                        </CardContent>
                    </TabsContent>
                    <TabsContent value="brand">
                         <CardHeader>
                            <CardTitle>Marka & İşletme İşbirliği Formu</CardTitle>
                            <CardDescription>Markanızla sosyal etki yaratmak veya QR ödeme sistemine dahil olmak için bize ulaşın.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <BrandContactForm />
                        </CardContent>
                    </TabsContent>
                    <TabsContent value="corporate">
                        <CardHeader>
                            <CardTitle>Genel Kurumsal İletişim Formu</CardTitle>
                            <CardDescription>
                                Kamu kurumları veya diğer kurumsal talepleriniz için bu formu kullanın.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <CorporateContactForm />
                        </CardContent>
                    </TabsContent>
                </Tabs>
            </Card>
        </div>
    );
}
