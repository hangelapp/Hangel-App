/**
 * contracts-master-sync.ts — docs/contracts/*.md → Firestore `contracts` collection
 *
 * - Tüm markdown dosyalarını taramak ve slug/title/content/jurisdiction/version/kind
 *   alanlarını otomatik infer ederek Firestore'a yazmak için kullanılır.
 * - Mevcut doc varsa version bump heuristiği ve merge uygular (override değil).
 * - "Hangel" → "hangel" lowercase enforcement yazmadan önce çalışır (markdown safe-line
 *   exception'larıyla aynı kurallar).
 * - Eksik field cleanup: jurisdictions, kind yoksa slug heuristic ile doldurur.
 *
 * Çalıştırma:
 *   Dry-run: npx tsx scripts/contracts-master-sync.ts
 *   Apply:   GOOGLE_APPLICATION_CREDENTIALS=./hangel-sa.json npx tsx scripts/contracts-master-sync.ts --apply
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { initializeApp, applicationDefault, cert, getApps } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

const APPLY = process.argv.includes('--apply');
const DOCS_ROOT = path.join(process.cwd(), 'docs', 'contracts');

// "Hangel" → "hangel" enforcement — lowercase-hangel.ts ile aynı kural.
const PRESERVE_LINE_PATTERNS: RegExp[] = [
  /resmi ünvan placeholder/i,
  /A\.Ş\./,
  /Anonim Şirketi/i,
];
const HANGEL_RE = /\bHangel\b/g;

function normalizeHangel(raw: string): string {
  return raw
    .split('\n')
    .map((line) => (PRESERVE_LINE_PATTERNS.some((re) => re.test(line)) ? line : line.replace(HANGEL_RE, 'hangel')))
    .join('\n');
}

interface FrontMatter {
  title?: string;
  version?: string;
  effectiveDate?: string;
  lastUpdated?: string;
  jurisdiction?: string;
  kind?: string;
}

function parseFrontMatter(raw: string): { fm: FrontMatter; body: string } {
  if (!raw.startsWith('---')) return { fm: {}, body: raw };
  const end = raw.indexOf('\n---', 3);
  if (end === -1) return { fm: {}, body: raw };
  const block = raw.slice(3, end).trim();
  const body = raw.slice(end + 4).replace(/^\s*\n/, '');
  const fm: Record<string, string> = {};
  for (const line of block.split('\n')) {
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
    if (key) fm[key] = value;
  }
  return { fm: fm as FrontMatter, body };
}

function inferTitle(body: string, slug: string): string {
  const m = body.match(/^#\s+(.+?)\s*$/m);
  if (m) return m[1].trim();
  return slug;
}

// Slug prefix → jurisdiction(s)
function inferJurisdictions(slug: string): string[] {
  if (slug.startsWith('tr-')) return ['TR'];
  if (slug.startsWith('eu-')) return ['EU'];
  if (slug.startsWith('uk-')) return ['UK'];
  if (slug.startsWith('us-california')) return ['US-CA'];
  if (slug.startsWith('us-')) return ['US-CA', 'US-OTHER'];
  if (slug.startsWith('de-')) return ['EU']; // Germany supplement → EU
  if (slug.startsWith('es-')) return ['EU'];
  if (slug.startsWith('fr-')) return ['EU'];
  if (slug.startsWith('it-')) return ['EU'];
  return ['OTHER'];
}

// Slug/title heuristic → kind
function inferKind(slug: string, title: string): 'policy' | 'contract' | 'beyan' | 'supplement' {
  const s = `${slug} ${title}`.toLowerCase();
  if (/(policy|politika|politikas|notice|statement|beyan|aydinlatma|aydınlatma)/.test(s)) return 'policy';
  if (/(supplement|dpia|compliance|act)/.test(s)) return 'supplement';
  if (/(sozlesme|sözleşme|agreement|terms|riza|rıza)/.test(s)) return 'contract';
  if (/(beyan)/.test(s)) return 'beyan';
  return 'policy';
}

function bumpPatch(version: string): string {
  const m = /^(\d+)(?:\.(\d+))?(?:\.(\d+))?$/.exec(version.trim());
  if (!m) return '1.0.1';
  const major = Number(m[1]);
  const minor = Number(m[2] ?? 0);
  const patch = Number(m[3] ?? 0);
  return `${major}.${minor}.${patch + 1}`;
}

function sha256(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex');
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

interface SyncRow {
  slug: string;
  status: 'create' | 'update' | 'skip' | 'cleanup';
  version: string;
  jurisdictions: string[];
  kind: string;
  hashChanged: boolean;
  fieldsAdded: string[];
}

(async () => {
  console.log(`\n=== contracts-master-sync.ts ${APPLY ? '(APPLY)' : '(DRY RUN)'} ===\n`);

  if (!fs.existsSync(DOCS_ROOT)) {
    console.error(`❌ ${DOCS_ROOT} yok.`);
    process.exit(1);
  }

  const files = fs.readdirSync(DOCS_ROOT).filter((f) => f.endsWith('.md'));
  console.log(`Found ${files.length} markdown files.\n`);

  const db = initFirestore();
  const rows: SyncRow[] = [];

  for (const file of files) {
    const slug = file.replace(/\.md$/, '');
    const raw = fs.readFileSync(path.join(DOCS_ROOT, file), 'utf8');
    const normalized = normalizeHangel(raw);
    const { fm, body } = parseFrontMatter(normalized);

    const title = fm.title || inferTitle(body, slug);
    const jurisdictions = fm.jurisdiction ? [fm.jurisdiction] : inferJurisdictions(slug);
    const primaryJurisdiction = jurisdictions[0];
    const kind = fm.kind || inferKind(slug, title);
    const inferredVersion = fm.version || '1.0';
    const content = normalized;
    const contentHash = sha256(content);

    let existing: Record<string, unknown> | null = null;
    if (db) {
      try {
        const snap = await db.collection('contracts').doc(slug).get();
        if (snap.exists) existing = snap.data() as Record<string, unknown>;
      } catch (err) {
        // Continue offline.
        existing = null;
      }
    }

    const prevHash = typeof existing?.hash === 'string' ? (existing.hash as string) : undefined;
    const prevVersion = typeof existing?.version === 'string' ? (existing.version as string) : undefined;
    const hashChanged = prevHash !== contentHash;
    const newVersion = existing && hashChanged ? bumpPatch(prevVersion || inferredVersion) : (prevVersion || inferredVersion);

    const fieldsAdded: string[] = [];
    const writeData: Record<string, unknown> = {
      slug,
      title,
      content,
      kind,
      jurisdictions,
      jurisdiction: primaryJurisdiction,
      version: newVersion,
      hash: contentHash,
      effectiveDate: fm.effectiveDate || existing?.effectiveDate || null,
      lastUpdated: new Date().toISOString().slice(0, 10),
      status: existing?.status || 'taslak',
      updatedAt: new Date().toISOString(),
    };

    if (existing) {
      if (!existing.jurisdictions) fieldsAdded.push('jurisdictions');
      if (!existing.kind) fieldsAdded.push('kind');
      if (!existing.slug) fieldsAdded.push('slug');
      if (!existing.hash) fieldsAdded.push('hash');
    }

    let status: SyncRow['status'];
    if (!existing) status = 'create';
    else if (hashChanged) status = 'update';
    else if (fieldsAdded.length > 0) status = 'cleanup';
    else status = 'skip';

    rows.push({ slug, status, version: newVersion, jurisdictions, kind, hashChanged, fieldsAdded });

    if (APPLY && db && status !== 'skip') {
      await db.collection('contracts').doc(slug).set(writeData, { merge: true });
    }
  }

  // Report
  const summary = { create: 0, update: 0, cleanup: 0, skip: 0 };
  for (const r of rows) summary[r.status]++;

  console.log('Per-file:');
  for (const r of rows) {
    const tag = r.status.toUpperCase().padEnd(7);
    const extra = r.fieldsAdded.length > 0 ? ` +[${r.fieldsAdded.join(',')}]` : '';
    console.log(`  ${tag} ${r.slug}  v${r.version}  ${r.jurisdictions.join('/')}  ${r.kind}${extra}`);
  }

  console.log(`\nSummary: create=${summary.create} update=${summary.update} cleanup=${summary.cleanup} skip=${summary.skip}`);
  console.log(`Total: ${rows.length} files\n`);
  console.log(`${APPLY ? '✅ APPLIED' : 'ℹ️  Dry run — use --apply to write to Firestore.'}\n`);
  process.exit(0);
})().catch((err) => {
  console.error('❌', err);
  process.exit(1);
});
