/**
 * Hangel custom alert sounds generator.
 *
 * Apple Push Notification için CAF formatında ses dosyaları üretir. Her
 * acil tipi için ayrı, brand-recognition + tonal anlam taşıyan ton:
 *
 *   - hangel-blood.caf      → Kan emergency (Glass.aiff)
 *   - hangel-disaster.caf   → Afet uyarısı (Sosumi.aiff, daha urgent)
 *   - hangel-volunteer.caf  → Gönüllülük daveti (Tink.aiff, sakin)
 *   - hangel-event.caf      → Etkinlik hatırlatıcı (Pop.aiff, nötr)
 *   - hangel-alert.caf      → Generic fallback (Glass.aiff = hangel-blood ile aynı)
 *
 * APNs custom sound requirements:
 *   - CAF (CoreAudio Format), linear PCM 16-bit, 44.1 kHz
 *   - App bundle içinde yer alır (Resources phase)
 *   - 30 saniye altında (Apple kuralı)
 *
 * Çalıştır:
 *   npx tsx scripts/automation/generate-alert-sounds.ts
 *
 * Sonra her .caf için xcodeproj'a ekle:
 *   ruby scripts/automation/xcodeproj-add-resource.rb hangel-blood.caf
 *   ruby scripts/automation/xcodeproj-add-resource.rb hangel-disaster.caf
 *   ruby scripts/automation/xcodeproj-add-resource.rb hangel-volunteer.caf
 *   ruby scripts/automation/xcodeproj-add-resource.rb hangel-event.caf
 */
import { execFileSync } from 'child_process';
import { resolve } from 'path';
import { existsSync, statSync } from 'fs';

const APP_DIR = resolve(process.cwd(), 'ios/App/App');

interface SoundSpec {
  output: string; // .caf filename in ios/App/App/
  source: string; // /System/Library/Sounds/*.aiff
  purpose: string;
}

const sounds: SoundSpec[] = [
  { output: 'hangel-blood.caf',     source: '/System/Library/Sounds/Glass.aiff',   purpose: 'Kan emergency (mevcut tonun yeniden adlandırılması)' },
  { output: 'hangel-disaster.caf',  source: '/System/Library/Sounds/Sosumi.aiff',  purpose: 'Afet uyarısı (daha urgent)' },
  { output: 'hangel-volunteer.caf', source: '/System/Library/Sounds/Tink.aiff',    purpose: 'Gönüllülük etkinlik daveti (sakin)' },
  { output: 'hangel-event.caf',     source: '/System/Library/Sounds/Pop.aiff',     purpose: 'Etkinlik hatırlatıcı' },
  { output: 'hangel-alert.caf',     source: '/System/Library/Sounds/Glass.aiff',   purpose: 'Generic fallback (kan ile aynı ton)' },
];

let written = 0;
let skipped = 0;
const errors: string[] = [];

for (const s of sounds) {
  const outPath = resolve(APP_DIR, s.output);
  if (!existsSync(s.source)) {
    errors.push(`SKIP ${s.output}: kaynak ${s.source} bulunamadı (macOS değil mi?)`);
    skipped++;
    continue;
  }
  try {
    execFileSync('afconvert', [
      s.source,
      outPath,
      '-f', 'caff',
      '-d', 'LEI16@44100',
    ], { stdio: 'pipe' });
    const sz = statSync(outPath).size;
    console.log(`  OK  ${s.output}  (${sz} bytes)  ← ${s.source.split('/').pop()}  // ${s.purpose}`);
    written++;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    errors.push(`FAIL ${s.output}: ${msg}`);
  }
}

console.log(`\n${written} CAF yazıldı, ${skipped} atlandı, ${errors.length} hata.`);
if (errors.length) {
  for (const e of errors) console.error(`  ${e}`);
  process.exit(1);
}

console.log('\nSonraki adım — her CAF dosyasını xcodeproj Resources phase\'e ekle:');
console.log('  ruby scripts/automation/xcodeproj-add-resource.rb hangel-blood.caf');
console.log('  ruby scripts/automation/xcodeproj-add-resource.rb hangel-disaster.caf');
console.log('  ruby scripts/automation/xcodeproj-add-resource.rb hangel-volunteer.caf');
console.log('  ruby scripts/automation/xcodeproj-add-resource.rb hangel-event.caf');
