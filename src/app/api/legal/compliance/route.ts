/**
 * Sözleşme/politika ↔ mevzuat AI uyum analizi (super-admin hukuk merkezi).
 *
 * POST  { contractSlug, contractTitle, contractText, legislationId, legislationName, legislationText }
 *         → super-admin doğrula → Gemini ile analiz → complianceAnalyses'e kaydet → analizi döndür.
 * GET   → kayıtlı tüm analizleri döndür (en yeni önce).
 *
 * Yalnızca admin-SDK erişimi: complianceAnalyses koleksiyonu için client rule gerekmez.
 * Hata formatı: { errorCode, message }. Raw error.message istemciye sızdırılmaz.
 */
import { NextRequest, NextResponse } from 'next/server';
import { analyzeCompliance } from '@/ai/flows/compliance-analysis-flow';
import { AIQuotaExceededError } from '@/ai/flow-auth';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';
import { FieldValue } from 'firebase-admin/firestore';
import { checkRateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';

function getClientIp(req: NextRequest): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) { const first = xff.split(',')[0]?.trim(); if (first) return first; }
  return req.headers.get('x-real-ip')?.trim() || 'unknown';
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim();
}

async function verifySuperAdmin(req: NextRequest): Promise<{ uid: string } | null> {
  const authHeader = req.headers.get('authorization') || '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!idToken) return null;
  try {
    const decoded = await getAdminAuth().verifyIdToken(idToken) as { uid: string; role?: string; superAdminPermissions?: unknown };
    if (decoded.role === 'super-admin' || !!decoded.superAdminPermissions) return { uid: decoded.uid };
    // Fallback: Firestore users doc (claim henüz senkron değilse)
    const snap = await getAdminFirestore().collection(COLLECTIONS.users).doc(decoded.uid).get();
    const data = snap.data();
    if (data?.role === 'super-admin' || (Array.isArray(data?.superAdminPermissions) && data.superAdminPermissions.length > 0)) {
      return { uid: decoded.uid };
    }
    return null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const admin = await verifySuperAdmin(req);
  if (!admin) return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'Super-admin yetkisi gerekli.' }, { status: 403 });
  try {
    const snap = await getAdminFirestore().collection(COLLECTIONS.complianceAnalyses).orderBy('analyzedAt', 'desc').limit(200).get();
    const items = snap.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        ...data,
        analyzedAt: data.analyzedAt?.toDate ? data.analyzedAt.toDate().toISOString() : null,
      };
    });
    return NextResponse.json({ items });
  } catch (err) {
    console.error('legal/compliance GET error', err);
    return NextResponse.json({ errorCode: 'INTERNAL_ERROR', message: 'Analizler okunamadı.' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = await checkRateLimit({ bucket: 'legal-compliance', key: ip, limit: 20, windowMs: 60_000 });
  if (!rl.allowed) {
    return NextResponse.json({ errorCode: 'RATE_LIMITED', message: 'Çok fazla analiz isteği. Lütfen bir dakika bekleyin.' }, { status: 429 });
  }

  const admin = await verifySuperAdmin(req);
  if (!admin) return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'Super-admin yetkisi gerekli.' }, { status: 403 });

  const body = await req.json().catch(() => null);
  const contractSlug = typeof body?.contractSlug === 'string' ? body.contractSlug.trim() : '';
  const contractTitle = typeof body?.contractTitle === 'string' ? body.contractTitle.trim() : '';
  const contractText = typeof body?.contractText === 'string' ? body.contractText : '';
  const legislationId = typeof body?.legislationId === 'string' ? body.legislationId.trim() : '';
  const legislationName = typeof body?.legislationName === 'string' ? body.legislationName.trim() : '';
  const legislationText = typeof body?.legislationText === 'string' ? body.legislationText : '';

  if (!contractSlug || !contractTitle || !legislationId || !legislationName) {
    return NextResponse.json({ errorCode: 'INVALID_BODY', message: 'Sözleşme ve mevzuat seçimi zorunlu.' }, { status: 400 });
  }
  const cleanContract = stripHtml(contractText);
  if (cleanContract.length < 20) {
    return NextResponse.json({ errorCode: 'EMPTY_CONTRACT', message: 'Sözleşme metni boş veya çok kısa.' }, { status: 400 });
  }

  const idToken = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');

  try {
    const result = await analyzeCompliance(
      { contractTitle, contractText: cleanContract, legislationName, legislationText: stripHtml(legislationText) },
      idToken || undefined,
    );

    const docId = `${contractSlug}__${legislationId}`;
    await getAdminFirestore().collection(COLLECTIONS.complianceAnalyses).doc(docId).set({
      contractSlug, contractTitle, legislationId, legislationName,
      ...result,
      analyzedBy: admin.uid,
      analyzedAt: FieldValue.serverTimestamp(),
    }, { merge: true });

    return NextResponse.json({ id: docId, ...result });
  } catch (err) {
    if (err instanceof AIQuotaExceededError) {
      return NextResponse.json({ errorCode: 'QUOTA_EXCEEDED', message: 'Günlük AI limiti doldu. Yarın tekrar deneyin.' }, { status: 429 });
    }
    console.error('legal/compliance POST error', err);
    return NextResponse.json({ errorCode: 'INTERNAL_ERROR', message: 'AI analizi yapılamadı. Lütfen tekrar deneyin.' }, { status: 500 });
  }
}
