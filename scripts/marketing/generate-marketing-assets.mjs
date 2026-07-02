/**
 * hangel Tanıtım Araçları — başlangıç paketi üretici.
 *
 * Playwright (headless Chromium) ile hangel markalı tasarımları PNG/PDF olarak
 * public/marketing-kit/ altına render eder. Süper-admin panelindeki "Başlangıç
 * Paketi" butonu bu dosyaları taslak materyal olarak içe aktarır.
 *
 * Çalıştır:  node scripts/marketing/generate-marketing-assets.mjs
 *
 * Marka: coral #f34723, lowercase "hangel", turuncu kalp. (namaste/🙏 kullanılmaz.)
 */
import { chromium } from 'playwright';
import QRCode from 'qrcode';
import fs from 'node:fs';
import path from 'node:path';

const OUT = path.join(process.cwd(), 'public', 'marketing-kit');
fs.mkdirSync(OUT, { recursive: true });

// Resmi hangel renk kartelası (/logo-usage):
const CORAL = '#f34723';      // hangel Mercan
const CORAL2 = '#c5391b';     // koyu koral (gradient ucu — keynote standardı)
const INK = '#1f1f1f';        // Gece Siyahı
const LIGHT = '#f1f1f1';      // Açık Gri
const NAVY = '#042654';       // Lacivert

const SITE = 'https://hangel.org';
const qr = await QRCode.toDataURL(SITE, { margin: 1, width: 640, color: { dark: '#1f1f1f', light: '#ffffff' } });
const qrLight = await QRCode.toDataURL(SITE, { margin: 1, width: 640, color: { dark: '#ffffff', light: '#00000000' } });

const FONT = `-apple-system,'SF Pro Display','Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif`;
const base = `
  *{margin:0;padding:0;box-sizing:border-box;font-family:${FONT};-webkit-print-color-adjust:exact;print-color-adjust:exact}
  body{color:${INK}}
  .wm{font-weight:900;letter-spacing:-.04em}
  .coral{color:${CORAL}}
`;

function page(width, height, body, extraCss = '') {
  return `<!doctype html><html><head><meta charset="utf-8"><style>${base}
    html,body{width:${width}px;height:${height}px}
    ${extraCss}</style></head><body>${body}</body></html>`;
}

const browser = await chromium.launch();

async function renderPNG(html, width, height, file) {
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 2 });
  const p = await ctx.newPage();
  await p.setContent(html, { waitUntil: 'networkidle' });
  await p.screenshot({ path: path.join(OUT, file), clip: { x: 0, y: 0, width, height } });
  await ctx.close();
  console.log('PNG ', file);
}

async function renderPDF(html, file, opts) {
  const ctx = await browser.newContext();
  const p = await ctx.newPage();
  await p.setContent(html, { waitUntil: 'networkidle' });
  await p.pdf({ path: path.join(OUT, file), printBackground: true, ...opts });
  await ctx.close();
  console.log('PDF ', file);
}

/* ───────────────────────── Reusable blocks ───────────────────────── */
const heart = (size, color = '#fff') =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${color}"><path d="M12 21s-7.5-4.7-10-9.3C.4 8.4 1.9 5 5.2 5c2 0 3.3 1.2 4 2.3C9.9 6.2 11.2 5 13.2 5 16.5 5 18 8.4 16.4 11.7 13.9 16.3 12 21 12 21z"/></svg>`;

