/**
 * Şeffaflık endeksi — TEK KAYNAK yardımcıları.
 *
 * Kriter TANIMLARI (ad, puan, tür, seçenekler) `transparencyCriteria` Firestore
 * koleksiyonunda yönetilir (super-admin "Endeks Maddeleri"). STK'ların doldurduğu
 * VERİ (tamamlanma, belge/link/metin/seçim, onay durumu) `transparency/{adminUid}`
 * doc'unda kriter id'sine göre tutulur.
 *
 * Tüm yüzeyler (STK doldurma ekranı, super-admin editör, kamu profili) ve skor
 * rota'ları kriter tanımlarını CANLI bu koleksiyondan okur; bu sayede bir maddenin
 * adı/puanı değişince ya da madde eklenince/çıkınca her yerde anında yansır ve
 * puanlar koleksiyon üzerinden yeniden hesaplanır.
 *
 * Bu modül saf TS'dir (Firebase importu yok) — hem client hem Admin SDK rotaları
 * import edebilir.
 */

export type CriterionType = 'document' | 'link' | 'text' | 'document-link' | 'multi-select';

/** Bir şeffaflık kriterinin TANIMI (transparencyCriteria koleksiyonundan). */
export interface CriterionDef {
  id: string;
  name: string;
  points: number;
  type: CriterionType;
  options?: string[];
  order: number;
  description?: string;
}

/** STK'nın bir kritere girdiği VERİ + render için birleşik öğe. */
export interface CriteriaItem {
  id: string;
  name: string;
  points: number;
  type: CriterionType;
  options?: string[];
  description?: string;
  isCompleted?: boolean;
  status?: 'pending' | 'approved';
  fileName?: string;
  fileUrl?: string;
  storagePath?: string;
  linkUrl?: string;
  textValue?: string;
  selectedOptions?: string[];
  updatedAt?: string;
}

export const TRANSPARENCY_MEMBERSHIP_OPTIONS = [
  'Afet Platformu', 'Açık Açık', 'Tüsev', 'Adım Adım', 'Ability Pool',
  'HelpSteps', 'Candid', 'Goodstack', 'GlobalGiving', 'Fonzip', 'Global Compact', 'Idealist', 'www.gonulluyuzbiz.gov.tr',
  'TGSP', 'Diğer',
];

/**
 * Varsayılan 14 kriter. Koleksiyon boşken yedek olarak kullanılır VE super-admin
 * "Standart maddeleri yükle" dediğinde bu id'lerle (1..14) seed edilir. Mevcut STK
 * verisi numeric id 1-14 taşıdığından bu id'ler korunarak veri kaybı önlenir.
 */
export const DEFAULT_CRITERIA: CriterionDef[] = [
  { id: '1', name: 'Faaliyet Belgesi', points: 10, type: 'document', order: 1 },
  { id: '2', name: 'Tüzük / Vakıf Senedi', points: 10, type: 'document', order: 2 },
  { id: '3', name: 'Yönetim Kurulu Listesi', points: 5, type: 'document-link', order: 3 },
  { id: '4', name: 'Yıllık Faaliyet Raporu', points: 10, type: 'document-link', order: 4 },
  { id: '5', name: 'Finansal Tablolar', points: 10, type: 'document-link', order: 5 },
  { id: '6', name: 'Bağımsız Denetim Raporu', points: 10, type: 'document-link', order: 6 },
  { id: '7', name: 'Etki Raporu', points: 10, type: 'document-link', order: 7 },
  { id: '8', name: 'Web Sitesi', points: 5, type: 'link', order: 8 },
  { id: '9', name: 'Posta Adresi', points: 5, type: 'text', order: 9 },
  { id: '10', name: 'Ofis Adresi', points: 5, type: 'text', order: 10 },
  { id: '11', name: 'E-posta Adresi', points: 5, type: 'text', order: 11 },
  { id: '12', name: 'Telefon Numarası', points: 5, type: 'text', order: 12 },
  { id: '13', name: 'Açık Açık Üyeliği', points: 5, type: 'link', order: 13 },
  { id: '14', name: 'Afet Platformu Üyeliği', points: 5, type: 'multi-select', options: TRANSPARENCY_MEMBERSHIP_OPTIONS, order: 14 },
];

