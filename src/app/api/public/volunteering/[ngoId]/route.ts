/**
 * GET /api/public/volunteering/[ngoId]
 *
 * STK'nın yayındaki gönüllülük ilanlarını JSON olarak dışa açar (CORS *).
 * STK kendi web sitesinde/uygulamasında bu uçtan listeyi çekip gösterebilir.
 * Auth gerektirmez — ilanlar zaten public.
 */
import { NextResponse } from 'next/server';
import { fetchActiveVolunteering } from '@/lib/public-volunteering';

export const runtime = 'nodejs';
// 5 dk CDN cache — dış sitelerden sık çağrı için.
export const revalidate = 300;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function GET(_req: Request, { params }: { params: Promise<{ ngoId: string }> }) {
  const { ngoId } = await params;
  if (!ngoId) {
    return NextResponse.json({ error: 'ngoId gerekli' }, { status: 400, headers: CORS });
  }
  try {
    const result = await fetchActiveVolunteering(ngoId);
    return NextResponse.json(result, {
      headers: { ...CORS, 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Beklenmeyen hata';
    return NextResponse.json({ error: message }, { status: 500, headers: CORS });
  }
}
