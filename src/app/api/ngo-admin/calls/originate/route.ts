/**
 * POST /api/ngo-admin/calls/originate
 *
 * STK agent'ı outbound çağrı başlatır. Concurrent limit kontrolü (STK başına
 * 2 eş zamanlı çağrı max) yapılır. Provider seçimi STK'nın `ngoCallCenter`
 * dokümanındaki `providerId`'sine göre yapılır; gerçek dial işlemi
 * `src/lib/santral/` altındaki adapter (StubSantralProvider) tarafından
 * gerçekleştirilir. Bu route adapter import yerine **dynamic import** kullanır;
 * gerçek provider plug edilene dek lib'in var olmaması bu route'u kırmaz.
 *
 * KVKK: recording byte yazılmaz; yalnızca metadata + recordingStorageUrl
 * (provider callback'i ile ileride doldurulur).
 *
 * Body:
 *   - contactPhone: string   (E.164 normalize, +90... beklenir)
 *   - contactId?:   string   (CRM contact doc id — opsiyonel; ham numara
 *                             aramasında verilmeyebilir, o zaman session
 *                             yalnızca calledNumber ile oluşur)
 *   - ngoId?:       string   (opsiyonel hedef STK; yalnızca owner/super-admin
 *                             ya da kendi managedNgoId'si ise dikkate alınır)
 *   - direction?:   'inbound' | 'outbound'  (default 'outbound')
 *   - notes?:       string   (opsiyonel)
 *
 * Yanıt: { ok, callSessionId, status, providerCallId? }
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { COLLECTIONS } from '@/firebase/collections';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CALL_SESSIONS = 'callSessions';
const AUDIT_LOG = 'callAuditLog';
const NGO_CALL_CENTER = 'ngoCallCenter';
const CONCURRENT_LIMIT = 2;

interface OriginateBody {
  contactPhone?: unknown;
  contactId?: unknown;
  ngoId?: unknown;
  direction?: unknown;
  notes?: unknown;
}

interface AgentContext {
  uid: string;
  /** Caller'ın kendi yönettiği STK (users/{uid}.managedNgoId). */
  managedNgoId: string;
  role?: string;
  email?: string;
}

interface ProviderOriginateResult {
  providerCallId: string;
  status: 'ringing' | 'queued' | 'failed';
  error?: string;
}

interface ProviderAdapter {
  originate(args: {
    fromNumber: string;
    toNumber: string;
    ngoId: string;
    agentUid: string;
    callSessionId: string;
  }): Promise<ProviderOriginateResult>;
}

async function authorize(req: NextRequest): Promise<AgentContext | null> {
  const authHeader = req.headers.get('authorization') || '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!idToken) return null;
  try {
    const decoded = await getAdminAuth().verifyIdToken(idToken) as { uid: string; role?: string; email?: string };
    const snap = await getAdminFirestore().collection(COLLECTIONS.users).doc(decoded.uid).get();
    if (!snap.exists) return null;
    const d = snap.data() as { role?: string; managedNgoId?: string };
    if (!d?.managedNgoId) return null;
    if (d.role !== 'ngo-admin' && d.role !== 'super-admin') return null;
    return { uid: decoded.uid, managedNgoId: d.managedNgoId, role: d.role, email: decoded.email };
  } catch {
    return null;
  }
}

async function loadProviderAdapter(): Promise<ProviderAdapter | null> {
  // src/lib/santral/ ayrı bir worker tarafından yazılıyor. Henüz mevcut
  // değilse fallback stub kullanılır — çağrı yine kayıt altına alınır ama
  // gerçek dial yapılmaz.
  try {
    const mod = (await import('@/lib/santral')) as {
      StubSantralProvider?: new () => ProviderAdapter;
      default?: new () => ProviderAdapter;
    };
    const Ctor = mod.StubSantralProvider ?? mod.default;
    if (!Ctor) return null;
    return new Ctor();
  } catch {
    return null;
  }
}

function inlineStubProvider(): ProviderAdapter {
  return {
    async originate({ callSessionId }) {
      return {
        providerCallId: `stub-${callSessionId}`,
        status: 'ringing',
      };
    },
  };
}

function normalizePhone(raw: string): string | null {
  const trimmed = raw.replace(/\s+/g, '');
  if (!trimmed) return null;
  // Basit doğrulama; gerçek normalize phone-normalize.ts'ye delegate edilebilir.
  if (!/^\+?[0-9]{10,15}$/.test(trimmed)) return null;
  return trimmed.startsWith('+') ? trimmed : `+${trimmed}`;
}

