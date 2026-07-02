const { chromium } = require('@playwright/test');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
(async () => {
  let ok = false, tries = 0;
  while (!ok && tries < 14) {
    tries++;
    await sleep(120000);
    const b = await chromium.launch();
    const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 });
    try {
      await p.goto('https://hangel.org/market/discover', { waitUntil: 'domcontentloaded', timeout: 45000 });
      await p.waitForTimeout(9000);
      const m = await p.evaluate(() => {
        const banner = document.querySelector('[class*="snap-start"]');
        const cls = banner ? (''+banner.className) : '';
        // 92e1c566 markeri: banner w-[90vw] (eski w-[92%])
        return { newBanner: /90vw/.test(cls), bannerCls: cls.slice(0,50) };
      });
      if (m.newBanner) { ok = true; console.log('DEPLOY_LIVE 92e1c566 (banner w-90vw) | ' + JSON.stringify(m)); }
      else console.log('try ' + tries + ': henüz eski banner (' + m.bannerCls + ')');
    } catch(e) { console.log('try ' + tries + ': ' + e.message); }
    await b.close();
  }
  if (!ok) console.log('TIMEOUT');
})();
