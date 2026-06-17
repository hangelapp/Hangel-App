/**
 * POST /api/super-admin/outreach/import
 *
 * CSV (parse edilmiş JSON) içe aktarma. Outreach hub UI tarafında Papa Parse
 * ile parse edilen array'i batch write yapar (Firestore 500'lük chunk).
 *
 * Body:
 *   {
 *     rows: Array<{
 *       name: string;
 *       type?: string;       // Vakıf, Dernek, SivilToplumMüdürlüğü, Kargo, MailHizmet, Diğer
 *       city?: string;
 *       district?: string;
 *       phone?: string;
 *       email?: string;
 *       website?: string;
 *       address?: string;
 *       tags?: string;       // virgülle ayrılmış
 *       notes?: string;
 *     }>
 *   }
 *
 * Response:
 *   { inserted: number, skipped: number, errors: string[] }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { COLLECTIONS } from '@/firebase/collections';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MAX_ROWS = 5000;
const BATCH_SIZE = 450;
const VALID_TYPES = ['Vakıf', 'Dernek', 'SivilToplumMüdürlüğü', 'Federasyon', 'SporKulübü', 'GençlikSporMüdürlüğü', 'MailHizmet', 'Diğer'];

async function isSuperAdmin(req: NextRequest): Promise<{ ok: boolean; uid?: string }> {
  const authHeader = req.headers.get('authorization') || '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!idToken) return { ok: false };
  try {
    const decoded = await getAdminAuth().verifyIdToken(idToken) as { uid: string; role?: string; superAdminPermissions?: unknown };
    if (decoded.role === 'super-admin' || !!decoded.superAdminPermissions) return { ok: true, uid: decoded.uid };
    const snap = await getAdminFirestore().collection(COLLECTIONS.users).doc(decoded.uid).get();
    const d = snap.data();
    const isSuper = d?.role === 'super-admin' || (Array.isArray(d?.superAdminPermissions) && d.superAdminPermissions.length > 0);
    return { ok: !!isSuper, uid: isSuper ? decoded.uid : undefined };
  } catch { return { ok: false }; }
}

interface IncomingRow {
  name?: string;
  type?: string;
  city?: string;
  district?: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  tags?: string;
  notes?: string;
}

function sanitize(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.trim();
}

export async function POST(req: NextRequest) {
  const auth = await isSuperAdmin(req);
  if (!auth.ok || !auth.uid) {
    return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'Super-admin yetkisi gerekli.' }, { status: 403 });
  }

  let body: { rows?: IncomingRow[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ errorCode: 'BAD_JSON', message: 'Geçersiz JSON' }, { status: 400 });
  }
  if (!Array.isArray(body.rows) || body.rows.length === 0) {
    return NextResponse.json({ errorCode: 'NO_ROWS', message: 'En az 1 satır gerekli' }, { status: 400 });
  }
  if (body.rows.length > MAX_ROWS) {
    return NextResponse.json({ errorCode: 'TOO_MANY', message: `Tek istekte max ${MAX_ROWS} satır` }, { status: 400 });
  }

  const db = getAdminFirestore();
  let inserted = 0;
  let skipped = 0;
  const errors: string[] = [];

  // Audit log
  const auditRef = db.collection('outreachImports').doc();
  await auditRef.set({
    adminUid: auth.uid,
    rowCount: body.rows.length,
    status: 'running',
    createdAt: FieldValue.serverTimestamp(),
  });

  // Chunked batch writes
  for (let i = 0; i < body.rows.length; i += BATCH_SIZE) {
    const chunk = body.rows.slice(i, i + BATCH_SIZE);
    const batch = db.batch();
    let batchCount = 0;
    for (const row of chunk) {
      const name = sanitize(row.name);
      if (!name) {
        skipped++;
        continue;
      }
      const type = sanitize(row.type);
      const normalizedType = VALID_TYPES.includes(type) ? type : 'Diğer';
      const tags = sanitize(row.tags).split(',').map((s) => s.trim()).filter(Boolean);

      const docRef = db.collection(COLLECTIONS.outreachContacts).doc();
      batch.set(docRef, {
        name,
        type: normalizedType,
        city: sanitize(row.city) || null,
        district: sanitize(row.district) || null,
        phone: sanitize(row.phone) || null,
        email: sanitize(row.email) || null,
        website: sanitize(row.website) || null,
        address: sanitize(row.address) || null,
        tags,
        notes: sanitize(row.notes) || null,
        status: 'active',
        source: 'csv',
        importedBy: auth.uid,
        importedAt: FieldValue.serverTimestamp(),
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      batchCount++;
    }
    if (batchCount > 0) {
      try {
        await batch.commit();
        inserted += batchCount;
      } catch (e) {
        errors.push(`Batch ${i}-${i + chunk.length}: ${e instanceof Error ? e.message.slice(0, 120) : 'commit error'}`);
        skipped += batchCount;
      }
    }
  }

  await auditRef.update({
    status: 'completed',
    inserted,
    skipped,
    errors: errors.slice(0, 20),
    completedAt: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({
    inserted,
    skipped,
    errors: errors.slice(0, 10),
    auditId: auditRef.id,
  });
}
