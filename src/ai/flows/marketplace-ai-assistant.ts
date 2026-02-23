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

const AskMarketAssistantInputSchema = z.object({
  userQuestion: z.string().describe("The user's question about the brands in the marketplace."),
  brandsContext: z.string().describe('A summary of the brands available in the marketplace, including their name, category, donation rate, and description.'),
});
export type AskMarketAssistantInput = z.infer<typeof AskMarketAssistantInputSchema>;

const AskMarketAssistantOutputSchema = z.object({
  answer: z.string().describe('The helpful and informative answer to the user question.'),
});
export type AskMarketAssistantOutput = z.infer<typeof AskMarketAssistantOutputSchema>;

export async function askMarketAssistant(input: AskMarketAssistantInput): Promise<AskMarketAssistantOutput> {
  return getMarketplaceAnswerFlow(input);
}

const prompt = ai.definePrompt({
  name: 'getMarketplaceAnswerPrompt',
  model: 'googleai/gemini-1.5-flash-latest',
  input: {schema: AskMarketAssistantInputSchema},
  output: {schema: AskMarketAssistantOutputSchema},
  prompt: `You are a personal shopping assistant for "Hangel", a marketplace for social-impact brands. Your goal is to recommend the best brands to the user based on what they want to buy and their values.

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
    return output!;
  }
);
