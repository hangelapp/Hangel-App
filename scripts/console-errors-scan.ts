/**
 * scripts/console-errors-scan.ts
 *
 * hangel.org canlı sayfalarda console error/warning topla.
 * Public sayfaları (login gerektirmeyen) tarar, runtime hatalarını listeler.
 */
import { chromium, type ConsoleMessage } from 'playwright';

interface Issue {
  page: string;
  type: 'error' | 'warning' | 'pageerror';
  message: string;
  location?: string;
}

const PAGES = [
  'https://hangel.org/',
  'https://hangel.org/about',
  'https://hangel.org/app',
  'https://hangel.org/social-impact',
  'https://hangel.org/association/about',
  'https://hangel.org/press',
  'https://hangel.org/login/selection',
  'https://hangel.org/brand/qr',
];

// Bilinen yarar/zararsız uyarılar — filtrelenir, raporu kirletmesin
const IGNORE_PATTERNS = [
  /Download the React DevTools/,
  /react_devtools/,
  /\[Fast Refresh\]/,
  /chunk-/,
  /webpack-internal/,
  /favicon\.ico/,
  /apple-touch-icon/,
  /\.map$/,                          // sourcemap missing
  /preload/,
  /InvalidValueError.*ngo/,          // bazı NGO doc'larda eksik field, app handle ediyor
];

function shouldIgnore(msg: string): boolean {
  return IGNORE_PATTERNS.some((p) => p.test(msg));
}

async function scanPage(url: string): Promise<Issue[]> {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Safari/605.1.15',
  });
  const page = await ctx.newPage();
  const issues: Issue[] = [];

  page.on('console', (msg: ConsoleMessage) => {
    const type = msg.type();
    if (type !== 'error' && type !== 'warning') return;
    const text = msg.text();
    if (shouldIgnore(text)) return;
    issues.push({
      page: url,
      type: type as 'error' | 'warning',
      message: text.slice(0, 300),
      location: msg.location() ? `${msg.location().url}:${msg.location().lineNumber}` : undefined,
    });
  });

  page.on('pageerror', (err) => {
    if (shouldIgnore(err.message)) return;
    issues.push({
      page: url,
      type: 'pageerror',
      message: err.message.slice(0, 300),
    });
  });

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(6000);
  } catch (e) {
    issues.push({
      page: url,
      type: 'pageerror',
      message: `Navigation failed: ${e instanceof Error ? e.message.slice(0, 200) : String(e)}`,
    });
  } finally {
    await ctx.close();
    await browser.close();
  }
  return issues;
}

async function main() {
  console.log('[scan] ' + PAGES.length + ' sayfa taranıyor...\n');
  const all: Issue[] = [];
  for (const url of PAGES) {
    const path = new URL(url).pathname || '/';
    process.stdout.write(`  ${path.padEnd(30)} `);
    const issues = await scanPage(url);
    all.push(...issues);
    const errs = issues.filter((i) => i.type === 'error' || i.type === 'pageerror').length;
    const warns = issues.filter((i) => i.type === 'warning').length;
    console.log(`${errs ? '🔴 ' + errs + ' err' : '✅'} ${warns ? '🟡 ' + warns + ' warn' : ''}`);
  }
  if (all.length === 0) {
    console.log('\n✅ Hiçbir konsol hatası yok!');
    return;
  }
  console.log('\n═══ DETAY ═══');
  for (const url of PAGES) {
    const pageIssues = all.filter((i) => i.page === url);
    if (pageIssues.length === 0) continue;
    console.log(`\n📄 ${url}`);
    for (const i of pageIssues) {
      const icon = i.type === 'pageerror' ? '💥' : i.type === 'error' ? '🔴' : '🟡';
      console.log(`  ${icon} ${i.message}`);
      if (i.location) console.log(`      @ ${i.location.slice(0, 100)}`);
    }
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
