'use server';

/**
 * @fileOverview STK kurumsal sürdürülebilirlik / etki raporu üretici.
 *
 * - generateImpactReport: bir STK'nın platform verisinden (bağış, gönüllülük,
 *   etkinlik, şeffaflık skoru, desteklenen SKA'lar) GRI/kurumsal sürdürülebilirlik
 *   raporu tonunda, standart bir bilgi sayfası havasında Türkçe etki raporu üretir.
 *   Çıktı: özet + 3-5 anlatı bölümü + öne çıkan etki metrikleri + SKA uyumu.
 *
 * Yalnızca server tarafından (/api/ngo/impact-report) çağrılır. Çıktı ngos/{id}.
 * impactReport alanına cache'lenir ve dönemsel güncellenir.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { sanitizeUserInput, checkAndConsumeAIQuota, MAX_OUTPUT_TOKENS } from '@/ai/guards';
import { verifyAIFlowUserId, AIQuotaExceededError } from '@/ai/flow-auth';

const _ImpactReportInputSchema = z.object({
  ngoName: z.string().describe('STK / kuruluşun adı.'),
  category: z.string().describe('Kuruluşun faaliyet alanı / kategorisi.'),
  type: z.string().describe('Kuruluş türü (Dernek, Vakıf, Spor Kulübü vb.).'),
  about: z.string().describe('Kuruluşun kendini tanıttığı kısa metin.'),
  period: z.string().describe('Raporun kapsadığı dönem (ör. "2026 — Yıllık").'),
  donors: z.number().describe('Toplam bağışçı sayısı.'),
  totalDonation: z.number().describe('Toplam bağış tutarı (TRY).'),
  volunteers: z.number().describe('Toplam gönüllü sayısı.'),
  volunteerHours: z.number().describe('Toplam gönüllülük saati.'),
  volunteerValueTRY: z.number().describe('Gönüllülüğün tahmini ekonomik değeri (TRY).'),
  projects: z.number().describe('Tamamlanan proje sayısı.'),
  peopleReached: z.number().describe('Ulaşılan toplam kişi sayısı.'),
  transparencyScore: z.number().describe('Şeffaflık endeksi yüzdesi (0-100).'),
  sdgs: z.string().describe('Desteklenen Sürdürülebilir Kalkınma Amaçları (SKA), virgülle ayrık.'),
  beneficiaryGroups: z.string().describe('Faydalanıcı gruplar, virgülle ayrık.'),
});
export type ImpactReportInput = z.infer<typeof _ImpactReportInputSchema>;

const MetricSchema = z.object({
  label: z.string().describe('Metriğin adı — kısa Türkçe (ör. "Ulaşılan Kişi", "Gönüllülük Saati").'),
  value: z.string().describe('Metriğin biçimlenmiş değeri (ör. "12.450", "1,2 milyon ₺"). UYDURMA — sadana verilen sayıları kullan.'),
  note: z.string().describe('Tek cümlelik bağlam / yorum. Boş bırakılabilir.'),
});

const SectionSchema = z.object({
  heading: z.string().describe('Bölüm başlığı — kurumsal sürdürülebilirlik raporu tonunda Türkçe (ör. "Sosyal Etki", "Yönetişim ve Şeffaflık").'),
  body: z.string().describe('2-4 cümlelik düz metin paragraf. Verilen metriklere dayalı, ölçülü ve resmî ton. Markdown/HTML KULLANMA.'),
});

const SdgAlignmentSchema = z.object({
  sdg: z.string().describe('SKA adı (verilen listeden birebir).'),
  contribution: z.string().describe('Kuruluşun bu amaca katkısı — tek cümle Türkçe.'),
});

const ImpactReportOutputSchema = z.object({
  summary: z.string().describe('Yönetici özeti — 2-3 cümle. Kuruluşun döneme dair etkisini kurumsal sürdürülebilirlik raporu tonunda özetler.'),
  metrics: z.array(MetricSchema).describe('3-6 öne çıkan etki metriği. Sadece verilen sayılardan türet.'),
  sdgAlignment: z.array(SdgAlignmentSchema).describe('Desteklenen SKA\'larla uyum — en fazla 5. SKA verilmediyse boş dizi.'),
  sections: z.array(SectionSchema).describe('3-5 anlatı bölümü (ör. Sosyal Etki, Gönüllülük, Yönetişim/Şeffaflık, Geleceğe Bakış).'),
});
export type ImpactReportMetric = z.infer<typeof MetricSchema>;
export type ImpactReportSection = z.infer<typeof SectionSchema>;
export type ImpactReportSdgAlignment = z.infer<typeof SdgAlignmentSchema>;
export type ImpactReportOutput = z.infer<typeof ImpactReportOutputSchema>;

const SYSTEM_PROMPT =
  'Sen "hangel Sürdürülebilirlik & Etki Raporu Asistanı"sın — kurumsal sürdürülebilirlik (GRI standartları) tonunda, STK/dernek/vakıf/kulüpler için standart bir etki bilgi sayfası hazırlayan bir uzmansın.\n\n' +
  'GÖREV: Sana verilen kuruluş verisinden (bağış, gönüllülük, etkinlik/proje, şeffaflık skoru, desteklenen SKA\'lar) ölçülü, somut ve metriğe dayalı bir SÜRDÜRÜLEBİLİRLİK / ETKİ RAPORU üret. Rapor; bir yönetici özeti, öne çıkan etki metrikleri, SKA uyumu ve 3-5 anlatı bölümünden oluşur.\n\n' +
  'TON & KURALLAR:\n' +
  '- Resmî, ölçülü, kurumsal sürdürülebilirlik raporu dili. Reklam/övgü dolu abartı YOK; pazarlama sloganı YOK.\n' +
  '- SADECE verilen sayıları kullan. Yeni sayı, oran veya başarı UYDURMA. Veri 0/eksikse o metriği atla ya da "henüz veri yok" tonunda nötr yaz.\n' +
  '- Para birimi ₺, sayılar Türkçe biçim (binlik nokta) ile yazılır.\n' +
  '- Tüm metin Türkçe. "yarat/yaratma" kelimesini ASLA kullanma; yerine "oluştur/üret/sağla" kullan.\n' +
  '- Bölüm gövdelerinde markdown/HTML kullanma; düz paragraf yaz.\n' +
  '- SKA uyumunda sadece verilen SKA listesindeki amaçları kullan; liste boşsa sdgAlignment boş dizi olsun.\n' +
  '- Şeffaflık skorunu yönetişim bölümünde dürüstçe yorumla (yüksekse güçlü yön, düşükse gelişim alanı).';

/**
 * `idToken`: çağıranın (STK admin) Firebase ID token'ı. Sunucu doğrular ve
 * yalnızca elde edilen uid günlük AI kotasına beslenir (bkz. impact-story-flow).
 * Kota dolarsa `AIQuotaExceededError` ('QUOTA_EXCEEDED:impact-report') fırlatır.
 */
