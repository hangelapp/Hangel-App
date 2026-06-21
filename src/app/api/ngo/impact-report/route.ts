/**
 * POST /api/ngo/impact-report — STK sürdürülebilirlik / etki raporu üret + cache'le.
 *
 *   body: { targetNgoId?: string }   (super-admin için zorunlu; ngo-admin için
 *          kendi managedNgoId'si zorlanır — client override edemez)
 *   response: { ok: true, report: ImpactReportDoc }
 *
 * Yönetici "Raporu Oluştur/Güncelle" der; bu route STK'nın platform verisini
 * (bağış, gönüllülük, etkinlik/proje, şeffaflık, SKA) toplar, AI flow ile
 * standart formatta bir etki raporu üretir ve ngos/{id}.impactReport alanına
 * yazar (dönemsel güncellenebilir). Profil sayfası bu cache'i okuyup gösterir.
 *
 * Yetki: requireNgoAdmin. Quota AI flow tarafında uygulanır.
 * Hata formatı: { errorCode, message }.
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireNgoAdmin } from '@/lib/messaging/server-auth';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';
import { AIQuotaExceededError } from '@/ai/flow-auth';
import { generateImpactReport, type ImpactReportOutput } from '@/ai/flows/impact-report-flow';

export const runtime = 'nodejs';

// ngos/{id}.impactReport şeması — AI çıktısı + dönem + üretim damgası.
interface ImpactReportDoc extends ImpactReportOutput {
  period: string;
  generatedAt: string; // ISO
  generatedBy: string; // uid
}

const num = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? v : 0);

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as { targetNgoId?: string } | null;

  const auth = await requireNgoAdmin(req, {
    targetNgoId: typeof body?.targetNgoId === 'string' ? body.targetNgoId : undefined,
  });
  if ('error' in auth) return auth.error;
  const { ngoId, uid } = auth.actor;

  const adminDb = getAdminFirestore();

  // STK dokümanı — etki verisinin kaynağı.
  let ngo: Record<string, unknown> | undefined;
  try {
    const snap = await adminDb.collection(COLLECTIONS.ngos).doc(ngoId).get();
    if (!snap.exists) {
      return NextResponse.json({ errorCode: 'NOT_FOUND', message: 'Kuruluş bulunamadı.' }, { status: 404 });
    }
    ngo = snap.data() as Record<string, unknown>;
  } catch (e) {
    console.error('[impact-report] ngo read failed', e);
    return NextResponse.json({ errorCode: 'INTERNAL', message: 'Kuruluş verisi okunamadı.' }, { status: 500 });
  }

  const stats = (ngo.stats ?? {}) as Record<string, unknown>;
  const volunteerHours = num(stats.volunteerHours);
  // Profil sayfasıyla tutarlı: gönüllülüğün ekonomik değeri ≈ saat × 100 ₺.
  const volunteerValueTRY = volunteerHours * 100;
  const sdgs = Array.isArray(ngo.supportedSDGs) ? (ngo.supportedSDGs as string[]).join(', ') : '';
  const beneficiaryGroups = Array.isArray(ngo.beneficiaryGroups) ? (ngo.beneficiaryGroups as string[]).join(', ') : '';
  const period = `${new Date().getFullYear()} — Yıllık`;

  // idToken'ı AI flow quota kontrolü için header'dan çıkar (requireNgoAdmin doğruladı).
  const authHeader = req.headers.get('authorization') ?? '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : undefined;

  try {
    const output = await generateImpactReport(
      {
        ngoName: typeof ngo.name === 'string' ? ngo.name : 'Kuruluş',
        category: typeof ngo.category === 'string' ? ngo.category : '',
        type: typeof ngo.type === 'string' ? ngo.type : '',
        about: typeof ngo.about === 'string' ? ngo.about : '',
        period,
        donors: num(stats.donors),
        totalDonation: num(stats.totalDonation),
        volunteers: num(stats.volunteers),
        volunteerHours,
        volunteerValueTRY,
        projects: num(stats.projects),
        peopleReached: num(stats.peopleReached),
        transparencyScore: num(ngo.transparencyScore),
        sdgs,
        beneficiaryGroups,
      },
      idToken,
    );

    const report: ImpactReportDoc = {
      ...output,
      period,
      generatedAt: new Date().toISOString(),
      generatedBy: uid,
    };

    // ngos/{id}.impactReport alanına cache'le (merge — diğer alanlara dokunma).
    await adminDb.collection(COLLECTIONS.ngos).doc(ngoId).set({ impactReport: report }, { merge: true });

    return NextResponse.json({ ok: true, report });
  } catch (err) {
    if (err instanceof AIQuotaExceededError) {
      return NextResponse.json({ errorCode: 'QUOTA', message: 'Günlük yapay zeka hakkın doldu, yarın tekrar dene.' }, { status: 429 });
    }
    console.error('[impact-report] error', err);
    const raw = (err instanceof Error ? err.message : String(err)).toLowerCase();
    if (raw.includes('api key') || raw.includes('api_key') || (raw.includes('permission') && raw.includes('denied'))) {
      return NextResponse.json({ errorCode: 'AI_KEY_MISSING', message: 'Yapay zeka anahtarı ayarlı değil veya geçersiz.' }, { status: 500 });
    }
    return NextResponse.json({ errorCode: 'INTERNAL', message: 'Etki raporu oluşturulamadı, lütfen tekrar dene.' }, { status: 500 });
  }
}
