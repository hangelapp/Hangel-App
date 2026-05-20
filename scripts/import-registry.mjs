/**
 * Import the government Vakıf/Dernek registry (kütük) datasets into Firestore
 * so the corporate registration form can auto-fill org info.
 *
 * Two Google-Sheets-exported CSVs:
 *   - DERNEKLER → collection `registryDernekler`, doc id = trimmed Kütük No.
 *   - VAKIFLAR  → collection `registryVakiflar`, doc id = auto (no kütük column).
 *
 * Run with ADC:
 *   gcloud auth application-default login
 *   node scripts/import-registry.mjs --dernekler ./dernekler.csv --vakiflar ./vakiflar.csv [--dry]
 *
 * Flags:
 *   --dry         Parse + report counts only; performs no writes.
 *   --skip-test   Skip obvious DERBİS test rows (default: import all).
 *
 * Idempotency:
 *   - Dernekler use doc id = kütük no, so re-runs OVERWRITE in place
 *     (set with merge:false). Safe to re-run.
 *   - Vakıflar use auto-ids, so re-running APPENDS duplicates. To re-import
 *     cleanly, clear `registryVakiflar` first (e.g. mirror the delete pattern
 *     in scripts/delete-all-ngos.js) before running this script.
 */
import { readFileSync } from 'node:fs';
import admin from 'firebase-admin';

const DRY = process.argv.includes('--dry');
const SKIP_TEST = process.argv.includes('--skip-test');
const PROJECT_ID = 'hangel-new-v18-87297865-9bcc3';

function flagValue(name) {
  const i = process.argv.indexOf(name);
  return i !== -1 && i + 1 < process.argv.length ? process.argv[i + 1] : null;
}

const DERNEKLER_PATH = flagValue('--dernekler');
const VAKIFLAR_PATH = flagValue('--vakiflar');

/**
 * Quote-aware CSV parser. Handles:
 *   - quoted fields containing commas: "Adres, No 5"
 *   - escaped quotes inside quoted fields: "He said ""hi"""
 *   - CRLF and LF line endings
 * Returns an array of rows; each row is an array of string cells.
 */
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  let i = 0;
  const n = text.length;

  while (i < n) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      field += c;
      i += 1;
      continue;
    }
    if (c === '"') {
      inQuotes = true;
      i += 1;
      continue;
    }
    if (c === ',') {
      row.push(field);
      field = '';
      i += 1;
      continue;
    }
    if (c === '\r') {
      // CRLF: handled by the \n branch; skip the bare CR.
      i += 1;
      continue;
    }
    if (c === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
      i += 1;
      continue;
    }
    field += c;
    i += 1;
  }
  // Flush trailing field/row (file may not end with newline).
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function clean(value) {
  return (value ?? '').trim();
}

// Sheets use '-' as a missing-value placeholder; normalize to ''.
function normalizeDash(value) {
  const v = clean(value);
  return v === '-' ? '' : v;
}

// Map header cells to column indices so we are not position-fragile.
function headerIndex(headerRow) {
  const map = {};
  headerRow.forEach((h, idx) => {
    map[clean(h)] = idx;
  });
  return map;
}

function parseFoundedYear(kurulusTarihi) {
  // "14.06.2012" → 2012. Returns a number or null.
  const m = clean(kurulusTarihi).match(/(\d{4})/);
  if (!m) return null;
  const year = Number(m[1]);
  return Number.isFinite(year) ? year : null;
}

function isTestDernek(name) {
  const upper = name.toLocaleUpperCase('tr');
  return upper.startsWith('DERBİS TEST') || upper.includes('TEST DERNEĞİ');
}

function loadDernekler(path) {
  const rows = parseCsv(readFileSync(path, 'utf8'));
  if (rows.length === 0) return { records: [], parsed: 0, skipped: 0 };
  const h = headerIndex(rows[0]);
  const records = [];
  let parsed = 0;
  let skipped = 0;

  for (let r = 1; r < rows.length; r += 1) {
    const cols = rows[r];
    // Ignore fully blank lines.
    if (cols.every((c) => clean(c) === '')) continue;
    parsed += 1;

    const kutukNo = clean(cols[h['Kütük No']]);
    const name = clean(cols[h['Kurum Adı']]);
    if (!kutukNo || !name) {
      skipped += 1;
      continue;
    }
    if (SKIP_TEST && isTestDernek(name)) {
      skipped += 1;
      continue;
    }

    const kurulusTarihi = clean(cols[h['Kuruluş Tarihi']]);
    records.push({
      id: kutukNo,
      data: {
        kutukNo,
        name,
        faaliyetAlani: clean(cols[h['Faaliyet Alanı']]),
        detayliFaaliyetAlani: clean(cols[h['Detaylı Faaliyet Alanı']]),
        kurulusTarihi,
        foundedYear: parseFoundedYear(kurulusTarihi),
        webSite: clean(cols[h['Web Site']]),
        adres: clean(cols[h['Kurum Adresi']]),
        type: 'Dernek',
        nameLower: name.toLocaleLowerCase('tr'),
      },
    });
  }
  return { records, parsed, skipped };
}

