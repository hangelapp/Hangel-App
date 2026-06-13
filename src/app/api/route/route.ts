/**
 * Gerçek sürüş mesafesi + süresi — anahtarsız OSRM (Open Source Routing Machine).
 *
 * Google Distance Matrix anahtarı projede yok; OSRM public sunucusu gerçek yol
 * rotası üzerinden mesafe (km) + süre (dk) döner. Anahtar eklenince buraya Google
 * sağlayıcısı takılabilir. Başarısız olursa caller kuş-uçuşu tahminine düşer.
 *
 * GET /api/route?fromLat=&fromLon=&toLat=&toLon=
 * Dönüş: { km, minutes } (gerçek sürüş) veya hata.
 */
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const revalidate = 1800; // 30 dk

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const fromLat = parseFloat(sp.get('fromLat') || '');
  const fromLon = parseFloat(sp.get('fromLon') || '');
  const toLat = parseFloat(sp.get('toLat') || '');
  const toLon = parseFloat(sp.get('toLon') || '');
  if ([fromLat, fromLon, toLat, toLon].some((v) => !Number.isFinite(v))) {
    return NextResponse.json({ errorCode: 'BAD_COORDS', message: 'fromLat/fromLon/toLat/toLon zorunlu.' }, { status: 400 });
  }
  // OSRM: koordinat sırası lon,lat
  const url = `https://router.project-osrm.org/route/v1/driving/${fromLon},${fromLat};${toLon},${toLat}?overview=false`;
  try {
    const r = await fetch(url, { next: { revalidate: 1800 } });
    if (!r.ok) return NextResponse.json({ errorCode: 'ROUTE_FAILED', message: 'Rota alınamadı.' }, { status: 502 });
    const j = (await r.json()) as { code?: string; routes?: Array<{ distance: number; duration: number }> };
    const route = j.routes?.[0];
    if (j.code !== 'Ok' || !route) {
      return NextResponse.json({ errorCode: 'NO_ROUTE', message: 'Rota bulunamadı.' }, { status: 404 });
    }
    return NextResponse.json({
      km: Math.round((route.distance / 1000) * 10) / 10,
      minutes: Math.max(1, Math.round(route.duration / 60)),
    });
  } catch {
    return NextResponse.json({ errorCode: 'ROUTE_ERROR', message: 'Rota servisine ulaşılamadı.' }, { status: 502 });
  }
}
