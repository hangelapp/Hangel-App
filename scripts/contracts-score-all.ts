/**
 * scripts/contracts-score-all.ts
 *
 * Tüm `contracts` koleksiyonunu tarar; her doc için her 12 jurisdiction'a
 * rule-based ComplianceScore üretir; `contractCompliance` koleksiyonuna yazar.
 *
 * Beklenen hacim: ~63 sözleşme × 12 jurisdiction ≈ 756 doc, 5-10 dakika.
 * LLM çağrısı yapmaz, deterministik.
 *
 * Usage:
 *   GOOGLE_APPLICATION_CREDENTIALS=/abs/path/to/service-account.json \
 *     npx tsx scripts/contracts-score-all.ts [--dry-run] [--slug=<slug>]
 *
 * Flags:
 *   --dry-run         Hiçbir şey yazma, sadece terminal'e özet bas.
 *   --slug=<slug>     Yalnızca tek bir slug için skor üret (debug için).
 *   --min-len=<n>     Bu uzunluğun altındaki contract'ları atla (default: 20).
 *
 * Exit codes:
 *   0 success
 *   1 herhangi bir hata (env, admin SDK, write)
 */
import { initializeApp, applicationDefault, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

import {
  buildComplianceDocId,
  COMPLIANCE_JURISDICTIONS,
} from '../src/lib/contracts/compliance-types';
import { scoreContractAllJurisdictions } from '../src/lib/contracts/compliance-engine';

// `COLLECTIONS` import zinciri Next/Firebase client kodlarını çekebileceğinden,
// burada string literal sabitlerle çalışıyoruz.
const CONTRACTS_COLLECTION = 'contracts';
const CONTRACT_COMPLIANCE_COLLECTION = 'contractCompliance';

interface CliArgs {
  dryRun: boolean;
  slugFilter: string | null;
  minLen: number;
}

function parseArgs(argv: string[]): CliArgs {
  let dryRun = false;
  let slugFilter: string | null = null;
  let minLen = 20;
  for (const a of argv.slice(2)) {
    if (a === '--dry-run') dryRun = true;
    else if (a.startsWith('--slug=')) slugFilter = a.slice('--slug='.length).trim() || null;
    else if (a.startsWith('--min-len=')) {
      const n = Number(a.slice('--min-len='.length));
      if (Number.isFinite(n) && n > 0) minLen = Math.floor(n);
    }
  }
  return { dryRun, slugFilter, minLen };
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

async function main(): Promise<void> {
  const credsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!credsPath || credsPath.trim() === '') {
    console.error('[contracts-score-all] HATA: GOOGLE_APPLICATION_CREDENTIALS tanımlı değil.');
    process.exit(1);
  }

  const args = parseArgs(process.argv);
  console.log('[contracts-score-all] başlıyor', {
    dryRun: args.dryRun,
    slugFilter: args.slugFilter,
    minLen: args.minLen,
    jurisdictions: COMPLIANCE_JURISDICTIONS.length,
  });

  if (getApps().length === 0) {
    initializeApp({ credential: applicationDefault() });
  }
  const db = getFirestore();

  const startMs = Date.now();
  const contractsSnap = args.slugFilter
    ? await db.collection(CONTRACTS_COLLECTION).where('slug', '==', args.slugFilter).get()
    : await db.collection(CONTRACTS_COLLECTION).get();

  if (contractsSnap.empty) {
    console.log('[contracts-score-all] eşleşen contract yok — çıkılıyor.');
    process.exit(0);
  }

  let totalDocsWritten = 0;
  let totalContractsProcessed = 0;
  let totalSkipped = 0;
  const perContractSummary: Array<{ slug: string; avg: number; min: number; max: number }> = [];

  for (const doc of contractsSnap.docs) {
    const data = doc.data() as { slug?: string; content?: string; title?: string };
    const slug = typeof data.slug === 'string' && data.slug ? data.slug : doc.id;
    const rawContent = typeof data.content === 'string' ? data.content : '';
    if (rawContent.trim().length < args.minLen) {
      console.warn(`[contracts-score-all] SKIP ${slug} (content uzunluğu < ${args.minLen}).`);
      totalSkipped += 1;
      continue;
    }

    const markdownish = /<\w+[^>]*>/.test(rawContent) ? stripHtml(rawContent) : rawContent;
    const scores = scoreContractAllJurisdictions(slug, markdownish);

    if (!args.dryRun) {
      // Firestore batch'i 500 op limitlidir; 12 yazımda sığar.
      const batch = db.batch();
      for (const score of scores) {
        const ref = db
          .collection(CONTRACT_COMPLIANCE_COLLECTION)
          .doc(buildComplianceDocId(slug, score.jurisdiction));
        batch.set(ref, { ...score, scoredBy: 'batch:contracts-score-all' }, { merge: false });
      }
      await batch.commit();
    }
    totalDocsWritten += scores.length;
    totalContractsProcessed += 1;

    const nums = scores.map(s => s.score);
    perContractSummary.push({
      slug,
      avg: Math.round(nums.reduce((a, b) => a + b, 0) / nums.length),
      min: Math.min(...nums),
      max: Math.max(...nums),
    });

    if (totalContractsProcessed % 10 === 0) {
      console.log(`[contracts-score-all] ilerleme: ${totalContractsProcessed}/${contractsSnap.size} contract işlendi.`);
    }
  }

  const elapsedSec = Math.round((Date.now() - startMs) / 1000);
  console.log('[contracts-score-all] tamamlandı', {
    contractsProcessed: totalContractsProcessed,
    skipped: totalSkipped,
    docsWritten: args.dryRun ? 0 : totalDocsWritten,
    docsWouldWrite: args.dryRun ? totalDocsWritten : undefined,
    elapsedSec,
  });

  // En kritik 10 contract: en düşük ortalama skor.
  perContractSummary.sort((a, b) => a.avg - b.avg);
  console.log('[contracts-score-all] En düşük 10 ortalama skor:');
  for (const row of perContractSummary.slice(0, 10)) {
    console.log(`  - ${row.slug}: avg=${row.avg} min=${row.min} max=${row.max}`);
  }

  process.exit(0);
}

main().catch(err => {
  console.error('[contracts-score-all] Beklenmeyen hata:', err);
  process.exit(1);
});
