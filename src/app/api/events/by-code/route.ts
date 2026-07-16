/**
 * GET /api/events/by-code?code=350716
 *
 * Kolay kodla (plaka+ay+gün) etkinlik bulur. QR alternatifi: katılımcı /kod
 * sayfasına kodu girer → burada eşleşen etkinliğin slug'ı döner → yönlendirilir.
 *
 * events koleksiyonu küçük (~20) olduğundan tam tarama ucuz; her etkinliğin
 * kodu şehir + startDate'ten türetilir (dokümanda saklanmaz).
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';
import { eventJoinCode } from '@/lib/plate-codes';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const code = (new URL(req.url).searchParams.get('code') || '').trim();
  if (!/^\d{6}$/.test(code)) {
    return NextResponse.json({ ok: false, message: 'Kod 6 haneli olmalı.' }, { status: 400 });
  }

  const db = getAdminFirestore();
  const snap = await db.collection(COLLECTIONS.events).get();

  const matches: { slug: string; name: string; startDate: string }[] = [];
  for (const d of snap.docs) {
    const x = d.data() as {
      slug?: string; name?: string; startDate?: string;
      location?: { city?: string } | string;
    };
    const city = typeof x.location === 'object' && x.location ? x.location.city : undefined;
    if (eventJoinCode(city, x.startDate) === code) {
      matches.push({ slug: x.slug || d.id, name: x.name || '', startDate: x.startDate || '' });
    }
  }

  if (matches.length === 0) {
    return NextResponse.json({ ok: false, message: 'Bu koda ait etkinlik bulunamadı.' }, { status: 404 });
  }
  // Aynı gün + aynı ilde birden çok etkinlik olabilir → en yakın/ilk gelecek olanı seç.
  matches.sort((a, b) => a.startDate.localeCompare(b.startDate));
  const now = new Date().toISOString().slice(0, 10);
  const upcoming = matches.find((m) => m.startDate.slice(0, 10) >= now) || matches[matches.length - 1];

  return NextResponse.json({
    ok: true,
    slug: upcoming.slug,
    name: upcoming.name,
    multiple: matches.length > 1,
    matches: matches.length > 1 ? matches : undefined,
  });
}
