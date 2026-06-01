'use server';

/**
 * @fileOverview A marketplace assistant AI agent.
 *
 * - askMarketAssistant - A function that handles answering questions about the marketplace.
 * - AskMarketAssistantInput - The input type for the askMarketAssistant function.
 * - AskMarketAssistantOutput - The return type for the askMarketAssistant function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {checkAndConsumeAIQuota, clampOutputText, MAX_OUTPUT_TOKENS, sanitizeUserInput} from '@/ai/guards';
import {AIQuotaExceededError, verifyAIFlowUserId} from '@/ai/flow-auth';

const AskMarketAssistantInputSchema = z.object({
  userQuestion: z.string().describe("The user's question about the brands in the marketplace."),
  brandsContext: z.string().describe('A summary of the brands available in the marketplace, including their name, category, donation rate, and description.'),
});
export type AskMarketAssistantInput = z.infer<typeof AskMarketAssistantInputSchema>;

const AskMarketAssistantOutputSchema = z.object({
  answer: z.string().describe('The helpful and informative answer to the user question.'),
});
export type AskMarketAssistantOutput = z.infer<typeof AskMarketAssistantOutputSchema>;

/**
 * P1-8c: `idToken` (optional) is the caller's Firebase ID token. NEVER
 * trust a bare uid. Token absent → quota skipped (fail-open). Cap hit →
 * throws `AIQuotaExceededError`.
 */
export async function askMarketAssistant(input: AskMarketAssistantInput, idToken?: string): Promise<AskMarketAssistantOutput> {
  // P1-8: sanitize user-supplied strings (clamp + strip control chars) before
  // prompt interpolation.
  const safeInput: AskMarketAssistantInput = {
    userQuestion: sanitizeUserInput(input.userQuestion, 2000),
    brandsContext: sanitizeUserInput(input.brandsContext, 8000),
  };
  const userId = await verifyAIFlowUserId(idToken);
  if (userId) {
    const { allowed } = await checkAndConsumeAIQuota(userId, 'marketplace-assistant');
    if (!allowed) {
      throw new AIQuotaExceededError('marketplace-assistant');
    }
  }
  return getMarketplaceAnswerFlow(safeInput);
}

const prompt = ai.definePrompt({
  name: 'getMarketplaceAnswerPrompt',
  model: 'googleai/gemini-2.5-flash',
  // P2-9: hard-cap Gemini output tokens as defense-in-depth against runaway cost.
  config: {maxOutputTokens: MAX_OUTPUT_TOKENS},
  input: {schema: AskMarketAssistantInputSchema},
  output: {schema: AskMarketAssistantOutputSchema},
  prompt: `You are a personal shopping assistant for "hangel", a marketplace for social-impact brands. Your goal is to recommend the best brands to the user based on what they want to buy and their values.

  Based on the user's request and the context of available brands, recommend a few suitable brands. For each brand, briefly explain why it's a good match.
  
  If the user asks a general question, answer it helpfully. If they describe what they're looking for, provide recommendations.
  
  Use formatting like lists or bold text to make the answer easy to read.
  Do not mention that you have a "provided list" or "context". Act as if you inherently know this information.

  Available Brands Context:
  {{{brandsContext}}}
  
  ---
  
  User Request: "{{{userQuestion}}}"`,
});

const getMarketplaceAnswerFlow = ai.defineFlow(
  {
    name: 'getMarketplaceAnswerFlow',
    inputSchema: AskMarketAssistantInputSchema,
    outputSchema: AskMarketAssistantOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    const safe = output!;
    // P2-9: post-clamp output as a last-resort guard against oversized responses.
    return {...safe, answer: clampOutputText(safe.answer)};
  }
);
