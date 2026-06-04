/**
 * contracts-review-batch2.ts — Sözleşme içerik gözden geçirme (Batch 2 / TR slug H-O).
 *
 * Ajan 6/10. Paralel çalışan kardeş ajanlar (D6 / D8 / D9 / D10) farklı slug
 * aralıklarını işler — bu script SADECE TR slug'ların alfabetik H-O aralığını
 * (yaklaşık 25 doc, hassas / sağlık / teknik politika ağırlıklı) hedefler.
 *
 * Yaptığı düzeltmeler (D6 ile aynı methodoloji):
 *   1) Markdown syntax: bozuk heading (`#Başlık` → `# Başlık`), bozuk liste
 *      (`-Madde` → `- Madde`), eksik kod bloğu kapanışı, çift boşluk → tek.
 *   2) "hangel" KÜÇÜK HARF (\bHangel\b → hangel) — resmi ünvan / A.Ş. /
 *      placeholder satırları korunur (lowercase-hangel.ts ile aynı kural).
 *   3) DRAFT disclaimer: status !== 'published' olan doc'lara üst kısma
 *      "DRAFT — bu belge resmi yayın değildir, danışmanlık almadan
 *      kullanmayın." uyarısı eklenir (idempotent: tek seferlik sentinel).
 *   4) Encoding fix: mojibake (`Ã§` → `ç`, `Ä±` → `ı`, `Ã¶` → `ö` vb.) ve
 *      smart-quote / non-breaking space normalizasyonu.
 *
 * KAPSAM SINIRI (ÇAKIŞMA YOK):
 *   - Sadece slug'ı /^[h-o]/i ile başlayan TR doc'lar.
 *   - Slug'ı `tr-` ile başlıyorsa prefix sonrası ilk harfe bakılır (`tr-hizmet…` -> 'h').
 *   - Diğer kardeş ajanlar (D6=A-G, D8=P-T, D9=U-Z, D10=non-TR) ile çakışma yok.
 *
 * Çalıştırma:
 *   # DRY RUN — ilk 5 doc'un planlanan değişiklik özeti:
 *   GOOGLE_APPLICATION_CREDENTIALS=./hangel-sa.json \
 *     npx tsx scripts/contracts-review-batch2.ts --dry-run
 *
 *   # APPLY — H-O aralığındaki tüm TR doc'lara yaz:
 *   GOOGLE_APPLICATION_CREDENTIALS=./hangel-sa.json \
 *     npx tsx scripts/contracts-review-batch2.ts --apply
 *
 * Idempotent: tekrar çalıştırıldığında sentinel sayesinde DRAFT bloğu duplike
 * eklenmez; mojibake / lowercase / markdown düzeltmeleri zaten doğru olan
 * satırlarda no-op.
 */
import { initializeApp, applicationDefault, cert, getApps } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

// ----------------------------------------------------------------------------
// Slug filtering — sadece H-O aralığındaki TR doc'lar
// ----------------------------------------------------------------------------
const SLUG_RANGE_RE = /^(?:tr-)?[h-oH-O]/;

