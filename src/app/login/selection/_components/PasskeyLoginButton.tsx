'use client';

/**
 * Passkey (Face ID / cihaz passkey'i) ile giriş butonu — login ekranına eklenir.
 * Bağımsız: mevcut form akışını bozmaz. Desteklenmeyen tarayıcıda görünmez.
 * Başarıda konfeti + güvenli `next`/`redirect` yoluna yönlendirir.
 */
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Loader2, KeyRound } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { signInWithPasskey, isPasskeySupported } from '@/lib/passkey-client';
import { celebrate } from '@/lib/celebrate';

function safeNext(raw: string | null): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return '/market';
  return raw;
}

export function PasskeyLoginButton() {
  const [mounted, setMounted] = useState(false);
  const [busy, setBusy] = useState(false);
  const { toast } = useToast();
  const searchParams = useSearchParams();
  useEffect(() => setMounted(true), []);

  // SSR/ilk render'da gizli (hydration uyumsuzluğu olmasın); passkey yoksa da yok.
  if (!mounted || !isPasskeySupported()) return null;

  const onClick = async () => {
    setBusy(true);
    try {
      await signInWithPasskey();
      celebrate(); // Apple hissi
      const next = safeNext(searchParams.get('next') || searchParams.get('redirect'));
      window.location.assign(next);
    } catch (e) {
      toast({
        variant: 'destructive',
        title: 'Passkey ile giriş yapılamadı',
        description: e instanceof Error ? e.message : 'Tekrar dene.',
      });
      setBusy(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={onClick}
      disabled={busy}
      className="w-full h-12 gap-2 rounded-xl border-border font-bold"
    >
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
      Passkey (Face ID) ile giriş
    </Button>
  );
}
