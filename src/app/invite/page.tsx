'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function InvitePage() {
    const { toast } = useToast();
    const inviteLink = 'https://hangel.com/invite?ref=ayseyilmaz';

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
        </CardContent>
      </Card>
    </div>
  );
}
