/**
 * GET  /api/super-admin/santral/providers
 * POST /api/super-admin/santral/providers
 *
 * Sanal santral sağlayıcı (provider) konfigürasyonu yönetimi.
 *
 * GET — kayıtlı provider'ları listele.
 *   Response: { providers: ProviderRow[] }
 *   GÜVENLİK: webhookSecret response'ta YOLLANMAZ, sadece hasWebhookSecret bool.
 *
 * POST — provider create/upsert.
 *   Body: {
 *     id, name, displayName?, apiEndpoint?, sipServer?, supportEmail?,
 *     status?: 'active'|'inactive'|'suspended', webhookSecret?
 *   }
 *   - id verilirse upsert (mevcut doc merge).
 *   - webhookSecret sadece yazılır, okunmaz.
 *   Response: { ok, providerId }
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { COLLECTIONS } from '@/firebase/collections';
import { logAuditEvent, clientIpFromRequest } from '@/lib/santral/audit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PROVIDERS = 'santralProviders';
const VALID_STATUSES = ['active', 'inactive', 'suspended'] as const;
type ProviderStatus = typeof VALID_STATUSES[number];

interface ProviderRow {
  id: string;
  name: string;
  displayName?: string;
  apiEndpoint?: string;
  sipServer?: string;
  supportEmail?: string;
  status: ProviderStatus | string;
  hasWebhookSecret: boolean;       // GÜVENLİK: secret kendisi YOK.
  createdAt?: string | null;
  updatedAt?: string | null;
}

async function isSuperAdmin(req: NextRequest): Promise<{ ok: boolean; uid?: string }> {
  const authHeader = req.headers.get('authorization') || '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!idToken) return { ok: false };
  try {
    const decoded = await getAdminAuth().verifyIdToken(idToken) as {
      uid: string; role?: string; superAdminPermissions?: unknown;
    };
    if (decoded.role === 'super-admin' || !!decoded.superAdminPermissions) {
      return { ok: true, uid: decoded.uid };
    }
    const snap = await getAdminFirestore().collection(COLLECTIONS.users).doc(decoded.uid).get();
    const d = snap.data();
    const ok = d?.role === 'super-admin' || (Array.isArray(d?.superAdminPermissions) && d.superAdminPermissions.length > 0);
    return { ok, uid: ok ? decoded.uid : undefined };
  } catch { return { ok: false }; }
}

function toIso(v: unknown): string | null {
  if (!v) return null;
  if (typeof v === 'object' && v !== null) {
    const obj = v as { toDate?: () => Date; _seconds?: number };
    if (typeof obj.toDate === 'function') return obj.toDate().toISOString();
    if (typeof obj._seconds === 'number') return new Date(obj._seconds * 1000).toISOString();
  }
  if (v instanceof Date) return v.toISOString();
  if (typeof v === 'string') return v;
  return null;
}

function normalize(doc: FirebaseFirestore.QueryDocumentSnapshot): ProviderRow {
  const d = doc.data();
  return {
    id: doc.id,
    name: typeof d.name === 'string' ? d.name : '',
    displayName: typeof d.displayName === 'string' ? d.displayName : undefined,
    apiEndpoint: typeof d.apiEndpoint === 'string' ? d.apiEndpoint : undefined,
    sipServer: typeof d.sipServer === 'string' ? d.sipServer : undefined,
    supportEmail: typeof d.supportEmail === 'string' ? d.supportEmail : undefined,
    status: typeof d.status === 'string' ? d.status : 'inactive',
    // GÜVENLİK: secret değerini ASLA dönme.
    hasWebhookSecret: typeof d.webhookSecret === 'string' && d.webhookSecret.length > 0,
    createdAt: toIso(d.createdAt),
    updatedAt: toIso(d.updatedAt),
  };
}

export async function GET(req: NextRequest) {
  const auth = await isSuperAdmin(req);
  if (!auth.ok || !auth.uid) {
    return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'Super-admin yetkisi gerekli.' }, { status: 403 });
  }

  const db = getAdminFirestore();
  let providers: ProviderRow[];
  try {
    const snap = await db.collection(PROVIDERS).orderBy('createdAt', 'desc').get();
    providers = snap.docs.map(normalize);
  } catch (e) {
    // orderBy field yoksa fallback
    try {
      const snap = await db.collection(PROVIDERS).get();
      providers = snap.docs.map(normalize);
    } catch (e2) {
      const msg = e2 instanceof Error
        ? e2.message
        : (e instanceof Error ? e.message : 'Sorgu hatası');
      return NextResponse.json(
        { errorCode: 'QUERY_FAILED', message: msg },
        { status: 500 },
      );
    }
  }

  await logAuditEvent({
    actorUid: auth.uid,
    action: 'santral.providers.list',
    resourceType: 'santralProviders',
    resourceId: null,
    ipAddress: clientIpFromRequest(req),
    details: { returnedCount: providers.length },
  });

  return NextResponse.json({ providers });
}

interface PostBody {
  id?: unknown;
  name?: unknown;
  displayName?: unknown;
  apiEndpoint?: unknown;
  sipServer?: unknown;
  supportEmail?: unknown;
  status?: unknown;
  webhookSecret?: unknown;
}

function asTrimmedString(v: unknown, maxLen: number): string | undefined {
  if (typeof v !== 'string') return undefined;
  const t = v.trim();
  if (!t) return undefined;
  return t.slice(0, maxLen);
}

export async function POST(req: NextRequest) {
  const auth = await isSuperAdmin(req);
  if (!auth.ok || !auth.uid) {
    return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'Super-admin yetkisi gerekli.' }, { status: 403 });
  }

  let body: PostBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ errorCode: 'BAD_JSON', message: 'Geçersiz JSON.' }, { status: 400 });
  }

  const name = asTrimmedString(body.name, 120);
  if (!name) {
    return NextResponse.json({ errorCode: 'BAD_INPUT', message: 'name zorunlu.' }, { status: 400 });
  }

  const idInput = asTrimmedString(body.id, 64);
  const displayName = asTrimmedString(body.displayName, 200);
  const apiEndpoint = asTrimmedString(body.apiEndpoint, 500);
  const sipServer = asTrimmedString(body.sipServer, 200);
  const supportEmail = asTrimmedString(body.supportEmail, 200);
  const statusRaw = asTrimmedString(body.status, 32);
  const status: ProviderStatus | undefined = statusRaw && (VALID_STATUSES as readonly string[]).includes(statusRaw)
    ? (statusRaw as ProviderStatus)
    : undefined;
  if (statusRaw && !status) {
    return NextResponse.json({ errorCode: 'BAD_STATUS', message: 'status geçersiz.' }, { status: 400 });
  }
  const webhookSecret = asTrimmedString(body.webhookSecret, 512);

  const db = getAdminFirestore();
  // Slug fallback — kullanıcı id vermediyse name'den üret.
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 64);
  const docId = idInput ?? (slug || `provider-${Date.now()}`);
  const ref = db.collection(PROVIDERS).doc(docId);
  const existing = await ref.get();

  const payload: Record<string, unknown> = {
    name,
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: auth.uid,
  };
  if (displayName !== undefined) payload.displayName = displayName;
  if (apiEndpoint !== undefined) payload.apiEndpoint = apiEndpoint;
  if (sipServer !== undefined) payload.sipServer = sipServer;
  if (supportEmail !== undefined) payload.supportEmail = supportEmail;
  if (status) payload.status = status;
  if (webhookSecret) payload.webhookSecret = webhookSecret; // sadece yazılır.

  if (!existing.exists) {
    payload.createdAt = FieldValue.serverTimestamp();
    payload.createdBy = auth.uid;
    if (!payload.status) payload.status = 'inactive';
  }

  await ref.set(payload, { merge: true });

  await logAuditEvent({
    actorUid: auth.uid,
    action: existing.exists ? 'santral.providers.update' : 'santral.providers.create',
    resourceType: 'santralProviders',
    resourceId: ref.id,
    ipAddress: clientIpFromRequest(req),
    // GÜVENLİK: webhookSecret value asla audit'e yazma; sadece flag.
    details: {
      name,
      displayName: displayName ?? null,
      apiEndpoint: apiEndpoint ?? null,
      sipServer: sipServer ?? null,
      status: status ?? null,
      webhookSecretRotated: !!webhookSecret,
    },
  });

  return NextResponse.json({ ok: true, providerId: ref.id });
}
