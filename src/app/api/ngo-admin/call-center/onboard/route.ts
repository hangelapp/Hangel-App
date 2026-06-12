/**
 * POST /api/ngo-admin/call-center/onboard
 *
 * STK admin'i çağrı merkezi (sanal santral) hizmetine başvurur. Hibrit aracılık
 * modeli: STK formu doldurur, hangel başvuru e-postasını PBX sağlayıcı firmaya
 * yollar, firma numarayı aktif eder. Numara `santralNumberPool` havuzundan
 * rezerve edilir (status: 'reserved' → ileride 'assigned' olur).
 *
 * Body:
 *   - packageId: string           (santralPackages koleksiyonundaki paket id'si)
 *   - documentsRefs: string[]     (Storage path'leri — vekaletname, ticaret sicil vs.)
 *   - requestedCallerIdNumber: string  (havuzdaki numara id'si)
 *   - dpaAccepted: boolean        (KVKK DPA onayı zorunlu)
 *
 * KVKK: STK = Veri Sorumlusu, Hangel = Veri İşleyen. DPA kabulü zorunlu.
 * Recording dosyalarına super-admin erişmez; yalnızca metadata.
 *
 * Yanıt: { ok, ngoCallCenterId, formId, message }
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { COLLECTIONS } from '@/firebase/collections';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const NGO_CALL_CENTER = 'ngoCallCenter';
const ONBOARDING_FORMS = 'onboardingForms';
const NUMBER_POOL = 'santralNumberPool';
const PROVIDERS = 'santralProviders';
const AUDIT_LOG = 'callAuditLog';

interface OnboardBody {
  packageId?: unknown;
  documentsRefs?: unknown;
  requestedCallerIdNumber?: unknown;
  dpaAccepted?: unknown;
  companyType?: unknown;
  formData?: unknown;
}

interface CallerContext {
  uid: string;
  ngoId: string;
  role?: string;
  email?: string;
}

async function authorize(req: NextRequest): Promise<CallerContext | null> {
  const authHeader = req.headers.get('authorization') || '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!idToken) return null;
  try {
    const decoded = await getAdminAuth().verifyIdToken(idToken) as { uid: string; role?: string; email?: string };
    const snap = await getAdminFirestore().collection(COLLECTIONS.users).doc(decoded.uid).get();
    if (!snap.exists) return null;
    const d = snap.data() as { role?: string; managedNgoId?: string };
    if (!d?.managedNgoId) return null;
    // ngo-admin veya super-admin rolü kabul; managedNgoId tenant'ı verir.
    if (d.role !== 'ngo-admin' && d.role !== 'super-admin') return null;
    return { uid: decoded.uid, ngoId: d.managedNgoId, role: d.role, email: decoded.email };
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const ctx = await authorize(req);
  if (!ctx) {
    return NextResponse.json({ errorCode: 'FORBIDDEN', message: 'NGO admin yetkisi gerekli.' }, { status: 403 });
  }

  let body: OnboardBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ errorCode: 'BAD_JSON', message: 'Geçersiz JSON gövdesi.' }, { status: 400 });
  }

  const packageId = typeof body.packageId === 'string' ? body.packageId.trim() : '';
  const requestedCallerIdNumber =
    typeof body.requestedCallerIdNumber === 'string' ? body.requestedCallerIdNumber.trim() : '';
  const dpaAccepted = body.dpaAccepted === true;
  const documentsRefs = Array.isArray(body.documentsRefs)
    ? (body.documentsRefs as unknown[]).filter((s): s is string => typeof s === 'string')
    : [];
  const companyType = typeof body.companyType === 'string' ? body.companyType : 'STK';
  const formData =
    body.formData && typeof body.formData === 'object' && !Array.isArray(body.formData)
      ? (body.formData as Record<string, unknown>)
      : {};

  if (!packageId) {
    return NextResponse.json({ errorCode: 'BAD_INPUT', message: 'packageId zorunlu.' }, { status: 400 });
  }
  if (!requestedCallerIdNumber) {
    return NextResponse.json(
      { errorCode: 'BAD_INPUT', message: 'requestedCallerIdNumber zorunlu.' },
      { status: 400 },
    );
  }
  if (!dpaAccepted) {
    return NextResponse.json(
      { errorCode: 'DPA_REQUIRED', message: 'KVKK Veri İşleyen Sözleşmesi onayı zorunludur.' },
      { status: 400 },
    );
  }

  const db = getAdminFirestore();
  const ngoId = ctx.ngoId;

  // Idempotency: aynı STK için açık bir kayıt varsa rezervasyonu tekrar oluşturma.
  const ngoCallCenterRef = db.collection(NGO_CALL_CENTER).doc(ngoId);
  const existing = await ngoCallCenterRef.get();
  if (existing.exists) {
    const data = existing.data() as { status?: string };
    if (data.status === 'active' || data.status === 'pending') {
      return NextResponse.json(
        {
          errorCode: 'ALREADY_ONBOARDED',
          message: 'Bu STK için zaten başvuru mevcut.',
        },
        { status: 409 },
      );
    }
  }

  // Numara havuzundan rezervasyon — yalnızca 'available' numarayı al.
  const numberRef = db.collection(NUMBER_POOL).doc(requestedCallerIdNumber);
  const numberSnap = await numberRef.get();
  if (!numberSnap.exists) {
    return NextResponse.json({ errorCode: 'NUMBER_NOT_FOUND', message: 'Seçilen numara bulunamadı.' }, { status: 404 });
  }
  const numberData = numberSnap.data() as {
    status?: string;
    number?: string;
    providerId?: string;
    assignedToNgoId?: string | null;
  };
  if (numberData.status !== 'available' || numberData.assignedToNgoId) {
    return NextResponse.json(
      { errorCode: 'NUMBER_TAKEN', message: 'Seçilen numara artık müsait değil. Lütfen başka bir numara seçin.' },
      { status: 409 },
    );
  }

  // Provider bilgilerini çek (mail için).
  let providerEmail: string | null = null;
  let providerName: string | null = null;
  let sipServer: string | null = null;
  if (numberData.providerId) {
    const providerSnap = await db.collection(PROVIDERS).doc(numberData.providerId).get();
    if (providerSnap.exists) {
      const p = providerSnap.data() as { supportEmail?: string; displayName?: string; sipServer?: string };
      providerEmail = p.supportEmail ?? null;
      providerName = p.displayName ?? null;
      sipServer = p.sipServer ?? null;
    }
  }

  const formsCol = ngoCallCenterRef.collection(ONBOARDING_FORMS);
  const formRef = formsCol.doc();
  const auditRef = db.collection(AUDIT_LOG).doc();
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || null;

  // Atomik yazım: ngoCallCenter (pending) + form + numara rezerve + audit log + mailQueue.
  const batch = db.batch();

  batch.set(ngoCallCenterRef, {
    ngoId,
    providerId: numberData.providerId ?? null,
    sipUsername: null,
    sipServer: sipServer,
    callerIdNumber: numberData.number ?? null,
    reservedNumberId: requestedCallerIdNumber,
    status: 'pending',
    packageId,
    monthlyMinutesQuota: 0,
    currentMonthUsage: 0,
    createdAt: FieldValue.serverTimestamp(),
    dpaAcceptedAt: FieldValue.serverTimestamp(),
    dpaAcceptedBy: ctx.uid,
    documentsRefs,
  }, { merge: true });

  batch.set(formRef, {
    ngoId,
    companyType,
    formData,
    packageId,
    requestedCallerIdNumber,
    requestedNumberDisplay: numberData.number ?? null,
    documentsRefs,
    dpaAccepted: true,
    dpaAcceptedAt: FieldValue.serverTimestamp(),
    submittedAt: FieldValue.serverTimestamp(),
    submittedBy: ctx.uid,
    status: 'pending',
    providerEmailSentAt: null,
  });

  batch.update(numberRef, {
    status: 'reserved',
    assignedToNgoId: ngoId,
    assignedAt: FieldValue.serverTimestamp(),
  });

  batch.set(auditRef, {
    actorUid: ctx.uid,
    action: 'call_center.onboard.submit',
    resourceType: 'ngoCallCenter',
    resourceId: ngoId,
    timestamp: FieldValue.serverTimestamp(),
    ipAddress: ip,
    details: {
      formId: formRef.id,
      packageId,
      requestedCallerIdNumber,
      providerId: numberData.providerId ?? null,
      documentsCount: documentsRefs.length,
    },
  });

  // mailQueue — provider'a aktivasyon bildirimi (mock; gerçek mail için SES/Resend
  // worker queue'yu okur). Recording byte log'lanmaz; sadece form metadata.
  if (providerEmail) {
    const mailRef = db.collection(COLLECTIONS.mailQueue).doc();
    batch.set(mailRef, {
      to: providerEmail,
      kind: 'call_center.onboarding',
      subject: `[hangel] Yeni STK çağrı merkezi başvurusu — ${ngoId}`,
      template: 'santral-onboarding-provider',
      data: {
        ngoId,
        providerName,
        packageId,
        requestedNumber: numberData.number ?? null,
        formId: formRef.id,
        companyType,
      },
      status: 'queued',
      createdAt: FieldValue.serverTimestamp(),
      createdBy: ctx.uid,
    });
  }

  await batch.commit();

  // Form doc'a providerEmailSentAt damgası vur (mail kuyruğa eklendiği an).
  if (providerEmail) {
    await formRef.update({ providerEmailSentAt: FieldValue.serverTimestamp() });
  }

  return NextResponse.json({
    ok: true,
    ngoCallCenterId: ngoId,
    formId: formRef.id,
    message: providerEmail
      ? 'Başvurunuz alındı. Sağlayıcı firmaya aktivasyon e-postası iletildi.'
      : 'Başvurunuz alındı. hangel ekibi en kısa sürede aktivasyonu başlatacak.',
  });
}
