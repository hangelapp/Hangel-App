/**
 * Affiliate Onay Senkron Robotu (affiliateApprovalSync).
 *
 * Schedule: her gün 06:00 Europe/Istanbul.
 *
 * Ne yapar:
 *   1. 3 affiliate ağını (ReklamAction, Affocean, GelirOrtaklari) HasOffers
 *      Affiliate_Offer.findAll ile tarar; her offer için approval_status,
 *      status ve payout_type alır.
 *   2. "Listelenebilir" (= Market'te kullanıcıya gösterilecek onaylı/açık satış
 *      offer'ı) kuralını uygular — `src/lib/api-clients.ts` içindeki
 *      isListableOffer ile BİREBİR aynı:
 *        • status === 'active'
 *        • payout_type === 'cpa_percentage'  (CPS/satış; cpa_flat = CPL/CPC/lead → hariç)
 *        • approval_status 'approved' VEYA boş/null  (rejected/pending → hariç)
 *   3. Önceki çalışma durumuyla (system/affiliateSyncState) karşılaştırır:
 *        • yeni onaylanıp listeye girenler
 *        • listeden çıkanlar (artık reddedilen/pasifleşen)
 *        • ağda ilk kez görülen YENİ offer'lar (yeni markalar)
 *   4. Elle eklenmiş Firestore `brands` kayıtlarını eşitler: kendi `link`'i
 *      olmayan ve onaylı bir offer ile karşılanamayan markayı `status: 'Pasif'`
 *      + `affiliateHidden: true` yapar (Market'ten düşer). Kendi linki olan ve
 *      yanlışlıkla affiliateHidden kalmış kayıtları tekrar açar.
 *   5. Raporu system/affiliateSyncReport (son durum) + affiliateSyncRuns/{tarih}
 *      (geçmiş) doc'larına yazar ve super-admin'lere bildirim düşer.
 *
 * Market listesi zaten her fetch'te isListableOffer ile canlı süzüldüğü için
 * "onaylananları göster / onaylanmayanları çıkar" anlık çalışır; bu robot ek
 * olarak elle eklenen kayıtları eşitler, yeni markaları yakalar ve raporlar.
 *
 * Region: europe-west1. Ağ API anahtarları api-clients.ts ile aynı (yeni sır değil).
 */
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { logger } from 'firebase-functions';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const REGION = 'europe-west1';
const TIMEZONE = 'Europe/Istanbul';

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
 * src/lib/affiliate-sync.ts ile birebir aynı mantık (App Hosting path'i asıl
 * çalışan olsa da iki kopya tutarlı kalmalı; bu fonksiyon deploy edilirse
 * korumayı taşımalı). 'BRAND' teknik identifier'dır; kullanıcıya "Mağaza".
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

// isListableOffer (api-clients.ts) ile birebir aynı kural: status active VE
// (approval_status='approved' VEYA require_approval=0/yok). require_approval=1 olup
// onaysız (null=pending) ya da rejected offer'lar komisyon üretmez → listelenmez.
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
      const res = await fetch(`${base}?${params.toString()}`, { headers: { Accept: 'application/json' } });
      if (!res.ok) {
        logger.error(`[affiliate-sync] ${cfg.network} HTTP ${res.status}`);
        break;
      }
      json = await res.json();
    } catch (e) {
      logger.error(`[affiliate-sync] ${cfg.network} fetch error`, e);
      break;
    }
    const resp = (json as { response?: { status?: number; data?: { data?: Record<string, unknown>; pageCount?: number } } }).response;
    if (!resp || resp.status !== 1) {
      logger.error(`[affiliate-sync] ${cfg.network} API non-success`, resp?.status);
      break;
    }
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

export const affiliateApprovalSync = onSchedule(
  { schedule: 'every day 06:00', timeZone: TIMEZONE, region: REGION, memory: '256MiB', timeoutSeconds: 300 },
  async () => {
    const db = getFirestore();

    // 1) Tüm ağları tara.
    const scans = await Promise.all(NETWORKS.map((c) => scanNetwork(c)));
    const allOffers = scans.flat();
    if (allOffers.length === 0) {
      logger.warn('[affiliate-sync] Hiç offer dönmedi — ağ hatası olabilir, çalışma atlanıyor (state korunuyor).');
      return;
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
    const removedListed = removedListedKeys.map((k) => ({ key: k, name: prevCatalog[k] || curCatalog[k] || k }));

    const firstRun = prevKnown.size === 0;

    // 4) Elle eklenmiş Firestore `brands` kayıtlarını eşitle.
    const listableNames = new Set(listable.map((o) => normName(o.name)));
    const HIDDEN_STATUSES = new Set(['Pasif', 'Silindi', 'Reddedildi']);

    // CANLI BAŞVURU KORUMASI: onaylı kurumsal başvuruları doğrudan `applications`
    // koleksiyonundan oku ve isimlerini korumalı set'e ekle. brands doc'unda
    // source/applicationId olmasa bile (eski onaylar) ad eşleşmesiyle korunur.
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
      const matchesApplication = b.name ? protectedAppNames.has(normName(b.name)) : false;
      const fromApplication = isFromApplication(b) || matchesApplication;

      // (a) kendi linki VEYA (b) onaylı offer VEYA (c) başvuru kaynaklı → yayında
      // kalır. Robot yanlışlıkla gizlemişse (affiliateHidden) geri açılır.
      if (hasOwnLink || matchesListable || fromApplication) {
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

    // 5) Rapor + state + bildirim.
    const summary = {
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
    };

    await db.doc('system/affiliateSyncReport').set(summary, { merge: false });

    // Geçmiş kaydı (tarih bazlı id — günde bir çalıştığı için çakışma yok).
    const istNow = new Date(Date.now() + 3 * 60 * 60 * 1000); // UTC+3 yaklaşık etiket
    const dateId = istNow.toISOString().slice(0, 10);
    await db.doc(`affiliateSyncRuns/${dateId}`).set(summary, { merge: false });

    await stateRef.set({
      knownOfferIds: [...curKnown],
      listedOfferIds: [...curListed],
      catalog: curCatalog,
      updatedAt: FieldValue.serverTimestamp(),
    });

    logger.info('[affiliate-sync] tamam', {
      listable: listable.length,
      newlyListed: newlyListed.length,
      removed: removedListed.length,
      newOffers: newOffers.length,
      hidden: hiddenBrands.length,
      reactivated: reactivatedBrands.length,
    });

    // İlk çalışmada "yeni" diff'i tüm katalog olur → bildirim spam'lemeyelim.
    const changed = !firstRun && (newlyListed.length || removedListed.length || newOffers.length || hiddenBrands.length || reactivatedBrands.length);
    if (!changed) return;

    // Super-admin'lere bildirim.
    const adminsSnap = await db.collection('users').where('role', '==', 'super-admin').get().catch(() => null);
    const adminIds = adminsSnap ? adminsSnap.docs.map((d) => d.id) : [];
    if (adminIds.length === 0) return;

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
  },
);
