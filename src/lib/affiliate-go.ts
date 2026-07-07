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

    // format=json: route 302 yerine {ok,url} döner. Neden: fetch'in cross-origin
    // 302 follow'u merchant CORS'una takılıp atılabiliyordu; ayrıca hata
    // yanıtlarında res.url API URL'inin KENDİSİ olduğundan kullanıcıya ham JSON
    // hata sayfası açılıyordu (2026-07-07 bug). JSON modunda final URL'i biz açarız.
    const res = await fetch(
      `/api/affiliate/go?brandId=${encodeURIComponent(brandId)}&format=json`,
      { headers, credentials: 'include' },
    );

    let target: string | null = null;
    if (res.ok) {
      const data = (await res.json().catch(() => null)) as { ok?: boolean; url?: string } | null;
      if (data?.ok && typeof data.url === 'string' && /^https?:\/\//i.test(data.url)) {
        target = data.url;
      }
    }
    // Route markayı bulamadıysa (PIM/affiliate'siz marka → 404) veya hata verdiyse:
    // kullanıcıyı yine de ürüne götür (bağış izlenemez ama deneyim kırılmaz).
    if (!target) target = fallbackUrl || null;
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
