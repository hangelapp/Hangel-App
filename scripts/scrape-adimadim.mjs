// Final scraper - uses Sucuri cookie bypass + direct AJAX endpoint
import fs from 'node:fs';
import { JSDOM } from 'jsdom';

const URL_BASE = 'https://ipk.adimadim.org';
const URL_LIST = `${URL_BASE}/stklar`;
const URL_ENDPOINT = `${URL_BASE}/nonprofit/display-nonprofits?active=0`;
const OUT = '/tmp/scrape-adimadim.json';

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

function log(...a) { console.log('[final]', new Date().toISOString().slice(11, 19), ...a); }

// Step 1: GET the challenge page, decode JS, compute the Sucuri cookie.
async function solveSucuri() {
  log('GET challenge page');
  const res = await fetch(URL_LIST, {
    headers: { 'User-Agent': UA, 'Accept': 'text/html,application/xhtml+xml' },
    redirect: 'follow',
  });
  const body = await res.text();
  if (res.status === 200 && body.includes('nonprofit') === false && body.length > 5000) {
    // Maybe already passed - but we still need a cookie next time; bail out.
  }
  // Challenge body contains a base64 blob S='...' whose decoded JS:
  //   d=<concatenation> ; document.cookie='<concatenation>=' + d + ';path=/;max-age=86400'; location.reload();
  const sMatch = body.match(/S\s*=\s*'([A-Za-z0-9+/=]+)'/);
  if (!sMatch) {
    throw new Error('No Sucuri challenge S= blob — body=' + body.slice(0, 300));
  }
  const decoded = Buffer.from(sMatch[1], 'base64').toString('utf8');
  // Run in a fake `document` sandbox to capture the assigned cookie.
  let captured = null;
  const fakeDocument = {
    set cookie(v) { captured = v; },
    get cookie() { return ''; },
  };
  const fakeLocation = { reload() { /* noop */ } };
  // eslint-disable-next-line no-new-func
  const runner = new Function('document', 'location', decoded);
  runner(fakeDocument, fakeLocation);
  if (!captured) throw new Error('Sucuri challenge eval did not set cookie');
  // captured like: "sucuri_cloudproxy_uuid_xxx=hexvalue;path=/;max-age=86400"
  const cookieKV = captured.split(';')[0].trim();
  log('Sucuri cookie:', cookieKV);
  return cookieKV;
}

async function fetchListing(cookie) {
  log('GET nonprofits endpoint with cookie');
  const res = await fetch(URL_ENDPOINT, {
    headers: {
      'User-Agent': UA,
      'Cookie': cookie,
      'X-Requested-With': 'XMLHttpRequest',
      'Referer': URL_LIST,
      'Accept': 'text/html, */*; q=0.01',
    },
  });
  const html = await res.text();
  log('status', res.status, 'bytes', html.length);
  if (res.status !== 200) throw new Error('Endpoint returned ' + res.status);
  return html;
}

function parseItems(html) {
  const dom = new JSDOM(html);
  const doc = dom.window.document;
  const out = [];
  const seen = new Set();
  // Each STK is `.nonprofit-box`; name is `.nonprofit-box-title a`, profile href has ?id=
  doc.querySelectorAll('.nonprofit-box').forEach((box) => {
    const titleAnchor = box.querySelector('.nonprofit-box-title a');
    if (!titleAnchor) return;
    const name = titleAnchor.textContent.trim();
    if (!name || seen.has(name)) return;
    seen.add(name);
    const profileHref = titleAnchor.getAttribute('href') || '';
    const profileUrl = profileHref.startsWith('http') ? profileHref : URL_BASE + profileHref;
    out.push({ name, profileUrl });
  });
  return out;
}

(async () => {
  try {
    const cookie = await solveSucuri();
    const html = await fetchListing(cookie);
    const items = parseItems(html);
    log('parsed items:', items.length);
    if (items.length === 0) {
      throw new Error('No items parsed from response');
    }
    const result = {
      source: URL_LIST,
      scrapedAt: new Date().toISOString(),
      method: 'sucuri-cookie-solve+xhr-endpoint+jsdom',
      items,
    };
    fs.writeFileSync(OUT, JSON.stringify(result, null, 2));
    log('WROTE', OUT, 'count=', items.length, 'sample=', items.slice(0, 3).map((i) => i.name));
  } catch (e) {
    log('ERROR', e.stack || e.message);
    process.exit(2);
  }
})();
