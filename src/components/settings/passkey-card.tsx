'use client';

/**
 * Passkey (Face ID / Touch ID / Windows Hello) yönetim kartı — Gizlilik/Güvenlik
 * ayarlarına eklenir. Bu cihaza passkey ekler; sonraki girişte şifre/kod gerekmez.
 * Platform authenticator yoksa (veya passkey desteklenmiyorsa) hiç görünmez.
 */
import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, KeyRound, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { registerPasskey, isPasskeySupported, hasPlatformAuthenticator } from '@/lib/passkey-client';

export function PasskeyCard() {
  const [mounted, setMounted] = useState(false);
  const [supported, setSupported] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setMounted(true);
    hasPlatformAuthenticator()
      .then(setSupported)
      .catch(() => setSupported(isPasskeySupported()));
  }, []);

  if (!mounted || !supported) return null;

  const onClick = async () => {
    setBusy(true);
    try {
      await registerPasskey();
      setDone(true);
      toast({ title: 'Passkey eklendi', description: 'Artık bu cihazda Face ID / Touch ID ile giriş yapabilirsin.' });
    } catch (e) {
      toast({
        variant: 'destructive',
        title: 'Passkey eklenemedi',
        description: e instanceof Error ? e.message : 'Tekrar dene.',
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <KeyRound className="h-5 w-5 text-primary" /> Passkey (Face ID)
        </CardTitle>
        <CardDescription>
          Bu cihaza passkey ekle; bir dahaki girişte şifre veya kod gerekmez — Face ID / Touch ID yeter. Cihazlar arasında güvenli ve hızlı.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={onClick} disabled={busy || done} className="gap-2">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : done ? <Check className="h-4 w-4" /> : <KeyRound className="h-4 w-4" />}
          {done ? 'Passkey eklendi' : 'Bu cihaza Passkey ekle'}
        </Button>
      </CardContent>
    </Card>
  );
}
