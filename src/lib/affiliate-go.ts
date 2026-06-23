'use client';

/**
 * Affiliate "Ürüne Git / Alışverişe Başla" yönlendirme yardımcısı (client-side).
 *
 * Eski akış dışa giden affiliate URL'i doğrudan `openExternalUrl(productUrl)` ile
 * açıyordu — bu durumda satış HİÇBİR kullanıcıya bağlanamıyordu (subId yok).
 * Yeni akış: önce `/api/affiliate/go?brandId=...` çağrılır. Bu route (Admin SDK):
 *   1. idToken'dan userId çözer (anonimse subId'siz devam eder),
 *   2. kısa bir clickId üretip `affiliateClicks/{clickId}` doc'unu yazar,
 *   3. affiliate URL'i clickId subId'i ile kurup 302 ile yönlendirir.
 * Conversion postback'i bu doc'u "converted" yapıp gerçek bağışı oluşturur.
 *
 * Burada Bearer header'ı taşıyabilmek için route'u `fetch` ile çağırır,
 * 302'yi takip eder ve son merchant URL'ini (`res.url`) Capacitor Browser /
 * yeni sekme ile açarız. Böylece hem native (iOS popup blocker) hem web çalışır
 * ve kullanıcı kimliği route'a ulaşır. Header taşınamayan düz navigasyon yerine
 * fetch+redirect kullanmamızın nedeni budur.
 */

import { openExternalUrl } from '@/lib/capacitor';
import type { User } from 'firebase/auth';

/**
 * Affiliate redirect endpoint'i üzerinden dışa giden alışveriş linkini açar.
 *
 * @param brandId  hangel brands koleksiyonundaki marka id'si (zorunlu — route
 *                 affiliate URL'i bununla çözer).
 * @param authUser Oturum açmış Firebase user (varsa). idToken subId için kullanılır;
 *                 yoksa anonim olarak (subId'siz) devam edilir.
 * @param fallbackUrl Route hata verirse (ör. ağ/oturum sorunu) yine de kullanıcıyı
 *                 markaya götürmek için doğrudan açılacak URL (bağış izlenemez ama
 *                 kullanıcı mağazaya ulaşır). Yoksa sessizce vazgeçilir.
 * @returns Yönlendirme başlatılabildiyse true.
 */
export async function goToAffiliate(params: {
  brandId: string;
  authUser?: User | null;
  fallbackUrl?: string | null;
}): Promise<boolean> {
  const { brandId, authUser, fallbackUrl } = params;
  if (!brandId) {
    if (fallbackUrl) {
      void openExternalUrl(fallbackUrl);
      return true;
    }
    return false;
  }

  try {
    const headers: Record<string, string> = {};
    if (authUser) {
      try {
        const idToken = await authUser.getIdToken();
        if (idToken) headers.authorization = `Bearer ${idToken}`;
      } catch {
        // Token alınamazsa anonim devam — route subId'siz yönlendirir.
      }
    }

    // 302'yi takip et; son merchant URL'i res.url olur. credentials:'include'
    // ileride cookie tabanlı oturum eklenirse de çalışsın diye verilir.
    const res = await fetch(
      `/api/affiliate/go?brandId=${encodeURIComponent(brandId)}`,
      { headers, redirect: 'follow', credentials: 'include' },
    );

    const target = res.url || fallbackUrl || null;
    if (!target) return false;

    void openExternalUrl(target);
    return true;
  } catch {
    // Ağ/route hatası: kullanıcıyı yine de markaya götür (bağış izlenemez).
    if (fallbackUrl) {
      void openExternalUrl(fallbackUrl);
      return true;
    }
    return false;
  }
}
