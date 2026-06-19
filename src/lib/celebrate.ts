/**
 * Milestone kutlaması — konfeti + haptik (Apple hissi).
 *
 * Bağımsız: çağrılınca geçici bir tam-ekran canvas oluşturur, konfeti patlatır,
 * animasyon bitince kendini kaldırır. Harici kütüphane yok.
 *
 * Haptik: navigator.vibrate (Android WebView / Chrome). iOS WKWebView vibrate'i
 * desteklemez → sessizce atlanır (konfeti yine çalışır). Gerçek iOS haptiği için
 * ileride @capacitor/haptics eklenebilir (native build gerekir).
 *
 * Kullanım: import { celebrate } from '@/lib/celebrate'; celebrate();
 */

const COLORS = ['#f34723', '#ffd9ce', '#22c55e', '#3b82f6', '#eab308', '#ffffff'];

export function celebrate(opts?: { vibrate?: boolean }): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  // Haptik (destekleyen cihazlarda)
  if (opts?.vibrate !== false && typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    try { navigator.vibrate([12, 40, 18, 60, 24]); } catch { /* yok say */ }
  }

  // Hareket azaltma tercihi → konfeti atla (haptik yine verildi)
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
