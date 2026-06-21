'use client';

/**
 * Native bridge initializer.
 *
 * Şu an yaptıkları:
 *  - Capacitor `appUrlOpen` listener'ı kurar → Universal Link + custom scheme
 *    (`hangel://`) çağrılarını Next.js router'a yönlendirir.
 *  - Native + girişliyken Apple Health'ten kişisel bilgileri (kan grubu,
 *    cinsiyet, doğum tarihi, boy, kilo) okuyup users/{uid}.personalInfo'ya
 *    senkronlar (oturum başına bir kez, best-effort).
 *
 * İleride buraya: ATT prompt zamanlama, network status, app lifecycle gibi
 * native event'ler eklenecek.
 */

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Capacitor } from '@capacitor/core';

import { useUser, useFirestore } from '@/firebase';
import { initDeepLinkListener, ensureStatusBarVisible } from '@/lib/native-bridge';
import { syncHealthToProfile } from '@/lib/sync-health';

export function NativeBridgeProvider() {
  const router = useRouter();
  const { user } = useUser();
  const db = useFirestore();
  const healthSyncedRef = useRef(false);

  useEffect(() => {
    const cleanup = initDeepLinkListener((path) => router.push(path));
    void ensureStatusBarVisible(); // saat/şarj çubuğu görünür kalsın
    return cleanup;
  }, [router]);

  // Apple Health auto-fill: native + girişli + henüz senkronlanmadıysa, oturum
  // başına bir kez. Tamamen sessiz (best-effort); izin/veri yoksa no-op.
  useEffect(() => {
    if (healthSyncedRef.current) return;
    if (!Capacitor.isNativePlatform()) return;
    if (!user || !db) return;
    healthSyncedRef.current = true;
    void syncHealthToProfile(db, user.uid);
  }, [user, db]);

  return null;
}
