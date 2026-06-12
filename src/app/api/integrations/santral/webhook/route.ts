/**
 * POST /api/integrations/santral/webhook
 *
 * Sanal santral provider'larından gelen event'leri kabul eden tek webhook
 * endpoint'i. Provider agnostik: her sağlayıcı kendi webhook secret'ı ile
 * imza atar, bu route santralProviders/{providerId}.webhookSecret ile HMAC
 * SHA-256 doğrular.
 *
 * Provider event tipleri:
 *   - call.started      : Çağrı kuruldu (dial sinyali gitti, henüz cevap yok).
 *   - call.answered     : Karşı taraf cevapladı, görüşme başladı.
 *   - call.ended        : Görüşme bitti (normal / no-answer / busy / failed).
 *   - recording.ready   : Recording dosyası provider'da hazır; bizim Storage'a
 *                         kopyalanır ve callSessions doc'una storage URL'i
 *                         yazılır (signed URL ÜRETİLMEZ — sadece object path
 *                         tutulur, view request'te ayrı endpoint signed URL
 *                         üretecek).
 *
 * KVKK kritik:
 *   - Recording byte ASLA loga / Firestore'a yazılmaz.
 *   - Sadece object path (gs://bucket/path) saklanır.
 *   - Audit log'a her event düşer.
 *
 * Headers:
 *   - X-Santral-Provider: providerId
 *   - X-Santral-Signature: hex HMAC-SHA256 of raw body
 *   - X-Santral-Timestamp: unix ms (replay protection, ±5dk window)
 *
 * Response: { ok: true } veya { errorCode, message } 400/401/404/500.
 */
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getAdminFirestore, getAdminBucket } from '@/lib/firebase-admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { logAuditEvent, clientIpFromRequest } from '@/lib/santral/audit';
import { CallSessionStatus, type SantralWebhookEventType } from '@/lib/santral/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CALL_SESSIONS = 'callSessions';
const SANTRAL_PROVIDERS = 'santralProviders';
const REPLAY_WINDOW_MS = 5 * 60 * 1000; // 5 dk
const RECORDING_PREFIX = 'call-recordings'; // Storage path prefix

interface WebhookBody {
  event?: string;
  providerCallId?: string;
  callSessionId?: string;          // Provider geri yansıtıyorsa
  timestamp?: string | number;     // event time
  status?: string;
  duration?: number;
  outcome?: string;
  recording?: {
    providerRecordingId?: string;
    downloadUrl?: string;
    mimeType?: string;
    durationSeconds?: number;
  };
}

const VALID_EVENTS: readonly SantralWebhookEventType[] = [
  'call.started',
  'call.answered',
  'call.ended',
  'recording.ready',
];

/**
 * Constant-time HMAC karşılaştırma. Provider webhook secret + raw body ile
 * SHA-256 hesaplar, header'daki signature ile timing-safe compare yapar.
 */
