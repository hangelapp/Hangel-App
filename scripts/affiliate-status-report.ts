/**
 * Final affiliate status report — blocklist sonrası gerçek aktif marka sayıları
 */
import { fetchAllAgencyOffers } from '../src/lib/api-clients';

async function main() {
  console.log('[report] fetchAllAgencyOffers çalıştırılıyor (canlı API)...\n');
  const brands = await fetchAllAgencyOffers();

  const byAgency: Record<string, any[]> = {};
  for (const b of brands) {
    const a = b.agency || 'Unknown';
    (byAgency[a] = byAgency[a] || []).push(b);
  }

  console.log('═══════════════════════════════════════════════════════');
  console.log('  hangel — Affiliate Marka Durum Raporu (post-blocklist)');
  console.log('═══════════════════════════════════════════════════════\n');

  let total = 0;
  for (const [agency, list] of Object.entries(byAgency)) {
    console.log(`  ${agency.padEnd(20)} → ${list.length} aktif marka`);
    total += list.length;
  }
  console.log(`  ${'─'.repeat(40)}`);
  console.log(`  ${'TOPLAM (dedupe sonrası)'.padEnd(20)} → ${total} aktif marka kullanıcıya gösteriliyor\n`);

  // Health check raporu (eski) ile karşılaştır
  console.log('  Karşılaştırma: blocklist öncesi 193 → şimdi', total);
  console.log('  Filtrelenen (denied/broken): ', 193 - total);
}

main().catch(e => { console.error(e); process.exit(1); });
