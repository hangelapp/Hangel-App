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

const faqArticles = [
  {
    title: "Etki puanım neden güncellenmedi?",
    content: "Etki puanları, yapılan bağış ve gönüllülük faaliyetlerinin onaylanmasının ardından 24 saat içinde güncellenir. Alışverişlerden gelen bağışların yansıması 45 günü bulabilir. Eğer bu süreleri aştığınızı düşünüyorsanız lütfen bizimle iletişime geçin."
  },
  {
    title: "Gönüllülük başvurumun durumunu nasıl öğrenirim?",
    content: "Tüm başvurularınızı 'Başvurularım' sayfasından takip edebilirsiniz. Bir başvuru durumu değiştiğinde (onaylandı, reddedildi vb.) size bir bildirim gönderilir."
  },
  {
    title: "Şifremi nasıl değiştirebilirim?",
    content: "'Ayarlar' menüsü altındaki 'Güvenlik ve Şifre' bölümünden mevcut şifrenizi girerek yeni bir şifre belirleyebilirsiniz."
  },
  {
    title: "Kayıtlı kredi kartımı nasıl silerim?",
    content: "'Ayarlar' menüsündeki 'Cüzdan ve Ödeme Yöntemleri' sayfasından kayıtlı kartlarınızı yönetebilir ve silebilirsiniz."
  }
];

export default function AppSupportPage() {
    const { toast } = useToast();
    const router = useRouter();
    const cms = useWebPage('support-app-support');
    const [searchTerm, setSearchTerm] = useState('');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchTerm.trim()) {
            toast({ variant: 'destructive', title: 'Arama terimi boş olamaz.'});
            return;
        }
        toast({ title: 'Arama Yapılıyor...', description: `"${searchTerm}" için sonuçlar getiriliyor.` });
    };

    return (
        <div className="p-4 sm:p-6 space-y-8 animate-in fade-in-0">
            <div className="flex items-center gap-2">
                <Button onClick={() => router.back()} variant="ghost" size="icon" className="mb-2 -ml-2">
                  <ArrowLeft className="h-6 w-6" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold font-headline">{cms.title || 'Uygulama Destek Merkezi'}</h1>
                    <p className="mt-2 text-muted-foreground">{cms.description || cms.subtitle || 'Sıkça sorulan sorulara göz atın veya bizimle iletişime geçin.'}</p>
                </div>
            </div>

            <form onSubmit={handleSearch} className="relative mx-auto max-w-lg">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input 
                    placeholder="Yardım konularında ara..." 
                    className="pl-12 h-12 text-base" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </form>

            <Card>
                <CardHeader>
                    <CardTitle>Sıkça Sorulan Sorular</CardTitle>
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
                    <CardTitle>Aradığınızı Bulamadınız mı?</CardTitle>
                    <CardDescription>Destek ekibimiz size yardımcı olmaktan mutluluk duyar.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button asChild className="w-full">
                        <Link href="/contact">Destek Talebi Oluştur</Link>
                    </Button>
                </CardContent>
            </Card>

        </div>
    );
}
