'use client';

/**
 * Etki Kartı paylaşımı — istemci yardımcısı.
 *
 * Öncelik sırası:
 *   1) Story görselini (PNG) dosya olarak paylaş → Instagram/WhatsApp story için ideal.
 *   2) Sadece linki paylaş (native paylaş sayfası) → link WhatsApp/X'te zengin önizleme açar.
 *   3) Linki panoya kopyala (fallback).
 * Native (Capacitor) ve modern mobil tarayıcılarda navigator.share çalışır.
 */
import { impactEquivalent } from './impact-equivalents';

export type ShareImpactInput = { amount: number; ngos?: string[]; who?: string };
export type ShareImpactResult = 'shared-image' | 'shared-link' | 'copied' | 'cancelled' | 'failed';

function origin(): string {
  return typeof window !== 'undefined' ? window.location.origin : 'https://hangel.org';
}

function params(p: ShareImpactInput): URLSearchParams {
  const q = new URLSearchParams();
  q.set('a', String(Math.max(0, Math.round(p.amount || 0))));
  if (p.ngos?.length) q.set('n', p.ngos.slice(0, 3).join(','));
  if (p.who) q.set('who', p.who);
  return q;
}

/** WhatsApp/X'te zengin önizleme açan paylaşım linki. */
export function buildImpactShareUrl(p: ShareImpactInput): string {
  return `${origin()}/share/impact?${params(p).toString()}`;
}

/** Story formatındaki PNG görsel adresi (dosya paylaşımı için). */
export function buildImpactImageUrl(p: ShareImpactInput, format: 'og' | 'story' = 'story'): string {
  const q = params(p);
  q.set('f', format);
  return `${origin()}/api/impact-card?${q.toString()}`;
}

export async function shareImpact(p: ShareImpactInput): Promise<ShareImpactResult> {
  const pageUrl = buildImpactShareUrl(p);
  const eq = impactEquivalent(p.amount);
  const amountStr = Math.max(0, Math.round(p.amount || 0)).toLocaleString('tr-TR');
  const text = `hangel'de alışverişimi ₺${amountStr} bağışa dönüştürdüm — ≈ ${eq.count} ${eq.unit} ${eq.emoji}. Sen de katıl!`;

  const nav = typeof navigator !== 'undefined' ? navigator : undefined;

  // 1) Story görselini dosya olarak paylaş (Instagram story için en iyisi).
  try {
    if (nav?.canShare && nav.share) {
      const res = await fetch(buildImpactImageUrl(p, 'story'));
      if (res.ok) {
        const blob = await res.blob();
        const file = new File([blob], 'hangel-etki.png', { type: blob.type || 'image/png' });
        if (nav.canShare({ files: [file] })) {
          await nav.share({ files: [file], text, url: pageUrl, title: 'hangel — etki kartım' });
          return 'shared-image';
        }
      }
    }
  } catch (e) {
    if ((e as { name?: string })?.name === 'AbortError') return 'cancelled';
    // düş ve linki paylaşmayı dene
  }

  // 2) Sadece linki paylaş.
  try {
    if (nav?.share) {
      await nav.share({ title: 'hangel — etki kartım', text, url: pageUrl });
      return 'shared-link';
    }
  } catch (e) {
    if ((e as { name?: string })?.name === 'AbortError') return 'cancelled';
  }

  // 3) Panoya kopyala.
  try {
    await nav?.clipboard?.writeText(pageUrl);
    return 'copied';
  } catch {
    return 'failed';
  }
}
