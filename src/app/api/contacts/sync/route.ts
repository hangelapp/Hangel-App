/**
 * POST /api/contacts/sync
 *
 * Privacy-preserving rehber eşleştirme: client SHA-256 hash'lenmiş
 * telefon numaralarını gönderir, server Hangel users tablosunda
 * personalInfo.phoneHash field'ı ile eşleştirir.
 *
 * Body: { hashes: string[] }
 * Response: { matches: Array<{ hash: string; userId: string; name?: string; avatarUrl?: string }> }
 *
 * Auth: Bearer.
 * Privacy: raw telefon hiç sunucuya ulaşmaz; sunucu sadece eşleşme
 * sonucunu döner, hash'leri saklamaz.
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
    const rawHashes = Array.isArray(body?.hashes) ? body.hashes : null;
    if (!rawHashes) {
      return NextResponse.json({ errorCode: 'INVALID_INPUT', message: 'hashes array gerekli.' }, { status: 400 });
    }
    const hashes: string[] = rawHashes
      .filter((h: unknown): h is string => typeof h === 'string' && /^[a-f0-9]{64}$/.test(h))
      .slice(0, MAX_HASHES_PER_REQUEST);

    if (hashes.length === 0) {
      return NextResponse.json({ ok: true, matches: [] });
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

    return NextResponse.json({ ok: true, matches });
  } catch (e) {
    console.error('[contacts/sync] error', e);
    return NextResponse.json({
      errorCode: 'INTERNAL_ERROR',
      message: e instanceof Error ? e.message : 'Bilinmeyen hata.',
    }, { status: 500 });
  }
}
