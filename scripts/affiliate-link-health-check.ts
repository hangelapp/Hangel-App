/**
 * scripts/affiliate-link-health-check.ts
 *
 * 3 affiliate network'ten (ReklamAction, Affocean, GelirOrtakları) tüm 200+
 * markayı çek + her affiliate tracking URL'ini test et + broken olanları raporla.
 *
 * Usage:
 *   cd /Users/macbookair/new-app
 *   npx tsx scripts/affiliate-link-health-check.ts
 *
 * Output:
 *   /tmp/affiliate-health-report.json — tam rapor
 *   Terminal: özet tablo (sağlam vs broken vs şüpheli)
 *
 * Test mantığı:
 *   - GET request (followRedirect: false) → ilk status'a bak
 *   - 200/301/302/303/307/308 → OK (final destination markaya gidiyor)
 *   - 404/410 → BROKEN (link expired veya yanlış)
 *   - 5xx → SERVER_ERROR (network sorunu — şüpheli)
 *   - timeout → TIMEOUT (network sorunu)
 *   - Final URL'e tam follow → marka domain'i match ediyor mu? (yanlış marka redirect kontrolü)
 */
import fs from 'node:fs';
import { fetchAllAgencyOffers } from '../src/lib/api-clients';
import type { Brand } from '../src/lib/types';

interface LinkCheck {
  brandId?: string;
  brandName: string;
  network?: string;
  link: string;
  initialStatus: number | null;
  finalUrl: string | null;
  finalStatus: number | null;
  redirectChainLength: number;
  brandDomainMatch: boolean | null;
  result: 'OK' | 'BROKEN' | 'SERVER_ERROR' | 'TIMEOUT' | 'NO_LINK' | 'WRONG_REDIRECT' | 'UNKNOWN';
  notes?: string;
  durationMs: number;
}

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Safari/605.1.15';
const TIMEOUT_MS = 15000;
const CONCURRENCY = 8;

function getDomain(url: string): string {
  try { return new URL(url).hostname.toLowerCase().replace(/^www\./, ''); }
  catch { return ''; }
}

function brandNameToDomainHint(name: string): string {
  return name.toLowerCase()
    .replace(/[ıİ]/g, 'i').replace(/[şŞ]/g, 's').replace(/[ğĞ]/g, 'g')
    .replace(/[üÜ]/g, 'u').replace(/[öÖ]/g, 'o').replace(/[çÇ]/g, 'c')
    .replace(/[^a-z0-9]/g, '');
}

async function checkOne(brand: Brand): Promise<LinkCheck> {
  const start = Date.now();
  const link = brand.link || '';
  const base: LinkCheck = {
    brandId: brand.id,
    brandName: brand.name,
    network: (brand as Brand & { network?: string }).network,
    link,
    initialStatus: null,
    finalUrl: null,
    finalStatus: null,
    redirectChainLength: 0,
    brandDomainMatch: null,
    result: 'UNKNOWN',
    durationMs: 0,
  };

  if (!link) {
    return { ...base, result: 'NO_LINK', notes: 'Tracking link boş', durationMs: Date.now() - start };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    // İlk request — redirect yapma, ilk status'u gör
    const initial = await fetch(link, {
      method: 'GET',
      redirect: 'manual',
      headers: { 'User-Agent': UA, 'Accept': 'text/html,application/xhtml+xml' },
      signal: controller.signal,
    });
    base.initialStatus = initial.status;

    // Full follow — final URL + status'u öğren
    let final: Response;
    try {
      final = await fetch(link, {
        method: 'GET',
        redirect: 'follow',
        headers: { 'User-Agent': UA, 'Accept': 'text/html,application/xhtml+xml' },
        signal: controller.signal,
      });
      base.finalUrl = final.url;
      base.finalStatus = final.status;
    } catch {
      base.finalUrl = null;
      base.finalStatus = null;
    }

    // Redirect zinciri uzunluğu (heuristic)
    base.redirectChainLength = (initial.status >= 300 && initial.status < 400) ? 1 : 0;
    if (base.finalUrl && base.finalUrl !== link) base.redirectChainLength = Math.max(1, base.redirectChainLength);

    // Brand domain match — final URL'in domain'i brand adı ile eşleşiyor mu?
    if (base.finalUrl) {
      const finalDomain = getDomain(base.finalUrl);
      const hint = brandNameToDomainHint(brand.name);
      base.brandDomainMatch = finalDomain.includes(hint.substring(0, Math.min(hint.length, 6)))
        || hint.includes(finalDomain.split('.')[0]);
    }

    // Sonuç sınıflandır
    if (base.initialStatus === 404 || base.initialStatus === 410) {
      base.result = 'BROKEN';
      base.notes = `İlk istek ${base.initialStatus} — link expired/silinmiş`;
    } else if (base.finalStatus === 404 || base.finalStatus === 410) {
      base.result = 'BROKEN';
      base.notes = `Final ${base.finalStatus} — redirect zinciri 404'e düşüyor`;
    } else if (base.finalStatus && base.finalStatus >= 500) {
      base.result = 'SERVER_ERROR';
      base.notes = `Final ${base.finalStatus} — sunucu hatası`;
    } else if (!base.finalUrl) {
      base.result = 'UNKNOWN';
      base.notes = 'Final URL alınamadı (network/CORS)';
    } else if (base.brandDomainMatch === false) {
      base.result = 'WRONG_REDIRECT';
      base.notes = `Final domain "${getDomain(base.finalUrl)}" brand adı "${brand.name}" ile eşleşmiyor`;
    } else {
      base.result = 'OK';
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('abort') || msg.includes('timeout')) {
      base.result = 'TIMEOUT';
      base.notes = `${TIMEOUT_MS}ms zaman aşımı`;
    } else {
      base.result = 'UNKNOWN';
      base.notes = msg.slice(0, 200);
    }
  } finally {
    clearTimeout(timer);
    base.durationMs = Date.now() - start;
  }

  return base;
}

