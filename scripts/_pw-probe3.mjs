import { chromium } from 'playwright';
const UA='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const b = await chromium.launch({ headless: true });
const ctx = await b.newContext({ userAgent: UA, locale:'tr-TR', viewport:{width:1280,height:900} });
const p = await ctx.newPage();
await p.goto('https://www.flormar.com.tr/', { waitUntil:'domcontentloaded', timeout:60000 });
for (let i=0;i<40;i++){ if(!/Human Verification/i.test(await p.title())) break; await p.waitForTimeout(500); }
console.log('home title:', await p.title());
// try in-page client navigation via link click if any, else direct goto
const url='https://www.flormar.com.tr/quick-dry-hizli-kuruyan-ince-yapili-parlak-bitisli-oje-bordo-8682536036672/';
await p.goto(url,{waitUntil:'networkidle',timeout:60000}).catch(e=>console.log('goto err',e.message));
for (let i=0;i<60;i++){ const t=await p.title(); if(!/Human Verification/i.test(t)) break; await p.waitForTimeout(500); }
console.log('product title:', await p.title());
const ld = await p.$$eval('script[type="application/ld+json"]', els=>els.map(e=>e.textContent)).catch(()=>[]);
console.log('ld blocks',ld.length, 'hasProduct', ld.some(x=>/"@type"\s*:\s*"Product"/.test(x)));
await b.close();
