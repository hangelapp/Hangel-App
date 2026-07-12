'use server';

/**
 * @fileOverview Kayıttan sesli çağrı dökümü + özeti (Gemini multimodal).
 *
 * Çağrı kaydını (ses) doğrudan Gemini 2.5'e verir; AYRI transkripsiyon servisi
 * (Whisper vb.) GEREKMEZ. Dönüş: konuşma dökümü (transcript) + kısa özet +
 * görüşme havası. Yalnız sunucudan (/api/.../sessions/[id]/transcribe) çağrılır;
 * quota + auth guard'lı.
 *
 * Girdi ses data URL'i olarak gelir (endpoint Storage'dan indirip base64'ler).
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { checkAndConsumeAIQuota, MAX_OUTPUT_TOKENS } from '@/ai/guards';
import { AIQuotaExceededError, verifyAIFlowUserId } from '@/ai/flow-auth';
import { CALL_SENTIMENTS } from './call-summary-types';

const TranscribeOutputSchema = z.object({
  transcript: z.string().describe('Konuşmanın Türkçe dökümü. Konuşmacıları "Temsilci:" ve "Kişi:" olarak ayır.'),
  summary: z.string().describe('2-4 cümlelik özet (Türkçe).'),
  sentiment: z.enum(CALL_SENTIMENTS).describe('Görüşmenin genel havası.'),
});
export type CallTranscribeOutput = z.infer<typeof TranscribeOutputSchema>;

const PROMPT_TEXT =
  'Sen bir Türk sivil toplum kuruluşunun çağrı merkezi asistanısın. Sana bir çağrı ' +
  'kaydının SESİ veriliyor. Görevin:\n' +
  '1. transcript: Konuşmayı Türkçe olarak yaz. Konuşmacıları "Temsilci:" ve "Kişi:" ' +
  'olarak ayır. Anlaşılmayan yerleri (...) ile göster.\n' +
  '2. summary: 2-4 cümlelik kısa özet.\n' +
  '3. sentiment: Görüşmenin havası — "olumlu", "nötr" veya "olumsuz".\n\n' +
  'KURALLAR: Yalnız duyduğuna dayan, uydurma. Ses boş/anlaşılmazsa transcript ' +
  'alanına kısa bir not yaz. 🙏 ikonunu kullanma.';

/**
 * Ses (data URL) → döküm + özet. Quota + auth guard'lı.
 */
export async function transcribeCall(
  audioDataUrl: string,
  contentType: string,
  idToken?: string,
): Promise<CallTranscribeOutput> {
  const userId = await verifyAIFlowUserId(idToken);
  if (userId) {
    // Ses işleme daha pahalı → düşük günlük kota (10/gün).
    const { allowed } = await checkAndConsumeAIQuota(userId, 'call-transcribe', 10);
    if (!allowed) throw new AIQuotaExceededError('call-transcribe');
  }

  const { output } = await ai.generate({
    model: 'googleai/gemini-2.5-flash',
    prompt: [
      { text: PROMPT_TEXT },
      { media: { url: audioDataUrl, contentType } },
    ],
    config: { maxOutputTokens: MAX_OUTPUT_TOKENS, thinkingConfig: { thinkingBudget: 0 } },
    output: { schema: TranscribeOutputSchema },
  });

  return (output ?? { transcript: '', summary: '', sentiment: 'nötr' }) as CallTranscribeOutput;
}
