'use server';

/**
 * @fileOverview STK reklam planını "yapay zeka ile test et" — semantik/politika analizi.
 *
 * - validateAdPlan: bir reklam önerisini (Google Ad Grants / Meta / TikTok) reklam
 *   politikaları açısından SEMANTİK olarak değerlendirir; 0-100 skor + ihlaller +
 *   uyarılar + somut düzeltme önerileri döner.
 *
 * Bu flow YALNIZCA semantik/politika değerlendirmesi yapar (anahtar kelime amaçla
 * alakalı mı, metin yanıltıcı/abartılı mı, çağrı net mi, landing uygun mu).
 * DETERMİNİSTİK kurallar (karakter limiti, ≥2 kelime kuralı, bütçe aralığı vb.)
 * route tarafında (/api/ngo-admin/ads/validate) TS ile uygulanır — burada sadece
 * bağlam olarak prompt'a verilir.
 *
 * Çağrı yalnızca sunucudan (/api/ngo-admin/ads/validate). Quota + auth guard'lı.
 * Firestore'a YAZMAZ.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { sanitizeUserInput, checkAndConsumeAIQuota } from '@/ai/guards';
import { verifyAIFlowUserId, AIQuotaExceededError } from '@/ai/flow-auth';

// Değerlendirilen reklam önerisi — tüm reklam alanları opsiyonel (platforma göre dolu).
const ProposalInputSchema = z.object({
  title: z.string().optional().describe('Önerinin/kampanyanın başlığı (TR).'),
  kind: z.string().optional().describe('Kampanya türü (ör. search-donation, hangel-volunteer).'),
  landing: z.string().optional().describe('Açılış sayfası tipi/URL (kurum-sitesi / hangel-bagis / hangel-gonulluluk).'),
  // Google Arama alanları.
  keywords: z.array(z.string()).optional().describe('Anahtar kelimeler (Ad Grants: her biri ≥2 kelime olmalı).'),
  headlines: z.array(z.string()).optional().describe('Reklam başlıkları (her biri ≤30 karakter).'),
  descriptions: z.array(z.string()).optional().describe('Reklam açıklamaları (her biri ≤90 karakter).'),
  dailyBudget: z.number().optional().describe('Önerilen günlük bütçe (TL).'),
  geoTargetIds: z.array(z.string()).optional().describe('Google geo target ID listesi (boşsa tüm Türkiye).'),
  // Meta alanları.
  audience: z.string().optional().describe('Hedef kitle tanımı (Meta).'),
  primaryText: z.string().optional().describe('Birincil metin (Meta).'),
  headline: z.string().optional().describe('Başlık (Meta).'),
  description: z.string().optional().describe('Açıklama (Meta).'),
  // TikTok alanları.
  hashtags: z.array(z.string()).optional().describe('Hashtag listesi (TikTok).'),
});
export type AdPlanProposalInput = z.infer<typeof ProposalInputSchema>;

const _AdPlanValidateInputSchema = z.object({
  platform: z.enum(['google', 'meta', 'tiktok']).describe('Reklam platformu.'),
  proposal: ProposalInputSchema.describe('Değerlendirilecek reklam önerisi.'),
  orgName: z.string().optional().describe('Kuruluşun adı (alaka değerlendirmesi için).'),
  faaliyetAlani: z.string().optional().describe('Kuruluşun faaliyet alanı (alaka değerlendirmesi için).'),
});
export type AdPlanValidateInput = z.infer<typeof _AdPlanValidateInputSchema>;

const AdPlanValidateOutputSchema = z.object({
  score: z.number().describe('0-100 arası reklam-politikası uygunluk skoru.'),
  violations: z.array(z.string()).describe('Yayını ENGELLEYEBİLECEK ciddi politika ihlalleri (Türkçe, kısa).'),
  warnings: z.array(z.string()).describe('Yayını engellemez ama iyileştirilmesi gereken noktalar (Türkçe, kısa).'),
  fixes: z.array(z.string()).describe('Somut, uygulanabilir düzeltme önerileri (Türkçe, kısa).'),
});
export type AdPlanValidateOutput = z.infer<typeof AdPlanValidateOutputSchema>;

const SYSTEM_PROMPT =
  'Sen "hangel Reklam Denetçisi"sin — Türk sivil toplum kuruluşlarının (STK) reklam önerilerini ' +
  'reklam politikaları açısından değerlendiren uzman bir dijital pazarlama denetçisisin.\n\n' +
  'GÖREV: Verilen reklam önerisini Google Ad Grants ve genel reklam politikaları açısından SEMANTİK olarak değerlendir.\n\n' +
  'NEYE BAK (semantik/politika):\n' +
  '- Anahtar kelimeler kuruluşun amacı/faaliyet alanıyla gerçekten alakalı mı; alakasız/yanıltıcı kelime var mı.\n' +
  '- Metin (başlık/açıklama) yanıltıcı, abartılı, gerçek dışı vaat içeren ya da yasak (sağlık iddiası, siyaset, nefret, sansasyon) içerik var mı.\n' +
  '- Çağrı (call to action) net mi; kullanıcı tıklayınca ne bulacağını anlıyor mu.\n' +
  '- Landing (açılış sayfası) reklamın vaadiyle uyumlu mu; bağış/gönüllülük çağrısı doğru sayfaya gidiyor mu.\n' +
  '- Genel ton STK ciddiyetine uygun mu; spam/clickbait hissi var mı.\n\n' +
  'DETERMİNİSTİK KURALLAR (yalnızca BAĞLAM — bunları SEN tekrar saymıyorsun, ayrı bir sistem ölçüyor):\n' +
  '- Google Ad Grants: her anahtar kelime en az 2 kelime olmalı; başlıklar ≤30, açıklamalar ≤90 karakter.\n' +
  '- Makul günlük bütçe 50–500 TL aralığındadır.\n' +
  'Bu sayısal kuralları SEN denetleme; yalnız anlam/politika tarafına odaklan.\n\n' +
  'ÇIKTI KURALLARI:\n' +
  '- score: reklamın politika+anlam açısından ne kadar yayına hazır olduğuna dair 0-100 dürüst bir oran.\n' +
  '- violations: yayını ENGELLEYEBİLECEK ciddi sorunlar (yanıltıcı vaat, yasak içerik, amaçla alakasız). Yoksa boş dizi.\n' +
  '- warnings: yayını engellemeyen ama iyileştirilmesi gereken noktalar. Yoksa boş dizi.\n' +
  '- fixes: her biri somut, uygulanabilir tek cümlelik düzeltme önerisi. Yoksa boş dizi.\n' +
  '- Tüm metinler Türkçe, kısa ve net olsun (uzun paragraf değil). Hiçbir alanı atlama; ilgili tespit yoksa boş dizi döndür.';

// Reklam önerisini okunabilir, modele uygun bir metin bloğuna serileştir.
function describeProposal(platform: string, p: AdPlanProposalInput): string {
  const lines: string[] = [];
  if (p.title) lines.push(`Başlık: ${p.title}`);
  if (p.kind) lines.push(`Tür: ${p.kind}`);
  if (p.landing) lines.push(`Açılış sayfası: ${p.landing}`);
  if (Array.isArray(p.keywords) && p.keywords.length) lines.push(`Anahtar kelimeler: ${p.keywords.join(' | ')}`);
  if (Array.isArray(p.headlines) && p.headlines.length) lines.push(`Başlıklar: ${p.headlines.join(' | ')}`);
  if (Array.isArray(p.descriptions) && p.descriptions.length) lines.push(`Açıklamalar: ${p.descriptions.join(' | ')}`);
  if (typeof p.dailyBudget === 'number') lines.push(`Günlük bütçe (TL): ${p.dailyBudget}`);
  if (Array.isArray(p.geoTargetIds) && p.geoTargetIds.length) {
    lines.push(`Konum hedef ID'leri: ${p.geoTargetIds.join(', ')}`);
  } else {
    lines.push('Konum: belirtilmemiş (tüm Türkiye).');
  }
  if (p.audience) lines.push(`Hedef kitle: ${p.audience}`);
  if (p.primaryText) lines.push(`Birincil metin: ${p.primaryText}`);
  if (p.headline) lines.push(`Başlık (Meta): ${p.headline}`);
  if (p.description) lines.push(`Açıklama (Meta): ${p.description}`);
  if (Array.isArray(p.hashtags) && p.hashtags.length) lines.push(`Hashtagler: ${p.hashtags.join(' ')}`);
  return `Platform: ${platform}\n${lines.join('\n')}`;
}

/**
 * Reklam önerisini semantik/politika açısından değerlendirir.
 * Quota + auth guard'lı; Firestore'a YAZMAZ; yalnız sunucudan
 * (/api/ngo-admin/ads/validate) çağrılır.
 */
