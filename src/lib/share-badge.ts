'use client';

/**
 * Rozet paylaşımı — istemci yardımcısı (share-impact ile aynı desen).
 * Öncelik: story görselini dosya olarak paylaş → sadece link → panoya kopyala.
 */
export type ShareBadgeInput = {
  name: string;
  sub?: string; // seviye (Bakır…) veya tür (Özel/Dönemsel)
  area?: string;
  emoji?: string;
  who?: string;
  color?: string;
};
export type ShareBadgeResult = 'shared-image' | 'shared-link' | 'copied' | 'cancelled' | 'failed';

function origin(): string {
  return typeof window !== 'undefined' ? window.location.origin : 'https://hangel.org';
}

function params(p: ShareBadgeInput): URLSearchParams {
  const q = new URLSearchParams();
  q.set('name', p.name);
  if (p.sub) q.set('sub', p.sub);
  if (p.area) q.set('area', p.area);
  if (p.emoji) q.set('emoji', p.emoji);
  if (p.who) q.set('who', p.who);
  if (p.color) q.set('color', p.color);
  return q;
}

export function buildBadgeShareUrl(p: ShareBadgeInput): string {
  return `${origin()}/share/badge?${params(p).toString()}`;
}

export function buildBadgeImageUrl(p: ShareBadgeInput, format: 'og' | 'story' = 'story'): string {
  const q = params(p);
  q.set('f', format);
  return `${origin()}/api/badge-card?${q.toString()}`;
}

export async function shareBadge(p: ShareBadgeInput): Promise<ShareBadgeResult> {
  const pageUrl = buildBadgeShareUrl(p);
  const text = `hangel'de "${p.name}" rozetini kazandım 🧡 Sen de gönüllülük ve bağışla rozet kazan!`;
  const nav = typeof navigator !== 'undefined' ? navigator : undefined;

  try {
    if (nav?.canShare && nav.share) {
      const res = await fetch(buildBadgeImageUrl(p, 'story'));
      if (res.ok) {
        const blob = await res.blob();
        const file = new File([blob], 'hangel-rozet.png', { type: blob.type || 'image/png' });
        if (nav.canShare({ files: [file] })) {
          await nav.share({ files: [file], text, url: pageUrl, title: 'hangel — rozetim' });
          return 'shared-image';
        }
      }
    }
  } catch (e) {
    if ((e as { name?: string })?.name === 'AbortError') return 'cancelled';
  }

  try {
    if (nav?.share) {
      await nav.share({ title: 'hangel — rozetim', text, url: pageUrl });
      return 'shared-link';
    }
  } catch (e) {
    if ((e as { name?: string })?.name === 'AbortError') return 'cancelled';
  }

  try {
    await nav?.clipboard?.writeText(pageUrl);
    return 'copied';
  } catch {
    return 'failed';
  }
}
