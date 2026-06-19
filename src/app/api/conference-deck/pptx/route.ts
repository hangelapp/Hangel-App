/**
 * Konferans sunumunu PowerPoint (.pptx) olarak üretip indirir.
 * SUNUCU tarafı (pptxgenjs Node'da çalışır; istemci bundle'ında node:fs/https
 * derlenemiyordu). İstemci, ekranda yüklü slaytları POST eder; route bunlardan
 * .pptx üretir. Kamuya açık içerik (siteSettings/conferenceDeck) — auth gerekmez.
 */
import { buildDeckPptxBuffer } from '@/lib/conference-deck-pptx';
import { normalizeSlides, DEFAULT_SLIDES } from '@/lib/conference-deck';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    let slides = DEFAULT_SLIDES;
    try {
      const body = (await req.json()) as { slides?: unknown };
      slides = normalizeSlides(body?.slides);
    } catch {
      slides = DEFAULT_SLIDES;
    }
    // Aşırı büyük girişleri sınırla (kötüye kullanım önlemi).
    if (slides.length > 120) slides = slides.slice(0, 120);

    const buf = await buildDeckPptxBuffer(slides);
    return new Response(new Uint8Array(buf), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'Content-Disposition': 'attachment; filename="hangel-gelir-modeli-sunum.pptx"',
        'Cache-Control': 'no-store',
      },
    });
  } catch (e) {
    console.error('conference-deck pptx üretim hatası:', e);
    return new Response(JSON.stringify({ errorCode: 'PPTX_FAILED', message: 'Sunum oluşturulamadı.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
