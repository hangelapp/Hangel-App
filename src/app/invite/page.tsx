'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Mail, Send, MessageSquare, Copy, Star } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

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
          <CardDescription>Bu linki kopyalayarak veya aşağıdaki butonları kullanarak arkadaşlarını davet et.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex w-full items-center space-x-2">
            <Input value={inviteLink} readOnly />
            <Button type="button" size="icon" variant="outline" onClick={copyToClipboard}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex justify-center gap-4">
             <Button variant="outline" size="icon" asChild>
                <a href={`https://wa.me/?text=${encodeURIComponent(`Seni de hangel'a bekliyorum! ${inviteLink}`)}`} target="_blank" rel="noopener noreferrer">
                    <MessageSquare className="h-5 w-5" />
                </a>
             </Button>
             <Button variant="outline" size="icon" asChild>
                <a href={`https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent("Seni de hangel'a bekliyorum!")}`} target="_blank" rel="noopener noreferrer">
                    <Send className="h-5 w-5" />
                </a>
             </Button>
             <Button variant="outline" size="icon" asChild>
                 <a href={`mailto:?subject=${encodeURIComponent("Hangel Daveti")}&body=${encodeURIComponent(`Seni de hangel'a bekliyorum! Buradan katılabilirsin: ${inviteLink}`)}`}>
                    <Mail className="h-5 w-5" />
                </a>
             </Button>
          </div>

          <Separator />
          
          <div className='text-center text-sm text-muted-foreground space-y-1'>
                <p className='flex items-center justify-center gap-2 font-semibold text-foreground'><Star className='h-4 w-4 text-amber-500'/> Davet Programı</p>
                <p>Davet linkinle üye olan her arkadaşın için <strong>100 Etki Puanı</strong> kazan.</p>
                <p>Arkadaşın ilk bağışını yaptığında, sen de ekstra <strong>50 Etki Puanı</strong> kazanırsın!</p>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
