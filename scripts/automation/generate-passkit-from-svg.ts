/**
 * PassKit branded PNG generator — Hangel real logo (apple-icon source).
 *
 * Apple Wallet .pkpass için gerekli icon/logo/strip görsellerini Hangel'in
 * **gerçek logo'su** ile üretir. Kaynak: `src/app/apple-icon.png` (352x356
 * RGBA, beyaz "h" üzeri Hangel Mercan zemin).
 *
 * Bu, generate-passkit-placeholders.ts'in yerini almaz — onu placeholder
 * fallback olarak korur. Bu script daha kaliteli (gerçek logo glyph)
 * üretir ve Playwright ile yüksek-DPI render eder.
 *
 * Çalıştır:
 *   npx tsx scripts/automation/generate-passkit-from-svg.ts
 *
 * Çıktı: src/lib/passkit/assets/{icon,logo,strip}{,@2x,@3x}.png
 *
 * Tasarım (gerçek brand):
 *   - Icon: src/app/apple-icon.png'i 29/58/87'ye resize (sips).
 *   - Logo: şeffaf zeminde sol kare apple-icon + "hangel" wordmark
 *     (Poppins Black, Hangel Mercan).
 *   - Strip: Hangel Mercan zemin + sol orta beyaz badge (h) +
 *     "hangel" wordmark (beyaz, Poppins Black).
 *
 * Bağımlılık: playwright (zaten devDependency).
 */
import { writeFileSync, mkdirSync, readFileSync } from 'fs';
import { resolve } from 'path';
import { execFileSync } from 'child_process';
import { chromium } from 'playwright';

const ROOT = process.cwd();
const ASSETS_DIR = resolve(ROOT, 'src/lib/passkit/assets');
const SOURCE_ICON = resolve(ROOT, 'src/app/apple-icon.png');

mkdirSync(ASSETS_DIR, { recursive: true });

// Hangel brand colors (from src/app/globals.css & logo/page.tsx)
const HANGEL_MERCAN = '#f34723';

// -----------------------------------------------------------------------------
// 1. Icons: 29/58/87 — apple-icon.png'den sips ile resize
// -----------------------------------------------------------------------------

function resizeIcon(size: number, outName: string): void {
  const outPath = resolve(ASSETS_DIR, outName);
  execFileSync('sips', [
    '-z', String(size), String(size),
    SOURCE_ICON,
    '--out', outPath,
  ], { stdio: ['ignore', 'ignore', 'pipe'] });
  const sz = readFileSync(outPath).length;
  console.log(`  OK  ${outName} (${size}×${size}, ${sz} bytes)`);
}

// -----------------------------------------------------------------------------
// 2. Logo + Strip: Playwright headless render
// -----------------------------------------------------------------------------

async function renderHtmlToPng(
  html: string,
  width: number,
  height: number,
  outName: string,
  options: { omitBackground?: boolean } = {},
): Promise<void> {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({
      viewport: { width, height },
      deviceScaleFactor: 1,
    });
    await page.setContent(html, { waitUntil: 'networkidle' });
    const outPath = resolve(ASSETS_DIR, outName);
    await page.screenshot({
      path: outPath,
      type: 'png',
      clip: { x: 0, y: 0, width, height },
      omitBackground: options.omitBackground ?? false,
    });
    const sz = readFileSync(outPath).length;
    console.log(`  OK  ${outName} (${width}×${height}, ${sz} bytes)`);
  } finally {
    await browser.close();
  }
}

// Embed apple-icon.png as base64 data URL so HTML can inline it without
// a file server (Playwright `setContent` doesn't resolve relative paths).
const ICON_DATA_URL = (() => {
  const buf = readFileSync(SOURCE_ICON);
  return `data:image/png;base64,${buf.toString('base64')}`;
})();

