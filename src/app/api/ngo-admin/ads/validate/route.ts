/**
 * POST /api/ngo-admin/ads/validate — reklam planını "yapay zeka ile test et".
 *
 *   body: {
 *     platform: 'google' | 'meta' | 'tiktok',
 *     proposal: { title, kind, landing, keywords?, headlines?, descriptions?,
 *                 dailyBudget?, geoTargetIds?, audience?, primaryText?,
 *                 headline?, description?, hashtags? }
 *   }
 *   response: { report: { valid, score, violations[], warnings[], fixes[] } }
 *
 * İki aşamalı denetim:
 *   1. DETERMİNİSTİK (TS, AI'dan ÖNCE) — Google Ad Grants sayısal kuralları:
 *      anahtar kelime ≥2 kelime, başlık ≤30, açıklama ≤90, bütçe aralığı,
 *      landing/title zorunlu, konum seçilmemişse uyarı.
 *   2. SEMANTİK (validateAdPlan flow) — anlam/politika değerlendirmesi.
 *   İki sonuç BİRLEŞTİRİLİR.
 *
 * Yetki: requireNgoAdmin scope 'ads'. Quota AI flow tarafında uygulanır.
 * Firestore'a YAZMAZ. Hata: { errorCode, message }.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireNgoAdmin } from '@/lib/messaging/server-auth';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';
import { validateAdPlan } from '@/ai/flows/ad-plan-validate-flow';
import { AIQuotaExceededError } from '@/ai/flow-auth';

export const runtime = 'nodejs';

type Platform = 'google' | 'meta' | 'tiktok';

interface ProposalBody {
  title?: string;
  kind?: string;
  landing?: string;
  keywords?: string[];
  headlines?: string[];
  descriptions?: string[];
  dailyBudget?: number;
  geoTargetIds?: string[];
  audience?: string;
  primaryText?: string;
  headline?: string;
  description?: string;
  hashtags?: string[];
}

// --- Defansif okuyucular -----------------------------------------------------

function asString(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.map((x) => (typeof x === 'string' ? x.trim() : '')).filter((x) => x.length > 0);
}

function asNumber(v: unknown): number | undefined {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  return undefined;
}

// Kelime sayısı (Ad Grants: tek kelimelik anahtar kelime yasak → ≥2 kelime).
function wordCount(s: string): number {
  return s.trim().split(/\s+/).filter(Boolean).length;
}

// --- Deterministik kontrol sonucu -------------------------------------------

interface DetResult {
  violations: string[];
  warnings: string[];
}

/**
 * AI'dan ÖNCE çalışan deterministik (TS) kurallar. Platforma göre dallanır.
 * Google için Ad Grants sayısal kuralları sıkı; Meta/TikTok için alan varlığı hafif.
 */
function runDeterministicChecks(platform: Platform, p: ProposalBody): DetResult {
  const violations: string[] = [];
  const warnings: string[] = [];

  // Tüm platformlar: başlık zorunlu.
  if (!p.title) {
    violations.push('Kampanya başlığı boş — bir başlık girilmeli.');
  }

  if (platform === 'google') {
    // Landing zorunlu.
    if (!p.landing) {
      violations.push('Açılış sayfası (landing) belirtilmemiş — reklam yayınlanamaz.');
    }

    // Anahtar kelimeler: her biri ≥2 kelime olmalı (Ad Grants kuralı).
    const keywords = p.keywords ?? [];
    if (keywords.length === 0) {
      violations.push('En az bir anahtar kelime girilmeli.');
    } else {
      const singleWord = keywords.filter((k) => wordCount(k) < 2);
      if (singleWord.length > 0) {
        violations.push(
          `Google Ad Grants tek kelimelik anahtar kelimeye izin vermez. Düzeltilmesi gerekenler: ${singleWord.join(', ')}`,
        );
      }
    }

    // Başlıklar: ≥3 adet, her biri ≤30 karakter.
    const headlines = p.headlines ?? [];
    if (headlines.length < 3) {
      violations.push(`En az 3 reklam başlığı gerekli (şu an ${headlines.length}).`);
    }
    const longHeadlines = headlines.filter((h) => h.length > 30);
    if (longHeadlines.length > 0) {
      violations.push(`Reklam başlığı 30 karakteri aşamaz. Çok uzun: ${longHeadlines.join(' | ')}`);
    }

    // Açıklamalar: ≥2 adet, her biri ≤90 karakter.
    const descriptions = p.descriptions ?? [];
    if (descriptions.length < 2) {
      violations.push(`En az 2 reklam açıklaması gerekli (şu an ${descriptions.length}).`);
    }
    const longDescriptions = descriptions.filter((d) => d.length > 90);
    if (longDescriptions.length > 0) {
      violations.push(`Reklam açıklaması 90 karakteri aşamaz. Çok uzun: ${longDescriptions.join(' | ')}`);
    }

    // Günlük bütçe aralığı (uyarı seviyesinde).
    if (typeof p.dailyBudget !== 'number') {
      warnings.push('Günlük bütçe belirtilmemiş — önerilen aralık 50–500 TL.');
    } else if (p.dailyBudget < 50) {
      warnings.push(`Günlük bütçe (${p.dailyBudget} TL) düşük görünüyor — en az 50 TL önerilir.`);
    } else if (p.dailyBudget > 500) {
      warnings.push(`Günlük bütçe (${p.dailyBudget} TL) yüksek görünüyor — 500 TL üzeri dikkatli planlanmalı.`);
    }

    // Konum: boşsa tüm Türkiye'ye gider (uyarı).
    if ((p.geoTargetIds ?? []).length === 0) {
      warnings.push('Konum seçilmedi → tüm Türkiye hedeflenecek.');
    }
  } else if (platform === 'meta') {
    // Meta: alan varlığı hafif kontrol.
    if (!p.primaryText && !p.headline && !p.description) {
      warnings.push('Meta reklamı için birincil metin, başlık veya açıklamadan en az biri girilmeli.');
    }
    if (!p.landing) {
      warnings.push('Açılış sayfası (landing) belirtilmemiş.');
    }
    if ((p.geoTargetIds ?? []).length === 0) {
      warnings.push('Konum seçilmedi → tüm Türkiye hedeflenecek.');
    }
  } else {
    // TikTok: alan varlığı hafif kontrol.
    if (!p.primaryText && !p.description && (p.hashtags ?? []).length === 0) {
      warnings.push('TikTok reklamı için açıklama/caption veya hashtag girilmeli.');
    }
    if ((p.geoTargetIds ?? []).length === 0) {
      warnings.push('Konum seçilmedi → tüm Türkiye hedeflenecek.');
    }
  }

  return { violations, warnings };
}

