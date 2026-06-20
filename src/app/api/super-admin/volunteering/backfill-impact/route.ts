/**
 * POST /api/super-admin/volunteering/backfill-impact
 *
 * Eski + yeni TÜM gönüllülük ilanlarına iş kalemine göre otomatik Sosyal Etki
 * PUANI (estimatedPoints) + mali DEĞER (estimatedValueTRY) + iş kalemi (workItem)
 * yazar. İlan zaten bu üç alanı taşıyorsa atlanır — idempotent.
 *
 * İş kalemi çıkarma önceliği (computeListingImpact):
 *   profession/professions → ilk skill → socialArea (kategori).
 * Katalogda (volunteerScoring) eşleşme yoksa "Genel Gönüllülük" varsayılanı.
 *
 * Auth: super-admin (transparency/recalculate ile aynı desen — Bearer ID token).
 * Admin SDK ile batched yazar.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';
import {
  computeListingImpact,
  type VolunteeringListingLike,
} from '@/lib/volunteer/listing-impact';
import type { ProfessionScoringRow } from '@/lib/volunteer/impact-value';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const BATCH_LIMIT = 400; // Firestore batch tavanı 500; güvenli marj.

async function isSuperAdmin(req: NextRequest): Promise<boolean> {
  const authHeader = req.headers.get('authorization') || '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!idToken) return false;
  try {
    const decoded = (await getAdminAuth().verifyIdToken(idToken)) as {
      uid: string;
      role?: string;
      superAdminPermissions?: unknown;
    };
    if (decoded.role === 'super-admin' || !!decoded.superAdminPermissions) return true;
    const snap = await getAdminFirestore().collection(COLLECTIONS.users).doc(decoded.uid).get();
    const d = snap.data();
    return (
      d?.role === 'super-admin' ||
      (Array.isArray(d?.superAdminPermissions) && d.superAdminPermissions.length > 0)
    );
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  if (!(await isSuperAdmin(req))) {
    return NextResponse.json(
      { errorCode: 'FORBIDDEN', message: 'Super-admin yetkisi gerekli.' },
      { status: 403 },
    );
  }

  const db = getAdminFirestore();

  // 1) Katalog (volunteerScoring) — bir kez oku.
  let catalog: ProfessionScoringRow[];
  try {
    const catSnap = await db.collection(COLLECTIONS.volunteerScoring).get();
    catalog = catSnap.docs.map((d) => {
      const data = d.data() as Record<string, unknown>;
      return {
        id: d.id,
        taskType: String(data.taskType ?? ''),
        manHourCost: Number(data.manHourCost) || 0,
        pointsPerHour: Number(data.pointsPerHour) || 0,
        isActive: data.isActive !== false,
      };
    });
  } catch (err) {
    console.error('[backfill-impact] catalog read failed', err);
    return NextResponse.json(
      { errorCode: 'READ_FAILED', message: 'İş kalemi kataloğu okunamadı.' },
      { status: 500 },
    );
  }

  // 2) Tüm ilanları gez, eksik olanlara yaz (batched, idempotent).
  let scanned = 0;
  let updated = 0;
  let skipped = 0;

  try {
    const snap = await db.collection(COLLECTIONS.volunteering).get();

    let batch = db.batch();
    let pending = 0;

    for (const doc of snap.docs) {
      scanned++;
      const data = doc.data() as Record<string, unknown>;

      // Idempotent: üç alan da zaten varsa atla.
      const hasPoints = typeof data.estimatedPoints === 'number';
      const hasValue = typeof data.estimatedValueTRY === 'number';
      const hasWorkItem = typeof data.workItem === 'string' && (data.workItem as string).trim().length > 0;
      if (hasPoints && hasValue && hasWorkItem) {
        skipped++;
        continue;
      }

      const { workItem, estimatedPoints, estimatedValueTRY } = computeListingImpact(
        data as VolunteeringListingLike,
        catalog,
      );

      batch.set(
        doc.ref,
        {
          workItem,
          estimatedPoints,
          estimatedValueTRY,
          impactBackfilledAt: new Date().toISOString(),
        },
        { merge: true },
      );
      updated++;
      pending++;

      if (pending >= BATCH_LIMIT) {
        await batch.commit();
        batch = db.batch();
        pending = 0;
      }
    }

    if (pending > 0) await batch.commit();
  } catch (err) {
    console.error('[backfill-impact] backfill failed', err);
    return NextResponse.json(
      { errorCode: 'WRITE_FAILED', message: 'Backfill başarısız.' },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, catalogCount: catalog.length, scanned, updated, skipped });
}
