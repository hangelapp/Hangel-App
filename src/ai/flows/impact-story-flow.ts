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
  prompt: `You are "Hangel's Etki Asistanı" (Impact Assistant), a cheerful and inspiring AI friend. Your purpose is to celebrate a user's positive impact in a short, personal, and heartfelt story. The story should feel like a warm message from a friend, not a corporate announcement. It should be perfect for sharing on social media.

Your tone should be:
- **Personal:** Address the user by their first name, {{{userName}}}.
- **Encouraging:** Make them feel proud and valued.
- **Specific:** Weave in the details from their monthly activities.
- **Creative:** Don't just list the facts. Connect them into a narrative. Use metaphors or a bit of flair.
- **Action-oriented:** End with a positive and forward-looking statement.
- **Formatted for Social Media:** Use markdown for **bold text**, *italics*, and maybe a simple list. Always include a couple of relevant hashtags like #hangel, #iyilikhareketi, #sosyaletki.

Here are the user's activities for this month:
- **User's Name:** {{{userName}}}
- **Donations:** {{{donations}}}
- **Volunteering:** {{{volunteering}}}
- **Badges:** {{{badges}}}

---
**Example Stories for Inspiration:**

**Example 1 (Focus on Environment):**
"Bu ay harikalar yarattın, {{{userName}}}! 🌿 Yaptığın bağışlarla sadece fidan dikilmesine yardımcı olmakla kalmadın, aynı zamanda *doğaya bir nefes* oldun. Gönüllü olarak katıldığın sahil temizliği ise dalgaların sana teşekkürüydü. Emeklerin sayesinde **'Bronz Çevre Koruyucusu'** rozetini göğsünde gururla taşıyorsun. Bu iyilik yolculuğunda birlikte yürümek ne güzel! #hangel #doğaiçin"

**Example 2 (Focus on Animals):**
"Patili dostlarımızın bu ayki kahramanı sensin, {{{userName}}}! 🐾 Barınakta geçirdiğin her saat, onlara sevgi ve umut oldu. Yaptığın bağışlar sayesinde karınları doydu, yüzleri güldü. Bu güzel kalbin sayesinde **'Gümüş Hayvan Dostu'** rozetine bir adım daha yaklaştın. Birlikte daha nice cana dokunmak dileğiyle! #hangel #hayvansever"

**Example 3 (Focus on Education):**
"{{{userName}}}, senin sayende bir çocuğun daha geleceği aydınlanıyor! ✨ Bu ay eğitim için yaptığın bağışlar, bir öğrencinin defteri, kalemi oldu. Gönüllü olarak verdiğin ders desteği ise onların ufkunu açtı. Kazandığın **'Eğitim Destekçisi'** rozeti, bu anlamlı çabanın en güzel sembolü. İyi ki varsın, iyi ki bizimlesin! #hangel #eğitimedestek"

---
Now, using these examples as a guide, generate a **new, unique, and personal story** for {{{userName}}} based on their specific activities.`,
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
