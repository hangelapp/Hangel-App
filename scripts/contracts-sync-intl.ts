/**
 * contracts-sync-intl.ts
 *
 * Sync international (non-TR/non-EU) contract markdowns from `docs/contracts/`
 * to Firestore `contracts/{slug}` documents.
 *
 * Slugs covered:
 *   - uk-privacy-policy                → jurisdictions: ['UK']
 *   - us-california-privacy-notice     → ['US-CA']
 *   - us-coppa-notice                  → ['US']
 *   - ca-pipeda-privacy-policy         → ['CA', 'CA-QC']
 *   - au-privacy-act                   → ['AU']
 *   - jp-appi-privacy                  → ['JP']
 *   - br-lgpd-privacy                  → ['BR']
 *   - ch-revfadp                       → ['CH']
 *   - sg-pdpa-privacy                  → ['SG']
 *   - ae-pdpl                          → ['AE']
 *   - sa-pdpl                          → ['SA']
 *
 * Usage:
 *   # DRY RUN — first 3 docs, no writes
 *   npx tsx scripts/contracts-sync-intl.ts --dry-run --limit 3
 *
 *   # FULL DRY RUN (no limit)
 *   npx tsx scripts/contracts-sync-intl.ts --dry-run
 *
 *   # APPLY — writes to Firestore
 *   GOOGLE_APPLICATION_CREDENTIALS=./hangel-sa.json \
 *     npx tsx scripts/contracts-sync-intl.ts --apply
 *
 * Idempotent: uses `set` with merge=true, so re-running is safe.
 * Title is taken from the first H1 in the markdown. Content is the raw
 * markdown text. SHA-256 hash is written to `hash` field for audit.
 */
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { createHash } from 'crypto';
import { initializeApp, applicationDefault, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue, type Firestore } from 'firebase-admin/firestore';

type IntlContract = {
  slug: string;
  filename: string;
  jurisdictions: string[];
  country: string;
  language: string;
  kind: 'privacy';
};

const CONTRACTS: IntlContract[] = [
  // Existing markdowns
  { slug: 'uk-privacy-policy',           filename: 'uk-privacy-policy.md',           jurisdictions: ['UK'],         country: 'GB', language: 'en', kind: 'privacy' },
  { slug: 'us-california-privacy-notice', filename: 'us-california-privacy-notice.md', jurisdictions: ['US-CA'],      country: 'US', language: 'en', kind: 'privacy' },
  { slug: 'us-coppa-notice',             filename: 'us-coppa-notice.md',             jurisdictions: ['US'],         country: 'US', language: 'en', kind: 'privacy' },
  // Newly authored markdowns
  { slug: 'ca-pipeda-privacy-policy',    filename: 'ca-pipeda-privacy-policy.md',    jurisdictions: ['CA', 'CA-QC'], country: 'CA', language: 'en', kind: 'privacy' },
  { slug: 'au-privacy-act',              filename: 'au-privacy-act.md',              jurisdictions: ['AU'],         country: 'AU', language: 'en', kind: 'privacy' },
  { slug: 'jp-appi-privacy',             filename: 'jp-appi-privacy.md',             jurisdictions: ['JP'],         country: 'JP', language: 'en', kind: 'privacy' },
  { slug: 'br-lgpd-privacy',             filename: 'br-lgpd-privacy.md',             jurisdictions: ['BR'],         country: 'BR', language: 'pt', kind: 'privacy' },
  { slug: 'ch-revfadp',                  filename: 'ch-revfadp.md',                  jurisdictions: ['CH'],         country: 'CH', language: 'de', kind: 'privacy' },
  { slug: 'sg-pdpa-privacy',             filename: 'sg-pdpa-privacy.md',             jurisdictions: ['SG'],         country: 'SG', language: 'en', kind: 'privacy' },
  { slug: 'ae-pdpl',                     filename: 'ae-pdpl.md',                     jurisdictions: ['AE'],         country: 'AE', language: 'en', kind: 'privacy' },
  { slug: 'sa-pdpl',                     filename: 'sa-pdpl.md',                     jurisdictions: ['SA'],         country: 'SA', language: 'en', kind: 'privacy' },
];

