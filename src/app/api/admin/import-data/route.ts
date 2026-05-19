import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { COLLECTIONS } from '@/firebase/collections';
import { checkRateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';

// P1-1b: Distributed (Firestore-backed) per-IP rate limiter — survives cold
// starts and works across `maxInstances`. See `src/lib/rate-limit.ts`.
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60_000;

function getClientIp(req: NextRequest): string {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0]!.trim();
  const real = req.headers.get('x-real-ip');
  if (real) return real.trim();
  return 'unknown';
}

// Check admin authorization
function checkAuth(req: NextRequest): boolean {
  const authHeader = req.headers.get('x-admin-key');
  const adminKey = process.env.ADMIN_IMPORT_KEY;

  if (!adminKey || authHeader !== adminKey) {
    return false;
  }
  return true;
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const { allowed } = await checkRateLimit({
      bucket: 'admin-import-data',
      key: ip,
      limit: RATE_LIMIT_MAX,
      windowMs: RATE_LIMIT_WINDOW_MS,
    });
    if (!allowed) {
      return NextResponse.json(
        { errorCode: 'rate_limited', message: 'Çok fazla istek. Lütfen sonra tekrar deneyin.' },
        { status: 429 }
      );
    }

    if (!checkAuth(req)) {
      return NextResponse.json(
        { errorCode: 'unauthorized', message: 'Yetkisiz erişim.' },
        { status: 401 }
      );
    }

    let body: { dataType?: string; records?: unknown };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { errorCode: 'invalid_json', message: 'Geçersiz JSON gövdesi.' },
        { status: 400 }
      );
    }

    const { dataType, records } = body;
    if (!dataType || typeof dataType !== 'string' || !Array.isArray(records)) {
      return NextResponse.json(
        { errorCode: 'invalid_payload', message: 'dataType veya records eksik/yanlış.' },
        { status: 400 }
      );
    }

    const db = getAdminFirestore();
    const collectionRef = db.collection(COLLECTIONS.ngos);

    let importedCount = 0;
    for (const record of records) {
      try {
        await collectionRef.add({
          ...(record as Record<string, unknown>),
          dataType,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
        importedCount += 1;
      } catch (err) {
        console.error('[import-data] Failed to import record:', err, record);
        // Continue with next record
      }
    }

    return NextResponse.json({
      success: true,
      dataType,
      importedCount,
      totalRecords: records.length,
    });
  } catch (error) {
    console.error('[import-data] Internal error:', error);
    return NextResponse.json(
      { errorCode: 'internal_error', message: 'Sunucu hatası.' },
      { status: 500 }
    );
  }
}
