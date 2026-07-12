/**
 * AI çağrı özeti — şema + tipler.
 *
 * AYRI dosya (NOT 'use server') — 'use server' dosyaları yalnız async fonksiyon
 * export edebilir. Hem call-summary-flow (server) hem
 * /api/ngo-admin/call-center/contacts/[id]/summary route buradan import eder.
 */
import { z } from 'genkit';

export const CallSummaryInputSchema = z.object({
  contactName: z.string().describe('Görüşülen kişinin adı (boş olabilir).'),
  notes: z.string().describe('Bu kişiyle yapılan görüşmelerin birleştirilmiş notları.'),
  dispositions: z.string().describe('Çağrı sonuçları geçmişi (örn: "Görüşüldü, Cevapsız").'),
  tags: z.string().describe('Çağrı etiketleri (örn: "bağış sözü, bilgi").'),
});
export type CallSummaryInput = z.infer<typeof CallSummaryInputSchema>;

export const CALL_SENTIMENTS = ['olumlu', 'nötr', 'olumsuz'] as const;
export type CallSentiment = (typeof CALL_SENTIMENTS)[number];

export const CallSummaryOutputSchema = z.object({
  summary: z.string().describe('2-4 cümlelik, yöneticinin hızla okuyabileceği görüşme özeti (Türkçe).'),
  nextStep: z.string().describe('Bu kişiyle ilgili önerilen bir sonraki adım (tek cümle, Türkçe).'),
  sentiment: z.enum(CALL_SENTIMENTS).describe('Görüşmenin genel havası.'),
});
export type CallSummaryOutput = z.infer<typeof CallSummaryOutputSchema>;
