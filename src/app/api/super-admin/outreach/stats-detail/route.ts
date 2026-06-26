/**
 * Detaylı outreach istatistikleri — dernek/vakıf/spor × il × ilçe kırılımı +
 * iletişim kapsama (telefon/e-posta/web/ilçe/mahalle).
 *
 * GET (param yok)        → ulusal + il-bazlı özet (appStats/outreachDetail'de cache'li)
 * GET ?refresh=true      → yeniden hesapla (tam tarama) ve cache'e yaz
 * GET ?il=<İl>           → o ilin ilçe kırılımı (canlı, where il==X)
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 300;

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

const has = (v: unknown) => !!(v && String(v).trim());
const isSpor = (f: unknown) => /spor/i.test(String(f || ''));
// Vakıf kütüğündeki standart-dışı il etiketlerini birleştir.
function normIl(il: string): string {
  if (/^İstanbul/.test(il)) return 'İstanbul';
  if (il === 'Afyon') return 'Afyonkarahisar';
  if (il === 'K.Maraş' || il === 'Maraş') return 'Kahramanmaraş';
  return il || '(boş)';
}
function ilVariants(il: string): string[] {
  if (il === 'İstanbul') return ['İstanbul', 'İstanbul (Avrupa)', 'İstanbul (Anadolu)'];
  if (il === 'Afyonkarahisar') return ['Afyonkarahisar', 'Afyon'];
  if (il === 'Kahramanmaraş') return ['Kahramanmaraş', 'K.Maraş', 'Maraş'];
  return [il];
}

type IlRow = { il: string; dernek: number; spor: number; vakif: number; total: number; phone: number; email: number; web: number; ilce: number; mahalle: number };

async function computeNational(db: FirebaseFirestore.Firestore) {
  const iller: Record<string, IlRow> = {};
  const bump = (il: string): IlRow => (iller[il] ||= { il, dernek: 0, spor: 0, vakif: 0, total: 0, phone: 0, email: 0, web: 0, ilce: 0, mahalle: 0 });
  const totals = { dernek: 0, spor: 0, vakif: 0, total: 0, phone: 0, email: 0, web: 0, ilce: 0, mahalle: 0 };
  const byType: Record<string, { total: number; phone: number; email: number; web: number; ilce: number; mahalle: number }> = {
    Dernek: { total: 0, phone: 0, email: 0, web: 0, ilce: 0, mahalle: 0 },
    SporKulübü: { total: 0, phone: 0, email: 0, web: 0, ilce: 0, mahalle: 0 },
    Vakıf: { total: 0, phone: 0, email: 0, web: 0, ilce: 0, mahalle: 0 },
  };

  const ds = await db.collection('registryDernekler')
    .select('il', 'ilce', 'mahalle', 'telefon1', 'ePosta', 'webSite', 'faaliyetAlani').get();
  ds.forEach((doc) => {
    const x = doc.data();
    const r = bump(x.il || '(boş)');
    const spor = isSpor(x.faaliyetAlani);
    const t = spor ? byType.SporKulübü : byType.Dernek;
    t.total++;
    if (spor) { r.spor++; totals.spor++; } else { r.dernek++; totals.dernek++; }
    const p = has(x.telefon1), e = has(x.ePosta), w = has(x.webSite), ic = has(x.ilce), m = has(x.mahalle);
    if (p) { r.phone++; totals.phone++; t.phone++; }
    if (e) { r.email++; totals.email++; t.email++; }
    if (w) { r.web++; totals.web++; t.web++; }
    if (ic) { r.ilce++; totals.ilce++; t.ilce++; }
    if (m) { r.mahalle++; totals.mahalle++; t.mahalle++; }
  });

  const vs = await db.collection('registryVakiflar')
    .select('il', 'ilce', 'mahalle', 'telefon1', 'telefon2', 'ePosta', 'eTebligat').get();
  vs.forEach((doc) => {
    const x = doc.data();
    const r = bump(normIl(x.il || '(boş)'));
    r.vakif++; totals.vakif++;
    const t = byType.Vakıf; t.total++;
    const p = has(x.telefon1) || has(x.telefon2), e = has(x.ePosta) || has(x.eTebligat), ic = has(x.ilce), m = has(x.mahalle);
    if (p) { r.phone++; totals.phone++; t.phone++; }
    if (e) { r.email++; totals.email++; t.email++; }
    if (ic) { r.ilce++; totals.ilce++; t.ilce++; }
    if (m) { r.mahalle++; totals.mahalle++; t.mahalle++; }
  });

  const illerArr = Object.values(iller).map((r) => ({ ...r, total: r.dernek + r.spor + r.vakif })).sort((a, b) => b.total - a.total);
  totals.total = totals.dernek + totals.spor + totals.vakif;
  return { generatedAt: Date.now(), totals, byType, iller: illerArr };
}

async function computeIlce(db: FirebaseFirestore.Firestore, il: string) {
  const map: Record<string, { ilce: string; dernek: number; spor: number; vakif: number; total: number; phone: number; email: number }> = {};
  const bump = (ilce: string) => (map[ilce] ||= { ilce, dernek: 0, spor: 0, vakif: 0, total: 0, phone: 0, email: 0 });
  const ds = await db.collection('registryDernekler').where('il', '==', il)
    .select('ilce', 'telefon1', 'ePosta', 'faaliyetAlani').get();
  ds.forEach((doc) => {
    const x = doc.data();
    const r = bump(x.ilce || '(belirsiz)');
    if (isSpor(x.faaliyetAlani)) r.spor++; else r.dernek++;
    if (has(x.telefon1)) r.phone++;
    if (has(x.ePosta)) r.email++;
  });
  for (const v of ilVariants(il)) {
    const vs = await db.collection('registryVakiflar').where('il', '==', v)
      .select('ilce', 'telefon1', 'telefon2', 'ePosta', 'eTebligat').get();
    vs.forEach((doc) => {
      const x = doc.data();
      const r = bump(x.ilce || '(belirsiz)');
      r.vakif++;
      if (has(x.telefon1) || has(x.telefon2)) r.phone++;
      if (has(x.ePosta) || has(x.eTebligat)) r.email++;
    });
  }
  return Object.values(map).map((r) => ({ ...r, total: r.dernek + r.spor + r.vakif })).sort((a, b) => b.total - a.total);
}

export async function GET(req: NextRequest) {
  if (!(await isSuperAdmin(req))) {
    return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'Super-admin yetkisi gerekli.' }, { status: 403 });
  }
  const { searchParams } = new URL(req.url);
  const db = getAdminFirestore();

  const il = searchParams.get('il');
  if (il) {
    const ilceler = await computeIlce(db, il);
    return NextResponse.json({ il, ilceler });
  }

  const ref = db.collection('appStats').doc('outreachDetail');
  const refresh = searchParams.get('refresh') === 'true';
  if (!refresh) {
    const snap = await ref.get();
    if (snap.exists) return NextResponse.json({ ...snap.data(), cached: true });
  }
  const data = await computeNational(db);
  await ref.set(data).catch(() => {});
  return NextResponse.json({ ...data, cached: false });
}
