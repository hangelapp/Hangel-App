/**
 * GET /api/ngo-admin/call-center/contacts/[id]/timeline
 *
 * Kişinin tüm geçmişini TEK kronolojik akışta toplar (HubSpot activity timeline):
 *   - call    : callSessions (arama sonucu + süre)
 *   - note    : callSessions/{s}/notes (görüşme notları)
 *   - whatsapp: wabaConversations/{ngoId__phone}/messages
 *   - stage   : santralContacts/{id}/activities (aşama değişimi)
 *
 * Yanıt: { items: [{ type, at, title, detail, meta }] } — at DESC.
 * KVKK: yalnız caller'ın kendi tenant'ı.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';

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

function tsToIso(v: unknown): string | null {
  const d = (v as { toDate?: () => Date } | undefined)?.toDate?.();
  return d ? d.toISOString() : null;
}

interface TimelineItem {
  type: 'call' | 'note' | 'whatsapp' | 'stage';
  at: string | null;
  title: string;
  detail: string | null;
  meta?: Record<string, unknown>;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await authorize(req);
  if (!ctx) return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'Yetki gerekli.' }, { status: 403 });

  const { id } = await params;
  if (!id) return NextResponse.json({ errorCode: 'BAD_INPUT', message: 'Kişi kimliği eksik.' }, { status: 400 });

  const db = getAdminFirestore();
  const contactSnap = await db.collection(COLLECTIONS.santralContacts).doc(id).get();
  if (!contactSnap.exists) return NextResponse.json({ errorCode: 'NOT_FOUND', message: 'Kişi bulunamadı.' }, { status: 404 });
  const contact = contactSnap.data() as { ngoId?: string; phone?: string };
  if (contact.ngoId !== ctx.ngoId) return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'Bu kişiye erişim yetkiniz yok.' }, { status: 403 });

  const items: TimelineItem[] = [];

  // 1) Aramalar + notlar (callSessions + notes alt koleksiyonu).
  const sessionsSnap = await db.collection(CALL_SESSIONS)
    .where('ngoId', '==', ctx.ngoId).where('contactId', '==', id)
    .orderBy('createdAt', 'desc').limit(30).get().catch(() => null);
  if (sessionsSnap) {
    for (const s of sessionsSnap.docs) {
      const sd = s.data() as Record<string, unknown>;
      const disp = typeof sd.disposition === 'string' ? sd.disposition : null;
      const dur = typeof sd.duration === 'number' ? sd.duration : 0;
      const dir = sd.direction === 'inbound' ? 'Gelen' : 'Giden';
      items.push({
        type: 'call',
        at: tsToIso(sd.startedAt) ?? tsToIso(sd.createdAt),
        title: `${dir} arama${disp ? ' — ' + (DISPOSITION_LABEL[disp] || disp) : ''}`,
        detail: dur > 0 ? `Süre: ${Math.floor(dur / 60)}dk ${dur % 60}sn` : null,
        meta: { disposition: disp },
      });
      // notlar
      const notesSnap = await s.ref.collection('notes').orderBy('timestamp', 'desc').limit(10).get().catch(() => null);
      if (notesSnap) for (const n of notesSnap.docs) {
        const nd = n.data() as { text?: string; agentName?: string; timestamp?: unknown };
        if (typeof nd.text === 'string' && nd.text.trim()) {
          items.push({
            type: 'note',
            at: tsToIso(nd.timestamp),
            title: nd.agentName ? `Not — ${nd.agentName}` : 'Not',
            detail: nd.text.trim(),
          });
        }
      }
    }
  }

  // 2) WhatsApp mesajları.
  if (contact.phone) {
    const convId = `${ctx.ngoId}__${contact.phone}`;
    const msgSnap = await db.collection(COLLECTIONS.wabaConversations).doc(convId)
      .collection(COLLECTIONS.wabaMessages).orderBy('timestamp', 'desc').limit(30).get().catch(() => null);
    if (msgSnap) for (const m of msgSnap.docs) {
      const md = m.data() as { direction?: string; body?: string; templateName?: string; timestamp?: unknown };
      const dir = md.direction === 'inbound' ? 'Gelen' : 'Giden';
      const body = md.body || (md.templateName ? `[Şablon: ${md.templateName}]` : '');
      items.push({
        type: 'whatsapp',
        at: tsToIso(md.timestamp),
        title: `${dir} WhatsApp`,
        detail: body || null,
      });
    }
  }

  // 3) Aşama değişimleri (activities).
  const actSnap = await contactSnap.ref.collection('activities')
    .where('type', '==', 'stage').orderBy('at', 'desc').limit(20).get().catch(() => null);
  if (actSnap) for (const a of actSnap.docs) {
    const ad = a.data() as { stageLabel?: string; pledgeAmount?: number; byName?: string; at?: unknown };
    const pledge = typeof ad.pledgeAmount === 'number' && ad.pledgeAmount > 0
      ? ` (${new Intl.NumberFormat('tr-TR').format(ad.pledgeAmount)} ₺)` : '';
    items.push({
      type: 'stage',
      at: tsToIso(ad.at),
      title: `Aşama: ${ad.stageLabel || '—'}${pledge}`,
      detail: ad.byName ? `${ad.byName} güncelledi` : null,
    });
  }

  // Kronolojik sırala (en yeni önce). Zamansızlar sona.
  items.sort((x, y) => (y.at || '').localeCompare(x.at || ''));

  return NextResponse.json({ items: items.slice(0, 100) });
}
