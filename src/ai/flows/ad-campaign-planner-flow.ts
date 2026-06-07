'use server';

/**
 * @fileOverview STK reklam planlayıcı — Google Ad Grants kampanya önerileri.
 *
 * Bir dernek/vakıf/kulübün adı + faaliyet alanından yola çıkarak Gemini ile
 * 5 hazır kampanya önerisi üretir (sabit sıra):
 *   1. search-donation    — bağış toplama (Google Arama)
 *   2. search-awareness   — bilinirlik / destekçi büyütme
 *   3. search-beneficiary — yararlanıcıya / hizmet alacaklara ulaşma
 *   4. hangel-donation    — açılış sayfası = hangel bağış sayfası (kurum sitesi yoksa da çalışır)
 *   5. hangel-volunteer   — açılış sayfası = hangel imece gönüllülük ilanları
 *
 * Tüm öneriler Ad Grants politikasına uyumlu kurgulanır (2+ kelime anahtar
 * kelimeler, tek kelime yasak, görev odaklı). STK jargon görmez; sade dil.
 *
 * Çağrı yalnızca sunucudan (/api/ads/plan). Quota + auth guard'lı.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { checkAndConsumeAIQuota, MAX_OUTPUT_TOKENS, sanitizeUserInput } from '@/ai/guards';
import { AIQuotaExceededError, verifyAIFlowUserId } from '@/ai/flow-auth';

const AdPlanInputSchema = z.object({
  orgName: z.string().describe('Kuruluşun adı (dernek/vakıf/kulüp).'),
  orgType: z.string().describe('Tür: Dernek / Vakıf / Kulüp / Federasyon.'),
  faaliyetAlani: z.string().describe('Faaliyet alanı (ör. eğitim, sağlık, çevre, afet).'),
  city: z.string().describe('İl (boş olabilir).'),
  hangelDonationUrl: z.string().describe('Kurumun hangel bağış/profil sayfası URL\'i.'),
  hangelVolunteerUrl: z.string().describe('Kurumun hangel imece gönüllülük ilanları URL\'i.'),
  website: z.string().describe('Kurumun kendi web sitesi (yoksa boş).'),
});
export type AdPlanInput = z.infer<typeof AdPlanInputSchema>;

const ProposalSchema = z.object({
  kind: z.enum(['search-donation', 'search-awareness', 'search-beneficiary', 'hangel-donation', 'hangel-volunteer']),
  title: z.string().describe('Önerinin kısa başlığı (TR).'),
  goal: z.string().describe('Bu kampanya ne işe yarar — jargon yok, sade tek cümle.'),
  landing: z.enum(['kurum-sitesi', 'hangel-bagis', 'hangel-gonulluluk']).describe('Açılış sayfası tipi.'),
  keywords: z.array(z.string()).describe('Ad Grants uyumlu anahtar kelimeler — HER BİRİ en az 2 kelime, tek kelime YASAK.'),
  headlines: z.array(z.string()).describe('Reklam başlıkları — her biri ≤30 karakter, Türkçe.'),
  descriptions: z.array(z.string()).describe('Reklam açıklamaları — her biri ≤90 karakter, Türkçe.'),
  regions: z.array(z.string()).describe('Hedef bölgeler (il adları veya "Türkiye").'),
  estReach: z.string().describe('Sade tahmini erişim, ör. "ayda ~1.500 kişiye ulaşır".'),
});
export type AdProposal = z.infer<typeof ProposalSchema>;

const AdPlanOutputSchema = z.object({
  proposals: z.array(ProposalSchema).describe('Tam 5 öneri, yukarıdaki sabit sırada.'),
});
export type AdPlanOutput = z.infer<typeof AdPlanOutputSchema>;

export async function planAdCampaigns(input: AdPlanInput, idToken?: string): Promise<AdPlanOutput> {
  const safeInput: AdPlanInput = {
    orgName: sanitizeUserInput(input.orgName, 200),
    orgType: sanitizeUserInput(input.orgType, 50),
    faaliyetAlani: sanitizeUserInput(input.faaliyetAlani, 300),
    city: sanitizeUserInput(input.city, 80),
    hangelDonationUrl: sanitizeUserInput(input.hangelDonationUrl, 500),
    hangelVolunteerUrl: sanitizeUserInput(input.hangelVolunteerUrl, 500),
    website: sanitizeUserInput(input.website, 500),
  };
  const userId = await verifyAIFlowUserId(idToken);
  if (userId) {
    const { allowed } = await checkAndConsumeAIQuota(userId, 'ad-campaign-planner');
    if (!allowed) throw new AIQuotaExceededError('ad-campaign-planner');
  }
  const out = await planAdCampaignsFlow(safeInput);
  // Güvence: en fazla 5 öneri döndür (modelin fazlasını kırp).
  return { proposals: (out.proposals ?? []).slice(0, 5) };
}

const prompt = ai.definePrompt({
  name: 'adCampaignPlannerPrompt',
  model: 'googleai/gemini-2.5-flash',
  config: { maxOutputTokens: MAX_OUTPUT_TOKENS },
  input: { schema: AdPlanInputSchema },
  output: { schema: AdPlanOutputSchema },
  prompt: `Sen "hangel Reklam Planlayıcı"sın — Türk sivil toplum kuruluşları (STK) için Google Ad Grants (ayda 10.000 USD ücretsiz Google Arama reklamı) kampanyaları kurgulayan uzman bir dijital pazarlamacısın.

GÖREV: Aşağıdaki kuruluş için TAM 5 hazır kampanya önerisi üret. STK bunları okuyacak — teknik jargon (CPC, CTR, dönüşüm) KULLANMA, sade ve cesaretlendirici Türkçe yaz.

KURULUŞ:
- Ad: {{{orgName}}}
- Tür: {{{orgType}}}
- Faaliyet alanı: {{{faaliyetAlani}}}
- İl: {{{city}}}
- hangel bağış sayfası: {{{hangelDonationUrl}}}
- hangel gönüllülük (imece) sayfası: {{{hangelVolunteerUrl}}}
- Kendi web sitesi: {{{website}}}

5 ÖNERİ — TAM ŞU SIRADA:
1. kind="search-donation": Bağış toplama odaklı. landing = kurum sitesi varsa "kurum-sitesi", yoksa "hangel-bagis".
2. kind="search-awareness": Bilinirlik / destekçi (üye, takipçi) büyütme. landing yukarıdaki gibi.
3. kind="search-beneficiary": Hizmet/yardım alacaklara (yararlanıcı) ulaşma. landing yukarıdaki gibi.
4. kind="hangel-donation": Açılış sayfası MUTLAKA "hangel-bagis". Kurumun sitesi olmasa bile hangel bağış sayfası kullanılır.
5. kind="hangel-volunteer": Açılış sayfası MUTLAKA "hangel-gonulluluk". hangel imece gönüllülük ilanlarına yönlendirir.

HER ÖNERİDE:
- keywords: faaliyet alanına uygun, niyet odaklı, HER BİRİ EN AZ 2 KELİME (Ad Grants tek kelimeyi yasaklar). Marka/rakip adı kullanma. 6-10 anahtar kelime.
- headlines: 3 adet, her biri ≤30 karakter, vurucu Türkçe.
- descriptions: 2 adet, her biri ≤90 karakter, net çağrı içeren Türkçe.
- regions: İl belliyse o il + çevresi; değilse ["Türkiye"].
- goal: tek cümle, sade — "ne işe yarar".
- estReach: dostane tahmin, ör. "ayda ~1.000-2.000 kişiye ulaşır".

Yalnızca verilen bilgiye dayan; uydurma istatistik verme. Türkçe yaz.`,
});

const planAdCampaignsFlow = ai.defineFlow(
  {
    name: 'planAdCampaignsFlow',
    inputSchema: AdPlanInputSchema,
    outputSchema: AdPlanOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  },
);
