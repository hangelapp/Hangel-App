/**
 * POST /api/ngo-admin/call-center/call-flow/audio
 *
 * Yönetici santral çağrı akışı için ses dosyası yükler (karşılama / IVR /
 * mesai-dışı / voicemail anonsu). Dosya Firebase Storage'a konur, public URL
 * döner. Bu URL callFlow'da saklanır; Asterisk sunucusundaki senkron script
 * (setup: santral-sync-audio) bu URL'leri indirip yerel sounds/ klasörüne koyar.
 *
 * Kabul: audio/wav, audio/mpeg (mp3), audio/x-wav. Maks 5 MB.
 * KVKK: yalnız caller'ın kendi ngoId'si altına yazılır.
 *
 * multipart/form-data: file=<ses>, slot=<greeting|closed|voicemail|ivr>
 * Yanıt: { url, storagePath }
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore, getAdminBucket } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = new Set(['audio/wav', 'audio/x-wav', 'audio/mpeg', 'audio/mp3']);
const SLOTS = new Set(['greeting', 'closed', 'voicemail', 'ivr']);

interface CallerContext { uid: string; ngoId: string; }

async function authorize(req: NextRequest): Promise<CallerContext | null> {
  const authHeader = req.headers.get('authorization') || '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!idToken) return null;
  try {
    const decoded = await getAdminAuth().verifyIdToken(idToken);
    const snap = await getAdminFirestore().collection(COLLECTIONS.users).doc(decoded.uid).get();
    if (!snap.exists) return null;
    const d = snap.data() as { role?: string; managedNgoId?: string };
    if (!d?.managedNgoId) return null;
    if (d.role !== 'ngo-admin' && d.role !== 'super-admin') return null;
    return { uid: decoded.uid, ngoId: d.managedNgoId };
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const ctx = await authorize(req);
  if (!ctx) return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'NGO admin yetkisi gerekli.' }, { status: 403 });

  let form: FormData;
  try { form = await req.formData(); } catch { return NextResponse.json({ errorCode: 'BAD_FORM', message: 'Geçersiz form.' }, { status: 400 }); }
  const file = form.get('file');
  const slot = String(form.get('slot') || '');
  if (!(file instanceof File)) return NextResponse.json({ errorCode: 'NO_FILE', message: 'Dosya bulunamadı.' }, { status: 400 });
  if (!SLOTS.has(slot)) return NextResponse.json({ errorCode: 'BAD_SLOT', message: 'Geçersiz slot.' }, { status: 400 });
  if (!ALLOWED.has(file.type)) return NextResponse.json({ errorCode: 'BAD_TYPE', message: 'Yalnız WAV veya MP3.' }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ errorCode: 'TOO_LARGE', message: 'Dosya 5 MB’dan büyük olamaz.' }, { status: 413 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = file.type.includes('mpeg') || file.type.includes('mp3') ? 'mp3' : 'wav';
  const stamp = Date.now();
  const storagePath = `santral/${ctx.ngoId}/audio/${slot}-${stamp}.${ext}`;
  const gcs = getAdminBucket().file(storagePath);
  await gcs.save(buffer, {
    contentType: file.type,
    metadata: { metadata: { ngoId: ctx.ngoId, slot, uploadedBy: ctx.uid } },
  });
  await gcs.makePublic();
  const url = gcs.publicUrl();

  return NextResponse.json({ url, storagePath, slot });
}
