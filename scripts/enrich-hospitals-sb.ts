/**
 * Hastane Firestore zenginleştirme — T.C. Sağlık Bakanlığı / kamuya açık dataset.
 *
 * `enrich-hospitals.ts` (OSM tabanlı) ile paralel çalışır; aynı doc'lara dokunsa bile
 * yalnızca **boş** alanları doldurur (write-if-missing), yani çakışma yok.
 *
 * Default: DRY RUN. `--apply` ile Firestore'a yazar.
 *
 * Usage:
 *   npx tsx scripts/enrich-hospitals-sb.ts                       # dry run, 5 sample
 *   npx tsx scripts/enrich-hospitals-sb.ts --sample 10           # sample sayısı
 *   npx tsx scripts/enrich-hospitals-sb.ts --source <url>        # alternatif dataset
 *   npx tsx scripts/enrich-hospitals-sb.ts --apply --batch 100   # APPLY (writes!)
 *   npx tsx scripts/enrich-hospitals-sb.ts --apply --create-new  # match olmayan SB row'larını yeni doc olarak ekle
 *
 * Veri kaynağı (default, public, free, no-auth):
 *   - "farukcankaya/all-hospitals-database-tr" (T.C. SB / MHRS scrape, plaka başına 01..81.json)
 *     https://raw.githubusercontent.com/farukcankaya/all-hospitals-database-tr/master/{NN}.json
 *     Alanlar: ad, il.ad, ilce.ad, adres, telefon, enlem, boylam, kod, turAdi
 *   - Tek dosyalık alternatif (sadece il + isim, daha az alan):
 *     https://gist.githubusercontent.com/je8n/9e87acd501d5b1488fa5cbccd87ad297/raw
 *   - Resmi T.C. Sağlık Bakanlığı portalı (acikveri.saglik.gov.tr) clinical/AI veri seti
 *     barındırıyor; idari hastane listesini doğrudan CSV olarak yayınlamıyor.
 *     Manuel CSV varsa `--source file://<path>` ile besle.
 */
import { getAdminFirestore } from '../src/lib/firebase-admin';

type HospitalDoc = {
  id: string;
  name?: string;
  city?: string;
  district?: string;
  neighborhood?: string;
  address?: string;
  phone?: string;
  website?: string;
  lat?: number;
  lng?: number;
  postcode?: string;
  source?: string;
};

type SbRecord = {
  name: string;
  city?: string;
  district?: string;
  neighborhood?: string;
  address?: string;
  phone?: string;
  website?: string;
  lat?: number;
  lng?: number;
  sourceId?: string;
};

const DEFAULT_SOURCE = 'farukcankaya:all-hospitals-database-tr';

const FARUKCANKAYA_BASE =
  'https://raw.githubusercontent.com/farukcankaya/all-hospitals-database-tr/master';

// ---------- Utils ----------

function stripDiacriticsTr(input: string): string {
  // Türkçe karakter koruyarak normalize: sadece lower + boşluk + noktalama temizle.
  // Karşılaştırma için ayrıca asciiFold yapacağız ama görsel veriyi bozma.
  return input.normalize('NFC');
}

function asciiFoldTr(input: string): string {
  const map: Record<string, string> = {
    İ: 'i', I: 'i', ı: 'i',
    Ş: 's', ş: 's',
    Ğ: 'g', ğ: 'g',
    Ç: 'c', ç: 'c',
    Ö: 'o', ö: 'o',
    Ü: 'u', ü: 'u',
  };
  return input
    .split('')
    .map((c) => map[c] ?? c)
    .join('')
    .toLowerCase();
}

function normalizeName(input: string): string {
  return asciiFoldTr(input)
    .replace(/\b(t\.c\.|tc|özel|ozel|devlet|saglik|sağlık|bakanligi|bakanlığı|hastanesi|hastane|hast|h\.|hospital|merkez|merkezi|asm|ase)\b/g, ' ')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const dp: number[] = new Array(b.length + 1);
  for (let j = 0; j <= b.length; j++) dp[j] = j;
  for (let i = 1; i <= a.length; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = dp[j];
      dp[j] = a[i - 1] === b[j - 1] ? prev : Math.min(prev, dp[j], dp[j - 1]) + 1;
      prev = tmp;
    }
  }
  return dp[b.length];
}

