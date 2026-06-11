/**
 * Ürün export motoru — super-admin.
 *
 * GET /api/feed/export/{format}?brandId=...&limit=1000
 *   format: 'google' | 'cimri' | 'akakce'
 *   → `products` koleksiyonundaki (verilen markaya ait) ürünleri ilgili
 *     platform XML formatında döndürür.
 *
 * YASAL NOT: Export yalnızca "direkt onaylı" markalar için yasaldır;
 * affiliate-ağ (örn. GelirOrtakları) markaları üçüncü platformlara
 * re-syndicate EDİLEMEZ. Bu nedenle şimdilik `brandId` ZORUNLU tutuluyor —
 * tüm-ürün export'una izin verilmiyor (yanlışlıkla ağ markalarını yaymamak için).
 * TODO: brands koleksiyonuna `exportable: boolean` flag eklenince burada
 *   marka dokümanını okuyup `exportable === true` değilse 403 dönecek;
 *   o zaman brandId opsiyonel + exportable filtreli tüm-ürün desteklenebilir.
 *
 * Hata formatı: { errorCode, message }.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';
import type { CanonicalProduct } from '@/lib/feed/types';
import { toGoogleMerchantXml } from '@/lib/feed/export/google-merchant';
import { toCimriXml } from '@/lib/feed/export/cimri';
import { toAkakceXml } from '@/lib/feed/export/akakce';

export const runtime = 'nodejs';
export const maxDuration = 120;

const DEFAULT_LIMIT = 1000;
const MAX_LIMIT = 5000;

const VALID_FORMATS = ['google', 'cimri', 'akakce'] as const;
type ExportFormat = (typeof VALID_FORMATS)[number];

function isExportFormat(value: string): value is ExportFormat {
  return (VALID_FORMATS as readonly string[]).includes(value);
}

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

export async function GET(req: NextRequest, { params }: { params: Promise<{ format: string }> }) {
  if (!(await verifySuperAdmin(req))) {
    return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'Super-admin yetkisi gerekli.' }, { status: 403 });
  }

  const { format } = await params;
  if (!isExportFormat(format)) {
    return NextResponse.json(
      { errorCode: 'INVALID_FORMAT', message: "Geçersiz format. Desteklenenler: 'google', 'cimri', 'akakce'." },
      { status: 400 },
    );
  }

  const { searchParams } = new URL(req.url);
  const brandId = (searchParams.get('brandId') || '').trim();
  // YASAL: ağ markalarını yanlışlıkla re-syndicate etmemek için brandId zorunlu.
  if (!brandId) {
    return NextResponse.json(
      { errorCode: 'BRAND_ID_REQUIRED', message: 'brandId zorunlu. Tüm-ürün export şimdilik desteklenmiyor.' },
      { status: 400 },
    );
  }

  const limitParam = Number(searchParams.get('limit'));
  const limit = Number.isFinite(limitParam) && limitParam > 0
    ? Math.min(Math.floor(limitParam), MAX_LIMIT)
    : DEFAULT_LIMIT;

  try {
    const snap = await getAdminFirestore()
      .collection(COLLECTIONS.products)
      .where('brandId', '==', brandId)
      .limit(limit)
      .get();

    const products = snap.docs.map((doc) => doc.data() as CanonicalProduct);

    let xml: string;
    switch (format) {
      case 'google':
        xml = toGoogleMerchantXml(products);
        break;
      case 'cimri':
        xml = toCimriXml(products);
        break;
      case 'akakce':
        xml = toAkakceXml(products);
        break;
    }

    return new NextResponse(xml, {
      headers: { 'Content-Type': 'application/xml; charset=utf-8' },
    });
  } catch (err) {
    console.error('feed export error', err);
    return NextResponse.json({ errorCode: 'INTERNAL_ERROR', message: 'Export başarısız.' }, { status: 500 });
  }
}