function verifySignature(rawBody: string, secret: string, providedSig: string): boolean {
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  const a = Buffer.from(expected, 'hex');
  let b: Buffer;
  try {
    b = Buffer.from(providedSig, 'hex');
  } catch {
    return false;
  }
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/**
 * Provider event status'unu kanonik CallSessionStatus'a map'ler.
 */
function mapStatus(event: SantralWebhookEventType, raw?: string): CallSessionStatus {
  if (event === 'call.started') return CallSessionStatus.Ringing;
  if (event === 'call.answered') return CallSessionStatus.InProgress;
  if (event === 'call.ended') {
    switch (raw) {
      case 'no-answer': return CallSessionStatus.NoAnswer;
      case 'busy': return CallSessionStatus.Busy;
      case 'failed': return CallSessionStatus.Failed;
      case 'cancelled': return CallSessionStatus.Cancelled;
      default: return CallSessionStatus.Completed;
    }
  }
  // recording.ready event'i status değiştirmez
  return CallSessionStatus.Completed;
}

/**
 * Provider recording'i Storage'a kopyalar; başarısızlık durumunda null döner.
 * KVKK: byte log'a yazma. Hata olursa sadece error code dönüyor.
 */
async function copyRecordingToStorage(
  downloadUrl: string,
  callSessionId: string,
  mimeType: string | undefined,
): Promise<{ storagePath: string; sizeBytes: number } | null> {
  try {
    const res = await fetch(downloadUrl);
    if (!res.ok) return null;
    const arrBuf = await res.arrayBuffer();
    const sizeBytes = arrBuf.byteLength;
    const ext = mimeType?.includes('wav') ? 'wav' : mimeType?.includes('ogg') ? 'ogg' : 'mp3';
    const storagePath = `${RECORDING_PREFIX}/${callSessionId}/${Date.now()}.${ext}`;
    const bucket = getAdminBucket();
    const file = bucket.file(storagePath);
    await file.save(Buffer.from(arrBuf), {
      contentType: mimeType ?? 'audio/mpeg',
      resumable: false,
      metadata: {
        cacheControl: 'private, max-age=0, no-store',
      },
    });
    // KVKK: hiç bir noktada arrBuf veya bytes log'a yazılmıyor.
    return { storagePath: `gs://${bucket.name}/${storagePath}`, sizeBytes };
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  // 1) Raw body — HMAC için stringified body gerekli (NextRequest.json() body'i
  //    tüketir, bu yüzden önce text() çekip sonra parse ediyoruz).
  const rawBody = await req.text();
  if (!rawBody) {
    return NextResponse.json({ errorCode: 'EMPTY_BODY', message: 'Webhook body boş.' }, { status: 400 });
  }

  const providerId = req.headers.get('x-santral-provider') || '';
  const signature = req.headers.get('x-santral-signature') || '';
  const tsHeader = req.headers.get('x-santral-timestamp') || '';
  const ip = clientIpFromRequest(req);

  if (!providerId || !signature) {
    return NextResponse.json(
      { errorCode: 'MISSING_HEADERS', message: 'Provider/signature header eksik.' },
      { status: 401 },
    );
  }

  // 2) Replay protection: timestamp header ±5dk içinde olmalı.
  if (tsHeader) {
    const tsNum = Number(tsHeader);
    if (!Number.isFinite(tsNum) || Math.abs(Date.now() - tsNum) > REPLAY_WINDOW_MS) {
      return NextResponse.json(
        { errorCode: 'STALE_TIMESTAMP', message: 'Timestamp window dışı.' },
        { status: 401 },
      );
    }
  }

  // 3) Provider config + webhook secret oku.
  const db = getAdminFirestore();
  const providerSnap = await db.collection(SANTRAL_PROVIDERS).doc(providerId).get();
  if (!providerSnap.exists) {
    return NextResponse.json(
      { errorCode: 'UNKNOWN_PROVIDER', message: 'Provider bulunamadı.' },
      { status: 404 },
    );
  }
  const providerData = providerSnap.data() as { webhookSecret?: string; status?: string } | undefined;
  const secret = providerData?.webhookSecret;
  if (!secret) {
    return NextResponse.json(
      { errorCode: 'NO_SECRET', message: 'Provider webhook secret tanımsız.' },
      { status: 500 },
    );
  }

  // 4) HMAC doğrula — kritik.
  if (!verifySignature(rawBody, secret, signature)) {
    await logAuditEvent({
      actorUid: 'system',
      action: 'call.webhook.invalid_signature',
      resourceType: 'santralProviders',
      resourceId: providerId,
      ipAddress: ip,
      details: { reason: 'hmac_mismatch' },
    });
    return NextResponse.json(
      { errorCode: 'BAD_SIGNATURE', message: 'İmza doğrulanamadı.' },
      { status: 401 },
    );
  }

  // 5) Body parse.
  let body: WebhookBody;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ errorCode: 'BAD_JSON', message: 'Geçersiz JSON.' }, { status: 400 });
  }

  const event = body.event as SantralWebhookEventType | undefined;
  if (!event || !VALID_EVENTS.includes(event)) {
    return NextResponse.json({ errorCode: 'BAD_EVENT', message: 'event tipi geçersiz.' }, { status: 400 });
  }
  const providerCallId = body.providerCallId?.toString().trim();
  if (!providerCallId) {
    return NextResponse.json(
      { errorCode: 'MISSING_PROVIDER_CALL_ID', message: 'providerCallId zorunlu.' },
      { status: 400 },
    );
  }

  // 6) callSessions doc'u bul — önce body.callSessionId, sonra providerCallId ile.
  let sessionRef: FirebaseFirestore.DocumentReference | null = null;
  if (body.callSessionId) {
    const direct = await db.collection(CALL_SESSIONS).doc(body.callSessionId).get();
    if (direct.exists) sessionRef = direct.ref;
  }
  if (!sessionRef) {
    const q = await db
      .collection(CALL_SESSIONS)
      .where('providerCallId', '==', providerCallId)
      .limit(1)
      .get();
    if (!q.empty) sessionRef = q.docs[0].ref;
  }
  if (!sessionRef) {
    await logAuditEvent({
      actorUid: 'system',
      action: 'call.webhook.session_not_found',
      resourceType: 'callSessions',
      resourceId: null,
      ipAddress: ip,
      details: { providerCallId, event, providerId },
    });
    return NextResponse.json(
      { errorCode: 'SESSION_NOT_FOUND', message: 'Eşleşen call session bulunamadı.' },
      { status: 404 },
    );
  }

  // 7) Event'e göre callSessions doc'unu güncelle.
  const updates: Record<string, unknown> = {
    lastEventAt: FieldValue.serverTimestamp(),
    lastEventType: event,
  };

  if (event === 'call.started') {
    updates.status = mapStatus(event);
  } else if (event === 'call.answered') {
    updates.status = mapStatus(event);
    updates.answeredAt = FieldValue.serverTimestamp();
  } else if (event === 'call.ended') {
    updates.status = mapStatus(event, body.status);
    updates.endedAt = FieldValue.serverTimestamp();
    if (typeof body.duration === 'number' && body.duration >= 0) {
      updates.duration = Math.floor(body.duration);
    }
    if (typeof body.outcome === 'string') {
      updates.outcome = body.outcome.slice(0, 64);
    }
  } else if (event === 'recording.ready') {
    const rec = body.recording;
    if (!rec?.downloadUrl) {
      return NextResponse.json(
        { errorCode: 'MISSING_RECORDING_URL', message: 'recording.downloadUrl zorunlu.' },
        { status: 400 },
      );
    }
    const copy = await copyRecordingToStorage(rec.downloadUrl, sessionRef.id, rec.mimeType);
    if (!copy) {
      await logAuditEvent({
        actorUid: 'system',
        action: 'call.webhook.recording_copy_failed',
        resourceType: 'callSessions',
        resourceId: sessionRef.id,
        ipAddress: ip,
        details: {
          providerCallId,
          providerRecordingId: rec.providerRecordingId ?? null,
          mimeType: rec.mimeType ?? null,
        },
      });
      return NextResponse.json(
        { errorCode: 'RECORDING_COPY_FAILED', message: 'Recording kopyalanamadı.' },
        { status: 502 },
      );
    }
    // KVKK: storage path yazılır, signed URL/byte yazılmaz.
    updates.recordingStorageUrl = copy.storagePath;
    updates.recordingSizeBytes = copy.sizeBytes;
    updates.recordingReceivedAt = FieldValue.serverTimestamp();
    if (typeof rec.durationSeconds === 'number') {
      updates.recordingDurationSeconds = Math.floor(rec.durationSeconds);
    }
    if (typeof rec.mimeType === 'string') {
      updates.recordingMimeType = rec.mimeType.slice(0, 64);
    }
  }

  // Eğer event'in kendi timestamp'i varsa kayda da düşürelim (audit için).
  if (typeof body.timestamp === 'number') {
    updates.providerEventAt = Timestamp.fromMillis(body.timestamp);
  }

  await sessionRef.update(updates);

  // 8) Audit log — KVKK gereği her event log'a düşer.
  await logAuditEvent({
    actorUid: 'system',
    action: `call.webhook.${event}`,
    resourceType: 'callSessions',
    resourceId: sessionRef.id,
    ipAddress: ip,
    details: {
      providerId,
      providerCallId,
      event,
      mappedStatus: updates.status ?? null,
      outcome: body.outcome ?? null,
      duration: typeof body.duration === 'number' ? Math.floor(body.duration) : null,
      // KVKK: recording downloadUrl / byte / size YAZILMAZ.
      hasRecording: event === 'recording.ready',
    },
  });

  return NextResponse.json({ ok: true });
}
