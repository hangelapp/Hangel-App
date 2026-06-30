import { execFileSync } from 'node:child_process';

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36';
const PATHS = ['', '/iletisim', '/iletisim.html', '/contact', '/iletisim.php', '/kunye', '/hakkimizda', '/iletisim/', '/index.php?page=iletisim', '/contact-us', '/bize-ulasin'];

const JUNK_SUBSTR = ['sentry.io','wixpress.com','wix.com','example.com','example.org','godaddy','sentry','your-email','your@','email@','name@','domain.com','schema.org','w3.org','googleapis','gstatic','cloudflare','.png','.jpg','.jpeg','.gif','.svg','.webp','.css','.js','jquery','bootstrap','fontawesome','wordpress.org','placeholder','test@test','info@info','@2x','@example','sentry-next','core-js','.json','@gmail.co.','@hotmail.co.'];

function fetchUrl(url) {
  try {
    return execFileSync('/usr/bin/curl', ['-sL','--max-time','22','--compressed','-A',UA,url], { maxBuffer: 1024*1024*20, encoding: 'latin1' });
  } catch (e) {
    try { return (e.stdout || '').toString(); } catch { return ''; }
  }
}

function extractEmails(html) {
  if (!html) return [];
  const found = new Set();
  // mailto
  const mailto = html.match(/mailto:[^"'>\s)]+/gi) || [];
  for (let m of mailto) { m = m.replace(/^mailto:/i,'').split('?')[0]; found.add(m); }
  // plain text
  const plain = html.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g) || [];
  for (const m of plain) found.add(m);
  // obfuscated " [at] "
  const obf = html.match(/[A-Za-z0-9._%+-]+\s*\[?\(?\s*(?:at|@)\s*\)?\]?\s*[A-Za-z0-9.-]+\s*\[?\(?\s*(?:dot|nokta|\.)\s*\)?\]?\s*[A-Za-z]{2,}/gi) || [];
  for (let m of obf) {
    const norm = m.replace(/\s*\[?\(?\s*(?:at)\s*\)?\]?\s*/i,'@').replace(/\s*\[?\(?\s*(?:dot|nokta)\s*\)?\]?\s*/ig,'.').replace(/\s+/g,'');
    if (/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(norm)) found.add(norm);
  }
  const clean = [];
  for (let e of found) {
    e = e.trim().replace(/[.,;:)]+$/,'').toLowerCase();
    if (!/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(e)) continue;
    if (e.length > 60) continue;
    const low = e.toLowerCase();
    if (JUNK_SUBSTR.some(j => low.includes(j))) continue;
    // TLD sanity
    const tld = low.split('.').pop();
    if (tld.length < 2 || tld.length > 6) continue;
    if (!clean.includes(e)) clean.push(e);
  }
  return clean;
}

const targets = JSON.parse(process.argv[2]);
const results = [];
for (const t of targets) {
  const tried = [];
  const allMails = new Set();
  let anyOk = false;
  // normalize base
  let raw = t.web.trim();
  let base = raw;
  if (!/^https?:\/\//i.test(base)) base = 'https://' + base;
  base = base.replace(/[#?].*$/,'').replace(/\/+$/,'');
  for (const p of PATHS) {
    const url = base + p;
    const html = fetchUrl(url);
    if (html && html.length > 50) anyOk = true;
    const ms = extractEmails(html);
    tried.push(`${p||'/'}:${html ? html.length : 0}b:${ms.length}m`);
    for (const m of ms) allMails.add(m);
    if (allMails.size >= 6) break;
  }
  // also try without www
  if (allMails.size === 0) {
    const noWww = base.replace(/^https?:\/\/www\./i, 'https://');
    if (noWww !== base) {
      const html = fetchUrl(noWww);
      if (html && html.length > 50) anyOk = true;
      for (const m of extractEmails(html)) allMails.add(m);
    }
  }
  results.push({ kutukNo: t.kutukNo, name: t.name, web: t.web, emails: [...allMails], anyOk, tried });
}
console.log(JSON.stringify(results, null, 2));
