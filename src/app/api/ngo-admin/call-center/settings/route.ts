/**
 * POST /api/ngo-admin/call-center/settings
 *
 * STK admin'inin çağrı merkezi (sanal santral) AYARLARINI günceller:
 *  - dahili (extension) listesi + agent tahsisleri
 *  - kayıt (recording) açık/kapalı, KVKK anonsu, çağrı kimliği numarası
 *
 * KVKK: STK = Veri Sorumlusu, hangel = İşleyen.
 *
 * ÖNEMLİ — GÜVENLİK: Bu route SADECE ayar yazar. `status`, `sipUsername` gibi
 * güvenlik/provisioning alanlarına ASLA dokunmaz. Doc yoksa bile merge:true ile
 * yalnızca ayar alanları oluşturulur.
 *
 * Firestore merge nüansı: `set(..., { merge:true })` üst-seviye `settings` ve
 * `extensions` alanlarını KOMPLE değiştirir (nested merge yapmaz). Bu yüzden
 * `settings` için mevcut doc'tan okuyup {...mevcut, ...yeni} birleştirerek
 * yazarız. `extensions` zaten tam liste olarak gelir → komple değiştirilir.
 *
 * Body: {
 *   extensions?: Array<{ ext, label, assignedToUid?, assignedToName?, assignedToPhone? }>,
 *   settings?: { recordingEnabled?, kvkkAnnouncement?, callerIdNumber? }
 * }
 * Yanıt: { ok: true } | { errorCode, message }
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { COLLECTIONS } from '@/firebase/collections';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface CallerContext {
  uid: string;
  ngoId: string;
  role?: string;
  email?: string;
}

async function authorize(req: NextRequest): Promise<CallerContext | null> {
  const authHeader = req.headers.get('authorization') || '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!idToken) return null;
  try {
    const decoded = (await getAdminAuth().verifyIdToken(idToken)) as { uid: string; role?: string; email?: string };
    const snap = await getAdminFirestore().collection(COLLECTIONS.users).doc(decoded.uid).get();
    if (!snap.exists) return null;
    const d = snap.data() as { role?: string; managedNgoId?: string };
    if (!d?.managedNgoId) return null;
    if (d.role !== 'ngo-admin' && d.role !== 'super-admin') return null;
    return { uid: decoded.uid, ngoId: d.managedNgoId, role: d.role, email: decoded.email };
  } catch {
    return null;
  }
}

interface CleanExtension {
  ext: string;
  label: string;
  assignedToUid: string | null;
  assignedToName: string | null;
  assignedToPhone: string | null;
}

interface CleanSettings {
  recordingEnabled?: boolean;
  kvkkAnnouncement?: boolean;
  callerIdNumber?: string;
  inboundAgentUid?: string | null;
  inboundAgentName?: string | null;
  communicationHubEnabled?: boolean;
}

/** raw → temiz extension dizisi. Sadece bilinen alanları, normalize/clamp ederek geçirir. */
function normalizeExtensions(raw: unknown): CleanExtension[] {
  if (!Array.isArray(raw)) return [];
  const out: CleanExtension[] = [];
  for (const item of raw.slice(0, 50)) {
    if (!item || typeof item !== 'object') continue;
    const e = item as Record<string, unknown>;
    const ext = String(e.ext ?? '').replace(/\D/g, '').slice(0, 6);
    if (!ext) continue; // boş dahili → atla
    const label = String(e.label ?? '').slice(0, 80);
    const assignedToUid = typeof e.assignedToUid === 'string' ? e.assignedToUid : null;
    const assignedToName = typeof e.assignedToName === 'string' ? e.assignedToName.slice(0, 120) : null;
    const assignedToPhone = typeof e.assignedToPhone === 'string' ? e.assignedToPhone.slice(0, 32) : null;
    out.push({ ext, label, assignedToUid, assignedToName, assignedToPhone });
  }
  return out;
}

/** raw → temiz settings nesnesi. Sadece TANIMLI alanları yazar (kısmi update). */
function normalizeSettings(raw: unknown): CleanSettings {
  const out: CleanSettings = {};
  if (!raw || typeof raw !== 'object') return out;
  const s = raw as Record<string, unknown>;
  if (s.recordingEnabled !== undefined) out.recordingEnabled = Boolean(s.recordingEnabled);
  if (s.kvkkAnnouncement !== undefined) out.kvkkAnnouncement = Boolean(s.kvkkAnnouncement);
  if (s.communicationHubEnabled !== undefined) out.communicationHubEnabled = Boolean(s.communicationHubEnabled);
  if (s.callerIdNumber !== undefined) out.callerIdNumber = String(s.callerIdNumber).slice(0, 32);
  // Gelen aramayı alacak kişi — null kabul edilir ("herkes çalar"); string ise clamp.
  if (s.inboundAgentUid !== undefined) {
    out.inboundAgentUid = typeof s.inboundAgentUid === 'string' ? s.inboundAgentUid.slice(0, 128) : null;
  }
  if (s.inboundAgentName !== undefined) {
    out.inboundAgentName = typeof s.inboundAgentName === 'string' ? s.inboundAgentName.slice(0, 120) : null;
  }
  return out;
}

export async function POST(req: NextRequest) {
  const ctx = await authorize(req);
  if (!ctx) {
    return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'NGO admin yetkisi gerekli.' }, { status: 403 });
  }

  let body: { extensions?: unknown; settings?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ errorCode: 'BAD_JSON', message: 'Geçersiz JSON.' }, { status: 400 });
  }

  const extensionsProvided = body?.extensions !== undefined;
  const settingsProvided = body?.settings !== undefined;

  const cleanExtensions = extensionsProvided ? normalizeExtensions(body.extensions) : null;
  const cleanSettingsPartial = settingsProvided ? normalizeSettings(body.settings) : null;

  try {
    const db = getAdminFirestore();
    const docRef = db.collection('ngoCallCenter').doc(ctx.ngoId);

    // Firestore merge üst-seviye `settings` alanını komple değiştirdiği için,
    // mevcut settings'i okuyup yeni (kısmi) ayarlarla birleştiriyoruz.
    let mergedSettings: CleanSettings | null = null;
    if (cleanSettingsPartial) {
      const snap = await docRef.get();
      const existing = (snap.exists ? (snap.data()?.settings as Record<string, unknown> | undefined) : undefined) ?? {};
      mergedSettings = { ...(existing as CleanSettings), ...cleanSettingsPartial };
    }

    const update: Record<string, unknown> = {
      settingsUpdatedAt: FieldValue.serverTimestamp(),
      settingsUpdatedBy: ctx.uid,
    };
    if (cleanExtensions) update.extensions = cleanExtensions; // tam liste → komple değiştir
    if (mergedSettings) update.settings = mergedSettings;

    await docRef.set(update, { merge: true });

    // Audit log — append-only.
    await db.collection('callAuditLog').doc().set({
      actorUid: ctx.uid,
      action: 'call_center.settings.update',
      resourceType: 'ngoCallCenter',
      resourceId: ctx.ngoId,
      timestamp: FieldValue.serverTimestamp(),
      details: {
        extensionsCount: cleanExtensions ? cleanExtensions.length : null,
        settingsKeys: cleanSettingsPartial ? Object.keys(cleanSettingsPartial) : [],
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[call-center/settings] internal error', e);
    return NextResponse.json({ errorCode: 'INTERNAL_ERROR', message: 'Sunucu hatası.' }, { status: 500 });
  }
}
