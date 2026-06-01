/**
 * Session verify scripti — login durumunu kontrol eder, identifiers
 * sayfasına gidip screenshot alır.
 */
import { chromium } from 'playwright';
import { homedir } from 'os';
import { join } from 'path';

const PROFILE_DIR = join(homedir(), '.playwright-apple-profile');

async function main() {
  const context = await chromium.launchPersistentContext(PROFILE_DIR, {
    headless: false,
    viewport: { width: 1440, height: 900 },
    args: ['--disable-blink-features=AutomationControlled'],
  });
  const page = await context.newPage();
  await page.goto('https://developer.apple.com/account/resources/identifiers/list', {
    waitUntil: 'domcontentloaded',
    timeout: 30000,
  });
  await page.waitForTimeout(3000);

  const url = page.url();
  const title = await page.title();
  console.log(`URL: ${url}`);
  console.log(`Title: ${title}`);

  const loggedIn = url.includes('/account/') && !url.includes('idmsa.apple.com');
  console.log(`Logged in: ${loggedIn ? 'YES ✅' : 'NO ❌'}`);

  await page.screenshot({ path: '/tmp/apple-session-test.png', fullPage: false });
  console.log('Screenshot: /tmp/apple-session-test.png');

  if (loggedIn) {
    // Check if we can see app identifiers
    const identifiers = await page.locator('text=com.hangel').count();
    console.log(`com.hangel identifier'ı görünür: ${identifiers > 0 ? 'YES ✅' : 'NO ❌'}`);
  }

  await context.close();
  process.exit(loggedIn ? 0 : 1);
}

main().catch((e) => {
  console.error('HATA:', e);
  process.exit(1);
});
