/**
 * DELETE /api/super-admin/app-store-assets/[id]?platform=app-store
 * PATCH  /api/super-admin/app-store-assets/[id]?platform=app-store  body: { active: bool }
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore, getAdminBucket } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';
import { PLATFORMS } from '@/lib/app-store-specs';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function isSuperAdmin(req: NextRequest): Promise<boolean> {
  const authHeader = req.headers.get('authorization') || '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!idToken) return false;
  try {
    const decoded = await getAdminAuth().verifyIdToken(idToken) as { uid: string; role?: string; superAdminPermissions?: unknown };
    if (decoded.role === 'super-admin' || !!decoded.superAdminPermissions) return true;
    const snap = await getAdminFirestore().collection(COLLECTIONS.users).doc(decoded.uid).get();
    const d = snap.data();
    return d?.role === 'super-admin' || (Array.isArray(d?.superAdminPermissions) && d.superAdminPermissions.length > 0);
  } catch { return false; }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isSuperAdmin(req))) {
    return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'Super-admin yetkisi gerekli.' }, { status: 403 });
  }
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const platform = searchParams.get('platform');
  if (!platform || !PLATFORMS.find((p) => p.key === platform)) {
    return NextResponse.json({ errorCode: 'BAD_PLATFORM', message: 'platform geçersiz' }, { status: 400 });
  }

  try {
    const docRef = getAdminFirestore().collection('appStoreAssets').doc(platform).collection('screenshots').doc(id);
    const snap = await docRef.get();
    if (!snap.exists) {
      return NextResponse.json({ errorCode: 'NOT_FOUND', message: 'Görsel bulunamadı' }, { status: 404 });
    }
    const data = snap.data();
    if (data?.storagePath) {
      await getAdminBucket().file(data.storagePath).delete().catch(() => null);
    }
    await docRef.delete();
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ errorCode: 'DELETE_FAILED', message: e instanceof Error ? e.message : 'Silme hatası' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isSuperAdmin(req))) {
    return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'Super-admin yetkisi gerekli.' }, { status: 403 });
  }
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const platform = searchParams.get('platform');
  if (!platform || !PLATFORMS.find((p) => p.key === platform)) {
    return NextResponse.json({ errorCode: 'BAD_PLATFORM', message: 'platform geçersiz' }, { status: 400 });
  }
  let body: { active?: boolean };
  try { body = await req.json(); } catch {
    return NextResponse.json({ errorCode: 'BAD_JSON', message: 'Geçersiz JSON' }, { status: 400 });
  }
  if (typeof body.active !== 'boolean') {
    return NextResponse.json({ errorCode: 'BAD_INPUT', message: 'active bool gerekli' }, { status: 400 });
  }
  try {
    await getAdminFirestore().collection('appStoreAssets').doc(platform).collection('screenshots').doc(id).set({
      active: body.active,
      updatedAt: Date.now(),
    }, { merge: true });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ errorCode: 'UPDATE_FAILED', message: e instanceof Error ? e.message : 'Hata' }, { status: 500 });
  }
}
