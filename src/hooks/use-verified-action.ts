'use client';

import { useCallback } from 'react';
import { useUser } from '@/firebase';
import { initiateEmailVerification } from '@/firebase/non-blocking-login';
import { useToast } from '@/hooks/use-toast';

/**
 * Hassas eylem (bağış yapma / gönüllülük başvurusu) için yumuşak e-posta
 * doğrulama kapısı.
 *
 * Felsefe: kayıt sürtünmesini kaldırmak için doğrulama ARTIK bloklamaz; ancak
 * yalnızca bu iki hassas eylemde, e-posta ile (provider='password') kayıt olup
 * henüz doğrulamamış kullanıcıya nazik bir uyarı gösterilir ve doğrulama maili
 * tekrar gönderilir. Telefon/WhatsApp ile gelenler ASLA engellenmez.
 *
 * Kullanım:
 *   const requireVerifiedEmail = useVerifiedAction();
 *   const ok = requireVerifiedEmail();
 *   if (!ok) return; // eylemi durdur
 */
export function useVerifiedAction() {
  const { user } = useUser();
  const { toast } = useToast();

  return useCallback((): boolean => {
    // Oturum yok → gate uygulanmaz (çağıran kendi giriş yönlendirmesini yapar).
    if (!user) return true;

    // E-posta ile (password) kayıt olmuş kullanıcı mı? Telefon/WhatsApp ile
    // gelenlerde providerData 'phone' olur → engelleme yok.
    const isPasswordUser = user.providerData?.some((p) => p?.providerId === 'password');
    if (!isPasswordUser) return true;

    // Pseudo-email hesaplar (telefon köprüsü) için de gate yok.
    if (user.email?.endsWith('@hangel.app') || user.email?.endsWith('@hangel.org')) return true;

    if (user.emailVerified) return true;

    // Doğrulanmamış: nazik uyarı + doğrulama maili tekrar gönder (best-effort).
    initiateEmailVerification(user).catch(() => { /* sessizce yut */ });
    toast({
      title: 'Önce e-postanı doğrula',
      description: 'Bu işlem için e-posta adresini doğrulaman gerekiyor. Doğrulama bağlantısını e-postana tekrar gönderdik.',
    });
    return false;
  }, [user, toast]);
}
