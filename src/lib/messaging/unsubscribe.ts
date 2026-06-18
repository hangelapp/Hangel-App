/**
 * Unsubscribe token utility ve marketing footer üretimi.
 * Server-only — Admin SDK üzerinden yazar.
 */

import { getAdminFirestore } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { COLLECTIONS } from '@/firebase/collections';

function generateToken(): string {
  const ALPHABET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return token;
}

/**
 * userMarketingConsent doc'unun unsubscribeToken'ını döndürür.
 * Yoksa üretip kaydeder. userId yoksa null döner.
 */
export async function ensureUnsubscribeToken(userId: string | null): Promise<string | null> {
  if (!userId) return null;
  const db = getAdminFirestore();
  const ref = db.collection(COLLECTIONS.userMarketingConsent).doc(userId);
  const snap = await ref.get();
  if (snap.exists) {
    const existing = (snap.data() as { unsubscribeToken?: string } | undefined)?.unsubscribeToken;
    if (existing) return existing;
  }
  const token = generateToken();
  await ref.set(
    {
      unsubscribeToken: token,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
  return token;
}

export function buildUnsubscribeUrl(token: string, channel: 'email' | 'sms'): string {
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL ?? 'https://hangel.org').replace(/\/$/, '');
  return `${base}/u/${token}?ch=${channel}`;
}

export function appendEmailUnsubscribeFooter(html: string, url: string): string {
  const footer = `<hr style="border:none;border-top:1px solid #e5e5e5;margin:24px 0 12px 0" /><p style="font-size:11px;color:#6b7280;text-align:center;font-family:Helvetica,Arial,sans-serif">Bu pazarlama e-postasını almak istemiyorsanız <a href="${url}" style="color:#6b7280;text-decoration:underline">aboneliği iptal edin</a>.</p>`;
  return html + footer;
}

/**
 * userId'siz alıcılar (yüklenen liste / outreach datası) için token üretilemediğinden
 * yanıt-bazlı çıkış footer'ı: "Listeden çıkmak istiyorum" → gönderene mailto yanıtı.
 */
export function appendGenericOptOutFooter(html: string, fromEmail?: string): string {
  const subject = encodeURIComponent('Listeden çıkmak istiyorum');
  const label = 'Listeden çıkmak istiyorum';
  const link = fromEmail
    ? `<a href="mailto:${fromEmail}?subject=${subject}" style="color:#6b7280;text-decoration:underline">${label}</a>`
    : label;
  const footer = `<hr style="border:none;border-top:1px solid #e5e5e5;margin:24px 0 12px 0" /><p style="font-size:11px;color:#6b7280;text-align:center;font-family:Helvetica,Arial,sans-serif">Bu e-postaları almak istemiyorsanız ${link} yazıp yanıtlayın.</p>`;
  return html + footer;
}