/* ───────────────────────── 1) Kurumsal Sunum (PDF 16:9) ───────────── */
const slideCss = `
  @page{size:1280px 720px;margin:0}
  .slide{width:1280px;height:720px;position:relative;overflow:hidden;page-break-after:always;padding:96px}
  .slide:last-child{page-break-after:auto}
  .eyebrow{font-size:22px;font-weight:800;letter-spacing:.22em;text-transform:uppercase}
  .grad{background:linear-gradient(135deg,${CORAL} 0%,${CORAL2} 100%);color:#fff}
  .h1{font-size:104px;font-weight:900;letter-spacing:-.05em;line-height:.95}
  .h2{font-size:64px;font-weight:900;letter-spacing:-.04em;line-height:1}
  .lead{font-size:34px;font-weight:500;line-height:1.4;color:#444}
  .cardrow{display:flex;gap:28px;margin-top:56px}
  .card{flex:1;border:2px solid #eee;border-radius:28px;padding:36px}
  .card h3{font-size:34px;font-weight:800;margin-bottom:10px}
  .card p{font-size:22px;color:#555;line-height:1.35}
  .num{display:inline-flex;align-items:center;justify-content:center;width:64px;height:64px;border-radius:50%;background:${CORAL};color:#fff;font-size:32px;font-weight:900;margin-bottom:18px}
  .foot{position:absolute;left:96px;bottom:64px;font-size:24px;color:#999;font-weight:700}
  .pill{display:inline-flex;align-items:center;gap:10px;background:rgba(255,255,255,.22);padding:12px 22px;border-radius:999px;font-size:22px;font-weight:800}
`;
const presSlides = `
  <div class="slide grad" style="display:flex;flex-direction:column;justify-content:center">
    <div class="pill" style="align-self:flex-start;margin-bottom:34px">${heart(24)} Kurumsal Tanıtım</div>
    <div class="wm" style="font-size:150px;font-weight:900">hangel</div>
    <div class="h2" style="margin-top:8px;font-weight:800">İyiliğe açılan kapı.</div>
    <div style="font-size:30px;margin-top:26px;opacity:.92;max-width:760px">Bağışçıyı, STK’ları, markaları ve gönüllüleri tek bir sürdürülebilir iyilik ekosisteminde buluşturan dijital platform.</div>
    <div class="foot" style="color:rgba(255,255,255,.85)">hangel.org</div>
  </div>
  <div class="slide">
    <div class="eyebrow coral">hangel nedir?</div>
    <div class="h2" style="margin-top:20px;max-width:1000px">Tek bağışa değil; <span class="coral">çeşitlendirilmiş, sürdürülebilir</span> kaynaklara dayanan bir iyilik altyapısı.</div>
    <div class="lead" style="margin-top:34px;max-width:980px">STK’lar için bağış, kurumsal iş birliği, alışverişle bağış ve gönüllülük yönetimini; markalar için sosyal etki ve görünürlüğü tek panelde toplar.</div>
    <div class="foot">hangel.org</div>
  </div>
  <div class="slide">
    <div class="eyebrow coral">Nasıl çalışır?</div>
    <div class="cardrow" style="margin-top:40px">
      <div class="card"><div class="num">1</div><h3>Keşfet</h3><p>Destekçiler STK, kampanya ve etkinlikleri keşfeder.</p></div>
      <div class="card"><div class="num">2</div><h3>Destekle</h3><p>Bağış, gönüllülük veya alışverişle iyiliğe katkı sağlar.</p></div>
      <div class="card"><div class="num">3</div><h3>Etkini gör</h3><p>Şeffaf raporlarla yarattığı etkiyi anlık takip eder.</p></div>
    </div>
    <div class="foot">hangel.org</div>
  </div>
  <div class="slide">
    <div class="eyebrow coral">Kimler için?</div>
    <div class="cardrow" style="margin-top:40px">
      <div class="card"><h3>STK’lar</h3><p>Sürdürülebilir gelir, gönüllü ve şeffaflık yönetimi.</p></div>
      <div class="card"><h3>Markalar</h3><p>Sosyal sorumluluk, alışverişle bağış ve görünürlük.</p></div>
      <div class="card"><h3>Kulüpler</h3><p>Topluluk, etkinlik ve üye etkileşimi.</p></div>
    </div>
    <div class="foot">hangel.org</div>
  </div>
  <div class="slide grad" style="display:flex;flex-direction:column;justify-content:center;align-items:flex-start">
    <div class="pill" style="margin-bottom:30px">${heart(24)} hadi tanışalım</div>
    <div class="h1">İyilik<br>herkesin hakkı.</div>
    <div style="font-size:34px;margin-top:30px;font-weight:700">hangel.org</div>
  </div>
`;
await renderPDF(page(1280, 720, presSlides, slideCss), 'hangel-kurumsal-sunum.pdf', { width: '1280px', height: '720px' });
// Kapak thumbnail
await renderPNG(page(1280, 720, presSlides.split('<div class="slide"').slice(0, 1).join(''), slideCss), 1280, 720, 'hangel-kurumsal-sunum-kapak.png');

