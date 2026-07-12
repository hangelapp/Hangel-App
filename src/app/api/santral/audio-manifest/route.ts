/**
 * GET /api/santral/audio-manifest
 *
 * Asterisk sunucusundaki santral-sync-audio cron'u bunu çağırır: tüm STK'ların
 * callFlow'undaki ses dosyası URL'lerini { ngoId, slot, url } listesi olarak
 * döndürür. Sunucu bu URL'leri indirip yerel sounds/hangel/<ngoId>/<slot>.wav
 * yapar (Asterisk uzak URL çalamaz).
 *
 * Auth: Bearer <SANTRAL_GATEWAY_SECRET> (gateway-only; kullanıcıya açık değil).
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase-admin';
import { normalizeCallFlow } from '@/lib/santral/call-flow';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const NGO_CALL_CENTER = 'ngoCallCenter';

export async function GET(req: NextRequest) {
  const secret = process.env.SANTRAL_GATEWAY_SECRET || '';
  const auth = req.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  if (!secret || token !== secret) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const db = getAdminFirestore();
  const snap = await db.collection(NGO_CALL_CENTER).get();
  const items: { ngoId: string; slot: string; url: string }[] = [];
  for (const doc of snap.docs) {
    const data = doc.data() as { callFlow?: unknown };
    if (!data?.callFlow) continue;
    const cf = normalizeCallFlow(data.callFlow);
    const add = (slot: string, url: string | null) => { if (url) items.push({ ngoId: doc.id, slot, url }); };
    add('greeting', cf.ivr.greetingAudioUrl);
    add('ivr', cf.ivr.greetingAudioUrl); // IVR karşılaması = greeting sesi
    add('closed', cf.workingHours.closedAudioUrl);
    add('voicemail', cf.noAnswer.voicemailAudioUrl);
  }
  return NextResponse.json({ items });
}
