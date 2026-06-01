/**
 * Playwright ile Apple Developer + App Store Connect session setup.
 *
 * Çalıştır: npx tsx scripts/automation/apple-session-setup.ts
 *
 * İlk seferinde browser açılır, kullanıcı Apple ID + 2FA ile giriş yapar.
 * Cookie + localStorage `~/.playwright-apple-profile/` dizininde tutulur.
 * Sonraki tüm Apple Console / App Store Connect otomasyonları aynı
 * profile'ı kullanır, ekstra login gerekmez.
 *
 * 2FA cookie ömrü Apple'da ~30 gün. Süre dolarsa tekrar bu scripti
 * çalıştır.
 */
import { chromium } from 'playwright';
import { existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

const PROFILE_DIR = join(homedir(), '.playwright-apple-profile');

async function main() {
  const isNewProfile = !existsSync(PROFILE_DIR);
  console.log(`[apple-session] Profile: ${PROFILE_DIR}`);
  console.log(`[apple-session] ${isNewProfile ? 'YENİ profile — ilk login.' : 'Mevcut profile — session test ediliyor.'}`);

  const context = await chromium.launchPersistentContext(PROFILE_DIR, {
    headless: false,
    viewport: { width: 1440, height: 900 },
    args: ['--disable-blink-features=AutomationControlled'],
  });

  const page = context.pages()[0] || (await context.newPage());

  console.log('\n[apple-session] Apple Developer Console açılıyor...');
  await page.goto('https://developer.apple.com/account/resources/identifiers/list');

  console.log('\n=================================================================');
  console.log('Browser açıldı. Şimdi yapman gerekenler:');
  console.log('  1. Apple ID + parola gir');
  console.log('  2. 2FA kodunu telefonundan onayla (Trust This Browser ☑️)');
  console.log('  3. Identifiers sayfasına ulaştığında listede com.hangel.ios.app');
  console.log('     görülmeli. Görülüyorsa giriş başarılı.');
  console.log('  4. Bu terminalde Enter\'a bas → cookie kaydedilip kapanacak.');
  console.log('=================================================================\n');

  // Wait for user to press Enter in terminal
  await new Promise<void>((resolve) => {
    process.stdin.once('data', () => resolve());
  });

  console.log('[apple-session] Cookie kaydedildi. Browser kapanıyor...');
  await context.close();

  console.log('\n✅ Hazır. Bundan sonra Claude headless mod ile Apple Console işlemlerini yapabilir.');
  console.log(`   Profile dizini: ${PROFILE_DIR}`);
  process.exit(0);
}

main().catch((e) => {
  console.error('[apple-session] HATA:', e);
  process.exit(1);
});
