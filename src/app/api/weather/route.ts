/**
 * Hava durumu — fiziksel/saha etkinlik & gönüllülük detaylarında günlük tahmin.
 *
 * Anahtarsız: Open-Meteo (forecast) + gerekirse Nominatim (city → lat/lon).
 * GET /api/weather?lat=&lon=&days=3   veya   ?city=&district=&days=3
 * Dönüş: { days: [{ date, tempMax, tempMin, code, label, emoji }] }
 *
 * Not: Google Maps/Weather API anahtarı projede yok; key eklenirse buraya Google
 * Weather sağlayıcısı takılabilir. Şimdilik Open-Meteo (ücretsiz, anahtarsız).
 */
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const revalidate = 3600; // 1 saat

// WMO weather code → Türkçe etiket + emoji.
function wmo(code: number): { label: string; emoji: string } {
  if (code === 0) return { label: 'Güneşli', emoji: '☀️' };
  if (code === 1) return { label: 'Az bulutlu', emoji: '🌤️' };
  if (code === 2) return { label: 'Parçalı bulutlu', emoji: '⛅' };
  if (code === 3) return { label: 'Bulutlu', emoji: '☁️' };
  if (code === 45 || code === 48) return { label: 'Sisli', emoji: '🌫️' };
  if (code >= 51 && code <= 57) return { label: 'Çiseleme', emoji: '🌦️' };
  if (code >= 61 && code <= 67) return { label: 'Yağmurlu', emoji: '🌧️' };
  if (code >= 71 && code <= 77) return { label: 'Karlı', emoji: '❄️' };
  if (code >= 80 && code <= 82) return { label: 'Sağanak', emoji: '🌧️' };
  if (code === 85 || code === 86) return { label: 'Kar sağanağı', emoji: '🌨️' };
  if (code >= 95) return { label: 'Gök gürültülü', emoji: '⛈️' };
  return { label: 'Bilinmiyor', emoji: '🌡️' };
}

async function geocode(city: string, district?: string): Promise<{ lat: number; lon: number } | null> {
  const q = [district, city, 'Türkiye'].filter(Boolean).join(', ');
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`;
  try {
    const r = await fetch(url, {
      headers: { 'User-Agent': 'hangel.org.tr (weather lookup)' },
      next: { revalidate: 86400 },
    });
    if (!r.ok) return null;
    const j = (await r.json()) as Array<{ lat: string; lon: string }>;
    if (!j?.length) return null;
    return { lat: parseFloat(j[0].lat), lon: parseFloat(j[0].lon) };
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const days = Math.min(7, Math.max(1, parseInt(sp.get('days') || '3', 10) || 3));
  let lat = parseFloat(sp.get('lat') || '');
  let lon = parseFloat(sp.get('lon') || '');

  if (Number.isNaN(lat) || Number.isNaN(lon)) {
    const city = (sp.get('city') || '').trim();
    if (!city) {
      return NextResponse.json({ errorCode: 'NO_LOCATION', message: 'lat/lon veya city zorunlu.' }, { status: 400 });
    }
    const geo = await geocode(city, sp.get('district') || undefined);
    if (!geo) {
      return NextResponse.json({ errorCode: 'GEOCODE_FAILED', message: 'Konum bulunamadı.' }, { status: 404 });
    }
    lat = geo.lat; lon = geo.lon;
  }

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}`
    + `&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=${days}`;
  try {
    const r = await fetch(url, { next: { revalidate: 3600 } });
    if (!r.ok) {
      return NextResponse.json({ errorCode: 'WEATHER_FAILED', message: 'Hava durumu alınamadı.' }, { status: 502 });
    }
    const j = (await r.json()) as {
      daily?: { time: string[]; weather_code: number[]; temperature_2m_max: number[]; temperature_2m_min: number[] };
    };
    const d = j.daily;
    if (!d?.time?.length) {
      return NextResponse.json({ errorCode: 'WEATHER_EMPTY', message: 'Veri yok.' }, { status: 404 });
    }
    const out = d.time.map((date, i) => {
      const code = d.weather_code[i] ?? 0;
      const w = wmo(code);
      return {
        date,
        tempMax: Math.round(d.temperature_2m_max[i] ?? 0),
        tempMin: Math.round(d.temperature_2m_min[i] ?? 0),
        code,
        label: w.label,
        emoji: w.emoji,
      };
    });
    return NextResponse.json({ days: out });
  } catch {
    return NextResponse.json({ errorCode: 'WEATHER_ERROR', message: 'Hava durumu servisine ulaşılamadı.' }, { status: 502 });
  }
}
