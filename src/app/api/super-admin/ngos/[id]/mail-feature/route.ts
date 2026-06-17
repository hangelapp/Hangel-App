/**
 * POST /api/super-admin/ngos/[id]/mail-feature
 *
 * Süper-admin bir STK'ya "Workspace Toplu Mail" özelliğini açar/kapatır.
 * Ad Grants gate + transparency approve desenini izler: gate bayrağı STK'nın
 * ngos/{id} doc'una featureFlags altında yazılır. Bu bayrak kapalıyken STK'nın
 * SMTP bağlama (connect) ve kampanya başlatma akışları 403 MAIL_FEATURE_DISABLED
 * döner. Yalnız Admin SDK + requireSuperAdmin ile yazılır.
 *
 * Body: { enabled: boolean }
 * Yazılan alanlar (merge): featureFlags.bulkMailEnabled,
 *   featureFlags.bulkMailApprovedAt (ISO), featureFlags.bulkMailApprovedBy (uid).
 *
 * Hata: { errorCode, message }. (requireSuperAdmin auth hatası kendi formatını döner.)
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/messaging/server-auth';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireSuperAdmin(req);
  if ('error' in auth) return auth.error;
  const { actor } = auth;

  const { id } = await params;
  if (!id) {
    return NextResponse.json(
      { errorCode: 'BAD_INPUT', message: 'STK kimliği gerekli.' },
      { status: 400 }
    );
  }

  let body: { enabled?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { errorCode: 'BAD_JSON', message: 'Geçersiz JSON.' },
      { status: 400 }
    );
  }

  const enabled = body.enabled;
  if (typeof enabled !== 'boolean') {
    return NextResponse.json(
      { errorCode: 'BAD_INPUT', message: 'enabled boolean olmalı.' },
      { status: 400 }
    );
  }

  const db = getAdminFirestore();
  const ngoRef = db.collection(COLLECTIONS.ngos).doc(id);
  const ngoSnap = await ngoRef.get();
  if (!ngoSnap.exists) {
    return NextResponse.json(
      { errorCode: 'NOT_FOUND', message: 'STK bulunamadı.' },
      { status: 404 }
    );
  }

  await ngoRef.set(
    {
      featureFlags: {
        bulkMailEnabled: enabled,
        bulkMailApprovedAt: new Date().toISOString(),
        bulkMailApprovedBy: actor.uid,
      },
    },
    { merge: true }
  );

  return NextResponse.json({ ok: true, ngoId: id, bulkMailEnabled: enabled });
}
