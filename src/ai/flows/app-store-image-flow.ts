'use server';

/**
 * src/ai/flows/app-store-image-flow.ts
 *
 * App Store ekran görüntüsü üretimi — Google Imagen 3 REST API'ye direkt fetch.
 *
 * Genkit `imagenPredict` helper'ı yerine REST'i tercih ettik çünkü:
 *   1. Aspect ratio + sampleCount paramlarını net kontrol edebiliyoruz
 *   2. Hata mesajlarını raw görebiliyoruz (Genkit wrap'i bazen yutuyor)
 *   3. Quota guard mevcut yapımıza daha kolay otururuyor
 *
 * Input: BRAND_BRIEF + platform vibe + feature template + kullanıcı prompt'u
 * birleştirilir, sonra Imagen 3'e gönderilir.
 *
 * Aspect ratio Imagen 3 sabit: '1:1' | '3:4' | '4:3' | '9:16' | '16:9'.
 * Cihaz spec boyutları client tarafında render edilirken resize/letterbox edilir.
 */

import { checkAndConsumeAIQuota, sanitizeUserInput } from '@/ai/guards';
import { AIQuotaExceededError } from '@/ai/flow-auth';
import { BRAND_BRIEF, FEATURES, PLATFORMS, type FeatureKey, type PlatformKey } from '@/lib/app-store-specs';

const IMAGEN_MODEL = 'imagen-3.0-generate-002';
const IMAGEN_URL = `https://generativelanguage.googleapis.com/v1beta/models/${IMAGEN_MODEL}:predict`;

export type AspectRatio = '1:1' | '3:4' | '4:3' | '9:16' | '16:9';

/**
 * Platform spec'ten cihaz boyutuna en yakın aspect ratio'yu seç.
 */
export function pickAspectRatio(w: number, h: number): AspectRatio {
  const r = w / h;
  // İdeal eşleşmeler
  if (Math.abs(r - 1) < 0.05) return '1:1';
  if (Math.abs(r - 9 / 16) < 0.1) return '9:16';
  if (Math.abs(r - 16 / 9) < 0.1) return '16:9';
  if (Math.abs(r - 3 / 4) < 0.1) return '3:4';
  if (Math.abs(r - 4 / 3) < 0.1) return '4:3';
  // Yakın eşleşmeler — portrait fallback
  if (r < 0.7) return '9:16';
  if (r > 1.5) return '16:9';
  return r < 1 ? '3:4' : '4:3';
}

export interface GenerateAppStoreImageInput {
  /** Süper-admin uid'si (quota guard için). */
  userId: string;
  platform: PlatformKey;
  feature: FeatureKey;
  /** Kullanıcının özel prompt'u (boş ise feature default'u kullanılır). */
  customPrompt?: string;
  /** Cihaz boyutu — aspect ratio'yu belirler. */
  deviceW: number;
  deviceH: number;
}

export interface GenerateAppStoreImageOutput {
  base64Image: string;
  mimeType: string;
  aspectRatio: AspectRatio;
  fullPrompt: string;
}

export async function generateAppStoreImage(
  input: GenerateAppStoreImageInput,
): Promise<GenerateAppStoreImageOutput> {
  // Quota — günlük 20 görsel üretim hakkı
  await checkAndConsumeAIQuota(input.userId, 'app-store-image', 20);

  const platform = PLATFORMS.find((p) => p.key === input.platform);
  const feature = FEATURES.find((f) => f.key === input.feature);
  if (!platform) throw new Error(`Bilinmeyen platform: ${input.platform}`);
  if (!feature) throw new Error(`Bilinmeyen feature: ${input.feature}`);

  const userPrompt = sanitizeUserInput(input.customPrompt || feature.defaultPrompt);
  const fullPrompt = [
    `[BRAND BRIEF]\n${BRAND_BRIEF}`,
    '',
    `[PLATFORM TONE — ${platform.label}]\n${platform.vibe}`,
    '',
    `[FEATURE — ${feature.label}]`,
    userPrompt,
    '',
    '[OUTPUT]',
    'Tek görsel. Çok yüksek detay. Photorealistic device mockup (gerçek iPhone/iPad/Watch frame).',
    'Marka kuralları: yanlış logo yok, telif sorunu çıkarabilecek görsel yok.',
  ].join('\n');

  const aspectRatio = pickAspectRatio(input.deviceW, input.deviceH);

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY yok — env\'e ekle.');

  const res = await fetch(`${IMAGEN_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      instances: [{ prompt: fullPrompt }],
      parameters: {
        sampleCount: 1,
        aspectRatio,
        safetyFilterLevel: 'block_some',
        personGeneration: 'allow_adult',
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => 'unknown');
    if (res.status === 429) throw new AIQuotaExceededError('Imagen rate limit aşıldı — birkaç saniye bekle.');
    throw new Error(`Imagen 3 hata (${res.status}): ${errText.slice(0, 300)}`);
  }

  const data = await res.json() as {
    predictions?: Array<{ bytesBase64Encoded?: string; mimeType?: string }>;
  };
  const pred = data.predictions?.[0];
  if (!pred?.bytesBase64Encoded) {
    throw new Error('Imagen 3 prediction boş döndü');
  }

  return {
    base64Image: pred.bytesBase64Encoded,
    mimeType: pred.mimeType || 'image/png',
    aspectRatio,
    fullPrompt,
  };
}
