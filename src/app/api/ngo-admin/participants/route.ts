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

const OWNER_EMAIL = 'ismailhilmi@hangel.org';

type OrgKind = 'ngo' | 'brand' | 'club';
interface Identity {
  uid: string;
  managedNgoId?: string;
  managedBrandId?: string;
  managedClubId?: string;
  role?: string;
  email?: string;
  hdrKind?: OrgKind;
  hdrOrgId?: string;
}
interface CallerContext { uid: string; ngoId: string; }

async function identify(req: NextRequest): Promise<Identity | null> {
  const authHeader = req.headers.get('authorization') || '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!idToken) return null;
  const hdrKindRaw = req.headers.get('x-org-kind');
  const hdrKind = (hdrKindRaw === 'ngo' || hdrKindRaw === 'brand' || hdrKindRaw === 'club') ? hdrKindRaw : undefined;
  const hdrOrgId = req.headers.get('x-org-id') || undefined;
  try {
    const decoded = (await getAdminAuth().verifyIdToken(idToken)) as { uid: string; email?: string };
    const snap = await getAdminFirestore().collection(COLLECTIONS.users).doc(decoded.uid).get();
    if (!snap.exists) return null;
    const d = snap.data() as { role?: string; managedNgoId?: string; managedBrandId?: string; managedClubId?: string };
    return {
      uid: decoded.uid,
      managedNgoId: d?.managedNgoId,
      managedBrandId: d?.managedBrandId,
      managedClubId: d?.managedClubId,
      role: d?.role,
      email: decoded.email,
      hdrKind,
      hdrOrgId,
    };
  } catch {
    return null;
  }
}

// Yetkiyi çöz: super-admin/sahip query'deki ngoId'yi kullanır (üst switcher ile başka
// STK'ya bakabilir); ngo-admin yalnız kendi managedNgoId'sini yönetir.
// AKTİF kurum: client x-org-id + x-org-kind gönderirse o kuruma üyelik doğrulanır
// (ngo/brand/club). Yoksa eski davranış (managedNgoId → managedBrandId → managedClubId).
function resolveNgo(id: Identity, requestedNgoId: string | null): CallerContext | null {
  const isOwner = id.role === 'super-admin' || id.email === OWNER_EMAIL;

  // Aktif kurum header'ları
  if (id.hdrOrgId && id.hdrKind) {
    if (isOwner) {
      return { uid: id.uid, ngoId: id.hdrOrgId };
    }
    const owns =
      (id.hdrKind === 'ngo' && id.managedNgoId === id.hdrOrgId) ||
      (id.hdrKind === 'brand' && id.managedBrandId === id.hdrOrgId) ||
      (id.hdrKind === 'club' && id.managedClubId === id.hdrOrgId);
    if (!owns) return null;
    return { uid: id.uid, ngoId: id.hdrOrgId };
  }

  if (isOwner) {
    const target = (requestedNgoId || '').trim() || id.managedNgoId || id.managedBrandId || id.managedClubId;
    if (!target) return null;
    return { uid: id.uid, ngoId: target };
  }
  const own = id.managedNgoId || id.managedBrandId || id.managedClubId;
  if (!own) return null;
  // ngo-admin başka kurum istese bile kendi kurumuna sabitlenir.
  if (requestedNgoId && requestedNgoId.trim() && requestedNgoId.trim() !== own) return null;
  return { uid: id.uid, ngoId: own };
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
  const id = await identify(req);
  if (!id) {
    return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'Oturum gerekli.' }, { status: 403 });
  }
  const url = new URL(req.url);
  const ctx = resolveNgo(id, url.searchParams.get('ngoId'));
  if (!ctx) {
    return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'Bu STK için yetkiniz yok.' }, { status: 403 });
  }
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
