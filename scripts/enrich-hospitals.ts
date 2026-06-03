/**
 * Hastane adreslerini OpenStreetMap Overpass + Nominatim ile zenginleştir.
 *
 * Default: DRY RUN. --apply ile Firestore'a yazar.
 *
 * Usage:
 *   npx tsx scripts/enrich-hospitals.ts                 # dry run, ilk 10 sample
 *   npx tsx scripts/enrich-hospitals.ts --sample 5      # sample sayısı
 *   npx tsx scripts/enrich-hospitals.ts --stats         # sadece missing field istatistik
 *   npx tsx scripts/enrich-hospitals.ts --apply --batch 100 [--limit 500]
 */
import { getAdminFirestore } from '../src/lib/firebase-admin';

type HospitalDoc = {
  id: string;
  name?: string;
  city?: string;
  district?: string;
  address?: string;
  phone?: string;
  website?: string;
  lat?: number;
  lng?: number;
  postcode?: string;
};

type OsmEnrichment = {
  street?: string;
  housenumber?: string;
  city?: string;
  district?: string;
  province?: string;
  postcode?: string;
  phone?: string;
  website?: string;
  source: 'overpass' | 'nominatim' | 'reverse' | 'none';
};

const UA = 'hangel-emergency-data/1.0 (ismailhilmi@hangel.org)';

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function parseOsmId(docId: string): { kind: 'node' | 'way' | 'relation'; id: number } | null {
  // osm-{slug}-{numericId} formatından sayıyı al
  const m = docId.match(/-(\d+)$/);
  if (!m) return null;
  const id = Number(m[1]);
  if (!Number.isFinite(id)) return null;
  // OSM type bilinmiyor (yalnız sayı var). Önce node, sonra way, sonra relation dene.
  // Bu kind sadece varsayılan başlangıç — fetcher fallback dener.
  return { kind: 'node', id };
}

type OsmTags = Record<string, string>;

async function overpassFetch(osmId: number): Promise<{ tags: OsmTags } | null> {
  const query = `
    [out:json][timeout:25];
    (node(${osmId});way(${osmId});relation(${osmId}););
    out tags;
  `;
  try {
    const res = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': UA },
      body: 'data=' + encodeURIComponent(query),
    });
    if (!res.ok) return null;
    const j = (await res.json()) as { elements?: Array<{ tags?: OsmTags }> };
    const el = (j.elements || []).find((e) => e.tags);
    return el ? { tags: el.tags || {} } : null;
  } catch {
    return null;
  }
}

async function nominatimReverse(lat: number, lng: number): Promise<OsmTags | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=tr`;
    const res = await fetch(url, { headers: { 'User-Agent': UA } });
    if (!res.ok) return null;
    const j = (await res.json()) as { address?: Record<string, string> };
    const a = j.address || {};
    const tags: OsmTags = {};
    if (a.road) tags['addr:street'] = a.road;
    if (a.house_number) tags['addr:housenumber'] = a.house_number;
    if (a.city || a.town || a.village) tags['addr:city'] = a.city || a.town || a.village || '';
    if (a.suburb || a.neighbourhood || a.county) tags['addr:district'] = a.suburb || a.neighbourhood || a.county || '';
    if (a.postcode) tags['addr:postcode'] = a.postcode;
    if (a.state) tags['addr:province'] = a.state;
    return tags;
  } catch {
    return null;
  }
}

// Photon (komoot) — no official rate limit, OSM-based reverse geocode.
// Used as faster parallel alternative to Nominatim.
async function photonReverse(lat: number, lng: number): Promise<OsmTags | null> {
  try {
    const url = `https://photon.komoot.io/reverse?lat=${lat}&lon=${lng}&lang=default`;
    const res = await fetch(url, { headers: { 'User-Agent': UA } });
    if (!res.ok) return null;
    const j = (await res.json()) as { features?: Array<{ properties?: Record<string, string> }> };
    const p = j.features?.[0]?.properties;
    if (!p) return null;
    const tags: OsmTags = {};
    if (p.street) tags['addr:street'] = p.street;
    if (p.housenumber) tags['addr:housenumber'] = p.housenumber;
    if (p.city || p.town || p.village) tags['addr:city'] = p.city || p.town || p.village || '';
    if (p.district || p.county || p.suburb) tags['addr:district'] = p.district || p.county || p.suburb || '';
    if (p.postcode) tags['addr:postcode'] = p.postcode;
    if (p.state) tags['addr:province'] = p.state;
    return tags;
  } catch {
    return null;
  }
}

function tagsToEnrichment(tags: OsmTags): OsmEnrichment {
  const street = tags['addr:street'] || '';
  const houseno = tags['addr:housenumber'] || '';
  return {
    street: street ? (houseno ? `${street} No: ${houseno}` : street) : undefined,
    housenumber: houseno || undefined,
    city: tags['addr:city'] || tags['addr:province'] || undefined,
    district: tags['addr:district'] || tags['addr:suburb'] || tags['addr:town'] || undefined,
    postcode: tags['addr:postcode'] || undefined,
    phone: tags['phone'] || tags['contact:phone'] || undefined,
    website: tags['website'] || tags['contact:website'] || undefined,
    source: 'overpass',
  };
}

function mergeIntoDoc(doc: HospitalDoc, enr: OsmEnrichment): Partial<HospitalDoc> {
  const update: Partial<HospitalDoc> = {};
  if (!doc.address && enr.street) update.address = enr.street;
  if (!doc.city && enr.city) update.city = enr.city;
  if (!doc.district && enr.district) update.district = enr.district;
  if (!doc.postcode && enr.postcode) update.postcode = enr.postcode;
  if (!doc.phone && enr.phone) update.phone = enr.phone;
  if (!doc.website && enr.website) update.website = enr.website;
  return update;
}

