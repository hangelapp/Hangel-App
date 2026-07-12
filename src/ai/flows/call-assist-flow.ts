'use server';

/**
 * @fileOverview Konuşma anında AI asistanı.
 *
 * Temsilci aramaya başlamadan önce (veya sırasında) kişinin bağlamına göre
 * Gemini'den kısa konuşma ipuçları alır: açılış cümlesi + 3-5 ipucu + olası
 * itiraz-yanıt çiftleri. Amaç bağış/gönüllü/etkinlik daveti olabilir.
 *
 * Yalnız sunucudan (/api/.../contacts/[id]/assist). Quota + auth guard'lı.
 */

import { ai } from '@/ai/genkit';
import { checkAndConsumeAIQuota, MAX_OUTPUT_TOKENS, sanitizeUserInput } from '@/ai/guards';
import { AIQuotaExceededError, verifyAIFlowUserId } from '@/ai/flow-auth';
import {
  CallAssistInputSchema,
  CallAssistOutputSchema,
  type CallAssistInput,
  type CallAssistOutput,
} from './call-assist-types';

const assistPrompt = ai.definePrompt({
  name: 'callAssistPrompt',
  model: 'googleai/gemini-2.5-flash',
  config: { maxOutputTokens: MAX_OUTPUT_TOKENS },
  input: { schema: CallAssistInputSchema },
  output: { schema: CallAssistOutputSchema },
  prompt: `Sen "{{{ngoName}}}" adlı Türk sivil toplum kuruluşunun çağrı merkezi koçusun. Temsilci birazdan aşağıdaki kişiyle telefon görüşmesi yapacak. Ona SICAK, NAZİK ve etkili bir görüşme için kısa ipuçları ver.

KİŞİ:
- Ad: {{{contactName}}}
- Huni aşaması: {{{stageLabel}}}
- Son çağrı sonucu: {{{lastDisposition}}}
- Görüşme amacı: {{{goal}}}
- Son notlar: {{{recentNotes}}}

GÖREV:
1. opener: Görüşmeye başlamak için tek cümlelik, samimi bir açılış (kişinin adını kullan).
2. tips: 3-5 KISA, uygulanabilir ipucu. Amaca (bağış/gönüllü/etkinlik) uygun ikna ve nezaket odaklı.
3. objections: 2-3 olası itiraz + her birine kısa, nazik yanıt önerisi.

KURALLAR:
- TÜRKÇE, sade ve içten. Baskıcı/agresif satış dili KULLANMA.
- Yalnız verilen bağlama dayan; uydurma vaat/rakam ekleme.
- "hangel" geçerse küçük harf. 🙏 ikonunu kullanma.
- Her madde kısa olsun (tek-iki cümle).`,
});

export async function generateCallAssist(
  input: CallAssistInput,
  idToken?: string,
): Promise<CallAssistOutput> {
  const safeInput: CallAssistInput = {
    ngoName: sanitizeUserInput(input.ngoName ?? '', 200) || 'Kuruluşumuz',
    contactName: sanitizeUserInput(input.contactName ?? '', 200) || 'değerli kişi',
    stageLabel: sanitizeUserInput(input.stageLabel ?? '', 60) || '—',
    lastDisposition: sanitizeUserInput(input.lastDisposition ?? '', 60) || '—',
    recentNotes: sanitizeUserInput(input.recentNotes ?? '', 3000),
    goal: sanitizeUserInput(input.goal ?? '', 60) || 'bağış',
  };
  const userId = await verifyAIFlowUserId(idToken);
  if (userId) {
    const { allowed } = await checkAndConsumeAIQuota(userId, 'call-assist');
    if (!allowed) throw new AIQuotaExceededError('call-assist');
  }
  const { output } = await assistPrompt(safeInput);
  return (output ?? { opener: '', tips: [], objections: [] }) as CallAssistOutput;
}
