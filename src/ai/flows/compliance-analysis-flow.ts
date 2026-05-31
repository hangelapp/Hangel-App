'use server';

/**
 * @fileOverview Sözleşme/politika ↔ mevzuat uyum analizi (super-admin hukuk merkezi).
 *
 * - analyzeCompliance: bir sözleşme/politika metnini ilgili mevzuata karşı değerlendirir;
 *   yüzde uyum skoru + uyumlu/eksik/riskli madde listeleri + öneriler + etkilenen modüller döner.
 *
 * Çağrı yalnızca server tarafından (/api/legal/compliance) yapılır; client doğrudan çağırmaz.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { sanitizeUserInput, checkAndConsumeAIQuota } from '@/ai/guards';
import { verifyAIFlowUserId, AIQuotaExceededError } from '@/ai/flow-auth';

const _ComplianceInputSchema = z.object({
  contractTitle: z.string().describe('Değerlendirilen sözleşme/politika başlığı.'),
  contractText: z.string().describe('Sözleşme/politika tam metni (HTML temizlenmiş).'),
  legislationName: z.string().describe('Karşılaştırılan mevzuat/kanun adı.'),
  legislationText: z.string().describe('Mevzuatın resmi madde metni + hukuki yorum.'),
});
export type ComplianceInput = z.infer<typeof _ComplianceInputSchema>;

const ComplianceOutputSchema = z.object({
  score: z.number().describe('0-100 arası yüzde uyum oranı.'),
  summary: z.string().describe('Tek paragraf genel uyum değerlendirmesi (Türkçe).'),
  compliant: z.array(z.string()).describe('Mevzuata uyumlu olan noktalar/maddeler.'),
  missing: z.array(z.string()).describe('Sözleşmede eksik olan, mevzuatın gerektirdiği noktalar.'),
  risky: z.array(z.string()).describe('Çelişen veya hukuki risk taşıyan noktalar.'),
  suggestions: z.array(z.string()).describe('Sözleşme metnine eklenmesi/düzeltilmesi önerilen somut maddeler.'),
  affectedModules: z.array(z.string()).describe('Bu mevzuatın etkilediği hangel modülleri (bağış, gönüllülük, etkinlik, AI, mesajlaşma, kan ilanı, üyelik, ödeme).'),
});
export type ComplianceOutput = z.infer<typeof ComplianceOutputSchema>;

const SYSTEM_PROMPT =
  'Sen "hangel Hukuk Uyum Analisti"sin — bir Türk sosyal etki platformunun (STK/marka/kulüp/gönüllü) hukuk uyumluluğunu denetleyen uzman bir hukukçusun.\n\n' +
  'GÖREV: Verilen SÖZLEŞME/POLİTİKA metnini, verilen MEVZUAT (kanun/yönetmelik) metnine karşı değerlendir.\n\n' +
  'KURALLAR:\n' +
  '- Yalnızca verilen iki metne dayan; mevzuatta olmayan yükümlülük uydurma.\n' +
  '- score: mevzuatın gerektirdiği unsurların sözleşmede ne ölçüde karşılandığına dair 0-100 dürüst bir oran ver.\n' +
  '- compliant/missing/risky: her madde kısa, somut ve Türkçe olsun (uzun paragraf değil, tek cümlelik tespit).\n' +
  '- suggestions: sözleşmeye eklenecek/değiştirilecek somut metin önerileri ver.\n' +
  '- affectedModules: yalnızca şu listeden seç → Bağış, Gönüllülük, Etkinlik, AI Araçları, Mesajlaşma, Kan İlanı, Üyelik, Ödeme.\n' +
  '- Hiçbir alanı boş bırakma; ilgili tespit yoksa boş dizi döndür.';

export async function analyzeCompliance(
  input: ComplianceInput,
  idToken?: string,
): Promise<ComplianceOutput> {
  const safe: ComplianceInput = {
    contractTitle: sanitizeUserInput(input.contractTitle, 300),
    contractText: sanitizeUserInput(input.contractText, 16000),
    legislationName: sanitizeUserInput(input.legislationName, 300),
    legislationText: sanitizeUserInput(input.legislationText, 12000),
  };

  const userId = await verifyAIFlowUserId(idToken);
  if (userId) {
    const { allowed } = await checkAndConsumeAIQuota(userId, 'compliance-analysis');
    if (!allowed) throw new AIQuotaExceededError('compliance-analysis');
  }

  const prompt =
    `${SYSTEM_PROMPT}\n\n` +
    `=== MEVZUAT: ${safe.legislationName} ===\n${safe.legislationText}\n\n` +
    `=== SÖZLEŞME/POLİTİKA: ${safe.contractTitle} ===\n${safe.contractText}\n\n` +
    `--- Yukarıdaki sözleşmeyi bu mevzuata karşı değerlendir ve JSON şemasına uygun yanıt ver.`;

  const { output } = await ai.generate({
    model: 'googleai/gemini-2.5-flash',
    prompt,
    // thinkingBudget:0 → 2.5-flash'ın "düşünme" tokenları çıktı bütçesini yemesin
    // (yoksa structured JSON truncate olup parse patlıyordu).
    config: { temperature: 0.2, maxOutputTokens: 4096, thinkingConfig: { thinkingBudget: 0 } },
    output: { schema: ComplianceOutputSchema },
  });

  const result = (output ?? null) as ComplianceOutput | null;
  if (!result) {
    return { score: 0, summary: 'Analiz üretilemedi.', compliant: [], missing: [], risky: [], suggestions: [], affectedModules: [] };
  }
  return {
    ...result,
    score: Math.max(0, Math.min(100, Math.round(result.score || 0))),
  };
}
