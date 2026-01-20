'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { 
    Mail, 
    Send, 
    MessageSquare, 
    Copy, 
    Star,
    Instagram,
    Twitter,
    Linkedin,
    Gift,
    Smartphone,
    Contact
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


export default function InvitePage() {
  const { toast } = useToast();
  const [inviteLink, setInviteLink] = useState('');

  useEffect(() => {
    // This check ensures window is defined, preventing SSR errors.
    if (typeof window !== 'undefined') {
      setInviteLink(`${window.location.origin}/register?ref=ismail`);
    }
  }, []);

  const copyToClipboard = () => {
    if (!inviteLink) return;
    navigator.clipboard.writeText(inviteLink);
    toast({
      title: "Davet linki kopyalandı!",
    });
  };

  const shareOptions = [
    { name: 'WhatsApp', icon: MessageSquare, href: `https://wa.me/?text=${encodeURIComponent(`Seni de hangel'a bekliyorum! ${inviteLink}`)}` },
    { name: 'SMS', icon: Smartphone, href: `sms:?&body=${encodeURIComponent(`Seni de hangel'a bekliyorum! ${inviteLink}`)}` },
    { name: 'Telegram', icon: Send, href: `https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent("Seni de hangel'a bekliyorum!")}` },
    { name: 'E-posta', icon: Mail, href: `mailto:?body=${encodeURIComponent(`Seni de hangel'a bekliyorum! ${inviteLink}`)}` },
    { name: 'X (Twitter)', icon: Twitter, href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(`Seni de hangel'a bekliyorum! ${inviteLink}`)}` },
    { name: 'LinkedIn', icon: Linkedin, href: `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(inviteLink)}&title=${encodeURIComponent("Seni de hangel'a bekliyorum!")}` },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-8 animate-in fade-in-0">
      <div className="text-center space-y-2">
        <div className="inline-block bg-primary/10 p-4 rounded-full">
            <Gift className="h-10 w-10 text-primary" />
        </div>
        <h1 className="text-3xl font-bold font-headline">İyiliği Paylaş, Birlikte Büyüyelim</h1>
        <p className="text-muted-foreground max-w-md mx-auto">Arkadaşlarını hangel'a davet et, hem sen hem de onlar kazansın. Birlikte daha büyük bir etki yaratalım.</p>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>Davet Linkin</CardTitle>
            <CardDescription>Bu kişisel linkini kopyalayarak veya aşağıdaki butonlarla doğrudan paylaşarak arkadaşlarını davet et.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="relative flex w-full items-center">
                <Input 
                    value={inviteLink} 
                    readOnly 
                    className="h-12 pr-12 text-sm text-muted-foreground bg-muted border-dashed"
                />
                <Button 
                    type="button" 
                    size="icon" 
                    variant="ghost"
                    onClick={copyToClipboard}
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-9 w-9 text-muted-foreground hover:text-foreground"
                >
                  <Copy className="h-5 w-5" />
                </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {shareOptions.map(option => (
                     <Button key={option.name} asChild variant="outline" className="h-12">
                        <a href={option.href} target="_blank" rel="noopener noreferrer">
                            <option.icon className="mr-2 h-5 w-5" /> {option.name}
                        </a>
                     </Button>
                ))}
            </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Arkadaşlarını Bul</CardTitle>
          <CardDescription>Rehberini veya e-posta kişilerini bağlayarak hangi arkadaşlarının zaten hangel kullandığını gör ve onlara davet gönder.</CardDescription>
        </CardHeader>
        <CardContent>
            <Tabs defaultValue="email" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="email">
                        <Mail className="mr-2 h-4 w-4"/> E-posta Kişileri
                    </TabsTrigger>
                    <TabsTrigger value="phone">
                        <Contact className="mr-2 h-4 w-4"/> Telefon Rehberi
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="email" className="mt-4 text-center space-y-4 pt-4">
                    <p className="text-sm text-muted-foreground">Google hesabını bağlayarak e-posta kişilerini senkronize et.</p>
                    <Button>Google ile Bağlan</Button>
                </TabsContent>
                <TabsContent value="phone" className="mt-4 text-center space-y-4 pt-4">
                     <p className="text-sm text-muted-foreground">Telefon rehberine erişim izni vererek arkadaşlarını bul.</p>
                    <Button>Rehberi Senkronize Et</Button>
                </TabsContent>
            </Tabs>
        </CardContent>
      </Card>

      <Card className='bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/50'>
         <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                <Star className='h-5 w-5'/> Kazanç Programı
            </CardTitle>
         </CardHeader>
         <CardContent className='space-y-4 text-sm text-amber-900 dark:text-amber-300/80'>
            <div className='flex items-start gap-3'>
                <div className='w-4 h-4 mt-1 rounded-full bg-amber-500 flex-shrink-0'/>
                <p>Davet linkinle üye olan her arkadaşın için **100 Sosyal Etki Puanı** kazanırsın.</p>
            </div>
            <div className='flex items-start gap-3'>
                 <div className='w-4 h-4 mt-1 rounded-full bg-amber-500 flex-shrink-0'/>
                <p>Arkadaşın ilk bağışını yaptığında veya ilk gönüllülük faaliyetini tamamladığında, sen de ekstra **50 Sosyal Etki Puanı** daha kazanırsın!</p>
            </div>
         </CardContent>
      </Card>
    </div>
  );
}
