import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Search,
  ChevronRight,
  Mail,
} from 'lucide-react';
import Link from 'next/link';
import { helpTopics } from '@/lib/data';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const popularArticles = [
    { title: 'hangel Etki Puanı nasıl hesaplanır?', link: '#' },
    { title: 'Bir bağışın STK\'ya ulaşma süreci nedir?', link: '#' },
    { title: 'Gönüllülük başvurum neden reddedildi?', link: '#' },
    { title: 'Şifremi nasıl sıfırlarım?', link: '#' }
];

export default function SupportPage() {
  return (
    <div className="p-4 sm:p-6 space-y-8 animate-in fade-in-0">
      <div className="text-center">
        <h1 className="text-3xl font-bold font-headline">Destek Merkezi</h1>
        <p className="mt-2 text-muted-foreground">Size nasıl yardımcı olabiliriz?</p>
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
                {helpTopics.map((topic) => {
                    const Icon = topic.icon;
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
                                    <p>{topic.content}</p>
                                    <div className="mt-6 border-t pt-4 text-center">
                                        <p className="text-sm font-medium mb-2">Bu makale yardımcı oldu mu?</p>
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
        <h2 className="text-xl font-bold mb-4">Sıkça Sorulan Sorular</h2>
        <Card>
            <CardContent className='p-0 divide-y'>
                {popularArticles.map((article) => (
                     <Link href={article.link} key={article.title} passHref>
                        <div className='flex justify-between items-center p-4 hover:bg-accent transition-colors'>
                            <p className='font-medium text-sm'>{article.title}</p>
                            <ChevronRight className='h-5 w-5 text-muted-foreground'/>
                        </div>
                    </Link>
                ))}
            </CardContent>
        </Card>
      </div>

      <div className="text-center space-y-3 pt-4 border-t">
        <h3 className="text-lg font-semibold">Aradığınızı bulamadınız mı?</h3>
        <p className="text-muted-foreground text-sm">Destek ekibimiz size yardımcı olmak için burada.</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
          <Button size="lg">Destek Talebi Oluştur</Button>
           <Button size="lg" variant="outline">
            <Mail className="mr-2 h-5 w-5" />
            Bize E-posta Gönder
          </Button>
        </div>
      </div>
    </div>
  );
}
