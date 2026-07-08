
import { NextResponse } from 'next/server';
import { fetchAllAgencyOffers } from '@/lib/api-clients';
import { unstable_cache } from 'next/cache';

const getCachedOffers = unstable_cache(
  () => fetchAllAgencyOffers(),
  ['agency-offers'],
  { revalidate: 3600 } // cache for 1 hour
);

export async function GET() {
    try {
        const offers = await getCachedOffers();
        // CDN kenar cache (Cloudflare/App Hosting): veri saatlik revalidate olduğu
        // için yanıtı 1 saat edge'de tut → market'in her açılışında 97KB'lık origin
        // isteği yerine kenardan anında servis (perf: market yavaşlığı). SWR ile
        // süre dolduğunda bayat yanıt verilirken arka planda tazelenir.
        return NextResponse.json(offers, {
            headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' },
        });
    } catch (error) {
        console.error("API Route /api/offers error:", error);
        return NextResponse.json({ error: "Veriler çekilemedi" }, { status: 500 });
    }
}
