/**
 * Son görüntülenen ürünlerin HAFİF sinyali — localStorage'da tutulur (sunucu yok).
 * "Sana Özel" kişiselleştirme şeridi bu sinyalden + favorilerden kategori/marka
 * çıkarımı yapar. Ürünün kendisini değil, öneri için yeterli meta'yı saklar.
 */

const KEY = 'hangel_recent_views';
const MAX = 30;

export interface RecentView {
  id: string;
  category?: string;
  productBrandKey?: string;
  brandName?: string;
  t: number; // epoch ms
}

export function getRecentViews(): RecentView[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEY);
    const list = raw ? (JSON.parse(raw) as RecentView[]) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function recordView(p: {
  id: string;
  category?: string | null;
  productBrandKey?: string | null;
  brandName?: string | null;
}): void {
  if (typeof window === 'undefined' || !p?.id) return;
  try {
    const list = getRecentViews().filter((v) => v.id !== p.id);
    list.unshift({
      id: p.id,
      category: p.category || undefined,
      productBrandKey: p.productBrandKey || undefined,
      brandName: p.brandName || undefined,
      t: Date.now(),
    });
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX)));
  } catch {
    /* kota/erişim hatası — sessiz geç */
  }
}
