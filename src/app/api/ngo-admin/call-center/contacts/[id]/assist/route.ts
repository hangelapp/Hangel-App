/**
 * POST /api/ngo-admin/call-center/contacts/[id]/assist
 *
 * Konuşma anında AI asistanı. Kişinin bağlamından (aşama, son sonuç, son notlar)
 * Gemini ile açılış cümlesi + konuşma ipuçları + itiraz-yanıt önerileri üretir.
 * Body: { goal?: 'bağış'|'gönüllü'|'etkinlik'|'bilgilendirme' }
 *
 * KVKK: yalnız caller'ın kendi tenant'ı.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';
import { getStage } from '@/lib/santral/pipeline';
import { generateCallAssist } from '@/ai/flows/call-assist-flow';
import { AIQuotaExceededError } from '@/ai/flow-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CALL_SESSIONS = 'callSessions';
const DISPOSITION_LABEL: Record<string, string> = {
  answered: 'Görüşüldü', 'no-answer': 'Cevapsız', busy: 'Meşgul', rejected: 'Reddetti',
  voicemail: 'Sesli mesaj', 'wrong-number': 'Yanlış numara', 'callback-requested': 'Geri ara',
};

interface Ctx { uid: string; ngoId: string; }

async function authorize(req: NextRequest): Promise<Ctx | null> {
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

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await authorize(req);
  if (!ctx) return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'Yetki gerekli.' }, { status: 403 });

  const { id } = await params;
  if (!id) return NextResponse.json({ errorCode: 'BAD_INPUT', message: 'Kişi kimliği eksik.' }, { status: 400 });

  let body: { goal?: unknown };
  try { body = await req.json(); } catch { body = {}; }
  const goal = typeof body.goal === 'string' ? body.goal : 'bağış';

  const db = getAdminFirestore();
  const contactSnap = await db.collection(COLLECTIONS.santralContacts).doc(id).get();
  if (!contactSnap.exists) return NextResponse.json({ errorCode: 'NOT_FOUND', message: 'Kişi bulunamadı.' }, { status: 404 });
  const contact = contactSnap.data() as { ngoId?: string; name?: string; stage?: string; lastDisposition?: string };
  if (contact.ngoId !== ctx.ngoId) return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'Bu kişiye erişim yetkiniz yok.' }, { status: 403 });

  // STK adı.
  let ngoName = 'Kuruluşumuz';
  const ngoSnap = await db.collection(COLLECTIONS.ngos).doc(ctx.ngoId).get().catch(() => null);
  const nn = ngoSnap?.data() as { name?: string } | undefined;
  if (nn?.name) ngoName = nn.name;

  // Son notlar (en yeni oturumdan birkaç not).
  const noteBlocks: string[] = [];
  const sessionsSnap = await db.collection(CALL_SESSIONS)
    .where('ngoId', '==', ctx.ngoId).where('contactId', '==', id)
    .orderBy('createdAt', 'desc').limit(5).get().catch(() => null);
  if (sessionsSnap) for (const s of sessionsSnap.docs) {
    const sd = s.data() as { outcomeNotes?: string };
    if (typeof sd.outcomeNotes === 'string' && sd.outcomeNotes.trim()) noteBlocks.push(sd.outcomeNotes.trim());
    const notesSnap = await s.ref.collection('notes').orderBy('timestamp', 'desc').limit(3).get().catch(() => null);
    if (notesSnap) for (const n of notesSnap.docs) {
      const t = (n.data() as { text?: string }).text;
      if (typeof t === 'string' && t.trim()) noteBlocks.push(t.trim());
    }
  }

  const authHeader = req.headers.get('authorization') ?? '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';

  try {
    const result = await generateCallAssist(
      {
        ngoName,
        contactName: contact.name || '',
        stageLabel: getStage(contact.stage).label,
        lastDisposition: contact.lastDisposition ? (DISPOSITION_LABEL[contact.lastDisposition] || contact.lastDisposition) : '—',
        recentNotes: noteBlocks.slice(0, 8).join('\n---\n') || '(Not yok.)',
        goal,
      },
      idToken,
    );
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    if (err instanceof AIQuotaExceededError) {
      return NextResponse.json({ errorCode: 'QUOTA_EXCEEDED', message: 'Günlük AI asistan kotanız doldu.' }, { status: 429 });
    }
    const msg = err instanceof Error ? err.message : 'AI asistan üretilemedi.';
    return NextResponse.json({ errorCode: 'AI_ERROR', message: msg }, { status: 500 });
  }
}