/* ───────────────────────── 2) 15 Günlük Sosyal Medya Takvimi (PDF A4) ── */
const days = [
  ['Tanışma', '“Merhaba, biz hangel.” Platformu ve misyonu tanıtan açılış gönderisi.', '#hangel #iyilik'],
  ['Sorun', 'Tek kaynağa bağımlı STK’ların sürdürülebilirlik sorunu.', '#sürdürülebilirlik #STK'],
  ['Çözüm', 'Çeşitlendirilmiş gelir modeli nasıl kurulur?', '#gelirmodeli'],
  ['Nasıl çalışır', '3 adım: Keşfet → Destekle → Etkini gör.', '#nasılçalışır'],
  ['Alışverişle bağış', 'Her alışveriş bir iyiliğe dönüşüyor.', '#alışverişlebağış'],
  ['Gönüllülük', 'Gönüllülüğünü hangel ile yönet.', '#gönüllülük'],
  ['Marka iş birliği', 'Markalar için sosyal etki fırsatı.', '#KSS #sosyaletki'],
  ['Şeffaflık', 'Şeffaflık endeksi ile güven kazan.', '#şeffaflık'],
  ['Başarı hikâyesi', 'Bir STK’nın hangel ile dönüşümü.', '#etki'],
  ['Etkinlik', 'Yaklaşan etkinlik / konferans duyurusu.', '#etkinlik'],
  ['Kulüpler', 'Öğrenci kulüpleri için topluluk araçları.', '#kulüp'],
  ['İstatistik', 'Rakamlarla yaratılan etki.', '#etkiraporu'],
  ['Bağışçı', 'Düzenli bağışçı olmanın gücü.', '#bağış'],
  ['Davet', '“Sen de katıl.” QR ile hızlı kayıt çağrısı.', '#katıl'],
  ['Teşekkür', 'Topluluğa teşekkür + haftanın özeti.', '#teşekkür'],
];
const calRows = days.map((d, i) => `
  <tr>
    <td class="d">${i + 1}</td>
    <td class="t">${d[0]}</td>
    <td>${d[1]}</td>
    <td class="h">${d[2]}</td>
  </tr>`).join('');
const calendar = `
  <div style="padding:64px 56px">
    <div style="display:flex;align-items:center;gap:14px;margin-bottom:8px">
      <span class="wm coral" style="font-size:40px">hangel</span>
      <span style="font-size:20px;font-weight:800;color:#aaa;letter-spacing:.18em;text-transform:uppercase">Sosyal Medya</span>
    </div>
    <h1 style="font-size:46px;font-weight:900;letter-spacing:-.03em">15 Günlük İçerik Takvimi</h1>
    <p style="font-size:18px;color:#666;margin:10px 0 30px">STK, marka ve kulüpler için hazır gönderi planı. Metinleri kurumunuza göre uyarlayın.</p>
    <table style="width:100%;border-collapse:collapse;font-size:16px">
      <thead><tr style="background:${CORAL};color:#fff;text-align:left">
        <th style="padding:12px 14px;width:46px">Gün</th><th style="padding:12px 14px;width:150px">Konu</th><th style="padding:12px 14px">Örnek metin</th><th style="padding:12px 14px;width:170px">Hashtag</th>
      </tr></thead>
      <tbody>${calRows}</tbody>
    </table>
  </div>
  <style>
    td{padding:11px 14px;border-bottom:1px solid #eee;vertical-align:top;line-height:1.35;color:#333}
    td.d{font-weight:900;color:${CORAL};text-align:center}
    td.t{font-weight:800;color:${INK}}
    td.h{color:#888;font-weight:600}
    tbody tr:nth-child(even){background:#faf7f6}
  </style>`;
await renderPDF(page(794, 1123, calendar), 'sosyal-medya-takvimi-15gun.pdf', { format: 'A4', margin: { top: '0', bottom: '0', left: '0', right: '0' } });
await renderPNG(page(794, 1123, calendar), 794, 1123, 'sosyal-medya-takvimi-15gun-kapak.png');

