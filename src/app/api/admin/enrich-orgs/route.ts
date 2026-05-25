import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { requireSuperAdmin } from '@/lib/messaging/server-auth';
import { COLLECTIONS } from '@/firebase/collections';
import { extractContact, normalizeName, levenshtein, safeFetchText } from '@/lib/enrichment/extractors';

export const runtime = 'nodejs';
export const maxDuration = 60;

type OrgKind = 'ngo' | 'brand';
type Source = 'website' | 'registry' | 'ai' | 'commercial';

interface EnrichBody {
  kind: OrgKind;
  sources: Source[];
  offset: number;
  batchSize?: number;
  /** Limit: tüm orgs için süre güvenliği. Atlanırsa batchSize'ın iki katı kullanılır. */
  limit?: number;
}

interface OrgRow {
  id: string;
  name: string;
  type?: string;
  category?: string;
  about?: string;
  contact?: Record<string, unknown>;
  link?: string;
  kutukNo?: string;
  foundedYear?: number;
  foundationYear?: number;
  beneficiaryGroups?: string[];
  memberOf?: string[];
  federations?: string[];
  supportedSDGs?: string[];
}

interface EnrichResult {
  id: string;
  name: string;
  changes: Record<string, unknown>;
  notes: string[];
}

interface RegistryRow {
  /** Vakıf adı / Dernek adı */
  name?: string;
  fullName?: string;
  kutukNo?: string;
  foundationYear?: number;
  city?: string;
  district?: string;
  address?: string;
  type?: string;
  raw?: Record<string, unknown>;
}

// Tüm registryDernekler + registryVakiflar tek tek değil, bir kez fetch edip cache'le.
let registryCache: { byNorm: Map<string, RegistryRow>; ts: number } | null = null;
const REGISTRY_CACHE_TTL = 5 * 60_000;

async function loadRegistry(): Promise<Map<string, RegistryRow>> {
  if (registryCache && Date.now() - registryCache.ts < REGISTRY_CACHE_TTL) {
    return registryCache.byNorm;
  }
  const db = getAdminFirestore();
  const byNorm = new Map<string, RegistryRow>();
  for (const col of [COLLECTIONS.registryDernekler, COLLECTIONS.registryVakiflar]) {
    const snap = await db.collection(col).get();
    for (const d of snap.docs) {
      const r = d.data() as Record<string, unknown>;
      // CSV import şemasında alan adları değişken olabilir; en yaygınlarını dene.
      const name = (r.adi as string) || (r.adı as string) || (r.unvani as string) || (r.unvanı as string) || (r.name as string) || '';
      if (!name) continue;
      const row: RegistryRow = {
        name,
        fullName: (r.tamUnvan as string) || (r.fullName as string) || name,
        kutukNo: (r.kutukNo as string) || (r.kütükNo as string) || d.id,
        foundationYear: parseInt(String((r.kurulusYili as string) || (r.kuruluşYılı as string) || (r.foundationYear as string) || ''), 10) || undefined,
        city: (r.il as string) || (r.city as string) || '',
        district: (r.ilce as string) || (r.ilçe as string) || '',
        address: (r.adres as string) || (r.address as string) || '',
        type: col === COLLECTIONS.registryDernekler ? 'Dernek' : 'Vakıf',
        raw: r,
      };
      byNorm.set(normalizeName(name), row);
    }
  }
  registryCache = { byNorm, ts: Date.now() };
  return byNorm;
}

function matchRegistry(name: string, byNorm: Map<string, RegistryRow>): RegistryRow | null {
  const target = normalizeName(name);
  // Exact match
  const exact = byNorm.get(target);
  if (exact) return exact;
  // Tolerant: orgName ⊂ registry name, vs.
  let best: { row: RegistryRow; score: number } | null = null;
  for (const [key, row] of byNorm) {
    if (key.includes(target) || target.includes(key)) {
      const d = levenshtein(key, target);
      const score = 1 - d / Math.max(key.length, target.length);
      if (!best || score > best.score) best = { row, score };
    }
  }
  if (best && best.score >= 0.7) return best.row;
  return null;
}

