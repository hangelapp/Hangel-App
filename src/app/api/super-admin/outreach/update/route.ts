/**
 * POST /api/super-admin/outreach/update
 *
 * Outreach kayıtlarını (registryVakiflar / registryDernekler / outreachContacts)
 * super-admin panelinden düzenler. Normalize edilmiş alanları (name, city,
 * district, neighborhood, phone, email, website, address, type, status) her
 * kaynağın kendi şema alanlarına eşler ve Admin SDK ile günceller (rules bypass).
 *
 * Body: { source, id, patch: Partial<NormalizedFields> }
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';

const VALID_SOURCES = ['registryVakiflar', 'registryDernekler', 'outreachContacts'] as const;
type Source = typeof VALID_SOURCES[number];

interface NormalizedPatch {
  name?: string; city?: string; district?: string; neighborhood?: string;
  phone?: string; email?: string; website?: string; address?: string;
  type?: string; status?: string;
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

// Normalize → kaynak şeması. Sadece patch'te GELEN alanları yazar (undefined atla).
function toDocFields(source: Source, p: NormalizedPatch): Record<string, unknown> {
  const set = (cond: boolean, k: string, v: unknown, out: Record<string, unknown>) => { if (cond) out[k] = v; };
  const o: Record<string, unknown> = {};
  const has = (k: keyof NormalizedPatch) => p[k] !== undefined;
  if (source === 'registryVakiflar') {
    set(has('name'), 'name', p.name, o); if (has('name')) o.nameLower = (p.name || '').toLocaleLowerCase('tr');
    set(has('city'), 'il', p.city, o);
    set(has('district'), 'ilce', p.district, o);
    set(has('phone'), 'telefon1', p.phone, o);
    set(has('email'), 'ePosta', p.email, o);
    set(has('website'), 'webSite', p.website, o);
    set(has('address'), 'adres', p.address, o);
  } else if (source === 'registryDernekler') {
    set(has('name'), 'name', p.name, o); if (has('name')) o.nameLower = (p.name || '').toLocaleLowerCase('tr');
    set(has('city'), 'il', p.city, o);
    set(has('district'), 'ilce', p.district, o);
    set(has('phone'), 'telefon1', p.phone, o);
    set(has('email'), 'ePosta', p.email, o);
    set(has('website'), 'webSite', p.website, o);
    set(has('address'), 'adres', p.address, o);
  } else {
    // outreachContacts — alan adları zaten normalize ile birebir
    (['name', 'city', 'district', 'neighborhood', 'phone', 'email', 'website', 'address', 'type', 'status'] as const)
      .forEach((k) => set(has(k), k, p[k], o));
  }
  return o;
}

export async function POST(req: NextRequest) {
  if (!(await isSuperAdmin(req))) {
    return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'Super-admin yetkisi gerekli.' }, { status: 403 });
  }
  let body: { source?: string; id?: string; patch?: NormalizedPatch };
  try { body = await req.json(); } catch { return NextResponse.json({ errorCode: 'BAD_JSON', message: 'Geçersiz JSON' }, { status: 400 }); }

  const source = body.source as Source;
  if (!source || !VALID_SOURCES.includes(source)) {
    return NextResponse.json({ errorCode: 'BAD_SOURCE', message: 'source geçersiz' }, { status: 400 });
  }
  if (!body.id || typeof body.id !== 'string') {
    return NextResponse.json({ errorCode: 'BAD_ID', message: 'id gerekli' }, { status: 400 });
  }
  const patch = body.patch || {};
  const fields = toDocFields(source, patch);
  if (Object.keys(fields).length === 0) {
    return NextResponse.json({ errorCode: 'EMPTY', message: 'Güncellenecek alan yok' }, { status: 400 });
  }
  fields.updatedAt = Date.now();

  try {
    await getAdminFirestore().collection(source).doc(body.id).set(fields, { merge: true });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ errorCode: 'WRITE_FAILED', message: e instanceof Error ? e.message : 'Yazma hatası' }, { status: 500 });
  }
}
