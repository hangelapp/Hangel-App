/**
 * scripts/contracts-fill-templates.mjs
 *
 * Tüm `contracts` koleksiyonundaki sözleşmelerde EKSİK olan zorunlu uyum
 * konularını tespit eder ve her eksik topic'in `template` metnini contract
 * `content` alanına APPEND eder. Updated content Firestore'a geri yazılır.
 *
 * Algoritma:
 *   1. Contract'ı oku.
 *   2. `jurisdictions` array'ini parse et; sadece 12 resmi jurisdiction'dan
 *      birini içeren entry'ler kabul edilir (TR-bridge, US-OTHER, OTHER vb.
 *      atılır).
 *   3. Her geçerli jurisdiction için `scoreContract(...)` ile eksik topic'leri
 *      bul.
 *   4. Eksik topic'lerin `template` alanlarını sıralı şekilde mevcut content'e
 *      `\n\n` ile ayrılmış olarak ekle (içerik içinde aynı template zaten
 *      varsa atla — idempotent davranış için).
 *   5. Değişiklik varsa:
 *      contracts/{id}.update({ content, lastReviewedAt, lastReviewedBy }).
 *
 * Usage:
 *   GOOGLE_APPLICATION_CREDENTIALS=/abs/path/sa.json \
 *     npx tsx scripts/contracts-fill-templates.mjs [--dry-run] [--slug=<slug>]
 *
 * Flags:
 *   --dry-run         Hiçbir şey yazma; terminal'e özet bas.
 *   --slug=<slug>     Yalnızca tek bir slug için çalış (debug).
 *
 * NOT: Bu script TypeScript modülünü (`compliance-engine.ts`) `import` ettiği
 * için Node doğrudan çalıştıramaz; `tsx` loader gereklidir. `.mjs` uzantısı
 * `package.json` ESM kuralları korunarak tsx ile çalışsın diye kullanılıyor.
 */