function urlOfOrg(o: OrgRow): string | null {
  const w = (o.contact?.website as string) || o.link || '';
  if (!w) return null;
  if (/^https?:\/\//i.test(w)) return w;
  return `https://${w}`;
}

async function enrichWebsite(o: OrgRow): Promise<{ changes: Record<string, unknown>; notes: string[] }> {
  const out = { changes: {} as Record<string, unknown>, notes: [] as string[] };
  const url = urlOfOrg(o);
  if (!url) {
    out.notes.push('website yok, atlandı');
    return out;
  }
  const html = await safeFetchText(url);
  if (!html) {
    out.notes.push(`website fetch başarısız: ${url}`);
    return out;
  }
  const ex = extractContact(html);
  out.notes.push(`extracted ${ex.emails.length} email, ${ex.phones.length} phone, ${Object.keys(ex.social).length} social`);

  const c = (o.contact || {}) as Record<string, unknown>;
  const social = (c.social as Record<string, string>) || {};
  // Mevcutta varsa dokunma; sadece eksikleri doldur.
  if (!c.email && ex.emails.length > 0) {
    (c as Record<string, unknown>).email = ex.emails[0];
  }
  if (!c.phone && ex.phones.length > 0) {
    (c as Record<string, unknown>).phone = ex.phones[0];
  }
  for (const k of ['instagram', 'twitter', 'facebook', 'linkedin', 'youtube', 'tiktok'] as const) {
    if (!social[k] && ex.social[k]) {
      social[k] = ex.social[k] as string;
    }
  }
  (c as Record<string, unknown>).social = social;
  if (ex.addressText && !(c.address as Record<string, unknown> | undefined)?.fullAddress) {
    const addr = ((c.address as Record<string, unknown>) || {}) as Record<string, unknown>;
    addr.fullAddress = ex.addressText;
    (c as Record<string, unknown>).address = addr;
  }
  out.changes.contact = c;
  return out;
}

async function enrichRegistry(o: OrgRow, registry: Map<string, RegistryRow>): Promise<{ changes: Record<string, unknown>; notes: string[] }> {
  const out = { changes: {} as Record<string, unknown>, notes: [] as string[] };
  const m = matchRegistry(o.name, registry);
  if (!m) {
    out.notes.push('registry eşleşmesi bulunamadı');
    return out;
  }
  out.notes.push(`registry eşleşti: ${m.fullName || m.name} (kütük ${m.kutukNo || '—'})`);
  if (m.kutukNo && !o.kutukNo) out.changes.kutukNo = m.kutukNo;
  if (m.foundationYear && !o.foundationYear && !o.foundedYear) out.changes.foundationYear = m.foundationYear;
  if (m.address || m.city) {
    const existingContact = (o.contact || {}) as Record<string, unknown>;
    const existingAddr = (existingContact.address || {}) as Record<string, unknown>;
    const next = { ...existingAddr };
    if (m.address && !next.fullAddress) next.fullAddress = m.address;
    if (m.city && !next.city) next.city = m.city;
    if (m.district && !next.district) next.district = m.district;
    out.changes.contact = { ...existingContact, address: next };
  }
  return out;
}

interface AiResult {
  beneficiaryGroups?: string[];
  memberOf?: string[];
  federations?: string[];
  supportedSDGs?: string[];
  about?: string;
}

async function enrichAI(o: OrgRow): Promise<{ changes: Record<string, unknown>; notes: string[] }> {
  const out = { changes: {} as Record<string, unknown>, notes: [] as string[] };
  // Gemini API key kontrolü — env'de yoksa skip et.
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    out.notes.push('AI atlandı: GEMINI_API_KEY yok');
    return out;
  }
  const prompt = `Aşağıdaki Türk STK/marka hakkında, yalnızca KESİN bildiğin alanları JSON olarak döndür. Bilmediğin alanları çıktıdan çıkar. Hiçbir alanı uydurma.

Ad: ${o.name}
${o.about ? `Mevcut açıklama: ${o.about.slice(0, 500)}` : ''}
Tür: ${o.type || ''}
Kategori: ${o.category || ''}

İstenen JSON şeması:
{
  "beneficiaryGroups": ["Kadınlar", "Çocuklar", ...],
  "memberOf": ["Açık Açık", "Sivil Düşün", ...],
  "federations": ["TÜGAD", ...],
  "supportedSDGs": ["SDG1", "SDG4", "SDG10", ...]
}

Yalnızca geçerli JSON döndür, markdown veya açıklama ekleme.`;

  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 20_000);
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 512, responseMimeType: 'application/json' },
        }),
        signal: ctrl.signal,
      },
    );
    clearTimeout(t);
    if (!res.ok) {
      out.notes.push(`AI hata: HTTP ${res.status}`);
      return out;
    }
    const j = await res.json();
    const text = j?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      out.notes.push('AI yanıtı boş');
      return out;
    }
    let parsed: AiResult;
    try {
      parsed = JSON.parse(text);
    } catch {
      out.notes.push('AI JSON parse başarısız');
      return out;
    }
    // Sadece mevcutta olmayan / boş arrayları doldur
    if (Array.isArray(parsed.beneficiaryGroups) && (!o.beneficiaryGroups || o.beneficiaryGroups.length === 0)) {
      out.changes.beneficiaryGroups = parsed.beneficiaryGroups.slice(0, 8);
    }
    if (Array.isArray(parsed.memberOf) && (!o.memberOf || o.memberOf.length === 0)) {
      out.changes.memberOf = parsed.memberOf.slice(0, 10);
    }
    if (Array.isArray(parsed.federations) && (!o.federations || o.federations.length === 0)) {
      out.changes.federations = parsed.federations.slice(0, 5);
    }
    if (Array.isArray(parsed.supportedSDGs) && (!o.supportedSDGs || o.supportedSDGs.length === 0)) {
      out.changes.supportedSDGs = parsed.supportedSDGs.slice(0, 10);
    }
    out.notes.push(`AI önerdi: ${Object.keys(out.changes).join(', ') || '—'}`);
  } catch (e) {
    out.notes.push(`AI hata: ${(e as Error).message?.slice(0, 80) || 'bilinmiyor'}`);
  }
  return out;
}

