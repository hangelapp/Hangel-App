/**
 * Fon & hibe tarama (super-admin/funds → "Fon & Hibe Tara").
 *
 * POST → super-admin doğrula → mevcut funds + taranacak kaynak listesini
 *   (siteSettings/fundScanSources, yoksa varsayılan 21 kaynak) oku → Gemini ile
 *   listede olmayan/yeni hibe & fon adaylarını öner → döndür.
 *
 * Yazma YAPMAZ — ekleme/güncelleme client'tan "Sisteme Ekle" ile (super-admin
 * funds write'a izinli). Hata formatı: { errorCode, message }.
 * NOT: AI çıktısı canlı portal değil, bilgi tabanından adaydır → doğrulanmalı.
 */
import { NextRequest, NextResponse } from 'next/server';
import { scanFunds } from '@/ai/flows/fund-scan-flow';
import { AIQuotaExceededError } from '@/ai/flow-auth';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';
import { DEFAULT_FUND_SOURCES, type FundSource } from '@/lib/fund-sources';
import { checkRateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';

function getClientIp(req: NextRequest): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) { const first = xff.split(',')[0]?.trim(); if (first) return first; }
  return req.headers.get('x-real-ip')?.trim() || 'unknown';
}

async function verifySuperAdmin(req: NextRequest): Promise<boolean> {
  const authHeader = req.headers.get('authorization') || '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!idToken) return false;
  try {
    const decoded = await getAdminAuth().verifyIdToken(idToken) as { uid: string; role?: string; superAdminPermissions?: unknown };
    if (decoded.role === 'super-admin' || !!decoded.superAdminPermissions) return true;
    const snap = await getAdminFirestore().collection(COLLECTIONS.users).doc(decoded.uid).get();
    const d = snap.data();
    return d?.role === 'super-admin' || (Array.isArray(d?.superAdminPermissions) && d.superAdminPermissions.length > 0);
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = await checkRateLimit({ bucket: 'fund-scan', key: ip, limit: 10, windowMs: 60_000 });
  if (!rl.allowed) {
    return NextResponse.json({ errorCode: 'RATE_LIMITED', message: 'Çok fazla tarama isteği. Lütfen bir dakika bekleyin.' }, { status: 429 });
  }

  if (!(await verifySuperAdmin(req))) {
    return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'Super-admin yetkisi gerekli.' }, { status: 403 });
  }

  const adminDb = getAdminFirestore();

  // Mevcut fonlar — AI'ya "bunları tekrar önerme" için.
  let existing: { name?: string; provider?: string }[] = [];
  try {
    const snap = await adminDb.collection(COLLECTIONS.funds).get();
    existing = snap.docs.map(d => d.data() as { name?: string; provider?: string });
  } catch (e) {
    console.warn('funds/scan: existing read failed', e);
  }
  const knownList = existing.map(f => `${f.name || ''} | ${f.provider || ''}`).filter(s => s.trim() !== '|').join('\n');

  // Taranacak kaynaklar — siteSettings/fundScanSources, yoksa varsayılan.
  let sources: FundSource[] = DEFAULT_FUND_SOURCES;
  try {
    const cfg = await adminDb.collection('siteSettings').doc('fundScanSources').get();
    const data = cfg.data();
    if (Array.isArray(data?.sources) && data.sources.length > 0) sources = data.sources as FundSource[];
  } catch (e) {
    console.warn('funds/scan: sources read failed, using defaults', e);
  }
  const enabledSources = sources.filter(s => s.enabled !== false);
  const sourcesText = enabledSources.map(s => `${s.name} — ${s.url}`).join('\n');

  try {
    const idToken = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
    const out = await scanFunds({ knownList, sources: sourcesText }, idToken || undefined);
    const norm = (s: string) => (s || '').toLowerCase().replace(/[^a-z0-9çğıöşü]/gi, '');
    const knownNames = new Set(existing.map(e => norm(e.name || '')));
    const candidates = out.candidates
      .filter(c => c.name && !knownNames.has(norm(c.name)))
      .map((c, i) => ({
        id: `fund-${norm(c.name).slice(0, 50) || i}`,
        status: c.status === 'updated' ? 'updated' : 'new',
        name: c.name,
        provider: c.provider || '',
        deadline: c.deadline || '',
        areas: Array.isArray(c.areas) ? c.areas : [],
        budget: c.budget || '',
        description: c.description || '',
        requirements: c.requirements || '',
        url: c.url || '',
        reason: c.reason || '',
      }));
    return NextResponse.json({ candidates, aiError: null, scannedCount: enabledSources.length, existingCount: existing.length });
  } catch (err) {
    if (err instanceof AIQuotaExceededError) {
      return NextResponse.json({ errorCode: 'QUOTA_EXCEEDED', message: 'Günlük AI limiti doldu. Yarın tekrar deneyin.' }, { status: 429 });
    }
    console.error('funds/scan error', err);
    const raw = (err instanceof Error ? err.message : String(err)).toLowerCase();
    if (raw.includes('api key') || raw.includes('api_key') || (raw.includes('permission') && raw.includes('denied'))) {
      return NextResponse.json({ errorCode: 'AI_KEY_MISSING', message: 'Yapay zeka anahtarı (GEMINI_API_KEY) ayarlı değil veya geçersiz.' }, { status: 500 });
    }
    if (raw.includes('model') && (raw.includes('not found') || raw.includes('404'))) {
      return NextResponse.json({ errorCode: 'AI_MODEL', message: 'Yapay zeka modeli bulunamadı (Gemini sürümü).' }, { status: 500 });
    }
    return NextResponse.json({ errorCode: 'INTERNAL_ERROR', message: `Tarama yapılamadı. (Teknik: ${raw.slice(0, 180)})` }, { status: 500 });
  }
}
