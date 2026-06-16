/**
 * GET /api/ngo-admin/call-center/recordings
 *
 * STK admin'in çağrı kaydı arşivi. Sadece `recordingStorageUrl` dolu olan
 * callSessions doc'larını döner. Kişi adı server-side join (santralContacts).
 *
 * KVKK: STK = Veri Sorumlusu. Kayda yalnızca STK tenant'ı erişir; super-admin
 * rolü olsa bile bu endpoint kullanıcının kendi `managedNgoId`'sine ait
 * kayıtlarla sınırlanır. Cross-tenant erişim verilmez.
 *
 * Query:
 *   - q?:           string  (kişi adı substring, lowercased)
 *   - disposition?: string  (callSessions.disposition eşit filtresi)
 *   - from?:        ISO date (startedAt >= from)
 *   - to?:          ISO date (startedAt <= to)
 *   - page?:        number  (1-based, default 1)
 *   - limit?:       number  (default 50, max 50)
 *
 * Sıralama: createdAt DESC.
 * Yanıt: { recordings: RecordingRow[], total }
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';
import type { Query } from 'firebase-admin/firestore';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CALL_SESSIONS = 'callSessions';
const PAGE_SIZE_MAX = 50;

interface CallerContext {
  uid: string;
  ngoId: string;
}

interface RecordingRow {
  id: string;
  contactId: string | null;
  contactName: string;
  calledNumber: string | null;
  callerNumber: string | null;
  direction: 'inbound' | 'outbound' | null;
  duration: number;
  disposition: string | null;
  outcome: string | null;
  status: string | null;
  recordingUrl: string;
  startedAt: string | null;
  endedAt: string | null;
  createdAt: string | null;
}

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
  if (!value) return null;
  if (
    typeof value === 'object' &&
    value !== null &&
    'toDate' in value &&
    typeof (value as { toDate: () => Date }).toDate === 'function'
  ) {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  if (value instanceof Date) return value.toISOString();
  return null;
}

function parseIsoDate(raw: string | null): Date | null {
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function GET(req: NextRequest) {
  const ctx = await authorize(req);
  if (!ctx) {
    return NextResponse.json(
      { errorCode: 'FORBIDDEN', message: 'NGO admin yetkisi gerekli.' },
      { status: 403 },
    );
  }

  const url = new URL(req.url);
  const q = (url.searchParams.get('q') || '').trim().toLowerCase();
  const disposition = (url.searchParams.get('disposition') || '').trim();
  const from = parseIsoDate(url.searchParams.get('from'));
  const to = parseIsoDate(url.searchParams.get('to'));
  const pageRaw = Number.parseInt(url.searchParams.get('page') || '1', 10);
  const limitRaw = Number.parseInt(
    url.searchParams.get('limit') || String(PAGE_SIZE_MAX),
    10,
  );
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;
  const limit =
    Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, PAGE_SIZE_MAX) : PAGE_SIZE_MAX;

  const db = getAdminFirestore();

  // KVKK: ngoId her zaman caller'ın kendi tenant'ı; super-admin override yok.
  // recordingStorageUrl != null: Firestore native `!=` indexli sorgu, geri
  // kalan filtreleri server-side uyguluyoruz.
  let baseQuery: Query = db
    .collection(CALL_SESSIONS)
    .where('ngoId', '==', ctx.ngoId)
    .where('recordingStorageUrl', '!=', null);

  if (disposition) {
    baseQuery = baseQuery.where('disposition', '==', disposition);
  }

  // recordingStorageUrl != null sorgusunda Firestore ilk orderBy alanını
  // o alan yapmak zorundadır; createdAt DESC ikincil sıralamayla istenen
  // sonuca ulaşırız.
  baseQuery = baseQuery.orderBy('recordingStorageUrl').orderBy('createdAt', 'desc');

  const allSnap = await baseQuery.get();

  // Tarih + kişi adı substring filtreleri server-side (Firestore'da native
  // contains yok; tarih filtresi de inequality kombinasyonuyla çakışmasın).
  let filteredDocs = allSnap.docs;

  if (from || to) {
    filteredDocs = filteredDocs.filter((d) => {
      const data = d.data() as Record<string, unknown>;
      const startedAt = data.startedAt as { toDate?: () => Date } | undefined;
      const startDate = startedAt?.toDate?.();
      if (!startDate) return false;
      if (from && startDate < from) return false;
      if (to && startDate > to) return false;
      return true;
    });
  }

  // Kişi adı join: tek seferlik santralContacts okuma (yalnızca filtrelenmiş
  // doc'lardaki contactId'ler için).
  const contactIds = Array.from(
    new Set(
      filteredDocs
        .map((d) => {
          const data = d.data() as Record<string, unknown>;
          return typeof data.contactId === 'string' ? data.contactId : null;
        })
        .filter((s): s is string => s !== null && s.length > 0),
    ),
  );

  const contactNames = new Map<string, string>();
  if (contactIds.length > 0) {
    // Firestore in() max 30 — chunk'la oku.
    const CHUNK = 30;
    for (let i = 0; i < contactIds.length; i += CHUNK) {
      const chunk = contactIds.slice(i, i + CHUNK);
      const refs = chunk.map((id) =>
        db.collection(COLLECTIONS.santralContacts).doc(id),
      );
      const snaps = await db.getAll(...refs);
      for (const s of snaps) {
        if (!s.exists) continue;
        const data = s.data() as Record<string, unknown>;
        if (data.ngoId !== ctx.ngoId) continue;
        const name = typeof data.name === 'string' ? data.name : '';
        contactNames.set(s.id, name);
      }
    }
  }

  // Kişi adı arama (q): join sonrası uygulanır.
  if (q) {
    filteredDocs = filteredDocs.filter((d) => {
      const data = d.data() as Record<string, unknown>;
      const cid = typeof data.contactId === 'string' ? data.contactId : '';
      const name = (contactNames.get(cid) || '').toLowerCase();
      const phone = (typeof data.calledNumber === 'string' ? data.calledNumber : '').toLowerCase();
      return name.includes(q) || phone.includes(q);
    });
  }

  const total = filteredDocs.length;
  const offset = (page - 1) * limit;
  const pageDocs = filteredDocs.slice(offset, offset + limit);

  const recordings: RecordingRow[] = pageDocs.map((d) => {
    const data = d.data() as Record<string, unknown>;
    const cid = typeof data.contactId === 'string' ? data.contactId : null;
    return {
      id: d.id,
      contactId: cid,
      contactName: cid ? contactNames.get(cid) || '' : '',
      calledNumber: typeof data.calledNumber === 'string' ? data.calledNumber : null,
      callerNumber: typeof data.callerNumber === 'string' ? data.callerNumber : null,
      direction:
        data.direction === 'inbound' || data.direction === 'outbound'
          ? data.direction
          : null,
      duration: typeof data.duration === 'number' ? data.duration : 0,
      disposition: typeof data.disposition === 'string' ? data.disposition : null,
      outcome: typeof data.outcome === 'string' ? data.outcome : null,
      status: typeof data.status === 'string' ? data.status : null,
      recordingUrl: typeof data.recordingStorageUrl === 'string' ? data.recordingStorageUrl : '',
      startedAt: tsToIso(data.startedAt),
      endedAt: tsToIso(data.endedAt),
      createdAt: tsToIso(data.createdAt),
    };
  });

  return NextResponse.json({ recordings, total });
}
