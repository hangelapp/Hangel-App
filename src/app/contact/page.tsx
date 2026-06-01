
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
import { useTranslation } from '@/components/providers/language-provider';

const AddressSelection = ({ required = false }: { required?: boolean }) => {
    const { t } = useTranslation();
    const [addr, setAddr] = useState<LocationValue>({ country: 'Türkiye', city: '', district: '', neighborhood: '' });

    return (
        <div className="space-y-4 pt-2 border-t border-dashed">
            <h4 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5" /> {t('contactPage.addressInfo')}
            </h4>
            <LocationFields value={addr} onChange={setAddr} required={required} />
        </div>
    );
};

// Individual Form Component
const IndividualContactForm = () => {
    const { toast } = useToast();
    const { t } = useTranslation();
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        toast({ title: t('contactPage.sentTitle'), description: t('contactPage.sentDescIndividual') });
    };
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="ind-name">{t('contactPage.fullName')}</Label>
                <Input id="ind-name" placeholder="İsmail Hilmi ADIGÜZEL" required />
            </div>
            <div className="space-y-2">
                <Label htmlFor="ind-email">{t('contactPage.email')}</Label>
                <Input id="ind-email" type="email" placeholder="ornek@eposta.com" required />
            </div>
            <AddressSelection required={false} />
            <div className="space-y-2">
                <Label htmlFor="ind-subject">{t('contactPage.subject')}</Label>
                <Input id="ind-subject" placeholder={t('contactPage.subjectPh')} required />
            </div>
            <div className="space-y-2">
                <Label htmlFor="ind-message">{t('contactPage.message')}</Label>
                <Textarea id="ind-message" placeholder={t('contactPage.messagePh')} required />
            </div>
            <Button type="submit" className="w-full">{t('contactPage.send')}</Button>
        </form>
    );
};

// NGO Form Component
const NgoContactForm = () => {
    const { toast } = useToast();
    const { t } = useTranslation();
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        toast({ title: t('contactPage.sentTitle'), description: t('contactPage.sentDescNgo') });
    };
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="ngo-name">{t('contactPage.ngoName')}</Label>
                <Input id="ngo-name" placeholder={t('contactPage.ngoNamePh')} required />
            </div>
             <div className="space-y-2">
                <Label htmlFor="ngo-contact-name">{t('contactPage.contactPerson')}</Label>
                <Input id="ngo-contact-name" placeholder="İsmail Hilmi ADIGÜZEL" required />
            </div>
            <div className="space-y-2">
                <Label htmlFor="ngo-email">{t('contactPage.email')}</Label>
                <Input id="ngo-email" type="email" placeholder="iletisim@stk.org.tr" required />
            </div>
            <AddressSelection />
            <div className="space-y-2">
                <Label htmlFor="ngo-message">{t('contactPage.message')}</Label>
                <Textarea id="ngo-message" placeholder={t('contactPage.ngoMessagePh')} required />
            </div>
            <Button type="submit" className="w-full">{t('contactPage.send')}</Button>
        </form>
    );
};

// Brand Form Component
const BrandContactForm = () => {
    const { toast } = useToast();
    const { t } = useTranslation();
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        toast({ title: t('contactPage.sentTitle'), description: t('contactPage.sentDescBrand') });
    };
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="brand-name">{t('contactPage.brandName')}</Label>
                <Input id="brand-name" placeholder={t('contactPage.brandNamePh')} required />
            </div>
             <div className="space-y-2">
                <Label htmlFor="brand-contact-name">{t('contactPage.contactPerson')}</Label>
                <Input id="brand-contact-name" placeholder="İsmail Hilmi ADIGÜZEL" required />
            </div>
            <div className="space-y-2">
                <Label htmlFor="brand-email">{t('contactPage.email')}</Label>
                <Input id="brand-email" type="email" placeholder="kurumsal@marka.com" required />
            </div>
            <AddressSelection />
             <div className="space-y-2">
                <Label htmlFor="brand-website">{t('contactPage.website')}</Label>
                <Input id="brand-website" placeholder="https://marka.com" />
            </div>
            <div className="space-y-2">
                <Label htmlFor="brand-message">{t('contactPage.message')}</Label>
                <Textarea id="brand-message" placeholder={t('contactPage.brandMessagePh')} required />
            </div>
            <Button type="submit" className="w-full">{t('contactPage.send')}</Button>
        </form>
    );
};

