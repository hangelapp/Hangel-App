'use client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Copy, Twitter, Linkedin } from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';

export default function QrPage() {
  const { toast } = useToast();
  const profileUrl = 'https://hangel.org/ngo/ahbap';
  const shareText = "Hangel'deki Ahbap Derneği profilini incele!";
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
            <h1 className="text-2xl font-bold">STK Profil QR Kodu</h1>
            <p className="text-muted-foreground max-w-md mx-auto">
            Bu QR kodu okutarak veya linki paylaşarak destekçilerinizin profilinize kolayca ulaşmasını sağlayın.
            </p>
        </div>
      
      <Card className="max-w-sm w-full">
        <CardHeader>
          <CardTitle>Ahbap Derneği</CardTitle>
          <CardDescription>Profil QR Kodu</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <div className="bg-white p-4 rounded-lg">
            <Image src={qrCodeUrl} alt="Ahbap Derneği QR Kodu" width={200} height={200} />
          </div>
          <p className="text-sm text-muted-foreground break-all">{profileUrl}</p>
          <div className="w-full space-y-2">
            <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" asChild>
                <a href={qrCodeUrl} download="ahbap-qr-kodu.png">
                    <Download className="mr-2 h-4 w-4" />
                    QR Kodu İndir
                </a>
                </Button>
                <Button onClick={copyToClipboard}>
                <Copy className="mr-2 h-4 w-4" />
                Profili Kopyala
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
