'use client';

/**
 * useStreakPing — hangel ZIYARETİ sinyalini günde bir kez sunucuya bildirir.
 *
 * Kullanıcı app'i/sayfayı her açtığında çalışır ama günde yalnızca 1 kez
 * (Europe/Istanbul günü başına) gerçek bir `POST /api/streak/ping` atar.
 * Aynı gün tekrar mount'lar localStorage damgası sayesinde no-op'tur; böylece
 * gereksiz ağ trafiği ve Firestore yazımı olmaz.
 *
 * Mount noktası: app-shell (oturum açık ana kabuk). TEK satır kullanım:
 *   useStreakPing(authUser);
 *
 * `authUser` Firebase Auth User'ı (getIdToken sahibi) veya null olabilir; null
 * ise hiçbir şey yapmaz.
 */

import { useEffect } from 'react';
import { istanbulDayKey } from '@/lib/streak';

const STORAGE_KEY = 'hangel:streak:lastVisitPing';

type AuthLike = { uid: string; getIdToken: () => Promise<string> } | null | undefined;

export function useStreakPing(authUser: AuthLike): void {
  const uid = authUser?.uid ?? null;

  useEffect(() => {
    if (!authUser || !uid) return;
    if (typeof window === 'undefined') return;

    const today = istanbulDayKey();
    const stampKey = `${STORAGE_KEY}:${uid}`;

    // Bugün zaten ping atıldıysa atla.
    try {
      if (window.localStorage.getItem(stampKey) === today) return;
    } catch {
      // localStorage erişilemezse (gizli mod vb.) yine de bir kez dener.
    }

    let cancelled = false;

    const ping = async () => {
      try {
        const token = await authUser.getIdToken();
        if (cancelled) return;
        const res = await fetch('/api/streak/ping', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ signal: 'visit' }),
          keepalive: true,
        });
        if (cancelled) return;
        if (res.ok) {
          try {
            window.localStorage.setItem(stampKey, today);
          } catch {
            /* yoksay */
          }
        }
      } catch {
        // Sessiz başarısızlık — seri bir sonraki açılışta tekrar denenir.
      }
    };

    // Açılışı bloklamamak için bir sonraki tick'e ertele.
    const id = window.setTimeout(ping, 1200);
    return () => {
      cancelled = true;
      window.clearTimeout(id);
    };
  }, [authUser, uid]);
}
