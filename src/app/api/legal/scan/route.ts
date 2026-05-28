/**
 * Mevzuat & karar tarama (super-admin/contracts → Mevzuatlar → "Mevzuat & Karar Tara").
 *
 * POST → super-admin doğrula → mevcut legislations + baseline seed'i "bilinen" say →
 *   (1) baseline'da olup Firestore'da olmayanları deterministik aday yap,
 *   (2) Gemini ile listede olmayan/yeni/değişmiş kanun & karar adayları öner,
 *   isim bazlı dedupe edip birleşik aday listesini döndür.
 *
 * Yazma YAPMAZ — ekleme/güncelleme client'tan "Sisteme Ekle" ile (super-admin claim
 * legislations write'a izinli). Hata formatı: { errorCode, message }.
 *
 * NOT: AI çıktısı canlı resmî kaynak değil, bilgi tabanından adaydır → doğrulanmalı.
 */
import { NextRequest, NextResponse } from 'next/server';
import { scanLegislation } from '@/ai/flows/legislation-scan-flow';
import { AIQuotaExceededError } from '@/ai/flow-auth';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';
import { legislationsData } from '@/lib/legislations';
import { checkRateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';

function getClientIp(req: NextRequest): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) { const first = xff.split(',')[0]?.trim(); if (first) return first; }
  return req.headers.get('x-real-ip')?.trim() || 'unknown';
}

const norm = (s: string) => (s || '').toLowerCase().replace(/[^a-z0-9çğıöşü]/gi, '');

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
  const rl = await checkRateLimit({ bucket: 'legal-scan', key: ip, limit: 10, windowMs: 60_000 });
  if (!rl.allowed) {
    return NextResponse.json({ errorCode: 'RATE_LIMITED', message: 'Çok fazla tarama isteği. Lütfen bir dakika bekleyin.' }, { status: 429 });
  }

  if (!(await verifySuperAdmin(req))) {
    return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'Super-admin yetkisi gerekli.' }, { status: 403 });
  }

  const adminDb = getAdminFirestore();
  let existing: { id: string; name?: string; number?: string; country?: string }[] = [];
  try {
    const snap = await adminDb.collection(COLLECTIONS.legislations).get();
    existing = snap.docs.map(d => ({ id: d.id, ...(d.data() as { name?: string; number?: string; country?: string }) }));
  } catch (e) {
    console.warn('legal/scan: existing read failed', e);
  }

  const existingIds = new Set(existing.map(e => e.id));
  const knownNames = new Set([...existing.map(e => norm(e.name || '')), ...legislationsData.map(l => norm(l.name))]);

  type Candidate = {
    source: 'baseline' | 'ai';
    status: 'new' | 'updated';
    id: string;
    name: string;
    number?: string;
    country?: string;
    category?: string;
    riskLevel?: string;
    complianceStatus?: string;
    hangelSubject?: string;
    affectedModules?: string[];
    articleText?: string;
    interpretation?: string;
    links?: string;
    reason?: string;
  };

  const candidates: Candidate[] = [];

  // (1) Baseline'da olup Firestore'da olmayanlar — deterministik, güvenilir.
  for (const l of legislationsData) {
    if (!existingIds.has(l.id)) {
      candidates.push({
        source: 'baseline', status: 'new', id: l.id, name: l.name, number: l.number, country: l.country,
        category: l.category, riskLevel: l.riskLevel, complianceStatus: l.complianceStatus,
        hangelSubject: l.hangelSubject, affectedModules: l.affectedModules, articleText: l.articleText,
        interpretation: l.interpretation, links: l.links, reason: 'Varsayılan kütüphanede var, sistemde yok.',
      });
    }
  }

  // (2) AI adayları — listede olmayan/yeni/değişmiş.
  let aiError: string | null = null;
  try {
    const knownList = [...existing, ...legislationsData]
      .map(e => `${('id' in e ? e.id : '')} | ${('country' in e ? e.country : '') || 'TR'} | ${e.name || ''} | ${('number' in e ? e.number : '') || ''}`)
      .join('\n');
    const idToken = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
    const out = await scanLegislation({ knownList, scope: 'Türkiye, Avrupa Birliği, uluslararası' }, idToken || undefined);
    const slug = (s: string) => norm(s).slice(0, 60) || `aday-${Date.now()}`;
    for (const c of out.candidates) {
      const dedupeKey = norm(c.name);
      if (knownNames.has(dedupeKey)) continue; // baseline/var olanı tekrar gösterme
      knownNames.add(dedupeKey);
      const isUpdate = c.status === 'updated' && c.existingId && existingIds.has(c.existingId);
      candidates.push({
        source: 'ai',
        status: isUpdate ? 'updated' : 'new',
        id: isUpdate ? c.existingId : `ai-${slug(c.name)}`,
        name: c.name, number: c.number || undefined, country: c.country || 'TR',
        category: c.category || 'Diğer', riskLevel: c.riskLevel,
        hangelSubject: c.hangelSubject, affectedModules: c.affectedModules,
        interpretation: c.interpretation, links: c.links, reason: c.reason,
      });
    }
  } catch (e) {
    if (e instanceof AIQuotaExceededError) aiError = 'AI günlük limiti doldu; yalnızca varsayılan kütüphane adayları gösteriliyor.';
    else { console.error('legal/scan AI error', e); aiError = 'AI taraması yapılamadı; yalnızca varsayılan kütüphane adayları gösteriliyor.'; }
  }

  return NextResponse.json({ candidates, aiError, existingCount: existing.length });
}
