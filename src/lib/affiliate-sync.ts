/**
 * Affiliate Onay Senkron — App Hosting (Next.js) yolu.
 *
 * functions/src/affiliate-approval-sync.ts içindeki günlük Cloud Function
 * mantığının BİREBİR portu. Cloud Function tetiklenmese bile (2026-06-26 GCP
 * incident'inden beri durdu) bu fonksiyon App Hosting üzerinde çalışan API
 * route + cron ile aynı işi yapar. Robot mantığı DEĞİŞTİRİLMEDİ — sadece
 * `onSchedule` sarmalayıcısından çıkarılıp yeniden kullanılabilir hale getirildi.
 *
 * Ne yapar (Cloud Function ile aynı):
 *   1. 3 affiliate ağını (ReklamAction, Affocean, GelirOrtaklari) HasOffers
 *      Affiliate_Offer.findAll ile tarar; approval_status, status, require_approval alır.
 *   2. isListable(o) = status active VE (approval_status='approved' VEYA require_approval=0/yok).
 *   3. system/affiliateSyncState ile diff'ler (yeni offer / listeye giren / listeden çıkan).
 *   4. Firestore `brands` kayıtlarını eşitler. Kayıt yayında KALIR eğer:
 *      (a) kendi affiliate linki var, VEYA (b) onaylı bir offer ile eşleşiyor, VEYA
 *      (c) başvuru kaynaklı (kurumsal başvuru formu / kurumun kendi eklediği).
 *      Yalnız üçü de yoksa Pasif+affiliateHidden. Yanlış gizlenen kayıt geri açılır.
 *   5. system/affiliateSyncReport + affiliateSyncRuns/{tarih} yazar; opsiyonel super-admin bildirim.
 */
import { FieldValue, type Firestore } from 'firebase-admin/firestore';

// Ağ API anahtarları api-clients.ts + Cloud Function ile aynı (yeni sır değil).
interface NetworkCfg {
  network: string;
  apiKey: string;
  agencyName: string;
}

const NETWORKS: NetworkCfg[] = [
  { network: 'reklamaction', apiKey: '2ae3a9b86708162dc059e78b6a8de2b4dee5444d13bb985b93340bdb6094bb54', agencyName: 'ReklamAction' },
  { network: 'affocean', apiKey: 'c908bda5f41405de7cbcb40a15db041e47a2fcc55358e8f44790db8ff2cfb35d', agencyName: 'Affocean' },
  { network: 'gelirortaklari', apiKey: '891bae449589572cc756b5fe93e182c527ef910c2137c7e1ea53a0a366ab9cd3', agencyName: 'GelirOrtaklari' },
];

interface ScannedOffer {
  id: string;
  network: string;
  agency: string;
  rawName: string;
  name: string; // temizlenmiş görünen ad
  approvalStatus: string; // '' = null
  status: string;
  requireApproval: string; // '0' = herkese açık (onay gerekmez)
}