export async function POST(req: NextRequest) {
  const ctx = await authorize(req);
  if (!ctx) {
    return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'NGO admin yetkisi gerekli.' }, { status: 403 });
  }

  let body: OriginateBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ errorCode: 'BAD_JSON', message: 'Geçersiz JSON gövdesi.' }, { status: 400 });
  }

  const rawPhone = typeof body.contactPhone === 'string' ? body.contactPhone : '';
  // contactId OPSİYONEL — dashboard'dan ham numara aramasında verilmeyebilir.
  const contactId = typeof body.contactId === 'string' && body.contactId.trim() ? body.contactId.trim() : null;
  const notes = typeof body.notes === 'string' ? body.notes.slice(0, 2000) : '';
  const direction = body.direction === 'inbound' ? 'inbound' : 'outbound';
  if (!rawPhone) {
    return NextResponse.json(
      { errorCode: 'BAD_INPUT', message: 'contactPhone zorunlu.' },
      { status: 400 },
    );
  }
  const toNumber = normalizePhone(rawPhone);
  if (!toNumber) {
    return NextResponse.json({ errorCode: 'BAD_PHONE', message: 'Telefon numarası geçersiz.' }, { status: 400 });
  }

  // Hedef STK çözümü: body.ngoId yalnızca owner/super-admin ya da caller'ın
  // kendi managedNgoId'si ise kabul edilir; aksi halde caller'ın managedNgoId'si.
  const requestedNgoId = typeof body.ngoId === 'string' && body.ngoId.trim() ? body.ngoId.trim() : '';
  const isOwner = ctx.role === 'super-admin' || ctx.email === 'ismailhilmi@hangel.org';
  const targetNgoId =
    requestedNgoId && (isOwner || ctx.managedNgoId === requestedNgoId)
      ? requestedNgoId
      : ctx.managedNgoId;
  if (!targetNgoId) {
    return NextResponse.json(
      { errorCode: 'NO_TARGET_NGO', message: 'Hedef STK çözülemedi.' },
      { status: 400 },
    );
  }

  const db = getAdminFirestore();

  // STK call-center tenant durumu — aktif değilse RED.
  const ccSnap = await db.collection(NGO_CALL_CENTER).doc(targetNgoId).get();
  if (!ccSnap.exists) {
    return NextResponse.json(
      { errorCode: 'NOT_ONBOARDED', message: 'Çağrı merkezi başvurunuz bulunmuyor.' },
      { status: 409 },
    );
  }
  const ccData = ccSnap.data() as {
    status?: string;
    callerIdNumber?: string;
    providerId?: string;
    monthlyMinutesQuota?: number;
    currentMonthUsage?: number;
  };
  if (ccData.status !== 'active') {
    return NextResponse.json(
      { errorCode: 'INACTIVE', message: 'Çağrı merkezi henüz aktif değil.' },
      { status: 409 },
    );
  }
  if (!ccData.callerIdNumber) {
    return NextResponse.json(
      { errorCode: 'NO_CALLER_ID', message: 'Caller ID numaranız atanmamış.' },
      { status: 409 },
    );
  }

  // Concurrent limit — bu STK'nın ringing/in-progress oturumları say.
  // TEK eşitlik sorgusu (composite index GEREKMEZ) + status'u client-side say;
  // böylece index deploy edilmese bile originate 500 atmaz, oturum kaydı oluşur.
  const ngoSnap = await db
    .collection(CALL_SESSIONS)
    .where('ngoId', '==', targetNgoId)
    .limit(500)
    .get();
  const activeCount = ngoSnap.docs.filter((d) => {
    const s = (d.data() as { status?: string }).status;
    return s === 'ringing' || s === 'in-progress';
  }).length;
  if (activeCount >= CONCURRENT_LIMIT) {
    return NextResponse.json(
      {
        errorCode: 'CONCURRENT_LIMIT',
        message: `Aynı anda en fazla ${CONCURRENT_LIMIT} aktif çağrı yapabilirsiniz.`,
      },
      { status: 429 },
    );
  }

  // callSessions doc'unu önce oluştur ki provider callback'i bu id'yi referans alabilsin.
  const sessionRef = db.collection(CALL_SESSIONS).doc();
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || null;

  await sessionRef.set({
    agentUid: ctx.uid,
    ngoId: targetNgoId,
    contactId: contactId ?? null,
    calledNumber: toNumber,
    callerNumber: ccData.callerIdNumber,
    startedAt: FieldValue.serverTimestamp(),
    endedAt: null,
    duration: 0,
    outcome: null,
    recordingStorageUrl: null,
    status: 'ringing',
    direction,
    notes: notes || null,
    providerId: ccData.providerId ?? null,
    providerCallId: null,
    createdAt: FieldValue.serverTimestamp(),
  });

  // Provider adapter — yoksa inline stub fallback.
  const adapter = (await loadProviderAdapter()) ?? inlineStubProvider();
  let providerResult: ProviderOriginateResult;
  try {
    providerResult = await adapter.originate({
      fromNumber: ccData.callerIdNumber,
      toNumber,
      ngoId: targetNgoId,
      agentUid: ctx.uid,
      callSessionId: sessionRef.id,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Provider hata verdi';
    await sessionRef.update({ status: 'failed', endedAt: FieldValue.serverTimestamp(), outcome: 'provider_error' });
    return NextResponse.json({ errorCode: 'PROVIDER_ERROR', message: msg }, { status: 502 });
  }

  await sessionRef.update({
    providerCallId: providerResult.providerCallId,
    status: providerResult.status === 'failed' ? 'failed' : 'ringing',
  });

  // Audit log — actor + action + resource. KVKK: recording byte yok, sadece metadata.
  await db.collection(AUDIT_LOG).add({
    actorUid: ctx.uid,
    action: 'call.originate',
    resourceType: 'callSessions',
    resourceId: sessionRef.id,
    timestamp: FieldValue.serverTimestamp(),
    ipAddress: ip,
    details: {
      ngoId: targetNgoId,
      contactId: contactId ?? null,
      calledNumber: toNumber,
      callerNumber: ccData.callerIdNumber,
      providerId: ccData.providerId ?? null,
      providerCallId: providerResult.providerCallId,
    },
  });

  return NextResponse.json({
    ok: true,
    callSessionId: sessionRef.id,
    status: providerResult.status === 'failed' ? 'failed' : 'ringing',
    providerCallId: providerResult.providerCallId,
  });
}