async function enrichCommercialBrand(o: OrgRow): Promise<{ changes: Record<string, unknown>; notes: string[] }> {
  const out = { changes: {} as Record<string, unknown>, notes: [] as string[] };
  // Wikipedia TR API: opensearch + summary
  const q = encodeURIComponent(o.name);
  const summaryUrl = `https://tr.wikipedia.org/api/rest_v1/page/summary/${q}`;
  const html = await safeFetchText(summaryUrl, 6000);
  if (!html) {
    out.notes.push('Wikipedia TR bulunamadı');
    return out;
  }
  try {
    const j = JSON.parse(html);
    if (j.type === 'standard' && j.extract && !o.about) {
      out.changes.about = String(j.extract).slice(0, 600);
      out.notes.push('Wikipedia about eklendi');
    } else if (j.type === 'disambiguation') {
      out.notes.push('Wikipedia disambiguation, atlandı');
    } else {
      out.notes.push('Wikipedia eşleşmesi belirsiz');
    }
  } catch {
    out.notes.push('Wikipedia JSON parse hatası');
  }
  return out;
}

export async function POST(req: NextRequest) {
  const auth = await requireSuperAdmin(req);
  if (auth.error) return auth.error;

  let body: EnrichBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Geçersiz JSON' }, { status: 400 });
  }
  const { kind, sources, offset, batchSize = 5 } = body;
  if (!kind || !Array.isArray(sources) || sources.length === 0) {
    return NextResponse.json({ error: 'kind + sources zorunlu' }, { status: 400 });
  }

  const db = getAdminFirestore();
  const colName = kind === 'ngo' ? COLLECTIONS.ngos : COLLECTIONS.brands;

  // Listeyi alfabetik sırala; offset/batch deterministik olsun.
  const snap = await db.collection(colName).orderBy('name').get();
  const orgs: OrgRow[] = snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<OrgRow, 'id'>) }));
  const total = orgs.length;
  const start = Math.max(0, Math.min(offset, total));
  const end = Math.min(total, start + batchSize);
  const batch = orgs.slice(start, end);

  const registry = sources.includes('registry') && kind === 'ngo' ? await loadRegistry() : new Map<string, RegistryRow>();

  const results: EnrichResult[] = [];
  for (const o of batch) {
    const merged: Record<string, unknown> = {};
    const notes: string[] = [];
    for (const src of sources) {
      let part: { changes: Record<string, unknown>; notes: string[] } = { changes: {}, notes: [] };
      if (src === 'website') part = await enrichWebsite(o);
      else if (src === 'registry' && kind === 'ngo') part = await enrichRegistry(o, registry);
      else if (src === 'ai') part = await enrichAI(o);
      else if (src === 'commercial' && kind === 'brand') part = await enrichCommercialBrand(o);
      notes.push(`[${src}] ${part.notes.join('; ')}`);
      // Deep merge contact alanları
      for (const [k, v] of Object.entries(part.changes)) {
        if (k === 'contact' && typeof v === 'object' && v && typeof merged.contact === 'object' && merged.contact) {
          merged.contact = deepMerge(merged.contact as Record<string, unknown>, v as Record<string, unknown>);
        } else {
          merged[k] = v;
        }
      }
    }

    if (Object.keys(merged).length > 0) {
      merged.enrichedAt = new Date().toISOString();
      merged.enrichedBy = auth.actor.uid;
      merged.enrichedSources = sources;
      await db.collection(colName).doc(o.id).set(merged, { merge: true });
    }
    results.push({ id: o.id, name: o.name, changes: merged, notes });
  }

  return NextResponse.json({
    total,
    processed: results,
    nextOffset: end < total ? end : null,
    done: end >= total,
  });
}

function deepMerge(a: Record<string, unknown>, b: Record<string, unknown>): Record<string, unknown> {
  const out = { ...a };
  for (const [k, v] of Object.entries(b)) {
    if (v && typeof v === 'object' && !Array.isArray(v) && out[k] && typeof out[k] === 'object' && !Array.isArray(out[k])) {
      out[k] = deepMerge(out[k] as Record<string, unknown>, v as Record<string, unknown>);
    } else {
      out[k] = v;
    }
  }
  return out;
}