// Deterministik sonuçtan kaba bir skor (AI skoru yoksa fallback).
function fallbackScore(det: DetResult): number {
  const penalty = det.violations.length * 25 + det.warnings.length * 8;
  return Math.max(0, Math.min(100, 100 - penalty));
}

export async function POST(req: NextRequest) {
  const auth = await requireNgoAdmin(req, { scope: 'ads' });
  if ('error' in auth) return auth.error;
  const { actor } = auth;

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) {
    return NextResponse.json({ errorCode: 'BAD_JSON', message: 'Geçersiz istek.' }, { status: 400 });
  }

  const rawPlatform = asString(body.platform);
  const platform: Platform =
    rawPlatform === 'meta' || rawPlatform === 'tiktok' || rawPlatform === 'google'
      ? (rawPlatform as Platform)
      : 'google';

  const rawProposal = (body.proposal && typeof body.proposal === 'object'
    ? (body.proposal as Record<string, unknown>)
    : {}) as Record<string, unknown>;

  const proposal: ProposalBody = {
    title: asString(rawProposal.title) || undefined,
    kind: asString(rawProposal.kind) || undefined,
    landing: asString(rawProposal.landing) || undefined,
    keywords: asStringArray(rawProposal.keywords),
    headlines: asStringArray(rawProposal.headlines),
    descriptions: asStringArray(rawProposal.descriptions),
    dailyBudget: asNumber(rawProposal.dailyBudget),
    geoTargetIds: asStringArray(rawProposal.geoTargetIds),
    audience: asString(rawProposal.audience) || undefined,
    primaryText: asString(rawProposal.primaryText) || undefined,
    headline: asString(rawProposal.headline) || undefined,
    description: asString(rawProposal.description) || undefined,
    hashtags: asStringArray(rawProposal.hashtags),
  };

  // 1) DETERMİNİSTİK kontroller (AI'dan ÖNCE).
  const det = runDeterministicChecks(platform, proposal);

  // idToken'ı AI flow quota kontrolü için header'dan çıkar (requireNgoAdmin doğruladı).
  const authHeader = req.headers.get('authorization') ?? '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';

  // Kuruluş adını + faaliyet alanını alaka değerlendirmesi için topla (öneri kalitesi).
  let orgName = asString(body.orgName);
  const faaliyetAlani = asString(body.faaliyetAlani);
  if (!orgName) {
    const ngoSnap = await getAdminFirestore()
      .collection(COLLECTIONS.ngos)
      .doc(actor.ngoId)
      .get()
      .catch(() => null);
    if (ngoSnap?.exists) {
      const name = (ngoSnap.data() as { name?: unknown } | undefined)?.name;
      orgName = typeof name === 'string' ? name : '';
    }
  }

  // 2) SEMANTİK değerlendirme (AI). Hata olursa deterministik sonuçla devam et.
  let aiScore: number | null = null;
  let aiViolations: string[] = [];
  let aiWarnings: string[] = [];
  let aiFixes: string[] = [];
  try {
    const ai = await validateAdPlan(
      {
        platform,
        proposal,
        orgName: orgName || undefined,
        faaliyetAlani: faaliyetAlani || undefined,
      },
      idToken,
    );
    aiScore = ai.score;
    aiViolations = ai.violations ?? [];
    aiWarnings = ai.warnings ?? [];
    aiFixes = ai.fixes ?? [];
  } catch (e) {
    if (e instanceof AIQuotaExceededError) {
      return NextResponse.json(
        { errorCode: 'QUOTA', message: 'Günlük yapay zeka hakkın doldu, yarın tekrar dene.' },
        { status: 429 },
      );
    }
    console.error('[ads/validate] AI error', e);
    // AI patladıysa yalnız deterministik sonucu döndür (defansif — yine de rapor çıkar).
  }

  // 3) İki sonucu BİRLEŞTİR (deterministik + semantik).
  const violations = [...det.violations, ...aiViolations];
  const warnings = [...det.warnings, ...aiWarnings];
  const fixes = aiFixes;
  const valid = violations.length === 0;
  const score = aiScore !== null ? aiScore : fallbackScore(det);

  return NextResponse.json({
    report: { valid, score, violations, warnings, fixes },
  });
}
