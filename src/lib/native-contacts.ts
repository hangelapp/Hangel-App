'use client';

/**
 * Native contacts (rehber) köprüsü — @capacitor-community/contacts.
 *
 * Kullanım: kullanıcı "Rehberimden Hangel kullanıcılarını davet et"
 * akışında çağırır. iOS NSContactsUsageDescription Info.plist'te var.
 *
 * Privacy: telefon numaraları SHA-256 hash'lenip backend'e gönderilir,
 * raw numara hiç sunucuya gitmez. Backend matched hash'leri Hangel
 * user index'inde arar, eşleşenleri döndürür.
 */

import { Capacitor } from '@capacitor/core';
import { Contacts } from '@capacitor-community/contacts';
import { canonicalPhone } from '@/lib/phone-normalize';

export interface ContactSummary {
  name: string;
  phones: string[]; // canonicalPhone normalized
}

export async function getDeviceContacts(): Promise<ContactSummary[]> {
  if (!Capacitor.isNativePlatform()) return [];

  try {
    const perm = await Contacts.checkPermissions();
    if (perm.contacts !== 'granted') {
      const req = await Contacts.requestPermissions();
      if (req.contacts !== 'granted') return [];
    }

    const result = await Contacts.getContacts({
      projection: { name: true, phones: true },
    });

    return (result.contacts ?? [])
      .map((c) => ({
        name: c.name?.display || c.name?.given || 'İsimsiz',
        phones: (c.phones ?? [])
          .map((p) => canonicalPhone(p.number ?? ''))
          .filter((n) => n && n.length >= 7),
      }))
      .filter((c) => c.phones.length > 0);
  } catch (e) {
    console.warn('[native-contacts] getDeviceContacts failed', e);
    return [];
  }
}

/**
 * SHA-256 hash (Web Crypto API — Capacitor WebView destekler).
 * Backend'in match table'ı aynı algoritma kullanır.
 */
export async function hashPhoneForMatch(phone: string): Promise<string> {
  const data = new TextEncoder().encode(phone);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
