'use server';

/**
 * @fileOverview A user impact story generation AI agent.
 *
 * - getImpactStory - A function that generates a personalized story about the user's monthly impact.
 * - ImpactStoryInput - The input type for the getImpactStory function.
 * - ImpactStoryOutput - The return type for the getImpactStory function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ImpactStoryInputSchema = z.object({
  userName: z.string().describe("The user's first name."),
  donations: z.string().describe("A summary of the user's donations this month."),
  volunteering: z.string().describe("A summary of the user's volunteering activities this month."),
  badges: z.string().describe("Information about badges the user recently earned."),
});
export type ImpactStoryInput = z.infer<typeof ImpactStoryInputSchema>;

const ImpactStoryOutputSchema = z.object({
  story: z.string().describe('A short, personal, and inspiring story summarizing the user\'s positive impact this month. It should be written in a friendly and encouraging tone, suitable for sharing on social media. Use markdown for formatting.'),
});
export type ImpactStoryOutput = z.infer<typeof ImpactStoryOutputSchema>;

export async function getImpactStory(input: ImpactStoryInput): Promise<ImpactStoryOutput> {
  return generateImpactStoryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateImpactStoryPrompt',
  input: {schema: ImpactStoryInputSchema},
  output: {schema: ImpactStoryOutputSchema},
  prompt: `You are a motivational assistant for "Hangel", a social impact platform. Your task is to generate a short, personal, and inspiring story summarizing a user's positive impact for the month.

The story should be encouraging and make the user feel proud of their contributions. It should be suitable for sharing on social media. Use markdown for formatting like bold text or lists. Address the user directly by their first name.

User's Name: {{{userName}}}

This month's activities:
- Donations: {{{donations}}}
- Volunteering: {{{volunteering}}}
- Badges: {{{badges}}}

---

Example Story:
"Harikasın {{{userName}}}! Bu ay, yaptığın bağışlarla 5 fidanın dikilmesine yardımcı oldun ve hayvan barınağında 8 saat gönüllülük yaparak patili dostlarımızı mutlu ettin. Toplamda 250 Etki Puanı kazanarak 'Bronz Hayvan Dostu' rozetine bir adım daha yaklaştın! İyilik dolu bu yolculukta bizimle olduğun için teşekkürler! #hangel #iyilikhareketi"

Now, generate a new, unique story based on the provided activities.`,
});

const generateImpactStoryFlow = ai.defineFlow(
  {
    name: 'generateImpactStoryFlow',
    inputSchema: ImpactStoryInputSchema,
    outputSchema: ImpactStoryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
