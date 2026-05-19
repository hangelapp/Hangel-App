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
import {checkAndConsumeAIQuota, clampOutputText, MAX_OUTPUT_TOKENS, sanitizeUserInput} from '@/ai/guards';
import {AIQuotaExceededError, verifyAIFlowUserId} from '@/ai/flow-auth';

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

/**
 * P1-8c: `idToken` (optional) is the caller's Firebase ID token. NEVER
 * trust a bare uid. Token absent → quota skipped (fail-open). Cap hit →
 * throws `AIQuotaExceededError`.
 */
export async function writeProjectProposal(input: ProjectWriterInput, idToken?: string): Promise<ProjectWriterOutput> {
  // P1-8: sanitize every user-supplied string (clamp + strip control chars)
  // before prompt interpolation.
  const safeInput: ProjectWriterInput = {
    institution: sanitizeUserInput(input.institution, 200),
    sections: {
      summary: input.sections.summary !== undefined ? sanitizeUserInput(input.sections.summary, 4000) : undefined,
      goals: input.sections.goals !== undefined ? sanitizeUserInput(input.sections.goals, 4000) : undefined,
      audience: input.sections.audience !== undefined ? sanitizeUserInput(input.sections.audience, 4000) : undefined,
      activities: input.sections.activities !== undefined ? sanitizeUserInput(input.sections.activities, 4000) : undefined,
      budget: input.sections.budget !== undefined ? sanitizeUserInput(input.sections.budget, 4000) : undefined,
      impact: input.sections.impact !== undefined ? sanitizeUserInput(input.sections.impact, 4000) : undefined,
    },
    libraryContext: sanitizeUserInput(input.libraryContext, 8000),
  };
  const userId = await verifyAIFlowUserId(idToken);
  if (userId) {
    const { allowed } = await checkAndConsumeAIQuota(userId, 'project-writer');
    if (!allowed) {
      throw new AIQuotaExceededError('project-writer');
    }
  }
  return projectWriterFlow(safeInput);
}

const prompt = ai.definePrompt({
  name: 'projectWriterPrompt',
  model: 'googleai/gemini-1.5-flash-latest',
  // P2-9: hard-cap Gemini output tokens as defense-in-depth against runaway cost.
  config: {maxOutputTokens: MAX_OUTPUT_TOKENS},
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
    const safe = output!;
    // P2-9: post-clamp output as a last-resort guard against oversized responses.
    return {...safe, fullProposal: clampOutputText(safe.fullProposal)};
  }
);
