/**
 * Ürün feed ingest — super-admin.
 *
 * GET  /api/feed/ingest                → mevcut feed'lerin listesi (GelirOrtakları Go Feed)
 * POST /api/feed/ingest { feedId, offerId, name, brandId?, limit?, donationRate? }
 *      → feed'in ilk N ürününü canonical şemaya çevirip `products` koleksiyonuna yazar.
 *
 * Not (POC): /product feed'i büyük (44MB'a kadar) ve tek dosya; bu route ilk N
 * ürünü (default 300) ingest eder. Tam/sürekli senkron için scheduled Cloud
 * Function + arama index (Algolia/Typesense) gelecek fazda.
 *
 * Hata formatı: { errorCode, message }.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';
import { listGelirOrtaklariFeeds, fetchGelirOrtaklariProducts } from '@/lib/feed/gelirortaklari';

export const runtime = 'nodejs';
export const maxDuration = 120;

const PRODUCTS = 'products';

async function verifySuperAdmin(req: NextRequest): Promise<boolean> {
  const authHeader = req.headers.get('authorization') || '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!idToken) return false;
  try {
    const decoded = await getAdminAuth().verifyIdToken(idToken) as { uid: string; role?: string; superAdminPermissions?: unknown };
    if (decoded.role === 'super-admin' || !!decoded.superAdminPermissions) return true;
    const snap = await getAdminFirestore().collection(COLLECTIONS.users).doc(decoded.uid).get();
    const d = snap.data();
    return d?.role === 'super-admin' || (Array.isArray(d?.superAdminPermissions) && d.superAdminPermissions.length > 0);
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  if (!(await verifySuperAdmin(req))) {
    return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'Super-admin yetkisi gerekli.' }, { status: 403 });
  }
  try {
    const feeds = await listGelirOrtaklariFeeds();
    return NextResponse.json({ feeds });
  } catch (err) {
    console.error('feed list error', err);
    return NextResponse.json({ errorCode: 'INTERNAL_ERROR', message: 'Feed listesi alınamadı.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!(await verifySuperAdmin(req))) {
    return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'Super-admin yetkisi gerekli.' }, { status: 403 });
  }
  const body = await req.json().catch(() => null) as
    | { feedId?: string; offerId?: string; name?: string; type?: string; brandId?: string; limit?: number; donationRate?: number }
    | null;
  const feedId = typeof body?.feedId === 'string' ? body.feedId : '';
  const offerId = typeof body?.offerId === 'string' ? body.offerId : '';
  if (!feedId || !offerId) {
    return NextResponse.json({ errorCode: 'INVALID_BODY', message: 'feedId ve offerId zorunlu.' }, { status: 400 });
  }

  try {
    const products = await fetchGelirOrtaklariProducts(
      { source: 'gelirortaklari', feedId, offerId, name: body?.name || 'Marka', type: body?.type || 'google' },
      { limit: body?.limit ?? 300, brandId: body?.brandId ?? null, donationRate: body?.donationRate },
    );
    if (products.length === 0) {
      return NextResponse.json({ ok: true, ingested: 0, message: 'Feed boş veya ürün parse edilemedi.' });
    }

    const fs = getAdminFirestore();
    // Firestore batch max 500 — parçalara böl.
    let written = 0;
    for (let i = 0; i < products.length; i += 450) {
      const slice = products.slice(i, i + 450);
      const batch = fs.batch();
      for (const p of slice) {
        batch.set(fs.collection(PRODUCTS).doc(p.id), p, { merge: true });
      }
      await batch.commit();
      written += slice.length;
    }
    return NextResponse.json({ ok: true, ingested: written, brand: body?.name });
  } catch (err) {
    console.error('feed ingest error', err);
    const message = err instanceof Error ? err.message : 'Ingest başarısız.';
    return NextResponse.json({ errorCode: 'INTERNAL_ERROR', message }, { status: 500 });
  }
}