const COLLECTION = 'contracts';
const VERSION = '1.0';
const CONTRACTS_DIR = join(process.cwd(), 'docs', 'contracts');

const args = process.argv.slice(2);
const isApply = args.includes('--apply');
const isDryRun = !isApply || args.includes('--dry-run');
const limitArgIdx = args.indexOf('--limit');
const limit = limitArgIdx >= 0 && args[limitArgIdx + 1] ? parseInt(args[limitArgIdx + 1], 10) : undefined;

function extractTitle(md: string, fallback: string): string {
  const m = md.match(/^#\s+(.+?)\s*$/m);
  return m ? m[1].trim() : fallback;
}

function sha256(s: string): string {
  return createHash('sha256').update(s, 'utf8').digest('hex');
}

async function main() {
  console.log('---');
  console.log(`hangel — contracts-sync-intl`);
  console.log(`Mode:      ${isApply ? 'APPLY (writing to Firestore)' : 'DRY RUN (no writes)'}`);
  console.log(`Limit:     ${limit ?? 'none'}`);
  console.log(`Source:    ${CONTRACTS_DIR}`);
  console.log(`Target:    Firestore collection \`${COLLECTION}\``);
  console.log('---');

  const targets = typeof limit === 'number' ? CONTRACTS.slice(0, limit) : CONTRACTS;

  // Validate all files exist before doing anything
  const missing = targets.filter((c) => !existsSync(join(CONTRACTS_DIR, c.filename)));
  if (missing.length > 0) {
    console.error(`Missing markdown files:`);
    for (const m of missing) console.error(`  - ${m.filename}`);
    process.exit(1);
  }

  let db: Firestore | null = null;
  if (isApply) {
    if (getApps().length === 0) {
      const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
      if (credPath) {
        initializeApp({ credential: cert(credPath) });
      } else {
        initializeApp({ credential: applicationDefault() });
      }
    }
    db = getFirestore();
  }

  let writes = 0;
  for (const c of targets) {
    const path = join(CONTRACTS_DIR, c.filename);
    const content = readFileSync(path, 'utf8');
    const title = extractTitle(content, c.slug);
    const hash = sha256(content);
    const wordCount = content.trim().split(/\s+/).length;

    const payload = {
      slug: c.slug,
      title,
      content,
      version: VERSION,
      status: 'taslak' as const,
      kind: c.kind,
      jurisdictions: c.jurisdictions,
      country: c.country,
      language: c.language,
      hash,
      wordCount,
      source: 'markdown-intl-sync',
      updatedAt: isApply ? FieldValue.serverTimestamp() : new Date().toISOString(),
    };

    console.log(`[${writes + 1}/${targets.length}] ${c.slug}`);
    console.log(`    title:         ${title}`);
    console.log(`    jurisdictions: ${JSON.stringify(c.jurisdictions)}`);
    console.log(`    country:       ${c.country}`);
    console.log(`    language:      ${c.language}`);
    console.log(`    words:         ${wordCount}`);
    console.log(`    sha256:        ${hash.slice(0, 16)}…`);

    if (isApply && db) {
      await db.collection(COLLECTION).doc(c.slug).set(payload, { merge: true });
      console.log(`    ✓ written to ${COLLECTION}/${c.slug}`);
    } else {
      console.log(`    (dry-run — no write)`);
    }
    writes++;
  }

  console.log('---');
  console.log(`Done. ${isApply ? 'Wrote' : 'Would write'} ${writes} document(s).`);
}

main().catch((err) => {
  console.error('contracts-sync-intl FAILED:', err);
  process.exit(1);
});
