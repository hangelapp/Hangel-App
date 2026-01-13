'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Link as LinkIcon, Mail, Send, MessageSquare, Copy, Star } from 'lucide-react';

export default function InvitePage() {
  const { toast } = useToast();
  const inviteLink = typeof window !== 'undefined' ? `${window.location.origin}/register?ref=ismail` : '';

  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteLink);
    toast({
      title: "Davet linki kopyalandı!",
    });
  };

  return (
    <div className="p-4 space-y-6 animate-in fade-in-0">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold font-headline">Arkadaşlarını Davet Et</h1>
        <p className="text-muted-foreground">İyilik zincirini büyütmek için arkadaşlarını hangel'a davet et.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Davet Linkin</CardTitle>
          <CardDescription>Bu linki arkadaşlarınla paylaşarak onların da hangel'e katılmasını ve sosyal etki yaratmasını sağla.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex w-full items-center space-x-2">
            <Input value={inviteLink} readOnly />
            <Button type="button" size="icon" onClick={copyToClipboard}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
      
       <div className='space-y-4'>
            <h2 className='text-lg font-semibold text-center'>Arkadaşlarınla Paylaş</h2>
            <Dialog>
                <DialogTrigger asChild>
                    <Button className="w-full" size="lg">Paylaş</Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Paylaş</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col gap-4 py-4">
                        <Button variant="outline" onClick={copyToClipboard} className="justify-start">
                            <LinkIcon className="mr-2 h-4 w-4" />
                            Linki Kopyala
                        </Button>
                        <a href={`mailto:?subject=${encodeURIComponent("Hangel Daveti")}&body=${encodeURIComponent(`Seni de hangel'a bekliyorum! Buradan katılabilirsin: ${inviteLink}`)}`}>
                        <Button variant="outline" className="w-full justify-start">
                            <Mail className="mr-2 h-4 w-4" />
                            E-posta ile Paylaş
                        </Button>
                        </a>
                        <a href={`https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent("Seni de hangel'a bekliyorum!")}`} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" className="w-full justify-start">
                            <Send className="mr-2 h-4 w-4" />
                            Telegram ile Paylaş
                        </Button>
                        </a>
                        <a href={`https://wa.me/?text=${encodeURIComponent(`Seni de hangel'a bekliyorum! ${inviteLink}`)}`} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" className="w-full justify-start">
                            <MessageSquare className="mr-2 h-4 w-4" />
                            WhatsApp ile Paylaş
                        </Button>
                        </a>
                    </div>
                </DialogContent>
            </Dialog>
        </div>


      <div className='space-y-4'>
         <h2 className='text-lg font-semibold text-center'>Kişilerini Davet Et</h2>
         <Button variant="outline" className="w-full">Rehberindeki Kişileri Davet Et</Button>
         <Button variant="outline" className="w-full">Gmail'deki Kişileri Davet Et</Button>
         <Button variant="outline" className="w-full">Outlook/Hotmail Kişilerini Davet Et</Button>
      </div>

       <Card className='mt-8'>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Star className='text-amber-500'/> Davet Programı</CardTitle>
            </CardHeader>
            <CardContent className='text-sm text-muted-foreground space-y-2'>
                <p>Davet linkinle üye olan her arkadaşın için <strong>100 Etki Puanı</strong> kazan.</p>
                <p>Arkadaşın ilk bağışını yaptığında, sen de ekstra <strong>50 Etki Puanı</strong> kazanırsın!</p>
            </CardContent>
       </Card>

    </div>
  );
}
