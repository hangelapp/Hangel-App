/**
 * POST /api/super-admin/app-store-assets/generate
 *
 * Body: { platform, feature, customPrompt?, deviceLabel, deviceW, deviceH }
 *
 * Imagen 3'ten görsel üretir → Firebase Storage'a yükler → Firestore'a meta yazar.
 *
 * Dönüş: { id, storageUrl, base64Preview, aspectRatio, prompt }
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore, getAdminBucket } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';
import { generateAppStoreImage } from '@/ai/flows/app-store-image-flow';
import { AIQuotaExceededError } from '@/ai/flow-auth';
import { PLATFORMS, FEATURES, buildStoragePath, type PlatformKey, type FeatureKey } from '@/lib/app-store-specs';
import { FieldValue } from 'firebase-admin/firestore';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60; // Imagen 3 ~10-30s sürer

async function isSuperAdmin(req: NextRequest): Promise<{ ok: boolean; uid?: string }> {
  const authHeader = req.headers.get('authorization') || '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!idToken) return { ok: false };
  try {
    const decoded = await getAdminAuth().verifyIdToken(idToken) as { uid: string; role?: string; superAdminPermissions?: unknown };
    if (decoded.role === 'super-admin' || !!decoded.superAdminPermissions) return { ok: true, uid: decoded.uid };
    const snap = await getAdminFirestore().collection(COLLECTIONS.users).doc(decoded.uid).get();
    const d = snap.data();
    const ok = d?.role === 'super-admin' || (Array.isArray(d?.superAdminPermissions) && d.superAdminPermissions.length > 0);
    return { ok, uid: decoded.uid };
  } catch { return { ok: false }; }
}

export async function POST(req: NextRequest) {
  const auth = await isSuperAdmin(req);
  if (!auth.ok || !auth.uid) {
    return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'Super-admin yetkisi gerekli.' }, { status: 403 });
  }

  let body: {
    platform?: PlatformKey;
    feature?: FeatureKey;
    customPrompt?: string;
    deviceLabel?: string;
    deviceW?: number;
    deviceH?: number;
  };
  try { body = await req.json(); } catch {
    return NextResponse.json({ errorCode: 'BAD_JSON', message: 'Geçersiz JSON' }, { status: 400 });
  }

  const platform = PLATFORMS.find((p) => p.key === body.platform);
  const feature = FEATURES.find((f) => f.key === body.feature);
  if (!platform || !feature) {
    return NextResponse.json({ errorCode: 'BAD_INPUT', message: 'platform/feature geçersiz' }, { status: 400 });
  }
  if (!body.deviceW || !body.deviceH || !body.deviceLabel) {
    return NextResponse.json({ errorCode: 'BAD_INPUT', message: 'cihaz spec eksik' }, { status: 400 });
  }

  try {
    // 1) Imagen 3 generate
    const result = await generateAppStoreImage({
      userId: auth.uid,
      platform: platform.key,
      feature: feature.key,
      customPrompt: body.customPrompt,
      deviceW: body.deviceW,
      deviceH: body.deviceH,
    });

    // 2) Storage'a yükle
    const ts = Date.now();
    const slug = `${feature.key}-${body.deviceLabel.replace(/\W+/g, '-').toLowerCase()}-${ts}`;
    const storagePath = buildStoragePath(platform.key, slug);
    const buffer = Buffer.from(result.base64Image, 'base64');
    const file = getAdminBucket().file(storagePath);
    await file.save(buffer, {
      contentType: result.mimeType,
      metadata: {
        metadata: {
          platform: platform.key,
          feature: feature.key,
          createdBy: auth.uid,
        },
      },
    });
    await file.makePublic();
    const storageUrl = file.publicUrl();

    // 3) Firestore meta
    const docRef = getAdminFirestore()
      .collection('appStoreAssets').doc(platform.key)
      .collection('screenshots').doc(slug);
    await docRef.set({
      storageUrl,
      storagePath,
      prompt: result.fullPrompt,
      customPrompt: body.customPrompt || '',
      feature: feature.key,
      platform: platform.key,
      deviceLabel: body.deviceLabel,
      deviceW: body.deviceW,
      deviceH: body.deviceH,
      aspectRatio: result.aspectRatio,
      active: true,
      createdAt: FieldValue.serverTimestamp(),
      createdBy: auth.uid,
      model: 'gemini-2.5-flash-image-preview',
    });

    return NextResponse.json({
      id: slug,
      storageUrl,
      aspectRatio: result.aspectRatio,
      // base64 ile UI hızlı preview gösterir (Storage CDN propagation beklemeden)
      base64Preview: `data:${result.mimeType};base64,${result.base64Image}`,
    });
  } catch (e) {
    if (e instanceof AIQuotaExceededError) {
      return NextResponse.json({ errorCode: 'QUOTA', message: e.message }, { status: 429 });
    }
    const msg = e instanceof Error ? e.message : 'Üretim hatası';
    return NextResponse.json({ errorCode: 'GEN_FAILED', message: msg }, { status: 500 });
  }
}