export async function validateAdPlan(
  input: AdPlanValidateInput,
  idToken?: string,
): Promise<AdPlanValidateOutput> {
  // Platformu defansif normalize et.
  const platform: 'google' | 'meta' | 'tiktok' =
    input.platform === 'meta' || input.platform === 'tiktok' ? input.platform : 'google';

  const rawProposal = (input.proposal ?? {}) as AdPlanProposalInput;

  // Metin alanlarını sanitize et (prompt-injection / runaway-cost guard).
  const cleanArr = (arr: unknown, maxLen: number, maxItems = 30): string[] => {
    if (!Array.isArray(arr)) return [];
    return arr
      .slice(0, maxItems)
      .map((v) => sanitizeUserInput(typeof v === 'string' ? v : '', maxLen))
      .filter((v) => v.length > 0);
  };

  const safeProposal: AdPlanProposalInput = {
    title: sanitizeUserInput(rawProposal.title ?? '', 300) || undefined,
    kind: sanitizeUserInput(rawProposal.kind ?? '', 80) || undefined,
    landing: sanitizeUserInput(rawProposal.landing ?? '', 500) || undefined,
    keywords: cleanArr(rawProposal.keywords, 120),
    headlines: cleanArr(rawProposal.headlines, 120),
    descriptions: cleanArr(rawProposal.descriptions, 200),
    dailyBudget:
      typeof rawProposal.dailyBudget === 'number' && Number.isFinite(rawProposal.dailyBudget)
        ? rawProposal.dailyBudget
        : undefined,
    geoTargetIds: cleanArr(rawProposal.geoTargetIds, 32, 200),
    audience: sanitizeUserInput(rawProposal.audience ?? '', 500) || undefined,
    primaryText: sanitizeUserInput(rawProposal.primaryText ?? '', 1000) || undefined,
    headline: sanitizeUserInput(rawProposal.headline ?? '', 200) || undefined,
    description: sanitizeUserInput(rawProposal.description ?? '', 300) || undefined,
    hashtags: cleanArr(rawProposal.hashtags, 80),
  };

  const orgName = sanitizeUserInput(input.orgName ?? '', 200);
  const faaliyetAlani = sanitizeUserInput(input.faaliyetAlani ?? '', 300);

  const userId = await verifyAIFlowUserId(idToken);
  if (userId) {
    const { allowed } = await checkAndConsumeAIQuota(userId, 'ad-plan-validate');
    if (!allowed) throw new AIQuotaExceededError('ad-plan-validate');
  }

  const orgBlock =
    (orgName ? `KURULUŞ ADI: ${orgName}\n` : '') +
    (faaliyetAlani ? `FAALİYET ALANI: ${faaliyetAlani}\n` : '');

  const prompt =
    `${SYSTEM_PROMPT}\n\n` +
    (orgBlock ? `${orgBlock}\n` : '') +
    `=== DEĞERLENDİRİLECEK REKLAM ÖNERİSİ ===\n${describeProposal(platform, safeProposal)}\n\n` +
    `--- Yukarıdaki reklam önerisini reklam politikaları açısından değerlendir ve JSON şemasına uygun yanıt ver.`;

  const { output } = await ai.generate({
    model: 'googleai/gemini-2.5-flash',
    prompt,
    // thinkingBudget:0 → 2.5-flash'ın "düşünme" tokenları çıktı bütçesini yemesin
    // (yoksa structured JSON truncate olup parse patlıyordu).
    config: { temperature: 0.2, maxOutputTokens: 4096, thinkingConfig: { thinkingBudget: 0 } },
    output: { schema: AdPlanValidateOutputSchema },
  });

  const result = (output ?? null) as AdPlanValidateOutput | null;
  if (!result) {
    return { score: 0, violations: ['Analiz üretilemedi'], warnings: [], fixes: [] };
  }
  return {
    score: Math.max(0, Math.min(100, Math.round(result.score || 0))),
    violations: Array.isArray(result.violations) ? result.violations : [],
    warnings: Array.isArray(result.warnings) ? result.warnings : [],
    fixes: Array.isArray(result.fixes) ? result.fixes : [],
  };
}
