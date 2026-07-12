/**
 * POST /api/santral/call-flow-resolve
 *
 * Asterisk geçidi GELEN çağrıda (server-to-server) bu endpoint'e sorar:
 * "Bu DID için şu an ne yapayım?" Yanıt, dialplan'ın uygulayacağı SADE bir
 * plandır (JSON). Böylece tüm akış mantığı panelden (Firestore callFlow) yönetilir;
 * Asterisk config'i bir daha değişmez.
 *
 * Auth: Bearer <SANTRAL_GATEWAY_SECRET> (inbound-event ile aynı basit secret).
 *
 * Body: { calledNumber: string, ngoId?: string, digit?: string }
 *   - calledNumber → ngoId çözümü (santralNumberPool / callerIdNumber)
 *   - digit → IVR menüsünde kullanıcının bastığı tuş (2. tur çağrıda)
 *
 * Yanıt (plan):
 *   { action: 'ivr', prompt, promptAudioUrl, options:[{digit,target}], timeout }
 *   { action: 'dial', targets:['100','101'], strategy, ringSeconds }
 *   { action: 'voicemail', prompt, promptAudioUrl }
 *   { action: 'forward', number }
 *   { action: 'closed', prompt, promptAudioUrl, then:{...noAnswer planı} }
 *   { action: 'hangup' }
 *   { action: 'default-ring' }  // callFlow kapalı → normal telefon gibi (webrtc + dahililer)
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { normalizeCallFlow, type CallFlow } from '@/lib/santral/call-flow';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const NUMBER_POOL = 'santralNumberPool';
const NGO_CALL_CENTER = 'ngoCallCenter';

function digitsOnly(raw: string): string { return String(raw || '').replace(/\D/g, ''); }

async function resolveNgoId(db: FirebaseFirestore.Firestore, calledNumber: string): Promise<string | null> {
  const want = digitsOnly(calledNumber);
  if (!want) return null;
  for (const field of ['e164', 'number']) {
    const s = await db.collection(NUMBER_POOL).where(field, '==', calledNumber).limit(1).get().catch(() => null);
    if (s && !s.empty) {
      const ngo = (s.docs[0].data() as { assignedToNgoId?: string }).assignedToNgoId;
      if (ngo) return ngo;
    }
  }
  // digit-normalize tarama
  const pool = await db.collection(NUMBER_POOL).get().catch(() => null);
  if (pool) for (const d of pool.docs) {
    const x = d.data() as { e164?: string; number?: string; assignedToNgoId?: string };
    const cand = x.e164 || x.number;
    if (cand && digitsOnly(cand) === want && x.assignedToNgoId) return x.assignedToNgoId;
  }
  // tek-kiracı fallback: callerIdNumber
  const cc = await db.collection(NGO_CALL_CENTER).where('callerIdNumber', '==', calledNumber).limit(1).get().catch(() => null);
  if (cc && !cc.empty) return cc.docs[0].id;
  return null;
}

/** Şu an mesai içinde mi (workingHours). Kapalıysa false. */
function isWithinWorkingHours(wh: CallFlow['workingHours']): boolean {
  if (!wh.enabled) return true; // saat kısıtı yok
  try {
    // Sunucu UTC; TR ofset'ini timezone ile hesapla.
    const now = new Date();
    const fmt = new Intl.DateTimeFormat('en-US', {
      timeZone: wh.timezone || 'Europe/Istanbul',
      weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false,
    });
    const parts = fmt.formatToParts(now);
    const wdMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    const wd = wdMap[parts.find((p) => p.type === 'weekday')?.value || 'Sun'] ?? 0;
    const hh = parseInt(parts.find((p) => p.type === 'hour')?.value || '0', 10);
    const mm = parseInt(parts.find((p) => p.type === 'minute')?.value || '0', 10);
    const day = wh.days[wd];
    if (!day || !day.open) return false;
    const cur = hh * 60 + mm;
    const [fh, fm] = day.from.split(':').map(Number);
    const [th, tm] = day.to.split(':').map(Number);
    return cur >= (fh * 60 + fm) && cur < (th * 60 + tm);
  } catch {
    return true; // hesap hatasında güvenli taraf: açık say
  }
}

function noAnswerPlan(cf: CallFlow) {
  const na = cf.noAnswer;
  if (na.action === 'forward' && na.forwardNumber) return { action: 'forward', number: na.forwardNumber };
  if (na.action === 'voicemail') return { action: 'voicemail', prompt: na.voicemailPrompt, promptAudioUrl: na.voicemailAudioUrl };
  return { action: 'hangup' };
}

export async function POST(req: NextRequest) {
  const secret = process.env.SANTRAL_GATEWAY_SECRET || '';
  const auth = req.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  if (!secret || token !== secret) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  let body: { calledNumber?: string; ngoId?: string; digit?: string };
  try { body = await req.json(); } catch { body = {}; }

  const db = getAdminFirestore();
  const ngoId = body.ngoId || (body.calledNumber ? await resolveNgoId(db, body.calledNumber) : null);
  if (!ngoId) return NextResponse.json({ action: 'default-ring' }); // çözülemezse normal çaldır

  const snap = await db.collection(NGO_CALL_CENTER).doc(ngoId).get();
  const data = snap.data() as { callFlow?: unknown } | undefined;
  if (!data?.callFlow) return NextResponse.json({ action: 'default-ring', ngoId });
  const cf = normalizeCallFlow(data.callFlow);

  // 1) Mesai dışı mı?
  if (cf.workingHours.enabled && !isWithinWorkingHours(cf.workingHours)) {
    return NextResponse.json({
      action: 'closed', ngoId,
      prompt: cf.workingHours.closedPrompt,
      promptAudioUrl: cf.workingHours.closedAudioUrl,
      then: noAnswerPlan(cf),
    });
  }

  // 2) IVR açık ve henüz tuş basılmadıysa → menüyü çal
  if (cf.ivr.enabled && !body.digit) {
    return NextResponse.json({
      action: 'ivr', ngoId,
      prompt: cf.ivr.greetingText,
      promptAudioUrl: cf.ivr.greetingAudioUrl,
      options: cf.ivr.options.map((o) => ({ digit: o.digit, target: o.target })),
      timeout: cf.ivr.timeoutSeconds,
    });
  }

  // 2b) IVR açık ve tuş basıldıysa → o tuşun hedefini çöz
  if (cf.ivr.enabled && body.digit) {
    const opt = cf.ivr.options.find((o) => o.digit === body.digit);
    if (opt && opt.target && opt.target !== 'queue') {
      return NextResponse.json({ action: 'dial', ngoId, targets: [opt.target], strategy: 'ringall', ringSeconds: cf.queue.ringSeconds, then: noAnswerPlan(cf) });
    }
    // target 'queue' ya da geçersiz → sıraya/varsayılana düş (aşağıda)
  }

  // 3) Sıra açık → üyeleri çaldır
  if (cf.queue.enabled && cf.queue.members.length > 0) {
    return NextResponse.json({
      action: 'dial', ngoId,
      targets: cf.queue.members,
      strategy: cf.queue.strategy,
      ringSeconds: cf.queue.ringSeconds,
      then: noAnswerPlan(cf),
    });
  }

  // 4) Hiçbiri yok ama callFlow doc'u var → normal çaldır + cevapsız planı
  return NextResponse.json({ action: 'default-ring', ngoId, then: noAnswerPlan(cf) });
}
