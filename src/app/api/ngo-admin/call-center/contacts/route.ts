/**
 * GET /api/ngo-admin/call-center/contacts
 *
 * STK admin'in CRM rehberi listesi. Çoklu liste desteği (multi-list — bir
 * kişi birden fazla listede olabilir, `listIds[]` array-contains ile süzülür).
 *
 * Query:
 *   - q?:           string  (ad/telefon/email substring — Firestore native
 *                            full-text yok, server-side substring filter)
 *   - listId?:      string  (santralContactLists doc id)
 *   - disposition?: string  (lastDisposition filter — answered/no_answer/...)
 *   - page?:        number  (1-based, default 1)
 *   - limit?:       number  (default 50, max 50)
 *
 * Sıralama: createdAt DESC.
 *
 * Yanıt: { contacts: ContactRow[], total }
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';
import type { Query } from 'firebase-admin/firestore';
import { computeLeadScore } from '@/lib/santral/lead-score';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PAGE_SIZE_MAX = 50;

interface CallerContext {
  uid: string;
  ngoId: string;
}

interface ContactRow {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  attempts: number;
  lastAttemptAt: string | null;
  lastDisposition: string | null;
  listIds: string[];
  stage: string | null;
  pledgeAmount: number | null;
  heatScore: number;
}

async function authorize(req: NextRequest): Promise<CallerContext | null> {
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
    // kurum yöneten kullanıcı için kritik). Caller o kuruma üyeyse (managed*Id
    // eşleşiyor) ya da super-admin ise header'daki kurum kullanılır; yoksa
    // managedNgoId → managedBrandId → managedClubId ilk dolu olana düşer.
    const hdrKindRaw = req.headers.get('x-org-kind');
    const hdrKind = (hdrKindRaw === 'ngo' || hdrKindRaw === 'brand' || hdrKindRaw === 'club') ? hdrKindRaw : undefined;
    const hdrOrgId = (req.headers.get('x-org-id') || '').trim() || undefined;
    let activeOrgId = '';
    if (hdrOrgId && hdrKind) {
      const isMember =
        (hdrKind === 'ngo' && d.managedNgoId === hdrOrgId) ||
        (hdrKind === 'brand' && d.managedBrandId === hdrOrgId) ||
        (hdrKind === 'club' && d.managedClubId === hdrOrgId);
      if (!isSuperAdmin && !isMember) return null;
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

function tsToIso(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === 'object' && value !== null && 'toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  if (value instanceof Date) return value.toISOString();
  return null;
}

function tsToMs(value: unknown): number | null {
  const iso = tsToIso(value);
  return iso ? Date.parse(iso) : null;
}

/** Ham kişi doc verisinden sıcaklık skoru üretir. */
function heatFor(data: Record<string, unknown>): number {
  return computeLeadScore({
    stage: typeof data.stage === 'string' ? data.stage : null,
    lastDisposition: typeof data.lastDisposition === 'string' ? data.lastDisposition : null,
    lastAttemptAtMs: tsToMs(data.lastAttemptAt),
    attempts: typeof data.attempts === 'number' ? data.attempts : 0,
    pledgeAmount: typeof data.pledgeAmount === 'number' ? data.pledgeAmount : null,
  });
}

export async function GET(req: NextRequest) {
  const ctx = await authorize(req);
  if (!ctx) {
    return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'NGO admin yetkisi gerekli.' }, { status: 403 });
  }

  const url = new URL(req.url);
  const q = (url.searchParams.get('q') || '').trim().toLowerCase();
  const listId = (url.searchParams.get('listId') || '').trim();
  const disposition = (url.searchParams.get('disposition') || '').trim();
  const stage = (url.searchParams.get('stage') || '').trim();
  const pageRaw = Number.parseInt(url.searchParams.get('page') || '1', 10);
  const limitRaw = Number.parseInt(url.searchParams.get('limit') || String(PAGE_SIZE_MAX), 10);
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;
  const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(limitRaw, PAGE_SIZE_MAX) : PAGE_SIZE_MAX;

  const db = getAdminFirestore();
  let query: Query = db.collection(COLLECTIONS.santralContacts).where('ngoId', '==', ctx.ngoId);
  if (listId) {
    query = query.where('listIds', 'array-contains', listId);
  }
  if (disposition) {
    query = query.where('lastDisposition', '==', disposition);
  }
  if (stage) {
    query = query.where('stage', '==', stage);
  }
  query = query.orderBy('createdAt', 'desc');

  // Firestore'da native substring araması yok; q varsa tüm STK kayıtlarını
  // çekip server-side filter uyguluyoruz. STK başına kişi sayısı binler
  // mertebesinde olduğu için kabul edilebilir. q yoksa pagination Firestore
  // tarafında offset+limit ile yapılır.
  if (!q) {
    const totalSnap = await query.count().get();
    const total = totalSnap.data().count;
    const offset = (page - 1) * limit;
    const pageSnap = await query.offset(offset).limit(limit).get();
    const contacts: ContactRow[] = pageSnap.docs.map((d) => {
      const data = d.data() as Record<string, unknown>;
      return {
        id: d.id,
        name: typeof data.name === 'string' ? data.name : '',
        phone: typeof data.phone === 'string' ? data.phone : '',
        email: typeof data.email === 'string' ? data.email : null,
        attempts: typeof data.attempts === 'number' ? data.attempts : 0,
        lastAttemptAt: tsToIso(data.lastAttemptAt),
        lastDisposition: typeof data.lastDisposition === 'string' ? data.lastDisposition : null,
        listIds: Array.isArray(data.listIds) ? (data.listIds as unknown[]).filter((s): s is string => typeof s === 'string') : [],
        stage: typeof data.stage === 'string' ? data.stage : null,
        pledgeAmount: typeof data.pledgeAmount === 'number' ? data.pledgeAmount : null,
        heatScore: heatFor(data),
      };
    });
    return NextResponse.json({ contacts, total });
  }

  // q ile substring eşleşmesi: name + phone + email.
  const allSnap = await query.get();
  const filtered = allSnap.docs.filter((d) => {
    const data = d.data() as Record<string, unknown>;
    const name = (typeof data.name === 'string' ? data.name : '').toLowerCase();
    const phone = (typeof data.phone === 'string' ? data.phone : '').toLowerCase();
    const email = (typeof data.email === 'string' ? data.email : '').toLowerCase();
    return name.includes(q) || phone.includes(q) || email.includes(q);
  });
  const total = filtered.length;
  const offset = (page - 1) * limit;
  const pageDocs = filtered.slice(offset, offset + limit);
  const contacts: ContactRow[] = pageDocs.map((d) => {
    const data = d.data() as Record<string, unknown>;
    return {
      id: d.id,
      name: typeof data.name === 'string' ? data.name : '',
      phone: typeof data.phone === 'string' ? data.phone : '',
      email: typeof data.email === 'string' ? data.email : null,
      attempts: typeof data.attempts === 'number' ? data.attempts : 0,
      lastAttemptAt: tsToIso(data.lastAttemptAt),
      lastDisposition: typeof data.lastDisposition === 'string' ? data.lastDisposition : null,
      listIds: Array.isArray(data.listIds) ? (data.listIds as unknown[]).filter((s): s is string => typeof s === 'string') : [],
      stage: typeof data.stage === 'string' ? data.stage : null,
      pledgeAmount: typeof data.pledgeAmount === 'number' ? data.pledgeAmount : null,
      heatScore: heatFor(data),
    };
  });
  return NextResponse.json({ contacts, total });
}