function loadVakiflar(path) {
  const rows = parseCsv(readFileSync(path, 'utf8'));
  if (rows.length === 0) return { records: [], parsed: 0, skipped: 0 };
  const h = headerIndex(rows[0]);
  const records = [];
  let parsed = 0;
  let skipped = 0;

  for (let r = 1; r < rows.length; r += 1) {
    const cols = rows[r];
    if (cols.every((c) => clean(c) === '')) continue;
    parsed += 1;

    const name = normalizeDash(cols[h['VAKIF ADI']]);
    if (!name) {
      skipped += 1;
      continue;
    }

    records.push({
      data: {
        name,
        nameLower: name.toLocaleLowerCase('tr'),
        adres: normalizeDash(cols[h['ADRES']]),
        il: normalizeDash(cols[h['İL']]),
        ilce: normalizeDash(cols[h['İLÇE']]),
        telefon1: normalizeDash(cols[h['TELEFON-1']]),
        telefon2: normalizeDash(cols[h['TELEFON-2']]),
        eTebligat: normalizeDash(cols[h['E-TEBLİGAT ADRESİ']]),
        ePosta: normalizeDash(cols[h['E-POSTA']]),
        type: 'Vakıf',
      },
    });
  }
  return { records, parsed, skipped };
}

async function writeDernekler(db, records) {
  const BATCH = 450;
  let written = 0;
  for (let i = 0; i < records.length; i += BATCH) {
    const slice = records.slice(i, i + BATCH);
    const batch = db.batch();
    for (const rec of slice) {
      // Doc id = kütük no → idempotent overwrite (merge:false).
      batch.set(db.collection('registryDernekler').doc(rec.id), rec.data, { merge: false });
    }
    await batch.commit();
    written += slice.length;
    console.log(`[import-registry] dernekler wrote ${written}/${records.length}`);
  }
  return written;
}

async function writeVakiflar(db, records) {
  const BATCH = 450;
  let written = 0;
  for (let i = 0; i < records.length; i += BATCH) {
    const slice = records.slice(i, i + BATCH);
    const batch = db.batch();
    for (const rec of slice) {
      // Auto-id → re-runs append (see docblock idempotency note).
      batch.set(db.collection('registryVakiflar').doc(), rec.data);
    }
    await batch.commit();
    written += slice.length;
    console.log(`[import-registry] vakiflar wrote ${written}/${records.length}`);
  }
  return written;
}

async function run() {
  console.log(`[import-registry] dry=${DRY} skipTest=${SKIP_TEST} project=${PROJECT_ID}`);

  if (!DERNEKLER_PATH && !VAKIFLAR_PATH) {
    console.error('[import-registry] Provide --dernekler <csv> and/or --vakiflar <csv>.');
    process.exit(1);
  }

  const dernekler = DERNEKLER_PATH
    ? loadDernekler(DERNEKLER_PATH)
    : { records: [], parsed: 0, skipped: 0 };
  const vakiflar = VAKIFLAR_PATH
    ? loadVakiflar(VAKIFLAR_PATH)
    : { records: [], parsed: 0, skipped: 0 };

  console.log(
    `[import-registry] dernekler parsed=${dernekler.parsed} eligible=${dernekler.records.length} skipped=${dernekler.skipped}`,
  );
  console.log(
    `[import-registry] vakiflar  parsed=${vakiflar.parsed} eligible=${vakiflar.records.length} skipped=${vakiflar.skipped}`,
  );

  if (DRY) {
    console.log('[import-registry] DRY mode — no writes.');
    return;
  }

  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: PROJECT_ID,
  });
  const db = admin.firestore();

  let dernekWritten = 0;
  let vakifWritten = 0;
  if (dernekler.records.length > 0) dernekWritten = await writeDernekler(db, dernekler.records);
  if (vakiflar.records.length > 0) vakifWritten = await writeVakiflar(db, vakiflar.records);

  console.log(
    `[import-registry] done. dernekler written=${dernekWritten}/${dernekler.records.length}, vakiflar written=${vakifWritten}/${vakiflar.records.length}`,
  );
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('[import-registry] FAILED:', err.message);
    process.exit(1);
  });
