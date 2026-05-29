/**
 * Arşiv geçmiş belge içe aktarımı (super-admin).
 *
 * documentArchive'e ayna kaydı eklenmeden ÖNCE yüklenmiş belgeleri (kurum logoları,
 * faaliyet belgesi, tüzük/vakıf senedi + STK şeffaflık belgeleri) tarar ve
 * documentArchive'e deterministik id ile upsert eder (tekrar üretmez). POST.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';
import { FieldValue } from 'firebase-admin/firestore';

export const runtime = 'nodejs';

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

function slugifyDocType(s: string): string {
  return s.toLowerCase()
    .replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ş/g, 's').replace(/ü/g, 'u')
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'evrak';
}

export async function POST(req: NextRequest) {
  if (!(await isSuperAdmin(req))) {
    return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'Super-admin yetkisi gerekli.' }, { status: 403 });
  }

  const fs = getAdminFirestore();
  const year = String(new Date().getFullYear());
  type Entry = { entityId: string; entityName: string; entityType: 'ngo' | 'brand' | 'club'; docType: string; fileUrl: string };
  const entries: Entry[] = [];
  const isUrl = (v: unknown): v is string => typeof v === 'string' && /^https?:\/\//i.test(v);

  // Kurum logoları + (NGO) faaliyet belgesi/tüzük + (kulüp) faaliyet belgesi.
  const scanEntities = async (col: string, type: 'ngo' | 'brand' | 'club') => {
    try {
      const snap = await fs.collection(col).get();
      snap.docs.forEach(d => {
        const v = d.data() as Record<string, unknown>;
        const name = (v.name as string) || 'Bilinmeyen Kurum';
        const files = (v.files as Record<string, unknown>) || {};
        const logo = files.logo || v.logoUrl || v.avatarUrl;
        if (isUrl(logo)) entries.push({ entityId: d.id, entityName: name, entityType: type, docType: 'Logo', fileUrl: logo });
        if (isUrl(files.activityCertificate) || isUrl(v.activityCertificateUrl)) {
          entries.push({ entityId: d.id, entityName: name, entityType: type, docType: 'Faaliyet Belgesi', fileUrl: (files.activityCertificate as string) || (v.activityCertificateUrl as string) });
        }
        if (isUrl(files.charter)) {
          entries.push({ entityId: d.id, entityName: name, entityType: type, docType: (v.ngoType === 'vakif' ? 'Vakıf Senedi' : 'Tüzük'), fileUrl: files.charter as string });
        }
      });
    } catch (e) { console.warn('archive-backfill scan failed', col, e); }
  };
  await scanEntities(COLLECTIONS.ngos, 'ngo');
  await scanEntities(COLLECTIONS.brands, 'brand');
  await scanEntities(COLLECTIONS.clubs, 'club');

  // STK şeffaflık belgeleri (transparency/{uid}.criteria[].fileUrl).
  try {
    const tSnap = await fs.collection(COLLECTIONS.transparency).get();
    const ngoNames = new Map<string, string>();
    for (const t of tSnap.docs) {
      const data = t.data() as { criteria?: Array<{ name?: string; type?: string; fileUrl?: string }> };
      const criteria = data.criteria || [];
      const docs = criteria.filter(c => isUrl(c.fileUrl) && (c.type === 'document' || c.type === 'document-link'));
      if (docs.length === 0) continue;
      let name = ngoNames.get(t.id);
      if (!name) {
        try { name = ((await fs.collection(COLLECTIONS.ngos).doc(t.id).get()).data()?.name as string) || 'STK'; } catch { name = 'STK'; }
        ngoNames.set(t.id, name);
      }
      docs.forEach(c => entries.push({ entityId: t.id, entityName: name as string, entityType: 'ngo', docType: c.name || 'Belge', fileUrl: c.fileUrl as string }));
    }
  } catch (e) { console.warn('archive-backfill transparency scan failed', e); }

  // Deterministik id ile upsert (mevcut ayna kayıtlarıyla çakışmaz, tekrar üretmez).
  let imported = 0;
  for (let i = 0; i < entries.length; i += 400) {
    const chunk = entries.slice(i, i + 400);
    const batch = fs.batch();
    for (const e of chunk) {
      const id = `${e.entityId}__${slugifyDocType(e.docType)}`;
      batch.set(fs.collection(COLLECTIONS.documentArchive).doc(id), {
        entityId: e.entityId, entityName: e.entityName, entityType: e.entityType,
        docType: e.docType, fileUrl: e.fileUrl, year,
        uploadedBy: e.entityId, uploadedAt: FieldValue.serverTimestamp(), backfilled: true,
      }, { merge: true });
      imported += 1;
    }
    await batch.commit();
  }

  return NextResponse.json({ ok: true, imported });
}
