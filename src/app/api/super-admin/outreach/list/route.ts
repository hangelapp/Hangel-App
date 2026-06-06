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

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MAX_LIMIT = 1000;
const DEFAULT_LIMIT = 100;
const VALID_SOURCES = ['registryVakiflar', 'registryDernekler', 'outreachContacts'] as const;
type Source = typeof VALID_SOURCES[number];

interface OutreachRow {
  id: string;
  name: string;
  shortName?: string;             // kisaAd
  type?: string;
  city?: string;
  district?: string;
  neighborhood?: string;
  phone?: string;
  phone2?: string;                // vakıf telefon2
  email?: string;
  etebligat?: string;             // vakıf e-tebligat
  website?: string;
  address?: string;
  status?: string;
  faaliyetAlani?: string;
  detayliFaaliyetAlani?: string;  // dernek
  kutukNo?: string;               // dernek/vakıf
  kurulusTarihi?: string;         // dernek
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

/**
 * Türkçe adresten "İl / İlçe / Mahalle" çıkar — basit heuristik.
 * Tipik formatlar:
 *   "ÖZGÜR MAH. ... YÜREĞİR / ADANA"  → mahalle=ÖZGÜR, ilçe=YÜREĞİR, il=ADANA
 *   "BAĞDAT CAD. KADIKÖY/İSTANBUL"    → ilçe=KADIKÖY, il=İSTANBUL
 *   "NO:1 KAT:3 BEYOĞLU İSTANBUL"     → ilçe=BEYOĞLU, il=İSTANBUL
 */
function parseAddress(addr: string | undefined): { city?: string; district?: string; neighborhood?: string } {
  if (!addr) return {};
  const a = addr.toUpperCase().replace(/İ/g, 'I');
  const out: { city?: string; district?: string; neighborhood?: string } = {};

  // Mahalle yakalama: "X MAH." veya "X MAHALLESİ"
  const mahMatch = addr.match(/\b([A-ZÇĞİÖŞÜ][\wÇĞİÖŞÜçğıöşü\.-]+?)\s+MAH(ALLESİ|\.|ALLE)/i);
  if (mahMatch) out.neighborhood = mahMatch[1].trim().replace(/\.$/, '');

  // Slash split — son segment = il, ondan önceki = ilçe
  const slashParts = addr.split('/').map((s) => s.trim()).filter(Boolean);
  if (slashParts.length >= 2) {
    out.city = slashParts[slashParts.length - 1].split(/\s+/).pop();
    const beforeSlash = slashParts[slashParts.length - 2];
    if (beforeSlash) {
      const words = beforeSlash.split(/\s+/);
      out.district = words[words.length - 1];
    }
  }
  // City fallback — adres sonunda büyük il adı varsa
  if (!out.city) {
    const cities = ['ANKARA','İSTANBUL','IZMIR','BURSA','ANTALYA','ADANA','KONYA','GAZIANTEP','MERSIN','KAYSERI','DIYARBAKIR','SAMSUN','ESKISEHIR','TRABZON','SAKARYA','MALATYA','VAN','ERZURUM','HATAY','MANISA'];
    const match = cities.find((c) => a.includes(c));
    if (match) out.city = match;
  }
  return out;
}

function normalize(source: Source, doc: FirebaseFirestore.QueryDocumentSnapshot): OutreachRow {
  const data = doc.data();
  if (source === 'registryVakiflar') {
    return {
      id: doc.id,
      name: data.name || '',
      shortName: data.kisaAd,
      type: 'Vakıf',
      city: data.il,
      district: data.ilce,
      neighborhood: data.mahalle,
      phone: data.telefon1,
      phone2: data.telefon2,
      email: data.ePosta,
      etebligat: data.eTebligat,
      website: data.webSite || data.website,
      address: data.adres,
      faaliyetAlani: data.faaliyetAlani,
      kutukNo: data.kutukNo,
      status: data.status,
    };
  }
  if (source === 'registryDernekler') {
    const parsed = !data.il && !data.ilce && !data.mahalle
      ? parseAddress(data.adres)
      : {};
    return {
      id: doc.id,
      name: data.name || '',
      shortName: data.kisaAd,
      type: 'Dernek',
      city: data.il || parsed.city,
      district: data.ilce || parsed.district,
      neighborhood: data.mahalle || parsed.neighborhood,
      email: data.ePosta || data.email,
      website: data.webSite || data.website,
      address: data.adres,
      faaliyetAlani: data.faaliyetAlani,
      detayliFaaliyetAlani: data.detayliFaaliyetAlani,
      kutukNo: data.kutukNo,
      kurulusTarihi: data.kurulusTarihi,
      status: data.status,
    };
  }
  return {
    id: doc.id,
    name: data.name || '',
    shortName: data.shortName,
    type: data.type,
    city: data.city,
    district: data.district,
    neighborhood: data.neighborhood,
    phone: data.phone,
    phone2: data.phone2,
    email: data.email,
    etebligat: data.etebligat,
    website: data.website,
    address: data.address,
    status: data.status,
    faaliyetAlani: data.faaliyetAlani,
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
  // Default: aktif kayıtlar gösterilir (status != 'unsubscribed').
  // showUnsubscribed=true → sadece listeden çıkanlar gösterilir.
  const showUnsubscribed = searchParams.get('showUnsubscribed') === 'true';

  const db = getAdminFirestore();
  let q: FirebaseFirestore.Query = db.collection(source);

  // Source-specific filters
  if (source === 'registryVakiflar') {
    if (city) q = q.where('il', '==', city);
    q = q.orderBy('nameLower');
  } else if (source === 'registryDernekler') {
    // ÖNEMLİ: doc id format "01-001-023" (Adana=01) → __name__ ile sıralayınca
    // ilk 100 hep Adana çıkıyordu. nameLower ile alfabetik sırala.
    // city filter yoksa il alanı olmayan eski dernek kayıtları için fallback yok;
    // alfabetik sıralama tüm illeri eşit dağıtır.
    if (city) q = q.where('il', '==', city);
    q = q.orderBy('nameLower');
  } else {
    q = q.orderBy('createdAt', 'desc').limit(limitNum);
    if (city) q = q.where('city', '==', city);
  }

  // Cursor — bulunamazsa CURSOR_INVALID dön (silent skip yerine)
  if (cursor) {
    const cursorDoc = await db.collection(source).doc(cursor).get();
    if (!cursorDoc.exists) {
      return NextResponse.json(
        { errorCode: 'CURSOR_INVALID', message: 'Pagination süresi doldu, baştan başla' },
        { status: 410 },
      );
    }
    q = q.startAfter(cursorDoc);
  }

  // Post-filter çok agresif olabilir (özellikle emailOnly + city filtre kombinasyonunda).
  // Loop ile yeterli sonuç toplanana kadar fetch et (max 5 iterasyon = 5x multiplier güvence).
  const finalRows: OutreachRow[] = [];
  let lastCursorDoc: FirebaseFirestore.QueryDocumentSnapshot | null = null;
  let fetched = 0;
  const baseLimit = limitNum;
  const perFetch = emailOnly || search ? Math.min(MAX_LIMIT, baseLimit * 3) : baseLimit;

  for (let iter = 0; iter < 5 && finalRows.length < baseLimit; iter++) {
    let iterQ = q;
    if (lastCursorDoc) iterQ = iterQ.startAfter(lastCursorDoc);
    iterQ = iterQ.limit(perFetch);

    const snap = await iterQ.get();
    fetched += snap.docs.length;
    if (snap.empty) break;

    for (const doc of snap.docs) {
      const row = normalize(source, doc);
      // Status filter: unsubscribed kayıtlar default gizlenir; toggle ile sadece onlar gösterilir.
      const isUnsubscribed = row.status === 'unsubscribed';
      if (showUnsubscribed && !isUnsubscribed) continue;
      if (!showUnsubscribed && isUnsubscribed) continue;
      if (emailOnly && !row.email) continue;
      if (search && !(row.name.toLowerCase().includes(search) || (row.address || '').toLowerCase().includes(search))) continue;
      finalRows.push(row);
      if (finalRows.length >= baseLimit) break;
    }
    lastCursorDoc = snap.docs[snap.docs.length - 1];
    if (snap.docs.length < perFetch) break; // sonuna geldik
  }

  // KRİTİK: nextCursor son RETURNED row'un id'si olmalı, son fetched doc DEĞİL.
  // Aksi halde post-filter ile elenen doc'lar arasından "atlama" olur.
  const nextCursor = finalRows.length === baseLimit && finalRows.length > 0
    ? finalRows[finalRows.length - 1].id
    : null;

  return NextResponse.json({
    rows: finalRows,
    nextCursor,
    fetched,
  });
}