// Diğer ajanların aralıklarına ait olduğu KESİN bilinen örnek slug'lar — defansif blacklist.
// (Eşleştirici regex zaten dışlar; bu liste niyetin bozulmaması için ek emniyet.)
const FORBIDDEN_SLUGS: ReadonlySet<string> = new Set([
  // A-G (D6 batch1)
  'acik-riza-metni',
  'acik-sosyal-girisim-beyani',
  'acik-veri-ve-etki-verisi-paylasim-politikasi',
  'abd-eyalet-bazli-veri-politikasi',
  'abd-irs-bagis-beyani',
  'aml-cft-uyum-beyani',
  'bagis-gelirlerinin-denetlenmesi-politikasi',
  'bagis-ve-yardim-politikasi',
  'bagisci-haklari-beyannamesi',
  'bagimsiz-mali-denetim-ve-ifrs-gaap-beyani',
  'bilgilendirme-politikasi',
  'bilgi-guvenligi-politikasi',
  'cevresel-sorumluluk-politikasi',
  'cerez-politikasi',
  'cikar-catismasi-politikasi',
  'cocuklarin-verilerinin-korunmasi',
  'cok-dilli-sozlesmeler-politikasi',
  'dei-politikasi',
  'dpo-tanimi',
  'erisilebilirlik-politikasi',
  'etik-bagis-ve-fon-kullanimi-beyani',
  'etik-ilkeler',
  'felaket-kurtarma-ve-yedekleme-testleri-beyani',
  'finansal-seffaflik-ve-hesap-verebilirlik-politikasi',
  'gdpr-uyum-politikasi',
  'gelisim-yol-haritasi-ve-standartlar',
  'gizlilik-politikasi',
  'gonullu-haklari-beyannamesi',
  'gonulluluk-sozlesmesi',
  // P-T (D8 batch3)
  'risk-yonetimi-ve-kriz-mudahale-politikasi',
  'seffaflik',
  'sizma-ve-guvenlik-testleri-beyani',
  'sosyal-etki-metodolojisi',
  'sosyal-etki-politikasi',
  'stk-uyelik',
  // U-Z (D9 batch4)
  'ucret-politikasi',
  'ucuncu-taraf-gozetim-ve-etik-performans-beyani',
  'ulke-bazli-veri-koruma-uyum-beyani',
  'ux-ve-kullanici-deneyimi-testleri-beyani',
  'veri-ihlali-bildirim-proseduru',
  'veri-isleme-amaclar-beyani',
  'veri-saklama-ve-imha-politikasi',
  'veri-transferi-ve-hosting-beyani',
  'whistleblower-politikasi',
  'yapay-zeka-seffaflik-beyani',
  'yerel-bagis-mevzuatlarina-uyum-beyani',
  'yonetim-ve-kurumsal-yonetisim-ilkeleri',
]);

function isInRange(slug: string): boolean {
  if (FORBIDDEN_SLUGS.has(slug)) return false;
  // non-TR doc'lara dokunma (eu-, uk-, us-, de-, fr-, vb.)
  const NON_TR_PREFIXES = ['eu-', 'uk-', 'us-', 'de-', 'fr-', 'es-', 'it-', 'br-', 'jp-', 'sg-', 'au-', 'ca-', 'ch-', 'sa-', 'ae-'];
  if (NON_TR_PREFIXES.some((p) => slug.startsWith(p))) return false;
  const test = slug.startsWith('tr-') ? slug.slice(3) : slug;
  return /^[h-o]/i.test(test);
}

// ----------------------------------------------------------------------------
// "hangel" lowercase — lowercase-hangel.ts ile aynı kural
// ----------------------------------------------------------------------------
const PRESERVE_LINE_PATTERNS: RegExp[] = [
  /resmi ünvan placeholder/i,
  /A\.Ş\./,
  /Anonim Şirketi/i,
];
const HANGEL_RE = /\bHangel\b/g;

function normalizeHangel(raw: string): { out: string; n: number } {
  let n = 0;
  const out = raw
    .split('\n')
    .map((line) => {
      if (PRESERVE_LINE_PATTERNS.some((re) => re.test(line))) return line;
      return line.replace(HANGEL_RE, () => {
        n++;
        return 'hangel';
      });
    })
    .join('\n');
  return { out, n };
}

