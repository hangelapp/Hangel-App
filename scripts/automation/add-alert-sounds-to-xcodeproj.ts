/**
 * Bütün Hangel alert .caf dosyalarını ios/App/App.xcodeproj Resources
 * build phase'e ekler. xcodeproj-add-resource.rb script'ini her dosya için
 * çağırır (idempotent — varsa atlar).
 *
 * Çalıştır:
 *   npx tsx scripts/automation/add-alert-sounds-to-xcodeproj.ts
 *
 * Sonra: ios/ klasörünü Xcode'da yeniden açıp build edin — yeni .caf'ler
 * otomatik app bundle'a paketlenecek.
 */
import { execFileSync } from 'child_process';
import { resolve } from 'path';

const SCRIPT = resolve(process.cwd(), 'scripts/automation/xcodeproj-add-resource.rb');

const cafFiles = [
  'hangel-alert.caf',     // generic fallback
  'hangel-blood.caf',     // kan emergency
  'hangel-disaster.caf',  // afet
  'hangel-volunteer.caf', // gönüllülük
  'hangel-event.caf',     // etkinlik
];

let added = 0;
let already = 0;
const errors: string[] = [];

for (const f of cafFiles) {
  try {
    const out = execFileSync('ruby', [SCRIPT, f], { encoding: 'utf-8' });
    process.stdout.write(out);
    if (out.includes('zaten')) already++;
    else added++;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    errors.push(`${f}: ${msg}`);
  }
}

console.log(`\n${added} yeni eklendi, ${already} zaten vardı, ${errors.length} hata.`);
if (errors.length) {
  for (const e of errors) console.error(`  ${e}`);
  process.exit(1);
}
