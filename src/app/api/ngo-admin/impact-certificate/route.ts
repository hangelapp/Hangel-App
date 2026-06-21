/**
 * GET /api/ngo-admin/impact-certificate?orgId=&kind=ngo|brand|club
 *
 * Kurumun KENDİ faaliyetinden OTOMATİK ürettiği "Etki Sertifikası" metriklerini
 * döner. Süper-admin elle vermez; her kurum kendi verisinden iki dönem kazanır:
 *   - cumulative: tüm zamanların birikimli etkisi ("Toplam Etki")
 *   - months: ay bazında (YYYY-MM) ayrı ayrı, yeniden eskiye sıralı
 *
 * Metrik hesaplama + `certificates` upsert mantığı `@/lib/org-impact`'te TEK
 * KAYNAK olarak tutulur (computeOrgImpact + upsertOrgImpactCerts) — bu GET route
 * ile toplu geriye-dönük backfill (api/super-admin/backfill-cert-codes) AYNI
 * kodu çağırır, asla çatallanmaz.
 *
 * Yetki: super-admin VEYA users/{uid}.managed{Ngo|Brand|Club}Id === orgId. Aksi 403.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';
import { computeOrgImpact, fetchOrgName, upsertOrgImpactCerts, type OrgKind } from '@/lib/org-impact';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function errJson(errorCode: string, message: string, status: number) {
  return NextResponse.json({ errorCode, message }, { status });
}

const MANAGED_FIELD: Record<OrgKind, string> = {
  ngo: 'managedNgoId',
  brand: 'managedBrandId',
  club: 'managedClubId',
};

export async function GET(req: NextRequest): Promise<NextResponse> {
  const authHeader = req.headers.get('authorization') ?? '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length).trim() : '';
  if (!idToken) return errJson('unauthenticated', 'Token gerekli', 401);

  let uid: string;
  let role: unknown;
  try {
    const decoded = await getAdminAuth().verifyIdToken(idToken);
    uid = decoded.uid;
    role = (decoded as { role?: unknown }).role;
  } catch {
    return errJson('unauthenticated', 'Geçersiz token', 401);
  }

  const orgId = req.nextUrl.searchParams.get('orgId');
  const kindParam = req.nextUrl.searchParams.get('kind');
  if (!orgId) return errJson('invalid_input', 'orgId gerekli', 400);
  if (kindParam !== 'ngo' && kindParam !== 'brand' && kindParam !== 'club') {
    return errJson('invalid_input', 'kind ngo|brand|club olmalı', 400);
  }
  const kind = kindParam;

  const db = getAdminFirestore();

  // Yetki — super-admin ya da bu kurumu yöneten kullanıcı.
  let authorized = role === 'super-admin';
  if (!authorized) {
    const snap = await db.collection(COLLECTIONS.users).doc(uid).get();
    const u = snap.data() as Record<string, unknown> | undefined;
    if (u?.role === 'super-admin' || u?.[MANAGED_FIELD[kind]] === orgId) authorized = true;
  }
  if (!authorized) return errJson('forbidden', 'Bu kurumun etki sertifikasını görme yetkin yok.', 403);

  // Kurum adı (+ logo) + metrikler — TEK KAYNAK lib.
  const { orgName, logoUrl } = await fetchOrgName(db, kind, orgId);
  const impact = await computeOrgImpact(db, orgId);

  // Doğrulama kayıtları: etki sertifikası kodlarını `certificates`'a yaz → /c YEŞİL.
  try {
    await upsertOrgImpactCerts(db, kind, orgId, orgName, impact);
  } catch {
    /* best-effort: doğrulama kaydı yazılamazsa sertifika yine görüntülenir/indirilir */
  }

  return NextResponse.json({ ok: true, orgName, cumulative: impact.cumulative, months: impact.months, logoUrl });
}
