/**
 * Sosyal medya paylaşım metni üretici — şema + tipler.
 *
 * AYRI dosya (NOT 'use server') — 'use server' dosyaları yalnız async fonksiyon
 * export edebilir, const/tip edemez. Hem social-share-flow (server) hem
 * /api/ngo-admin/social-share route buradan import eder.
 * (ad-campaign-planner'ın ad-platforms.ts deseni.)
 */
import { z } from 'genkit';

// Üretilecek 5 sosyal medya platformu (sabit sıra). Her platform için ayrı metin.
export const SOCIAL_PLATFORMS = ['x', 'instagram', 'facebook', 'linkedin', 'whatsapp'] as const;
export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];

// Paylaşımın neyle ilgili olduğu: etkinlik mi gönüllülük ilanı mı.
export const SOCIAL_SHARE_KINDS = ['event', 'volunteering'] as const;
export type SocialShareKind = (typeof SOCIAL_SHARE_KINDS)[number];

export const SocialShareInputSchema = z.object({
  kind: z.enum(SOCIAL_SHARE_KINDS).describe('Paylaşım türü: etkinlik mi gönüllülük ilanı mı.'),
  title: z.string().describe('Etkinlik/ilan başlığı.'),
  description: z.string().describe('Etkinlik/ilan açıklaması (boş olabilir).'),
  date: z.string().optional().describe('Tarih (varsa).'),
  location: z.string().optional().describe('Konum / adres (varsa).'),
  city: z.string().optional().describe('Şehir (varsa).'),
  ngoName: z.string().optional().describe('Kuruluş adı (varsa).'),
  url: z.string().optional().describe('Etkinliğin/ilanın public linki (varsa).'),
});
export type SocialShareInput = z.infer<typeof SocialShareInputSchema>;

export const SocialPostSchema = z.object({
  platform: z.enum(SOCIAL_PLATFORMS).describe('Bu metnin hazırlandığı platform.'),
  text: z.string().describe('Platforma uygun ton/uzunlukta hazır paylaşım metni (Türkçe).'),
  hashtags: z.array(z.string()).describe('İlgili Türkçe hashtag\'ler (# işaretiyle).'),
});
export type SocialPost = z.infer<typeof SocialPostSchema>;

export const SocialShareOutputSchema = z.object({
  posts: z.array(SocialPostSchema).describe('Tam 5 platform için paylaşım metni.'),
});
export type SocialShareOutput = z.infer<typeof SocialShareOutputSchema>;
