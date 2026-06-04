/**
 * scripts/contracts-rescore-all.ts
 *
 * Re-score every contract × every jurisdiction (144 × 12 = 1728 docs) using the
 * deterministic compliance engine. Designed to run after Phase 1 fills missing
 * templates in contract content.
 *
 * Algoritma:
 *   1. Firestore `contracts` koleksiyonundan tüm dokümanları çek (~144 adet).
 *   2. Her contract için `scoreContractAllJurisdictions(content)` çağır — 12
 *      jurisdiction için tek seferde skor üretir.
 *   3. `contractCompliance/{slug}__{jurisdiction}` dokümanlarına batched write.
 *      Firestore batch limiti 500 op; 41 batch ile bitirir.
 *   4. Özet metrikleri konsola yazar ve script output'u olarak döner:
 *        - scoresWritten
 *        - averageScorePerJurisdiction (per jurisdiction global avg)
 *        - contractsAboveNinetyOnDeclared (declared jurisdiction'larda avg ≥ 90)
 *        - perContract.declaredAverage map (her contract için declared juris avg)
 *
 * Usage:
 *   GOOGLE_APPLICATION_CREDENTIALS=/abs/path/sa.json \
 *     npx tsx scripts/contracts-rescore-all.ts [--dry-run] [--out=path.json]
 *
 * Flags:
 *   --dry-run     Yazma yap, sadece terminal'e özet bas.
 *   --out=<path>  Özet JSON çıktısını dosyaya yaz (parent agent tarafından okunur).
 */
import fs from 'node:fs';
import path from 'node:path';
import { initializeApp, applicationDefault, cert, getApps } from 'firebase-admin/app';
import { getFirestore, type WriteBatch } from 'firebase-admin/firestore';

import {
  buildComplianceDocId,
  COMPLIANCE_JURISDICTIONS,
  type ComplianceJurisdiction,
} from '../src/lib/contracts/compliance-types';
import { scoreContractAllJurisdictions } from '../src/lib/contracts/compliance-engine';

const CONTRACTS_COLLECTION = 'contracts';
const CONTRACT_COMPLIANCE_COLLECTION = 'contractCompliance';
const FIRESTORE_BATCH_LIMIT = 500;

interface CliArgs {
  dryRun: boolean;
  outPath: string | null;
}

function parseArgs(argv: string[]): CliArgs {
  let dryRun = false;
  let outPath: string | null = null;
  for (const a of argv.slice(2)) {
    if (a === '--dry-run') dryRun = true;
    else if (a.startsWith('--out=')) outPath = a.slice('--out='.length).trim() || null;
  }
  return { dryRun, outPath };
}

function stripHtml(s: string): string {
  return s
    .replace(/<\/(p|div|h[1-6]|li|tr|td|th|br)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/[ \t]+/g, ' ');
}

