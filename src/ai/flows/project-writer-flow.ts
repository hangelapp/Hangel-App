'use server';

/**
 * @fileOverview Professional project proposal writer AI agent.
 *
 * - writeProjectProposal - Generates a structured project proposal based on user input and library context.
 * - ProjectWriterInput - The input type for the flow.
 * - ProjectWriterOutput - The return type for the flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ProjectWriterInputSchema = z.object({
  institution: z.string().describe('The target institution for the project (e.g., EU, UNDP, Ministry).'),
  sections: z.object({
    summary: z.string().optional(),
    goals: z.string().optional(),
    audience: z.string().optional(),
    activities: z.string().optional(),
    budget: z.string().optional(),
    impact: z.string().optional(),
  }),
  libraryContext: z.string().describe('Relevant library data and academic context.'),
});
export type ProjectWriterInput = z.infer<typeof ProjectWriterInputSchema>;

const ProjectWriterOutputSchema = z.object({
  fullProposal: z.string().describe('The complete, professionally written project proposal in Markdown format.'),
});
export type ProjectWriterOutput = z.infer<typeof ProjectWriterOutputSchema>;

export async function writeProjectProposal(input: ProjectWriterInput): Promise<ProjectWriterOutput> {
  return projectWriterFlow(input);
}

const prompt = ai.definePrompt({
  name: 'projectWriterPrompt',
  model: 'googleai/gemini-1.5-flash-latest',
  input: {schema: ProjectWriterInputSchema},
  output: {schema: ProjectWriterOutputSchema},
  prompt: `You are an expert Social Project Writer. Your goal is to transform user notes into a professional project proposal suitable for {{{institution}}}.

  Target Institution: {{{institution}}}
  
  User Inputs:
  - Summary Notes: {{{sections.summary}}}
  - Goals & Objectives: {{{sections.goals}}}
  - Target Audience: {{{sections.audience}}}
  - Activity Plan: {{{sections.activities}}}
  - Budget Logic: {{{sections.budget}}}
  - Impact & Measurement: {{{sections.impact}}}

  Reference Library Context:
  {{{libraryContext}}}

  Instructions:
  1. Use the specific terminology and standards of {{{institution}}}.
  2. Incorporate data and academic evidence from the Reference Library Context where relevant to strengthen the project's justification.
  3. Format the output professionally using Markdown. Include clear headings for each section.
  4. Ensure the language is formal, persuasive, and methodologically sound (SMART goals, Logical Framework logic).
  5. The output should be in Turkish.`,
});

const projectWriterFlow = ai.defineFlow(
  {
    name: 'projectWriterFlow',
    inputSchema: ProjectWriterInputSchema,
    outputSchema: ProjectWriterOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
