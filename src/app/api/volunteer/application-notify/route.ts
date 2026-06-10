/**
 * POST /api/volunteer/application-notify
 *
 * Gönüllü başvuru yaşam döngüsünün her aşamasında ÜÇ tarafa fan-out bildirim
 * yazar (Admin SDK):
 *   1. Başvuran kullanıcı (application.userId)
 *   2. İlgili STK yöneticisi (volunteering/{entityId}.ngoId → ngos/{ngoId}.adminUserId)
 *   3. Tüm süper-adminler (users where role == 'super-admin')
 *
 * notifications doc'ları client'tan değil yalnızca server'dan (Admin SDK) yazılır;
 * bu yüzden fan-out burada yapılır.
 *
 * Body: { applicationId: string, stage: 'applied' | 'approved' | 'rejected' }
 * Auth: Bearer <Firebase ID token> (verifyIdToken).
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';
import { FieldValue } from 'firebase-admin/firestore';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Stage = 'applied' | 'approved' | 'rejected';

interface NotificationDraft {
  userId: string;
  title: string;
  body: string;
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization') || '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!idToken) {
    return NextResponse.json({ errorCode: 'UNAUTHENTICATED', message: 'Oturum doğrulanamadı.' }, { status: 401 });
  }
  try {
    await getAdminAuth().verifyIdToken(idToken);
  } catch {
    return NextResponse.json({ errorCode: 'INVALID_TOKEN', message: 'Geçersiz oturum belirteci.' }, { status: 401 });
  }

  let body: { applicationId?: string; stage?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ errorCode: 'BAD_JSON', message: 'Geçersiz JSON.' }, { status: 400 });
  }

  const applicationId = typeof body.applicationId === 'string' ? body.applicationId : '';
  const stage = body.stage as Stage;
  if (!applicationId || (stage !== 'applied' && stage !== 'approved' && stage !== 'rejected')) {
    return NextResponse.json({ errorCode: 'BAD_INPUT', message: 'applicationId + geçerli stage gerekli.' }, { status: 400 });
  }

  const db = getAdminFirestore();

  let appData: { userId?: string; userName?: string; title?: string; entityId?: string; org?: string } | undefined;
  try {
    const appSnap = await db.collection(COLLECTIONS.applications).doc(applicationId).get();
    if (!appSnap.exists) {
      return NextResponse.json({ errorCode: 'NOT_FOUND', message: 'Başvuru bulunamadı.' }, { status: 404 });
    }
    appData = appSnap.data() as typeof appData;
  } catch (err) {
    console.error('[application-notify] application read failed', err);
    return NextResponse.json({ errorCode: 'READ_FAILED', message: 'Başvuru okunamadı.' }, { status: 500 });
  }

  const applicantId = appData?.userId || '';
  const applicantName = appData?.userName || 'Bir gönüllü';
  const oppTitle = appData?.title || 'gönüllülük ilanı';
  const entityId = appData?.entityId || '';

  // STK yöneticisini çöz: volunteering/{entityId}.ngoId → ngos/{ngoId}.adminUserId
  let ngoAdminId = '';
  if (entityId) {
    try {
      const oppSnap = await db.collection(COLLECTIONS.volunteering).doc(entityId).get();
      const ngoId = (oppSnap.data() as { ngoId?: string } | undefined)?.ngoId;
      if (ngoId) {
        const ngoSnap = await db.collection(COLLECTIONS.ngos).doc(ngoId).get();
        ngoAdminId = (ngoSnap.data() as { adminUserId?: string } | undefined)?.adminUserId || '';
      }
    } catch (err) {
      console.error('[application-notify] ngo admin resolve failed', err);
    }
  }

  // Süper-adminler
  const superAdminIds: string[] = [];
  try {
    const saSnap = await db.collection(COLLECTIONS.users).where('role', '==', 'super-admin').get();
    saSnap.forEach((d) => superAdminIds.push(d.id));
  } catch (err) {
    console.error('[application-notify] super-admin query failed', err);
  }

  const link = `/my-applications`;
  const adminLink = `/ngo-admin/volunteer`;

  // Aşamaya göre metinler
  const userText: Record<Stage, { title: string; body: string }> = {
    applied: { title: 'Başvurun alındı', body: `"${oppTitle}" ilanına başvurun alındı. Durumu profilinden takip edebilirsin.` },
    approved: { title: 'Başvurun onaylandı', body: `"${oppTitle}" gönüllülük başvurun onaylandı.` },
    rejected: { title: 'Başvurun reddedildi', body: `"${oppTitle}" gönüllülük başvurun reddedildi.` },
  };
  const orgVerb: Record<Stage, string> = { applied: 'başvurdu', approved: 'başvurusu onaylandı', rejected: 'başvurusu reddedildi' };
  const orgTitle: Record<Stage, string> = {
    applied: 'Yeni gönüllü başvurusu',
    approved: 'Gönüllü başvurusu onaylandı',
    rejected: 'Gönüllü başvurusu reddedildi',
  };
  const orgBody = `${applicantName} "${oppTitle}" ilanına ${orgVerb[stage]}.`;

  const drafts: NotificationDraft[] = [];
  const seen = new Set<string>();

  // 1. Başvuran kullanıcı
  if (applicantId) {
    drafts.push({ userId: applicantId, title: userText[stage].title, body: userText[stage].body });
    seen.add(applicantId);
  }
  // 2. STK yöneticisi
  if (ngoAdminId && !seen.has(ngoAdminId)) {
    drafts.push({ userId: ngoAdminId, title: orgTitle[stage], body: orgBody });
    seen.add(ngoAdminId);
  }
  // 3. Süper-adminler
  for (const saId of superAdminIds) {
    if (!seen.has(saId)) {
      drafts.push({ userId: saId, title: orgTitle[stage], body: orgBody });
      seen.add(saId);
    }
  }

  try {
    const batch = db.batch();
    const notifCol = db.collection(COLLECTIONS.notifications);
    for (const d of drafts) {
      const isApplicant = d.userId === applicantId;
      batch.set(notifCol.doc(), {
        userId: d.userId,
        type: 'volunteer-application',
        title: d.title,
        body: d.body,
        data: { applicationId, stage, link: isApplicant ? link : adminLink },
        read: false,
        createdAt: FieldValue.serverTimestamp(),
        createdBy: 'volunteer-system',
      });
    }
    await batch.commit();
  } catch (err) {
    console.error('[application-notify] notification write failed', err);
    return NextResponse.json({ errorCode: 'WRITE_FAILED', message: 'Bildirimler yazılamadı.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, notified: drafts.length });
}
