'use client';

import { useCallback, useEffect, useState } from 'react';

// İlk-ziyaret onboarding turu durumu.
// - localStorage anahtarı sürümlüdür ('hangel_onboarding_v1_done'); ileride tur
//   yenilenirse v2 anahtarına geçilerek herkese tekrar gösterilebilir.
// - SSR güvenli: ilk render'da DAİMA false döner (hydration mismatch olmasın);
//   mount sonrası localStorage okunur ve gerçek durum yansıtılır.
// - Safari private / localStorage erişilemez durumda sessizce no-op: tur
//   gösterilmez (kullanıcıyı kilitlemekten iyi).
export const ONBOARDING_TOUR_KEY = 'hangel_onboarding_v1_done';

function readDone(): boolean {
  if (typeof window === 'undefined') return true; // SSR: gösterme
  try {
    return window.localStorage.getItem(ONBOARDING_TOUR_KEY) === '1';
  } catch {
    // localStorage erişilemedi → "görülmüş" say, böylece tur açılmaz.
    return true;
  }
}

function writeDone(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(ONBOARDING_TOUR_KEY, '1');
  } catch {
    // Erişilemedi — yoksay.
  }
}

interface UseOnboardingTourOptions {
  /** Tur yalnız bu true olunca (girişli + profili hazır kullanıcı) gösterilir. */
  enabled: boolean;
}

interface UseOnboardingTourResult {
  /** Turu şu an göstermeli miyiz? */
  open: boolean;
  /** "Geç" / "Başla" / bitir — kalıcı işaretle ve kapat. */
  complete: () => void;
}

export function useOnboardingTour({ enabled }: UseOnboardingTourOptions): UseOnboardingTourResult {
  // mounted: localStorage'a yalnız client'ta dokun (hydration güvenliği).
  const [mounted, setMounted] = useState(false);
  const [done, setDone] = useState(true); // güvenli varsayılan: gösterme

  useEffect(() => {
    setMounted(true);
    setDone(readDone());
  }, []);

  const complete = useCallback(() => {
    writeDone();
    setDone(true);
  }, []);

  return {
    open: mounted && enabled && !done,
    complete,
  };
}
