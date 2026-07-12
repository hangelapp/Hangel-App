/**
 * POST /api/santral/voicemail-upload
 *
 * Asterisk geçidi, gelen çağrıda kaydedilen SESLİ MESAJI (WAV) buraya yükler.
 * Dosya Storage'a konur ve callSessions'a bir kayıt (recordingStorageUrl +
 * isVoicemail) olarak yazılır → recordings/ sayfasındaki audio player'da
 * otomatik görünür/dinlenir (mevcut altyapı yeniden kullanılır).
 *
 * Auth: Bearer <SANTRAL_GATEWAY_SECRET> (gateway-only).
 * multipart/form-data: file=<wav>, callerNumber, calledNumber(DID), ngoId?
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore, getAdminBucket } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const NUMBER_POOL = 'santralNumberPool';
const NGO_CALL_CENTER = 'ngoCallCenter';
const CALL_SESSIONS = 'callSessions';
const CONTACTS = 'santralContacts';
const MAX_BYTES = 15 * 1024 * 1024;

function digitsOnly(raw: string): string { return String(raw || '').replace(/\D/g, ''); }

async function resolveNgoId(db: FirebaseFirestore.Firestore, calledNumber: string): Promise<string | null> {
  const want = digitsOnly(calledNumber);
  if (!want) return null;
  for (const field of ['e164', 'number']) {
    const s = await db.collection(NUMBER_POOL).where(field, '==', calledNumber).limit(1).get().catch(() => null);
    if (s && !s.empty) { const n = (s.docs[0].data() as { assignedToNgoId?: string }).assignedToNgoId; if (n) return n; }
  }
  const cc = await db.collection(NGO_CALL_CENTER).where('callerIdNumber', '==', calledNumber).limit(1).get().catch(() => null);
  if (cc && !cc.empty) return cc.docs[0].id;
  return null;
}

export async function POST(req: NextRequest) {
  const secret = process.env.SANTRAL_GATEWAY_SECRET || '';
  const auth = req.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  if (!secret || token !== secret) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  let form: FormData;
  try { form = await req.formData(); } catch { return NextResponse.json({ error: 'bad_form' }, { status: 400 }); }
  const file = form.get('file');
  const callerNumber = String(form.get('callerNumber') || '');
  const calledNumber = String(form.get('calledNumber') || '');
  const ngoIdIn = String(form.get('ngoId') || '');
  if (!(file instanceof File)) return NextResponse.json({ error: 'no_file' }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: 'too_large' }, { status: 413 });

  const db = getAdminFirestore();
  const ngoId = ngoIdIn || (await resolveNgoId(db, calledNumber));
  if (!ngoId) return NextResponse.json({ skipped: 'ngo-not-resolved' });

  const buffer = Buffer.from(await file.arrayBuffer());
  const stamp = Date.now();
  const storagePath = `santral/${ngoId}/voicemail/${stamp}.wav`;
  const gcs = getAdminBucket().file(storagePath);
  await gcs.save(buffer, { contentType: 'audio/wav', metadata: { metadata: { ngoId, callerNumber, kind: 'voicemail' } } });
  await gcs.makePublic();
  const url = gcs.publicUrl();

  // Arayanı rehberde eşle (varsa ad göstermek için).
  let contactId: string | null = null;
  let contactName: string | null = null;
  const wantCaller = digitsOnly(callerNumber);
  if (wantCaller) {
    const snap = await db.collection(CONTACTS).where('ngoId', '==', ngoId).get().catch(() => null);
    if (snap) for (const d of snap.docs) {
      if (digitsOnly((d.data() as { phone?: string }).phone || '') === wantCaller) {
        contactId = d.id; contactName = (d.data() as { name?: string }).name || null; break;
      }
    }
  }

  await db.collection(CALL_SESSIONS).add({
    ngoId,
    contactId,
    contactName,
    callerNumber,
    direction: 'inbound',
    disposition: 'voicemail',
    isVoicemail: true,
    missed: true,
    recordingStorageUrl: url,
    startedAt: FieldValue.serverTimestamp(),
    createdAt: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({ ok: true, url });
}
