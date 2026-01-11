import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { LifeBuoy, BookOpen, MessageSquare, PlusCircle } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

const faqs = [
  {
    question: "Hangel nasıl çalışır?",
    answer: "Hangel, anlaşmalı markalardan yaptığınız alışverişlerin bir kısmını seçtiğiniz STK'lara bağış olarak aktarır. Ayrıca gönüllülük ilanlarına başvurarak topluma katkı sağlayabilirsiniz."
  },
  {
    question: "Bağışlarımın ulaştığından nasıl emin olabilirim?",
    answer: "Tüm bağış süreçleri şeffaftır. Profilinizdeki 'Bağışlarım' bölümünden ve STK'ların şeffaflık raporlarından bağışlarınızı takip edebilirsiniz."
  },
  {
    question: "Gönüllülük karşılığında ne kazanıyorum?",
    answer: "Gönüllülük faaliyetlerinizle etki puanı, rozetler ve sertifikalar kazanırsınız. En önemlisi, topluma değerli bir katkı sağlamış olursunuz."
  }
]

export default function SupportPage() {
  return (
    <div className="p-4 space-y-6 animate-in fade-in-0">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold font-headline">Destek Merkezi</h1>
        <p className="text-muted-foreground">Yardıma mı ihtiyacınız var? Doğru yerdesiniz.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LifeBuoy className="text-primary" />
            Sıkça Sorulan Sorular
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, i) => (
              <AccordionItem value={`item-${i}`} key={i}>
                <AccordionTrigger>{faq.question}</AccordionTrigger>
                <AccordionContent>{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
      
      <Card>
          <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PlusCircle className="text-primary" />
            Destek Talebi Oluştur
          </CardTitle>
          <CardDescription>Sorunuzu S.S.S. içinde bulamadıysanız bize yazın.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="subject">Konu</Label>
                <Input id="subject" placeholder="Talebinizin konusu" />
            </div>
            <div className="space-y-2">
                <Label htmlFor="message">Mesajınız</Label>
                <Textarea id="message" placeholder="Talebinizi detaylı bir şekilde açıklayın." />
            </div>
            <Button className="w-full">Destek Talebini Gönder</Button>
        </CardContent>
      </Card>
    </div>
  );
}