/* ───────────────────────── 3) Sosyal medya postları (1080×1080) ───── */
// theme: 'coral' (Mercan gradient) | 'light' (Açık Gri) | 'navy' (Lacivert) — kartela.
const posts = [
  { f: 'sosyal-post-1.png', big: 'her alışveriş\nbir iyilik', sub: 'hangel ile destekçilerin günlük alışverişi düzenli bağışa dönüşür.', theme: 'coral' },
  { f: 'sosyal-post-2.png', big: 'STK’na\nsürdürülebilir\ngelir', sub: 'Tek kaynağa bağımlılıktan kurtul, gelirini çeşitlendir.', theme: 'light' },
  { f: 'sosyal-post-3.png', big: 'gönüllülüğünü\nhangel’le\nyönet', sub: 'Başvuru, görev ve sertifikayı tek panelden takip et.', theme: 'coral' },
  { f: 'sosyal-post-4.png', big: 'iyilik\nherkesin\nhakkı', sub: 'Sen de bu topluluğun parçası ol.', theme: 'navy' },
];
for (const post of posts) {
  const lines = post.big.split('\n');
  let body;
  if (post.theme === 'coral') {
    const bigHtml = lines.map((l) => `<div>${l}</div>`).join('');
    body = `<div style="width:1080px;height:1080px;background:linear-gradient(150deg,${CORAL} 0%,${CORAL2} 100%);color:#fff;padding:96px;display:flex;flex-direction:column;justify-content:space-between">
         <div style="display:flex;justify-content:space-between;align-items:center"><span class="wm" style="font-size:54px">hangel</span>${heart(56)}</div>
         <div style="font-size:118px;font-weight:900;letter-spacing:-.05em;line-height:.92">${bigHtml}</div>
         <div style="font-size:34px;font-weight:500;line-height:1.35;opacity:.95">${post.sub}<div style="margin-top:22px;font-weight:800;opacity:1">hangel.org</div></div>
       </div>`;
  } else if (post.theme === 'light') {
    const bigHtml = lines.map((l) => `<div style="border-left:12px solid ${CORAL};padding-left:30px">${l}</div>`).join('');
    body = `<div style="width:1080px;height:1080px;background:${LIGHT};color:${INK};padding:96px;display:flex;flex-direction:column;justify-content:space-between">
         <div style="display:flex;justify-content:space-between;align-items:center"><span class="wm coral" style="font-size:54px">hangel</span>${heart(56, CORAL)}</div>
         <div style="font-size:116px;font-weight:900;letter-spacing:-.05em;line-height:.96;display:flex;flex-direction:column;gap:18px">${bigHtml}</div>
         <div style="font-size:34px;font-weight:500;line-height:1.35;color:${INK}">${post.sub}<div style="margin-top:22px;font-weight:800;color:${CORAL}">hangel.org</div></div>
       </div>`;
  } else { // navy
    const bigHtml = lines.map((l) => `<div>${l}</div>`).join('');
    body = `<div style="width:1080px;height:1080px;background:${NAVY};color:#fff;padding:96px;display:flex;flex-direction:column;justify-content:space-between">
         <div style="display:flex;justify-content:space-between;align-items:center"><span class="wm" style="font-size:54px">hangel</span>${heart(56, CORAL)}</div>
         <div style="font-size:118px;font-weight:900;letter-spacing:-.05em;line-height:.92">${bigHtml.replace(/<div>(.*?)<\/div>/, `<div><span style="color:${CORAL}">$1</span></div>`)}</div>
         <div style="font-size:34px;font-weight:500;line-height:1.35;opacity:.92">${post.sub}<div style="margin-top:22px;font-weight:800;color:${CORAL}">hangel.org</div></div>
       </div>`;
  }
  await renderPNG(page(1080, 1080, body), 1080, 1080, post.f);
}

/* ───────────────────────── 4) Döner kart / masa standı (591×886) ──── */
const donerKart = `
  <div style="width:591px;height:886px;background:#fff;padding:48px;display:flex;flex-direction:column;align-items:center;text-align:center;border:14px solid ${CORAL}">
    <span class="wm coral" style="font-size:64px;margin-top:8px">hangel</span>
    <div style="margin:22px 0 4px">${heart(48, CORAL)}</div>
    <div style="font-size:40px;font-weight:900;letter-spacing:-.03em;line-height:1.05;margin-top:8px">Bu işletme<br>iyilik için<br>hangel’de</div>
    <p style="font-size:21px;color:#555;margin-top:18px;line-height:1.4">Alışverişin bir STK’ya destek olsun. QR’ı okut, hangel’e katıl.</p>
    <img src="${qr}" style="width:300px;height:300px;margin-top:26px"/>
    <div style="font-size:24px;font-weight:800;color:${CORAL};margin-top:14px">hangel.org</div>
  </div>`;
await renderPNG(page(591, 886, donerKart), 591, 886, 'doner-kart.png');