// ----------------------------------------------------------------------------
// Encoding fix — mojibake + smart quotes + nbsp
// ----------------------------------------------------------------------------
const MOJIBAKE_MAP: Array<[RegExp, string]> = [
  [/Ã§/g, 'ç'], [/Ã‡/g, 'Ç'],
  [/Ã¶/g, 'ö'], [/Ã–/g, 'Ö'],
  [/Ã¼/g, 'ü'], [/Ãœ/g, 'Ü'],
  [/Ã¢/g, 'â'],
  [/ÅŸ/g, 'ş'], [/Åž/g, 'Ş'],
  [/ÄŸ/g, 'ğ'], [/Äž/g, 'Ğ'],
  [/Ä±/g, 'ı'], [/Ä°/g, 'İ'],
  [/â€™/g, "'"], [/â€˜/g, "'"],
  [/â€œ/g, '"'], [/â€/g, '"'],
  [/â€“/g, '–'], [/â€”/g, '—'],
  [/â€¦/g, '…'],
  [/ /g, ' '], // non-breaking space
];

function fixEncoding(raw: string): { out: string; n: number } {
  let n = 0;
  let out = raw;
  for (const [re, rep] of MOJIBAKE_MAP) {
    out = out.replace(re, () => {
      n++;
      return rep;
    });
  }
  return { out, n };
}

