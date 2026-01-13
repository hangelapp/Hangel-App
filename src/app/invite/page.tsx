'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Mail, MessageSquare, Send, BookUser, MailPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';

const GmailIcon = () => (
  <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
    <path d="M22 5v14H2V5h20zm-2 2H4v10h16V7zm-8 5l8-5H4l8 5z"/>
  </svg>
);

const OutlookIcon = () => (
    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M14.5,13.25a.75.75,0,0,0,1,1.06l3-3a.75.75,0,0,0-1-1.06ZM1,9.5A2.5,2.5,0,0,1,3.5,7h11A2.5,2.5,0,0,1,17,9.5v8A2.5,2.5,0,0,1,14.5,20H3.5A2.5,2.5,0,0,1,1,17.5ZM3.5,8.5A1,1,0,0,0,2.5,9.5v8a1,1,0,0,0,1,1h11a1,1,0,0,0,1-1V9.5a1,1,0,0,0-1-1ZM23,12a.75.75,0,0,0-1.5,0v5a.75.75,0,0,0,1.5,0Z"/>
    </svg>
);


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
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Sosyal Medya ile Paylaş</p>
            <div className='grid grid-cols-3 gap-2'>
                <a href={`https://wa.me/?text=${encodeURIComponent(inviteTitle + ' ' + inviteLink)}`} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="w-full">
                    <MessageSquare className="mr-2 h-4 w-4 text-green-500" />
                    WhatsApp
                  </Button>
                </a>
                 <a href={`https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent(inviteTitle)}`} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="w-full">
                    <Send className="mr-2 h-4 w-4 text-sky-500" />
                    Telegram
                  </Button>
                </a>
                <a href={`mailto:?subject=${encodeURIComponent(inviteTitle)}&body=${encodeURIComponent(inviteLink)}`}>
                  <Button variant="outline" className="w-full">
                    <Mail className="mr-2 h-4 w-4" />
                    E-posta
                  </Button>
                </a>
            </div>
          </div>
          
          <Separator className='my-4' />

          <div className="space-y-2">
             <p className="text-xs text-muted-foreground uppercase tracking-wider">Kişilerini Davet Et</p>
             <Button variant="outline" className="w-full justify-start">
                <BookUser className="mr-2 h-4 w-4" />
                Rehberindeki Kişileri Davet Et
              </Button>
             <Button variant="outline" className="w-full justify-start">
                <GmailIcon />
                Gmail'deki Kişileri Davet Et
              </Button>
             <Button variant="outline" className="w-full justify-start">
                <OutlookIcon />
                Outlook/Hotmail Kişilerini Davet Et
              </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
