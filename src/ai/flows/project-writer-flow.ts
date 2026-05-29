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
  // PDF #3: the selected institution's "proje çağrı esasları" (requirements, format,
  // deadlines, keywords, focus areas). Optional — when absent the prompt omits it and
  // behaviour is unchanged. Populated server-side from the projectCallCriteria collection.
  callCriteria: z.string().optional().describe('The target institution\'s project-call criteria (requirements, format, deadlines, keywords, focus areas).'),
});
export type ProjectWriterInput = z.infer<typeof ProjectWriterInputSchema>;

const ProjectWriterOutputSchema = z.object({
  fullProposal: z.string().describe('The complete, professionally written project proposal in Markdown format.'),
});
export type ProjectWriterOutput = z.infer<typeof ProjectWriterOutputSchema>;

export interface AssistantRuntimeConfig {
  systemPrompt?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

const DEFAULT_PROJECT_SYSTEM =
  'You are an expert Social Project Writer. Your goal is to transform user notes into a professional project proposal. ' +
  'Use formal, persuasive, methodologically sound language (SMART goals, Logical Framework logic). Output in Turkish. ' +
  'Format with Markdown headings.';

function clampTemp(t: number | undefined): number {
  if (typeof t !== 'number' || Number.isNaN(t)) return 0.7;
  return Math.max(0, Math.min(1, t));
}
function clampTokens(n: number | undefined): number {
  if (typeof n !== 'number' || Number.isNaN(n)) return MAX_OUTPUT_TOKENS;
  return Math.max(64, Math.min(MAX_OUTPUT_TOKENS, Math.floor(n)));
}
function normalizeModel(m: string | undefined): string | null {
  if (!m) return null;
  if (m.startsWith('googleai/')) return m;
  if (m.startsWith('gemini-')) return `googleai/${m}`;
  return null;
}

export async function writeProjectProposal(
  input: ProjectWriterInput,
  idToken?: string,
  runtimeConfig?: AssistantRuntimeConfig,
): Promise<ProjectWriterOutput> {
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
    callCriteria: input.callCriteria !== undefined ? sanitizeUserInput(input.callCriteria, 6000) : undefined,
  };
  const userId = await verifyAIFlowUserId(idToken);
  if (userId) {
    const { allowed } = await checkAndConsumeAIQuota(userId, 'project-writer');
    if (!allowed) {
      throw new AIQuotaExceededError('project-writer');
    }
  }

  const systemPrompt = (runtimeConfig?.systemPrompt?.trim()) || DEFAULT_PROJECT_SYSTEM;
  const modelId = normalizeModel(runtimeConfig?.model) || 'googleai/gemini-2.5-flash';
  const temperature = clampTemp(runtimeConfig?.temperature);
  const maxOutputTokens = clampTokens(runtimeConfig?.maxTokens);

  const userPrompt = [
    `${systemPrompt}`,
    ``,
    `Target Institution: ${safeInput.institution}`,
    ``,
    `User Inputs:`,
    `- Summary Notes: ${safeInput.sections.summary || ''}`,
    `- Goals & Objectives: ${safeInput.sections.goals || ''}`,
    `- Target Audience: ${safeInput.sections.audience || ''}`,
    `- Activity Plan: ${safeInput.sections.activities || ''}`,
    `- Budget Logic: ${safeInput.sections.budget || ''}`,
    `- Impact & Measurement: ${safeInput.sections.impact || ''}`,
    ``,
    `Reference Library Context:`,
    safeInput.libraryContext,
    safeInput.callCriteria
      ? `\nProject Call Criteria for ${safeInput.institution} (talep ve esasları — you MUST comply with these):\n${safeInput.callCriteria}\n`
      : '',
    ``,
    `Instructions:`,
    `1. Use the specific terminology and standards of ${safeInput.institution}.`,
    `2. Incorporate data and academic evidence from the Reference Library Context where relevant.`,
    `3. Format the output professionally using Markdown.`,
    `4. Ensure the language is formal, persuasive, methodologically sound.`,
    `5. The output must be in Turkish.`,
    safeInput.callCriteria
      ? `6. Strictly align the proposal with the Project Call Criteria above.`
      : '',
  ].join('\n');

  const { output } = await ai.generate({
    model: modelId,
    prompt: userPrompt,
    // thinkingBudget:0 → 2.5-flash düşünme tokenları uzun proje önerisini truncate etmesin.
    config: { temperature, maxOutputTokens, thinkingConfig: { thinkingBudget: 0 } },
    output: { schema: ProjectWriterOutputSchema },
  });
  const safe = (output ?? { fullProposal: '' }) as ProjectWriterOutput;
  return { ...safe, fullProposal: clampOutputText(safe.fullProposal || '') };
}
