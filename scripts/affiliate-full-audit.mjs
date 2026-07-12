/**
 * Tüm 3 affiliate ajanstan gelen TÜM offer'ları approval_status'e göre gruplar
 * ve iki liste üretir: ONAYLI (hangel için canlı) + ONAYSIZ (pending/rejected/beklemede).
 *
 * Output: /tmp/affiliate-full-audit.md + /tmp/affiliate-full-audit.json
 */

const NETWORKS = [
  { name: 'ReklamAction', slug: 'reklamaction', aff: '35329', apiKey: '2ae3a9b86708162dc059e78b6a8de2b4dee5444d13bb985b93340bdb6094bb54' },
  { name: 'Affocean',     slug: 'affocean',     aff: '7873',  apiKey: 'c908bda5f41405de7cbcb40a15db041e47a2fcc55358e8f44790db8ff2cfb35d' },
  { name: 'GelirOrtakları', slug: 'gelirortaklari', aff: '37081', apiKey: '891bae449589572cc756b5fe93e182c527ef910c2137c7e1ea53a0a366ab9cd3' },
];

import { writeFileSync } from 'node:fs';

async function fetchAll(net) {
  const base = `https://${net.slug}.api.hasoffers.com/Apiv3/json`;
  const all = [];
  let page = 1;
  while (true) {
    const params = new URLSearchParams({
      Target: 'Affiliate_Offer',
      Method: 'findAll',
      api_key: net.apiKey,
      'fields[]': 'id',
      'fields[1]': 'name',
      'fields[2]': 'approval_status',
      'fields[3]': 'status',
      'fields[4]': 'require_approval',
      limit: '500',
      page: String(page),
    });
    const res = await fetch(`${base}?${params.toString()}`);
    if (!res.ok) break;
    const json = await res.json();
    if (json?.response?.status !== 1) break;
    const data = json?.response?.data?.data;
    if (!data || typeof data !== 'object') break;
    const entries = Object.values(data);
    if (entries.length === 0) break;
    for (const e of entries) {
      const o = e?.Offer;
      if (o?.id && o?.name) {
        all.push({
          id: String(o.id),
          name: o.name,
          approval_status: o.approval_status || null,
          status: o.status || null,
          require_approval: String(o.require_approval ?? '1'),
        });
      }
    }
    if (entries.length < 500) break;
    page += 1;
  }
  return all;
}

async function main() {
  const result = {};
  for (const net of NETWORKS) {
    const offers = await fetchAll(net);
    const approved = [];
    const openNoApproval = []; // require_approval='0' — otomatik açık
    const pending = [];
    const rejected = [];
    const inactive = [];
    for (const o of offers) {
      const isActive = (o.status || '').toLowerCase() === 'active';
      const isApproved = (o.approval_status || '').toLowerCase() === 'approved';
      const isRejected = (o.approval_status || '').toLowerCase() === 'rejected';
      const isOpen = o.require_approval === '0';
      if (!isActive) { inactive.push(o); continue; }
      if (isApproved) { approved.push(o); continue; }
      if (isRejected) { rejected.push(o); continue; }
      if (isOpen) { openNoApproval.push(o); continue; }
      pending.push(o);
    }
    result[net.slug] = {
      network: net.name,
      totalOffers: offers.length,
      approved: approved.sort((a, b) => a.name.localeCompare(b.name)),
      openNoApproval: openNoApproval.sort((a, b) => a.name.localeCompare(b.name)),
      pending: pending.sort((a, b) => a.name.localeCompare(b.name)),
      rejected: rejected.sort((a, b) => a.name.localeCompare(b.name)),
      inactive: inactive.sort((a, b) => a.name.localeCompare(b.name)),
    };
  }

  writeFileSync('/tmp/affiliate-full-audit.json', JSON.stringify(result, null, 2));

  // Markdown rapor
  const lines = [];
  lines.push('# Affiliate Onay Durumu — ' + new Date().toISOString().slice(0, 10));
  lines.push('');
  for (const net of NETWORKS) {
    const r = result[net.slug];
    lines.push(`## ${r.network}  (Affiliate ID: ${net.aff})`);
    lines.push('');
    lines.push(`- **Toplam:** ${r.totalOffers}`);
    lines.push(`- ✅ **ONAYLI:** ${r.approved.length}`);
    lines.push(`- 🟢 **Otomatik açık** (onay gerekmez): ${r.openNoApproval.length}`);
    lines.push(`- 🟡 **Onay bekliyor:** ${r.pending.length}`);
    lines.push(`- ❌ **Reddedilmiş:** ${r.rejected.length}`);
    lines.push(`- 🔒 **Pasif:** ${r.inactive.length}`);
    lines.push('');
    lines.push('### ✅ ONAYLI (kullanılabilir)');
    if (r.approved.length === 0) lines.push('_yok_');
    else for (const o of r.approved) lines.push(`- ${o.name} (id: ${o.id})`);
    lines.push('');
    lines.push('### 🟢 Otomatik açık — onay gerekmiyor, direkt kullanılabilir');
    if (r.openNoApproval.length === 0) lines.push('_yok_');
    else for (const o of r.openNoApproval) lines.push(`- ${o.name} (id: ${o.id})`);
    lines.push('');
    lines.push('### 🟡 Onay bekliyor (pending)');
    if (r.pending.length === 0) lines.push('_yok_');
    else for (const o of r.pending) lines.push(`- ${o.name} (id: ${o.id})`);
    lines.push('');
    lines.push('### ❌ Reddedilmiş');
    if (r.rejected.length === 0) lines.push('_yok_');
    else for (const o of r.rejected) lines.push(`- ${o.name} (id: ${o.id})`);
    lines.push('');
  }
  writeFileSync('/tmp/affiliate-full-audit.md', lines.join('\n'));

  console.log('═══════════════════════════════════════');
  console.log('  ÖZET');
  console.log('═══════════════════════════════════════');
  for (const net of NETWORKS) {
    const r = result[net.slug];
    const active = r.approved.length + r.openNoApproval.length;
    console.log(`${r.network.padEnd(15)} Toplam ${String(r.totalOffers).padStart(3)} | ✅ ${String(active).padStart(3)} kullanılır | 🟡 ${String(r.pending.length).padStart(3)} bekliyor`);
  }
  console.log('\n→ /tmp/affiliate-full-audit.md');
  console.log('→ /tmp/affiliate-full-audit.json');
}

main().catch(e => { console.error(e); process.exit(1); });
