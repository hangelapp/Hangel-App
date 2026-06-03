/**
 * hangel — EU + Member State Contracts Firestore Sync
 *
 * Reads `docs/contracts/eu-*.md` and Member State supplement files,
 * parses optional YAML frontmatter (or infers from filename),
 * and writes/merges into the Firestore `contracts` collection.
 *
 * Existing docs with the same slug are version-bumped; the previous
 * payload is archived to `contracts/{slug}/versions/{previousVersion}`.
 *
 * Usage:
 *   tsx scripts/contracts-sync-eu.ts --dry-run        # default
 *   tsx scripts/contracts-sync-eu.ts --apply          # writes to Firestore
 *
 * Auth: ADC (gcloud auth application-default login)
 */

import admin from 'firebase-admin';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const PROJECT_ID = 'hangel-new-v18-87297865-9bcc3';
const CONTRACTS_DIR = 'docs/contracts';
const COLLECTION = 'contracts';
const TODAY = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

const APPLY = process.argv.includes('--apply');
const DRY = !APPLY;

// ---------- filename → metadata heuristics ----------

type Jurisdiction = 'EU' | 'DE' | 'FR' | 'ES' | 'IT';
type ContractKind = 'policy' | 'contract' | 'procedure' | 'template' | 'statement' | 'matrix';

interface ContractMeta {
  slug: string;
  title: string;
  jurisdictions: Jurisdiction[];
  kind: ContractKind;
}

// Human-friendly TR titles. Slug-keyed so generation is deterministic.
const TITLES_TR: Record<string, string> = {
  'eu-privacy-policy': 'AB GDPR Gizlilik Politikası',
  'eu-cookie-policy': 'AB Çerez Politikası (ePrivacy + GDPR)',
  'eu-dpia-template': 'AB Veri Koruma Etki Değerlendirmesi (DPIA) Şablonu',
  'eu-dsa-compliance': 'AB Dijital Hizmetler Yasası (DSA) Uyum Belgesi',
  'eu-ai-act-statement': 'AB Yapay Zekâ Yasası (AI Act) Beyanı',
  'eu-terms-of-service': 'AB Kullanım Şartları',
  'eu-child-privacy-policy': 'AB Çocuk Gizliliği Politikası (GDPR Md. 8)',
  'eu-marketing-consent': 'AB Pazarlama İletişimi Onayı (ePrivacy)',
  'eu-data-subject-request-procedure': 'AB Veri Sahibi Talep İşleme Prosedürü (GDPR Md. 12-22)',
  'eu-data-breach-notification-procedure': 'AB Veri İhlali Bildirim Prosedürü (GDPR Md. 33-34)',
  'eu-member-state-overview': 'AB Üye Devlet Genel Bakış Matrisi (27 Ülke)',
  'de-bdsg-supplement': 'Almanya BDSG Eki (Bundesdatenschutzgesetz)',
  'fr-loi-informatique-libertes': 'Fransa Loi Informatique et Libertés (LIL) Eki',
  'es-lopdgdd-supplement': 'İspanya LOPDGDD Eki (Ley Orgánica)',
  'it-codice-privacy': 'İtalya Codice Privacy Eki',
};

const JURISDICTION_BY_PREFIX: Record<string, Jurisdiction> = {
  eu: 'EU',
  de: 'DE',
  fr: 'FR',
  es: 'ES',
  it: 'IT',
};

function inferKind(slug: string): ContractKind {
  if (slug.includes('terms-of-service')) return 'contract';
  if (slug.includes('procedure')) return 'procedure';
  if (slug.includes('template')) return 'template';
  if (slug.includes('statement')) return 'statement';
  if (slug.includes('overview') || slug.includes('matrix')) return 'matrix';
  return 'policy';
}

