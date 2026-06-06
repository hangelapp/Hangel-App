/**
 * GET /api/super-admin/outreach/list
 *
 * Outreach hub için sayfalı kontak listesi. Firestore native pagination
 * (startAfter cursor) ile binlerce kayıtla çalışır.
 *
 * Query params:
 *   - source: 'registryVakiflar' | 'registryDernekler' | 'outreachContacts'
 *   - cursor: son okunan doc id (opsiyonel)
 *   - limit: 50-500 (default 100)
 *   - search: ad/adres metni
 *   - city: il filtresi
 *   - emailOnly: 'true' → sadece email'i olanlar (vakıflar için)
 *
 * Response:
 *   {
 *     rows: OutreachRow[],
 *     nextCursor: string | null,
 *     total?: number  // sadece ilk istekte
 *   }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';

const MAX_LIMIT = 500;
const DEFAULT_LIMIT = 100;
const VALID_SOURCES = ['registryVakiflar', 'registryDernekler', 'outreachContacts'] as const;
type Source = typeof VALID_SOURCES[number];

interface OutreachRow {
  id: string;
  name: string;
  type?: string;
  city?: string;
  district?: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  status?: string;
}

async function isSuperAdmin(req: NextRequest): Promise<boolean> {
  const authHeader = req.headers.get('authorization') || '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!idToken) return false;
  try {
    const decoded = await getAdminAuth().verifyIdToken(idToken) as { uid: string; role?: string; superAdminPermissions?: unknown };
    if (decoded.role === 'super-admin' || !!decoded.superAdminPermissions) return true;
    const snap = await getAdminFirestore().collection(COLLECTIONS.users).doc(decoded.uid).get();
    const d = snap.data();
    return d?.role === 'super-admin' || (Array.isArray(d?.superAdminPermissions) && d.superAdminPermissions.length > 0);
  } catch { return false; }
}

function normalize(source: Source, doc: FirebaseFirestore.QueryDocumentSnapshot): OutreachRow {
  const data = doc.data();
  if (source === 'registryVakiflar') {
    return {
      id: doc.id,
      name: data.name || '',
      type: 'Vakıf',
      city: data.il,
      district: data.ilce,
      phone: data.telefon1 || data.telefon2,
      email: data.ePosta,
      address: data.adres,
    };
  }
  if (source === 'registryDernekler') {
    return {
      id: doc.id,
      name: data.name || '',
      type: 'Dernek',
      address: data.adres,
      website: data.webSite,
    };
  }
  return {
    id: doc.id,
    name: data.name || '',
    type: data.type,
    city: data.city,
    district: data.district,
    phone: data.phone,
    email: data.email,
    website: data.website,
    address: data.address,
    status: data.status,
  };
}

export async function GET(req: NextRequest) {
  if (!(await isSuperAdmin(req))) {
    return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'Super-admin yetkisi gerekli.' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const source = searchParams.get('source') as Source | null;
  if (!source || !VALID_SOURCES.includes(source)) {
    return NextResponse.json({ errorCode: 'BAD_SOURCE', message: 'source geçersiz' }, { status: 400 });
  }

  const limitNum = Math.min(MAX_LIMIT, Math.max(1, parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT), 10)));
  const cursor = searchParams.get('cursor') || null;
  const search = (searchParams.get('search') || '').toLowerCase().trim();
  const city = searchParams.get('city') || null;
  const emailOnly = searchParams.get('emailOnly') === 'true';

  const db = getAdminFirestore();
  let q: FirebaseFirestore.Query = db.collection(source);

  // Source-specific filters
  if (source === 'registryVakiflar') {
    q = q.orderBy('nameLower');
    if (emailOnly) {
      // emailOnly + orderBy('ePosta', '!=', ''): zorunlu inequality order önce
      // Bunun yerine emailOnly filter'ını client-side post-filter yapıyoruz.
    }
    if (city) {
      q = q.where('il', '==', city);
    }
  } else if (source === 'registryDernekler') {
    q = q.orderBy('__name__');
  } else {
    q = q.orderBy('createdAt', 'desc').limit(limitNum);
    if (city) {
      q = q.where('city', '==', city);
    }
  }

  // Cursor
  if (cursor) {
    const cursorDoc = await db.collection(source).doc(cursor).get();
    if (cursorDoc.exists) {
      q = q.startAfter(cursorDoc);
    }
  }

  // Limit (post-filter olabileceği için biraz daha fazla çek)
  const fetchLimit = emailOnly || search ? Math.min(MAX_LIMIT, limitNum * 3) : limitNum;
  q = q.limit(fetchLimit);

  const snap = await q.get();
  let rows = snap.docs.map((d) => normalize(source, d));

  // Post-filter (search, emailOnly — Firestore inequality limitleri için)
  if (emailOnly) rows = rows.filter((r) => !!r.email);
  if (search) {
    rows = rows.filter((r) =>
      r.name.toLowerCase().includes(search) || (r.address || '').toLowerCase().includes(search),
    );
  }

  // Limit'e gore kes
  const finalRows = rows.slice(0, limitNum);
  const nextCursor = snap.docs.length === fetchLimit && finalRows.length > 0
    ? snap.docs[snap.docs.length - 1].id
    : null;

  return NextResponse.json({
    rows: finalRows,
    nextCursor,
    fetched: snap.docs.length,
  });
}
