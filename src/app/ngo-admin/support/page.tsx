
'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Mail } from 'lucide-react';
import * as Icons from 'lucide-react';
import Link from 'next/link';
import { ngoHelpTopics, ngoFaqArticles } from '@/lib/data';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const SupportForm = () => (
    <Card>
        <CardHeader>
          <CardTitle>Destek Talebi Oluştur</CardTitle>
          <CardDescription>
            Aklınıza takılanları, önerilerinizi veya yaşadığınız sorunları bize iletin. Ekibimiz en kısa sürede size geri dönüş yapacaktır.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="support-subject">Konu</Label>
              <Select>
                <SelectTrigger id="support-subject">
                  <SelectValue placeholder="Bir konu seçin..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="technical">Teknik Sorun</SelectItem>
                  <SelectItem value="payment">Ödeme ve Bağışlar</SelectItem>
                  <SelectItem value="volunteer">Gönüllülük Süreçleri</SelectItem>
                  <SelectItem value="suggestion">Öneri ve Geri Bildirim</SelectItem>
                  <SelectItem value="other">Diğer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="support-message">Mesajınız</Label>
              <Textarea id="support-message" placeholder="Lütfen mesajınızı buraya yazın..." rows={6} />
            </div>
            <Button type="submit" className="w-full">Gönder</Button>
          </form>
        </CardContent>
    </Card>
);

export default function NgoSupportPage() {
  return (
    <div className="p-4 sm:p-6 space-y-8 animate-in fade-in-0">
      <div className="text-center">
        <h1 className="text-3xl font-bold font-headline">Kurumsal Destek Merkezi</h1>
        <p className="mt-2 text-muted-foreground">Kuruluşunuza özel destek kaynakları.</p>
      </div>

      <div className="relative mx-auto max-w-lg">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input placeholder="Yardım konularında ara..." className="pl-12 h-12 text-base" />
      </div>

      <div>
        <h2 className="text-xl font-bold mb-4">Yardım Konuları</h2>
        <Card>
            <CardContent className='p-0 divide-y'>
                <Accordion type="single" collapsible className="w-full">
                {ngoHelpTopics.map((topic) => {
                    // @ts-ignore
                    const Icon = Icons[topic.icon.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('')] || Icons.HelpCircle;
                    return (
                        <AccordionItem value={topic.slug} key={topic.slug}>
                            <AccordionTrigger className="p-4 text-base hover:no-underline">
                                <div className="flex items-center gap-4">
                                    <Icon className="h-6 w-6 text-primary" />
                                    <p className="font-semibold">{topic.title}</p>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="px-4 pb-4">
                                <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground border-t pt-4 space-y-4">
                                    <div className='flex flex-col gap-3'>
                                      {topic.subtopics.map(sub => (
                                          <Link href="#" key={sub.title} className="font-medium text-foreground hover:underline">{sub.title}</Link>
                                      ))}
                                    </div>
                                    <p className='text-sm mt-4'>{topic.description}</p>
                                    <div className="mt-6 border-t pt-4 text-center">
                                        <p className="text-sm font-medium mb-2">Bu size yardımcı oldu mu?</p>
                                        <div className="flex justify-center gap-2">
                                            <Button variant="outline" size="sm">Evet</Button>
                                            <Button variant="outline" size="sm">Hayır</Button>
                                        </div>
                                    </div>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    );
                })}
                </Accordion>
            </CardContent>
        </Card>
      </div>
      
      <div>
        <h2 className="text-xl font-bold mb-4">Sıkça Sorulan Kurumsal Sorular</h2>
        <Card>
            <CardContent className='p-0'>
                <Accordion type="single" collapsible className="w-full">
                  {ngoFaqArticles.map((article, index) => (
                      <AccordionItem value={`faq-${index}`} key={article.title}>
                          <AccordionTrigger className="p-4 text-sm font-medium hover:no-underline">
                               {article.title}
                          </AccordionTrigger>
                          <AccordionContent className="px-4 pb-4">
                              <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground pt-2 space-y-4">
                                  <p>Bu sorunun cevabı yakında burada olacak. Anlayışınız için teşekkür ederiz.</p>
                                  <div className="mt-6 border-t pt-4 text-center">
                                      <p className="text-sm font-medium mb-2">Bu size yardımcı oldu mu?</p>
                                      <div className="flex justify-center gap-2">
                                          <Button variant="outline" size="sm">Evet</Button>
                                          <Button variant="outline" size="sm">Hayır</Button>
                                      </div>
                                  </div>
                              </div>
                          </AccordionContent>
                      </AccordionItem>
                  ))}
                </Accordion>
            </CardContent>
        </Card>
      </div>

      <div className="space-y-4 pt-4 border-t">
        <h3 className="text-xl font-bold text-center">Aradığınızı Bulamadınız mı?</h3>
        <SupportForm />
      </div>
    </div>
  );
}
