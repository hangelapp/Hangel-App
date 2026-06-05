/**
 * scripts/ra-discover-urls.ts — ReklamAction'da login sonrası
 * menüdeki tüm offer/teklif link'lerini DOM'dan çıkar.
 */
import { chromium } from 'playwright';

const EMAIL = process.env.REKLAMACTION_EMAIL || '';
const PASS = process.env.REKLAMACTION_PASS || '';
const BASE = 'https://my.reklamaction.com';

async function main() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  try {
    await page.goto(BASE + '/', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    // Consent bypass
    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => {
        document.querySelectorAll<HTMLInputElement>('input[type="checkbox"]').forEach(cb => {
          cb.checked = true;
          cb.dispatchEvent(new Event('change', { bubbles: true }));
        });
        const btn = Array.from(document.querySelectorAll<HTMLElement>('button,a,input'))
          .find(b => /continue|devam|kabul|accept/i.test((b.textContent || (b as HTMLInputElement).value || '')));
        btn?.click();
      });
      await page.waitForTimeout(2000);
    }
    // Login
    await page.locator('input[type="email"], input:not([type]):not([readonly])').first().fill(EMAIL);
    await page.locator('input[type="password"]').first().fill(PASS);
    await page.locator('button:has-text("Giriş"), button[type="submit"]').first().click({ force: true });
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    console.log('post-login:', page.url());
    // Tüm link'leri çek (özellikle offer/teklif içerenler)
    const links = await page.evaluate(() => {
      return Array.from(document.querySelectorAll<HTMLAnchorElement>('a[href]'))
        .map(a => ({ href: a.href, text: (a.textContent || '').trim().slice(0, 60) }))
        .filter(l => l.href && !l.href.endsWith('#') && (
          /offer|teklif|browse|find|live|canli|all/i.test(l.href) ||
          /offer|teklif|göz|canlı|browse/i.test(l.text)
        ));
    });
    const uniq = Array.from(new Map(links.map(l => [l.href, l])).values());
    console.log(`\n${uniq.length} offer/teklif link bulundu:`);
    uniq.forEach(l => console.log(`  ${l.href}  |  ${l.text}`));
  } finally {
    await ctx.close();
    await browser.close();
  }
}

main().catch(e => { console.error(e); process.exit(1); });
