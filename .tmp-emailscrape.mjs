import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const pexec = promisify(execFile);

const INPUT = JSON.parse(process.env.DERNEK_JSON);

const JUNK_SUBSTR = [
  'sentry.io', 'wixpress.com', 'wix.com', 'example.com', 'example.org',
  'godaddy', 'sentry', 'your-email', 'your@', 'email@example', 'name@',
  'domain.com', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico',
  'schema.org', 'w3.org', 'googleapis', 'gstatic', 'cloudflare',
  'sentry-next', 'wordpress.org', 'jquery', 'bootstrap', 'fontawesome',
  'placeholder', 'test@test', 'info@domain', 'mail@mail', 'u003e', 'u003c',
  '.css', '.js', '@2x', 'core-js', '@example', 'react', 'webpack', 'cdn.',
];

function isJunk(e) {
  const l = e.toLowerCase();
  if (JUNK_SUBSTR.some((s) => l.includes(s))) return true;
  if (!/@[a-z0-9.-]+\.[a-z]{2,}$/i.test(e)) return true;
  if (e.split('@')[0].length > 40) return true;
  if (/^[a-f0-9]{16,}@/i.test(e)) return true;
  const tld = l.split('.').pop();
  if (tld.length < 2 || tld.length > 6) return true;
  return false;
}

function normalizeEmail(e) {
  return e.replace(/^mailto:/i, '').split('?')[0].trim().replace(/[.,;:)]+$/, '').toLowerCase();
}

function extractEmails(html) {
  if (!html) return [];
  const found = new Set();
  for (const m of html.matchAll(/mailto:([^"'>\s]+)/gi)) {
    const e = normalizeEmail(m[1]);
    if (e.includes('@')) found.add(e);
  }
  for (const m of html.matchAll(/[A-Za-z0-9._%+\-çğıöşüÇĞİÖŞÜ]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}/g)) {
    found.add(normalizeEmail(m[0]));
  }
  // cloudflare email-protection decode
  for (const m of html.matchAll(/data-cfemail="([a-f0-9]+)"/gi)) {
    try {
      const hex = m[1];
      const key = parseInt(hex.substr(0, 2), 16);
      let s = '';
      for (let i = 2; i < hex.length; i += 2) s += String.fromCharCode(parseInt(hex.substr(i, 2), 16) ^ key);
      if (s.includes('@')) found.add(normalizeEmail(s));
    } catch {}
  }
  // obfuscated [at] [dot]
  for (const m of html.matchAll(/[A-Za-z0-9._%+\-]+\s*\[?\(?\s*(?:at)\s*\)?\]?\s*[A-Za-z0-9.\-]+\s*\[?\(?\s*(?:dot|nokta)\s*\)?\]?\s*[A-Za-z]{2,}/gi)) {
    const norm = m[0].replace(/\s*\[?\(?\s*at\s*\)?\]?\s*/i, '@').replace(/\s*\[?\(?\s*(?:dot|nokta)\s*\)?\]?\s*/ig, '.').replace(/\s+/g, '');
    if (/^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$/.test(norm)) found.add(norm.toLowerCase());
  }
  return [...found].filter((e) => e.includes('@') && !isJunk(e));
}

function buildCandidates(rawWeb) {
  const w0 = rawWeb.trim();
  // value is itself an email
  if (/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(w0) && !w0.includes('/')) {
    return { directEmail: w0.toLowerCase() };
  }
  // date / nonsense
  if (/^\d{1,2}[.\/]\d{1,2}[.\/]\d{2,4}$/.test(w0) || w0.length < 4) {
    return { invalid: true };
  }
  let base = w0;
  if (!/^https?:\/\//i.test(base)) base = 'https://' + base;
  let host, path = '';
  try {
    const u = new URL(base);
    host = u.host;
    path = u.pathname.replace(/\/$/, '');
  } catch {
    return { invalid: true };
  }
  const isFb = /facebook\.com|instagram\.com|twitter\.com|x\.com/i.test(host);
  const origin = `https://${host}`;
  const noWww = host.replace(/^www\./i, '');
  const urls = [];
  urls.push(`${origin}${path}`);
  if (host.startsWith('www.')) urls.push(`https://${noWww}${path}`);
  else urls.push(`https://www.${host}${path}`);
  if (!isFb) {
    for (const sub of ['/iletisim', '/iletisim.html', '/contact', '/iletisim.php', '/kunye', '/hakkimizda', '/iletisim-bilgileri', '/bize-ulasin', '/iletisim/']) {
      urls.push(`${origin}${sub}`);
    }
  }
  return { urls: [...new Set(urls)], isFb };
}

async function curlGet(url) {
  try {
    const { stdout } = await pexec('curl', [
      '-sL', '--max-time', '20', '--compressed',
      '-A', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16 Safari/605.1.15',
      url,
    ], { maxBuffer: 1024 * 1024 * 12, encoding: 'utf8' });
    return stdout || '';
  } catch (e) {
    return (e.stdout && String(e.stdout)) || '';
  }
}

async function processOne(d) {
  const cand = buildCandidates(d.web);
  if (cand.invalid) {
    return { kutukNo: d.kutukNo, name: d.name, web: d.web, emails: [], note: 'geçersiz url' };
  }
  if (cand.directEmail) {
    const ok = !isJunk(cand.directEmail);
    return { kutukNo: d.kutukNo, name: d.name, web: d.web, emails: ok ? [cand.directEmail] : [], note: ok ? 'web alanı zaten e-posta' : 'geçersiz url' };
  }
  const all = new Set();
  let anyResponse = false;
  for (const url of cand.urls) {
    const html = await curlGet(url);
    if (html && html.length > 80) anyResponse = true;
    for (const e of extractEmails(html)) all.add(e);
    if (all.size >= 8) break;
  }
  const emails = [...all];
  let note;
  if (emails.length) note = `bulundu ${emails.length} mail`;
  else if (!anyResponse) note = 'site açılmadı';
  else note = 'mailto yok';
  return { kutukNo: d.kutukNo, name: d.name, web: d.web, emails, note };
}

const results = [];
const CONC = 6;
for (let i = 0; i < INPUT.length; i += CONC) {
  const batch = INPUT.slice(i, i + CONC);
  const r = await Promise.all(batch.map(processOne));
  results.push(...r);
  process.stderr.write(`done ${Math.min(i + CONC, INPUT.length)}/${INPUT.length}\n`);
}
console.log(JSON.stringify(results, null, 1));