function initAdmin(): void {
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
 * Yalnızca 12 resmi jurisdiction kodundan biri olan, contract'ın
 * `jurisdictions` array'inde declared edilmiş kodları döner.
 */
function extractDeclaredJurisdictions(data: Record<string, unknown>): ComplianceJurisdiction[] {
  const raw = data.jurisdictions;
  if (!Array.isArray(raw)) return [];
  const official = new Set<string>(COMPLIANCE_JURISDICTIONS as readonly string[]);
  const out = new Set<ComplianceJurisdiction>();
  for (const j of raw) {
    if (typeof j !== 'string') continue;
    if (official.has(j)) out.add(j as ComplianceJurisdiction);
  }
  return Array.from(out);
}

interface PerContractResult {
  slug: string;
  declaredJurisdictions: ComplianceJurisdiction[];
  /** Her jurisdiction için skor (0-100). */
  scoresByJurisdiction: Record<string, number>;
  /** Declared jurisdiction'lar üzerinden hesaplanan ortalama. UI headline. */
  declaredAverage: number;
  /** Tüm 12 jurisdiction üzerinden ortalama. */
  overallAverage: number;
  min: number;
  max: number;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv);
  console.log('[contracts-rescore-all] başlıyor', {
    dryRun: args.dryRun,
    outPath: args.outPath,
    jurisdictions: COMPLIANCE_JURISDICTIONS.length,
  });

  initAdmin();
  const db = getFirestore();

  const startMs = Date.now();
  const contractsSnap = await db.collection(CONTRACTS_COLLECTION).get();

  if (contractsSnap.empty) {
    console.log('[contracts-rescore-all] contracts boş — çıkılıyor.');
    process.exit(0);
  }

  console.log(`[contracts-rescore-all] ${contractsSnap.size} contract bulundu.`);

  // Önce tüm skorları compute et, sonra batch flush'la.
  const perContract: PerContractResult[] = [];
  // Pending writes: (docId, score) pairs — Firestore batch limit'i için chunk'lanacak.
  const pendingWrites: Array<{ docId: string; payload: Record<string, unknown> }> = [];

  let totalSkipped = 0;
  const errors: string[] = [];

  for (const doc of contractsSnap.docs) {
    const data = doc.data() as Record<string, unknown>;
    const slug = typeof data.slug === 'string' && data.slug ? data.slug : doc.id;
    const rawContent = typeof data.content === 'string' ? data.content : '';

    if (rawContent.trim().length < 20) {
      console.warn(`[contracts-rescore-all] SKIP ${slug} (content çok kısa).`);
      totalSkipped += 1;
      continue;
    }

    const markdownish = /<\w+[^>]*>/.test(rawContent) ? stripHtml(rawContent) : rawContent;

    let scores;
    try {
      scores = scoreContractAllJurisdictions(slug, markdownish);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`${slug}: scoring threw: ${msg}`);
      continue;
    }

    const declared = extractDeclaredJurisdictions(data);
    const scoresByJurisdiction: Record<string, number> = {};
    for (const s of scores) {
      scoresByJurisdiction[s.jurisdiction] = s.score;
      pendingWrites.push({
        docId: buildComplianceDocId(slug, s.jurisdiction),
        payload: { ...s, scoredBy: 'batch:contracts-rescore-all' },
      });
    }

    const allNums = scores.map(s => s.score);
    const declaredNums = declared.length === 0 ? [] : declared.map(j => scoresByJurisdiction[j] ?? 0);
    const declaredAvg = declaredNums.length === 0
      ? 0
      : Math.round(declaredNums.reduce((a, b) => a + b, 0) / declaredNums.length);
    const overallAvg = Math.round(allNums.reduce((a, b) => a + b, 0) / allNums.length);

    perContract.push({
      slug,
      declaredJurisdictions: declared,
      scoresByJurisdiction,
      declaredAverage: declaredAvg,
      overallAverage: overallAvg,
      min: Math.min(...allNums),
      max: Math.max(...allNums),
    });
  }

  // ----- Flush phase: 500'lük chunk'larda batch commit. -----
  let totalWritten = 0;
  if (!args.dryRun && pendingWrites.length > 0) {
    let batch: WriteBatch = db.batch();
    let opsInBatch = 0;
    let batchIndex = 0;

    const flush = async (): Promise<void> => {
      if (opsInBatch === 0) return;
      try {
        await batch.commit();
        totalWritten += opsInBatch;
        batchIndex += 1;
        if (batchIndex % 5 === 0 || opsInBatch < FIRESTORE_BATCH_LIMIT) {
          console.log(`[contracts-rescore-all] batch ${batchIndex} commit (${opsInBatch} ops, total written: ${totalWritten}).`);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`batch ${batchIndex + 1} commit failed: ${msg}`);
      }
      batch = db.batch();
      opsInBatch = 0;
    };

    for (const write of pendingWrites) {
      const ref = db.collection(CONTRACT_COMPLIANCE_COLLECTION).doc(write.docId);
      batch.set(ref, write.payload, { merge: false });
      opsInBatch += 1;
      if (opsInBatch >= FIRESTORE_BATCH_LIMIT) {
        await flush();
      }
    }
    await flush();
  } else if (args.dryRun) {
    totalWritten = 0;
    console.log(`[contracts-rescore-all] DRY-RUN: ${pendingWrites.length} doc yazılacaktı.`);
  }

  const elapsedSec = Math.round((Date.now() - startMs) / 1000);

  // ----- Aggregate metrics. -----
  // 1) Average score per jurisdiction (12 değer).
  const averageScorePerJurisdiction: Record<string, number> = {};
  for (const j of COMPLIANCE_JURISDICTIONS) {
    const nums: number[] = [];
    for (const c of perContract) {
      const v = c.scoresByJurisdiction[j];
      if (typeof v === 'number') nums.push(v);
    }
    averageScorePerJurisdiction[j] = nums.length === 0
      ? 0
      : Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
  }

  // 2) Contracts above 90% on their declared jurisdictions.
  const contractsAboveNinetyOnDeclared = perContract.filter(
    c => c.declaredJurisdictions.length > 0 && c.declaredAverage >= 90,
  ).length;

  // 3) Headline UI %: per-contract declared average.
  const declaredAverageMap: Record<string, number> = {};
  for (const c of perContract) declaredAverageMap[c.slug] = c.declaredAverage;

  // 4) Critical: en düşük 10 declared average.
  const ranked = perContract
    .filter(c => c.declaredJurisdictions.length > 0)
    .sort((a, b) => a.declaredAverage - b.declaredAverage);
  const lowestTen = ranked.slice(0, 10);
  const highestTen = ranked.slice(-10).reverse();

  console.log('[contracts-rescore-all] tamamlandı', {
    contractsProcessed: perContract.length,
    skipped: totalSkipped,
    docsWritten: totalWritten,
    pendingWriteCount: pendingWrites.length,
    elapsedSec,
    errors: errors.length,
  });
  console.log('[contracts-rescore-all] AVG per jurisdiction:', averageScorePerJurisdiction);
  console.log(`[contracts-rescore-all] Declared avg >= 90%: ${contractsAboveNinetyOnDeclared} / ${perContract.length} contract.`);
  console.log('[contracts-rescore-all] En düşük 10 declared avg:');
  for (const r of lowestTen) {
    console.log(`  - ${r.slug}: declaredAvg=${r.declaredAverage} (declared=${r.declaredJurisdictions.join(',') || '∅'}) overall=${r.overallAverage}`);
  }
  console.log('[contracts-rescore-all] En yüksek 10 declared avg:');
  for (const r of highestTen) {
    console.log(`  - ${r.slug}: declaredAvg=${r.declaredAverage} (declared=${r.declaredJurisdictions.join(',') || '∅'}) overall=${r.overallAverage}`);
  }
  if (errors.length > 0) {
    console.log('[contracts-rescore-all] HATALAR:');
    for (const e of errors) console.log(`  - ${e}`);
  }

  // ----- Persist summary JSON (parent agent reads bundan). -----
  if (args.outPath) {
    const summary = {
      scoresWritten: totalWritten,
      contractsProcessed: perContract.length,
      skipped: totalSkipped,
      pendingWriteCount: pendingWrites.length,
      averageScorePerJurisdiction,
      contractsAboveNinetyOnDeclared,
      declaredAverageMap,
      lowestTenDeclared: lowestTen.map(r => ({
        slug: r.slug,
        declaredAverage: r.declaredAverage,
        declaredJurisdictions: r.declaredJurisdictions,
        overallAverage: r.overallAverage,
      })),
      highestTenDeclared: highestTen.map(r => ({
        slug: r.slug,
        declaredAverage: r.declaredAverage,
        declaredJurisdictions: r.declaredJurisdictions,
        overallAverage: r.overallAverage,
      })),
      errors,
      elapsedSec,
      dryRun: args.dryRun,
      generatedAt: new Date().toISOString(),
    };
    fs.writeFileSync(args.outPath, JSON.stringify(summary, null, 2));
    console.log(`[contracts-rescore-all] özet yazıldı → ${args.outPath}`);
  }

  process.exit(0);
}

main().catch(err => {
  console.error('[contracts-rescore-all] Beklenmeyen hata:', err);
  process.exit(1);
});