type RawCriterion = {
  id: string | number;
  name?: string;
  points?: number | string;
  type?: string;
  options?: string[];
  order?: number;
  description?: string;
};

const VALID_TYPES: CriterionType[] = ['document', 'link', 'text', 'document-link', 'multi-select'];

/**
 * Ham koleksiyon doc'larını normalize edilmiş, sıralı CriterionDef listesine çevirir.
 * Koleksiyon boşsa DEFAULT_CRITERIA döner (seed öncesi davranış bozulmaz).
 */
export function normalizeDefs(raw?: RawCriterion[] | null): CriterionDef[] {
  if (!raw || raw.length === 0) return DEFAULT_CRITERIA;
  return raw
    .map((c, i): CriterionDef => ({
      id: String(c.id),
      name: c.name || '',
      points: Number(c.points) || 0,
      type: VALID_TYPES.includes(c.type as CriterionType) ? (c.type as CriterionType) : 'document',
      options: Array.isArray(c.options) ? c.options : undefined,
      order: typeof c.order === 'number' ? c.order : i,
      description: c.description,
    }))
    .sort((a, b) => (a.order - b.order) || a.id.localeCompare(b.id));
}

type RawSubmission = (Partial<CriteriaItem> & { id: string | number }) | undefined;

/** Kayıtlı STK verisini id → veri haritasına çevirir (id string normalize). */
export function submissionMap(items?: RawSubmission[] | null): Map<string, Partial<CriteriaItem>> {
  const m = new Map<string, Partial<CriteriaItem>>();
  (items || []).forEach((it) => { if (it) m.set(String(it.id), { ...it, id: String(it.id) }); });
  return m;
}

/**
 * Kriter tanımları + STK verisini birleştirip render edilebilir CriteriaItem[] döner.
 * Ad/puan/tür/seçenek TANIMDAN; tamamlanma/belge/link/metin/durum VERİDEN gelir.
 */
export function mergeCriteria(defs: CriterionDef[], saved?: RawSubmission[] | null): CriteriaItem[] {
  const subs = submissionMap(saved);
  return defs.map((d): CriteriaItem => {
    const s = subs.get(d.id) || {};
    return {
      id: d.id,
      name: d.name,
      points: d.points,
      type: d.type,
      options: d.options,
      description: d.description,
      isCompleted: s.isCompleted,
      status: s.status,
      fileName: s.fileName,
      fileUrl: s.fileUrl,
      storagePath: s.storagePath,
      linkUrl: s.linkUrl,
      textValue: s.textValue,
      selectedOptions: s.selectedOptions,
      updatedAt: s.updatedAt,
    };
  });
}

/**
 * STK PROFİLİNDEKİ bilgilerin şeffaflık kriterlerine yansıması.
 *
 * Profildeki bilgiler (web sitesi, e-posta, telefon, adres, üyelikler) ilgili
 * kriterleri OTOMATİK karşılar — STK'nın ayrıca panele girmesine gerek kalmaz.
 * Böylece profildeki bilgiler puantaja yansır. Belge kriterleri (Faaliyet Belgesi,
 * Tüzük, raporlar, denetim) profilden türetilemez; yükleme+onay gerektirir.
 */
export interface NgoProfileLike {
  contact?: {
    website?: string; email?: string; phone?: string;
    address?: string | { fullAddress?: string; city?: string; district?: string };
    social?: { instagram?: string; twitter?: string; facebook?: string; linkedin?: string };
  };
  website?: string;
  memberOf?: string[];
  federations?: string[];
}

const nn = (v: unknown) => (v !== undefined && v !== null && String(v).trim() !== '' ? String(v).trim() : '');

