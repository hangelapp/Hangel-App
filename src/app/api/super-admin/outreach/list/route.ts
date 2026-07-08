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
  // Kamu Yararına Çalışan Dernek statüsü (T.C. siviltoplum.gov.tr listesinden)
  isKamuYarari?: boolean;
  kamuYariNo?: string;
  kamuYariTarihi?: string;
  // Kayıtlı olduğu sivil toplum platformları (Afet Platformu, Açık Açık, Tüsev vs.)
  platforms?: string[];
  // Spor kulübünün kayıtlı olduğu federasyonlar (TFF, TBF, TVF vs. — bir kulüp
  // birden çok federasyona kayıtlı olabilir; federation-scrape sonucu doldurulur)
  federations?: string[];
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

  // Slash split — son segment = il, ondan önceki = ilçe.
  // Kütük adresleri çoğu "İLÇE/İL/TURKIYE" ile bittiği için sondaki ülke ekini at.
  const slashParts = addr.split('/').map((s) => s.trim())
    .filter(Boolean)
    .filter((p) => !/^t[uü]rk[iİ]ye$/i.test(p));
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

// Diakritik + büyük/küçük duyarsız karşılaştırma (il/ilçe/mahalle post-filter için).
function nrm(s: string | undefined): string {
  return (s || '').toLocaleLowerCase('tr')
    .replace(/â/g, 'a').replace(/î/g, 'i').replace(/û/g, 'u')
    .replace(/ı/g, 'i').replace(/ğ/g, 'g').replace(/ü/g, 'u')
    .replace(/ş/g, 's').replace(/ö/g, 'o').replace(/ç/g, 'c').trim();
}
// Kuruluş tarihinden 4 haneli yıl çıkar (string "12.05.1995" / "1995" / Date).
function yearOf(row: OutreachRow): number {
  const m = String(row.kurulusTarihi || '').match(/\b(19|20)\d{2}\b/);
  return m ? parseInt(m[0], 10) : 0;
}

