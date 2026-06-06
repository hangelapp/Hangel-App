/**
 * POST /api/contacts/sync
 *
 * Privacy-preserving rehber eşleştirme: client SHA-256 hash'lenmiş
 * telefon numaralarını ve/veya e-posta adreslerini gönderir, server Hangel
 * users tablosunda personalInfo.phoneHash ve personalInfo.email field'ları
 * ile eşleştirir.
 *
 * Body: { hashes?: string[]; emails?: string[] }
 * Response: {
 *   matches: Array<{ hash: string; userId: string; name?: string; avatarUrl?: string }>,
 *   emailMatches: Array<{ email: string; userId: string; name?: string; avatarUrl?: string }>
 * }
 *
 * Auth: Bearer.
 * Privacy: raw telefon hiç sunucuya ulaşmaz; sunucu sadece eşleşme
 * sonucunu döner, hash'leri saklamaz. E-posta eşleştirme STK davet
 * akışında (Gmail/vCard kişileri) kullanıldığından e-posta düz metin gelir.
 *
 * NOT: users docs'da personalInfo.phoneHash field'ı yoksa hesap kayıt
 * sırasında set edilmeli (verify-otp + verify-link route'larında).
 * Geriye dönük backfill için ayrı script: scripts/backfill-phone-hashes.ts
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';

export const runtime = 'nodejs';

const MAX_HASHES_PER_REQUEST = 500;
const MAX_EMAILS_PER_REQUEST = 500;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest): Promise<NextResponse> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ errorCode: 'NO_AUTH' }, { status: 401 });
  }
  try {
    await getAdminAuth().verifyIdToken(authHeader.slice('Bearer '.length).trim());
  } catch {
    return NextResponse.json({ errorCode: 'INVALID_TOKEN' }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => null);
    const rawHashes: unknown[] = Array.isArray(body?.hashes) ? body.hashes : [];
    const rawEmails: unknown[] = Array.isArray(body?.emails) ? body.emails : [];
    if (!Array.isArray(body?.hashes) && !Array.isArray(body?.emails)) {
      return NextResponse.json({ errorCode: 'INVALID_INPUT', message: 'hashes veya emails array gerekli.' }, { status: 400 });
    }
    const hashes: string[] = Array.from(new Set(rawHashes
      .filter((h: unknown): h is string => typeof h === 'string' && /^[a-f0-9]{64}$/.test(h))))
      .slice(0, MAX_HASHES_PER_REQUEST);
    const emails: string[] = Array.from(new Set(rawEmails
      .filter((e: unknown): e is string => typeof e === 'string')
      .map((e: string) => e.trim().toLowerCase())
      .filter((e: string) => EMAIL_RE.test(e))))
      .slice(0, MAX_EMAILS_PER_REQUEST);

    if (hashes.length === 0 && emails.length === 0) {
      return NextResponse.json({ ok: true, matches: [], emailMatches: [] });
    }

    const db = getAdminFirestore();
    // Firestore 'in' query 10 limit — 10'arlı batch
    const matches: Array<{ hash: string; userId: string; name?: string; avatarUrl?: string }> = [];
    for (let i = 0; i < hashes.length; i += 10) {
      const slice = hashes.slice(i, i + 10);
      const snap = await db.collection(COLLECTIONS.users)
        .where('personalInfo.phoneHash', 'in', slice)
        .select('name', 'avatarUrl', 'personalInfo')
        .get();
      snap.docs.forEach((d) => {
        const data = d.data() as { name?: string; avatarUrl?: string; personalInfo?: { phoneHash?: string } };
        if (data.personalInfo?.phoneHash) {
          matches.push({
            hash: data.personalInfo.phoneHash,
            userId: d.id,
            name: data.name,
            avatarUrl: data.avatarUrl,
          });
        }
      });
    }

    // E-posta eşleştirme (Gmail / vCard kişileri için) — personalInfo.email
    const emailMatches: Array<{ email: string; userId: string; name?: string; avatarUrl?: string }> = [];
    for (let i = 0; i < emails.length; i += 10) {
      const slice = emails.slice(i, i + 10);
      const snap = await db.collection(COLLECTIONS.users)
        .where('personalInfo.email', 'in', slice)
        .select('name', 'avatarUrl', 'personalInfo')
        .get();
      snap.docs.forEach((d) => {
        const data = d.data() as { name?: string; avatarUrl?: string; personalInfo?: { email?: string } };
        const em = (data.personalInfo?.email || '').trim().toLowerCase();
        if (em) {
          emailMatches.push({ email: em, userId: d.id, name: data.name, avatarUrl: data.avatarUrl });
        }
      });
    }

    return NextResponse.json({ ok: true, matches, emailMatches });
  } catch (e) {
    console.error('[contacts/sync] error', e);
    return NextResponse.json({
      errorCode: 'INTERNAL_ERROR',
      message: e instanceof Error ? e.message : 'Bilinmeyen hata.',
    }, { status: 500 });
  }
}