function similarity(a: string, b: string): number {
  if (!a.length && !b.length) return 1;
  const dist = levenshtein(a, b);
  return 1 - dist / Math.max(a.length, b.length);
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function slugify(input: string): string {
  return asciiFoldTr(input)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 80);
}

// ---------- Source loader ----------

const UA = 'hangel-emergency-data/1.0 (ismailhilmi@hangel.org)';

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error(`source-fetch-failed: HTTP ${res.status} for ${url}`);
  return res.text();
}

async function loadSource(source: string): Promise<SbRecord[]> {
  if (source === 'farukcankaya:all-hospitals-database-tr') {
    const records: SbRecord[] = [];
    for (let plaka = 1; plaka <= 81; plaka++) {
      const file = `${String(plaka).padStart(2, '0')}.json`;
      try {
        const raw = await fetchText(`${FARUKCANKAYA_BASE}/${file}`);
        // 18.json gibi dosyalar tek-tırnak-içinde-escape edilmiş ("[{\"label\":..."): unescape.
        const cleaned = raw.trimStart().startsWith('[{\\"') || raw.trimStart().startsWith('"[{\\"')
          ? raw.replace(/\\"/g, '"').replace(/^"|"$/g, '')
          : raw;
        const parsed: unknown = JSON.parse(cleaned);
        records.push(...normalizeJsonShape(parsed));
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.warn(`  WARN: ${file} skipped (${message})`);
      }
    }
    return records;
  }
  let raw: string;
  if (source.startsWith('file://')) {
    const { readFile } = await import('node:fs/promises');
    raw = await readFile(source.replace(/^file:\/\//, ''), 'utf-8');
  } else {
    raw = await fetchText(source);
  }
  const trimmed = raw.trimStart();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    const parsed: unknown = JSON.parse(raw);
    return normalizeJsonShape(parsed);
  }
  return parseCsv(raw);
}

function asStringField(value: unknown): string | undefined {
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return undefined;
}

function asNumberField(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

function nestedNameField(value: unknown): string | undefined {
  if (typeof value === 'string') return asStringField(value);
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    return asStringField(obj.ad) ?? asStringField(obj.name);
  }
  return undefined;
}

function recordFromEntity(entity: Record<string, unknown>, fallbackIl?: string, fallbackIlce?: string): SbRecord | null {
  const get = (...keys: string[]): string | undefined => {
    for (const k of keys) {
      const v = asStringField(entity[k]);
      if (v) return v;
    }
    return undefined;
  };
  const name = get('ad', 'hastane_adi', 'kurum_adi', 'kurumAdi', 'KurumAdi', 'name', 'adi');
  if (!name) return null;
  return {
    name,
    city: nestedNameField(entity.il) ?? get('il', 'sehir', 'city', 'province') ?? fallbackIl,
    district: nestedNameField(entity.ilce) ?? nestedNameField(entity['ilçe']) ?? get('district') ?? fallbackIlce,
    neighborhood: get('mahalle', 'neighborhood', 'semt'),
    address: get('adres', 'address'),
    phone: get('telefon', 'tel', 'phone'),
    website: get('web', 'website', 'url'),
    lat: asNumberField(entity.enlem ?? entity.lat ?? entity.latitude),
    lng: asNumberField(entity.boylam ?? entity.lng ?? entity.lon ?? entity.longitude),
    sourceId: get('kod', 'id', 'kurum_kodu', 'kurumKodu', 'no', 'referansNo'),
  };
}

function normalizeJsonShape(parsed: unknown): SbRecord[] {
  const records: SbRecord[] = [];
  const seen = new Set<string>();

  const pushIfFresh = (rec: SbRecord | null): void => {
    if (!rec) return;
    const key = `${rec.sourceId || ''}|${rec.name}|${rec.city || ''}`;
    if (seen.has(key)) return;
    seen.add(key);
    records.push(rec);
  };

  const walk = (node: unknown, ilName?: string, ilceName?: string): void => {
    if (!node) return;
    if (Array.isArray(node)) {
      for (const item of node) walk(item, ilName, ilceName);
      return;
    }
    if (typeof node !== 'object') return;
    const obj = node as Record<string, unknown>;

    // farukcankaya wrapper: { label, data, children, entity:{...} }
    if (obj.entity && typeof obj.entity === 'object') {
      pushIfFresh(recordFromEntity(obj.entity as Record<string, unknown>, ilName, ilceName));
      if (Array.isArray(obj.children)) walk(obj.children, ilName, ilceName);
      return;
    }

    // flat entity (adres/telefon mevcut)
    if (obj.ad || obj.hastane_adi || obj.kurum_adi || obj.kurumAdi || obj.name) {
      pushIfFresh(recordFromEntity(obj, ilName, ilceName));
      return;
    }

    // je8n wrapper: { "Adana": { "Aile Hekimliği": ["AD1", "AD2"] } }
    let isProvinceWrapper = true;
    for (const [k, v] of Object.entries(obj)) {
      if (!Array.isArray(v) && (typeof v !== 'object' || v === null)) {
        isProvinceWrapper = false;
        break;
      }
      if (typeof v === 'object' && !Array.isArray(v)) {
        // recurse
      }
      if (Array.isArray(v) && !v.every((x) => typeof x === 'string')) {
        isProvinceWrapper = false;
      }
    }

    if (isProvinceWrapper) {
      for (const [k, v] of Object.entries(obj)) {
        if (Array.isArray(v)) {
          // İl/bolum -> isim array (je8n: name-only)
          for (const n of v) {
            if (typeof n === 'string') {
              pushIfFresh({ name: n, city: ilName });
            }
          }
        } else if (v && typeof v === 'object') {
          walk(v, ilName ?? k, ilceName);
        }
      }
      return;
    }

    for (const v of Object.values(obj)) walk(v, ilName, ilceName);
  };

  walk(parsed);
  return records;
}

function parseCsv(raw: string): SbRecord[] {
  const lines = raw.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const sep = lines[0].includes(';') ? ';' : ',';
  const headers = lines[0].split(sep).map((h) => h.trim().toLowerCase().replace(/^"|"$/g, ''));
  const idx = (...names: string[]): number => {
    for (const n of names) {
      const i = headers.indexOf(n);
      if (i !== -1) return i;
    }
    return -1;
  };
  const cName = idx('hastane_adi', 'kurum_adi', 'kurumadi', 'name', 'ad');
  const cCity = idx('il', 'sehir', 'city');
  const cDist = idx('ilce', 'ilçe', 'district');
  const cNeigh = idx('mahalle', 'neighborhood');
  const cAddr = idx('adres', 'address');
  const cPhone = idx('telefon', 'tel', 'phone');
  const cWeb = idx('web', 'website');
  const cLat = idx('lat', 'enlem');
  const cLng = idx('lng', 'boylam', 'lon');
  const cId = idx('id', 'kurum_kodu', 'kurumkodu');

  const records: SbRecord[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(sep).map((c) => c.trim().replace(/^"|"$/g, ''));
    const name = cName >= 0 ? cols[cName] : '';
    if (!name) continue;
    const lat = cLat >= 0 ? Number(cols[cLat]) : NaN;
    const lng = cLng >= 0 ? Number(cols[cLng]) : NaN;
    records.push({
      name: stripDiacriticsTr(name),
      city: cCity >= 0 ? cols[cCity] : undefined,
      district: cDist >= 0 ? cols[cDist] : undefined,
      neighborhood: cNeigh >= 0 ? cols[cNeigh] : undefined,
      address: cAddr >= 0 ? cols[cAddr] : undefined,
      phone: cPhone >= 0 ? cols[cPhone] : undefined,
      website: cWeb >= 0 ? cols[cWeb] : undefined,
      lat: Number.isFinite(lat) ? lat : undefined,
      lng: Number.isFinite(lng) ? lng : undefined,
      sourceId: cId >= 0 ? cols[cId] : undefined,
    });
  }
  return records;
}

// ---------- Matching ----------

type MatchResult = {
  hospital: HospitalDoc;
  kind: 'exact' | 'fuzzy' | 'geo';
  score: number;
};

function buildIndex(hospitals: HospitalDoc[]): Map<string, HospitalDoc[]> {
  const byKey = new Map<string, HospitalDoc[]>();
  for (const h of hospitals) {
    if (!h.name) continue;
    const key = normalizeName(h.name);
    if (!key) continue;
    const list = byKey.get(key);
    if (list) list.push(h);
    else byKey.set(key, [h]);
  }
  return byKey;
}

function findMatch(
  rec: SbRecord,
  hospitals: HospitalDoc[],
  index: Map<string, HospitalDoc[]>,
): MatchResult | null {
  const recKey = normalizeName(rec.name);
  if (!recKey) return null;

  const exact = index.get(recKey);
  if (exact && exact.length) {
    return { hospital: exact[0], kind: 'exact', score: 1 };
  }

  // fuzzy: aynı şehirde olduğu KESİN olanlara bak (her iki tarafta da city dolu)
  // similarity ≥ 0.85 (Levenshtein < 0.15). City eşleşmesi yoksa fuzzy SKIP — yanlış il/ilçeye yazma.
  const recCityKey = rec.city ? asciiFoldTr(rec.city.trim()) : '';
  if (recCityKey) {
    let best: MatchResult | null = null;
    for (const h of hospitals) {
      if (!h.name || !h.city) continue;
      if (asciiFoldTr(h.city.trim()) !== recCityKey) continue;
      const sim = similarity(recKey, normalizeName(h.name));
      if (sim >= 0.85 && (!best || sim > best.score)) {
        best = { hospital: h, kind: 'fuzzy', score: sim };
      }
    }
    if (best) return best;
  }

  // geo: 100m içinde + name similarity ≥ 0.5 (yakın ama farklı kurum riskini azalt).
  if (typeof rec.lat === 'number' && typeof rec.lng === 'number') {
    let geoBest: MatchResult | null = null;
    let geoBestKm = Infinity;
    for (const h of hospitals) {
      if (typeof h.lat !== 'number' || typeof h.lng !== 'number') continue;
      const km = haversineKm(rec.lat, rec.lng, h.lat, h.lng);
      if (km >= 0.1) continue;
      if (!h.name) continue;
      const sim = similarity(recKey, normalizeName(h.name));
      if (sim < 0.5) continue;
      if (km < geoBestKm) {
        geoBestKm = km;
        geoBest = { hospital: h, kind: 'geo', score: sim };
      }
    }
    if (geoBest) return geoBest;
  }

  return null;
}

function mergeIntoDoc(doc: HospitalDoc, rec: SbRecord): Partial<HospitalDoc> {
  const update: Partial<HospitalDoc> = {};
  if (!doc.name && rec.name) update.name = rec.name;
  if (!doc.city && rec.city) update.city = rec.city;
  if (!doc.district && rec.district) update.district = rec.district;
  if (!doc.neighborhood && rec.neighborhood) update.neighborhood = rec.neighborhood;
  if (!doc.address && rec.address) update.address = rec.address;
  if (!doc.phone && rec.phone) update.phone = rec.phone;
  if (!doc.website && rec.website) update.website = rec.website;
  return update;
}

// ---------- Main ----------

type Args = {
  apply: boolean;
  createNew: boolean;
  sample: number;
  batch: number;
  source: string;
  limit: number;
};

function parseArgs(): Args {
  const a = process.argv.slice(2);
  const get = (flag: string, def: string): string => {
    const i = a.indexOf(flag);
    return i >= 0 && a[i + 1] ? a[i + 1] : def;
  };
  return {
    apply: a.includes('--apply'),
    createNew: a.includes('--create-new'),
    sample: Number(get('--sample', '5')) || 5,
    batch: Number(get('--batch', '100')) || 100,
    source: get('--source', DEFAULT_SOURCE),
    limit: Number(get('--limit', '0')) || 0,
  };
}

async function main(): Promise<void> {
  const args = parseArgs();
  console.log(
    `Mode: ${args.apply ? 'APPLY (writes!)' : 'DRY RUN'} | sample=${args.sample} | batch=${args.batch} | createNew=${args.createNew}`,
  );
  console.log(`Source: ${args.source}`);

  console.log('\n[1/4] Loading SB dataset...');
  let sbRecords: SbRecord[];
  try {
    sbRecords = await loadSource(args.source);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(JSON.stringify({ errorCode: 'sb-source-load-failed', message }));
    process.exit(1);
  }
  console.log(`  SB records loaded: ${sbRecords.length}`);
  if (!sbRecords.length) {
    console.error(JSON.stringify({ errorCode: 'sb-source-empty', message: 'no records parsed' }));
    process.exit(1);
  }

  console.log('\n[2/4] Loading Firestore hospitals...');
  const db = getAdminFirestore();
  const snap = await db.collection('hospitals').get();
  const hospitals: HospitalDoc[] = snap.docs.map((d) => ({
    id: d.id,
    ...(d.data() as Omit<HospitalDoc, 'id'>),
  }));
  console.log(`  Firestore hospitals: ${hospitals.length}`);

  console.log('\n[3/4] Matching...');
  const index = buildIndex(hospitals);
  const stats = {
    sbTotal: sbRecords.length,
    matchedExact: 0,
    matchedFuzzy: 0,
    matchedGeo: 0,
    unmatched: 0,
    enrichUpdates: 0,
    newCandidates: 0,
  };

  const updates: Array<{ doc: HospitalDoc; rec: SbRecord; match: MatchResult; update: Partial<HospitalDoc> }> = [];
  const newRecords: SbRecord[] = [];

  const work = args.limit > 0 ? sbRecords.slice(0, args.limit) : sbRecords;
  for (const rec of work) {
    const m = findMatch(rec, hospitals, index);
    if (!m) {
      stats.unmatched++;
      if (args.createNew) {
        stats.newCandidates++;
        newRecords.push(rec);
      }
      continue;
    }
    if (m.kind === 'exact') stats.matchedExact++;
    else if (m.kind === 'fuzzy') stats.matchedFuzzy++;
    else stats.matchedGeo++;

    const upd = mergeIntoDoc(m.hospital, rec);
    if (Object.keys(upd).length > 0) {
      stats.enrichUpdates++;
      updates.push({ doc: m.hospital, rec, match: m, update: upd });
    }
  }

  console.log('  Stats:', JSON.stringify(stats, null, 2));

  console.log(`\n[4/4] Dry-run samples (first ${args.sample}):`);
  for (const u of updates.slice(0, args.sample)) {
    console.log(`  - ${u.doc.id} [${u.match.kind} ${u.match.score.toFixed(2)}]`);
    console.log(`    name:    ${u.doc.name}`);
    console.log(`    sb.name: ${u.rec.name}`);
    console.log(`    update:  ${JSON.stringify(u.update)}`);
  }
  if (args.createNew && newRecords.length) {
    console.log(`\n  New-doc candidates (first ${Math.min(args.sample, newRecords.length)}):`);
    for (const r of newRecords.slice(0, args.sample)) {
      console.log(`  + sb-${slugify(`${r.city || ''}-${r.name}`)} :: ${r.name} (${r.city || '?'}/${r.district || '?'})`);
    }
  }

  if (!args.apply) {
    console.log(
      `\nTo apply: cd /Users/macbookair/new-app && npx tsx scripts/enrich-hospitals-sb.ts --apply --batch ${args.batch}` +
        (args.createNew ? ' --create-new' : ''),
    );
    return;
  }

  // APPLY MODE
  console.log('\nAPPLY: committing updates...');
  let batch = db.batch();
  let batchSize = 0;
  let written = 0;
  const flush = async (): Promise<void> => {
    if (batchSize === 0) return;
    await batch.commit();
    written += batchSize;
    console.log(`  flushed ${batchSize} (total ${written})`);
    batch = db.batch();
    batchSize = 0;
  };

  for (const u of updates) {
    batch.update(db.collection('hospitals').doc(u.doc.id), {
      ...u.update,
      source: u.doc.source ? `${u.doc.source}+sb` : 'sb',
    });
    batchSize++;
    if (batchSize >= args.batch) await flush();
  }

  if (args.createNew) {
    for (const r of newRecords) {
      const id = `sb-${slugify(`${r.city || ''}-${r.name}`)}-${r.sourceId || ''}`.replace(/-+$/, '');
      const docData: Omit<HospitalDoc, 'id'> = {
        name: r.name,
        ...(r.city ? { city: r.city } : {}),
        ...(r.district ? { district: r.district } : {}),
        ...(r.neighborhood ? { neighborhood: r.neighborhood } : {}),
        ...(r.address ? { address: r.address } : {}),
        ...(r.phone ? { phone: r.phone } : {}),
        ...(r.website ? { website: r.website } : {}),
        ...(typeof r.lat === 'number' ? { lat: r.lat } : {}),
        ...(typeof r.lng === 'number' ? { lng: r.lng } : {}),
        source: 'sb',
      };
      batch.set(db.collection('hospitals').doc(id), docData, { merge: true });
      batchSize++;
      if (batchSize >= args.batch) await flush();
    }
  }

  await flush();
  console.log(`\nDONE: ${written} writes committed (${stats.enrichUpdates} enrich, ${args.createNew ? newRecords.length : 0} new)`);
}

main().catch((err) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(JSON.stringify({ errorCode: 'sb-enrich-fatal', message }));
  process.exit(1);
});
