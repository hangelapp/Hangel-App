'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@/firebase';

/**
 * Süper-admin sayfa-bazlı yetki (granular). Kaynak: ID token claim'i
 * `superAdminPermissions` (set-super-admin API hem claim'e hem user doc'a yazar).
 *
 *   - undefined / null  → TAM yetkili (founder / eski super-admin) → her sayfa.
 *   - string[]          → KISITLI; yalnızca listedeki slug'lar (+ landing + help).
 *
 * Slug = /super-admin/<slug>/... yolundaki ilk segment. Landing ('') ve 'help'
 * her zaman açık. İzin listesinde olmayan sayfalar (events/hospitals/library vb.)
 * yalnızca tam yetkili admin'lere görünür.
 */
const ALWAYS_ALLOWED = new Set(['', 'help']);

export function slugFromPath(pathname: string): string {
  return pathname.replace(/^\/super-admin\/?/, '').split('/')[0] || '';
}

export function useSuperAdminPermissions() {
  const { user } = useUser();
  const [perms, setPerms] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setPerms(null); setLoading(true); return; }
    let cancelled = false;
    user.getIdTokenResult()
      .then((res) => {
        if (cancelled) return;
        const p = (res.claims as { superAdminPermissions?: unknown }).superAdminPermissions;
        setPerms(Array.isArray(p) ? (p as string[]) : null);
        setLoading(false);
      })
      .catch(() => { if (!cancelled) { setPerms(null); setLoading(false); } });
    return () => { cancelled = true; };
  }, [user]);

  const isFull = !loading && perms === null;

  const slugAllowed = (slug: string): boolean => {
    if (loading) return true;        // henüz bilinmiyor → engelleme (flash/yanlış redirect önle)
    if (perms === null) return true; // tam yetkili
    return ALWAYS_ALLOWED.has(slug) || perms.includes(slug);
  };

  return { perms, isFull, loading, slugAllowed };
}