// Public/Corporate Form Component
const CorporateContactForm = () => {
    const { toast } = useToast();
    const { t } = useTranslation();
    const institutionTypeOptions = [t('contactPage.instMuni'), t('contactPage.instMinistry'), t('contactPage.instUniversity'), t('contactPage.instHighSchool'), t('contactPage.instCompany'), t('contactPage.instOther')];
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        toast({ title: t('contactPage.sentTitle'), description: t('contactPage.sentDescCorporate') });
    };
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-muted-foreground">{t('contactPage.corporateLead')}</p>
            <div className="space-y-2">
                <Label htmlFor="institution-type">{t('contactPage.institutionType')}</Label>
                <Select required>
                    <SelectTrigger id="institution-type"><SelectValue placeholder={t('contactPage.selectOne')} /></SelectTrigger>
                    <SelectContent>
                        {institutionTypeOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label htmlFor="purpose">{t('contactPage.purpose')}</Label>
                <Textarea id="purpose" placeholder={t('contactPage.purposePh')} required />
            </div>
            <AddressSelection />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="first-name">{t('contactPage.firstName')}</Label>
                    <Input id="first-name" placeholder="İsmail Hilmi" required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="last-name">{t('contactPage.lastName')}</Label>
                    <Input id="last-name" placeholder="ADIGÜZEL" required />
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <Label htmlFor="email">{t('contactPage.email')}</Label>
                    <Input id="email" type="email" placeholder="kurumsal@eposta.com" required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="phone">{t('contactPage.phone')}</Label>
                    <div className="flex gap-2">
                        <div className="w-[100px] shrink-0">
                            <Select defaultValue="90">
                                <SelectTrigger>
                                    <SelectValue placeholder={t('contactPage.code')} />
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
                <Label htmlFor="department">{t('contactPage.department')}</Label>
                <Input id="department" placeholder={t('contactPage.departmentPh')} />
            </div>
            <Button type="submit" className="w-full">{t('contactPage.send')}</Button>
            <p className="text-xs text-muted-foreground pt-2">
                {t('contactPage.consentNote')}
            </p>
        </form>
    );
};

export default function ContactPage() {
    const router = useRouter();
    const { t } = useTranslation();

    return (
        <div className="p-4 sm:p-6 space-y-8 animate-in fade-in-0">
            <Button onClick={() => router.back()} variant="ghost" size="icon" className="mb-2 -ml-2" aria-label={t('aria.back')}>
                <ArrowLeft className="h-6 w-6" />
            </Button>
            <div className="text-center space-y-4">
                <h1 className="text-3xl font-bold font-headline">{t('contactPage.title')}</h1>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                    {t('contactPage.subtitle')}
                </p>
            </div>

            <Card className="max-w-3xl mx-auto">
                 <Tabs defaultValue="individual" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="individual"><User className="mr-2 h-4 w-4" /> {t('contactPage.tabIndividual')}</TabsTrigger>
                        <TabsTrigger value="ngo"><Building className="mr-2 h-4 w-4" /> {t('contactPage.tabNgo')}</TabsTrigger>
                        <TabsTrigger value="brand"><Store className="mr-2 h-4 w-4" /> {t('contactPage.tabBrand')}</TabsTrigger>
                        <TabsTrigger value="corporate"><Briefcase className="mr-2 h-4 w-4" /> {t('contactPage.tabCorporate')}</TabsTrigger>
                    </TabsList>
                    <TabsContent value="individual">
                        <CardHeader>
                            <CardTitle>{t('contactPage.individualTitle')}</CardTitle>
                            <CardDescription>{t('contactPage.individualDesc')}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <IndividualContactForm />
                        </CardContent>
                    </TabsContent>
                    <TabsContent value="ngo">
                        <CardHeader>
                            <CardTitle>{t('contactPage.ngoTitle')}</CardTitle>
                            <CardDescription>{t('contactPage.ngoDesc')}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <NgoContactForm />
                        </CardContent>
                    </TabsContent>
                    <TabsContent value="brand">
                         <CardHeader>
                            <CardTitle>{t('contactPage.brandTitle')}</CardTitle>
                            <CardDescription>{t('contactPage.brandDesc')}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <BrandContactForm />
                        </CardContent>
                    </TabsContent>
                    <TabsContent value="corporate">
                        <CardHeader>
                            <CardTitle>{t('contactPage.corporateTitle')}</CardTitle>
                            <CardDescription>
                                {t('contactPage.corporateDesc')}
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