// api-clients.ts cleanBrandName ile aynı mantık (ad eşleştirmesi tutarlı olsun).
function cleanBrandName(name: string): string {
  if (!name) return 'Marka';
  return name
    .replace(/\[.*?\]/g, '')
    .replace(/\(.*?\)/g, '')
    .replace(/\b(CPS|CPL|CPA|CPO|İndirim|Online|Campaign|Kampanyası|Offer|BPC)\b/gi, '')
    .replace(/(?<!\.)(\b(Sale|Mobil|TR)\b)/gi, '')
    .replace(/[-|]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function normName(name: string): string {
  return cleanBrandName(name).toLowerCase().trim();
}

/**
 * BAŞVURU KORUMASI: Bir `brands` kaydı kurumsal başvuru formundan geldiyse
 * (veya kurumun/kullanıcının kendi eklediği bir kayıtsa) affiliate offer'a hiç
 * bağlı olmasa bile robot bunu ASLA gizlemez — başvuru sahibinin mağazasıdır.
 *
 * Aşağıdaki alanlardan HERHANGI biri varsa kayıt "başvuru kaynaklı" sayılır:
 *   - source ∈ {application, basvuru, corporate-form}
 *   - applicationId dolu (başvuru referansı)
 *   - entityType === 'BRAND' + status === 'Onaylandı' (onaylı kurumsal marka/mağaza)
 *   - createdVia === 'application'
 *   - ngoId veya ownerId dolu (kurumun kendi eklediği — affiliate değil)
 */
function isFromApplication(b: {
  source?: string;
  applicationId?: string;
  entityType?: string;
  status?: string;
  createdVia?: string;
  ngoId?: string;
  ownerId?: string;
}): boolean {
  const source = (b.source || '').toLowerCase();
  if (source === 'application' || source === 'basvuru' || source === 'corporate-form') return true;
  if (typeof b.applicationId === 'string' && b.applicationId.trim().length > 0) return true;
  if (b.entityType === 'BRAND' && b.status === 'Onaylandı') return true;
  if ((b.createdVia || '').toLowerCase() === 'application') return true;
  if (typeof b.ngoId === 'string' && b.ngoId.trim().length > 0) return true;
  if (typeof b.ownerId === 'string' && b.ownerId.trim().length > 0) return true;
  return false;
}

// isListableOffer (api-clients.ts) ile birebir aynı kural.
function isListable(o: { approvalStatus: string; status: string; requireApproval: string }): boolean {
  if (o.status.toLowerCase() !== 'active') return false;
  const approved = o.approvalStatus.toLowerCase() === 'approved';
  const open = (o.requireApproval || '1') === '0';
  return approved || open;
}

async function scanNetwork(cfg: NetworkCfg): Promise<ScannedOffer[]> {
  const base = `https://${cfg.network}.api.hasoffers.com/Apiv3/json`;
  const out: ScannedOffer[] = [];
  let page = 1;
  // Sonsuz döngü guard'ı (ağ pageCount döndürmezse).
  for (let guard = 0; guard < 50; guard++) {
    const params = new URLSearchParams({
      Target: 'Affiliate_Offer',
      Method: 'findAll',
      api_key: cfg.apiKey,
      'fields[]': 'id',
      'fields[1]': 'name',
      'fields[2]': 'approval_status',
      'fields[3]': 'status',
      'fields[4]': 'require_approval',
      limit: '500',
      page: String(page),
    });
    let json: unknown;
    try {
      const res = await fetch(`${base}?${params.toString()}`, {
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      });
      if (!res.ok) break;
      json = await res.json();
    } catch {
      break;
    }
    const resp = (json as { response?: { status?: number; data?: { data?: Record<string, unknown>; pageCount?: number } } }).response;
    if (!resp || resp.status !== 1) break;
    const data = resp.data?.data;
    if (!data || typeof data !== 'object') break;
    const entries = Object.values(data) as Array<{ Offer?: { id?: string; name?: string; approval_status?: string | null; status?: string | null; require_approval?: string | number | null } }>;
    if (entries.length === 0) break;
    for (const e of entries) {
      const o = e?.Offer;
      if (!o?.id || !o.name) continue;
      out.push({
        id: String(o.id),
        network: cfg.network,
        agency: cfg.agencyName,
        rawName: o.name,
        name: cleanBrandName(o.name),
        approvalStatus: o.approval_status == null ? '' : String(o.approval_status),
        status: o.status == null ? '' : String(o.status),
        requireApproval: o.require_approval == null ? '' : String(o.require_approval),
      });
    }
    const pageCount = resp.data?.pageCount ?? 1;
    if (page >= pageCount || entries.length < 500) break;
    page += 1;
  }
  return out;
}

export interface NetworkTotal {
  network: string;
  agency: string;
  scanned: number;
  listable: number;
}

export interface OfferRef {
  id: string;
  network: string;
  agency: string;
  name: string;
}

export interface RemovedOffer {
  key: string;
  name: string;
}

/**
 * runAffiliateSync dönüşü. Manuel "Şimdi Çalıştır" ve cron aynı özeti alır.
 * `skipped` yalnız ağdan hiç offer dönmediğinde true olur (state korunur).
 */
export interface SyncSummary {
  skipped?: boolean;
  firstRun: boolean;
  totals: {
    scanned: number;
    listable: number;
    excluded: number;
    byNetwork: NetworkTotal[];
  };
  newlyListed: OfferRef[];
  removedFromList: RemovedOffer[];
  newOffers: Array<OfferRef & { listable: boolean }>;
  hiddenBrands: string[];
  reactivatedBrands: string[];
  /** Başvuru formundan gelen / kurumun kendi eklediği için gizlenmekten korunan kayıt sayısı. */
  protectedByApplication: number;
}

export interface RunOptions {
  /** Değişiklik varsa super-admin'lere bildirim düşer (cron için true, manuel için false). */
  notifySuperAdmins?: boolean;
}

/**
 * Affiliate onay senkronunu çalıştırır. functions/src/affiliate-approval-sync.ts
 * ile birebir aynı mantık; farkı: (a) `db` dışarıdan verilir, (b) SyncSummary döner,
 * (c) bildirim opsiyonel.
 */
export async function runAffiliateSync(db: Firestore, options: RunOptions = {}): Promise<SyncSummary> {
  const { notifySuperAdmins = false } = options;

  // 1) Tüm ağları tara.
  const scans = await Promise.all(NETWORKS.map((c) => scanNetwork(c)));
  const allOffers = scans.flat();

  if (allOffers.length === 0) {
    // Ağ hatası olabilir — state'i BOZMA, çalışmayı atla.
    return {
      skipped: true,
      firstRun: false,
      totals: { scanned: 0, listable: 0, excluded: 0, byNetwork: [] },
      newlyListed: [],
      removedFromList: [],
      newOffers: [],
      hiddenBrands: [],
      reactivatedBrands: [],
      protectedByApplication: 0,
    };
  }

  const listable = allOffers.filter(isListable);
  const key = (o: ScannedOffer) => `${o.network}:${o.id}`;

  // 2) Önceki durum.
  const stateRef = db.doc('system/affiliateSyncState');
  const prev = (await stateRef.get()).data() || {};
  const prevKnown = new Set<string>(Array.isArray(prev.knownOfferIds) ? prev.knownOfferIds : []);
  const prevListed = new Set<string>(Array.isArray(prev.listedOfferIds) ? prev.listedOfferIds : []);
  const prevCatalog: Record<string, string> = (prev.catalog && typeof prev.catalog === 'object') ? prev.catalog : {};

  const curKnown = new Set(allOffers.map(key));
  const curListed = new Set(listable.map(key));
  const curCatalog: Record<string, string> = {};
  for (const o of allOffers) curCatalog[key(o)] = o.name;

  // 3) Diff.
  const newOffers = allOffers.filter((o) => !prevKnown.has(key(o)));
  const newlyListed = listable.filter((o) => !prevListed.has(key(o)));
  const removedListedKeys = [...prevListed].filter((k) => !curListed.has(k));
  const removedListed: RemovedOffer[] = removedListedKeys.map((k) => ({ key: k, name: prevCatalog[k] || curCatalog[k] || k }));

  const firstRun = prevKnown.size === 0;

  // 4) Firestore `brands` kayıtlarını eşitle.
  //
  //    YAYINDA KALMA KURALI (3 koşuldan HERHANGI biri yeterli):
  //      (a) kaydın kendi affiliate linki var (hasOwnLink), VEYA
  //      (b) onaylı bir affiliate offer ile ad eşleşiyor (matchesListable), VEYA
  //      (c) BAŞVURU KAYNAKLI — kurumsal başvuru formundan gelmiş / kurumun kendi
  //          eklediği kayıt (isFromApplication). Bu kayıtlar affiliate'a bağlı
  //          olmasa bile başvuru sahibinin mağazasıdır → robot dokunmaz.
  //
  //    Yalnızca "ne ajansta onaylı, ne başvurudan gelmiş" kayıtlar gizlenir
  //    (kendi linki YOK + onaylı offer YOK + başvuru kaynaklı DEĞİL).
  const listableNames = new Set(listable.map((o) => normName(o.name)));
  const HIDDEN_STATUSES = new Set(['Pasif', 'Silindi', 'Reddedildi']);

  // CANLI BAŞVURU KORUMASI (en güvenli kat): onaylı kurumsal başvuruları doğrudan
  // `applications` koleksiyonundan oku ve isimlerini "korumalı mağaza" set'ine ekle.
  // Böylece brands doc'unda `source`/`applicationId` alanı OLMASA bile (bu alanlar
  // ancak bugünden sonraki onaylarda yazılıyor; eski onaylı mağazalar taşımıyor)
  // ad eşleşmesiyle koruma garanti edilir. 'BRAND' teknik identifier'dır; kullanıcıya
  // "Mağaza" olarak gösterilir. Query hatasında (index vb.) koruma set'i boş kalır —
  // doc-alanı tabanlı isFromApplication() ikinci kat olarak devrede kalmaya devam eder.
  const protectedAppNames = new Set<string>();
  const appsSnap = await db
    .collection('applications')
    .where('entityType', '==', 'BRAND')
    .where('status', '==', 'Onaylandı')
    .get()
    .catch(() => null);
  if (appsSnap) {
    for (const appDoc of appsSnap.docs) {
      const a = appDoc.data() as { name?: string; org?: string };
      const appName = a.name || a.org || '';
      if (appName) protectedAppNames.add(normName(appName));
    }
  }

  const brandsSnap = await db.collection('brands').get();
  const hiddenBrands: string[] = [];
  const reactivatedBrands: string[] = [];
  let protectedByApplication = 0;

  for (const docSnap of brandsSnap.docs) {
    const b = docSnap.data() as {
      name?: string;
      link?: string;
      status?: string;
      affiliateHidden?: boolean;
      source?: string;
      applicationId?: string;
      entityType?: string;
      createdVia?: string;
      ngoId?: string;
      ownerId?: string;
    };
    const name = b.name || '(isimsiz)';
    const hasOwnLink = typeof b.link === 'string' && b.link.trim().length > 0;
    const matchesListable = b.name ? listableNames.has(normName(b.name)) : false;
    // Başvuru kaynaklı: (i) doc alanları (source/applicationId/... — isFromApplication)
    // VEYA (ii) canlı applications sorgusuyla ad eşleşmesi (eski onaylar için).
    const matchesApplication = b.name ? protectedAppNames.has(normName(b.name)) : false;
    const fromApplication = isFromApplication(b) || matchesApplication;

    // (a) kendi linki VEYA (b) onaylı offer VEYA (c) başvuru kaynaklı → yayında kalır.
    // Robot yanlışlıkla gizlemişse (affiliateHidden) hepsi geri açılır.
    if (hasOwnLink || matchesListable || fromApplication) {
      if (fromApplication && !hasOwnLink && !matchesListable) protectedByApplication += 1;
      if (b.affiliateHidden === true) {
        await docSnap.ref.update({
          affiliateHidden: FieldValue.delete(),
          affiliateHiddenReason: FieldValue.delete(),
          affiliateHiddenAt: FieldValue.delete(),
          status: 'Onaylandı',
          affiliateReactivatedAt: FieldValue.serverTimestamp(),
        });
        reactivatedBrands.push(name);
      }
      continue;
    }

    // Ne kendi linki, ne onaylı offer, ne de başvuru kaynağı var → yayından kaldır.
    const alreadyAdminHidden = b.status ? HIDDEN_STATUSES.has(b.status) && b.affiliateHidden !== true : false;
    if (alreadyAdminHidden) continue; // admin elle gizlemiş, dokunma.
    if (b.affiliateHidden === true) continue; // zaten robot gizlemiş, churn yok.

    await docSnap.ref.update({
      status: 'Pasif',
      affiliateHidden: true,
      affiliateHiddenReason: 'Onaylı affiliate offer bulunamadı (link yok, başvuru kaydı değil)',
      affiliateHiddenAt: FieldValue.serverTimestamp(),
    });
    hiddenBrands.push(name);
  }

  // 5) Rapor + state + (opsiyonel) bildirim.
  // Firestore'a yazılan sürüm serverTimestamp içerir; döndürülen SyncSummary temiz JSON.
  const summaryForStore = {
    runAt: FieldValue.serverTimestamp(),
    firstRun,
    totals: {
      scanned: allOffers.length,
      listable: listable.length,
      excluded: allOffers.length - listable.length,
      byNetwork: NETWORKS.map((c) => ({
        network: c.network,
        agency: c.agencyName,
        scanned: allOffers.filter((o) => o.network === c.network).length,
        listable: listable.filter((o) => o.network === c.network).length,
      })),
    },
    newlyListed: newlyListed.map((o) => ({ id: o.id, network: o.network, agency: o.agency, name: o.name })),
    removedFromList: removedListed,
    newOffers: newOffers.map((o) => ({ id: o.id, network: o.network, agency: o.agency, name: o.name, listable: isListable(o) })),
    hiddenBrands,
    reactivatedBrands,
    protectedByApplication,
  };

  await db.doc('system/affiliateSyncReport').set(summaryForStore, { merge: false });

  // Geçmiş kaydı (tarih bazlı id — UTC+3 yaklaşık etiket).
  const istNow = new Date(Date.now() + 3 * 60 * 60 * 1000);
  const dateId = istNow.toISOString().slice(0, 10);
  await db.doc(`affiliateSyncRuns/${dateId}`).set(summaryForStore, { merge: false });

  await stateRef.set({
    knownOfferIds: [...curKnown],
    listedOfferIds: [...curListed],
    catalog: curCatalog,
    updatedAt: FieldValue.serverTimestamp(),
  });

  // İlk çalışmada "yeni" diff'i tüm katalog olur → bildirim spam'lemeyelim.
  const changed = !firstRun && (newlyListed.length || removedListed.length || newOffers.length || hiddenBrands.length || reactivatedBrands.length);

  if (notifySuperAdmins && changed) {
    const adminsSnap = await db.collection('users').where('role', '==', 'super-admin').get().catch(() => null);
    const adminIds = adminsSnap ? adminsSnap.docs.map((d) => d.id) : [];
    if (adminIds.length > 0) {
      const parts: string[] = [];
      if (newlyListed.length) parts.push(`✅ ${newlyListed.length} yeni onaylı marka listeye girdi`);
      if (newOffers.length) parts.push(`🆕 ${newOffers.length} yeni offer`);
      if (removedListed.length) parts.push(`❌ ${removedListed.length} marka listeden çıktı`);
      if (hiddenBrands.length) parts.push(`🙈 ${hiddenBrands.length} elle eklenen marka gizlendi`);
      if (reactivatedBrands.length) parts.push(`🔓 ${reactivatedBrands.length} marka yeniden açıldı`);
      const body = `${parts.join(' · ')}. Toplam ${listable.length} onaylı marka listeleniyor.`;

      const batch = db.batch();
      for (const uid of adminIds) {
        const ref = db.collection('notifications').doc();
        batch.set(ref, {
          userId: uid,
          type: 'system',
          title: 'Affiliate onay senkronu',
          body,
          data: { link: '/super-admin', affiliateSync: true },
          read: false,
          createdAt: FieldValue.serverTimestamp(),
          createdBy: 'affiliate-approval-sync',
        });
      }
      await batch.commit();
    }
  }

  // Döndürülen özet serverTimestamp içermez (JSON-serileştirilebilir).
  return {
    firstRun,
    totals: summaryForStore.totals,
    newlyListed: summaryForStore.newlyListed,
    removedFromList: summaryForStore.removedFromList,
    newOffers: summaryForStore.newOffers,
    hiddenBrands,
    reactivatedBrands,
    protectedByApplication,
  };
}
