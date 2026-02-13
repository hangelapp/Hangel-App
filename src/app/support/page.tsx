
'use client';
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Search,
  ChevronRight,
  Mail,
  Bot
} from 'lucide-react';
import * as Icons from 'lucide-react';
import Link from 'next/link';
import { helpTopics, ngoFaqArticles as popularArticles, user, badges } from '@/lib/data';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export default function SupportPage() {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredHelpTopics = useMemo(() => {
        if (!searchTerm.trim()) {
            return helpTopics;
        }
        const lowercased = searchTerm.toLowerCase();
        return helpTopics.filter(topic =>
            topic.title.toLowerCase().includes(lowercased) ||
            topic.description.toLowerCase().includes(lowercased) ||
            topic.subtopics.some(sub => sub.title.toLowerCase().includes(lowercased) || sub.content.toLowerCase().includes(lowercased))
        );
    }, [searchTerm]);

    const filteredFaqArticles = useMemo(() => {
        if (!searchTerm.trim()) {
            return popularArticles;
        }
        const lowercased = searchTerm.toLowerCase();
        return popularArticles.filter(article =>
            article.title.toLowerCase().includes(lowercased)
        );
    }, [searchTerm]);

  return (
    <div className="p-4 sm:p-6 space-y-8 animate-in fade-in-0">
      <div className="text-center">
        <h1 className="text-3xl font-bold font-headline">Destek Merkezi</h1>
        <p className="mt-2 text-muted-foreground">Size nasıl yardımcı olabiliriz?</p>
      </div>

      <div className="relative mx-auto max-w-lg">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input 
            placeholder="Yardım konularında ara..." 
            className="pl-12 h-12 text-base" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div>
        <h2 className="text-xl font-bold mb-4">Yardım Konuları</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredHelpTopics.map((topic) => {
                // @ts-ignore
                const Icon = Icons[topic.icon] || Icons.HelpCircle;
                return (
                    <Link href={`/support/${topic.slug}`} key={topic.slug} className="block">
                        <Card className="h-full hover:border-primary hover:bg-primary/5 transition-all">
                            <CardHeader className="flex flex-row items-center gap-4">
                                <Icon className="h-8 w-8 text-primary" />
                                <div>
                                    <CardTitle>{topic.title}</CardTitle>
                                    <CardDescription>{topic.description}</CardDescription>
                                </div>
                            </CardHeader>
                        </Card>
                    </Link>
                );
            })}
        </div>
        {filteredHelpTopics.length === 0 && <p className="p-4 text-center text-muted-foreground">Aramanızla eşleşen konu bulunamadı.</p>}
      </div>
      
      <div>
        <h2 className="text-xl font-bold mb-4">Sıkça Sorulan Sorular</h2>
        <Card>
            <CardContent className='p-0'>
                <Accordion type="single" collapsible className="w-full">
                  {filteredFaqArticles.map((article, index) => (
                      <AccordionItem value={`faq-${index}`} key={article.title} className="px-4">
                          <AccordionTrigger className="py-4 text-sm font-medium hover:no-underline text-left">
                               {article.title}
                          </AccordionTrigger>
                          <AccordionContent>
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
                   {filteredFaqArticles.length === 0 && <p className="p-4 text-center text-muted-foreground">Aramanızla eşleşen soru bulunamadı.</p>}
                </Accordion>
            </CardContent>
        </Card>
      </div>

      <div className="text-center space-y-3 pt-4 border-t">
        <h3 className="text-lg font-semibold">Aradığınızı bulamadınız mı?</h3>
        <p className="text-muted-foreground text-sm">Destek ekibimiz size yardımcı olmak için burada.</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
            <Dialog>
                <DialogTrigger asChild>
                    <Button size="lg">Destek Talebi Oluştur</Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Destek Talebi Oluştur</DialogTitle>
                      <DialogDescription>
                        Aklınıza takılanları, önerilerinizi veya yaşadığınız sorunları bize iletin. Ekibimiz en kısa sürede size geri dönüş yapacaktır.
                      </DialogDescription>
                    </DialogHeader>
                    <form className="space-y-4 pt-4">
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
                          <Textarea id="support-message" placeholder="Lütfen talebinizi detaylı bir şekilde açıklayın..." rows={6} />
                        </div>
                        <Button type="submit" className="w-full">Gönder</Button>
                    </form>
                </DialogContent>
            </Dialog>
           <Button size="lg" variant="outline" asChild>
            <a href="mailto:turkiye@hangel.org">
              <Mail className="mr-2 h-5 w-5" />
              Bize E-posta Gönder
            </a>
          </Button>
        </div>
      </div>
      <footer className="pt-8 pb-4 text-center text-xs text-muted-foreground">
        <p>® hangel.org v.12</p>
      </footer>
    </div>
  );
}
