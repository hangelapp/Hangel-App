'use client';

/**
 * src/lib/santral/use-credentials.ts
 *
 * STK santral panelinin SIP/TURN credential'larını AUTH KORUMALI server
 * endpoint'inden (/api/ngo-admin/call-center/sip-credentials) çeken hook.
 *
 * Credential'lar ESKİDEN `NEXT_PUBLIC_SANTRAL_*` env ile client bundle'a
 * gömülüyordu (toll-fraud riski). Artık bundle'da YOK; runtime'da idToken ile
 * gated endpoint'ten alınır.
 */
import { useEffect, useState } from 'react';
import { useUser } from '@/firebase';

export interface SantralCredentials {
  wssUrl: string;
  sipUsername: string;
  sipPassword: string;
  sipDomain: string;
  iceServers: RTCIceServer[];
}

export interface UseSantralCredentialsResult {
  creds: SantralCredentials | null;
  loading: boolean;
  error: string | null;
}

export function useSantralCredentials(): UseSantralCredentialsResult {
  const { user } = useUser();
  const [creds, setCreds] = useState<SantralCredentials | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // authedUser yoksa idle: fetch yapma.
    if (!user) {
      setCreds(null);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    void (async () => {
      try {
        const idToken = await user.getIdToken();
        const res = await fetch('/api/ngo-admin/call-center/sip-credentials', {
          method: 'GET',
          headers: { authorization: `Bearer ${idToken}` },
          cache: 'no-store',
        });
        if (cancelled) return;
        const data = (await res.json().catch(() => null)) as
          | (SantralCredentials & { ok?: boolean })
          | { errorCode?: string; message?: string }
          | null;
        if (!res.ok || !data || 'errorCode' in data) {
          const message =
            data && 'message' in data && data.message
              ? data.message
              : 'Santral yapılandırması alınamadı.';
          setCreds(null);
          setError(message);
          return;
        }
        const ok = data as SantralCredentials;
        setCreds({
          wssUrl: ok.wssUrl,
          sipUsername: ok.sipUsername,
          sipPassword: ok.sipPassword,
          sipDomain: ok.sipDomain,
          iceServers: (ok.iceServers as RTCIceServer[]) ?? [],
        });
      } catch (e) {
        if (cancelled) return;
        setCreds(null);
        setError(e instanceof Error ? e.message : 'Santral bağlantı hatası.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  return { creds, loading, error };
}