// ----------------------------------------------------------------------------
// Markdown syntax fix
// ----------------------------------------------------------------------------
function fixMarkdown(raw: string): { out: string; n: number } {
  let n = 0;
  // 1) Heading after # without space: #Title -> # Title (only #-6)
  let out = raw.replace(/^(#{1,6})([^\s#])/gm, (_m, h, c) => {
    n++;
    return `${h} ${c}`;
  });
  // 2) List bullets: -Item / *Item (line start) -> - Item / * Item
  out = out.replace(/^([-*])([^\s-*])/gm, (_m, b, c) => {
    n++;
    return `${b} ${c}`;
  });
  // 3) Çift boşluk (madde dışı, satır sonu olmayan) -> tek boşluk
  out = out.replace(/([^\s])  +([^\s])/g, (_m, a, b) => {
    n++;
    return `${a} ${b}`;
  });
  // 4) Açık kod bloğu — tek başına ``` sayısı tekse, sona ``` ekle.
  const fenceCount = (out.match(/^```/gm) || []).length;
  if (fenceCount % 2 === 1) {
    out = `${out.trimEnd()}\n\`\`\`\n`;
    n++;
  }
  return { out, n };
}

// ----------------------------------------------------------------------------
// DRAFT disclaimer (idempotent, sentinel-based)
// ----------------------------------------------------------------------------
const DRAFT_SENTINEL = '<!-- review-batch2-draft-disclaimer -->';
const DRAFT_BLOCK = `${DRAFT_SENTINEL}
> **DRAFT — bu belge resmi yayın değildir.** içerik hangel tarafından gözden geçirilmektedir; nihai onay öncesi hukuki danışmanlık almadan kullanmayın.
`;

function ensureDraftDisclaimer(raw: string, status: string | undefined): { out: string; added: boolean } {
  if (status === 'published') return { out: raw, added: false };
  if (raw.includes(DRAFT_SENTINEL)) return { out: raw, added: false };
  // İlk heading'den hemen sonra ekle, yoksa başa.
  const headingMatch = raw.match(/^(#{1,6} .+)$/m);
  if (headingMatch && headingMatch.index !== undefined) {
    const insertAt = headingMatch.index + headingMatch[0].length;
    const out = raw.slice(0, insertAt) + '\n\n' + DRAFT_BLOCK + raw.slice(insertAt);
    return { out, added: true };
  }
  return { out: `${DRAFT_BLOCK}\n${raw}`, added: true };
}

// ----------------------------------------------------------------------------
// Plan + run
// ----------------------------------------------------------------------------
interface ReviewPlan {
  slug: string;
  changes: { encoding: number; hangel: number; markdown: number; draftAdded: boolean };
  before: number;
  after: number;
}

async function run() {
  const args = new Set(process.argv.slice(2));
  const dryRun = args.has('--dry-run') || !args.has('--apply');
  const dryPreview = 5;

  if (getApps().length === 0) {
    const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (credPath) initializeApp({ credential: cert(credPath) });
    else initializeApp({ credential: applicationDefault() });
  }
  const db: Firestore = getFirestore();

  console.log(`[review-batch2] Mode: ${dryRun ? `DRY RUN (preview ${dryPreview})` : 'APPLY'}`);
  console.log('[review-batch2] Slug filter: TR (with/without tr- prefix), first letter h-o');

  // Tüm contracts'ı al, lokal filtrele (Firestore'da string range query yerine
  // basit ve görünür olsun diye).
  const snapAll = await db.collection('contracts').get();
  console.log(`[review-batch2] Total contracts in collection: ${snapAll.size}`);

  const candidates = snapAll.docs.filter((d) => isInRange(d.id));
  console.log(`[review-batch2] In-range candidates: ${candidates.length}`);

  const plans: ReviewPlan[] = [];
  let processed = 0;

  for (const doc of candidates) {
    const data = doc.data() as Record<string, unknown>;
    const prevContent = typeof data.content === 'string' ? data.content : '';
    const status = typeof data.status === 'string' ? data.status : undefined;
    if (!prevContent) {
      console.log(`[review-batch2] SKIP empty content: ${doc.id}`);
      continue;
    }

    const enc = fixEncoding(prevContent);
    const md = fixMarkdown(enc.out);
    const hg = normalizeHangel(md.out);
    const dr = ensureDraftDisclaimer(hg.out, status);
    const nextContent = dr.out;

    const noOp =
      enc.n === 0 && md.n === 0 && hg.n === 0 && !dr.added && nextContent === prevContent;
    if (noOp) {
      console.log(`[review-batch2] NO-OP: ${doc.id}`);
      continue;
    }

    const plan: ReviewPlan = {
      slug: doc.id,
      changes: { encoding: enc.n, hangel: hg.n, markdown: md.n, draftAdded: dr.added },
      before: prevContent.length,
      after: nextContent.length,
    };
    plans.push(plan);

    if (dryRun) {
      if (processed < dryPreview) {
        console.log('\n========================================');
        console.log(`[review-batch2 DRY] ${doc.id}`);
        console.log(`  status:   ${status ?? '(none)'}`);
        console.log(`  encoding: ${enc.n} fix`);
        console.log(`  hangel:   ${hg.n} lowercase`);
        console.log(`  markdown: ${md.n} fix`);
        console.log(`  draft:    ${dr.added ? 'ADDED' : 'unchanged'}`);
        console.log(`  length:   ${prevContent.length} -> ${nextContent.length} chars`);
      }
    } else {
      await doc.ref.set(
        {
          content: nextContent,
          updatedAt: new Date().toISOString(),
          reviewBatch: 2,
        },
        { merge: true },
      );
      console.log(`[review-batch2 APPLY] updated: ${doc.id}`);
    }
    processed++;
  }

  // Summary
  console.log('\n[review-batch2] Summary:');
  console.log(`  Candidates scanned:    ${candidates.length}`);
  console.log(`  Planned/applied:       ${plans.length}`);
  const totals = plans.reduce(
    (acc, p) => ({
      enc: acc.enc + p.changes.encoding,
      hg: acc.hg + p.changes.hangel,
      md: acc.md + p.changes.markdown,
      draft: acc.draft + (p.changes.draftAdded ? 1 : 0),
    }),
    { enc: 0, hg: 0, md: 0, draft: 0 },
  );
  console.log(`  Encoding fixes:        ${totals.enc}`);
  console.log(`  hangel lowercase fixes:${totals.hg}`);
  console.log(`  Markdown fixes:        ${totals.md}`);
  console.log(`  DRAFT disclaimer adds: ${totals.draft}`);
  console.log(`  Mode:                  ${dryRun ? 'DRY RUN' : 'APPLIED'}`);
  if (dryRun) console.log('  To apply: re-run with --apply');
}

run().catch((err) => {
  console.error('[review-batch2] FAILED:', err);
  process.exit(1);
});
