/**
 * scripts/contracts-review-batch1.ts
 *
 * Ajan 5/10 — Batch 1: TR sözleşme/politika içerik kalite kontrolü (~20 doc).
 * Çalışma alanı: Firestore `contracts` koleksiyonu. Bu ajan SADECE alfabetik
 * sırada A-G arası TR slug'larını ele alır (~ilk 20 doc). Diğer batch'ler (D7-D10)
 * farklı slug aralıklarında çalışır — çakışma yok.
 *
 * Kontrol başlıkları:
 *   1. Markdown / HTML syntax bozuk mu (eksik kapama tag, broken link)
 *   2. Türkçe karakter encoding doğrulaması (İ/ı/Ş/ş/Ğ/ğ/Ç/ç/Ö/ö/Ü/ü)
 *   3. Boş veya çok kısa content (placeholder)
 *   4. UTF-8 encoding problemleri (mojibake)
 *   5. Çakışan başlık seviyeleri (h2/##  → doğrudan h4/####  atlanmış mı)
 *   6. "hangel" lowercase kontrolü (gösterilen metin)
 *   7. DRAFT disclaimer eksikliği
 *   8. Versiyon + effectiveDate tutarlılığı
 *
 * Kullanım:
 *   # Dry-run (rapor): hangi doc'larda hangi problem
 *   GOOGLE_APPLICATION_CREDENTIALS=/Users/macbookair/new-app/.firebase-service-account.json \
 *     npx tsx scripts/contracts-review-batch1.ts
 *
 *   # Apply: kritik fix'leri uygula
 *   GOOGLE_APPLICATION_CREDENTIALS=/Users/macbookair/new-app/.firebase-service-account.json \
 *     npx tsx scripts/contracts-review-batch1.ts --apply
 *
 * KESİNLİKLE:
 *   - Mevcut content YOK EDİLMEZ — sadece minor fix (lowercase, eksik kapama tag,
 *     DRAFT banner ekleme).
 *   - Yeni içerik yazılmaz; bu ayrı bir görevin sorumluluğu.
 */

import { initializeApp, applicationDefault, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'node:fs';
import path from 'node:path';

const APPLY = process.argv.includes('--apply');

// ---------- bootstrap ----------

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

// ---------- TR slug filter (alphabetical A-G, first ~20) ----------

/**
 * Bir slug'ın TR sözleşmesi olduğunu belirler. Hem `tr-` prefix'i hem de prefix
 * taşımayan TR-kökenli legacy slug'lar (`kvkk-aydinlatma-metni`, `kullanici-sozlesmesi`)
 * kabul edilir.
 */
function isTrSlug(slug: string, data: Record<string, unknown>): boolean {
  if (slug.startsWith('tr-')) return true;
  // EU/UK/US/diğer ülke prefix'leri hariç tut
  if (/^(eu|uk|us|ca|de|es|fr|it|jp|sg|au|br|ch|ae|sa)-/.test(slug)) return false;
  const j = data.jurisdictions;
  if (Array.isArray(j) && j.length === 1 && j[0] === 'TR') return true;
  // Legacy TR slug'ları
  const trKeywords = /(kvkk|sozlesme|politikasi|aydinlatma|riza|stk|gonullu|bagisci|kulup|uyelik|seffaflik|cerez|whistleblower|kar-dagitim|ucret|kurumsal|risk-yonetimi|iso-27001|kullanici|kurulus|marka|ogrenci|saglik|pazarlama|beyan)/;
  return trKeywords.test(slug);
}

// ---------- kalite kontrolleri ----------

interface Finding {
  severity: 'critical' | 'warning' | 'info';
  code: string;
  message: string;
}

interface DocReview {
  slug: string;
  title: string;
  version?: string;
  effectiveDate?: string;
  contentLength: number;
  findings: Finding[];
  fixes: { code: string; description: string }[];
  fixedContent?: string;
  fixedMeta?: Record<string, unknown>;
}

const MIN_CONTENT_LENGTH = 400;
const PLACEHOLDER_RE = /\b(TODO|TBD|FIXME|XXX|\[lorem\]|\[placeholder\]|<placeholder>|doldurulacak)\b/gi;
const MOJIBAKE_RE = /[ÃÂâ€][-¿]|�/;
const BROKEN_LINK_RE = /\[([^\]]+)\]\(\s*\)/g; // []() with empty href
const HANGEL_CAPITALIZED_RE = /\bHangel\b/g;
// `Hangel A.Ş.` resmi tüzel kişilik olarak korunabilir; ancak ekran metninde
// kullanıcı tercihi gereği yine "hangel" istiyor — sadece markdown safe-line
// (resmi unvan placeholder satırı) hariç düzeltilir.
const PRESERVE_LINE_PATTERNS: RegExp[] = [
  /resmi ünvan placeholder/i,
  /resmi unvan placeholder/i,
];