async function enrichOne(doc: HospitalDoc, geocoder: 'nominatim' | 'photon'): Promise<OsmEnrichment | null> {
  // Skip Overpass when running in parallel (use only reverse geocode for speed).
  // Photon has no rate limit so safe for parallel workers.
  if (typeof doc.lat === 'number' && typeof doc.lng === 'number') {
    const tags = geocoder === 'photon'
      ? await photonReverse(doc.lat, doc.lng)
      : await nominatimReverse(doc.lat, doc.lng);
    if (geocoder === 'nominatim') await sleep(1100); // Nominatim 1 req/sec
    else await sleep(120); // Photon courteous ~8 req/sec
    if (tags) {
      const enr = tagsToEnrichment(tags);
      enr.source = 'reverse';
      return enr;
    }
  }
  return null;
}

function isMissingCore(d: HospitalDoc): boolean {
  return !d.address || !d.city || !d.district;
}

async function main() {
  const args = process.argv.slice(2);
  const apply = args.includes('--apply');
  const onlyStats = args.includes('--stats');
  const sampleN = Number(args[args.indexOf('--sample') + 1]) || 10;
  const batchN = Number(args[args.indexOf('--batch') + 1]) || 100;
  const limit = Number(args[args.indexOf('--limit') + 1]) || 0;
  const rangeArg = args[args.indexOf('--range') + 1];
  const range = args.includes('--range') && rangeArg ? rangeArg.split(':').map(Number) : null;
  const geocoder: 'nominatim' | 'photon' = args.includes('--geocoder') && args[args.indexOf('--geocoder') + 1] === 'photon' ? 'photon' : 'nominatim';
  const tag = args[args.indexOf('--tag') + 1] || 'main';

  console.log(`[${tag}] Mode: ${apply ? 'APPLY' : 'DRY RUN'} | stats=${onlyStats} | sample=${sampleN} | batch=${batchN} | limit=${limit || 'unlimited'} | range=${range ? range.join(':') : 'all'} | geocoder=${geocoder}`);

  const db = getAdminFirestore();
  console.log('Fetching all hospitals...');
  const snap = await db.collection('hospitals').get();
  const all: HospitalDoc[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<HospitalDoc, 'id'>) }));
  console.log(`Total: ${all.length}`);

  const stats = {
    total: all.length,
    missingAddress: all.filter((d) => !d.address).length,
    missingCity: all.filter((d) => !d.city).length,
    missingDistrict: all.filter((d) => !d.district).length,
    missingCore: all.filter(isMissingCore).length,
    hasLatLng: all.filter((d) => typeof d.lat === 'number' && typeof d.lng === 'number').length,
    osmIdPrefix: all.filter((d) => d.id.startsWith('osm-')).length,
  };
  console.log('Stats:', JSON.stringify(stats, null, 2));

  if (onlyStats) return;

  const candidates = all.filter(isMissingCore);
  let work = limit > 0 ? candidates.slice(0, limit) : candidates;
  if (range && range.length === 2) {
    work = work.slice(range[0], range[1]);
  }
  console.log(`[${tag}] Candidates (missing core): ${candidates.length} | will process: ${work.length}`);

  if (!apply) {
    console.log(`\n--- DRY RUN: first ${sampleN} samples ---`);
    let processed = 0;
    let enriched = 0;
    for (const doc of work.slice(0, sampleN)) {
      const enr = await enrichOne(doc, geocoder);
      processed++;
      if (enr) {
        enriched++;
        const update = mergeIntoDoc(doc, enr);
        console.log(`[${processed}] ${doc.id}`);
        console.log(`  name: ${doc.name}`);
        console.log(`  old: { city: "${doc.city||''}", district: "${doc.district||''}", address: "${doc.address||''}" }`);
        console.log(`  new: ${JSON.stringify(update)}`);
        console.log(`  source: ${enr.source}`);
      } else {
        console.log(`[${processed}] ${doc.id}  ❌ no data`);
      }
    }
    console.log(`\nDry-run result: ${enriched}/${processed} enriched`);
    console.log(`Estimated full run time: ${Math.ceil((work.length * 1.6) / 60)} dakika (sequential)`);
    console.log(`\nTo apply: npx tsx scripts/enrich-hospitals.ts --apply --batch ${batchN}${limit ? ' --limit ' + limit : ''}`);
    return;
  }

  // APPLY MODE
  let processed = 0;
  let enriched = 0;
  let written = 0;
  let batch = db.batch();
  let batchSize = 0;

  for (const doc of work) {
    processed++;
    const enr = await enrichOne(doc, geocoder);
    if (enr) {
      const update = mergeIntoDoc(doc, enr);
      if (Object.keys(update).length > 0) {
        batch.update(db.collection('hospitals').doc(doc.id), update);
        batchSize++;
        enriched++;
      }
    }
    if (batchSize >= batchN) {
      await batch.commit();
      written += batchSize;
      console.log(`[${tag}][${processed}/${work.length}] flushed ${batchSize} writes (total written ${written})`);
      batch = db.batch();
      batchSize = 0;
    }
    if (processed % 50 === 0) {
      console.log(`[${tag}][${processed}/${work.length}] enriched ${enriched}, writes pending ${batchSize}`);
    }
  }
  if (batchSize > 0) {
    await batch.commit();
    written += batchSize;
  }
  console.log(`\n[${tag}] DONE: processed ${processed}, enriched ${enriched}, written ${written}`);
}

main().catch((e) => {
  console.error('FATAL:', e?.message || e);
  process.exit(1);
});
