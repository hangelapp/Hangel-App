/**
 * NGO admin auth helper for volunteering API routes.
 *
 * Wraps src/lib/messaging/server-auth.ts → requireNgoAdmin so route handlers
 * get the project-standard `{ errorCode, error }` response shape (CLAUDE.md).
 *
 * Usage:
 *   const auth = await requireNgoAdminForRoute(req);
 *   if ('error' in auth) return auth.error;
 *   const { uid, ngoId, isSuperAdmin } = auth.actor;
 *
 * Auth chain:
 *   1. Bearer ID token verify (Firebase Admin Auth)
 *   2. Super-admin custom claim → tam yetki (targetNgoId opsiyonel)
 *   3. users/{uid}.role == 'ngo-admin' && users/{uid}.managedNgoId set
 *
 * Hata kodları (NextResponse, status):
 *   NO_AUTH            401  → Authorization header yok
 *   INVALID_TOKEN      401  → Bearer doğrulanamadı
 *   NOT_NGO_ADMIN      403  → user.role !== 'ngo-admin' veya managedNgoId yok
 *   TARGET_NGO_REQUIRED 400 → super-admin için targetNgoId verilmedi
 */
import { NextResponse } from 'next/server';

import { requireNgoAdmin, type NgoAdminContext } from '@/lib/messaging/server-auth';

export type { NgoAdminContext };

export async function requireNgoAdminForRoute(
  req: Request,
  options?: { allowSuperAdmin?: boolean; targetNgoId?: string; requireNgoId?: boolean },
): Promise<{ error: NextResponse; actor?: undefined } | { actor: NgoAdminContext; error?: undefined }> {
  // Bu wrapper'ı SADECE volunteering/events/evaluations/completions rotaları
  // kullanır; hepsi super-admin'i ownership'ten `!actor.isSuperAdmin && ...` ile
  // muaf tutar ve ngoId'yi doküman anahtarı olarak KULLANMAZ. Bu yüzden super-admin
  // için boş ngoId güvenlidir → requireNgoId varsayılanı false. (Aksi halde
  // super-admin'in managedNgoId'si null olduğundan onay/liste rotaları 400 verirdi.)
  const result = await requireNgoAdmin(req, { requireNgoId: false, ...options });
  if ('actor' in result && result.actor) {
    return { actor: result.actor };
  }

  // requireNgoAdmin döner: { error: NextResponse({ error: string }, { status }) }
  // hangel kuralı: { errorCode, error } shape. Mesajı errorCode'a map'le.
  let status = 500;
  let message = 'Internal error';
  try {
    const resp = result.error as NextResponse;
    status = resp.status;
    const body = (await resp.json()) as { error?: string };
    message = body?.error ?? message;
  } catch {
    // fallback — original response zaten 4xx döndü, status varsayılan kalsın
  }

  const errorCode = mapMessageToCode(status, message);
  return {
    error: NextResponse.json({ errorCode, error: message }, { status }),
  };
}

function mapMessageToCode(status: number, message: string): string {
  if (status === 401) {
    if (message.toLowerCase().includes('token gerekli')) return 'NO_AUTH';
    return 'INVALID_TOKEN';
  }
  if (status === 403) return 'NOT_NGO_ADMIN';
  if (status === 400) return 'TARGET_NGO_REQUIRED';
  return 'AUTH_FAILED';
}
