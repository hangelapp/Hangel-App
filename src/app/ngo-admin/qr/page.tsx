'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Copy, Twitter, Linkedin } from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';

export default function QrPage() {
  const { toast } = useToast();
  const ngo = { name: 'Uluslararası Sosyal Fayda Derneği', username: '@sbg' };
  const profileUrl = `hangel.org/${ngo.username.replace('@', '')}`;
  const shareText = `Hangel'deki ${ngo.name} profilini incele!`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(profileUrl)}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(profileUrl);
    toast({
      title: 'Profil linki kopyalandı!',
    });
  };

  return (
    <div className="space-y-6 flex flex-col items-center text-center">
        <div>
            <h1 className="text-2xl font-bold">Profil QR Kodu</h1>
            <p className="text-muted-foreground max-w-md mx-auto">
            Bu QR kodu okutarak veya linki paylaşarak profilini kolayca paylaş.
            </p>
        </div>
      
      <Card className="max-w-sm w-full">
        <CardHeader>
          <CardTitle>{ngo.name}</CardTitle>
          <CardDescription>Profil QR Kodu</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <div className="bg-white p-4 rounded-lg">
            <Image src={qrCodeUrl} alt={`${ngo.name} QR Kodu`} width={200} height={200} />
          </div>

          <div className="flex items-center justify-center gap-2 p-2 rounded-lg bg-muted w-full">
            <p className="text-sm text-foreground font-mono break-all">{profileUrl}</p>
            <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={copyToClipboard}>
                <Copy className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="w-full space-y-2">
            <div className="grid grid-cols-1 gap-2">
                <Button variant="outline" asChild>
                <a href={qrCodeUrl} download={`${ngo.username.replace('@','')}-qr-kodu.png`}>
                    <Download className="mr-2 h-4 w-4" />
                    QR Kodu İndir
                </a>
                </Button>
            </div>
            <div className="flex justify-center gap-2 pt-2">
                 <Button asChild variant="outline" size="icon">
                    <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(profileUrl)}`} target="_blank" rel="noopener noreferrer">
                        <Twitter className="h-5 w-5" />
                    </a>
                </Button>
                 <Button asChild variant="outline" size="icon">
                     <a href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(profileUrl)}&title=${encodeURIComponent(shareText)}`} target="_blank" rel="noopener noreferrer">
                        <Linkedin className="h-5 w-5" />
                    </a>
                </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
