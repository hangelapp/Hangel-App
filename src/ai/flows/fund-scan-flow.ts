'use server';

/**
 * @fileOverview Fon & hibe tarama (super-admin/funds → "Fon & Hibe Tara").
 *
 * - scanFunds: bilinen fon listesi + taranacak kaynak portallar girdi alır; bu
 *   kaynaklarda yayınlanmış olabilecek, STK'ları ilgilendiren AÇIK hibe/fon
 *   programı ADAYLARINI önerir. Çıktı doğrulanmadan yayınlanmamalı (AI bilgi
 *   tabanı, canlı portal değil) — son başvuru tarihi ve link teyit edilmeli.
 *
 * Yalnızca server tarafından (/api/funds/scan) çağrılır.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { sanitizeUserInput, checkAndConsumeAIQuota } from '@/ai/guards';
import { verifyAIFlowUserId, AIQuotaExceededError } from '@/ai/flow-auth';

const ScanInputSchema = z.object({
  knownList: z.string().describe('Sistemde halihazırda kayıtlı fonların özet listesi (ad | sağlayıcı).'),
  sources: z.string().describe('Taranacak kaynak portallar (ad — url), satır satır.'),
});
export type FundScanInput = z.infer<typeof ScanInputSchema>;

const CandidateSchema = z.object({
  status: z.enum(['new', 'updated']).describe('new = listede yok; updated = listedeki bir kayıt değişmiş (ör. yeni dönem/son tarih).'),
  existingName: z.string().describe('status=updated ise güncellenecek mevcut fonun adı; new ise boş bırak.'),
  name: z.string().describe('Fon / hibe programının adı.'),
  provider: z.string().describe('Fonu sağlayan kurum (ör. TÜBİTAK, Sabancı Vakfı, Avrupa Birliği).'),
  deadline: z.string().describe('Son başvuru tarihi YYYY-MM-DD (biliniyorsa). Emin değilsen boş bırak; UYDURMA.'),
  areas: z.array(z.string()).describe('Faaliyet alanları (ör. Eğitim, Çevre, Gençlik, İnsan Hakları).'),
  budget: z.string().describe('Bütçe/destek aralığı (ör. "60.000 € - 150.000 €" veya boş).'),
  description: z.string().describe('Fonun amacı ve kapsamı — 1-2 cümle Türkçe.'),
  requirements: z.string().describe('Başvuru şartları — kısa Türkçe (ör. "En az 2 yıldır faal dernek/vakıf").'),
  url: z.string().describe('Kaynak portal linki. Somut başvuru sayfası UYDURMA; kurumun resmî sitesini ver.'),
  reason: z.string().describe('Neden öneriliyor — kısa gerekçe (ör. "TÜBİTAK 2025 çağrısı, listede yok").'),
});

const ScanOutputSchema = z.object({
  candidates: z.array(CandidateSchema).describe('En fazla 12 aday. Emin olunmayan son başvuru tarihleri boş bırakılır.'),
});
export type FundScanCandidate = z.infer<typeof CandidateSchema>;
export type FundScanOutput = z.infer<typeof ScanOutputSchema>;

const SYSTEM_PROMPT =
  'Sen "hangel Fon & Hibe İzleme Asistanı"sın — Türkiye ve AB hibe ekosistemini takip eden bir uzmansın. hangel; STK/dernek/vakıf/öğrenci kulübü odaklı bir sosyal etki platformudur. Amaç: STK\'ların başvurabileceği güncel ve AÇIK fon/hibe programlarını keşfetmek.\n\n' +
  'GÖREV: Sana verilen "taranacak kaynak portallar" ve "bilinen fon listesi"ni incele. Bu kaynaklarda yayınlanmış olabilecek, STK\'ları ilgilendiren ve listede OLMAYAN (veya yeni dönemiyle DEĞİŞMİŞ) hibe/fon programlarını ADAY olarak öner.\n\n' +
  'KURALLAR:\n' +
  '- Bilgi tabanına dayan; emin olmadığın somut son başvuru tarihini UYDURMA — boş bırak ve reason\'da "tarih teyit edilmeli" de.\n' +
  '- Zaten listede olanı tekrar önerme. status=updated ise existingName\'i listedeki birebir adla doldur.\n' +
  '- url alanında uydurma derin link verme; ilgili kurumun resmî ana sitesini ver.\n' +
  '- En fazla 12 aday. STK\'lar için en alakalı ve büyük olasılıkla açık olanları seç.\n' +
  '- Tüm metin alanları Türkçe, kısa ve somut olsun.';

export async function scanFunds(input: FundScanInput, idToken?: string): Promise<FundScanOutput> {
  const safe: FundScanInput = {
    knownList: sanitizeUserInput(input.knownList, 12000),
    sources: sanitizeUserInput(input.sources, 6000),
  };

  const userId = await verifyAIFlowUserId(idToken);
  if (userId) {
    const { allowed } = await checkAndConsumeAIQuota(userId, 'fund-scan');
    if (!allowed) throw new AIQuotaExceededError('fund-scan');
  }

  const prompt =
    `${SYSTEM_PROMPT}\n\n` +
    `=== TARANACAK KAYNAK PORTALLAR ===\n${safe.sources}\n\n` +
    `=== BİLİNEN FON LİSTESİ (bunları tekrar önerme) ===\n${safe.knownList || '(henüz fon yok)'}\n\n` +
    `--- Listede olmayan/yeni hibe & fon adaylarını JSON şemasına uygun döndür.`;

  const { output } = await ai.generate({
    model: 'googleai/gemini-2.5-flash',
    prompt,
    // thinkingBudget:0 → 2.5-flash düşünme tokenları structured JSON'u truncate etmesin.
    config: { temperature: 0.4, maxOutputTokens: 4096, thinkingConfig: { thinkingBudget: 0 } },
    output: { schema: ScanOutputSchema },
  });

  const result = (output ?? { candidates: [] }) as FundScanOutput;
  return { candidates: Array.isArray(result.candidates) ? result.candidates.slice(0, 12) : [] };
}
