'use client';

/**
 * GEÇİCİ ÖNİZLEME SAYFASI — Liquid Glass redesign kontrolü için.
 * Pop-art → Apple/iOS 26 dönüşümünü tek linkte göstermek amacıyla eklendi.
 * Kalıcı değil; incelemeden sonra silinebilir (bu dosyayı sil).
 */

import { useState } from 'react';
import { FirstVisitDownloadPopup } from '@/components/marketing/first-visit-download-popup';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Info, Moon, Sun } from 'lucide-react';
import {
  Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader,
  AlertDialogTitle, AlertDialogDescription, AlertDialogFooter,
  AlertDialogCancel, AlertDialogAction,
} from '@/components/ui/alert-dialog';

export default function PreviewGlassPage() {
  const [popupKey, setPopupKey] = useState(0);
  const [showPopup, setShowPopup] = useState(false);
  const [dark, setDark] = useState(false);

  function toggleDark() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-primary/25 via-fuchsia-400/20 to-cyan-400/25 dark:from-primary/20 dark:via-fuchsia-900/30 dark:to-cyan-900/30">
      {/* Arka plan renk lekeleri — cam saydamlığının görünmesi için */}
      <div className="pointer-events-none absolute -top-20 -left-16 h-72 w-72 rounded-full bg-primary/40 blur-3xl" />
      <div className="pointer-events-none absolute top-40 right-0 h-80 w-80 rounded-full bg-cyan-400/40 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-fuchsia-400/40 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-3xl px-4 py-10 space-y-8">
        <header className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Geçici önizleme</p>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Liquid Glass — pop-art &amp; uyarılar</h1>
          </div>
          <Button variant="outline" onClick={toggleDark} className="gap-2">
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {dark ? 'Aydınlık' : 'Karanlık'}
          </Button>
        </header>

        {/* 1) İlk-ziyaret popup (pop-art → cam) */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">1. İlk-ziyaret indirme popup'ı (pop-art → cam)</h2>
          <Button
            onClick={() => { setShowPopup(true); setPopupKey((k) => k + 1); }}
          >
            Popup'ı aç
          </Button>
        </section>

        {/* 2) Uyarı/onay modali (AlertDialog) */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">2. Uyarı/onay modali (AlertDialog → cam)</h2>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline">Onay modalini aç</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Başvurunu iptal et?</AlertDialogTitle>
                <AlertDialogDescription>
                  Bu işlem geri alınamaz. Gönüllülük başvurun kaldırılacak.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Vazgeç</AlertDialogCancel>
                <AlertDialogAction>İptal et</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </section>

        {/* 3) Dialog (zaten cam — referans) */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">3. Dialog (referans — zaten cam)</h2>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">Dialog aç</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Cam dialog</DialogTitle>
                <DialogDescription>Liquid Glass yüzey — glass-prominent + rounded-3xl.</DialogDescription>
              </DialogHeader>
              <p className="text-sm text-muted-foreground">Örnek içerik.</p>
            </DialogContent>
          </Dialog>
        </section>

        {/* 4) Satır içi uyarılar (Alert) */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">4. Satır içi uyarılar (Alert → cam / yumuşak kırmızı)</h2>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Bilgi</AlertTitle>
            <AlertDescription>Varsayılan uyarı — glass-thin yüzey.</AlertDescription>
          </Alert>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Hata</AlertTitle>
            <AlertDescription>Apple tarzı yumuşak kırmızı tint callout.</AlertDescription>
          </Alert>
        </section>
      </div>

      {showPopup && <FirstVisitDownloadPopup key={popupKey} forceOpen />}
    </div>
  );
}
