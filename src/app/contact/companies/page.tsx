
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Briefcase, ArrowLeft, MapPin } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import React, { useState } from 'react';
import { LocationFields } from '@/components/shared/location-fields';
import { useTranslation } from '@/components/providers/language-provider';

export default function CompaniesPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { t } = useTranslation();
    const [city, setCity] = useState('');
    const [district, setDistrict] = useState('');
    const [neighborhood, setNeighborhood] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        toast({
            title: t('contactPage.sentTitle'),
            description: t('contactCompanies.sentDesc'),
        });
    };

    return (
        <div className="p-4 sm:p-6 space-y-8 animate-in fade-in-0">
            <Button onClick={() => router.back()} variant="ghost" size="icon" className="mb-2 -ml-2" aria-label={t('aria.back')}>
                <ArrowLeft className="h-6 w-6" />
            </Button>
            <div className="text-center space-y-4">
                <div className="inline-block bg-primary/10 p-4 rounded-full">
                    <Briefcase className="h-10 w-10 text-primary" />
                </div>
                <h1 className="text-3xl font-bold font-headline">{t('contactCompanies.title')}</h1>
                <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
                    {t('contactCompanies.subtitle')}
                </p>
            </div>

            <Card className="max-w-3xl mx-auto">
                <CardHeader>
                    <CardTitle>{t('contactCompanies.cardTitle')}</CardTitle>
                    <CardDescription>{t('contactCompanies.cardDesc')}</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="company-name">{t('contactCompanies.companyName')}</Label>
                                <Input id="company-name" placeholder={t('contactCompanies.companyNamePh')} required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="contact-name">{t('contactPage.contactPerson')}</Label>
                                <Input id="contact-name" placeholder="İsmail Hilmi ADIGÜZEL" required />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">{t('contactCompanies.emailLabel')}</Label>
                                <Input id="email" type="email" placeholder="kurumsal@sirket.com" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">{t('contactPage.phone')}</Label>
                                <Input id="phone" type="tel" placeholder="+90..." />
                            </div>
                        </div>

                        {/* Address Section */}
                        <div className="space-y-4 pt-4 border-t border-dashed">
                            <h4 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                <MapPin className="h-3.5 w-3.5" /> {t('contactCompanies.addrInfo')}
                            </h4>
                            <LocationFields
                                value={{ country: 'Türkiye', city, district, neighborhood }}
                                onChange={(next) => {
                                    setCity(next.city ?? '');
                                    setDistrict(next.district ?? '');
                                    setNeighborhood(next.neighborhood ?? '');
                                }}
                                showCountry={false}
                                required
                            />
                        </div>

                         <div className="space-y-2">
                            <Label htmlFor="website">{t('contactPage.website')}</Label>
                            <Input id="website" placeholder="https://sirket.com" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="message">{t('contactPage.message')}</Label>
                            <Textarea id="message" placeholder={t('contactCompanies.messagePh')} rows={5} required/>
                        </div>
                        <Button type="submit" className="w-full h-12 rounded-xl font-bold text-base">{t('contactCompanies.sendMessage')}</Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
