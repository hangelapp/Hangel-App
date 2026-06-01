'use client';

/**
 * Contacts izni iste — welcome flow'da contacts feature kullanılmadan önce
 * permission prompt'u tetiklemek için.
 *
 * iOS Settings → Hangel'da Contacts toggle'ının görünmesi için iOS'un
 * `Contacts.framework` API'sını çağırmasını bekliyoruz.
 */
import { Capacitor } from '@capacitor/core';
import { Contacts } from '@capacitor-community/contacts';

export async function requestContactsPermission(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;
  try {
    const perm = await Contacts.checkPermissions();
    if (perm.contacts === 'granted') return true;
    if (perm.contacts === 'denied') return false;
    const req = await Contacts.requestPermissions();
    return req.contacts === 'granted';
  } catch (e) {
    console.warn('[contacts] permission request failed', e);
    return false;
  }
}
