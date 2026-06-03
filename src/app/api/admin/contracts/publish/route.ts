/**
 * POST /api/admin/contracts/publish
 *
 * Super-admin sözleşme/politika yayın akışı:
 *  - status → 'yayinlandi' (published) + publishedAt + publishedBy + hash hesapla
 *  - contractPublishLog'a append-only audit kaydı yaz
 *  - "major version" tespiti (semver minor/major bump) → response'da
 *    requireReConsent: true döner. Re-consent banner trigger client tarafında.
 *
 * Body: { slug: string, version?: string, hash?: string, jurisdiction?: string }
 *   - slug zorunlu (contracts doc id)
 *   - version opsiyonel; verilmezse mevcut doc'un version'ı kullanılır
 *   - hash opsiyonel; verilmezse content'ten SHA-256 hesaplanır
 *
 * Auth: ID token zorunlu; super-admin değilse 403.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';
import { FieldValue } from 'firebase-admin/firestore';
import crypto from 'crypto';

export const runtime = 'nodejs';

interface DecodedToken {
  uid: string;
  role?: string;
  superAdminPermissions?: unknown;
  name?: string;
  email?: string;
}

async function authenticateSuperAdmin(req: NextRequest): Promise<DecodedToken | null> {
  const authHeader = req.headers.get('authorization') || '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!idToken) return null;
  try {
    const decoded = await getAdminAuth().verifyIdToken(idToken) as DecodedToken;
    if (decoded.role === 'super-admin' || !!decoded.superAdminPermissions) return decoded;
    const snap = await getAdminFirestore().collection(COLLECTIONS.users).doc(decoded.uid).get();
    const d = snap.data();
    if (d?.role === 'super-admin' || (Array.isArray(d?.superAdminPermissions) && d.superAdminPermissions.length > 0)) {
      return { ...decoded, name: decoded.name || d?.name };
    }
    return null;
  } catch {
    return null;
  }
}

function parseSemver(v: string): { major: number; minor: number; patch: number } | null {
  const m = /^(\d+)(?:\.(\d+))?(?:\.(\d+))?$/.exec(v.trim());
  if (!m) return null;
  return { major: Number(m[1]), minor: Number(m[2] ?? 0), patch: Number(m[3] ?? 0) };
}

// Major/minor bump → re-consent. Patch ise yalnızca yayın güncellemesi.
function isMajorBump(prev: string | undefined, next: string): boolean {
  if (!prev) return false;
  const p = parseSemver(prev);
  const n = parseSemver(next);
  if (!p || !n) return false;
  return n.major > p.major || (n.major === p.major && n.minor > p.minor);
}

export async function POST(req: NextRequest) {
  const decoded = await authenticateSuperAdmin(req);
  if (!decoded) {
    return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'Super-admin yetkisi gerekli.' }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const slug = typeof body?.slug === 'string' ? body.slug.trim() : '';
  const versionOverride = typeof body?.version === 'string' ? body.version.trim() : '';
  const hashOverride = typeof body?.hash === 'string' ? body.hash.trim() : '';
  const jurisdictionOverride = typeof body?.jurisdiction === 'string' ? body.jurisdiction.trim() : '';

  if (!slug) {
    return NextResponse.json({ errorCode: 'INVALID_INPUT', message: 'slug zorunlu.' }, { status: 400 });
  }

  const db = getAdminFirestore();
  const ref = db.collection(COLLECTIONS.contracts).doc(slug);
  const snap = await ref.get();
  if (!snap.exists) {
    return NextResponse.json({ errorCode: 'NOT_FOUND', message: 'Sözleşme bulunamadı.' }, { status: 404 });
  }
  const data = snap.data() as Record<string, unknown>;
  const previousVersion = typeof data.version === 'string' ? data.version : undefined;
  const previousHash = typeof data.hash === 'string' ? data.hash : undefined;
  const newVersion = versionOverride || previousVersion || '1.0';
  const content = typeof data.content === 'string' ? data.content : '';
  const newHash = hashOverride || crypto.createHash('sha256').update(`${slug}|${newVersion}|${content}`).digest('hex');
  const jurisdiction = jurisdictionOverride || (typeof data.jurisdiction === 'string' ? data.jurisdiction : (typeof data.country === 'string' ? data.country : 'TR'));

  const requireReConsent = isMajorBump(previousVersion, newVersion);
  const now = FieldValue.serverTimestamp();
  const publishedByName = decoded.name || decoded.email || decoded.uid;

  await ref.set({
    status: 'yayinlandi',
    version: newVersion,
    jurisdiction,
    hash: newHash,
    publishedAt: new Date().toISOString(),
    publishedAtServer: now,
    publishedBy: decoded.uid,
    publishedByName,
    supersedes: previousVersion && previousVersion !== newVersion ? previousVersion : (typeof data.supersedes === 'string' ? data.supersedes : undefined),
    updatedAt: new Date().toISOString(),
    requireReConsent,
  }, { merge: true });

  await db.collection(COLLECTIONS.contractPublishLog).add({
    contractSlug: slug,
    contractTitle: typeof data.title === 'string' ? data.title : slug,
    action: 'publish',
    previousVersion: previousVersion || null,
    newVersion,
    previousHash: previousHash || null,
    newHash,
    jurisdiction,
    requireReConsent,
    actorUid: decoded.uid,
    actorName: publishedByName,
    createdAt: now,
  });

  return NextResponse.json({
    ok: true,
    slug,
    version: newVersion,
    hash: newHash,
    jurisdiction,
    requireReConsent,
  });
}