/* ───────────────────────── 5) Mağaza içi poster (A4 1240×1754) ────── */
const poster = `
  <div style="width:1240px;height:1754px;background:linear-gradient(160deg,${CORAL},${CORAL2});color:#fff;padding:110px 96px;display:flex;flex-direction:column">
    <div style="display:flex;justify-content:space-between;align-items:center"><span class="wm" style="font-size:90px">hangel</span>${heart(96)}</div>
    <div style="font-size:130px;font-weight:900;letter-spacing:-.05em;line-height:.95;margin-top:90px">Alışverişin<br>iyiliğe<br>dönüşsün.</div>
    <p style="font-size:42px;font-weight:500;margin-top:50px;line-height:1.4;max-width:900px;opacity:.96">Bu işletmeden yaptığın alışverişle bir sivil toplum kuruluşuna destek olabilirsin.</p>
    <div style="margin-top:auto;display:flex;align-items:center;gap:44px;background:#fff;color:${INK};border-radius:36px;padding:44px 50px">
      <img src="${qr}" style="width:280px;height:280px"/>
      <div><div style="font-size:48px;font-weight:900;letter-spacing:-.02em">QR’ı okut, katıl</div><div style="font-size:36px;font-weight:800;color:${CORAL};margin-top:10px">hangel.org</div></div>
    </div>
  </div>`;
await renderPNG(page(1240, 1754, poster), 1240, 1754, 'magaza-poster.png');

/* ───────────────────────── 6) Kasa önü A5 kart (874×1240) ─────────── */
const kasaA5 = `
  <div style="width:874px;height:1240px;background:#fff;padding:72px;display:flex;flex-direction:column;text-align:center;align-items:center">
    <span class="wm coral" style="font-size:76px">hangel</span>
    <div style="font-size:58px;font-weight:900;letter-spacing:-.03em;line-height:1.04;margin-top:34px">Kasada<br>iyilik yap</div>
    <p style="font-size:27px;color:#555;margin-top:22px;line-height:1.45;max-width:640px">Alışverişini tamamlarken hangel ile bir STK’ya destek olabilirsin. QR’ı okut, saniyeler içinde katıl.</p>
    <div style="background:${CORAL};border-radius:40px;padding:40px;margin-top:40px">
      <img src="${qrLight}" style="width:380px;height:380px;display:block"/>
    </div>
    <div style="font-size:30px;font-weight:800;color:${CORAL};margin-top:34px">hangel.org</div>
    <div style="margin-top:14px">${heart(40, CORAL)}</div>
  </div>`;
await renderPNG(page(874, 1240, kasaA5), 874, 1240, 'kasa-a5.png');

/* ───────────────────────── 7) Örümcek stand / roll-up (1000×2353) ── */
const standBullet = (t) => `<div style="display:flex;align-items:center;gap:22px;font-size:46px;font-weight:700">${heart(40)}<span>${t}</span></div>`;
const stand = `
  <div style="width:1000px;height:2353px;background:linear-gradient(180deg,${CORAL} 0%,${CORAL2} 100%);color:#fff;padding:130px 90px;display:flex;flex-direction:column">
    <div style="text-align:center"><span class="wm" style="font-size:130px">hangel</span></div>
    <div style="text-align:center;margin-top:10px;font-size:42px;font-weight:700;opacity:.95">İyiliğe açılan kapı</div>
    <div style="font-size:150px;font-weight:900;letter-spacing:-.05em;line-height:.92;margin-top:150px;text-align:center">İyilik<br>herkesin<br>hakkı.</div>
    <div style="display:flex;flex-direction:column;gap:40px;margin-top:170px;align-items:flex-start">
      ${standBullet('Bağışını çeşitlendir')}
      ${standBullet('Gönüllülüğünü yönet')}
      ${standBullet('Etkini şeffafça gör')}
    </div>
    <div style="margin-top:auto;display:flex;flex-direction:column;align-items:center;gap:26px">
      <div style="background:#fff;border-radius:40px;padding:40px"><img src="${qr}" style="width:360px;height:360px;display:block"/></div>
      <div style="font-size:48px;font-weight:900">hangel.org</div>
    </div>
  </div>`;
await renderPNG(page(1000, 2353, stand), 1000, 2353, 'orumcek-stand.png');

await browser.close();
console.log('\n✓ Tüm materyaller public/marketing-kit/ altına üretildi.');