function normalize(source: Source, doc: FirebaseFirestore.QueryDocumentSnapshot): OutreachRow {
  const data = doc.data();
  if (source === 'registryVakiflar') {
    const parsed = parseAddress(data.adres);
    return {
      id: doc.id,
      name: data.name || '',
      shortName: data.kisaAd,
      type: 'Vakıf',
      city: data.il || parsed.city,
      district: data.ilce || parsed.district,
      neighborhood: data.mahalle || parsed.neighborhood,
      phone: data.telefon1,
      phone2: data.telefon2,
      email: data.ePosta,
      etebligat: data.eTebligat,
      website: data.webSite || data.website,
      address: data.adres,
      faaliyetAlani: data.faaliyetAlani,
      kutukNo: data.kutukNo,
      status: data.status,
      platforms: Array.isArray(data.platforms) ? data.platforms : undefined,
      federations: Array.isArray(data.federations) ? data.federations : undefined,
    };
  }
  if (source === 'registryDernekler') {
    // Adresten il/ilçe/mahalle her zaman türet — kütükte alan boşsa adresten doldur.
    const parsed = parseAddress(data.adres);
    return {
      id: doc.id,
      name: data.name || '',
      shortName: data.kisaAd,
      type: 'Dernek',
      city: data.il || parsed.city,
      district: data.ilce || parsed.district,
      neighborhood: data.mahalle || parsed.neighborhood,
      phone: data.telefon1 || data.phone,
      phone2: data.telefon2 || data.phone2,
      email: data.ePosta || data.email,
      website: data.webSite || data.website,
      address: data.adres,
      faaliyetAlani: data.faaliyetAlani,
      detayliFaaliyetAlani: data.detayliFaaliyetAlani,
      kutukNo: data.kutukNo,
      kurulusTarihi: data.kurulusTarihi,
      status: data.status,
      isKamuYarari: data.isKamuYarari === true,
      kamuYariNo: data.kamuYariNo,
      kamuYariTarihi: data.kamuYariTarihi,
      platforms: Array.isArray(data.platforms) ? data.platforms : undefined,
      federations: Array.isArray(data.federations) ? data.federations : undefined,
    };
  }
  const parsed = parseAddress(data.address || data.adres);
  return {
    id: doc.id,
    name: data.name || '',
    shortName: data.shortName,
    type: data.type,
    city: data.city || parsed.city,
    district: data.district || parsed.district,
    neighborhood: data.neighborhood || parsed.neighborhood,
    phone: data.phone,
    phone2: data.phone2,
    email: data.email,
    etebligat: data.etebligat,
    website: data.website,
    address: data.address,
    status: data.status,
    faaliyetAlani: data.faaliyetAlani,
    platforms: Array.isArray(data.platforms) ? data.platforms : undefined,
    federations: Array.isArray(data.federations) ? data.federations : undefined,
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
  const search = (searchParams.get('search') || '').toLocaleLowerCase('tr').trim();
  const city = searchParams.get('city') || null;
  // İl PREFIX (indexli where için): dropdown il'inin İLK KELİMESİNİN ilk ~5 harfi.
  // "Afyonkarahisar"→"Afyon" (veri "Afyon" prefix'iyle eşleşir), "İstanbul"→"İstan"
  // (veri "İstanbul (Avrupa)" ile eşleşir). Case KORUNUR — veri "Afyon" büyük A ile.
  // Firestore il>=prefix AND il<=prefix+ aralığı bu ortak kökü yakalar.
  const cityPrefix = city ? city.trim().split(/\s+/)[0].slice(0, 5) : null;
  // İlçe + Mahalle server-side post-filter (index gerekmez; il where ile daralan
  // sonuç kümesi üzerinde bellek-içi diakritik-duyarsız eşleşme).
  const district = nrm(searchParams.get('district') || '') || null;
  const mahalle = nrm(searchParams.get('mahalle') || '') || null;
  const emailOnly = searchParams.get('emailOnly') === 'true';
  const phoneOnly = searchParams.get('phoneOnly') === 'true';
  // Default: aktif kayıtlar gösterilir (status != 'unsubscribed').
  // showUnsubscribed=true → sadece listeden çıkanlar gösterilir.
  const showUnsubscribed = searchParams.get('showUnsubscribed') === 'true';
  // Sadece Kamu Yararına Çalışan Dernekler (326 doc) — server-side filter.
  const kamuYarariOnly = searchParams.get('kamuYarariOnly') === 'true';
  // Platform / Federasyon — array-contains (tek-alan otomatik index, composite gerekmez).
  const platform = searchParams.get('platform') || null;
  const federation = searchParams.get('federation') || null;
  const arrField: 'platforms' | 'federations' | null = platform ? 'platforms' : federation ? 'federations' : null;
  const arrVal = platform || federation;
  // Faaliyet alanı (+ detaylı) ve kuruluş yılı aralığı — post-filter.
  const faaliyet = nrm(searchParams.get('faaliyet') || '') || null;
  const foundedFrom = parseInt(searchParams.get('foundedFrom') || '', 10) || null;
  const foundedTo = parseInt(searchParams.get('foundedTo') || '', 10) || null;
  // Tür filtresi (SporKulübü, Federasyon, GencSporMudurlugu…) — virgülle çoklu.
  // ÖNCE client-side'daydı → server pagination ile "sonuç bulmuyor" hatası
  // yaratıyordu; artık server-side post-filter (kesin ve tam sonuç).
  const typeSet = (() => {
    const raw = (searchParams.get('type') || '').trim();
    return raw ? new Set(raw.split(',').map((t) => t.trim()).filter(Boolean)) : null;
  })();

  const db = getAdminFirestore();
  let q: FirebaseFirestore.Query = db.collection(source);

  // Source-specific filters
  // KRİTİK: search varsa Firestore PREFIX query kullan (nameLower >= search
  // AND nameLower < search + ''). 100K dernek arasında 100 batch'lik
  // client-side post-filter ile bulamıyorduk — server-side prefix indekslemesi
  // ile native search.
  const searchPrefix = search.trim();
  // İçerikten arama: EN NADİR kelimeyi searchPrefixes (kelime-öneki) array-contains
  // ile getir, sonra TÜM kelimeleri folded AND-substring ile doğrula. Böylece
  // "sosyal fayda" → nadir olan "fayda" ile küçük küme çekilir, "sosyal" post-
  // filter'da doğrulanır. "ormancı" → "...Ormancılar..." de bulunur.
  const searchFold = nrm(search);
  const searchTokensArr = searchFold.split(/\s+/).filter(Boolean);
  const candidateTokens = searchTokensArr.filter((t) => t.length >= 2);
  // GENEL çözüm (stop-word listesine bağlı DEĞİL): her aday token için gerçek
  // yaygınlığı count() ile ölç (doküman okumaz, ucuz), EN AZ sonuç getireni seç.
  // "sosyal"=binlerce, "fayda"=onlarca → otomatik "fayda" seçilir. Bu her arama
  // için (gençlik/çevre/kadın… fark etmez) doğru davranır.
  let searchToken = '';
  if (candidateTokens.length === 1) {
    searchToken = candidateTokens[0];
  } else if (candidateTokens.length > 1) {
    // En fazla 4 token için count karşılaştır (arama genelde 1-3 kelime).
    const probe = candidateTokens.slice(0, 4);
    const counts = await Promise.all(
      probe.map(async (tok) => {
        try {
          const c = await db.collection(source).where('searchPrefixes', 'array-contains', tok).count().get();
          return { tok, n: c.data().count };
        } catch { return { tok, n: Number.MAX_SAFE_INTEGER }; }
      }),
    );
    // En az sonuçlu (en nadir) token → en küçük, en isabetli array-contains kümesi.
    counts.sort((a, b) => a.n - b.n);
    searchToken = counts[0]?.tok || probe.reduce((a, b) => (b.length > a.length ? b : a), '');
  }
  // 2+ harf token-search (searchPrefixes array-contains) kullanır — kısa
  // aramalar da (örn. "tv", "ak") isabetli sonuç bulur; 1 harf prefix'e düşer.
  const useTokenSearch = searchToken.length >= 2;
  if (arrField && arrVal) {
    // Platform/Federasyon seçili: array-contains ile sorgula (sonuç küçük);
    // city/search/kamu/faaliyet/yıl bellek-içi post-filter, __name__ sırası.
    q = q.where(arrField, 'array-contains', arrVal);
  } else if (useTokenSearch) {
    q = q.where('searchPrefixes', 'array-contains', searchToken);
  } else if (source === 'registryVakiflar' || source === 'registryDernekler') {
    // Öncelik: searchPrefix (nameLower range) > il PREFIX (il range) > sıralı.
    // İl PREFIX where (indexli, hızlı, timeout yok): dropdown "Afyonkarahisar" →
    // ilk kelime "Afyon" ile prefix; veri "Afyon"/"Afyonkarahisar" ne yazılırsa
    // yakalar. Firestore tek alanda range → searchPrefix VARSA il post-filter'a düşer.
    if (source === 'registryDernekler' && kamuYarariOnly) q = q.where('isKamuYarari', '==', true);
    if (searchPrefix) {
      q = q.where('nameLower', '>=', searchPrefix).where('nameLower', '<=', searchPrefix + '').orderBy('nameLower');
    } else if (cityPrefix) {
      q = q.where('il', '>=', cityPrefix).where('il', '<=', cityPrefix + '').orderBy('il');
    } else {
      q = q.orderBy('nameLower');
    }
  } else {
    // outreachContacts: city/ilçe/mahalle/faaliyet vb. hepsi post-filter (index-free).
    q = q.orderBy('createdAt', 'desc');
  }
  // İl prefix where uygulandıysa post-filter'da il tekrar süzülmez (çift-eleme yok).
  const cityWhereApplied = !!cityPrefix && !searchPrefix && !arrField && !useTokenSearch
    && (source === 'registryVakiflar' || source === 'registryDernekler');

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
  const postFilterActive = emailOnly || phoneOnly || !!search || !!district || !!mahalle || !!arrField || !!faaliyet || !!foundedFrom || !!foundedTo || !!typeSet || (!!city && !cityWhereApplied);
  // Seyrek post-filter kombinasyonlarında (il+faaliyet+platform) sayfayı
  // doldurmak için daha büyük batch + daha çok tur. 100K derneği tararken bile
  // makul kalması için toplam taranan doc bütçesiyle sınırlanır (scanBudget).
  const perFetch = postFilterActive ? MAX_LIMIT : baseLimit;
  const maxIter = postFilterActive ? 60 : 5;
  // Toplam taranacak doc tavanı — "sonuç yok gibi görünüp aslında var" sorununu
  // çözer: bu tavana kadar aramaya devam eder (60 × 1000 = 60K doc).
  const scanBudget = postFilterActive ? 60_000 : baseLimit * 5;

  for (let iter = 0; iter < maxIter && finalRows.length < baseLimit && fetched < scanBudget; iter++) {
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
      if (phoneOnly && !row.phone) continue;
      if (typeSet && !typeSet.has(row.type || '')) continue;
      if (district && !(nrm(row.district).includes(district) || nrm(row.address).includes(district))) continue;
      if (mahalle && !(nrm(row.neighborhood).includes(mahalle) || nrm(row.address).includes(mahalle))) continue;
      if (searchTokensArr.length) {
        const hay = `${nrm(row.name)} ${nrm(row.shortName || '')} ${nrm(row.address)}`;
        if (!searchTokensArr.every((tok) => hay.includes(tok))) continue;
      }
      // İl ESNEK eşleşme (çift-yön prefix + adresten yedek): veri "Afyon" iken
      // dropdown "Afyonkarahisar", ya da veri "İstanbul (Avrupa)" iken dropdown
      // "İstanbul" olsa bile eşleşsin. Biri diğerinin başında geçiyorsa yeter.
      // İl: where PREFIX uygulandıysa (cityWhereApplied) tekrar süzme. Aksi halde
      // (outreach/search/platform modu) esnek eşleşme — biri diğerinin başında.
      if (city && !cityWhereApplied) {
        const c = nrm(city);
        const rc = nrm(row.city);
        const ra = nrm(row.address);
        const cityMatch = !!c && (
          rc === c || rc.startsWith(c) || (c.startsWith(rc) && rc.length >= 3) ||
          rc.includes(c) || (!!ra && ra.includes(c))
        );
        if (!cityMatch) continue;
      }
      if (kamuYarariOnly && arrField && !row.isKamuYarari) continue;
      if (faaliyet && !(nrm(row.faaliyetAlani).includes(faaliyet) || nrm(row.detayliFaaliyetAlani).includes(faaliyet))) continue;
      if (foundedFrom || foundedTo) {
        const y = yearOf(row);
        if (!y || (foundedFrom && y < foundedFrom) || (foundedTo && y > foundedTo)) continue;
      }
      finalRows.push(row);
      if (finalRows.length >= baseLimit) break;
    }
    lastCursorDoc = snap.docs[snap.docs.length - 1];
    if (snap.docs.length < perFetch) break; // sonuna geldik
  }

  // KRİTİK cursor mantığı (post-filter'da atlama/tekrar önlenir):
  //  - Post-filter AKTİF: cursor = son TARANAN doc (lastCursorDoc). Böylece
  //    sonraki sayfa, elenen doc'ları TEKRAR taramaz, tam kaldığı yerden devam
  //    eder. (finalRows son id'si kullanılsaydı aradaki taranmış doc'lar yeniden
  //    taranır → yavaşlık + olası tekrar.)
  //  - Post-filter YOK (native sıralı sorgu): son döndürülen row id yeterli.
  //  - Sayfa dolmadıysa (finalRows < baseLimit) daha fazla yok → cursor null.
  const pageFull = finalRows.length >= baseLimit;
  let nextCursor: string | null = null;
  if (pageFull) {
    nextCursor = postFilterActive
      ? (lastCursorDoc?.id ?? finalRows[finalRows.length - 1].id)
      : finalRows[finalRows.length - 1].id;
  }

  return NextResponse.json({
    rows: finalRows,
    nextCursor,
    fetched,
  });
}
