'use server';

/**
 * @fileOverview A library assistant AI agent that works within the context of the library data.
 *
 * - askLibraryAssistant - A function that handles answering questions about the library resources.
 * - AskLibraryAssistantInput - The input type for the askLibraryAssistant function.
 * - AskLibraryAssistantOutput - The return type for the askLibraryAssistant function.
 */

import {ai} from '@/ai/genkit';
import {googleAI} from '@genkit-ai/google-genai';
import {z} from 'genkit';

const AskLibraryAssistantInputSchema = z.object({
  userQuestion: z.string().describe("The user's question about the resources in the library."),
  libraryContext: z.string().describe('A summary of the library sections and items available.'),
});
export type AskLibraryAssistantInput = z.infer<typeof AskLibraryAssistantInputSchema>;

const AskLibraryAssistantOutputSchema = z.object({
  answer: z.string().describe('The helpful and informative answer based ONLY on the provided library context.'),
});
export type AskLibraryAssistantOutput = z.infer<typeof AskLibraryAssistantOutputSchema>;

export async function askLibraryAssistant(input: AskLibraryAssistantInput): Promise<AskLibraryAssistantOutput> {
  return getLibraryAnswerFlow(input);
}

const prompt = ai.definePrompt({
  name: 'getLibraryAnswerPrompt',
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
    const {output} = await prompt(input, {model: googleAI.model('gemini-1.5-flash-latest')});
    return output!;
  }
);