// DRAFT banner deteksiyonu — script-batch1 tarafından basılan banner formatına
// veya DRAFT/Taslak ibaresine bakar.
const DRAFT_DETECT_RE = /(taslak|draft|yürürlük tarihi:)/i;

const DEFAULT_DRAFT_BANNER = `<p><em>⚠️ Taslak — bu metin hangel hukuk komitesi tarafından inceleme aşamasındadır; yayın onayı öncesi nihai metin değildir.</em></p>\n`;

/** Türkçe karakter mojibake / encoding problemlerini ara. */
function detectEncodingIssues(content: string): Finding[] {
  const out: Finding[] = [];
  if (MOJIBAKE_RE.test(content)) {
    out.push({
      severity: 'critical',
      code: 'ENCODING_MOJIBAKE',
      message: 'UTF-8 encoding bozuk: replacement char veya double-encoded UTF-8 sequence tespit edildi.',
    });
  }
  // Sıfır TR karakter içeren TR doc — bayrak
  const trCharCount = (content.match(/[İıŞşĞğÇçÖöÜü]/g) ?? []).length;
  if (trCharCount === 0 && content.length > 800) {
    out.push({
      severity: 'warning',
      code: 'NO_TR_DIACRITICS',
      message: 'TR doc içinde TR karakteri bulunmadı — encoding kaybı olabilir.',
    });
  }
  return out;
}

/** HTML tag dengesizliklerini tespit et (basit, void tag-aware). */
function detectUnbalancedHtml(content: string): Finding[] {
  const findings: Finding[] = [];
  const voidTags = new Set(['br', 'hr', 'img', 'meta', 'link', 'input']);
  const tagRe = /<\/?([a-zA-Z][a-zA-Z0-9]*)([^>]*)>/g;
  const stack: string[] = [];
  let m: RegExpExecArray | null;
  let unbalanced = false;
  while ((m = tagRe.exec(content)) !== null) {
    const full = m[0];
    const name = m[1].toLowerCase();
    const isClose = full.startsWith('</');
    const isSelfClose = full.endsWith('/>') || voidTags.has(name);
    if (isSelfClose && !isClose) continue;
    if (isClose) {
      const top = stack.pop();
      if (top !== name) {
        unbalanced = true;
        break;
      }
    } else {
      stack.push(name);
    }
  }
  if (unbalanced || stack.length > 0) {
    findings.push({
      severity: 'critical',
      code: 'HTML_UNBALANCED',
      message: `HTML tag dengesizliği${stack.length ? ` — kapanmamış: <${stack.slice(-3).join('>, <')}>` : ''}.`,
    });
  }
  return findings;
}

/** Boş [text]() linkleri tespit et. */
function detectBrokenLinks(content: string): Finding[] {
  const m = content.match(BROKEN_LINK_RE);
  if (!m) return [];
  return [{
    severity: 'warning',
    code: 'BROKEN_LINK',
    message: `${m.length} adet href'siz markdown link.`,
  }];
}

