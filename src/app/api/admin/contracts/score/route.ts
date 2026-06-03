/**
 * POST /api/admin/contracts/score
 * GET  /api/admin/contracts/score?slug=<contractSlug>[&jurisdiction=TR]
 *
 * Rule-based compliance scoring (LLM YOK). Yalnızca super-admin.
 *
 * POST body: { contractSlug: string }
 *   → contracts/{slug}.content okur, 12 jurisdiction için deterministik skor
 *     üretir, `contractCompliance/{slug}__{jurisdiction}` dokümanlarına
 *     idempotent yazar, üretilen tüm skorları döndürür.
 *
 * GET ?slug=X:
 *   → contractCompliance koleksiyonundan o slug'a ait tüm skorları döndürür.
 *   → ?jurisdiction=TR eklenirse yalnızca o ülkenin doc'unu döner.
 *
 * Hata formatı: `{ errorCode, message }`. Raw exception istemciye sızdırılmaz.
 *
 * Maliyet: tamamı CPU + Firestore writes. 1 contract × 12 jurisdiction = 12 set
 * çağrısı; batched write kullanılır.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';
import {
  buildComplianceDocId,
  COMPLIANCE_JURISDICTIONS,
  isComplianceJurisdiction,
  type ComplianceJurisdiction,
  type ComplianceScore,
} from '@/lib/contracts/compliance-types';
import { scoreContractAllJurisdictions } from '@/lib/contracts/compliance-engine';

export const runtime = 'nodejs';

interface DecodedSuperAdmin {
  uid: string;
  role?: string;
  superAdminPermissions?: unknown;
}

async function verifySuperAdmin(req: NextRequest): Promise<{ uid: string } | null> {
  const authHeader = req.headers.get('authorization') || '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!idToken) return null;
  try {
    const decoded = (await getAdminAuth().verifyIdToken(idToken)) as DecodedSuperAdmin;
    if (decoded.role === 'super-admin' || !!decoded.superAdminPermissions) {
      return { uid: decoded.uid };
    }
    const snap = await getAdminFirestore().collection(COLLECTIONS.users).doc(decoded.uid).get();
    const d = snap.data();
    if (d?.role === 'super-admin' || (Array.isArray(d?.superAdminPermissions) && d.superAdminPermissions.length > 0)) {
      return { uid: decoded.uid };
    }
    return null;
  } catch {
    return null;
  }
}

/** Strip a minimal subset of HTML so contract content stored as HTML still scores. */
function stripHtml(s: string): string {
  return s
    .replace(/<\/(p|div|h[1-6]|li|tr|td|th|br)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/[ \t]+/g, ' ');
}

interface ContractDocShape {
  slug?: string;
  content?: string;
  title?: string;
}

export async function POST(req: NextRequest) {
  const admin = await verifySuperAdmin(req);
  if (!admin) {
    return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'Super-admin yetkisi gerekli.' }, { status: 403 });
  }

  const body = (await req.json().catch(() => null)) as { contractSlug?: unknown } | null;
  const contractSlug = typeof body?.contractSlug === 'string' ? body.contractSlug.trim() : '';
  if (!contractSlug) {
    return NextResponse.json({ errorCode: 'INVALID_INPUT', message: 'contractSlug zorunlu.' }, { status: 400 });
  }

  const db = getAdminFirestore();
  const contractSnap = await db.collection(COLLECTIONS.contracts).doc(contractSlug).get();
  if (!contractSnap.exists) {
    return NextResponse.json({ errorCode: 'NOT_FOUND', message: 'Sözleşme bulunamadı.' }, { status: 404 });
  }

  const data = contractSnap.data() as ContractDocShape;
  const rawContent = typeof data.content === 'string' ? data.content : '';
  if (rawContent.trim().length < 20) {
    return NextResponse.json(
      { errorCode: 'EMPTY_CONTRACT', message: 'Sözleşme metni boş veya çok kısa, skor hesaplanamadı.' },
      { status: 400 },
    );
  }

  // Contract içeriği bazen HTML olarak saklanabiliyor; markdown başlık taraması
  // için en azından açılış/kapanış tag'lerini soyup tag içeriği satıra bölüyoruz.
  const markdownish = /<\w+[^>]*>/.test(rawContent) ? stripHtml(rawContent) : rawContent;

  const scores = scoreContractAllJurisdictions(contractSlug, markdownish);

  // Batched, idempotent writes. Doc id formatı: `{slug}__{jurisdiction}`.
  const batch = db.batch();
  for (const score of scores) {
    const ref = db.collection(COLLECTIONS.contractCompliance).doc(buildComplianceDocId(contractSlug, score.jurisdiction));
    batch.set(ref, { ...score, scoredBy: admin.uid }, { merge: false });
  }
  await batch.commit();

  return NextResponse.json({ ok: true, contractSlug, scores });
}

export async function GET(req: NextRequest) {
  const admin = await verifySuperAdmin(req);
  if (!admin) {
    return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'Super-admin yetkisi gerekli.' }, { status: 403 });
  }

  const url = new URL(req.url);
  const slug = (url.searchParams.get('slug') || '').trim();
  if (!slug) {
    return NextResponse.json({ errorCode: 'INVALID_INPUT', message: 'slug query param zorunlu.' }, { status: 400 });
  }

  const jurisdictionParam = (url.searchParams.get('jurisdiction') || '').trim();
  const db = getAdminFirestore();

  if (jurisdictionParam) {
    if (!isComplianceJurisdiction(jurisdictionParam)) {
      return NextResponse.json({ errorCode: 'INVALID_JURISDICTION', message: 'Bilinmeyen jurisdiction.' }, { status: 400 });
    }
    const j: ComplianceJurisdiction = jurisdictionParam;
    const snap = await db.collection(COLLECTIONS.contractCompliance).doc(buildComplianceDocId(slug, j)).get();
    if (!snap.exists) {
      return NextResponse.json({ ok: true, contractSlug: slug, scores: [] });
    }
    return NextResponse.json({ ok: true, contractSlug: slug, scores: [snap.data() as ComplianceScore] });
  }

  // Tüm jurisdiction'lar — koleksiyonu filtreliyoruz.
  const snap = await db
    .collection(COLLECTIONS.contractCompliance)
    .where('contractSlug', '==', slug)
    .get();
  const scores = snap.docs.map(d => d.data() as ComplianceScore);
  // İstemci tarafında deterministik sıralama: jurisdiction listesi sırasına göre.
  scores.sort(
    (a, b) =>
      COMPLIANCE_JURISDICTIONS.indexOf(a.jurisdiction) -
      COMPLIANCE_JURISDICTIONS.indexOf(b.jurisdiction),
  );
  return NextResponse.json({ ok: true, contractSlug: slug, scores });
}
