/**
 * App Clip Card image generator — Hangel brand.
 *
 * App Clip Card (1800×1200) görselini Playwright headless ile render eder.
 * Apple App Store Connect → App Clip → Default Experience kartında kullanılır.
 *
 * Tasarım:
 *   - Hangel Mercan zemin (#f34723)
 *   - Ortalı büyük yuvarlatılmış kare badge (apple-icon.png embed)
 *   - Altında beyaz başlık: "Hangel"
 *   - Altında daha küçük beyaz alt başlık: "Toplumsal Etki"
 *   - Sağ alt köşede 90% opak "ile birlikte" wordmark
 *
 * Çalıştır:
 *   npx tsx scripts/automation/generate-app-clip-card.ts
 *
 * Çıktı: ios/App/HangelAppClip/Assets.xcassets/AppClipCard.imageset/AppClipCard.png
 *
 * Bağımlılık: playwright (zaten devDependency).
 * Kaynak modeli: scripts/automation/generate-passkit-from-svg.ts (Agent I).
 */
import { writeFileSync, mkdirSync, readFileSync } from 'fs';
import { resolve } from 'path';
import { chromium } from 'playwright';

const ROOT = process.cwd();
const SOURCE_ICON = resolve(ROOT, 'src/app/apple-icon.png');
const TARGET_DIR = resolve(
  ROOT,
  'ios/App/HangelAppClip/Assets.xcassets/AppClipCard.imageset',
);

mkdirSync(TARGET_DIR, { recursive: true });

const HANGEL_MERCAN = '#f34723';
const WIDTH = 1800;
const HEIGHT = 1200;

// Embed apple-icon.png as base64 data URL so Playwright `setContent` can
// inline it without a static file server.
const ICON_DATA_URL = (() => {
  const buf = readFileSync(SOURCE_ICON);
  return `data:image/png;base64,${buf.toString('base64')}`;
})();

function buildCardHtml(): string {
  // Badge: card height'in %42'si (≈500px) — Apple recommendation iconik glyph
  // App Clip Card ortalanır, alt 1/3'ünde başlık & alt başlık.
  const badge = Math.round(HEIGHT * 0.42);
  const badgeRR = Math.round(badge * 0.22);
  const titleH = Math.round(HEIGHT * 0.11);
  const subtitleH = Math.round(HEIGHT * 0.055);
  return `<!DOCTYPE html>
<html><head><style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body {
    width: ${WIDTH}px; height: ${HEIGHT}px;
    background: ${HANGEL_MERCAN};
    font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', sans-serif;
    color: #ffffff;
    overflow: hidden;
  }
  /* Subtle radial glow — yarı saydam altın halka, badge'in arkasında derinlik */
  .bg-glow {
    position: absolute;
    inset: 0;
    background: radial-gradient(
      circle at 50% 42%,
      rgba(255,255,255,0.18) 0%,
      rgba(255,255,255,0.06) 25%,
      transparent 60%
    );
  }
  .stack {
    position: relative;
    width: 100%; height: 100%;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    padding: 80px 120px;
    gap: ${Math.round(HEIGHT * 0.04)}px;
  }
  .badge {
    width: ${badge}px; height: ${badge}px;
    background-image: url('${ICON_DATA_URL}');
    background-size: contain;
    background-repeat: no-repeat;
    background-position: center;
    border-radius: ${badgeRR}px;
    /* Apple Watch / iOS rounded square — superellipse approximation */
    box-shadow:
      0 24px 60px rgba(0,0,0,0.22),
      0 8px 20px rgba(0,0,0,0.12);
  }
  .title {
    font-size: ${titleH}px;
    font-weight: 900;
    letter-spacing: -0.03em;
    line-height: 1;
    margin-top: ${Math.round(HEIGHT * 0.035)}px;
    text-shadow: 0 4px 24px rgba(0,0,0,0.15);
  }
  .subtitle {
    font-size: ${subtitleH}px;
    font-weight: 600;
    letter-spacing: -0.01em;
    line-height: 1.1;
    opacity: 0.94;
    text-align: center;
    max-width: 70%;
  }
</style></head>
<body>
  <div class="bg-glow"></div>
  <div class="stack">
    <div class="badge" aria-hidden="true"></div>
    <div class="title">Hangel</div>
    <div class="subtitle">Toplumsal Etki ile Birlikte</div>
  </div>
</body></html>`;
}

async function renderCard(): Promise<void> {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({
      viewport: { width: WIDTH, height: HEIGHT },
      deviceScaleFactor: 1,
    });
    const html = buildCardHtml();
    await page.setContent(html, { waitUntil: 'networkidle' });
    const outPath = resolve(TARGET_DIR, 'AppClipCard.png');
    await page.screenshot({
      path: outPath,
      type: 'png',
      clip: { x: 0, y: 0, width: WIDTH, height: HEIGHT },
      omitBackground: false,
    });
    const sz = readFileSync(outPath).length;
    console.log(`  OK  AppClipCard.png (${WIDTH}×${HEIGHT}, ${sz} bytes)`);
  } finally {
    await browser.close();
  }
}

async function writeContentsJson(): Promise<void> {
  const contents = {
    images: [
      {
        filename: 'AppClipCard.png',
        idiom: 'universal',
        scale: '1x',
      },
    ],
    info: {
      author: 'xcode',
      version: 1,
    },
  };
  const path = resolve(TARGET_DIR, 'Contents.json');
  writeFileSync(path, JSON.stringify(contents, null, 2) + '\n');
  console.log(`  OK  Contents.json (image set)`);
}

async function writeParentContents(): Promise<void> {
  const parent = resolve(ROOT, 'ios/App/HangelAppClip/Assets.xcassets');
  mkdirSync(parent, { recursive: true });
  const path = resolve(parent, 'Contents.json');
  const contents = { info: { author: 'xcode', version: 1 } };
  writeFileSync(path, JSON.stringify(contents, null, 2) + '\n');
  console.log(`  OK  Assets.xcassets/Contents.json`);
}

async function main(): Promise<void> {
  console.log('App Clip Card generator — Hangel brand');
  console.log(`Source icon: ${SOURCE_ICON}`);
  console.log(`Target: ${TARGET_DIR}\n`);

  await writeParentContents();
  await renderCard();
  await writeContentsJson();

  console.log('\nApp Clip Card hazır.');
  console.log("Apple App Store Connect → App Clip → Default Experience → Header Image olarak yükle.");
}

main().catch((err: unknown) => {
  console.error('FAIL:', err);
  process.exit(1);
});
