
import { NextResponse } from 'next/server';
import { fetchAllAgencyOffers } from '@/lib/api-clients';

export async function GET() {
    try {
        const offers = await fetchAllAgencyOffers();
        return NextResponse.json(offers);
    } catch (error) {
        console.error("API Route /api/offers error:", error);
        return NextResponse.json({ error: "Veriler çekilemedi" }, { status: 500 });
    }
}
