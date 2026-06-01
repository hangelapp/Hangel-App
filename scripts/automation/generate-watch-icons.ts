/**
 * Apple Watch AppIcon generator — Hangel brand.
 *
 * watchOS AppIcon için Hangel logo'sundan (src/app/apple-icon.png) macOS
 * built-in `sips` ile 5 farklı boyutta PNG üretir. Kapı boyutları (Apple
 * watchOS Human Interface Guidelines):
 *   - 40×40  (Series 3/4/5/6/7/8/9 38mm/40mm)
 *   - 41×41  (Series 7/8/9 41mm)
 *   - 44×44  (Series 4-9 44mm)
 *   - 45×45  (Series 7-9 45mm)
 *   - 49×49  (Apple Watch Ultra 49mm)
 *
 * Çalıştır:
 *   npx tsx scripts/automation/generate-watch-icons.ts
 *
 * Çıktı: ios/App/HangelWatch/Assets.xcassets/AppIcon.appiconset/AppIcon-{40,41,44,45,49}.png
 * Contents.json zaten bu dosyada yerinde — script sadece PNG'leri üretir.
 *
 * Bağımlılık: macOS sips (built-in). Linux/CI'de çalışmaz.
 */
import { execFileSync } from 'child_process';
import { mkdirSync, readFileSync } from 'fs';
import { resolve } from 'path';

const ROOT = process.cwd();
const SOURCE = resolve(ROOT, 'src/app/apple-icon.png');
const TARGET_DIR = resolve(ROOT, 'ios/App/HangelWatch/Assets.xcassets/AppIcon.appiconset');

mkdirSync(TARGET_DIR, { recursive: true });

const SIZES: ReadonlyArray<number> = [40, 41, 44, 45, 49];

function resize(size: number): void {
  const outName = `AppIcon-${size}.png`;
  const outPath = resolve(TARGET_DIR, outName);
  execFileSync('sips', [
    '-z', String(size), String(size),
    SOURCE,
    '--out', outPath,
  ], { stdio: ['ignore', 'ignore', 'pipe'] });
  const sz = readFileSync(outPath).length;
  console.log(`  OK  ${outName} (${size}×${size}, ${sz} bytes)`);
}

function main(): void {
  console.log(`Apple Watch icon generator — Hangel logo`);
  console.log(`Source: ${SOURCE}`);
  console.log(`Target: ${TARGET_DIR}\n`);
  for (const s of SIZES) resize(s);
  console.log(`\n${SIZES.length} watchOS AppIcon yazıldı.`);
}

main();
