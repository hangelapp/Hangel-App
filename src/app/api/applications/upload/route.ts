/**
 * Kurumsal kayıt (public, oturumsuz) sırasında logo + yasal belge yükleme.
 *
 * Kayıt anında kullanıcı çoğunlukla oturum açmamış olur ve kurumun henüz bir
 * ID'si yoktur; bu yüzden client-side Firebase Storage yüklemesi storage.rules
 * tarafından reddedilir. Bunun yerine dosyayı bu route'a gönderiyoruz; route
 * Admin SDK ile (kuralları by-pass ederek) bir taslak (draft) klasörüne yazar
 * ve indirilebilir bir URL döner. Başvuru onaylanınca bu URL entity doc'una
 * taşınır (createEntityFromApp app.logoUrl/documents okur).
 *
 * Güvenlik: public endpoint olduğu için
 *   - IP başına rate-limit (checkRateLimit),
 *   - katı boyut + MIME allowlist,
 *   - draftId sanitizasyonu (path traversal engeli)
 * uygulanır. Yüklenen dosya `applications/_drafts/{draftId}/...` altında durur;
 * terk edilen başvuruların dosyaları ileride lifecycle ile temizlenebilir.
 */
import { NextResponse } from 'next/server';
import { randomUUID, createHash } from 'crypto';
import { getAdminBucket } from '@/lib/firebase-admin';
import { checkRateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';

// Logical kind → izin verilen MIME + uzantı + maksimum boyut (byte).
const LOGO_MIME = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'];
const DOC_MIME = [...LOGO_MIME, 'application/pdf'];
const MAX_LOGO = 5 * 1024 * 1024;   // 5 MB
const MAX_DOC = 15 * 1024 * 1024;   // 15 MB

function isLogoKind(kind: string): boolean {
  return kind === 'logo' || kind === 'cover';
}

function sanitizeDraftId(id: string): string {
  return (id || '').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 64);
}

function sanitizeName(name: string): string {
  return (name || 'file').replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120);
}

function getClientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  return req.headers.get('x-real-ip') || 'unknown';
}

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const rl = await checkRateLimit({ bucket: 'applications-upload', key: ip, limit: 20, windowMs: 60_000 });
    if (!rl.allowed) {
      return NextResponse.json(
        { errorCode: 'rate_limited', message: 'Çok fazla yükleme denemesi. Lütfen biraz sonra tekrar deneyin.' },
        { status: 429 },
      );
    }

    let form: FormData;
    try {
      form = await req.formData();
    } catch {
      return NextResponse.json(
        { errorCode: 'invalid_body', message: 'Geçersiz istek gövdesi.' },
        { status: 400 },
      );
    }

    const file = form.get('file');
    const kindRaw = (form.get('kind') as string) || 'document';
    const draftId = sanitizeDraftId((form.get('draftId') as string) || '');

    if (!(file instanceof File)) {
      return NextResponse.json(
        { errorCode: 'no_file', message: 'Dosya bulunamadı.' },
        { status: 400 },
      );
    }
    if (!draftId) {
      return NextResponse.json(
        { errorCode: 'no_draft', message: 'Taslak kimliği eksik.' },
        { status: 400 },
      );
    }

    const kind = kindRaw.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 40) || 'document';
    const isLogo = isLogoKind(kind);
    const allowedMime = isLogo ? LOGO_MIME : DOC_MIME;
    const maxSize = isLogo ? MAX_LOGO : MAX_DOC;

    if (file.size === 0) {
      return NextResponse.json({ errorCode: 'empty_file', message: 'Boş dosya.' }, { status: 400 });
    }
    if (file.size > maxSize) {
      return NextResponse.json(
        { errorCode: 'file_too_large', message: `Dosya çok büyük (en fazla ${Math.round(maxSize / 1024 / 1024)} MB).` },
        { status: 400 },
      );
    }
    if (file.type && !allowedMime.includes(file.type)) {
      return NextResponse.json(
        { errorCode: 'unsupported_type', message: 'Desteklenmeyen dosya türü.' },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const safeName = sanitizeName(file.name);
    const token = randomUUID();
    const objectPath = `applications/_drafts/${draftId}/${kind}-${createHash('sha1').update(buffer).digest('hex').slice(0, 8)}-${safeName}`;

    const bucket = getAdminBucket();
    const gcsFile = bucket.file(objectPath);
    await gcsFile.save(buffer, {
      resumable: false,
      contentType: file.type || 'application/octet-stream',
      metadata: {
        // Firebase indirilebilir URL token'ı — bu token'la URL kurallardan bağımsız okunur.
        metadata: { firebaseStorageDownloadTokens: token },
      },
    });

    const encodedPath = encodeURIComponent(objectPath);
    const url = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodedPath}?alt=media&token=${token}`;

    return NextResponse.json({ url, kind, name: safeName, size: file.size });
  } catch (err) {
    console.error('[api/applications/upload] failed', err);
    return NextResponse.json(
      { errorCode: 'upload_failed', message: 'Yükleme başarısız oldu. Lütfen tekrar deneyin.' },
      { status: 500 },
    );
  }
}
