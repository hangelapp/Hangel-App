/**
 * APNs HTTP/2 push helper — Live Activity güncellemeleri için.
 *
 * FCM şu an Live Activity push'unu desteklemiyor (`apns-push-type: liveactivity`
 * header'ı yok). Bu yüzden Apple APNs'e doğrudan HTTP/2 POST atıyoruz.
 *
 * Env değişkenleri (apphosting.yaml'da secret olarak tanımlı olmalı):
 *  - APNS_KEY_ID       — 10 karakter, örn. `9U82ZQY23S`
 *  - APNS_TEAM_ID      — `NKZNY8NU8S`
 *  - APNS_PRIVATE_KEY  — .p8 dosyasının PEM içeriği (base64 değil, ham metin)
 *
 * Kullanım:
 *   await sendLiveActivityUpdate({
 *     pushToken: '...hex...',
 *     event: 'update',
 *     contentState: { distance: '1.2 km', matchedDonors: 2 },
 *     alertTitle: 'Acil Kan Güncelleme',
 *     alertBody: 'Yeni bir donör yola çıktı',
 *   });
 */

import { sign } from 'jsonwebtoken';

const APNS_HOST = process.env.APNS_HOST ?? 'api.push.apple.com';

let cachedToken: { jwt: string; expiresAt: number } | null = null;

function getApnsJwt(): string {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt > now + 60_000) return cachedToken.jwt;

  const keyId = process.env.APNS_KEY_ID;
  const teamId = process.env.APNS_TEAM_ID;
  const privateKey = process.env.APNS_PRIVATE_KEY;
  if (!keyId || !teamId || !privateKey) {
    throw new Error('APNS_KEY_ID / APNS_TEAM_ID / APNS_PRIVATE_KEY env değişkenleri eksik.');
  }

  // APNs JWT 1 saat geçerli; iyimser 55 dk cache.
  const jwt = sign({}, privateKey, {
    algorithm: 'ES256',
    header: { alg: 'ES256', kid: keyId },
    issuer: teamId,
    expiresIn: '55m',
  });
  cachedToken = { jwt, expiresAt: now + 55 * 60 * 1000 };
  return jwt;
}

export interface SendLiveActivityUpdateInput {
  pushToken: string;
  event: 'update' | 'end';
  contentState: Record<string, unknown>;
  alertTitle?: string;
  alertBody?: string;
  staleDate?: Date;             // contentState'in "eski" sayılacağı an
  dismissalDate?: Date;          // event:'end' için Live Activity'nin tamamen kalkma anı
  bundleId?: string;             // Default: com.hangel.ios.app
}

export interface SendLiveActivityUpdateResult {
  ok: boolean;
  status: number;
  apnsId?: string;
  errorReason?: string;
}

export async function sendLiveActivityUpdate(input: SendLiveActivityUpdateInput): Promise<SendLiveActivityUpdateResult> {
  const bundleId = input.bundleId ?? 'com.hangel.ios.app';
  const topic = `${bundleId}.push-type.liveactivity`;

  const payload: Record<string, unknown> = {
    aps: {
      timestamp: Math.floor(Date.now() / 1000),
      event: input.event,
      'content-state': input.contentState,
      ...(input.staleDate ? { 'stale-date': Math.floor(input.staleDate.getTime() / 1000) } : {}),
      ...(input.dismissalDate ? { 'dismissal-date': Math.floor(input.dismissalDate.getTime() / 1000) } : {}),
      ...(input.alertTitle || input.alertBody ? {
        alert: {
          ...(input.alertTitle ? { title: input.alertTitle } : {}),
          ...(input.alertBody ? { body: input.alertBody } : {}),
        },
      } : {}),
    },
  };

  let jwt: string;
  try { jwt = getApnsJwt(); } catch (e) {
    return { ok: false, status: 0, errorReason: e instanceof Error ? e.message : 'JWT_FAILED' };
  }

  const url = `https://${APNS_HOST}/3/device/${input.pushToken}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      authorization: `bearer ${jwt}`,
      'apns-topic': topic,
      'apns-push-type': 'liveactivity',
      'apns-priority': '10',
      'content-type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const apnsId = res.headers.get('apns-id') ?? undefined;
  if (res.ok) return { ok: true, status: res.status, apnsId };

  let errorReason: string | undefined;
  try {
    const text = await res.text();
    try { errorReason = (JSON.parse(text) as { reason?: string }).reason; }
    catch { errorReason = text.slice(0, 200); }
  } catch { /* sessiz */ }

  return { ok: false, status: res.status, apnsId, errorReason };
}