// Concurrency-limited map
async function mapConcurrent<T, R>(items: T[], limit: number, fn: (item: T, i: number) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let idx = 0;
  async function worker() {
    while (true) {
      const my = idx++;
      if (my >= items.length) return;
      try { out[my] = await fn(items[my], my); }
      catch (e) { out[my] = { error: String(e) } as unknown as R; }
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()));
  return out;
}

async function main() {
  console.log('[health-check] 3 affiliate network\'ten tüm brand offer\'ları çekiliyor...');
  const t0 = Date.now();
  const brands = await fetchAllAgencyOffers();
  console.log(`[health-check] ${brands.length} brand çekildi (${Math.round((Date.now()-t0)/1000)}s).`);

  if (brands.length === 0) {
    console.error('Hiç brand çekilemedi — network credentials hatalı olabilir.');
    process.exit(1);
  }

  console.log(`[health-check] Her brand\'in tracking link\'i test ediliyor (concurrency=${CONCURRENCY})...`);
  const t1 = Date.now();
  const results = await mapConcurrent(brands, CONCURRENCY, (b, i) => {
    if (i % 20 === 0 && i > 0) console.log(`  ilerleme: ${i}/${brands.length}`);
    return checkOne(b);
  });
  console.log(`[health-check] Tüm linkler test edildi (${Math.round((Date.now()-t1)/1000)}s).`);

  // Özet
  const summary = results.reduce((acc, r) => {
    acc[r.result] = (acc[r.result] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  console.log('\n=== ÖZET ===');
  for (const [k, v] of Object.entries(summary).sort((a, b) => b[1] - a[1])) {
    const pct = ((v / results.length) * 100).toFixed(1);
    console.log(`  ${k.padEnd(20)} : ${String(v).padStart(4)} (${pct}%)`);
  }

  // Broken / Wrong / Server / Timeout / No-link olanları detayda yaz
  const problemTypes = ['BROKEN', 'WRONG_REDIRECT', 'SERVER_ERROR', 'TIMEOUT', 'NO_LINK', 'UNKNOWN'];
  for (const t of problemTypes) {
    const list = results.filter(r => r.result === t);
    if (list.length === 0) continue;
    console.log(`\n--- ${t} (${list.length} brand) ---`);
    for (const r of list.slice(0, 30)) {
      console.log(`  · [${r.network || '?'}] ${r.brandName}  → ${r.notes || ''}`);
      if (r.link) console.log(`      link: ${r.link.slice(0, 100)}${r.link.length > 100 ? '...' : ''}`);
      if (r.finalUrl) console.log(`      final: ${r.finalUrl.slice(0, 100)}`);
    }
    if (list.length > 30) console.log(`  … (${list.length - 30} daha — tam liste JSON'da)`);
  }

  fs.writeFileSync('/tmp/affiliate-health-report.json', JSON.stringify({
    generatedAt: new Date().toISOString(),
    summary,
    totalBrands: results.length,
    results,
  }, null, 2));

  console.log('\n[health-check] Tam rapor: /tmp/affiliate-health-report.json');
  process.exit(0);
}

main().catch(err => {
  console.error('[health-check] Hata:', err);
  process.exit(1);
});
