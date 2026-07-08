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
const SESSION_ID_KEY = 'hangel:session:id';

type AuthLike = { uid: string; getIdToken: () => Promise<string> } | null | undefined;

/** Oturum-başı sabit id — sessionStorage: sekme/oturum kapanınca sıfırlanır
 *  (yeni oturum = yeni giriş kaydı). Böylece "Giriş/Çıkış" logu oturum bazlı olur. */
function getSessionId(): string {
  try {
    const existing = window.sessionStorage.getItem(SESSION_ID_KEY);
    if (existing) return existing;
    const c = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
    const id = c?.randomUUID?.() ?? `s-${Date.now()}-${Math.floor(performance.now())}`;
    window.sessionStorage.setItem(SESSION_ID_KEY, id);
    return id;
  } catch {
    return `s-${Date.now()}`;
  }
}

/** Kaba cihaz/ tarayıcı bilgisi (UA'dan; hassas veri değil, log görünürlüğü için). */
function detectDevice(): { deviceName: string; browserName: string; deviceType: string } {
  try {
    const ua = navigator.userAgent || '';
    const browserName =
      /Edg\//.test(ua) ? 'Edge' : /OPR\//.test(ua) ? 'Opera' :
      /Chrome\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' :
      /Firefox\//.test(ua) ? 'Firefox' : 'Tarayıcı';
    const deviceType = /iPad|Tablet/.test(ua) ? 'Tablet' : /Mobi|Android|iPhone/.test(ua) ? 'Mobil' : 'Masaüstü';
    const deviceName =
      /iPhone/.test(ua) ? 'iPhone' : /iPad/.test(ua) ? 'iPad' : /Android/.test(ua) ? 'Android' :
      /Mac/.test(ua) ? 'Mac' : /Windows/.test(ua) ? 'Windows' : /Linux/.test(ua) ? 'Linux' : 'Cihaz';
    return { deviceName, browserName, deviceType };
  } catch {
    return { deviceName: '', browserName: '', deviceType: '' };
  }
}

export function useStreakPing(authUser: AuthLike): void {
  const uid = authUser?.uid ?? null;

  useEffect(() => {
    if (!authUser || !uid) return;
    if (typeof window === 'undefined') return;

    const today = istanbulDayKey();
    const stampKey = `${STORAGE_KEY}:${uid}`;

    // NOT: Eskiden "bugün ping atıldıysa hiç çalışma" guard'ı vardı. Artık session
    // (giriş/çıkış) logu için HER mount'ta çalışmalı; streak yazımı yine günde 1
    // (aşağıdaki streakAlreadyToday ile ayrıştırılır) → seri maliyeti değişmez.

    let cancelled = false;

    // Bu oturumda giriş kaydı (createdAt) daha önce yazıldı mı? Yazıldıysa
    // sonraki ping'ler sadece lastActiveAt tazeler (çıkış/online süresi için).
    const sessionId = getSessionId();
    const device = detectDevice();
    // Seri günde 1; session her mount'ta gönderilir (lastActiveAt tazelensin).
    const streakAlreadyToday = (() => {
      try { return window.localStorage.getItem(stampKey) === today; } catch { return false; }
    })();

    const ping = async () => {
      try {
        const token = await authUser.getIdToken();
        if (cancelled) return;
        // Seri sinyali sadece günde 1 kez; session bilgisi her seferinde.
        const res = await fetch('/api/streak/ping', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            signal: streakAlreadyToday ? 'action' : 'visit',
            sessionId,
            deviceName: device.deviceName,
            browserName: device.browserName,
            deviceType: device.deviceType,
          }),
          keepalive: true,
        });
        if (cancelled) return;
        if (res.ok) {
          try {
            if (!streakAlreadyToday) window.localStorage.setItem(stampKey, today);
          } catch { /* yoksay */ }
        }
      } catch {
        // Sessiz başarısızlık — bir sonraki açılışta tekrar denenir.
      }
    };

    // Sekme kapanırken/gizlenirken son bir "lastActiveAt" tazele (çıkış anı).
    const flushOnHide = () => {
      if (document.visibilityState !== 'hidden') return;
      try {
        // keepalive fetch — sayfa kapanırken bile gönderilir. Token async
        // alınamayabileceği için best-effort; başarısız olursa son ping yeterli.
        void authUser.getIdToken().then((token) => {
          fetch('/api/streak/ping', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ signal: 'action', sessionId }),
            keepalive: true,
          }).catch(() => undefined);
        }).catch(() => undefined);
      } catch { /* yoksay */ }
    };

    // Açılışı bloklamamak için bir sonraki tick'e ertele.
    const id = window.setTimeout(ping, 1200);
    document.addEventListener('visibilitychange', flushOnHide);
    return () => {
      cancelled = true;
      window.clearTimeout(id);
      document.removeEventListener('visibilitychange', flushOnHide);
    };
  }, [authUser, uid]);
}
