'use client';

/**
 * /qr-login/[token] — telefonda açılır (QR okutulunca). Giriş yapmış kullanıcı
 * masaüstündeki QR girişini onaylar. Onaylanınca masaüstü kendi kendine giriş yapar.
 */

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useUser } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Monitor, CheckCircle2 } from 'lucide-react';

export default function QrLoginApprovePage() {
  const params = useParams();
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();
  const token = (params?.token as string) ?? '';
  const [approving, setApproving] = useState(false);
  const [done, setDone] = useState(false);

  const approve = async () => {
    if (!user) return;
    setApproving(true);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch('/api/auth/qr-login/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ token }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { toast({ variant: 'destructive', title: 'Onaylanamadı', description: data?.message }); return; }
      setDone(true);
    } catch { toast({ variant: 'destructive', title: 'Bağlantı hatası' }); }
    finally { setApproving(false); }
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#f5f5f7] p-4">
      <Card className="w-full max-w-sm rounded-3xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            {done ? <CheckCircle2 className="h-7 w-7" /> : <Monitor className="h-7 w-7" />}
          </div>
          <CardTitle>{done ? 'Giriş onaylandı 🧡' : 'Bilgisayarda giriş'}</CardTitle>
          <CardDescription>
            {done
              ? 'Bilgisayarına dönebilirsin — birkaç saniye içinde giriş yapılacak.'
              : 'Bilgisayarındaki hangel oturumunu açmak için onayla.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {isUserLoading ? (
            <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : done ? (
            <p className="text-center text-sm text-muted-foreground">Bu sayfayı kapatabilirsin.</p>
          ) : !user ? (
            <>
              <p className="text-center text-sm text-muted-foreground">Önce bu telefonda hesabına giriş yapmalısın.</p>
              <Button asChild className="w-full"><Link href={`/login?next=/qr-login/${token}`}>Giriş Yap</Link></Button>
            </>
          ) : (
            <>
              <p className="text-center text-xs text-muted-foreground">
                Yalnızca bu girişi <span className="font-semibold">sen başlattıysan</span> onayla. Tanımadığın bir QR ise onaylama.
              </p>
              <Button className="w-full" onClick={approve} disabled={approving}>
                {approving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Bilgisayarda Girişi Onayla
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
