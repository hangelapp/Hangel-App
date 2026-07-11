/**
 * GET /api/ngo-admin/participants?source=event|volunteer
 *
 * STK yöneticisinin katılımcı rehberini döndürür — santralContacts içinden
 * participantSources array-contains {source} ile süzülür. Arama/not/durum
 * mevcut santral kişileriyle AYNI doc'lar olduğundan tek-tuş arama ve kalıcı
 * not sıfır ek işle çalışır.
 *
 * Query:
 *   - source: 'event' | 'volunteer' (zorunlu)
 *   - q?: ad/telefon/mail substring
 *
 * KVKK: yalnız caller'ın managedNgoId'sine ait kişiler.
 * Yanıt: { participants: Row[] }
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CONTACTS = 'santralContacts';

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

function tsToIso(value: unknown): string | null {
  if (value && typeof value === 'object' && 'toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  return null;
}

interface ParticipantRow {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  attempts: number;
  lastDisposition: string | null;
  lastAttemptAt: string | null;
  attendance: 'attended' | 'absent' | null; // yoklama: geldi/gelmedi/işaretsiz
  assignedToName: string | null;            // sorumlu (Adım 3)
  sources: { label: string; refId: string; when: string }[];
}

export async function GET(req: NextRequest) {
  const ctx = await authorize(req);
  if (!ctx) {
    return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'NGO admin yetkisi gerekli.' }, { status: 403 });
  }
  const url = new URL(req.url);
  const source = url.searchParams.get('source');
  if (source !== 'event' && source !== 'volunteer') {
    return NextResponse.json({ errorCode: 'BAD_INPUT', message: "source 'event' veya 'volunteer' olmalı." }, { status: 400 });
  }
  const q = (url.searchParams.get('q') || '').trim().toLocaleLowerCase('tr');

  const db = getAdminFirestore();
  const snap = await db
    .collection(CONTACTS)
    .where('ngoId', '==', ctx.ngoId)
    .where('participantSources', 'array-contains', source)
    .get();

  let rows: ParticipantRow[] = snap.docs.map((d) => {
    const data = d.data() as {
      name?: string; phone?: string; email?: string;
      attempts?: number; lastDisposition?: string; lastAttemptAt?: unknown;
      attendance?: string; attendanceManual?: string; assignedToName?: string;
      participantRefs?: Record<string, { label?: string; refId?: string; when?: string }[]>;
    };
    const refs = data.participantRefs?.[source] || [];
    // Manuel yoklama (yönetici işareti) otomatik check-in'in ÜSTÜNDE.
    const att = data.attendanceManual || data.attendance;
    return {
      id: d.id,
      name: (data.name || '').trim() || 'Katılımcı',
      phone: data.phone || '',
      email: data.email || null,
      attempts: typeof data.attempts === 'number' ? data.attempts : 0,
      lastDisposition: data.lastDisposition || null,
      lastAttemptAt: tsToIso(data.lastAttemptAt),
      attendance: att === 'attended' ? 'attended' : att === 'absent' ? 'absent' : null,
      assignedToName: data.assignedToName || null,
      sources: refs.map((r) => ({ label: r.label || '', refId: r.refId || '', when: r.when || '' })),
    };
  });

  if (q) {
    rows = rows.filter((r) => `${r.name} ${r.phone} ${r.email || ''}`.toLocaleLowerCase('tr').includes(q));
  }
  rows.sort((a, b) => a.name.localeCompare(b.name, 'tr'));

  return NextResponse.json({ participants: rows });
}
