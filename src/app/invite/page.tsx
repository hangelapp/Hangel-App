'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Mail, MessageSquare, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';

export default function InvitePage() {
    const { toast } = useToast();
    const inviteLink = 'https://hangel.com/invite?ref=ayseyilmaz';
    const inviteTitle = "İyiliğe katıl, fark yarat!";

    const copyLink = () => {
        navigator.clipboard.writeText(inviteLink);
        toast({
            title: "Link Kopyalandı!",
            description: "Davet linkini panoya kopyaladın.",
        });
    }

  return (
    <div className="p-4 space-y-6 animate-in fade-in-0 flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Arkadaşlarını İyiliğe Davet Et</CardTitle>
          <CardDescription>Bu linki arkadaşlarınla paylaşarak onların da Hangel'e katılmasını ve sosyal etki yaratmasını sağla.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-2 border rounded-md bg-muted text-sm break-all">
            {inviteLink}
          </div>
          <Button onClick={copyLink} className="w-full">
            <Copy className="mr-2 h-4 w-4" />
            Linki Kopyala
          </Button>
          <Separator className='my-4' />
           <div className="space-y-2">
            <a href={`https://wa.me/?text=${encodeURIComponent(inviteTitle + ' ' + inviteLink)}`} target="_blank" rel="noopener noreferrer" className='w-full'>
              <Button variant="outline" className="w-full justify-start">
                <MessageSquare className="mr-2 h-4 w-4 text-green-500" />
                WhatsApp ile Paylaş
              </Button>
            </a>
             <a href={`https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent(inviteTitle)}`} target="_blank" rel="noopener noreferrer" className='w-full'>
              <Button variant="outline" className="w-full justify-start">
                <Send className="mr-2 h-4 w-4 text-sky-500" />
                Telegram ile Paylaş
              </Button>
            </a>
            <a href={`mailto:?subject=${encodeURIComponent(inviteTitle)}&body=${encodeURIComponent(inviteLink)}`}>
              <Button variant="outline" className="w-full justify-start">
                <Mail className="mr-2 h-4 w-4" />
                E-posta ile Paylaş
              </Button>
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
