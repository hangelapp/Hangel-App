/**
 * GET /api/super-admin/app-store-assets/list?platform=app-store
 *
 * appStoreAssets/{platform}/screenshots/{id} altındaki tüm Firestore doc'ları
 * listele. UI'da platform kartında gösterilir.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
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

export async function GET(req: NextRequest) {
  if (!(await isSuperAdmin(req))) {
    return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'Super-admin yetkisi gerekli.' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const platform = searchParams.get('platform');

  const db = getAdminFirestore();

  // Tek platform veya tümü
  const platformsToFetch = platform
    ? PLATFORMS.filter((p) => p.key === platform)
    : PLATFORMS;

  const result: Record<string, Array<{
    id: string;
    storageUrl: string;
    prompt: string;
    feature: string;
    platform: string;
    deviceLabel: string;
    deviceW: number;
    deviceH: number;
    aspectRatio: string;
    active: boolean;
    createdAt: number | null;
    createdBy: string;
  }>> = {};

  for (const p of platformsToFetch) {
    const snap = await db.collection('appStoreAssets').doc(p.key)
      .collection('screenshots').orderBy('createdAt', 'desc').limit(100).get()
      .catch(() => null);

    result[p.key] = [];
    if (!snap) continue;
    snap.docs.forEach((d) => {
      const x = d.data();
      result[p.key].push({
        id: d.id,
        storageUrl: x.storageUrl || '',
        prompt: x.prompt || '',
        feature: x.feature || 'genel',
        platform: x.platform || p.key,
        deviceLabel: x.deviceLabel || '',
        deviceW: x.deviceW || 0,
        deviceH: x.deviceH || 0,
        aspectRatio: x.aspectRatio || '',
        active: x.active !== false,
        createdAt: x.createdAt?.toMillis?.() || x.createdAt || null,
        createdBy: x.createdBy || '',
      });
    });
  }

  return NextResponse.json({ platforms: result });
}
