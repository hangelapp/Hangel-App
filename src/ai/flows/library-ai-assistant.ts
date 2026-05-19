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

const AskLibraryAssistantInputSchema = z.object({
  userQuestion: z.string().describe("The user's question about the resources in the library."),
  libraryContext: z.string().describe('A summary of the library sections and items available.'),
});
export type AskLibraryAssistantInput = z.infer<typeof AskLibraryAssistantInputSchema>;

const AskLibraryAssistantOutputSchema = z.object({
  answer: z.string().describe('The helpful and informative answer based ONLY on the provided library context.'),
});
export type AskLibraryAssistantOutput = z.infer<typeof AskLibraryAssistantOutputSchema>;

/**
 * P1-8c: `idToken` (optional) is the caller's Firebase ID token, used to
 * enforce a per-user daily quota. No UI caller exists yet — when wired,
 * the client must send `await user.getIdToken()`, NEVER a bare uid.
 * Token absent → quota check is skipped (fail-open). Cap exceeded →
 * throws `AIQuotaExceededError`.
 */
export async function askLibraryAssistant(input: AskLibraryAssistantInput, idToken?: string): Promise<AskLibraryAssistantOutput> {
  // P1-8: sanitize user-supplied strings (clamp + strip control chars) before
  // prompt interpolation.
  const safeInput: AskLibraryAssistantInput = {
    userQuestion: sanitizeUserInput(input.userQuestion, 2000),
    libraryContext: sanitizeUserInput(input.libraryContext, 8000),
  };
  const userId = await verifyAIFlowUserId(idToken);
  if (userId) {
    const { allowed } = await checkAndConsumeAIQuota(userId, 'library-assistant');
    if (!allowed) {
      throw new AIQuotaExceededError('library-assistant');
    }
  }
  return getLibraryAnswerFlow(safeInput);
}

const prompt = ai.definePrompt({
  name: 'getLibraryAnswerPrompt',
  model: 'googleai/gemini-1.5-flash-latest',
  // P2-9: hard-cap Gemini output tokens as defense-in-depth against runaway cost.
  config: {maxOutputTokens: MAX_OUTPUT_TOKENS},
  input: {schema: AskLibraryAssistantInputSchema},
  output: {schema: AskLibraryAssistantOutputSchema},
  prompt: `You are the "Hangel Kütüphane Asistanı" (Library Assistant). Your goal is to help users navigate and understand the resources available in the Hangel Library.

  CRITICAL RULE: Answer questions based ONLY on the provided Library Context. If the information is not in the context, politely state that you can only answer questions about the resources available in the library.

  Context of available resources:
  {{{libraryContext}}}
  
  ---
  
  User Request: "{{{userQuestion}}}"`,
});

const getLibraryAnswerFlow = ai.defineFlow(
  {
    name: 'getLibraryAnswerFlow',
    inputSchema: AskLibraryAssistantInputSchema,
    outputSchema: AskLibraryAssistantOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    const safe = output!;
    // P2-9: post-clamp output as a last-resort guard against oversized responses.
    return {...safe, answer: clampOutputText(safe.answer)};
  }
);
