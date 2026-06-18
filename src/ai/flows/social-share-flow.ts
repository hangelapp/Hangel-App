'use server';

/**
 * @fileOverview Sosyal medya paylaşım metni üretici.
 *
 * Bir etkinlik veya gönüllülük ilanından yola çıkarak Gemini ile 5 platforma
 * AYRI paylaşım metni üretir (x/twitter, instagram, facebook, linkedin,
 * whatsapp). Her metin platforma uygun ton/uzunlukta ve sonunda ilgili Türkçe
 * hashtag'lerle gelir. Yönetici metni kopyalayıp paylaşır.
 *
 * Çağrı yalnızca sunucudan (/api/ngo-admin/social-share). Quota + auth guard'lı.
 * 'use server' kısıtı: şemalar/tipler ayrı dosyada (social-share-types.ts).
 */

import { ai } from '@/ai/genkit';
import { checkAndConsumeAIQuota, MAX_OUTPUT_TOKENS, sanitizeUserInput } from '@/ai/guards';
import { AIQuotaExceededError, verifyAIFlowUserId } from '@/ai/flow-auth';
// 'use server' dosyaları const/tip export edemez → ayrı dosyadan import.
import {
  SocialShareInputSchema,
  SocialShareOutputSchema,
  type SocialShareInput,
  type SocialShareOutput,
} from './social-share-types';

const sharePrompt = ai.definePrompt({
  name: 'socialSharePrompt',
  model: 'googleai/gemini-2.5-flash',
  config: { maxOutputTokens: MAX_OUTPUT_TOKENS },
  input: { schema: SocialShareInputSchema },
  output: { schema: SocialShareOutputSchema },
  prompt: `Sen "hangel Sosyal Medya Asistanı"sın — Türk sivil toplum kuruluşları (STK) için sosyal medya paylaşım metinleri yazan uzman bir içerik yazarısın.

GÖREV: Aşağıdaki içerik (tür: {{{kind}}} — event=etkinlik, volunteering=gönüllülük ilanı) için TAM 5 platforma AYRI AYRI hazır paylaşım metni üret. Her metin o platformun tonuna ve uzunluğuna uygun, kopyalanıp doğrudan paylaşılmaya hazır olsun.

İÇERİK:
- Tür: {{{kind}}} (event=etkinlik, volunteering=gönüllülük ilanı)
- Başlık: {{{title}}}
- Açıklama: {{{description}}}
- Tarih: {{{date}}}
- Konum: {{{location}}}
- Şehir: {{{city}}}
- Kuruluş: {{{ngoName}}}
- Link: {{{url}}}

PLATFORMLAR — TAM ŞU 5'i, ŞU SIRADA, her biri için bir post nesnesi:
1. platform="x": X (Twitter). Metin EN FAZLA 280 KARAKTER (hashtag dahil). Kısa, çarpıcı, dikkat çekici. Az ama etkili emoji.
2. platform="instagram": Görsel-odaklı, sıcak ve ilham verici. Bol ve ilgili hashtag (6-12). Uygun ölçüde emoji.
3. platform="facebook": Samimi, hikâye anlatan, net bir çağrı (CTA) içeren orta uzunlukta metin. 2-4 hashtag.
4. platform="linkedin": Kurumsal ve profesyonel ton; toplumsal etki/iş birliği vurgusu. Az hashtag (3-5), profesyonel.
5. platform="whatsapp": Kısa ve kişisel, doğrudan bir arkadaşa yazar gibi. Hashtag AZ (0-2) veya hiç.

KURALLAR:
- TÜRKÇE yaz.
- "hangel" kelimesini kullanıcıya gösterilen metinde DAİMA küçük harfle yaz.
- Her metnin "text" alanı paylaşıma hazır olsun; ilgili hashtag'leri metnin SONUNA da ekle ve ayrıca "hashtags" dizisine koy.
- hashtags: Türkçe ve konuyla ilgili; uygun olduğunda #gönüllülük #STK #sosyaletki gibi genel etiketler + etkinlik/şehir/konu bazlı etiketler. Her hashtag # işaretiyle başlasın, boşluk içermesin.
- 🙏 ikonunu ASLA kullanma. Bir kalp gerekiyorsa 🧡 (turuncu kalp) kullan.
- Emoji'yi platforma uygun ölçüde kullan (LinkedIn'de az, Instagram'da daha çok).
- Link verilmişse uygun platformlarda çağrıya (CTA) ekle.
- Yalnızca verilen bilgiye dayan; uydurma tarih/sayı/yer ekleme.`,
});

const socialShareFlow = ai.defineFlow(
  {
    name: 'socialShareFlow',
    inputSchema: SocialShareInputSchema,
    outputSchema: SocialShareOutputSchema,
  },
  async (input) => {
    const { output } = await sharePrompt(input);
    return output!;
  },
);

/**
 * Etkinlik/ilan bilgisinden 5 platforma paylaşım metni üretir.
 * Quota + auth guard'lı; yalnız sunucudan (/api/ngo-admin/social-share) çağrılır.
 */
export async function generateSocialShare(
  input: SocialShareInput,
  idToken?: string,
): Promise<SocialShareOutput> {
  const safeInput: SocialShareInput = {
    kind: input.kind === 'volunteering' ? 'volunteering' : 'event',
    title: sanitizeUserInput(input.title, 300),
    description: sanitizeUserInput(input.description ?? '', 2000),
    date: sanitizeUserInput(input.date ?? '', 120) || undefined,
    location: sanitizeUserInput(input.location ?? '', 300) || undefined,
    city: sanitizeUserInput(input.city ?? '', 120) || undefined,
    ngoName: sanitizeUserInput(input.ngoName ?? '', 200) || undefined,
    url: sanitizeUserInput(input.url ?? '', 500) || undefined,
  };
  const userId = await verifyAIFlowUserId(idToken);
  if (userId) {
    const { allowed } = await checkAndConsumeAIQuota(userId, 'social-share');
    if (!allowed) throw new AIQuotaExceededError('social-share');
  }
  const out = await socialShareFlow(safeInput);
  // Güvence: en fazla 5 post döndür (modelin fazlasını kırp).
  return { posts: (out.posts ?? []).slice(0, 5) };
}
