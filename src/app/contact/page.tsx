
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
                <MapPin className="h-3.5 w-3.5" /> {t('contact.addressInfo')}
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
        toast({ title: t('contact.sentTitle'), description: t('contact.sentDescIndividual') });
    };
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="ind-name">{t('contact.fullName')}</Label>
                <Input id="ind-name" placeholder="İsmail Hilmi ADIGÜZEL" required />
            </div>
            <div className="space-y-2">
                <Label htmlFor="ind-email">{t('contact.email')}</Label>
                <Input id="ind-email" type="email" placeholder="ornek@eposta.com" required />
            </div>
            <AddressSelection required={false} />
            <div className="space-y-2">
                <Label htmlFor="ind-subject">{t('contact.subject')}</Label>
                <Input id="ind-subject" placeholder={t('contact.subjectPh')} required />
            </div>
            <div className="space-y-2">
                <Label htmlFor="ind-message">{t('contact.message')}</Label>
                <Textarea id="ind-message" placeholder={t('contact.messagePh')} required />
            </div>
            <Button type="submit" className="w-full">{t('contact.send')}</Button>
        </form>
    );
};

// NGO Form Component
const NgoContactForm = () => {
    const { toast } = useToast();
    const { t } = useTranslation();
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        toast({ title: t('contact.sentTitle'), description: t('contact.sentDescNgo') });
    };
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="ngo-name">{t('contact.ngoName')}</Label>
                <Input id="ngo-name" placeholder={t('contact.ngoNamePh')} required />
            </div>
             <div className="space-y-2">
                <Label htmlFor="ngo-contact-name">{t('contact.contactPerson')}</Label>
                <Input id="ngo-contact-name" placeholder="İsmail Hilmi ADIGÜZEL" required />
            </div>
            <div className="space-y-2">
                <Label htmlFor="ngo-email">{t('contact.email')}</Label>
                <Input id="ngo-email" type="email" placeholder="iletisim@stk.org.tr" required />
            </div>
            <AddressSelection />
            <div className="space-y-2">
                <Label htmlFor="ngo-message">{t('contact.message')}</Label>
                <Textarea id="ngo-message" placeholder={t('contact.ngoMessagePh')} required />
            </div>
            <Button type="submit" className="w-full">{t('contact.send')}</Button>
        </form>
    );
};

// Brand Form Component
const BrandContactForm = () => {
    const { toast } = useToast();
    const { t } = useTranslation();
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        toast({ title: t('contact.sentTitle'), description: t('contact.sentDescBrand') });
    };
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="brand-name">{t('contact.brandName')}</Label>
                <Input id="brand-name" placeholder={t('contact.brandNamePh')} required />
            </div>
             <div className="space-y-2">
                <Label htmlFor="brand-contact-name">{t('contact.contactPerson')}</Label>
                <Input id="brand-contact-name" placeholder="İsmail Hilmi ADIGÜZEL" required />
            </div>
            <div className="space-y-2">
                <Label htmlFor="brand-email">{t('contact.email')}</Label>
                <Input id="brand-email" type="email" placeholder="kurumsal@marka.com" required />
            </div>
            <AddressSelection />
             <div className="space-y-2">
                <Label htmlFor="brand-website">{t('contact.website')}</Label>
                <Input id="brand-website" placeholder="https://marka.com" />
            </div>
            <div className="space-y-2">
                <Label htmlFor="brand-message">{t('contact.message')}</Label>
                <Textarea id="brand-message" placeholder={t('contact.brandMessagePh')} required />
            </div>
            <Button type="submit" className="w-full">{t('contact.send')}</Button>
        </form>
    );
};

// Public/Corporate Form Component
const CorporateContactForm = () => {
    const { toast } = useToast();
    const { t } = useTranslation();
    const institutionTypeOptions = [t('contact.instMuni'), t('contact.instMinistry'), t('contact.instUniversity'), t('contact.instHighSchool'), t('contact.instCompany'), t('contact.instOther')];
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        toast({ title: t('contact.sentTitle'), description: t('contact.sentDescCorporate') });
    };
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-muted-foreground">{t('contact.corporateLead')}</p>
            <div className="space-y-2">
                <Label htmlFor="institution-type">{t('contact.institutionType')}</Label>
                <Select required>
                    <SelectTrigger id="institution-type"><SelectValue placeholder={t('contact.selectOne')} /></SelectTrigger>
                    <SelectContent>
                        {institutionTypeOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label htmlFor="purpose">{t('contact.purpose')}</Label>
                <Textarea id="purpose" placeholder={t('contact.purposePh')} required />
            </div>
            <AddressSelection />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="first-name">{t('contact.firstName')}</Label>
                    <Input id="first-name" placeholder="İsmail Hilmi" required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="last-name">{t('contact.lastName')}</Label>
                    <Input id="last-name" placeholder="ADIGÜZEL" required />
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <Label htmlFor="email">{t('contact.email')}</Label>
                    <Input id="email" type="email" placeholder="kurumsal@eposta.com" required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="phone">{t('contact.phone')}</Label>
                    <div className="flex gap-2">
                        <div className="w-[100px] shrink-0">
                            <Select defaultValue="90">
                                <SelectTrigger>
                                    <SelectValue placeholder={t('contact.code')} />
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
                <Label htmlFor="department">{t('contact.department')}</Label>
                <Input id="department" placeholder={t('contact.departmentPh')} />
            </div>
            <Button type="submit" className="w-full">{t('contact.send')}</Button>
            <p className="text-xs text-muted-foreground pt-2">
                {t('contact.consentNote')}
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
                <h1 className="text-3xl font-bold font-headline">{t('contact.title')}</h1>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                    {t('contact.subtitle')}
                </p>
            </div>

            <Card className="max-w-3xl mx-auto">
                 <Tabs defaultValue="individual" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="individual"><User className="mr-2 h-4 w-4" /> {t('contact.tabIndividual')}</TabsTrigger>
                        <TabsTrigger value="ngo"><Building className="mr-2 h-4 w-4" /> {t('contact.tabNgo')}</TabsTrigger>
                        <TabsTrigger value="brand"><Store className="mr-2 h-4 w-4" /> {t('contact.tabBrand')}</TabsTrigger>
                        <TabsTrigger value="corporate"><Briefcase className="mr-2 h-4 w-4" /> {t('contact.tabCorporate')}</TabsTrigger>
                    </TabsList>
                    <TabsContent value="individual">
                        <CardHeader>
                            <CardTitle>{t('contact.individualTitle')}</CardTitle>
                            <CardDescription>{t('contact.individualDesc')}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <IndividualContactForm />
                        </CardContent>
                    </TabsContent>
                    <TabsContent value="ngo">
                        <CardHeader>
                            <CardTitle>{t('contact.ngoTitle')}</CardTitle>
                            <CardDescription>{t('contact.ngoDesc')}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <NgoContactForm />
                        </CardContent>
                    </TabsContent>
                    <TabsContent value="brand">
                         <CardHeader>
                            <CardTitle>{t('contact.brandTitle')}</CardTitle>
                            <CardDescription>{t('contact.brandDesc')}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <BrandContactForm />
                        </CardContent>
                    </TabsContent>
                    <TabsContent value="corporate">
                        <CardHeader>
                            <CardTitle>{t('contact.corporateTitle')}</CardTitle>
                            <CardDescription>
                                {t('contact.corporateDesc')}
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
