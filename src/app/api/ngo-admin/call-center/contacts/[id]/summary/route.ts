/**
 * POST /api/ngo-admin/call-center/contacts/[id]/summary
 *
 * Bir kişinin görüşme geçmişinden (notlar + çağrı sonuçları + etiketler) Gemini
 * ile kısa AI özeti üretir: özet + önerilen sonraki adım + görüşme havası.
 * Ses işlenmez — yalnız mevcut metin verisi kullanılır (KVKK güvenli, düşük maliyet).
 *
 * Yanıt: { ok: true, summary, nextStep, sentiment }
 * KVKK: yalnız caller'ın kendi tenant'ı; kişi başka STK'ya aitse 403.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';
import { generateCallSummary } from '@/ai/flows/call-summary-flow';
import { AIQuotaExceededError } from '@/ai/flow-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CALL_SESSIONS = 'callSessions';
const NOTES_SUBCOLLECTION = 'notes';

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
    const d = snap.data() as { role?: string; managedNgoId?: string; managedBrandId?: string; managedClubId?: string };
    if (!d) return null;
    if (d.role !== 'ngo-admin' && d.role !== 'super-admin') return null;
    const isSuperAdmin = d.role === 'super-admin';
    // Aktif kurum: üst switcher x-org-id + x-org-kind header'ıyla gelir (çoklu
    // kurum yöneten kullanıcı için kritik). Caller o kuruma üyeyse ya da
    // super-admin ise header'daki kurum kullanılır; yoksa managedNgoId →
    // managedBrandId → managedClubId ilk dolu olana düşer.
    const hdrKindRaw = req.headers.get('x-org-kind');
    const hdrKind = (hdrKindRaw === 'ngo' || hdrKindRaw === 'brand' || hdrKindRaw === 'club') ? hdrKindRaw : undefined;
    const hdrOrgId = req.headers.get('x-org-id') || undefined;

    let activeOrgId: string;
    if (hdrOrgId && hdrKind) {
      const isMember = (hdrKind === 'ngo' && d.managedNgoId === hdrOrgId)
        || (hdrKind === 'brand' && d.managedBrandId === hdrOrgId)
        || (hdrKind === 'club' && d.managedClubId === hdrOrgId);
      if (!isMember && !isSuperAdmin) return null;
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

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await authorize(req);
  if (!ctx) return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'Yetki gerekli.' }, { status: 403 });

  const { id } = await params;
  if (!id) return NextResponse.json({ errorCode: 'BAD_INPUT', message: 'Kişi kimliği eksik.' }, { status: 400 });

  const db = getAdminFirestore();
  const contactSnap = await db.collection(COLLECTIONS.santralContacts).doc(id).get();
  if (!contactSnap.exists) return NextResponse.json({ errorCode: 'NOT_FOUND', message: 'Kişi bulunamadı.' }, { status: 404 });
  const contact = contactSnap.data() as { ngoId?: string; name?: string };
  if (contact.ngoId !== ctx.ngoId) return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'Bu kişiye erişim yetkiniz yok.' }, { status: 403 });

  // Kişinin oturumları (en yeni 30) — disposition + tags + notlar topla.
  const sessionsSnap = await db.collection(CALL_SESSIONS)
    .where('ngoId', '==', ctx.ngoId)
    .where('contactId', '==', id)
    .orderBy('createdAt', 'desc')
    .limit(30)
    .get()
    .catch(() => null);

  const dispositions: string[] = [];
  const tagSet = new Set<string>();
  const noteBlocks: string[] = [];

  if (sessionsSnap) {
    for (const s of sessionsSnap.docs) {
      const sd = s.data() as { disposition?: string; outcomeNotes?: string; tags?: unknown };
      if (typeof sd.disposition === 'string') dispositions.push(DISPOSITION_LABEL[sd.disposition] || sd.disposition);
      if (Array.isArray(sd.tags)) for (const t of sd.tags) if (typeof t === 'string') tagSet.add(t);
      if (typeof sd.outcomeNotes === 'string' && sd.outcomeNotes.trim()) noteBlocks.push(sd.outcomeNotes.trim());

      // Alt-koleksiyon notları (en yeni 10 / oturum).
      const notesSnap = await s.ref.collection(NOTES_SUBCOLLECTION).orderBy('timestamp', 'desc').limit(10).get().catch(() => null);
      if (notesSnap) for (const n of notesSnap.docs) {
        const t = (n.data() as { text?: string }).text;
        if (typeof t === 'string' && t.trim()) noteBlocks.push(t.trim());
      }
    }
  }

  const notes = noteBlocks.slice(0, 40).join('\n---\n');
  if (!notes && dispositions.length === 0) {
    return NextResponse.json({ errorCode: 'NO_DATA', message: 'Özetlenecek görüşme kaydı yok.' }, { status: 400 });
  }

  const authHeader = req.headers.get('authorization') ?? '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';

  try {
    const result = await generateCallSummary(
      {
        contactName: contact.name || '',
        notes: notes || '(Not girilmemiş.)',
        dispositions: dispositions.join(', ') || '—',
        tags: [...tagSet].join(', ') || '—',
      },
      idToken,
    );
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    if (err instanceof AIQuotaExceededError) {
      return NextResponse.json({ errorCode: 'QUOTA_EXCEEDED', message: 'Günlük AI özeti kotanız doldu.' }, { status: 429 });
    }
    const msg = err instanceof Error ? err.message : 'AI özeti üretilemedi.';
    return NextResponse.json({ errorCode: 'AI_ERROR', message: msg }, { status: 500 });
  }
}
