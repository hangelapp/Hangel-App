'use client';

import React from 'react';
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
    Contact,
    AtSign
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const SectionHeader = ({ children }: { children: React.ReactNode }) => (
    <h2 className="text-sm font-semibold text-muted-foreground tracking-wide uppercase">{children}</h2>
);

const IconButton = ({ children, href, 'aria-label': ariaLabel }: { children: React.ReactNode; href?: string; 'aria-label': string }) => {
    const Component = href ? 'a' : Button;
    return (
        <Component
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={ariaLabel}
            className="h-14 w-14 rounded-xl bg-muted/70 text-muted-foreground shadow-sm transition-colors hover:bg-accent hover:text-foreground"
            variant={href ? "ghost" : "default"}
            asChild={!!href}
        >
           {href ? <div className='flex items-center justify-center h-full w-full'>{children}</div> : children}
        </Component>
    );
};

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
    <div className="p-4 sm:p-6 space-y-10 animate-in fade-in-0">
      <div className="text-center">
        <h1 className="text-3xl font-bold font-headline">Arkadaşlarını Davet Et</h1>
        <p className="mt-2 text-muted-foreground">İyilik zincirini büyütmek için arkadaşlarını hangel'a davet et.</p>
      </div>

      <div className="space-y-8">
        {/* Davet Linki */}
        <div className="relative flex w-full items-center">
            <Input 
                value={inviteLink} 
                readOnly 
                className="h-12 pr-12 text-base text-muted-foreground bg-muted/50 border-0"
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

        {/* Doğrudan Davet */}
        <div className="space-y-4">
          <SectionHeader>Davet Et</SectionHeader>
          <div className="flex justify-center gap-4">
            <IconButton href={`https://wa.me/?text=${encodeURIComponent(`Seni de hangel'a bekliyorum! ${inviteLink}`)}`} aria-label="WhatsApp ile paylaş">
                <MessageSquare className="h-6 w-6" />
            </IconButton>
            <IconButton href={`https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent("Seni de hangel'a bekliyorum!")}`} aria-label="Telegram ile paylaş">
                <Send className="h-6 w-6" />
            </IconButton>
            <IconButton href={`sms:?body=${encodeURIComponent(`Seni de hangel'a bekliyorum! ${inviteLink}`)}`} aria-label="SMS ile paylaş">
                <Mail className="h-6 w-6" />
            </IconButton>
          </div>
        </div>

        {/* Sosyal Medya */}
        <div className="space-y-4">
          <SectionHeader>Sosyal Medya'da Paylaş</SectionHeader>
           <div className="flex justify-center gap-4">
                <IconButton aria-label="Instagram'da paylaş">
                    <Instagram className="h-6 w-6" />
                </IconButton>
                <IconButton href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Seni de hangel'a bekliyorum! ${inviteLink}`)}`} aria-label="X'te paylaş">
                    <Twitter className="h-6 w-6" />
                </IconButton>
                <IconButton href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(inviteLink)}&title=${encodeURIComponent("Hangel Daveti")}`} aria-label="LinkedIn'de paylaş">
                    <Linkedin className="h-6 w-6" />
                </IconButton>
            </div>
        </div>
        
        {/* Kişiler ile Paylaş */}
        <div className="space-y-4">
            <SectionHeader>Kişilerin ile Paylaş</SectionHeader>
            <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start h-12 text-base">
                    <Contact className="mr-3 h-5 w-5" />
                    Rehberindeki arkadaşlarını davet et
                </Button>
                <Button variant="outline" className="w-full justify-start h-12 text-base">
                    <AtSign className="mr-3 h-5 w-5" />
                    Gmail'deki kişileri davet et
                </Button>
                 <Button variant="outline" className="w-full justify-start h-12 text-base">
                    <AtSign className="mr-3 h-5 w-5" />
                    Outlook/Hotmail kişilerini davet et
                </Button>
            </div>
        </div>
      </div>

      <Separator />

      <div className='text-center text-sm text-muted-foreground space-y-2'>
        <p className='flex items-center justify-center gap-2 font-semibold text-foreground'>
          <Star className='h-4 w-4 text-amber-500 fill-amber-500'/> Davet Programı
        </p>
        <p>Davet linkinle üye olan her arkadaşın için <strong>100 Sosyal Etki Puanı</strong> kazanırsın.</p>
        <p>Arkadaşın ilk bağışını yaptığında, sen de ekstra <strong>50 Sosyal Etki Puanı</strong> daha kazanırsın!</p>
      </div>

    </div>
  );
}
