'use server';

/**
 * @fileOverview AI çağrı özeti üretici.
 *
 * Bir kişiyle yapılan görüşmelerin notlarını, çağrı sonuçlarını ve etiketlerini
 * Gemini'ye verip yöneticinin hızla okuyabileceği kısa bir özet + önerilen
 * sonraki adım + görüşme havası (olumlu/nötr/olumsuz) üretir. Ses işleme YOK —
 * yalnız mevcut metin verisi kullanılır (en düşük maliyet, KVKK açısından güvenli:
 * kayıt byte'ı modele gönderilmez).
 *
 * Çağrı yalnız sunucudan (/api/ngo-admin/call-center/contacts/[id]/summary).
 * Quota + auth guard'lı. 'use server' kısıtı: şemalar/tipler ayrı dosyada.
 */

import { ai } from '@/ai/genkit';
import { checkAndConsumeAIQuota, MAX_OUTPUT_TOKENS, sanitizeUserInput } from '@/ai/guards';
import { AIQuotaExceededError, verifyAIFlowUserId } from '@/ai/flow-auth';
import {
  CallSummaryInputSchema,
  CallSummaryOutputSchema,
  type CallSummaryInput,
  type CallSummaryOutput,
} from './call-summary-types';

const summaryPrompt = ai.definePrompt({
  name: 'callSummaryPrompt',
  model: 'googleai/gemini-2.5-flash',
  config: { maxOutputTokens: MAX_OUTPUT_TOKENS },
  input: { schema: CallSummaryInputSchema },
  output: { schema: CallSummaryOutputSchema },
  prompt: `Sen bir Türk sivil toplum kuruluşunun (STK) çağrı merkezi asistanısın. Bir gönüllü/bağışçı/katılımcı ile yapılan görüşmelerin kayıtlarını okuyup yöneticiye KISA ve NET bir özet çıkarırsın.

GÖRÜŞÜLEN KİŞİ: {{{contactName}}}

GÖRÜŞME NOTLARI:
{{{notes}}}

ÇAĞRI SONUÇLARI: {{{dispositions}}}
ETİKETLER: {{{tags}}}

GÖREV:
1. summary: 2-4 cümlelik, yöneticinin 5 saniyede okuyabileceği bir özet. Kişinin ilgisi, verdiği sözler, itirazları veya talepleri varsa vurgula.
2. nextStep: Bu kişiyle ilgili önerilen TEK bir sonraki adım (örn: "3 gün içinde bağış bağlantısını WhatsApp'tan gönder", "Uygun bir zamanda tekrar ara").
3. sentiment: Görüşmenin genel havası — "olumlu", "nötr" veya "olumsuz".

KURALLAR:
- TÜRKÇE yaz, sade ve profesyonel.
- Yalnız verilen bilgiye dayan; uydurma bilgi/söz/tarih ekleme.
- Not yoksa ya da çok azsa, mevcut sonuç/etikete göre kısa ve dürüst bir özet ver.
- 🙏 ikonunu kullanma.`,
});

const callSummaryFlow = ai.defineFlow(
  {
    name: 'callSummaryFlow',
    inputSchema: CallSummaryInputSchema,
    outputSchema: CallSummaryOutputSchema,
  },
  async (input) => {
    const { output } = await summaryPrompt(input);
    return output!;
  },
);

/**
 * Kişinin görüşme geçmişinden AI özeti üretir.
 * Quota + auth guard'lı; yalnız sunucudan çağrılır.
 */
export async function generateCallSummary(
  input: CallSummaryInput,
  idToken?: string,
): Promise<CallSummaryOutput> {
  const safeInput: CallSummaryInput = {
    contactName: sanitizeUserInput(input.contactName ?? '', 200),
    notes: sanitizeUserInput(input.notes ?? '', 6000),
    dispositions: sanitizeUserInput(input.dispositions ?? '', 500),
    tags: sanitizeUserInput(input.tags ?? '', 500),
  };
  const userId = await verifyAIFlowUserId(idToken);
  if (userId) {
    const { allowed } = await checkAndConsumeAIQuota(userId, 'call-summary');
    if (!allowed) throw new AIQuotaExceededError('call-summary');
  }
  return callSummaryFlow(safeInput);
}
