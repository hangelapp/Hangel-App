/**
 * Basit geocode — adres/şehir → {lat, lon}. Anahtarsız (Nominatim, server-side).
 * Kan talebi oluşturulurken hastane konumu koordinata çevrilip kaydedilir; böylece
 * bildirimde "xx km · ~xx dk mesafede" gösterilebilir.
 *
 * GET /api/geocode?q=Hastane Adı, İlçe, İl
 * Dönüş: { lat, lon } veya 404.
 */
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const revalidate = 86400; // 1 gün

export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get('q') || '').trim();
  if (!q) {
    return NextResponse.json({ errorCode: 'NO_QUERY', message: 'q zorunlu.' }, { status: 400 });
  }
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`;
  try {
    const r = await fetch(url, {
      headers: { 'User-Agent': 'hangel.org (geocode)' },
      next: { revalidate: 86400 },
    });
    if (!r.ok) {
      return NextResponse.json({ errorCode: 'GEOCODE_FAILED', message: 'Konum servisi hatası.' }, { status: 502 });
    }
    const j = (await r.json()) as Array<{ lat: string; lon: string }>;
    if (!j?.length) {
      return NextResponse.json({ errorCode: 'NOT_FOUND', message: 'Konum bulunamadı.' }, { status: 404 });
    }
    return NextResponse.json({ lat: parseFloat(j[0].lat), lon: parseFloat(j[0].lon) });
  } catch {
    return NextResponse.json({ errorCode: 'GEOCODE_ERROR', message: 'Konum servisine ulaşılamadı.' }, { status: 502 });
  }
}
