/**
 * Affocean (Rüya) tam katalog çekimi.
 * status filtresiz TÜM offer'ları çeker; approval_status / status / require_approval
 * alanlarıyla listelenebilirlik kuralını uygular ve tam döküm verir.
 *
 * Usage: node scripts/affocean-pull.mjs
 */

const CFG = {
  network: 'affocean',
  apiKey: 'c908bda5f41405de7cbcb40a15db041e47a2fcc55358e8f44790db8ff2cfb35d',
  affiliateId: '7873',
};

// api-clients.ts isListableOffer ile birebir aynı kural
function isListable(o) {
  if (String(o.status ?? '').toLowerCase() !== 'active') return false;
  const approved = String(o.approval_status ?? '').toLowerCase() === 'approved';
  const open = String(o.require_approval ?? '1') === '0';
  return approved || open;
}

async function fetchAll() {
  const base = `https://${CFG.network}.api.hasoffers.com/Apiv3/json`;
  const all = [];
  let page = 1;
  while (true) {
    const params = new URLSearchParams({
      Target: 'Affiliate_Offer',
      Method: 'findAll',
      api_key: CFG.apiKey,
      'fields[]': 'id',
      'fields[1]': 'name',
      'fields[2]': 'approval_status',
      'fields[3]': 'status',
      'fields[4]': 'require_approval',
      'fields[5]': 'payout_type',
      'fields[6]': 'percent_payout',
      limit: '500',
      page: String(page),
    });
    const res = await fetch(`${base}?${params.toString()}`, { headers: { Accept: 'application/json' } });
    if (!res.ok) { console.error(`HTTP ${res.status} ${res.statusText}`); break; }
    const json = await res.json();
    if (json?.response?.status !== 1) {
      console.error('API err:', json?.response?.errors || json?.response?.errorMessage);
      break;
    }
    const data = json?.response?.data?.data;
    if (!data || typeof data !== 'object') break;
    const entries = Object.values(data);
    if (entries.length === 0) break;
    for (const e of entries) {
      const o = e?.Offer;
      if (o?.id) all.push(o);
    }
    if (entries.length < 500) break;
    page += 1;
  }
  return all;
}

const icon = (o) => {
  const a = String(o.approval_status ?? '').toLowerCase();
  if (a === 'approved') return '✅';
  if (a === 'rejected') return '❌';
  return '🟡';
};

async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  AFFOCEAN (Rüya) — tam katalog çekimi ' + new Date().toISOString().slice(0, 16).replace('T', ' '));
  console.log('  aff_id: ' + CFG.affiliateId);
  console.log('═══════════════════════════════════════════════════════\n');

  const all = await fetchAll();
  console.log(`Toplam offer: ${all.length}\n`);

  const listable = all.filter(isListable);
  const activeApproved = all.filter(o => String(o.status).toLowerCase() === 'active' && String(o.approval_status).toLowerCase() === 'approved');
  const pending = all.filter(o => String(o.status).toLowerCase() === 'active' && !['approved', 'rejected'].includes(String(o.approval_status).toLowerCase()));
  const rejected = all.filter(o => String(o.approval_status).toLowerCase() === 'rejected');

  console.log('── DURUM DAĞILIMI (status=active offer\'lar) ──');
  console.log(`  ✅ onaylı (approved)     : ${activeApproved.length}`);
  console.log(`  🟡 onay bekliyor/null    : ${pending.length}`);
  console.log(`  ❌ reddedilmiş           : ${rejected.length}`);
  console.log(`  ➡️  LİSTELENEBİLİR (site) : ${listable.length}  (approved + require_approval=0)\n`);

  console.log('── LİSTELENEBİLİR MARKALAR ──');
  listable
    .sort((a, b) => String(a.name).localeCompare(String(b.name), 'tr'))
    .forEach(o => {
      const rate = o.payout_type === 'cpa_percentage' ? `${o.percent_payout}%` : (o.payout_type || '');
      console.log(`  ✅ ${String(o.id).padEnd(6)} ${String(o.name).padEnd(42)} ${rate}`);
    });

  if (pending.length) {
    console.log('\n── HÂLÂ ONAY BEKLEYEN (active ama approved değil) ──');
    pending
      .sort((a, b) => String(a.name).localeCompare(String(b.name), 'tr'))
      .forEach(o => console.log(`  ${icon(o)} ${String(o.id).padEnd(6)} ${String(o.name).padEnd(42)} approval=${o.approval_status ?? '(null)'} require_approval=${o.require_approval ?? '?'}`));
  }
}

main().catch(e => { console.error(e); process.exit(1); });
