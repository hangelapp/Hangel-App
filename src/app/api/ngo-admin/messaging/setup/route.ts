/**
 * GET / POST /api/ngo-admin/messaging/setup
 *
 * STK yöneticisinin toplu SMS + toplu mail kurulum sihirbazının durumunu yönetir.
 * Santral (çağrı merkezi) onboard akışının SMS/mail karşılığıdır: STK adım adım
 * sağlayıcıyla kurulum bilgilerini girer, "submit" ile durum 'pending' olur ve
 * sağlayıcı/destek ekibine bildirim maili kuyruğa eklenir. Sağlayıcı aktivasyonu
 * tamamlayınca durum 'active' yapılır (super-admin tarafında).
 *
 * Durum, yeni koleksiyon AÇMADAN mevcut `ngoMessagingWallets/{ngoId}` dokümanının
 * `setup` map alanında saklanır:
 *   setup: {
 *     status: 'not_started' | 'pending' | 'active',
 *     smsSenderId, mailFromName, mailFromEmail, mailDomain,
 *     docsKvkk, docsIys, docsDilekce (URL string | boolean),
 *     submittedAt
 *   }
 *
 * Hata formatı: { errorCode, message }.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { COLLECTIONS } from '@/firebase/collections';
import { requireNgoAdmin } from '@/lib/messaging/server-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Sağlayıcı/destek bildirim adresi — env yoksa hangel destek adresine düşer.
const SETUP_NOTIFY_EMAIL = process.env.MESSAGING_SETUP_NOTIFY_EMAIL || 'destek@hangel.org';

type SetupStatus = 'not_started' | 'pending' | 'active';

interface SetupShape {
  status: SetupStatus;
  smsSenderId: string | null;
  mailFromName: string | null;
  mailFromEmail: string | null;
  mailDomain: string | null;
  docsKvkk: string | boolean | null;
  docsIys: string | boolean | null;
  docsDilekce: string | boolean | null;
  submittedAt: unknown;
}

const DEFAULT_SETUP: SetupShape = {
  status: 'not_started',
  smsSenderId: null,
  mailFromName: null,
  mailFromEmail: null,
  mailDomain: null,
  docsKvkk: null,
  docsIys: null,
  docsDilekce: null,
  submittedAt: null,
};

function readSetup(raw: unknown): SetupShape {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_SETUP };
  const s = raw as Record<string, unknown>;
  const status: SetupStatus =
    s.status === 'pending' || s.status === 'active' ? s.status : 'not_started';
  const asStrOrBool = (v: unknown): string | boolean | null =>
    typeof v === 'string' ? v : typeof v === 'boolean' ? v : null;
  return {
    status,
    smsSenderId: typeof s.smsSenderId === 'string' ? s.smsSenderId : null,
    mailFromName: typeof s.mailFromName === 'string' ? s.mailFromName : null,
    mailFromEmail: typeof s.mailFromEmail === 'string' ? s.mailFromEmail : null,
    mailDomain: typeof s.mailDomain === 'string' ? s.mailDomain : null,
    docsKvkk: asStrOrBool(s.docsKvkk),
    docsIys: asStrOrBool(s.docsIys),
    docsDilekce: asStrOrBool(s.docsDilekce),
    submittedAt: s.submittedAt ?? null,
  };
}

export async function GET(req: NextRequest) {
  const auth = await requireNgoAdmin(req);
  if (auth.error) {
    return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'NGO admin yetkisi gerekli.' }, { status: 403 });
  }
  const { ngoId } = auth.actor;
  const db = getAdminFirestore();
  const snap = await db.collection(COLLECTIONS.ngoMessagingWallets).doc(ngoId).get();
  const setup = snap.exists ? readSetup((snap.data() as Record<string, unknown>).setup) : { ...DEFAULT_SETUP };
  return NextResponse.json({ ok: true, setup });
}

interface PostBody {
  action?: unknown;
  smsSenderId?: unknown;
  mailFromName?: unknown;
  mailFromEmail?: unknown;
  mailDomain?: unknown;
  docsKvkk?: unknown;
  docsIys?: unknown;
  docsDilekce?: unknown;
}

// SMS gönderici başlığı: max 11 karakter, alfanümerik, boşluksuz.
const SENDER_ID_RE = /^[A-Za-z0-9]{1,11}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DOMAIN_RE = /^[a-z0-9.-]+\.[a-z]{2,}$/i;

export async function POST(req: NextRequest) {
  const auth = await requireNgoAdmin(req);
  if (auth.error) {
    return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'NGO admin yetkisi gerekli.' }, { status: 403 });
  }
  const { ngoId, uid } = auth.actor;

  let body: PostBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ errorCode: 'BAD_JSON', message: 'Geçersiz JSON gövdesi.' }, { status: 400 });
  }

  const action = body.action === 'submit' ? 'submit' : 'save';

  // Yalnızca gövdede gelen alanları merge et (kısmi kayıt destekli).
  const patch: Record<string, unknown> = {};
  const asStrOrBool = (v: unknown): string | boolean | null =>
    typeof v === 'string' ? v : typeof v === 'boolean' ? v : null;

  if (body.smsSenderId !== undefined) {
    const raw = typeof body.smsSenderId === 'string' ? body.smsSenderId.trim() : '';
    if (raw && !SENDER_ID_RE.test(raw)) {
      return NextResponse.json(
        { errorCode: 'BAD_SENDER_ID', message: 'Gönderici başlığı en fazla 11 karakter, alfanümerik ve boşluksuz olmalıdır.' },
        { status: 400 },
      );
    }
    patch['setup.smsSenderId'] = raw || null;
  }
  if (body.mailFromName !== undefined) {
    patch['setup.mailFromName'] = typeof body.mailFromName === 'string' ? body.mailFromName.trim() || null : null;
  }
  if (body.mailFromEmail !== undefined) {
    const raw = typeof body.mailFromEmail === 'string' ? body.mailFromEmail.trim() : '';
    if (raw && !EMAIL_RE.test(raw)) {
      return NextResponse.json(
        { errorCode: 'BAD_EMAIL', message: 'Geçerli bir gönderen e-posta adresi girin.' },
        { status: 400 },
      );
    }
    patch['setup.mailFromEmail'] = raw || null;
  }
  if (body.mailDomain !== undefined) {
    const raw = typeof body.mailDomain === 'string' ? body.mailDomain.trim().toLowerCase() : '';
    if (raw && !DOMAIN_RE.test(raw)) {
      return NextResponse.json(
        { errorCode: 'BAD_DOMAIN', message: 'Geçerli bir alan adı (domain) girin. Örn: hangel.org' },
        { status: 400 },
      );
    }
    patch['setup.mailDomain'] = raw || null;
  }
  if (body.docsKvkk !== undefined) patch['setup.docsKvkk'] = asStrOrBool(body.docsKvkk);
  if (body.docsIys !== undefined) patch['setup.docsIys'] = asStrOrBool(body.docsIys);
  if (body.docsDilekce !== undefined) patch['setup.docsDilekce'] = asStrOrBool(body.docsDilekce);

  const db = getAdminFirestore();
  const walletRef = db.collection(COLLECTIONS.ngoMessagingWallets).doc(ngoId);

  if (action === 'submit') {
    // Submit için mevcut + gelen değerlerin birleşimi tam olmalı.
    const existingSnap = await walletRef.get();
    const existing = existingSnap.exists
      ? readSetup((existingSnap.data() as Record<string, unknown>).setup)
      : { ...DEFAULT_SETUP };

    const merged: SetupShape = {
      ...existing,
      smsSenderId: 'setup.smsSenderId' in patch ? (patch['setup.smsSenderId'] as string | null) : existing.smsSenderId,
      mailFromName: 'setup.mailFromName' in patch ? (patch['setup.mailFromName'] as string | null) : existing.mailFromName,
      mailFromEmail: 'setup.mailFromEmail' in patch ? (patch['setup.mailFromEmail'] as string | null) : existing.mailFromEmail,
      mailDomain: 'setup.mailDomain' in patch ? (patch['setup.mailDomain'] as string | null) : existing.mailDomain,
      docsKvkk: 'setup.docsKvkk' in patch ? (patch['setup.docsKvkk'] as string | boolean | null) : existing.docsKvkk,
      docsIys: 'setup.docsIys' in patch ? (patch['setup.docsIys'] as string | boolean | null) : existing.docsIys,
      docsDilekce: 'setup.docsDilekce' in patch ? (patch['setup.docsDilekce'] as string | boolean | null) : existing.docsDilekce,
      status: existing.status,
      submittedAt: existing.submittedAt,
    };

    if (!merged.smsSenderId) {
      return NextResponse.json(
        { errorCode: 'INCOMPLETE', message: 'SMS gönderici başlığı zorunlu. Adımları tamamlayın.' },
        { status: 400 },
      );
    }
    if (!merged.mailFromName || !merged.mailFromEmail || !merged.mailDomain) {
      return NextResponse.json(
        { errorCode: 'INCOMPLETE', message: 'Mail gönderen bilgileri (ad, e-posta, alan adı) zorunlu. Adımları tamamlayın.' },
        { status: 400 },
      );
    }

    // STK adını bildirim maili için çek.
    let ngoName = ngoId;
    const ngoSnap = await db.collection(COLLECTIONS.ngos).doc(ngoId).get();
    if (ngoSnap.exists) {
      const n = ngoSnap.data() as { name?: string };
      if (n.name) ngoName = n.name;
    }

    // Son adımda gelen alanlar + status/submittedAt'i field-path merge ile yaz.
    const submitPatch: Record<string, unknown> = {
      ...patch,
      'setup.status': 'pending',
      'setup.submittedAt': FieldValue.serverTimestamp(),
    };

    const batch = db.batch();
    batch.set(walletRef, submitPatch, { merge: true });

    const mailRef = db.collection(COLLECTIONS.mailQueue).doc();
    batch.set(mailRef, {
      to: SETUP_NOTIFY_EMAIL,
      kind: 'messaging.setup.request',
      subject: `Yeni SMS/Mail kurulum talebi: ${ngoName}`,
      template: 'messaging-setup-provider',
      data: {
        ngoId,
        ngoName,
        smsSenderId: merged.smsSenderId,
        mailFromName: merged.mailFromName,
        mailFromEmail: merged.mailFromEmail,
        mailDomain: merged.mailDomain,
        docsKvkk: merged.docsKvkk ?? false,
        docsIys: merged.docsIys ?? false,
        docsDilekce: merged.docsDilekce ?? false,
      },
      status: 'queued',
      createdAt: FieldValue.serverTimestamp(),
      createdBy: uid,
    });

    await batch.commit();

    return NextResponse.json({
      ok: true,
      setup: { ...merged, status: 'pending' },
      message: 'Kurulum talebiniz alındı ve sağlayıcıya iletildi. Aktivasyon tamamlandığında panelleri kullanabilirsiniz.',
    });
  }

  // action === 'save' → yalnızca gelen alanları merge et.
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ errorCode: 'NO_FIELDS', message: 'Kaydedilecek alan yok.' }, { status: 400 });
  }
  await walletRef.set(patch, { merge: true });

  const snap = await walletRef.get();
  const setup = snap.exists ? readSetup((snap.data() as Record<string, unknown>).setup) : { ...DEFAULT_SETUP };
  return NextResponse.json({ ok: true, setup });
}
