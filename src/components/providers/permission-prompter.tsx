'use client';

/**
 * PermissionPrompter — iOS native app'te kapatılmış izinleri tekrar sor.
 *
 * iOS sistem permission prompt'unu bir kez gösterir. Kullanıcı reddederse
 * uygulama içinden tekrar tetiklenemez — sadece Settings'ten manuel açılır.
 *
 * Bu component her cold start'ta:
 * 1. Native platform mı kontrol eder (web'de no-op)
 * 2. Push + Location permission durumunu okur
 * 3. Reddedilenler için açıklayıcı dialog gösterir (en fazla 7 günde 1)
 * 4. "Ayarları Aç" butonu iOS Settings'e götürür (app-settings: URL)
 */

import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
import { FirebaseMessaging } from '@capacitor-firebase/messaging';
import { Bell, MapPin, Activity, Settings as SettingsIcon } from 'lucide-react';

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { isLiveActivitySupported } from '@/lib/native-live-activity';

const PROMPT_COOLDOWN_MS = 7 * 24 * 3600 * 1000; // 7 gün

export function PermissionPrompter() {
  const [open, setOpen] = useState(false);
  const [missingPush, setMissingPush] = useState(false);
  const [missingLocation, setMissingLocation] = useState(false);
  const [missingLiveActivity, setMissingLiveActivity] = useState(false);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    let active = true;

    (async () => {
      try {
        const lastPrompt = typeof localStorage !== 'undefined' ? localStorage.getItem('perm-prompt-shown-at') : null;
        if (lastPrompt && Date.now() - parseInt(lastPrompt) < PROMPT_COOLDOWN_MS) return;

        const [pushPerm, locPerm, liveActSupported] = await Promise.all([
          FirebaseMessaging.checkPermissions().catch(() => ({ receive: 'prompt' as const })),
          Geolocation.checkPermissions().catch(() => ({ location: 'prompt' as const })),
          // Live Activity: false dönerse ya plugin yok, ya ActivityKit kapalı,
          // ya da kullanıcı Settings'ten kapatmış. UI'da bilgilendirme prompt'u.
          isLiveActivitySupported().catch(() => false),
        ]);

        const push = pushPerm.receive === 'denied';
        const location = locPerm.location === 'denied';
        // iOS 16.1+ cihazda destek yoksa muhtemelen kullanıcı kapatmış
        const liveActivity = !liveActSupported;

        if ((push || location || liveActivity) && active) {
          setMissingPush(push);
          setMissingLocation(location);
          setMissingLiveActivity(liveActivity);
          setOpen(true);
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem('perm-prompt-shown-at', String(Date.now()));
          }
        }
      } catch {
        // Sessiz fail — permission check başarısızsa kullanıcıyı rahatsız etme
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const openIosSettings = () => {
    if (typeof window !== 'undefined') {
      // iOS app-settings: URL scheme uygulamanın Settings sayfasını açar
      window.location.href = 'app-settings:';
    }
    setOpen(false);
  };

  const dismiss = () => {
    setOpen(false);
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && dismiss()}>
      <DialogContent className="max-w-sm rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-black">Daha iyi bir deneyim için</DialogTitle>
          <DialogDescription className="text-sm leading-relaxed pt-2">
            Hangel sana yakındaki etkinlikleri, kan ilanlarını ve acil çağrıları zamanında ulaştırmak için bu izinleri kullanır:
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          {missingPush && (
            <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-50 border border-amber-200 dark:bg-amber-900/20 dark:border-amber-800">
              <Bell className="h-5 w-5 text-amber-600 shrink-0 mt-0.5 dark:text-amber-300" />
              <div className="text-sm leading-snug">
                <p className="font-bold">Bildirimler</p>
                <p className="text-xs text-muted-foreground">Acil kan ilanları, etkinlik hatırlatmaları ve mesajlar için.</p>
              </div>
            </div>
          )}
          {missingLocation && (
            <div className="flex items-start gap-3 p-3 rounded-xl bg-blue-50 border border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
              <MapPin className="h-5 w-5 text-blue-600 shrink-0 mt-0.5 dark:text-blue-300" />
              <div className="text-sm leading-snug">
                <p className="font-bold">Konum</p>
                <p className="text-xs text-muted-foreground">Yakınınızdaki etkinlikleri, gönüllülük fırsatlarını ve STK&apos;ları göstermek için.</p>
              </div>
            </div>
          )}
          {missingLiveActivity && (
            <div className="flex items-start gap-3 p-3 rounded-xl bg-violet-50 border border-violet-200 dark:bg-violet-900/20 dark:border-violet-800">
              <Activity className="h-5 w-5 text-violet-600 shrink-0 mt-0.5 dark:text-violet-300" />
              <div className="text-sm leading-snug">
                <p className="font-bold">Canlı Etkinlikler</p>
                <p className="text-xs text-muted-foreground">Kan ilanı, etkinlik geri sayım ve gönüllülük görev durumunu Lock Screen&apos;de canlı takip için.</p>
              </div>
            </div>
          )}
        </div>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={dismiss} className="flex-1 rounded-xl">
            Şimdi değil
          </Button>
          <Button onClick={openIosSettings} className="flex-1 rounded-xl gap-1">
            <SettingsIcon className="h-4 w-4" /> Ayarları aç
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
