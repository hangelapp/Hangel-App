'use server';

/**
 * @fileOverview Mevzuat & karar tarama (super-admin hukuk merkezi).
 *
 * - scanLegislation: bilinen mevzuat listesini girdi alır; listede OLMAYAN veya
 *   DEĞİŞMİŞ olabilecek kanun / Resmi Gazete yayını / mahkeme-Danıştay-KVKK-CJEU
 *   kararı ADAYLARINI önerir. Çıktı doğrulanmadan kullanılmamalı (AI bilgi tabanı,
 *   canlı resmî kaynak değil) — kullanıcı/avukat teyit eder.
 *
 * Yalnızca server tarafından (/api/legal/scan) çağrılır.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { sanitizeUserInput, checkAndConsumeAIQuota } from '@/ai/guards';
import { verifyAIFlowUserId, AIQuotaExceededError } from '@/ai/flow-auth';

const ScanInputSchema = z.object({
  knownList: z.string().describe('Sistemde halihazırda bulunan mevzuatın özet listesi (id | ülke | ad | no).'),
  scope: z.string().describe('Taranacak yargı bölgeleri, ör: "Türkiye, Avrupa Birliği, uluslararası".'),
});
export type ScanInput = z.infer<typeof ScanInputSchema>;

const CandidateSchema = z.object({
  status: z.enum(['new', 'updated']).describe('new = listede yok; updated = listedeki bir kayıt değişmiş olabilir.'),
  existingId: z.string().describe('status=updated ise GÜNCELLENECEK mevcut kaydın birebir id\'si; new ise boş bırak.'),
  name: z.string().describe('Mevzuat / karar adı.'),
  number: z.string().describe('Kanun no / karar no / Resmi Gazete sayısı (biliniyorsa, yoksa boş).'),
  country: z.string().describe('TR | EU | INT | ülke kodu.'),
  category: z.string().describe('KVKK | Dernekler Kanunu | Yardım Toplama | Elektronik Ticaret | Vergi | İş Hukuku | Çocuk Koruma | Diğer.'),
  riskLevel: z.enum(['dusuk', 'orta', 'yuksek', 'kritik']),
  hangelSubject: z.string().describe('Hangel\'i (STK/bağış/gönüllülük/kan/e-ticaret/AI) neden ilgilendirdiği — tek cümle.'),
  affectedModules: z.array(z.string()).describe('Bağış|Gönüllülük|Etkinlik|AI Araçları|Mesajlaşma|Kan İlanı|Üyelik|Ödeme arasından.'),
  interpretation: z.string().describe('Kısa hukuki yorum / aksiyon önerisi.'),
  links: z.string().describe('Resmî kaynak linki (mevzuat.gov.tr / resmigazete.gov.tr / kvkk.gov.tr / danistay / eur-lex). Somut esas-karar no UYDURMA; portal linki ver.'),
  reason: z.string().describe('Neden öneriliyor — "listede yok" veya "şu değişiklik oldu" gibi kısa gerekçe.'),
});

const ScanOutputSchema = z.object({
  candidates: z.array(CandidateSchema).describe('En fazla 12 aday. Emin olunmayan somut karar no\'ları verilmez.'),
});
export type ScanCandidate = z.infer<typeof CandidateSchema>;
export type ScanOutput = z.infer<typeof ScanOutputSchema>;

const SYSTEM_PROMPT =
  'Sen "hangel Hukuk İzleme Asistanı"sın — Türk ve AB hukukunu takip eden bir hukukçusun. hangel; STK/marka/kulüp/gönüllü odaklı bir sosyal etki platformudur (bağış aracılığı, gönüllülük, etkinlik, acil kan ilanı, mesajlaşma/bildirim, AI araçları, ödeme).\n\n' +
  'GÖREV: Sana verilen "bilinen mevzuat listesi"ni incele. Bu listede OLMAYAN veya muhtemelen DEĞİŞMİŞ olan, hangel\'i ilgilendiren kanun / yönetmelik / tebliğ / Resmi Gazete yayını ve dikkat çekici mahkeme-Danıştay-KVKK Kurulu-CJEU kararlarını ADAY olarak öner.\n\n' +
  'KURALLAR:\n' +
  '- Bilgi tabanına dayan; emin olmadığın somut esas/karar numarası UYDURMA — onun yerine ilgili resmî karar arama portalının linkini ver ve reason\'da "doğrulanmalı" de.\n' +
  '- Zaten listede olanı tekrar önerme. status=updated ise existingId\'yi listedeki birebir id ile doldur.\n' +
  '- En fazla 12 aday. Alaka düzeyi yüksek olanları seç.\n' +
  '- Tüm metin alanları Türkçe, kısa ve somut olsun. affectedModules yalnızca verilen modül adlarından.';

export async function scanLegislation(input: ScanInput, idToken?: string): Promise<ScanOutput> {
  const safe: ScanInput = {
    knownList: sanitizeUserInput(input.knownList, 12000),
    scope: sanitizeUserInput(input.scope, 200),
  };

  const userId = await verifyAIFlowUserId(idToken);
  if (userId) {
    const { allowed } = await checkAndConsumeAIQuota(userId, 'legislation-scan');
    if (!allowed) throw new AIQuotaExceededError('legislation-scan');
  }

  const prompt =
    `${SYSTEM_PROMPT}\n\n` +
    `Taranacak kapsam: ${safe.scope}\n\n` +
    `=== BİLİNEN MEVZUAT LİSTESİ (bunları tekrar önerme) ===\n${safe.knownList}\n\n` +
    `--- Listede olmayan/değişmiş adayları JSON şemasına uygun döndür.`;

  const { output } = await ai.generate({
    model: 'googleai/gemini-1.5-flash-latest',
    prompt,
    config: { temperature: 0.3, maxOutputTokens: 2048 },
    output: { schema: ScanOutputSchema },
  });

  const result = (output ?? { candidates: [] }) as ScanOutput;
  return { candidates: Array.isArray(result.candidates) ? result.candidates.slice(0, 12) : [] };
}
