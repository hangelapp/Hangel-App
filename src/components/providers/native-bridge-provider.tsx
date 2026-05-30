'use client';

/**
 * Native bridge initializer.
 *
 * Şu an yaptıkları:
 *  - Capacitor `appUrlOpen` listener'ı kurar → Universal Link + custom scheme
 *    (`hangel://`) çağrılarını Next.js router'a yönlendirir.
 *
 * İleride buraya: ATT prompt zamanlama, network status, app lifecycle gibi
 * native event'ler eklenecek.
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { initDeepLinkListener } from '@/lib/native-bridge';

export function NativeBridgeProvider() {
  const router = useRouter();
  useEffect(() => {
    const cleanup = initDeepLinkListener((path) => router.push(path));
    return cleanup;
  }, [router]);
  return null;
}
