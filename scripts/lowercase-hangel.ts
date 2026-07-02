/**
 * lowercase-hangel.ts — "Hangel" → "hangel" enforcement
 *
 * USER PREFERENCE: kullanıcıya gösterilen her metinde "hangel" lowercase.
 * Teknik identifier'lar (class names, bundle IDs, email domains) capitalize/
 * lowercase formlarını korur.
 *
 * Kapsam:
 *   1) Markdown: docs/contracts/*.md (word-boundary regex)
 *   2) Firestore contracts collection: content field (slug match)
 *
 * Dokunmadıkları:
 *   - Class names (HangelLogo, HangelApp, HangelService) — identifier
 *   - Bundle IDs (com.hangel.app) — zaten lowercase
 *   - Email domain (@hangel.org, @hangel.org) — zaten lowercase
 *   - Resmi şirket ünvanı (örn. "Hangel Teknoloji A.Ş.") — KORUR
 *
 * Çalıştırma:
 *   Dry-run:   npx tsx scripts/lowercase-hangel.ts
 *   Apply:     npx tsx scripts/lowercase-hangel.ts --apply
 *   Sadece md: npx tsx scripts/lowercase-hangel.ts --apply --md-only
 *   Sadece fs: GOOGLE_APPLICATION_CREDENTIALS=./hangel-sa.json npx tsx scripts/lowercase-hangel.ts --apply --firestore-only
 */
import fs from 'node:fs';
import path from 'node:path';
import { initializeApp, applicationDefault, cert, getApps } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

const APPLY = process.argv.includes('--apply');
const MD_ONLY = process.argv.includes('--md-only');
const FIRESTORE_ONLY = process.argv.includes('--firestore-only');

const DOCS_ROOT = path.join(process.cwd(), 'docs', 'contracts');

// Lines that should KEEP "Hangel" (resmi ünvan placeholder vs.).
// KVKK aydınlatma'da "[resmi ünvan placeholder — ör. Hangel Teknoloji A.Ş. / Hangel Derneği]"
// — placeholder içindeki "Hangel" resmi ünvanın parçası olduğundan korunur.
const PRESERVE_LINE_PATTERNS: RegExp[] = [
  /resmi ünvan placeholder/i,
  /A\.Ş\./, // resmi ünvan içeriyorsa korunur
  /Anonim Şirketi/i,
];

// Kelime sınırı: tek başına "Hangel" yakala — "HangelLogo", "HangelApp" gibi
// identifier'lara dokunma. JavaScript \b ASCII tabanlı; "Hangel" sonrası
// büyük harf gelirse \b match etmez (örn. HangelLogo) — istediğimiz davranış.
const HANGEL_RE = /\bHangel\b/g;

function shouldPreserveLine(line: string): boolean {
  return PRESERVE_LINE_PATTERNS.some((re) => re.test(line));
}

function transformContent(raw: string): { out: string; replaced: number } {
  let replaced = 0;
  const lines = raw.split('\n');
  const outLines = lines.map((line) => {
    if (shouldPreserveLine(line)) return line;
    return line.replace(HANGEL_RE, () => {
      replaced++;
      return 'hangel';
    });
  });
  return { out: outLines.join('\n'), replaced };
}

function countViolations(raw: string): number {
  let count = 0;
  for (const line of raw.split('\n')) {
    if (shouldPreserveLine(line)) continue;
    const m = line.match(HANGEL_RE);
    if (m) count += m.length;
  }
  return count;
}

interface MdResult {
  file: string;
  before: number;
  after: number;
  replaced: number;
}

async function processMarkdown(): Promise<MdResult[]> {
  const results: MdResult[] = [];
  if (!fs.existsSync(DOCS_ROOT)) {
    console.warn(`⚠️  ${DOCS_ROOT} yok — markdown adımı atlanıyor.`);
    return results;
  }
  const files = fs.readdirSync(DOCS_ROOT).filter((f) => f.endsWith('.md'));
  for (const f of files) {
    const full = path.join(DOCS_ROOT, f);
    const raw = fs.readFileSync(full, 'utf8');
    const before = countViolations(raw);
    if (before === 0) continue;
    const { out, replaced } = transformContent(raw);
    const after = countViolations(out);
    results.push({ file: f, before, after, replaced });
    if (APPLY) {
      fs.writeFileSync(full, out, 'utf8');
    }
  }
  return results;
}

function initFirestore(): Firestore | null {
  if (!getApps().length) {
    try {
      const credsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
      if (credsPath && fs.existsSync(credsPath)) {
        initializeApp({ credential: cert(credsPath) });
      } else {
        initializeApp({ credential: applicationDefault() });
      }
    } catch (err) {
      console.warn('⚠️  Firebase admin init başarısız:', (err as Error).message);
      return null;
    }
  }
  try {
    return getFirestore();
  } catch {
    return null;
  }
}

interface FsResult {
  slug: string;
  before: number;
  after: number;
  replaced: number;
}

async function processFirestore(): Promise<FsResult[]> {
  const results: FsResult[] = [];
  const db = initFirestore();
  if (!db) {
    console.warn('⚠️  Firestore client kullanılamıyor — atlanıyor.');
    return results;
  }
  let snap;
  try {
    snap = await db.collection('contracts').get();
  } catch (err) {
    console.warn('⚠️  contracts collection okunamadı:', (err as Error).message);
    return results;
  }
  for (const doc of snap.docs) {
    const data = doc.data();
    const content = typeof data.content === 'string' ? data.content : '';
    if (!content) continue;
    const before = countViolations(content);
    if (before === 0) continue;
    const { out, replaced } = transformContent(content);
    const after = countViolations(out);
    results.push({ slug: doc.id, before, after, replaced });
    if (APPLY) {
      await doc.ref.set({ content: out, updatedAt: new Date().toISOString() }, { merge: true });
    }
  }
  return results;
}

(async () => {
  console.log(`\n=== lowercase-hangel.ts ${APPLY ? '(APPLY)' : '(DRY RUN)'} ===\n`);

  let mdResults: MdResult[] = [];
  let fsResults: FsResult[] = [];

  if (!FIRESTORE_ONLY) {
    mdResults = await processMarkdown();
    console.log('Markdown:');
    if (mdResults.length === 0) {
      console.log('  (no changes needed)');
    } else {
      for (const r of mdResults) {
        console.log(`  ${r.file}: ${r.before} → ${r.after} (replaced ${r.replaced})`);
      }
      const total = mdResults.reduce((a, r) => a + r.replaced, 0);
      console.log(`  TOTAL replacements: ${total} in ${mdResults.length} files`);
    }
  }

  if (!MD_ONLY) {
    console.log('\nFirestore (contracts collection):');
    fsResults = await processFirestore();
    if (fsResults.length === 0) {
      console.log('  (no changes needed or Firestore unavailable)');
    } else {
      for (const r of fsResults) {
        console.log(`  ${r.slug}: ${r.before} → ${r.after} (replaced ${r.replaced})`);
      }
      const total = fsResults.reduce((a, r) => a + r.replaced, 0);
      console.log(`  TOTAL replacements: ${total} in ${fsResults.length} docs`);
    }
  }

  console.log(`\n${APPLY ? '✅ APPLIED' : 'ℹ️  Dry run — use --apply to write.'}\n`);
  process.exit(0);
})().catch((err) => {
  console.error('❌', err);
  process.exit(1);
});
