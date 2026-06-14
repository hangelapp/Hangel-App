/**
 * POST /api/org/lifecycle
 *
 * Kurumsal (STK/Kulüp/Marka) yaşam döngüsü bildirimi tetikler. Bireysel
 * kullanıcıya hoş geldin mesajı attığımız gibi, kurumlara da:
 *   - kayıt alındı / kayıt onaylandı
 *   - etkinlik kaydı alındı / etkinlik onaylandı (yayında)
 *   - gönüllülük ilanı kaydı alındı / ilan onaylandı (yayında)
 * aşamalarında hem in-app bildirim (+push) hem de kurumsal numaraya SMS gider.
 *
 * Body: { kind: 'ngo_registration'|'event'|'volunteer', stage: 'received'|'approved', refId: string }
 *
 * Yetki:
 *   - stage 'received': caller, kaydı oluşturan kişi olmalı (owner uid eşleşmesi).
 *   - stage 'approved': caller super-admin olmalı.
 *
 * Auth: Authorization: Bearer <idToken> zorunlu.
 * Idempotency: refId+stage başına rate-limit ile çift gönderim azaltılır.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';
import { checkRateLimit } from '@/lib/rate-limit';
import {
  dispatchOrgLifecycle,
  resolveCorporatePhone,
  type OrgLifecycleKind,
  type OrgLifecycleStage,
} from '@/lib/org-lifecycle';

export const runtime = 'nodejs';

const KINDS: OrgLifecycleKind[] = ['ngo_registration', 'event', 'volunteer'];
const STAGES: OrgLifecycleStage[] = ['received', 'approved'];

/** Bir kurum dökümanından (ngo/club/brand) iletişim telefonu çıkar. */
function extractPhone(d: Record<string, unknown> | undefined): {
  phone: string | null;
  cc: string | null;
} {
  if (!d) return { phone: null, cc: null };
  const contact = (d.contact as Record<string, unknown> | undefined) ?? {};
  const phone =
    (contact.phone as string) || (d.phone as string) || null;
  const cc =
    (contact.phoneCountryCode as string) ||
    (d.phoneCountryCode as string) ||
    '+90';
  return { phone: phone || null, cc };
}