import fs from 'node:fs';
import path from 'node:path';
import { initializeApp, applicationDefault, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

// Dynamic import for TS modules — tsx loader transpiles, ama Node 24'ün strict
// ESM resolver'ı static `import { ... } from '../foo.ts'` ile uyumsuz. Dynamic
// `await import()` çağrısı tsx ile çalışır.
const enginePromise = import('../src/lib/contracts/compliance-engine.ts');
const typesPromise = import('../src/lib/contracts/compliance-types.ts');
const { scoreContract, REQUIRED_TOPICS_EXPORT } = await enginePromise;
const { COMPLIANCE_JURISDICTIONS } = await typesPromise;

const CONTRACTS_COLLECTION = 'contracts';
const REVIEWED_BY = 'compliance-fill-script';

/**
 * Hangi jurisdiction kodlarının resmi (scoring engine kapsamında) olduğunu
 * O(1) kontrol etmek için Set'e çevir.
 */
const OFFICIAL_JURISDICTIONS = new Set(COMPLIANCE_JURISDICTIONS);

function parseArgs(argv) {
  let dryRun = false;
  let slugFilter = null;
  for (const a of argv.slice(2)) {
    if (a === '--dry-run') dryRun = true;
    else if (a.startsWith('--slug=')) slugFilter = a.slice('--slug='.length).trim() || null;
  }
  return { dryRun, slugFilter };
}

function initAdmin() {
  if (getApps().length > 0) return;
  const credsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (credsPath && fs.existsSync(credsPath)) {
    const sa = JSON.parse(fs.readFileSync(credsPath, 'utf8'));
    initializeApp({ credential: cert(sa), projectId: sa.project_id });
    return;
  }
  const local = path.join(process.cwd(), '.firebase-service-account.json');
  if (fs.existsSync(local)) {
    const sa = JSON.parse(fs.readFileSync(local, 'utf8'));
    initializeApp({ credential: cert(sa), projectId: sa.project_id });
    return;
  }
  initializeApp({ credential: applicationDefault() });
}

/**
 * Bir contract data'sından geçerli (12 resmi jurisdiction'dan biri olan)
 * jurisdiction kodlarının deduplicated array'ini döner. Tanımsız / yanlış
 * formatlı entry'ler atılır.
 */
function extractDeclaredJurisdictions(data) {
  const raw = data?.jurisdictions;
  if (!Array.isArray(raw)) return [];
  const out = new Set();
  for (const j of raw) {
    if (typeof j !== 'string') continue;
    if (OFFICIAL_JURISDICTIONS.has(j)) out.add(j);
  }
  return Array.from(out);
}

/**
 * Eksik topic'lerin template'lerini mevcut content'e append eder.
 * Aynı template content içinde zaten varsa atlanır → script tekrar
 * çalıştırılabilir (idempotent).
 *
 * Dönüş: { newContent, appendedCount }
 */
function appendMissingTemplates(content, jurisdictions, slug) {
  let working = typeof content === 'string' ? content : '';
  let appendedCount = 0;
  const seenTopicKeys = new Set(); // jurisdiction:topic kombinasyonu — aynı topic farklı jurisdiction altında 2x sayılmasın

  for (const j of jurisdictions) {
    const score = scoreContract(slug, working, j);
    const topicsByJurisdiction = REQUIRED_TOPICS_EXPORT[j];
    if (!Array.isArray(topicsByJurisdiction)) continue;
    const topicMap = new Map(topicsByJurisdiction.map(t => [t.topic, t]));

    for (const missing of score.missingSections) {
      const key = `${j}:${missing.topic}`;
      if (seenTopicKeys.has(key)) continue;
      seenTopicKeys.add(key);

      const topicDef = topicMap.get(missing.topic);
      if (!topicDef || typeof topicDef.template !== 'string' || !topicDef.template.trim()) continue;

      // Idempotency: aynı template zaten içerikte varsa append etme.
      // Template başlığı (## ...) genelde tek satır; full template'i substring
      // olarak ara.
      if (working.includes(topicDef.template.trim())) continue;

      working = working.length === 0
        ? topicDef.template
        : `${working.trimEnd()}\n\n${topicDef.template}`;
      appendedCount += 1;
    }
  }

  return { newContent: working, appendedCount };
}

async function main() {
  const args = parseArgs(process.argv);
  console.log('[contracts-fill-templates] başlıyor', {
    dryRun: args.dryRun,
    slugFilter: args.slugFilter,
    officialJurisdictions: COMPLIANCE_JURISDICTIONS.length,
  });

  initAdmin();
  const db = getFirestore();

  const startMs = Date.now();
  const contractsSnap = args.slugFilter
    ? await db.collection(CONTRACTS_COLLECTION).where('slug', '==', args.slugFilter).get()
    : await db.collection(CONTRACTS_COLLECTION).get();

  if (contractsSnap.empty) {
    console.log('[contracts-fill-templates] eşleşen contract yok — çıkılıyor.');
    process.exit(0);
  }

  console.log(`[contracts-fill-templates] ${contractsSnap.size} contract bulundu.`);

  let contractsScanned = 0;
  let contractsUpdated = 0;
  let totalTopicsAppended = 0;
  let contractsSkippedNoJurisdiction = 0;
  let contractsAlreadyComplete = 0;
  const errors = [];
  const perContractSummary = [];

  for (const doc of contractsSnap.docs) {
    contractsScanned += 1;
    const data = doc.data();
    const slug = typeof data?.slug === 'string' && data.slug ? data.slug : doc.id;

    try {
      const declared = extractDeclaredJurisdictions(data);
      if (declared.length === 0) {
        contractsSkippedNoJurisdiction += 1;
        if (contractsScanned % 25 === 0) {
          console.log(`[contracts-fill-templates] ilerleme: ${contractsScanned}/${contractsSnap.size}`);
        }
        continue;
      }

      const originalContent = typeof data?.content === 'string' ? data.content : '';
      const { newContent, appendedCount } = appendMissingTemplates(originalContent, declared, slug);

      if (appendedCount === 0) {
        contractsAlreadyComplete += 1;
      } else {
        if (!args.dryRun) {
          await doc.ref.update({
            content: newContent,
            lastReviewedAt: FieldValue.serverTimestamp(),
            lastReviewedBy: REVIEWED_BY,
          });
        }
        contractsUpdated += 1;
        totalTopicsAppended += appendedCount;
        perContractSummary.push({ slug, declared, appendedCount });
      }
    } catch (err) {
      const msg = err && typeof err === 'object' && 'message' in err ? String(err.message) : String(err);
      errors.push(`${slug}: ${msg}`);
      console.error(`[contracts-fill-templates] HATA ${slug}:`, msg);
    }

    if (contractsScanned % 25 === 0) {
      console.log(`[contracts-fill-templates] ilerleme: ${contractsScanned}/${contractsSnap.size}`);
    }
  }

  const elapsedSec = Math.round((Date.now() - startMs) / 1000);
  console.log('[contracts-fill-templates] tamamlandı', {
    contractsScanned,
    contractsUpdated,
    totalTopicsAppended,
    contractsAlreadyComplete,
    contractsSkippedNoJurisdiction,
    errors: errors.length,
    elapsedSec,
    dryRun: args.dryRun,
  });

  // En çok template eklenen 10 contract — debug için.
  perContractSummary.sort((a, b) => b.appendedCount - a.appendedCount);
  console.log('[contracts-fill-templates] En çok template eklenen 10 contract:');
  for (const row of perContractSummary.slice(0, 10)) {
    console.log(`  - ${row.slug} (${row.declared.join(',')}): +${row.appendedCount} template`);
  }

  if (errors.length > 0) {
    console.log('[contracts-fill-templates] HATALAR:');
    for (const e of errors) console.log(`  - ${e}`);
    process.exit(1);
  }

  process.exit(0);
}

main().catch(err => {
  console.error('[contracts-fill-templates] Beklenmeyen hata:', err);
  process.exit(1);
});
