/**
 * POST /api/ngo-admin/call-center/sessions/[id]/transcribe
 *
 * Bir çağrı oturumunun SES kaydından (recordingStorageUrl) Gemini ile döküm +
 * özet üretir ve callSessions/{id}'ye yazar (bir daha üretmemek için cache).
 * Ayrı transkripsiyon servisi gerekmez (Gemini multimodal).
 *
 * Yanıt: { ok: true, transcript, summary, sentiment, cached? }
 * KVKK: kayıt yalnız STK'nın kendi tenant'ına ait olduğunda işlenir; ses byte'ı
 * kalıcı tutulmaz (yalnız Gemini'ye anlık gönderilir), üretilen metin saklanır.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore, getAdminBucket } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { COLLECTIONS } from '@/firebase/collections';
import { transcribeCall } from '@/ai/flows/call-transcribe-flow';
import { AIQuotaExceededError } from '@/ai/flow-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CALL_SESSIONS = 'callSessions';
const MAX_BYTES = 25 * 1024 * 1024; // 25MB — makul çağrı kaydı üst sınırı

interface Ctx { uid: string; ngoId: string; }

async function authorize(req: NextRequest): Promise<Ctx | null> {
  const authHeader = req.headers.get('authorization') || '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!idToken) return null;
  try {
    const decoded = await getAdminAuth().verifyIdToken(idToken);
    const snap = await getAdminFirestore().collection(COLLECTIONS.users).doc(decoded.uid).get();
    if (!snap.exists) return null;
    const d = snap.data() as { role?: string; managedNgoId?: string; managedBrandId?: string; managedClubId?: string };
    if (!d) return null;
    if (d.role !== 'ngo-admin' && d.role !== 'super-admin') return null;
    const isSuper = d.role === 'super-admin';
    // Aktif kurum: üst switcher x-org-id + x-org-kind header'ıyla gelir (çoklu
    // kurum/tür yöneten kullanıcı için kritik). Caller o kuruma üyeyse ya da
    // super-admin ise header'daki kurum kullanılır; yoksa yönettiği ilk kuruma düşer.
    const hdrKindRaw = req.headers.get('x-org-kind');
    const hdrKind = (hdrKindRaw === 'ngo' || hdrKindRaw === 'brand' || hdrKindRaw === 'club') ? hdrKindRaw : undefined;
    const hdrOrgId = (req.headers.get('x-org-id') || '').trim() || undefined;

    let activeOrgId: string;
    if (hdrOrgId && hdrKind) {
      const isMember =
        (hdrKind === 'ngo' && d.managedNgoId === hdrOrgId) ||
        (hdrKind === 'brand' && d.managedBrandId === hdrOrgId) ||
        (hdrKind === 'club' && d.managedClubId === hdrOrgId);
      if (!isSuper && !isMember) return null;
      activeOrgId = hdrOrgId;
    } else {
      activeOrgId = d.managedNgoId || d.managedBrandId || d.managedClubId || '';
    }
    if (!activeOrgId) return null;
    return { uid: decoded.uid, ngoId: activeOrgId };
  } catch {
    return null;
  }
}

/** Public Storage URL → bucket içi path (santral/...) çıkar. */
function storagePathFromUrl(url: string): string | null {
  try {
    // https://storage.googleapis.com/<bucket>/<path> veya .../o/<encodedPath>
    const u = new URL(url);
    const parts = u.pathname.split('/').filter(Boolean);
    const oIdx = parts.indexOf('o');
    if (oIdx >= 0 && parts[oIdx + 1]) return decodeURIComponent(parts[oIdx + 1]);
    // storage.googleapis.com/<bucket>/<path...>
    if (parts.length >= 2) return decodeURIComponent(parts.slice(1).join('/'));
    return null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await authorize(req);
  if (!ctx) return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'Yetki gerekli.' }, { status: 403 });

  const { id } = await params;
  if (!id) return NextResponse.json({ errorCode: 'BAD_INPUT', message: 'Oturum kimliği eksik.' }, { status: 400 });

  const db = getAdminFirestore();
  const ref = db.collection(CALL_SESSIONS).doc(id);
  const snap = await ref.get();
  if (!snap.exists) return NextResponse.json({ errorCode: 'NOT_FOUND', message: 'Oturum bulunamadı.' }, { status: 404 });
  const data = snap.data() as { ngoId?: string; recordingStorageUrl?: string; transcript?: string; transcriptSummary?: string; transcriptSentiment?: string };
  if (data.ngoId !== ctx.ngoId) return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'Bu oturuma erişim yetkiniz yok.' }, { status: 403 });

  // Zaten üretilmişse tekrar model çağırma.
  if (typeof data.transcript === 'string' && data.transcript.trim()) {
    return NextResponse.json({
      ok: true, cached: true,
      transcript: data.transcript,
      summary: data.transcriptSummary ?? '',
      sentiment: data.transcriptSentiment ?? 'nötr',
    });
  }

  const recUrl = data.recordingStorageUrl;
  if (!recUrl) return NextResponse.json({ errorCode: 'NO_RECORDING', message: 'Bu çağrının ses kaydı yok.' }, { status: 400 });

  const path = storagePathFromUrl(recUrl);
  if (!path) return NextResponse.json({ errorCode: 'BAD_RECORDING', message: 'Kayıt konumu çözümlenemedi.' }, { status: 400 });

  // Ses dosyasını indir.
  let buffer: Buffer;
  let contentType = 'audio/wav';
  try {
    const file = getAdminBucket().file(path);
    const [meta] = await file.getMetadata().catch(() => [{}] as [Record<string, unknown>]);
    if (meta && typeof (meta as { contentType?: string }).contentType === 'string') {
      contentType = (meta as { contentType: string }).contentType;
    }
    const [buf] = await file.download();
    buffer = buf;
  } catch {
    return NextResponse.json({ errorCode: 'DOWNLOAD_FAILED', message: 'Kayıt indirilemedi.' }, { status: 500 });
  }
  if (buffer.length > MAX_BYTES) {
    return NextResponse.json({ errorCode: 'TOO_LARGE', message: 'Kayıt çok büyük (25MB üstü).' }, { status: 413 });
  }

  const dataUrl = `data:${contentType};base64,${buffer.toString('base64')}`;
  const authHeader = req.headers.get('authorization') ?? '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';

  try {
    const out = await transcribeCall(dataUrl, contentType, idToken);
    // Sonucu sakla (metin; ses byte'ı saklanmaz).
    await ref.set({
      transcript: out.transcript,
      transcriptSummary: out.summary,
      transcriptSentiment: out.sentiment,
      transcribedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    return NextResponse.json({ ok: true, transcript: out.transcript, summary: out.summary, sentiment: out.sentiment });
  } catch (err) {
    if (err instanceof AIQuotaExceededError) {
      return NextResponse.json({ errorCode: 'QUOTA_EXCEEDED', message: 'Günlük sesli özet kotanız doldu (10/gün).' }, { status: 429 });
    }
    const msg = err instanceof Error ? err.message : 'Döküm üretilemedi.';
    return NextResponse.json({ errorCode: 'AI_ERROR', message: msg }, { status: 500 });
  }
}
