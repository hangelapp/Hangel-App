/**
 * POST /api/auth/qr-login/create — QR ile masaüstü girişi başlat.
 *
 * Masaüstü (giriş yapılmamış) bir oturum token'ı üretir; QR olarak gösterilir.
 * Telefondaki giriş yapmış kullanıcı QR'ı okutup /qr-login/{token} sayfasından
 * onaylar; masaüstü status endpoint'inden custom token alıp giriş yapar.
 *
 * Kimlik gerektirmez (token gizli ve tek kullanımlık, 5 dk TTL).
 */
import { NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { COLLECTIONS } from '@/firebase/collections';
import { randomBytes } from 'crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TTL_MS = 5 * 60 * 1000;

// Kamerasız cihazlar için insan-okur kısa kod: karışan karakterler (0/O/1/I) yok.
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
function shortCode(len = 6): string {
  const b = randomBytes(len);
  let s = '';
  for (let i = 0; i < len; i++) s += CODE_ALPHABET[b[i] % CODE_ALPHABET.length];
  return s;
}

export async function POST() {
  const token = randomBytes(24).toString('hex');
  const code = shortCode(6);
  await getAdminFirestore().collection(COLLECTIONS.qrLogins).doc(token).set({
    status: 'pending',
    code, // QR okutulamayan cihaz bu kodu girerek onaylatır
    createdAt: FieldValue.serverTimestamp(),
    expiresAtMs: Date.now() + TTL_MS,
  });
  return NextResponse.json({ token, code, ttlMs: TTL_MS });
}