export async function generateImpactReport(input: ImpactReportInput, idToken?: string): Promise<ImpactReportOutput> {
  const safe: ImpactReportInput = {
    ngoName: sanitizeUserInput(input.ngoName, 160),
    category: sanitizeUserInput(input.category, 120),
    type: sanitizeUserInput(input.type, 60),
    about: sanitizeUserInput(input.about, 4000),
    period: sanitizeUserInput(input.period, 60),
    donors: Number.isFinite(input.donors) ? input.donors : 0,
    totalDonation: Number.isFinite(input.totalDonation) ? input.totalDonation : 0,
    volunteers: Number.isFinite(input.volunteers) ? input.volunteers : 0,
    volunteerHours: Number.isFinite(input.volunteerHours) ? input.volunteerHours : 0,
    volunteerValueTRY: Number.isFinite(input.volunteerValueTRY) ? input.volunteerValueTRY : 0,
    projects: Number.isFinite(input.projects) ? input.projects : 0,
    peopleReached: Number.isFinite(input.peopleReached) ? input.peopleReached : 0,
    transparencyScore: Number.isFinite(input.transparencyScore) ? input.transparencyScore : 0,
    sdgs: sanitizeUserInput(input.sdgs, 600),
    beneficiaryGroups: sanitizeUserInput(input.beneficiaryGroups, 600),
  };

  const userId = await verifyAIFlowUserId(idToken);
  if (userId) {
    const { allowed } = await checkAndConsumeAIQuota(userId, 'impact-report');
    if (!allowed) throw new AIQuotaExceededError('impact-report');
  }

  const tr = (n: number) => n.toLocaleString('tr-TR');
  const prompt =
    `${SYSTEM_PROMPT}\n\n` +
    `=== KURULUŞ ===\n` +
    `Ad: ${safe.ngoName}\n` +
    `Tür: ${safe.type}\n` +
    `Faaliyet Alanı: ${safe.category}\n` +
    `Rapor Dönemi: ${safe.period}\n` +
    `Hakkında: ${safe.about || '(belirtilmemiş)'}\n\n` +
    `=== ETKİ VERİSİ (sadece bu sayıları kullan) ===\n` +
    `Bağışçı sayısı: ${tr(safe.donors)}\n` +
    `Toplam bağış: ${tr(safe.totalDonation)} ₺\n` +
    `Gönüllü sayısı: ${tr(safe.volunteers)}\n` +
    `Gönüllülük saati: ${tr(safe.volunteerHours)} saat\n` +
    `Gönüllülüğün ekonomik değeri: ${tr(safe.volunteerValueTRY)} ₺\n` +
    `Tamamlanan proje: ${tr(safe.projects)}\n` +
    `Ulaşılan kişi: ${tr(safe.peopleReached)}\n` +
    `Şeffaflık endeksi: %${tr(safe.transparencyScore)}\n` +
    `Desteklenen SKA'lar: ${safe.sdgs || '(belirtilmemiş)'}\n` +
    `Faydalanıcı gruplar: ${safe.beneficiaryGroups || '(belirtilmemiş)'}\n\n` +
    `--- Yukarıdaki veriyi temel alarak JSON şemasına uygun, kurumsal sürdürülebilirlik raporu tonunda Türkçe etki raporunu üret.`;

  const { output } = await ai.generate({
    model: 'googleai/gemini-2.5-flash',
    prompt,
    // thinkingBudget:0 → 2.5-flash düşünme tokenları structured JSON'u truncate etmesin.
    config: { temperature: 0.5, maxOutputTokens: MAX_OUTPUT_TOKENS, thinkingConfig: { thinkingBudget: 0 } },
    output: { schema: ImpactReportOutputSchema },
  });

  const result = (output ?? { summary: '', metrics: [], sdgAlignment: [], sections: [] }) as ImpactReportOutput;
  return {
    summary: result.summary || '',
    metrics: Array.isArray(result.metrics) ? result.metrics.slice(0, 6) : [],
    sdgAlignment: Array.isArray(result.sdgAlignment) ? result.sdgAlignment.slice(0, 5) : [],
    sections: Array.isArray(result.sections) ? result.sections.slice(0, 5) : [],
  };
}
