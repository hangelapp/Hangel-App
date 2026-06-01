'use server';

/**
 * @fileOverview A library assistant AI agent that works within the context of the library data.
 *
 * - askLibraryAssistant - A function that handles answering questions about the library resources.
 * - AskLibraryAssistantInput - The input type for the askLibraryAssistant function.
 * - AskLibraryAssistantOutput - The return type for the askLibraryAssistant function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {checkAndConsumeAIQuota, clampOutputText, MAX_OUTPUT_TOKENS, sanitizeUserInput} from '@/ai/guards';
import {AIQuotaExceededError, verifyAIFlowUserId} from '@/ai/flow-auth';

const _AskLibraryAssistantInputSchema = z.object({
  userQuestion: z.string().describe("The user's question about the resources in the library."),
  libraryContext: z.string().describe('A summary of the library sections and items available.'),
});
export type AskLibraryAssistantInput = z.infer<typeof _AskLibraryAssistantInputSchema>;

const AskLibraryAssistantOutputSchema = z.object({
  answer: z.string().describe('The helpful and informative answer based ONLY on the provided library context.'),
});
export type AskLibraryAssistantOutput = z.infer<typeof AskLibraryAssistantOutputSchema>;

// Super-admin tarafından `aiAssistantConfig/library` üzerinden yönetilen runtime
// override'lar — sistem prompt, model, sıcaklık ve token sınırı.
export interface AssistantRuntimeConfig {
  systemPrompt?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

const DEFAULT_SYSTEM_PROMPT =
  'You are the "hangel Kütüphane Asistanı" (Library Assistant). Your goal is to help users navigate and understand the resources available in the hangel Library.\n\n' +
  'CRITICAL RULE: Answer questions based ONLY on the provided Library Context. If the information is not in the context, politely state that you can only answer questions about the resources available in the library.';

/**
 * P1-8c: `idToken` (optional) is the caller's Firebase ID token, used to
 * enforce a per-user daily quota. No UI caller exists yet — when wired,
 * the client must send `await user.getIdToken()`, NEVER a bare uid.
 * Token absent → quota check is skipped (fail-open). Cap exceeded →
 * throws `AIQuotaExceededError`.
 */
export async function askLibraryAssistant(
  input: AskLibraryAssistantInput,
  idToken?: string,
  runtimeConfig?: AssistantRuntimeConfig,
): Promise<AskLibraryAssistantOutput> {
  const safeInput: AskLibraryAssistantInput = {
    userQuestion: sanitizeUserInput(input.userQuestion, 2000),
    libraryContext: sanitizeUserInput(input.libraryContext, 24000), // tüm bölümler sığsın (tek dev bölüm bütçeyi yemesin diye route'ta da madde başına cap var)
  };
  const userId = await verifyAIFlowUserId(idToken);
  if (userId) {
    const { allowed } = await checkAndConsumeAIQuota(userId, 'library-assistant');
    if (!allowed) {
      throw new AIQuotaExceededError('library-assistant');
    }
  }

  // Super-admin tarafından kaydedilen sistem prompt ve model parametreleri uygulanır.
  const systemPrompt = (runtimeConfig?.systemPrompt?.trim()) || DEFAULT_SYSTEM_PROMPT;
  const modelId = normalizeModel(runtimeConfig?.model) || 'googleai/gemini-2.5-flash';
  const temperature = clampTemp(runtimeConfig?.temperature);
  const maxOutputTokens = clampTokens(runtimeConfig?.maxTokens);

  const userPrompt = `${systemPrompt}\n\n` +
    `Context of available resources:\n${safeInput.libraryContext}\n\n` +
    `---\n\nUser Request: "${safeInput.userQuestion}"`;

  const { output } = await ai.generate({
    model: modelId,
    prompt: userPrompt,
    // thinkingBudget:0 → gemini-2.5-flash'ın "düşünme" tokenları çıktı bütçesini
    // yiyip structured output'u truncate etmesin (boş output → 500'e sebep oluyordu).
    config: { temperature, maxOutputTokens, thinkingConfig: { thinkingBudget: 0 } },
    output: { schema: AskLibraryAssistantOutputSchema },
  });
  const safe = (output ?? { answer: '' }) as AskLibraryAssistantOutput;
  return { ...safe, answer: clampOutputText(safe.answer || '') };
}

function clampTemp(t: number | undefined): number {
  if (typeof t !== 'number' || Number.isNaN(t)) return 0.3;
  return Math.max(0, Math.min(1, t));
}
function clampTokens(n: number | undefined): number {
  if (typeof n !== 'number' || Number.isNaN(n)) return MAX_OUTPUT_TOKENS;
  return Math.max(64, Math.min(MAX_OUTPUT_TOKENS, Math.floor(n)));
}
function normalizeModel(m: string | undefined): string | null {
  if (!m) return null;
  const bare = m.replace(/^googleai\//, '');
  // Kullanımdan kalkmış modeller (gemini-1.5*/1.0*/-pro) Google API'de 404 veriyor.
  // null döndür ki çağıran güncel default'a (gemini-2.5-flash) düşsün — süper-admin
  // config'inde eski model kalmış olsa bile AI çalışmaya devam etsin.
  if (/^gemini-1\./.test(bare) || /^gemini-pro/.test(bare)) return null;
  // Sade `gemini-*` adları geliyorsa Genkit prefix'i ekle.
  if (m.startsWith('googleai/')) return m;
  if (m.startsWith('gemini-')) return `googleai/${m}`;
  // Desteklenmeyen sağlayıcılar (gpt-4o vb.) için sessizce default'a düş.
  return null;
}
