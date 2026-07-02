'use client';

/**
 * Native QR tarama — Capacitor (iOS/Android) üzerinde ML Kit barkod tarayıcı.
 *
 * NEDEN: app uzaktan https://hangel.org'yi WebView'da yüklüyor; QR taraması
 * eskiden getUserMedia + jsQR ile WebView içinde yapılıyordu. Bazı eski/OEM
 * Android WebView'ları getUserMedia'yı düzgün desteklemediğinden kamera ekranı
 * açılmıyordu. ML Kit `scan()` Google Play Services'in HAZIR kod tarayıcısını
 * kullanır (kendi tam-ekran native UI'ı, WebView kamerasına ve çoğu durumda ayrı
 * kamera iznine bile gerek yok) → tüm cihazlarda güvenilir.
 *
 * Web'de no-op döner (null); çağıran taraf getUserMedia + jsQR'a düşer.
 */

import { Capacitor } from '@capacitor/core';

/** Native ise QR tarar ve okunan ham metni döner; web/iptal/hata → null. */
export async function scanQrNative(): Promise<string | null> {
  if (!Capacitor.isNativePlatform()) return null;
  try {
    const { BarcodeScanner, BarcodeFormat } = await import('@capacitor-mlkit/barcode-scanning');

    // Android'de Google kod-tarayıcı modülü ilk kullanımda inebilir — hazır değilse indir.
    if (Capacitor.getPlatform() === 'android') {
      try {
        const { available } = await BarcodeScanner.isGoogleBarcodeScannerModuleAvailable();
        if (!available) await BarcodeScanner.installGoogleBarcodeScannerModule();
      } catch {
        // modül kontrolü/indirme başarısızsa yine de scan() denenir
      }
    }

    const { barcodes } = await BarcodeScanner.scan({ formats: [BarcodeFormat.QrCode] });
    return barcodes?.[0]?.rawValue ?? null;
  } catch {
    // izin reddi / iptal / cihazda GMS yok → null (çağıran "tekrar dene" gösterir)
    return null;
  }
}