function fallbackTitle(slug: string): string {
  return slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

// Lightweight YAML frontmatter parser — supports a small key:value subset.
function parseFrontmatter(content: string): { fm: Record<string, string>; body: string } {
  if (!content.startsWith('---\n')) return { fm: {}, body: content };
  const end = content.indexOf('\n---\n', 4);
  if (end === -1) return { fm: {}, body: content };
  const block = content.slice(4, end);
  const body = content.slice(end + 5);
  const fm: Record<string, string> = {};
  for (const line of block.split('\n')) {
    const m = line.match(/^([a-zA-Z_][\w-]*):\s*(.+)$/);
    if (m) fm[m[1]] = m[2].trim().replace(/^['"]|['"]$/g, '');
  }
  return { fm, body };
}

function metaFor(filename: string, frontmatter: Record<string, string>): ContractMeta {
  const slug = filename.replace(/\.md$/, '');
  const prefix = slug.split('-')[0];
  const jurisdiction = JURISDICTION_BY_PREFIX[prefix] ?? 'EU';

  return {
    slug: frontmatter.slug ?? slug,
    title: frontmatter.title ?? TITLES_TR[slug] ?? fallbackTitle(slug),
    jurisdictions: frontmatter.jurisdictions
      ? (frontmatter.jurisdictions.split(',').map((s) => s.trim()) as Jurisdiction[])
      : [jurisdiction],
    kind: (frontmatter.kind as ContractKind) ?? inferKind(slug),
  };
}

// ---------- main ----------

interface Plan {
  slug: string;
  title: string;
  jurisdictions: Jurisdiction[];
  kind: ContractKind;
  contentBytes: number;
  newVersion: string;
  previousVersion: string | null;
  action: 'create' | 'merge-bump';
}

async function main() {
  console.log(`\n=== hangel — Contracts Sync (EU + Member State) ===`);
  console.log(`Project: ${PROJECT_ID}`);
  console.log(`Mode: ${DRY ? 'DRY-RUN (no writes)' : 'APPLY (writes to Firestore)'}\n`);

  const files = readdirSync(CONTRACTS_DIR)
    .filter((f) => f.endsWith('.md'))
    .filter((f) => /^(eu|de|fr|es|it)-/.test(f))
    .sort();

  console.log(`Found ${files.length} EU/Member-State markdown files.\n`);

  if (APPLY) {
    admin.initializeApp({
      projectId: PROJECT_ID,
      credential: admin.credential.applicationDefault(),
    });
  }
  const db = APPLY ? admin.firestore() : null;

  const plan: Plan[] = [];
  let batch = db ? db.batch() : null;
  const batches: Promise<unknown>[] = [];
  let opsInBatch = 0;

  for (const filename of files) {
    const raw = readFileSync(join(CONTRACTS_DIR, filename), 'utf-8');
    const { fm, body } = parseFrontmatter(raw);
    const meta = metaFor(filename, fm);

    let previousVersion: string | null = null;
    let newVersion = '1.0';
    let action: Plan['action'] = 'create';

    if (db) {
      const ref = db.collection(COLLECTION).doc(meta.slug);
      const snap = await ref.get();
      if (snap.exists) {
        const data = snap.data() ?? {};
        previousVersion = typeof data.version === 'string' ? data.version : '1.0';
        newVersion = bumpVersion(previousVersion);
        action = 'merge-bump';

        // Archive old version under versions/ subcollection.
        const archiveRef = ref.collection('versions').doc(previousVersion);
        batch!.set(archiveRef, {
          ...data,
          archivedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        opsInBatch++;
      }
    }

    const payload = {
      id: meta.slug,
      slug: meta.slug,
      title: meta.title,
      content: body,
      jurisdictions: meta.jurisdictions,
      kind: meta.kind,
      version: newVersion,
      effectiveDate: TODAY,
      updatedAt: db ? admin.firestore.FieldValue.serverTimestamp() : TODAY,
      sourceFile: `docs/contracts/${filename}`,
    };

    if (db) {
      batch!.set(db.collection(COLLECTION).doc(meta.slug), payload, { merge: true });
      opsInBatch++;
      if (opsInBatch >= 400) {
        batches.push(batch!.commit());
        batch = db.batch();
        opsInBatch = 0;
      }
    }

    plan.push({
      slug: meta.slug,
      title: meta.title,
      jurisdictions: meta.jurisdictions,
      kind: meta.kind,
      contentBytes: body.length,
      newVersion,
      previousVersion,
      action,
    });
  }

  if (db && opsInBatch > 0) batches.push(batch!.commit());
  if (batches.length > 0) await Promise.all(batches);

  // Report
  console.log('Plan:');
  console.log('─'.repeat(110));
  console.log(
    'slug'.padEnd(42) +
      'jur'.padEnd(8) +
      'kind'.padEnd(12) +
      'ver'.padEnd(8) +
      'prev'.padEnd(8) +
      'bytes'.padEnd(8) +
      'action',
  );
  console.log('─'.repeat(110));
  for (const p of plan) {
    console.log(
      p.slug.padEnd(42) +
        p.jurisdictions.join(',').padEnd(8) +
        p.kind.padEnd(12) +
        p.newVersion.padEnd(8) +
        (p.previousVersion ?? '-').padEnd(8) +
        String(p.contentBytes).padEnd(8) +
        p.action,
    );
  }
  console.log('─'.repeat(110));

  const created = plan.filter((p) => p.action === 'create').length;
  const bumped = plan.filter((p) => p.action === 'merge-bump').length;
  console.log(`\nSummary: ${created} create, ${bumped} merge-bump, ${plan.length} total.`);

  if (DRY) {
    console.log('\n[DRY-RUN] No writes performed. Re-run with --apply to commit.\n');
  } else {
    console.log('\n[APPLIED] Firestore writes complete.\n');
  }
}

function bumpVersion(v: string): string {
  const m = v.match(/^(\d+)\.(\d+)$/);
  if (!m) return '1.1';
  const minor = parseInt(m[2], 10) + 1;
  return `${m[1]}.${minor}`;
}

main().catch((err) => {
  console.error('Sync failed:', err);
  process.exit(1);
});