// Logo HTML — şeffaf zemin, sol kare h-badge + "hangel" wordmark mercan.
// PassKit logo bölgesi pass renk altında render edildiği için şeffaf bırakılır.
function buildLogoHtml(width: number, height: number): string {
  // Badge: height boyutunda kare; aralık height'in %12'si.
  const badge = height;
  const gap = Math.round(height * 0.18);
  const wordH = Math.round(height * 0.65);
  return `<!DOCTYPE html>
<html><head><style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: ${width}px; height: ${height}px; background: transparent; }
  .row {
    display: flex; align-items: center; height: ${height}px;
    font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif;
  }
  .badge {
    width: ${badge}px; height: ${badge}px;
    background-image: url('${ICON_DATA_URL}');
    background-size: contain; background-repeat: no-repeat; background-position: center;
    border-radius: ${Math.round(badge * 0.22)}px;
    flex-shrink: 0;
  }
  .word {
    margin-left: ${gap}px;
    font-size: ${wordH}px; line-height: 1; font-weight: 900;
    letter-spacing: -0.03em;
    color: ${HANGEL_MERCAN};
  }
</style></head><body>
  <div class="row">
    <div class="badge"></div>
    <div class="word">hangel</div>
  </div>
</body></html>`;
}

// Strip HTML — Hangel Mercan zemin + sol orta apple-icon badge +
// sağ tarafında "hangel" wordmark beyaz.
// Not: apple-icon zaten kendi coral kare zeminini taşır; üzerine ayrıca beyaz
// çerçeve koymadan direkt yerleştiriyoruz — wallet'ta tek katman renk + glyph.
function buildStripHtml(width: number, height: number): string {
  const badge = Math.round(height * 0.62);
  const padL = Math.round(width * 0.06);
  const gap = Math.round(height * 0.16);
  const wordH = Math.round(height * 0.42);
  return `<!DOCTYPE html>
<html><head><style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { width: ${width}px; height: ${height}px; background: ${HANGEL_MERCAN}; }
  .row {
    display: flex; align-items: center; height: ${height}px; padding-left: ${padL}px;
    font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif;
  }
  .badge {
    width: ${badge}px; height: ${badge}px;
    background-image: url('${ICON_DATA_URL}');
    background-size: contain; background-repeat: no-repeat; background-position: center;
    border-radius: ${Math.round(badge * 0.22)}px;
    flex-shrink: 0;
    box-shadow: 0 0 0 ${Math.max(1, Math.round(badge * 0.04))}px rgba(255,255,255,0.95);
  }
  .word {
    margin-left: ${gap}px;
    font-size: ${wordH}px; line-height: 1; font-weight: 900;
    letter-spacing: -0.03em;
    color: #ffffff;
  }
</style></head><body>
  <div class="row">
    <div class="badge"></div>
    <div class="word">hangel</div>
  </div>
</body></html>`;
}

// -----------------------------------------------------------------------------
// Manifest
// -----------------------------------------------------------------------------

interface LogoSpec { name: string; width: number; height: number }
const LOGOS: LogoSpec[] = [
  { name: 'logo.png',     width: 160, height: 50 },
  { name: 'logo@2x.png',  width: 320, height: 100 },
  { name: 'logo@3x.png',  width: 480, height: 150 },
];
const STRIPS: LogoSpec[] = [
  { name: 'strip.png',    width: 320, height: 123 },
  { name: 'strip@2x.png', width: 640, height: 246 },
  { name: 'strip@3x.png', width: 960, height: 369 },
];

async function main(): Promise<void> {
  console.log(`PassKit asset generator — Hangel real logo (source: ${SOURCE_ICON})`);
  console.log(`Output: ${ASSETS_DIR}\n`);

  // 1. Icons (sips)
  console.log('[1/3] Icons (sips resize):');
  resizeIcon(29, 'icon.png');
  resizeIcon(58, 'icon@2x.png');
  resizeIcon(87, 'icon@3x.png');

  // 2. Logos (Playwright)
  console.log('\n[2/3] Logos (Playwright render):');
  for (const spec of LOGOS) {
    await renderHtmlToPng(
      buildLogoHtml(spec.width, spec.height),
      spec.width, spec.height, spec.name,
      { omitBackground: true },
    );
  }

  // 3. Strips (Playwright)
  console.log('\n[3/3] Strips (Playwright render):');
  for (const spec of STRIPS) {
    await renderHtmlToPng(
      buildStripHtml(spec.width, spec.height),
      spec.width, spec.height, spec.name,
      { omitBackground: false },
    );
  }

  console.log('\n9 branded PassKit asset yazıldı (Hangel real logo).');
  console.log('Source override edilirse: src/app/apple-icon.png\'i değiştir, script tekrar koş.');
}

main().catch((err: unknown) => {
  console.error('FAIL:', err);
  process.exit(1);
});
