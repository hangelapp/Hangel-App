'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';

/**
 * Misafir/Keşfet modu için "eylem anında giriş iste" kapısı.
 *
 * Felsefe (Adım 7): kayıt sürtünmesini kaldırmak için keşif yüzeyleri
 * (feed, market, gönüllülük, etkinlik, STK profili) anonim gezilebilir. Giriş
 * yalnızca bir EYLEM anında (başvur / bağışla / takip / RSVP / mesaj) istenir.
 *
 * Anonimse: nazik toast gösterir + /login/selection'a `?next=<mevcut-url>` ile
 * yönlendirir (login sonrası kullanıcı kaldığı yere döner) ve `false` döner.
 * Girişliyse `true` döner; çağıran eyleme devam eder.
 *
 * Kullanım:
 *   const requireAuth = useRequireAuth();
 *   if (!requireAuth()) return;       // anonimse durur ve login'e taşır
 *   // ... (girişli) — varsa useVerifiedAction kontrolü BUNDAN SONRA gelir
 */
export function useRequireAuth() {
  const { user } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  return useCallback(
    (message?: { title?: string; description?: string }): boolean => {
      if (user) return true;

      toast({
        title: message?.title ?? 'Devam etmek için giriş yap',
        description:
          message?.description ??
          'Bu işlemi yapmak için giriş yap ya da hemen ücretsiz kayıt ol.',
      });

      // next= login/selection tarafından resolveNext ile same-origin doğrulanır;
      // login sonrası IndividualForm.onComplete bu yola döner.
      const target =
        typeof window !== 'undefined'
          ? window.location.pathname + window.location.search
          : '/';
      router.push(`/login/selection?action=login&next=${encodeURIComponent(target)}`);
      return false;
    },
    [user, router, toast],
  );
}
