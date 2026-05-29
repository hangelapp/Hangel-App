'use server';

/**
 * @fileOverview A product description AI agent for the marketplace.
 *
 * - getProductDescription - A function that handles the product description process.
 * - GetProductDescriptionInput - The input type for the getProductDescription function.
 * - GetProductDescriptionOutput - The return type for the getProductDescription function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {checkAndConsumeAIQuota, clampOutputText, MAX_OUTPUT_TOKENS, sanitizeUserInput} from '@/ai/guards';
import {AIQuotaExceededError, verifyAIFlowUserId} from '@/ai/flow-auth';

const GetProductDescriptionInputSchema = z.object({
  productName: z.string().describe('The name of the product.'),
  productDescription: z.string().describe('The description of the product.'),
  userQuestion: z.string().describe('The question the user has about the product.'),
});
export type GetProductDescriptionInput = z.infer<typeof GetProductDescriptionInputSchema>;

const GetProductDescriptionOutputSchema = z.object({
  answer: z.string().describe('The answer to the user question about the product.'),
});
export type GetProductDescriptionOutput = z.infer<typeof GetProductDescriptionOutputSchema>;

/**
 * P1-8c: `idToken` (optional) is the caller's Firebase ID token. NEVER
 * trust a bare uid. Token absent → quota skipped (fail-open). Cap hit →
 * throws `AIQuotaExceededError`.
 */
export async function getProductDescription(input: GetProductDescriptionInput, idToken?: string): Promise<GetProductDescriptionOutput> {
  // P1-8: sanitize user-supplied strings (clamp + strip control chars) before
  // prompt interpolation.
  const safeInput: GetProductDescriptionInput = {
    productName: sanitizeUserInput(input.productName, 200),
    productDescription: sanitizeUserInput(input.productDescription, 4000),
    userQuestion: sanitizeUserInput(input.userQuestion, 2000),
  };
  const userId = await verifyAIFlowUserId(idToken);
  if (userId) {
    const { allowed } = await checkAndConsumeAIQuota(userId, 'product-description');
    if (!allowed) {
      throw new AIQuotaExceededError('product-description');
    }
  }
  return getProductDescriptionFlow(safeInput);
}

const prompt = ai.definePrompt({
  name: 'getProductDescriptionPrompt',
  model: 'googleai/gemini-2.5-flash',
  // P2-9: hard-cap Gemini output tokens as defense-in-depth against runaway cost.
  config: {maxOutputTokens: MAX_OUTPUT_TOKENS},
  input: {schema: GetProductDescriptionInputSchema},
  output: {schema: GetProductDescriptionOutputSchema},
  prompt: `You are a helpful AI assistant that answers questions about products in a marketplace.

  You will be given the product name, product description, and a question from the user.

  You should answer the question to the best of your ability using the information provided in the product description.

  Product Name: {{{productName}}}
  Product Description: {{{productDescription}}}
  User Question: {{{userQuestion}}}
  `,
});

const getProductDescriptionFlow = ai.defineFlow(
  {
    name: 'getProductDescriptionFlow',
    inputSchema: GetProductDescriptionInputSchema,
    outputSchema: GetProductDescriptionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    const safe = output!;
    // P2-9: post-clamp output as a last-resort guard against oversized responses.
    return {...safe, answer: clampOutputText(safe.answer)};
  }
);
