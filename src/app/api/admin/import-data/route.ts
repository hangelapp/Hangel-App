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

    // SECURITY FIX: dataType artık hedef collection'ı seçmek için kullanılıyor
    // (önceden parametre alınıp her şey NGO collection'ına yazılıyordu).
    // Ayrıca attacker payload field whitelist'i ile sınırlandı.
    const TARGETS: Record<string, { collection: string; allowedFields: Set<string> }> = {
        ngo: { collection: COLLECTIONS.ngos, allowedFields: new Set([
            'name', 'shortName', 'slug', 'description', 'mission', 'logoUrl', 'avatarUrl',
            'website', 'contact', 'category', 'tags', 'city', 'country', 'foundedYear',
            'registrationNumber', 'transparencyScore', 'status', 'files', 'address',
        ]) },
        brand: { collection: COLLECTIONS.brands, allowedFields: new Set([
            'name', 'shortName', 'slug', 'description', 'logoUrl', 'avatarUrl', 'website',
            'category', 'tags', 'files',
        ]) },
        club: { collection: COLLECTIONS.clubs, allowedFields: new Set([
            'name', 'shortName', 'slug', 'description', 'university', 'logoUrl', 'avatarUrl',
            'website', 'category', 'tags', 'memberCount', 'files',
        ]) },
    };
    const target = TARGETS[dataType.toLowerCase()];
    if (!target) {
        return NextResponse.json({ errorCode: 'INVALID_DATATYPE', message: `dataType must be one of: ${Object.keys(TARGETS).join(', ')}` }, { status: 400 });
    }
    const db = getAdminFirestore();
    const collectionRef = db.collection(target.collection);

    let importedCount = 0;
    for (const record of records) {
      try {
        // Whitelist: sadece izin verilen field'lar yazılır.
        const rec = record as Record<string, unknown>;
        const filtered: Record<string, unknown> = {};
        for (const key of Object.keys(rec)) {
            if (target.allowedFields.has(key)) {
                filtered[key] = rec[key];
            }
        }
        await collectionRef.add({
          ...filtered,
          dataType,
          source: 'admin-import',
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
        importedCount += 1;
      } catch (err) {
        console.error('[import-data] Failed to import record:', err);
        // Continue with next record
      }
    }

    // Audit log
    try {
        await db.collection('adminAuditLogs').add({
            action: 'import-data',
            dataType,
            target: target.collection,
            importedCount,
            totalRecords: records.length,
            ip,
            createdAt: FieldValue.serverTimestamp(),
        });
    } catch (e) {
        console.warn('[import-data] audit log failed:', e);
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