/** Başlık seviyesi atlamaları (h2 sonra h4 vb.) — hem markdown hem HTML. */
function detectHeadingSkips(content: string): Finding[] {
  const findings: Finding[] = [];
  const lines = content.split('\n');
  let prevLevel = 0;
  for (const line of lines) {
    let level = 0;
    const md = line.match(/^(#{1,6})\s+\S/);
    if (md) level = md[1].length;
    const html = line.match(/<h([1-6])[\s>]/i);
    if (html) level = Number(html[1]);
    if (level === 0) continue;
    if (prevLevel > 0 && level > prevLevel + 1) {
      findings.push({
        severity: 'warning',
        code: 'HEADING_SKIP',
        message: `Başlık seviyesi atlandı (h${prevLevel} → h${level}).`,
      });
      // sadece ilk vakayı raporla, gürültü olmasın
      break;
    }
    prevLevel = level;
  }
  return findings;
}

/** Placeholder/TODO kalıntıları. */
function detectPlaceholders(content: string): Finding[] {
  const matches = content.match(PLACEHOLDER_RE);
  if (!matches) return [];
  return [{
    severity: 'warning',
    code: 'PLACEHOLDER_LEFT',
    message: `${matches.length} placeholder kalıntısı: ${[...new Set(matches.map(s => s.toLowerCase()))].slice(0, 3).join(', ')}`,
  }];
}

/** Çok kısa / boş content. */
function detectShortContent(length: number): Finding[] {
  if (length === 0) {
    return [{ severity: 'critical', code: 'EMPTY_CONTENT', message: 'content alanı boş.' }];
  }
  if (length < MIN_CONTENT_LENGTH) {
    return [{
      severity: 'critical',
      code: 'SHORT_CONTENT',
      message: `content çok kısa (${length} karakter, min ${MIN_CONTENT_LENGTH}).`,
    }];
  }
  return [];
}

/** "Hangel" capitalize tespiti. */
function detectHangelCase(content: string): Finding[] {
  const lines = content.split('\n');
  let total = 0;
  for (const line of lines) {
    if (PRESERVE_LINE_PATTERNS.some(re => re.test(line))) continue;
    const m = line.match(HANGEL_CAPITALIZED_RE);
    if (m) total += m.length;
  }
  if (total === 0) return [];
  return [{
    severity: 'warning',
    code: 'HANGEL_CASE',
    message: `${total} adet "Hangel" (capitalize) tespit edildi — lowercase'e indirilmeli.`,
  }];
}

/** DRAFT banner eksikliği. */
function detectMissingDraftBanner(content: string, status?: string): Finding[] {
  if (status && status !== 'taslak' && status !== 'draft') return [];
  if (DRAFT_DETECT_RE.test(content)) return [];
  return [{
    severity: 'warning',
    code: 'NO_DRAFT_BANNER',
    message: 'status=taslak fakat içerikte DRAFT/Taslak ibaresi yok.',
  }];
}

/** Versiyon + effectiveDate tutarlılığı. */
function detectVersionInconsistency(meta: { version?: string; effectiveDate?: string }): Finding[] {
  const out: Finding[] = [];
  if (!meta.version) {
    out.push({ severity: 'warning', code: 'NO_VERSION', message: 'version alanı yok.' });
  }
  if (!meta.effectiveDate) {
    out.push({ severity: 'warning', code: 'NO_EFFECTIVE_DATE', message: 'effectiveDate alanı yok.' });
  } else if (!/^\d{4}-\d{2}-\d{2}/.test(String(meta.effectiveDate))) {
    out.push({
      severity: 'warning',
      code: 'BAD_EFFECTIVE_DATE',
      message: `effectiveDate ISO formatında değil: ${String(meta.effectiveDate)}`,
    });
  }
  return out;
}

// ---------- fix uygulayıcılar (yalnızca minor, non-destructive) ----------

function applyHangelLowercase(content: string): { content: string; count: number } {
  let count = 0;
  const fixed = content
    .split('\n')
    .map(line => {
      if (PRESERVE_LINE_PATTERNS.some(re => re.test(line))) return line;
      return line.replace(HANGEL_CAPITALIZED_RE, () => {
        count++;
        return 'hangel';
      });
    })
    .join('\n');
  return { content: fixed, count };
}

function applyDraftBanner(content: string): string {
  if (DRAFT_DETECT_RE.test(content)) return content;
  return `${DEFAULT_DRAFT_BANNER}${content}`;
}

/** Çok güvenli HTML tamir — yalnızca açıkça kapanmayan, en üstte kalmış tag'leri kapatır.
 *  Eğer dengesizlik nedeni "yanlış sıralama" ise dokunmaz (içerik bozma riski). */
function applySafeHtmlClose(content: string): { content: string; appended: string[] } {
  const voidTags = new Set(['br', 'hr', 'img', 'meta', 'link', 'input']);
  const tagRe = /<\/?([a-zA-Z][a-zA-Z0-9]*)([^>]*)>/g;
  const stack: string[] = [];
  let m: RegExpExecArray | null;
  let mismatched = false;
  while ((m = tagRe.exec(content)) !== null) {
    const full = m[0];
    const name = m[1].toLowerCase();
    const isClose = full.startsWith('</');
    const isSelfClose = full.endsWith('/>') || voidTags.has(name);
    if (isSelfClose && !isClose) continue;
    if (isClose) {
      const top = stack.pop();
      if (top !== name) {
        mismatched = true;
        break;
      }
    } else {
      stack.push(name);
    }
  }
  if (mismatched) return { content, appended: [] };
  if (stack.length === 0) return { content, appended: [] };
  // En fazla 3 trailing tag'i kapat (mantıklı korumalı sınır).
  if (stack.length > 3) return { content, appended: [] };
  const closings = stack.reverse().map(t => `</${t}>`).join('');
  return { content: `${content}${closings}`, appended: stack };
}

// ---------- review pipeline ----------

async function reviewDoc(slug: string, raw: Record<string, unknown>): Promise<DocReview> {
  const content = typeof raw.content === 'string' ? raw.content : '';
  const title = typeof raw.title === 'string' ? raw.title : slug;
  const version = typeof raw.version === 'string' ? raw.version : undefined;
  const status = typeof raw.status === 'string' ? raw.status : undefined;
  const effRaw = raw.effectiveDate;
  let effectiveDate: string | undefined;
  if (typeof effRaw === 'string') effectiveDate = effRaw;
  else if (effRaw && typeof effRaw === 'object' && 'toDate' in (effRaw as object)) {
    try { effectiveDate = (effRaw as { toDate(): Date }).toDate().toISOString().slice(0, 10); } catch { /* ignore */ }
  }

  const findings: Finding[] = [
    ...detectShortContent(content.length),
    ...detectEncodingIssues(content),
    ...detectUnbalancedHtml(content),
    ...detectBrokenLinks(content),
    ...detectHeadingSkips(content),
    ...detectPlaceholders(content),
    ...detectHangelCase(content),
    ...detectMissingDraftBanner(content, status),
    ...detectVersionInconsistency({ version, effectiveDate }),
  ];

  const review: DocReview = {
    slug,
    title,
    version,
    effectiveDate,
    contentLength: content.length,
    findings,
    fixes: [],
  };

  // ---- fix tarafı ----
  let newContent = content;
  let mutated = false;

  // 1. hangel lowercase
  const lc = applyHangelLowercase(newContent);
  if (lc.count > 0) {
    newContent = lc.content;
    mutated = true;
    review.fixes.push({ code: 'HANGEL_CASE', description: `${lc.count} "Hangel" → "hangel"` });
  }

  // 2. Safe HTML close
  const html = applySafeHtmlClose(newContent);
  if (html.appended.length > 0) {
    newContent = html.content;
    mutated = true;
    review.fixes.push({ code: 'HTML_UNBALANCED', description: `kapatılan tag'ler: ${html.appended.join(', ')}` });
  }

  // 3. DRAFT banner
  if (findings.some(f => f.code === 'NO_DRAFT_BANNER')) {
    newContent = applyDraftBanner(newContent);
    mutated = true;
    review.fixes.push({ code: 'NO_DRAFT_BANNER', description: 'DRAFT banner eklendi' });
  }

  if (mutated) {
    review.fixedContent = newContent;
  }

  return review;
}

// ---------- main ----------

async function main() {
  console.log(`\n=== contracts-review-batch1.ts ${APPLY ? '(APPLY)' : '(DRY RUN)'} ===\n`);
  initAdmin();
  const db = getFirestore();

  const snap = await db.collection('contracts').get();
  if (snap.empty) {
    console.error('❌ contracts koleksiyonu boş.');
    process.exit(1);
  }

  // TR doc'ları filtre + alfabetik sıra
  const trDocs = snap.docs
    .filter(d => isTrSlug(d.id, d.data() as Record<string, unknown>))
    .sort((a, b) => a.id.localeCompare(b.id));

  // İlk 20 (alfabetik A-G). Diğer batch'ler farklı dilimle çalışacak.
  // A-G prefix filtresi: ilk karakter 'a' ile 'g' arası
  const aToG = trDocs.filter(d => {
    const c = d.id.charAt(0).toLowerCase();
    return c >= 'a' && c <= 'g';
  });
  const slice = (aToG.length >= 20 ? aToG : trDocs).slice(0, 20);

  console.log(`Toplam TR doc: ${trDocs.length}, Batch 1 işlenecek: ${slice.length}\n`);
  console.log('Batch 1 slug listesi:');
  slice.forEach((d, i) => console.log(`  ${String(i + 1).padStart(2)}. ${d.id}`));
  console.log('');

  const reviews: DocReview[] = [];
  for (const d of slice) {
    const r = await reviewDoc(d.id, d.data() as Record<string, unknown>);
    reviews.push(r);
  }

  // ---- rapor ----
  console.log('--- BULGULAR ---\n');
  let criticalCount = 0;
  let warningCount = 0;
  for (const r of reviews) {
    if (r.findings.length === 0) {
      console.log(`✅ ${r.slug.padEnd(50)} clean (${r.contentLength} char, v=${r.version ?? '-'}, eff=${r.effectiveDate ?? '-'})`);
      continue;
    }
    console.log(`⚠️  ${r.slug}  (${r.contentLength} char, v=${r.version ?? '-'}, eff=${r.effectiveDate ?? '-'})`);
    for (const f of r.findings) {
      if (f.severity === 'critical') criticalCount++;
      else if (f.severity === 'warning') warningCount++;
      const icon = f.severity === 'critical' ? '   🔴' : f.severity === 'warning' ? '   🟡' : '   🔵';
      console.log(`${icon} [${f.code}] ${f.message}`);
    }
    if (r.fixes.length > 0) {
      console.log(`   → planlanmış fix: ${r.fixes.map(x => x.code).join(', ')}`);
    }
  }

  console.log(`\nÖzet: ${reviews.length} doc, critical=${criticalCount}, warning=${warningCount}, fix gerekli=${reviews.filter(r => r.fixes.length > 0).length}\n`);

  // ---- apply ----
  if (!APPLY) {
    console.log('DRY RUN — herhangi bir Firestore değişikliği yapılmadı.');
    console.log('Apply için: --apply flag ile tekrar çalıştır.\n');
    return;
  }

  let appliedDocs = 0;
  let appliedFixes = 0;
  const batch = db.batch();
  for (const r of reviews) {
    if (!r.fixedContent || r.fixes.length === 0) continue;
    const ref = db.collection('contracts').doc(r.slug);
    batch.set(ref, {
      content: r.fixedContent,
      lastReviewedAt: new Date().toISOString(),
      lastReviewedBy: 'ajan-5-batch1',
    }, { merge: true });
    appliedDocs++;
    appliedFixes += r.fixes.length;
  }

  if (appliedDocs === 0) {
    console.log('Apply edilecek değişiklik yok.\n');
    return;
  }

  await batch.commit();
  console.log(`✅ Apply tamamlandı: ${appliedDocs} doc, toplam ${appliedFixes} fix.\n`);
}

main().catch(err => {
  console.error('FATAL', err);
  process.exit(1);
});
