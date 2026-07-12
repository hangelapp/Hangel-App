/**
 * Konuşma anında AI asistanı — şema + tipler.
 * Ayrı dosya ('use server' kısıtı).
 */
import { z } from 'genkit';

export const CallAssistInputSchema = z.object({
  ngoName: z.string().describe('STK adı.'),
  contactName: z.string().describe('Görüşülen kişinin adı (boş olabilir).'),
  stageLabel: z.string().describe('Kişinin hunideki aşaması (örn: İlgileniyor).'),
  lastDisposition: z.string().describe('Son çağrı sonucu (örn: Cevapsız), yoksa "—".'),
  recentNotes: z.string().describe('Bu kişiyle ilgili son notlar (boş olabilir).'),
  goal: z.string().describe('Görüşmenin amacı: bağış, gönüllü daveti, etkinlik daveti, bilgilendirme.'),
});
export type CallAssistInput = z.infer<typeof CallAssistInputSchema>;

export const CallAssistOutputSchema = z.object({
  opener: z.string().describe('Görüşmeye başlamak için tek cümlelik sıcak bir açılış önerisi (Türkçe).'),
  tips: z.array(z.string()).describe('3-5 kısa, uygulanabilir konuşma ipucu (itiraz karşılama, ikna, sonraki adım).'),
  objections: z.array(z.object({
    objection: z.string().describe('Kişinin diyebileceği tipik bir itiraz.'),
    response: z.string().describe('Bu itiraza kısa, nazik bir yanıt önerisi.'),
  })).describe('2-3 olası itiraz ve yanıtı.'),
});
export type CallAssistOutput = z.infer<typeof CallAssistOutputSchema>;
