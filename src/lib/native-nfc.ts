'use client';

/**
 * Web ↔ @capgo/capacitor-nfc köprüsü.
 *
 * Hangel'in birincil NFC akışı: kullanıcı iPhone arkasını bir NFC etiketine
 * yaklaştırınca iOS background tag reading (iPhone XS+) etiketteki Universal
 * Link URL'sini açar; AASA + NativeBridgeProvider üzerinden Hangel app içine
 * yönlendirir. Bu plugin'e gerek yok.
 *
 * Bu wrapper sadece ek senaryolar için:
 *  - Foreground tag reading (app açıkken in-app QR/NFC karışık check-in)
 *  - Tag write (STK admin paneli yeni etiket oluştururken iPhone'la yazar)
 *
 * Plugin API @capgo/capacitor-nfc v8.x — CapacitorNfc.startScanning/stopScanning/write.
 */

import { Capacitor } from '@capacitor/core';
import { CapacitorNfc, type NfcEvent, type NdefRecord } from '@capgo/capacitor-nfc';

export interface ReadResult {
  ok: boolean;
  url?: string;
  rawText?: string;
  errorMessage?: string;
}

export async function readNdefUrl(): Promise<ReadResult> {
  if (!Capacitor.isNativePlatform()) return { ok: false, errorMessage: 'Sadece mobil uygulamada.' };
  try {
    await CapacitorNfc.startScanning();
  } catch (e) {
    return { ok: false, errorMessage: e instanceof Error ? e.message : 'NFC oturumu açılamadı.' };
  }
  return new Promise((resolve) => {
    let resolved = false;
    const settle = (result: ReadResult) => {
      if (resolved) return;
      resolved = true;
      try { void CapacitorNfc.stopScanning(); } catch { /* sessiz */ }
      resolve(result);
    };
    setTimeout(() => settle({ ok: false, errorMessage: 'Zaman aşımı.' }), 30_000);
    void CapacitorNfc.addListener('ndefDiscovered', (event: NfcEvent) => {
      const records: NdefRecord[] = event.tag?.ndefMessage ?? [];
      for (const r of records) {
        const url = decodeNdefUriRecord(r);
        if (url && /^https?:\/\//i.test(url)) {
          settle({ ok: true, url, rawText: url });
          return;
        }
      }
      settle({ ok: false, errorMessage: 'Etikette URL bulunamadı.' });
    });
  });
}

export async function writeNdefUrl(url: string): Promise<{ ok: boolean; errorMessage?: string }> {
  if (!Capacitor.isNativePlatform()) return { ok: false, errorMessage: 'Sadece mobil uygulamada.' };
  if (!/^https:\/\/hangel\.org\.tr\//i.test(url)) {
    return { ok: false, errorMessage: 'Yalnız hangel.org.tr URL\'leri yazılabilir.' };
  }
  try {
    // capgo write API NDEF URI record formatı bekler. Mesaj formatı plugin'e
    // göre değişir; tip-güvenli olmayan cast ile çalıştırırız (runtime'da
    // CapacitorNfc plugin'i kabul eder).
    const writeFn = (CapacitorNfc as unknown as { write: (opts: unknown) => Promise<void> }).write;
    await writeFn({
      message: [
        {
          tnf: 1, // NFC_WELL_KNOWN
          type: [0x55], // 'U' = URI record
          id: [],
          payload: encodeUriPayload(url),
        },
      ],
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, errorMessage: e instanceof Error ? e.message : 'Yazım başarısız.' };
  }
}

function decodeNdefUriRecord(r: NdefRecord): string | null {
  if (!r.payload || r.payload.length === 0) return null;
  // Type byte 'U' (0x55) — URI record. tnf ile beraber kontrol et.
  const prefixCode = r.payload[0] ?? 0;
  const prefix = uriPrefixForCode(prefixCode);
  const rest = String.fromCharCode(...r.payload.slice(1));
  return prefix + rest;
}

function encodeUriPayload(url: string): number[] {
  // 'https://' prefix code = 4; tam URL'i tut, prefix optimization atla
  for (let code = 35; code >= 1; code--) {
    const prefix = uriPrefixForCode(code);
    if (prefix && url.startsWith(prefix)) {
      const rest = url.slice(prefix.length);
      return [code, ...Array.from(rest).map(c => c.charCodeAt(0))];
    }
  }
  return [0, ...Array.from(url).map(c => c.charCodeAt(0))];
}

// NDEF URI Record prefix table (NFCForum-TS-RTD_URI_1.0)
function uriPrefixForCode(code: number): string {
  const prefixes = [
    '', 'http://www.', 'https://www.', 'http://', 'https://',
    'tel:', 'mailto:', 'ftp://anonymous:anonymous@', 'ftp://ftp.', 'ftps://',
    'sftp://', 'smb://', 'nfs://', 'ftp://', 'dav://',
    'news:', 'telnet://', 'imap:', 'rtsp://', 'urn:',
    'pop:', 'sip:', 'sips:', 'tftp:', 'btspp://',
    'btl2cap://', 'btgoep://', 'tcpobex://', 'irdaobex://', 'file://',
    'urn:epc:id:', 'urn:epc:tag:', 'urn:epc:pat:', 'urn:epc:raw:', 'urn:epc:',
    'urn:nfc:',
  ];
  return prefixes[code] ?? '';
}