async function callerIsSuperAdmin(
  uid: string,
  decoded: { role?: string; superAdminPermissions?: unknown },
): Promise<boolean> {
  if (decoded.role === 'super-admin' || !!decoded.superAdminPermissions) return true;
  try {
    const snap = await getAdminFirestore().collection(COLLECTIONS.users).doc(uid).get();
    const u = snap.data();
    return (
      u?.role === 'super-admin' ||
      (Array.isArray(u?.superAdminPermissions) && u.superAdminPermissions.length > 0)
    );
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
    if (!idToken) {
      return NextResponse.json({ ok: false, errorCode: 'UNAUTHENTICATED' }, { status: 401 });
    }
    let callerUid: string;
    let decoded: { uid: string; role?: string; superAdminPermissions?: unknown };
    try {
      decoded = (await getAdminAuth().verifyIdToken(idToken)) as typeof decoded;
      callerUid = decoded.uid;
    } catch {
      return NextResponse.json({ ok: false, errorCode: 'UNAUTHENTICATED' }, { status: 401 });
    }

    const body = await req.json().catch(() => null);
    const kind = body?.kind as OrgLifecycleKind;
    const stage = body?.stage as OrgLifecycleStage;
    const refId = typeof body?.refId === 'string' ? body.refId : '';
    if (!KINDS.includes(kind) || !STAGES.includes(stage) || !refId) {
      return NextResponse.json({ ok: false, errorCode: 'INVALID_INPUT' }, { status: 400 });
    }

    // Çift gönderimi azalt: aynı refId+stage 60sn içinde 1 kez.
    const limit = await checkRateLimit({
      bucket: 'org-lifecycle',
      key: `${kind}:${stage}:${refId}`,
      limit: 1,
      windowMs: 60_000,
    });
    if (!limit.allowed) {
      return NextResponse.json({ ok: true, deduped: true });
    }

    const db = getAdminFirestore();

    let name = '';
    let phone: string | null = null;
    let cc: string | null = '+90';
    const recipients: string[] = [];
    let ownerUid = '';
    let link: string | undefined;

    if (kind === 'ngo_registration') {
      const snap = await db.collection(COLLECTIONS.applications).doc(refId).get();
      if (!snap.exists) {
        return NextResponse.json({ ok: false, errorCode: 'NOT_FOUND' }, { status: 404 });
      }
      const app = snap.data() as Record<string, unknown>;
      name = (app.name as string) || (app.org as string) || 'Kurumunuz';
      phone = (app.phone as string) || null;
      cc = (app.phoneCountryCode as string) || '+90';
      ownerUid = (app.userId as string) || (app.authorizedUserId as string) || '';
      const entityId = (app.createdEntityId as string) || '';
      if (ownerUid) recipients.push(ownerUid);
      if (stage === 'approved' && entityId) recipients.push(entityId);
      link = stage === 'approved' ? '/ngo-admin' : '/my-applications';
    } else if (kind === 'event') {
      const snap = await db.collection(COLLECTIONS.events).doc(refId).get();
      if (!snap.exists) {
        return NextResponse.json({ ok: false, errorCode: 'NOT_FOUND' }, { status: 404 });
      }
      const ev = snap.data() as Record<string, unknown>;
      name = (ev.name as string) || 'Etkinliğiniz';
      ownerUid = (ev.createdBy as string) || '';
      const organizerId = (ev.organizerId as string) || '';
      const organizerKind = (ev.organizerKind as string) || 'ngo';
      const coll =
        organizerKind === 'club'
          ? COLLECTIONS.clubs
          : organizerKind === 'brand'
            ? COLLECTIONS.brands
            : COLLECTIONS.ngos;
      if (organizerId) {
        const orgSnap = await db.collection(coll).doc(organizerId).get();
        const ext = extractPhone(orgSnap.data());
        phone = ext.phone;
        cc = ext.cc;
        recipients.push(organizerId);
      }
      if (ownerUid) recipients.push(ownerUid);
      link = '/ngo-admin/events';
    } else {
      // volunteer
      const snap = await db.collection(COLLECTIONS.volunteering).doc(refId).get();
      if (!snap.exists) {
        return NextResponse.json({ ok: false, errorCode: 'NOT_FOUND' }, { status: 404 });
      }
      const vol = snap.data() as Record<string, unknown>;
      name = (vol.title as string) || 'Gönüllülük ilanınız';
      ownerUid = (vol.createdBy as string) || '';
      const ngoId = (vol.ngoId as string) || '';
      if (ngoId) {
        const orgSnap = await db.collection(COLLECTIONS.ngos).doc(ngoId).get();
        const ext = extractPhone(orgSnap.data());
        phone = ext.phone;
        cc = ext.cc;
        recipients.push(ngoId);
      }
      if (ownerUid) recipients.push(ownerUid);
      link = '/ngo-admin/volunteer';
    }

    // Yetki kontrolü
    if (stage === 'approved') {
      if (!(await callerIsSuperAdmin(callerUid, decoded))) {
        return NextResponse.json({ ok: false, errorCode: 'FORBIDDEN' }, { status: 403 });
      }
    } else {
      // received: yalnızca kaydı oluşturan kişi (veya super-admin).
      if (callerUid !== ownerUid && !(await callerIsSuperAdmin(callerUid, decoded))) {
        return NextResponse.json({ ok: false, errorCode: 'FORBIDDEN' }, { status: 403 });
      }
    }

    const phoneE164 = resolveCorporatePhone(phone, cc);
    const result = await dispatchOrgLifecycle({
      kind,
      stage,
      name,
      recipientUserIds: recipients,
      phoneE164,
      link,
    });

    return NextResponse.json(result);
  } catch (e) {
    console.error('[org/lifecycle] internal error', e);
    return NextResponse.json({ ok: false, errorCode: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
