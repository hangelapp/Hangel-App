import { chromium } from 'playwright';
const UA='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const b = await chromium.launch({ headless: true });
const ctx = await b.newContext({ userAgent: UA, locale:'tr-TR', viewport:{width:1280,height:900} });
const p = await ctx.newPage();
console.log('goto home...');
await p.goto('https://www.flormar.com.tr/', { waitUntil:'domcontentloaded', timeout:60000 });
// wait for challenge to resolve (title changes away from Human Verification)
for (let i=0;i<30;i++){
  const t = await p.title();
  if (!/Human Verification/i.test(t)) { console.log('passed, title=',t); break; }
  await p.waitForTimeout(1000);
}
const cookies = await ctx.cookies();
const wafC = cookies.find(c=>c.name==='aws-waf-token');
console.log('aws-waf-token present:', !!wafC, wafC? wafC.value.slice(0,20)+'...':'');
console.log('all cookie names:', cookies.map(c=>c.name).join(','));
// now try a product page via same context (fetch inside browser)
const url='https://www.flormar.com.tr/pearly-yari-transparan-parlak-bitisli-sedefli-oje-kahverengi-8682536104357/';
const html = await (await ctx.request.get(url)).text();
console.log('product html len', html.length, 'blocked?', /Human Verification/i.test(html));
await b.close();
