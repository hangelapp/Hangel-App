'use client';

import React, { useEffect, useState } from 'react';
import { MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';

const VISIT_COUNT_KEY = 'hangel-visit-count';
const LOCATION_PROMPT_KEY = 'hangel-location-prompt-status';
const USER_CITY_KEY = 'hangel-user-city';

// PDF-spec: uygulamayı 2. kez açan kullanıcıdan konumuna izin istenir.
// Tarayıcı permission prompt'unu doğrudan tetiklemek yerine önce kullanıcıya
// neden istediğimizi açıklayan dostça bir Sheet gösterilir. Onaylarsa
// navigator.geolocation tetiklenir; reddederse ya da kapatırsa bir daha
// sorulmaz (status localStorage'da saklanır).
export function LocationPermissionPrompt() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const status = localStorage.getItem(LOCATION_PROMPT_KEY);
    if (status) return; // Daha önce sorulmuş, tekrar gösterme

    // Server-side rendering yapmayan, gerçek tarayıcı API'sini kontrol et
    if (!('geolocation' in navigator)) {
      localStorage.setItem(LOCATION_PROMPT_KEY, 'unsupported');
      return;
    }

    // Permission API ile mevcut izin durumunu kontrol et (varsa)
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'geolocation' as PermissionName }).then(result => {
        if (result.state === 'granted' || result.state === 'denied') {
          // Zaten cevap verilmiş, prompt göstermeye gerek yok
          localStorage.setItem(LOCATION_PROMPT_KEY, result.state);
          return;
        }
        // 'prompt' durumu — ziyaret sayısına bak
        checkVisitCount();
      }).catch(() => checkVisitCount());
    } else {
      checkVisitCount();
    }

    function checkVisitCount() {
      const countStr = localStorage.getItem(VISIT_COUNT_KEY);
      const count = countStr ? parseInt(countStr, 10) : 0;
      const next = count + 1;
      localStorage.setItem(VISIT_COUNT_KEY, String(next));
      if (next >= 2) {
        // 2. veya sonraki ziyaret — sor
        setTimeout(() => setOpen(true), 1500);
      }
    }
  }, []);

  const handleAllow = () => {
    if (!('geolocation' in navigator)) {
      localStorage.setItem(LOCATION_PROMPT_KEY, 'unsupported');
      setOpen(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        localStorage.setItem(LOCATION_PROMPT_KEY, 'granted');
        try {
          // Basit reverse geocode — Nominatim (OpenStreetMap). Cors-friendly.
          const r = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&accept-language=tr`,
            { headers: { 'User-Agent': 'hangel-web' } }
          );
          if (r.ok) {
            const data = await r.json();
            const addr = data?.address ?? {};
            const city = addr.province || addr.state || addr.city || addr.town || addr.county || '';
            if (city) localStorage.setItem(USER_CITY_KEY, city);
          }
        } catch (_e) {
          // sessizce yok say — izin verildi yeterli
        }
        setOpen(false);
      },
      (_err) => {
        localStorage.setItem(LOCATION_PROMPT_KEY, 'denied');
        setOpen(false);
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 600000 }
    );
  };

  const handleDismiss = () => {
    localStorage.setItem(LOCATION_PROMPT_KEY, 'dismissed');
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) handleDismiss(); }}>
      <SheetContent side="bottom" className="rounded-t-3xl p-6 max-w-md mx-auto">
        <SheetHeader className="text-left">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15">
            <MapPin className="h-6 w-6 text-primary" />
          </div>
          <SheetTitle className="text-center text-xl font-black">Konumunuzu paylaşır mısınız?</SheetTitle>
          <SheetDescription className="text-center text-sm leading-relaxed">
            Bulunduğunuz şehirdeki acil durum, kan ihtiyacı ve gönüllülük çağrılarını
            size daha doğru göstermemiz için konum izninize ihtiyacımız var.
            <br /><br />
            Konumunuz cihazınızda kalır; profiliniz veya başka kullanıcılarla paylaşılmaz.
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6 flex flex-col gap-2">
          <Button onClick={handleAllow} className="h-12 rounded-2xl font-bold">
            <MapPin className="mr-2 h-4 w-4" /> Konumumu Paylaş
          </Button>
          <Button onClick={handleDismiss} variant="ghost" className="h-11 rounded-2xl text-muted-foreground">
            Şimdi Değil
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