/** Bir kriterin profil karşılığını döndürür (varsa değer, yoksa ''). İsimle eşleşir (yeniden adlandırmaya dayanıklı). */
export function profileValueForCriterion(def: CriterionDef, ngo: NgoProfileLike): string {
  const n = (def.name || '').toLocaleLowerCase('tr-TR').replace(/i̇/g, 'i');
  const c = ngo.contact || {};
  const addr = typeof c.address === 'string'
    ? c.address
    : nn(c.address?.fullAddress) || [nn(c.address?.city), nn(c.address?.district)].filter(Boolean).join(' ');
  const mem = [...(ngo.memberOf || []), ...(ngo.federations || [])].map((x) => String(x).toLocaleLowerCase('tr-TR'));
  if (/web ?sitesi|web ?site|website|web adres/.test(n)) return nn(c.website) || nn(ngo.website);
  if (/e-?posta|e-?mail|\bmail\b/.test(n)) return nn(c.email);
  if (/telefon|phone|gsm|cep/.test(n)) return nn(c.phone);
  if (/posta adres|yazışma adres/.test(n)) return nn(addr);
  if (/ofis adres|merkez adres|^adres|\badres\b/.test(n)) return nn(addr);
  if (/açık açık/.test(n)) return mem.some((m) => m.includes('açık açık')) ? 'Açık Açık' : '';
  if (/afet platform/.test(n)) return mem.some((m) => m.includes('afet')) ? 'Afet Platformu' : '';
  return '';
}

/**
 * Profilden otomatik karşılanan kriterler için "onaylı" gönderim öğeleri üretir.
 * (isCompleted + status:'approved' — anında puana sayılır.)
 */
export function deriveProfileSubmissions(defs: CriterionDef[], ngo?: NgoProfileLike | null): Array<Partial<CriteriaItem> & { id: string; auto: true }> {
  if (!ngo) return [];
  const out: Array<Partial<CriteriaItem> & { id: string; auto: true }> = [];
  for (const d of defs) {
    const v = profileValueForCriterion(d, ngo);
    if (v) out.push({ id: d.id, isCompleted: true, status: 'approved', textValue: v, linkUrl: /link/.test(d.type) ? v : undefined, auto: true });
  }
  return out;
}

/**
 * STK'nın yüklediği veri + profilden türetilen otomatik veriyi birleştirir.
 * STK'nın kendi girdiği (yüklediği/onaylı) veri ÖNCELİKLİdir; profil yalnız boş
 * kalan kriterleri otomatik karşılar.
 */
export function mergeWithProfile(
  defs: CriterionDef[],
  saved?: RawSubmission[] | null,
  ngo?: NgoProfileLike | null,
): Array<Partial<CriteriaItem> & { id: string }> {
  const savedMap = submissionMap(saved);
  const derived = deriveProfileSubmissions(defs, ngo);
  const out: Array<Partial<CriteriaItem> & { id: string }> = [];
  const seen = new Set<string>();
  for (const [id, item] of savedMap) { out.push({ ...item, id }); seen.add(id); }
  for (const d of derived) {
    const existing = savedMap.get(d.id);
    // STK zaten tamamlamışsa profil ezmesin; değilse profil otomatik karşılasın.
    if (existing?.isCompleted) continue;
    if (seen.has(d.id)) { const i = out.findIndex((x) => x.id === d.id); if (i >= 0) out[i] = d; }
    else { out.push(d); seen.add(d.id); }
  }
  return out;
}

/**
 * Skoru kriter TANIMLARI üzerinden hesaplar (puanlar koleksiyondan, veri STK'dan).
 * requireApproved=true ise yalnız status !== 'pending' (onaylı) maddeler sayılır.
 */
export function computeScore(
  defs: CriterionDef[],
  saved?: RawSubmission[] | null,
  opts?: { requireApproved?: boolean },
): { met: number; total: number; percent: number } {
  const subs = submissionMap(saved);
  const total = defs.reduce((s, d) => s + (Number(d.points) || 0), 0);
  const met = defs.reduce((s, d) => {
    const sub = subs.get(d.id);
    const done = !!sub?.isCompleted && (!opts?.requireApproved || sub.status !== 'pending');
    return s + (done ? (Number(d.points) || 0) : 0);
  }, 0);
  const percent = total > 0 ? Math.round((met / total) * 100) : 0;
  return { met, total, percent };
}
