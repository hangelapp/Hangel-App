/**
 * face-match — @vladmandic/face-api etrafında ince, dayanıklı bir sarmalayıcı.
 *
 * "Selfie ile Bul" özelliği: yüklenen etkinlik fotoğraflarındaki yüzlerin 128-boyutlu
 * yüz vektörleri (descriptor) hesaplanır ve foto belgesine yazılır; kullanıcı bir selfie
 * çektiğinde selfie'nin vektörü çıkarılıp galerideki vektörlerle öklid mesafesi < 0.6
 * olanlar eşleştirilir.
 *
 * Tümü İSTEMCİDE (tarayıcıda) çalışır. Selfie sunucuya YÜKLENMEZ (KVKK). Modeller
 * /public/models altından yüklenir. Model/kütüphane yüklenemezse tüm fonksiyonlar
 * güvenle boş/başarısız döner → çağıran taraf çöküp kalmadan galeri+yükleme çalışır.
 *
 * face-api tembel (lazy) import edilir → ilk paket boyutu şişmez.
 */

// face-api tipi ağır; runtime'da dinamik import ediyoruz. `any` bilinçli.
/* eslint-disable @typescript-eslint/no-explicit-any */

const MODEL_URL = '/models';

// Aynı sekmede yüz vektörü < 0.6 öklid mesafesi = "aynı kişi" (face-api önerisi).
export const FACE_MATCH_THRESHOLD = 0.6;

let faceapiPromise: Promise<any> | null = null;
let modelsPromise: Promise<boolean> | null = null;

/** face-api'yi tembel yükle. Başarısızsa null (kütüphane kurulu değil / paket hatası). */
async function loadFaceApi(): Promise<any | null> {
  if (!faceapiPromise) {
    faceapiPromise = import('@vladmandic/face-api').catch((e) => {
      console.warn('[face-match] @vladmandic/face-api yüklenemedi', e);
      return null;
    });
  }
  return faceapiPromise;
}

/**
 * Modelleri (tiny_face_detector + face_landmark_68 + face_recognition) /public/models
 * altından bir kez yükle. Dosyalar yoksa (404) / hata olursa false döner → özellik
 * sessizce devre dışı kalır. Yalnızca tarayıcıda çalışır.
 */
export async function ensureFaceModels(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (!modelsPromise) {
    modelsPromise = (async () => {
      const faceapi = await loadFaceApi();
      if (!faceapi) return false;
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);
        return true;
      } catch (e) {
        // TODO(models): model ağırlıkları /public/models altında yoksa buraya düşer.
        // tiny_face_detector_model-*, face_landmark_68_model-*, face_recognition_model-*
        // dosyalarını ekleyin. Eksikse "Selfie ile Bul" otomatik gizlenir.
        console.warn('[face-match] modeller yüklenemedi (/models eksik olabilir)', e);
        return false;
      }
    })();
  }
  return modelsPromise;
}

/** face-api hazır mı? (kütüphane + modeller). Buton görünürlüğü için. */
export async function isFaceMatchAvailable(): Promise<boolean> {
  return ensureFaceModels();
}

/** tinyFaceDetector için ayar nesnesi (paylaşılan). */
function detectorOptions(faceapi: any) {
  return new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.5 });
}

/**
 * Bir görsel öğesindeki (img/video/canvas) TÜM yüzlerin 128-boyutlu vektörlerini döndür.
 * Yüz yoksa / hata olursa boş dizi. Bu, YÜKLEME sırasında foto başına çağrılır.
 */
export async function computeFaceDescriptors(
  input: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement,
): Promise<number[][]> {
  try {
    const ok = await ensureFaceModels();
    if (!ok) return [];
    const faceapi = await loadFaceApi();
    if (!faceapi) return [];
    const results = await faceapi
      .detectAllFaces(input, detectorOptions(faceapi))
      .withFaceLandmarks()
      .withFaceDescriptors();
    return (results || []).map((r: any) => Array.from(r.descriptor as Float32Array));
  } catch (e) {
    console.warn('[face-match] descriptor hesaplanamadı', e);
    return [];
  }
}

/**
 * Bir selfie'deki TEK (en belirgin) yüzün vektörünü döndür. Yüz bulunamazsa null.
 * "Selfie ile Bul" için kullanıcı kaynağı buradan geçer.
 */
export async function computeSingleFaceDescriptor(
  input: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement,
): Promise<number[] | null> {
  try {
    const ok = await ensureFaceModels();
    if (!ok) return null;
    const faceapi = await loadFaceApi();
    if (!faceapi) return null;
    const result = await faceapi
      .detectSingleFace(input, detectorOptions(faceapi))
      .withFaceLandmarks()
      .withFaceDescriptor();
    if (!result?.descriptor) return null;
    return Array.from(result.descriptor as Float32Array);
  } catch (e) {
    console.warn('[face-match] selfie descriptor hesaplanamadı', e);
    return null;
  }
}

/**
 * Bir görsel URL'inden (ör. profil fotoğrafı) TEK yüzün vektörünü çıkar.
 * crossOrigin='anonymous' ile yüklenir → face-api pikselleri okuyabilsin (CORS taint yok).
 * Herhangi bir hatada (CORS, yüz yok, model yok, decode başarısız) null döner → asla bloklamaz.
 */
export async function descriptorFromUrl(url: string | null | undefined): Promise<number[] | null> {
  if (!url || typeof window === 'undefined') return null;
  try {
    const ok = await ensureFaceModels();
    if (!ok) return null;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = url;
    await img.decode();
    return await computeSingleFaceDescriptor(img);
  } catch (e) {
    console.warn('[face-match] URL descriptor hesaplanamadı', e);
    return null;
  }
}

/** İki eşit boyutlu vektör arasındaki öklid mesafesi. */
export function euclideanDistance(a: number[], b: number[]): number {
  if (!a || !b || a.length !== b.length) return Number.POSITIVE_INFINITY;
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const d = a[i] - b[i];
    sum += d * d;
  }
  return Math.sqrt(sum);
}

/**
 * Depolanmış vektörlerden herhangi biri selfie vektörüne eşik altında yakın mı?
 * (yani bu foto o kişiyi içeriyor mu).
 */
export function descriptorsMatch(
  target: number[],
  stored: number[][] | undefined | null,
  threshold: number = FACE_MATCH_THRESHOLD,
): boolean {
  if (!stored || stored.length === 0) return false;
  return stored.some((d) => euclideanDistance(target, d) < threshold);
}
