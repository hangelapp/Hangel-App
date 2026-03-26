
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
        return NextResponse.json(offers);
    } catch (error) {
        console.error("API Route /api/offers error:", error);
        return NextResponse.json({ error: "Veriler çekilemedi" }, { status: 500 });
    }
}
