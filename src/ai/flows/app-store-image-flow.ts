'use server';

/**
 * src/ai/flows/app-store-image-flow.ts
 *
 * App Store ekran görüntüsü üretimi — Google Gemini 2.5 Flash Image
 * (nano-banana) modeli. Google AI Generative Language API'de Imagen 3
 * mevcut DEĞİL (sadece Vertex AI'da var); bu yüzden generateContent
 * endpoint'i + responseModalities: ['IMAGE'] kullanılır.
 *
 * Input: BRAND_BRIEF + platform vibe + feature template + kullanıcı prompt
 * birleştirilir, sonra Gemini'ye text-to-image olarak gönderilir.
 *
 * Aspect ratio prompt'a explicit eklenir ("Generate a 9:16 portrait...").
 */

import { checkAndConsumeAIQuota, sanitizeUserInput } from '@/ai/guards';
import { AIQuotaExceededError } from '@/ai/flow-auth';
import { BRAND_BRIEF, FEATURES, PLATFORMS, type FeatureKey, type PlatformKey } from '@/lib/app-store-specs';

// `gemini-2.5-flash-image-preview` preview modeli GA'ya geçince retire edildi →
// v1beta'da 404 NOT_FOUND. GA model adı: `gemini-2.5-flash-image`. Daha yeni
// model (ör. `gemini-3.1-flash` / Nano Banana 2) için GEMINI_IMAGE_MODEL env ile override.
const MODEL = process.env.GEMINI_IMAGE_MODEL || 'gemini-2.5-flash-image';
const API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

// Model churn'a dayanıklılık: sırayla dene, 404 (model yok) ise sonraki adaya geç.
// İlk sıra env override / GA model; sonrası bilinen yedekler.
const CANDIDATE_MODELS: string[] = [...new Set([
  MODEL,
  'gemini-2.5-flash-image',
  'gemini-3.1-flash',
  'gemini-2.0-flash-preview-image-generation',
])];

// Tüm modeller başarısızsa tanı için: API'de generateContent destekleyen görsel
// modelleri listele (hata mesajına eklenir → kullanıcı doğru modeli görür).
async function listImageCapableModels(apiKey: string): Promise<string> {
  try {
    const r = await fetch(`${API_BASE}/models?key=${apiKey}&pageSize=200`, { cache: 'no-store' });
    if (!r.ok) return '(model listesi alınamadı)';
    const j = (await r.json()) as { models?: Array<{ name?: string; supportedGenerationMethods?: string[] }> };
    const names = (j.models || [])
      .filter((m) => (m.supportedGenerationMethods || []).includes('generateContent') && /image/i.test(m.name || ''))
      .map((m) => (m.name || '').replace('models/', ''));
    return names.length ? names.join(', ') : '(görsel destekleyen model bulunamadı)';
  } catch {
    return '(model listesi alınamadı)';
  }
}

export type AspectRatio = '1:1' | '3:4' | '4:3' | '9:16' | '16:9';

/** Platform spec'ten cihaz boyutuna en yakın aspect ratio'yu seç (sync helper). */
function pickAspectRatio(w: number, h: number): AspectRatio {
  const r = w / h;
  if (Math.abs(r - 1) < 0.05) return '1:1';
  if (Math.abs(r - 9 / 16) < 0.1) return '9:16';
  if (Math.abs(r - 16 / 9) < 0.1) return '16:9';
  if (Math.abs(r - 3 / 4) < 0.1) return '3:4';
  if (Math.abs(r - 4 / 3) < 0.1) return '4:3';
  if (r < 0.7) return '9:16';
  if (r > 1.5) return '16:9';
  return r < 1 ? '3:4' : '4:3';
}

export interface GenerateAppStoreImageInput {
  userId: string;
  platform: PlatformKey;
  feature: FeatureKey;
  customPrompt?: string;
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
  await checkAndConsumeAIQuota(input.userId, 'app-store-image', 20);

  const platform = PLATFORMS.find((p) => p.key === input.platform);
  const feature = FEATURES.find((f) => f.key === input.feature);
  if (!platform) throw new Error(`Bilinmeyen platform: ${input.platform}`);
  if (!feature) throw new Error(`Bilinmeyen feature: ${input.feature}`);

  const userPrompt = sanitizeUserInput(input.customPrompt || feature.defaultPrompt);
  const aspectRatio = pickAspectRatio(input.deviceW, input.deviceH);
  const orientation = aspectRatio === '9:16' || aspectRatio === '3:4' ? 'portrait'
    : aspectRatio === '16:9' || aspectRatio === '4:3' ? 'landscape' : 'square';

  const fullPrompt = [
    `Generate a ${aspectRatio} ${orientation} app store screenshot image.`,
    '',
    `[BRAND BRIEF]\n${BRAND_BRIEF}`,
    '',
    `[PLATFORM TONE — ${platform.label}]\n${platform.vibe}`,
    '',
    `[FEATURE — ${feature.label}]`,
    userPrompt,
    '',
    '[REQUIREMENTS]',
    `- Exactly ${aspectRatio} aspect ratio (${input.deviceW}x${input.deviceH} target resolution)`,
    '- Photorealistic device mockup (real iPhone/iPad/Watch frame)',
    '- High detail, premium quality, vibrant colors',
    '- Marka kurallarına uyumlu: yanlış logo yok, telif sorunu çıkmasın',
    '- Tek görsel, başka frame eklemeden',
  ].join('\n');

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY yok — env\'e ekle.');

  const body = JSON.stringify({
    contents: [{ parts: [{ text: fullPrompt }] }],
    generationConfig: { responseModalities: ['IMAGE'] },
  });

  // Aday modelleri sırayla dene; 404/başarısız ise sonrakine geç (model churn dayanıklılığı).
  let lastError = '';
  for (const model of CANDIDATE_MODELS) {
    const res = await fetch(`${API_BASE}/models/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    });

    if (res.status === 429) throw new AIQuotaExceededError('Gemini rate limit aşıldı — birkaç saniye bekle.');
    if (res.status === 404) { lastError = `${model}: model bulunamadı (404)`; continue; }
    if (!res.ok) {
      lastError = `${model}: ${(await res.text().catch(() => 'unknown')).slice(0, 300)}`;
      continue;
    }

    const data = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ inlineData?: { mimeType?: string; data?: string }; text?: string }> } }>;
    };
    // İlk image part'ı bul (Gemini bazen text + image karışık part döndürür)
    const parts = data.candidates?.[0]?.content?.parts || [];
    const imagePart = parts.find((p) => p.inlineData?.data);
    if (!imagePart?.inlineData?.data) {
      const textPart = parts.find((p) => p.text);
      lastError = `${model}: görsel dönmedi (${textPart?.text?.slice(0, 150) || 'image yok'})`;
      continue;
    }

    return {
      base64Image: imagePart.inlineData.data,
      mimeType: imagePart.inlineData.mimeType || 'image/png',
      aspectRatio,
      fullPrompt,
    };
  }

  // Tüm adaylar başarısız → tanı için mevcut görsel modelleri ekle.
  const available = await listImageCapableModels(apiKey);
  throw new Error(
    `Görsel üretilemedi. Denenen modeller: ${CANDIDATE_MODELS.join(', ')}. Son hata: ${lastError}. ` +
    `API'de generateContent destekleyen görsel modeller: ${available}. ` +
    `Doğru modeli GEMINI_IMAGE_MODEL env değişkeniyle ayarlayabilirsin.`,
  );
}
