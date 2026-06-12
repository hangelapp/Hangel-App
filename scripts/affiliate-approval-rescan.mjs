/**
 * HasOffers Affiliate_Offer.findAll + fields[]=approval_status taraması.
 * Tüm offer'ları (status filter'sız) sayfa sayfa çeker, blocklist'te olan
 * (pending/rejected diye işaretlenen) offer'ların güncel approval_status'ünü
 * raporlar. approved'a dönenler blocklist'ten çıkarılır.
 *
 * Usage: node scripts/affiliate-approval-rescan.mjs
 */

const NETWORKS = {
  reklamaction: {
    apiKey: '2ae3a9b86708162dc059e78b6a8de2b4dee5444d13bb985b93340bdb6094bb54',
    affiliateId: '35329',
    pending: {
      '580':   'Modanisa Kuponlu Takip',
      '12437': 'Beymen',
      '61440': 'Tatildekirala.com',
      '62180': 'I Find Location CPL',
      '62356': 'Idefix Android-Ios',
      '62369': 'Portfun TR',
      '62372': 'Chat Fun TR',
      '62374': 'Flo Influencer Install+Satis',
      '62412': 'Modanisa JO+GCC+UAE-SA',
    },
  },
  affocean: {
    apiKey: 'c908bda5f41405de7cbcb40a15db041e47a2fcc55358e8f44790db8ff2cfb35d',
    affiliateId: '7873',
    pending: {
      '2720': 'Bilişim - HR [CPC]',
      '2723': 'Bitcointr [CPC] - PN',
    },
  },
  gelirortaklari: {
    apiKey: '891bae449589572cc756b5fe93e182c527ef910c2137c7e1ea53a0a366ab9cd3',
    affiliateId: '37081',
    pending: {
      '6782': "Carter's",
      '6899': 'Getir Büyük',
      '6895': 'Getir',
      '6779': 'Gratis',
      '5754': 'idefix',
      '6908': 'Karaca Core',
      '6918': 'Karaca Influencer',
      '2020': 'Mavi',
      '6673': 'Mavi Influencer',
      '6776': 'MinyCenter',
      '6920': 'Pazarama',
      '6646': 'Samsung [CPS]',
      '6894': 'Tatilbudur',
      '6605': 'Tchibo',
      '6743': 'Vitaminler',
      '6909': 'Yalıspor',
    },
  },
};

async function fetchAllWithApproval(network, apiKey) {
  const base = `https://${network}.api.hasoffers.com/Apiv3/json`;
  const all = {};
  let page = 1;
  while (true) {
    const params = new URLSearchParams({
      Target: 'Affiliate_Offer',
      Method: 'findAll',
      api_key: apiKey,
      'fields[]': 'id',
      'fields[1]': 'name',
      'fields[2]': 'approval_status',
      'fields[3]': 'status',
      limit: '500',
      page: String(page),
    });
    const res = await fetch(`${base}?${params.toString()}`);
    if (!res.ok) {
      console.error(`[${network}] HTTP ${res.status}`);
      break;
    }
    const json = await res.json();
    if (json?.response?.status !== 1) {
      console.error(`[${network}] API err:`, json?.response?.errors || json?.response?.errorMessage);
      break;
    }
    const data = json?.response?.data?.data;
    if (!data || typeof data !== 'object') break;
    const entries = Object.values(data);
    if (entries.length === 0) break;
    for (const e of entries) {
      const o = e?.Offer;
      if (o?.id) all[String(o.id)] = { name: o.name, approval_status: o.approval_status, status: o.status };
    }
    if (entries.length < 500) break;
    page += 1;
  }
  return all;
}

async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  Affiliate Approval Re-Scan — ' + new Date().toISOString().slice(0, 10));
  console.log('═══════════════════════════════════════════════════════\n');

  const newlyApproved = { reklamaction: [], affocean: [], gelirortaklari: [] };
  const stillPending = { reklamaction: [], affocean: [], gelirortaklari: [] };
  const stillRejected = { reklamaction: [], affocean: [], gelirortaklari: [] };

  for (const [network, cfg] of Object.entries(NETWORKS)) {
    console.log(`▸ ${network} (aff: ${cfg.affiliateId}) — full scan...`);
    const all = await fetchAllWithApproval(network, cfg.apiKey);
    console.log(`  ${Object.keys(all).length} toplam offer döndü.`);
    for (const [id, label] of Object.entries(cfg.pending)) {
      const o = all[id];
      if (!o) {
        console.log(`  ❓ ${id.padEnd(6)} ${label.padEnd(30)} → API'de görünmüyor (silinmiş olabilir)`);
        continue;
      }
      const a = o.approval_status || '(null)';
      const s = o.status || '(null)';
      const icon = a === 'approved' ? '✅' : a === 'rejected' ? '❌' : '🟡';
      console.log(`  ${icon} ${id.padEnd(6)} ${label.padEnd(30)} approval=${a}, status=${s}`);
      if (a === 'approved') newlyApproved[network].push({ id, label });
      else if (a === 'rejected') stillRejected[network].push({ id, label });
      else stillPending[network].push({ id, label });
    }
    console.log('');
  }

  console.log('═══════════════════════════════════════════════════════');
  console.log('  ÖZET');
  console.log('═══════════════════════════════════════════════════════');
  let total = 0;
  for (const net of Object.keys(NETWORKS)) {
    const n = newlyApproved[net].length;
    total += n;
    if (n > 0) {
      console.log(`\n  ${net} — ${n} yeni onay 🎉`);
      newlyApproved[net].forEach((b) => console.log(`    ✅ ${b.id} — ${b.label}`));
    }
  }
  if (total === 0) console.log('\n  Yeni onay yok. Hepsi pending/rejected.');
  console.log(`\n  Toplam yeni onay: ${total}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
