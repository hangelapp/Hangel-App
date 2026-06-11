/**
 * POST /api/ngo-admin/website/custom-domain
 *
 * STK kendi alan adını (custom domain) hangel'e bağlar — Cloudflare for SaaS
 * Custom Hostnames üzerinden. STK domainini CNAME ile fallback origin'e yönlendirir;
 * Cloudflare SSL'i otomatik üretir. Durum ngos/{ngoId}.siteSettings.customDomain'e
 * yazılır (Admin SDK; client yazamaz).
 *
 * Body: { action:'register'|'status'|'remove', ngoId, domain? }
 *  - register: Cloudflare'e hostname ekler + STK'ya CNAME hedefini döner.
 *  - status:   güncel SSL/doğrulama durumunu sorgular.
 *  - remove:   hostname'i siler.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { COLLECTIONS } from '@/firebase/collections';
import { isCloudflareConfigured, addCustomHostname, getCustomHostname, deleteCustomHostname, normalizeCustomHost } from '@/lib/cloudflare-saas';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function authorize(req: NextRequest, ngoId: string): Promise<boolean> {
  const authHeader = req.headers.get('authorization') || '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!idToken) return false;
  try {
    const decoded = await getAdminAuth().verifyIdToken(idToken) as { uid: string; role?: string };
    const snap = await getAdminFirestore().collection(COLLECTIONS.users).doc(decoded.uid).get();
    const d = snap.data() as { role?: string; managedNgoId?: string; managedBrandId?: string; managedClubId?: string } | undefined;
    if (d?.role === 'super-admin') return true;
    return d?.managedNgoId === ngoId || d?.managedBrandId === ngoId || d?.managedClubId === ngoId;
  } catch { return false; }
}

export async function POST(req: NextRequest) {
  let body: { action?: string; ngoId?: string; domain?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ errorCode: 'BAD_JSON', message: 'Geçersiz JSON' }, { status: 400 }); }

  const action = body.action;
  const ngoId = typeof body.ngoId === 'string' ? body.ngoId : '';
  if (!ngoId) return NextResponse.json({ errorCode: 'BAD_INPUT', message: 'ngoId gerekli.' }, { status: 400 });
  if (!(await authorize(req, ngoId))) return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'Yetkiniz yok.' }, { status: 403 });

  if (!isCloudflareConfigured()) {
    return NextResponse.json({
      errorCode: 'NOT_CONFIGURED',
      message: 'Özel alan adı altyapısı (Cloudflare) henüz yapılandırılmadı. hangel ekibi yapılandırınca aktifleşecek.',
    }, { status: 503 });
  }

  const db = getAdminFirestore();
  const ngoRef = db.collection(COLLECTIONS.ngos).doc(ngoId);

  try {
    if (action === 'remove') {
      const snap = await ngoRef.get();
      const cd = (snap.data() as { siteSettings?: { customDomain?: { cfId?: string } } } | undefined)?.siteSettings?.customDomain;
      if (cd?.cfId) await deleteCustomHostname(cd.cfId);
      await ngoRef.set({ siteSettings: { customDomain: FieldValue.delete() } }, { merge: true });
      return NextResponse.json({ ok: true, removed: true });
    }

    const domain = normalizeCustomHost(body.domain || '');
    if (!domain || !/^[a-z0-9.-]+\.[a-z]{2,}$/.test(domain)) {
      return NextResponse.json({ errorCode: 'BAD_DOMAIN', message: 'Geçerli bir alan adı girin (ör. dernek.org).' }, { status: 400 });
    }

    const st = action === 'register' ? await addCustomHostname(domain) : (await getCustomHostname(domain));
    if (!st) {
      return NextResponse.json({ errorCode: 'NOT_FOUND', message: 'Alan adı kaydı bulunamadı. Önce "Bağla" deyin.' }, { status: 404 });
    }

    await ngoRef.set({
      siteSettings: {
        customDomain: {
          hostname: st.hostname,
          cfId: st.id,
          status: st.status,
          sslStatus: st.sslStatus,
          cnameTarget: st.cnameTarget,
          updatedAt: new Date().toISOString(),
        },
      },
    }, { merge: true });

    const active = st.status === 'active' && st.sslStatus === 'active';
    return NextResponse.json({
      ok: true,
      hostname: st.hostname,
      cnameTarget: st.cnameTarget,
      status: st.status,
      sslStatus: st.sslStatus,
      active,
      instruction: `Alan adı sağlayıcınızın panelinde şu CNAME kaydını ekleyin:  ${st.hostname}  →  ${st.cnameTarget}  . DNS yayılınca SSL otomatik üretilecek (birkaç dakika–saat).`,
    });
  } catch (err) {
    console.error('[website/custom-domain] failed', err);
    const msg = err instanceof Error ? err.message : 'İşlem başarısız.';
    return NextResponse.json({ errorCode: 'INTERNAL', message: msg }, { status: 500 });
  }
}
