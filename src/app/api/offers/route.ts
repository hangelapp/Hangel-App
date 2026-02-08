
import { NextResponse } from 'next/server';
import { getApiOffers } from '@/app/actions/market';

export async function GET() {
    try {
        const offers = await getApiOffers();
        return NextResponse.json(offers);
    } catch (error) {
        return NextResponse.json({ error: "Veriler çekilemedi" }, { status: 500 });
    }
}
