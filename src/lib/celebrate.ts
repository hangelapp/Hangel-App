/**
 * Milestone kutlaması — konfeti + haptik (Apple hissi).
 *
 * Bağımsız: çağrılınca geçici bir tam-ekran canvas oluşturur, konfeti patlatır,
 * animasyon bitince kendini kaldırır. Harici kütüphane yok.
 *
 * Haptik (iki katman, ikisi de no-op-güvenli):
 *   1. navigator.vibrate (Android WebView / Chrome). iOS WKWebView desteklemez.
 *   2. @capacitor/haptics köprüsü (hapticCelebrate) — iOS/Android native gerçek
 *      dokunsal. Web'de ve eklenti yokken sessizce atlanır.
 *
 * Opsiyonel başlık/mesaj: rozet/sertifika/seviye gibi anlarda kısa bir
 * tam-genişlik "toast" benzeri kutlama bandı gösterir (semantik token'larla,
 * koyu tema güvenli). Verilmezse yalnızca konfeti + haptik çalışır.
 *
 * Kullanım:
 *   import { celebrate } from '@/lib/celebrate';
 *   celebrate();                                   // sade konfeti + haptik
 *   celebrate({ title: 'Yeni rozet 🧡', message: 'Gümüş · Eğitim' });
 *
 * GERİYE UYUMLU: mevcut tüm çağrılar (celebrate(), celebrate({ vibrate:false }))
 * aynen çalışır — title/message yeni ve opsiyoneldir.
 */

import { hapticCelebrate } from '@/lib/haptics';

const COLORS = ['#f34723', '#ffd9ce', '#22c55e', '#3b82f6', '#eab308', '#ffffff'];

export interface CelebrateOptions {
  /** navigator.vibrate'i kapat (varsayılan: açık). */
  vibrate?: boolean;
  /** Üstte gösterilecek kutlama başlığı (örn. "Yeni rozet 🧡"). */
  title?: string;
  /** Başlık altı kısa açıklama (örn. "Gümüş · Eğitim"). */
  message?: string;
}

export function celebrate(opts?: CelebrateOptions): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  // Haptik katman 1: web vibrate (destekleyen cihazlarda — çoğunlukla Android).
  if (opts?.vibrate !== false && typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    try { navigator.vibrate([12, 40, 18, 60, 24]); } catch { /* yok say */ }
  }

  // Haptik katman 2: native Capacitor Haptics (iOS/Android). Web'de no-op,
  // eklenti yoksa sessiz. Promise'i bilinçli olarak beklemiyoruz (fire-and-forget).
  void hapticCelebrate().catch(() => undefined);

  // Opsiyonel kutlama bandı — başlık/mesaj verilmişse göster (hareket azaltma
  // tercihinde de gösterilir; sadece konfeti animasyonu atlanır).
  if (opts?.title || opts?.message) {
    showCelebrationBanner(opts.title, opts.message);
  }

  // Hareket azaltma tercihi → konfeti atla (haptik + bant yine verildi)
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) return;

  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:2147483647';
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const W = window.innerWidth;
  const H = window.innerHeight;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  if (!ctx) { canvas.remove(); return; }
  ctx.scale(dpr, dpr);

  const parts = Array.from({ length: 150 }, () => ({
    x: W / 2 + (Math.random() - 0.5) * 60,
    y: H * 0.4,
    vx: (Math.random() - 0.5) * 17,
    vy: -10 - Math.random() * 9,
    w: 5 + Math.random() * 6,
    h: 8 + Math.random() * 7,
    rot: Math.random() * Math.PI * 2,
    vr: (Math.random() - 0.5) * 0.32,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
  }));

  let frame = 0;
  const maxFrames = 150;
  const tick = () => {
    frame++;
    ctx.clearRect(0, 0, W, H);
    for (const p of parts) {
      p.vy += 0.33; // yerçekimi
      p.vx *= 0.99;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.globalAlpha = Math.max(0, 1 - frame / maxFrames);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }
    if (frame < maxFrames) requestAnimationFrame(tick);
    else canvas.remove();
  };
  requestAnimationFrame(tick);
}

/**
 * Kutlama bandı — ekranın üstünde belirip kayan, kendini kaldıran kısa bildirim.
 * Tailwind sınıfları kullanır (semantik token → koyu tema güvenli): bg-card,
 * text-foreground, text-muted-foreground, border-border. Toplam ~2.6 sn görünür.
 * Erişilebilir: role="status" + aria-live="polite". prefers-reduced-motion'da
 * kayma animasyonu olmadan anında görünür.
 */
function showCelebrationBanner(title?: string, message?: string): void {
  if (typeof document === 'undefined') return;

  const reduce = !!window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;

  const wrap = document.createElement('div');
  wrap.setAttribute('role', 'status');
  wrap.setAttribute('aria-live', 'polite');
  // Konteyner: üst-orta, güvenli alan boşluğu, en üstte (konfeti ile aynı katman üstü).
  wrap.style.cssText =
    'position:fixed;top:calc(var(--sat, 0px) + 14px);left:50%;transform:translateX(-50%);' +
    'z-index:2147483647;pointer-events:none;max-width:min(92vw,420px);width:max-content;padding:0 16px;';

  const card = document.createElement('div');
  card.className =
    'flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-md';
  card.style.cssText =
    'opacity:0;' +
    (reduce ? '' : 'transform:translateY(-12px);transition:opacity .28s ease,transform .28s cubic-bezier(.16,1,.3,1);');

  // Turuncu kalp rozeti (🙏 ASLA) — primary token'lı yumuşak daire.
  const heart = document.createElement('div');
  heart.className =
    'flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xl';
  heart.textContent = '🧡';
  heart.setAttribute('aria-hidden', 'true');

  const textCol = document.createElement('div');
  textCol.className = 'min-w-0';

  if (title) {
    const h = document.createElement('p');
    h.className = 'truncate text-sm font-bold leading-tight text-foreground';
    h.textContent = title;
    textCol.appendChild(h);
  }
  if (message) {
    const m = document.createElement('p');
    m.className = 'truncate text-xs font-medium text-muted-foreground';
    if (title) m.style.marginTop = '2px';
    m.textContent = message;
    textCol.appendChild(m);
  }

  card.appendChild(heart);
  card.appendChild(textCol);
  wrap.appendChild(card);
  document.body.appendChild(wrap);

  // Giriş animasyonu (reduced-motion'da anında).
  requestAnimationFrame(() => {
    card.style.opacity = '1';
    if (!reduce) card.style.transform = 'translateY(0)';
  });

  // Çıkış + temizlik.
  window.setTimeout(() => {
    card.style.opacity = '0';
    if (!reduce) card.style.transform = 'translateY(-12px)';
    window.setTimeout(() => { try { wrap.remove(); } catch { /* yok say */ } }, reduce ? 0 : 320);
  }, 2600);
}
