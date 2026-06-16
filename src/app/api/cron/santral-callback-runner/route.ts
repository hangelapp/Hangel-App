/**
 * src/app/api/cron/santral-callback-runner/route.ts
 *
 * Vercel Cron tarafından her dakika çağrılan endpoint. `santralScheduledCallbacks`
 * koleksiyonundaki "vakti gelmiş" (status='pending' AND scheduledAt <= now())
 * callback'leri tarar ve arama queue'sine aktive eder:
 *   1. callback doc'unu status='due' olarak işaretler
 *   2. ilgili santralContacts/{contactId} doc'una priority=true bayrağını basar
 *      → agent UI'sinde öncelikli görünür
 *   3. callAuditLog'a 'callback.activated' event yazar
 *
 * Auth: ya `Authorization: Bearer ${CRON_SECRET}` header'ı ya da Vercel Cron'un
 * otomatik bastığı `x-vercel-cron: 1` header'ı kabul edilir. Yetkisiz istek
 * 401 döner.
 *
 * Rate safety: tek seferde max 100 callback işlenir; geri kalanlar bir sonraki
 * dakika döngüsünde toplanır. Hata olan callback'ler atlanır, ilk 5 örnek
 * `sampleErrors` ile döner — toplam hata sayısı `errors` alanında.
 */
import { NextResponse, type NextRequest } from 'next/server';
import { Timestamp } from 'firebase-admin/firestore';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';
import { logAuditEvent } from '@/lib/santral/audit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_PER_RUN = 100;
const MAX_SAMPLE_ERRORS = 5;

interface ScheduledCallbackData {
  ngoId?: string;
  contactId?: string;
  contactName?: string;
  scheduledAt?: Timestamp;
  status?: string;
}

interface RunnerResponse {
  processed: number;
  errors: number;
  sampleErrors: string[];
}

/**
 * İstek yetkili mi? Ya `Authorization: Bearer <CRON_SECRET>` ya da Vercel
 * Cron'un otomatik bastığı `x-vercel-cron` header'ı gerekli.
 */
function isAuthorized(req: NextRequest): boolean {
  if (req.headers.get('x-vercel-cron')) return true;
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = req.headers.get('authorization') || '';
  const token = auth.replace(/^Bearer\s+/i, '');
  return token === secret;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json(
      { errorCode: 'UNAUTHORIZED', message: 'Geçersiz cron yetkisi.' },
      { status: 401 },
    );
  }

  const db = getAdminFirestore();
  const now = Timestamp.now();

  let processed = 0;
  let errors = 0;
  const sampleErrors: string[] = [];

  try {
    const snap = await db
      .collection(COLLECTIONS.santralScheduledCallbacks)
      .where('status', '==', 'pending')
      .where('scheduledAt', '<=', now)
      .limit(MAX_PER_RUN)
      .get();

    for (const docSnap of snap.docs) {
      const data = docSnap.data() as ScheduledCallbackData;
      const callbackId = docSnap.id;
      const contactId = data.contactId;

      if (!contactId) {
        errors += 1;
        if (sampleErrors.length < MAX_SAMPLE_ERRORS) {
          sampleErrors.push(`${callbackId}: contactId yok`);
        }
        continue;
      }

      try {
        const batch = db.batch();
        batch.update(docSnap.ref, { status: 'due', activatedAt: Timestamp.now() });
        batch.update(
          db.collection(COLLECTIONS.santralContacts).doc(contactId),
          { priority: true },
        );
        await batch.commit();

        await logAuditEvent({
          actorUid: 'system',
          action: 'callback.activated',
          resourceType: COLLECTIONS.santralScheduledCallbacks,
          resourceId: callbackId,
          details: {
            contactId,
            callbackId,
            scheduledAt: data.scheduledAt?.toDate().toISOString() ?? null,
          },
        });

        processed += 1;
      } catch (err) {
        errors += 1;
        if (sampleErrors.length < MAX_SAMPLE_ERRORS) {
          const msg = err instanceof Error ? err.message : String(err);
          sampleErrors.push(`${callbackId}: ${msg}`);
        }
      }
    }

    const body: RunnerResponse = { processed, errors, sampleErrors };
    return NextResponse.json(body);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { errorCode: 'INTERNAL_ERROR', message: `Cron çalıştırılamadı: ${message}` },
      { status: 500 },
    );
  }
}
