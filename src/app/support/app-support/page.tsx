'use client';
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, ArrowLeft } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useWebPage } from '@/hooks/use-site-content';
import { useTranslation } from '@/components/providers/language-provider';

export default function AppSupportPage() {
    const { toast } = useToast();
    const router = useRouter();
    const { t } = useTranslation();
    const cms = useWebPage('support-app-support');
    const [searchTerm, setSearchTerm] = useState('');

    const faqArticles = [
      { title: t('appSupport.faq1Title'), content: t('appSupport.faq1Content') },
      { title: t('appSupport.faq2Title'), content: t('appSupport.faq2Content') },
      { title: t('appSupport.faq3Title'), content: t('appSupport.faq3Content') },
      { title: t('appSupport.faq4Title'), content: t('appSupport.faq4Content') },
    ];

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchTerm.trim()) {
            toast({ variant: 'destructive', title: t('appSupport.searchEmpty')});
            return;
        }
        toast({ title: t('appSupport.searchingTitle'), description: `"${searchTerm}" ${t('appSupport.searchingDescSuffix')}` });
    };

    return (
        <div className="p-4 sm:p-6 space-y-8 animate-in fade-in-0">
            <div className="flex items-center gap-2">
                <Button onClick={() => router.back()} variant="ghost" size="icon" className="mb-2 -ml-2" aria-label={t('appSupport.backAria')}>
                  <ArrowLeft className="h-6 w-6" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold font-headline">{cms.title || t('appSupport.title')}</h1>
                    <p className="mt-2 text-muted-foreground">{cms.description || cms.subtitle || t('appSupport.subtitle')}</p>
                </div>
            </div>

            <form onSubmit={handleSearch} className="relative mx-auto max-w-lg">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                    placeholder={t('appSupport.searchPh')}
                    className="pl-12 h-12 text-base"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </form>

            <Card>
                <CardHeader>
                    <CardTitle>{t('appSupport.faqTitle')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                        {faqArticles.map((article, index) => (
                          <AccordionItem value={`faq-${index}`} key={article.title}>
                              <AccordionTrigger className="p-4 text-sm font-medium hover:no-underline text-left">
                                   {article.title}
                              </AccordionTrigger>
                              <AccordionContent className="px-4 pb-4">
                                  <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground pt-2 space-y-4">
                                      <p>{article.content}</p>
                                  </div>
                              </AccordionContent>
                          </AccordionItem>
                        ))}
                    </Accordion>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>{t('appSupport.cantFindTitle')}</CardTitle>
                    <CardDescription>{t('appSupport.cantFindDesc')}</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button asChild className="w-full">
                        <Link href="/contact">{t('appSupport.createTicketBtn')}</Link>
                    </Button>
                </CardContent>
            </Card>

        </div>
    );
}
