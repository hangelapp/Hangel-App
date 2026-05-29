/**
 * Kan talebine "Yardım Edebilirim" yanıtı → yanıtlayan kullanıcıya "Kan Talebi
 * Detayları" mesajını /messages gelen kutusuna iletir (hastane konumu dahil).
 *
 * POST { requestId, data? } → oturum doğrula → emergencyRequests'ten yetkili detayı
 *   oku (yoksa client data fallback) → kullanıcıya sistem mesajı yaz (Admin SDK).
 *
 * Neden route: messages create kuralı senderId==auth.uid + alıcının kurum/admin
 * olmasını şart koşar; normal kullanıcı kendine sistem mesajı yazamaz. Admin SDK
 * kuralları bypass eder. Hata formatı: { errorCode, message }.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';
import { FieldValue } from 'firebase-admin/firestore';

export const runtime = 'nodejs';

async function verifyCaller(req: NextRequest): Promise<{ uid: string; name: string } | null> {
  const authHeader = req.headers.get('authorization') || '';
  const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
  if (!idToken) return null;
  try {
    const decoded = await getAdminAuth().verifyIdToken(idToken) as { uid: string; name?: string; email?: string };
    return { uid: decoded.uid, name: decoded.name || decoded.email?.split('@')[0] || 'Kullanıcı' };
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const caller = await verifyCaller(req);
  if (!caller) return NextResponse.json({ errorCode: 'UNAUTHORIZED', message: 'Oturum doğrulanamadı.' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const requestId = typeof body?.requestId === 'string' ? body.requestId.trim() : '';
  if (!requestId) return NextResponse.json({ errorCode: 'INVALID_BODY', message: 'Talep kimliği zorunlu.' }, { status: 400 });

  const fs = getAdminFirestore();

  // Yetkili talep detayını oku (client'tan gelen veriye değil, kayda güven).
  let d: Record<string, unknown> = (body?.data && typeof body.data === 'object') ? body.data : {};
  try {
    const snap = await fs.collection(COLLECTIONS.emergencyRequests).doc(requestId).get();
    if (snap.exists) d = { ...d, ...(snap.data() as Record<string, unknown>) };
  } catch { /* okunamazsa client data fallback kalır */ }

  const s = (k: string): string => (typeof d[k] === 'string' ? (d[k] as string) : '');
  const hospital = s('hospitalName');
  const hospitalCity = s('hospitalCity');
  const hospitalDistrict = s('hospitalDistrict');
  const address = s('hospitalAddress');
  const hospitalPhone = s('hospitalPhone');
  const bloodType = s('bloodType');
  const needType = s('needType') || 'Kan';
  const units = (d.unitsNeeded ?? d.units) ? String(d.unitsNeeded ?? d.units) : '';
  const patientName = s('patientName');
  const contactName = s('contactName') || s('requestedByName');
  const contactPhone = s('contactPhone');
  const hospitalLocation = [hospitalDistrict, hospitalCity].filter(Boolean).join(', ');

  const lines: string[] = [];
  lines.push(`🩸 İhtiyaç: ${needType}${bloodType ? ` · ${bloodType}` : ''}`);
  if (hospital) lines.push(`🏥 Hastane: ${hospital}`);
  if (hospitalLocation) lines.push(`📍 Hastane Konumu: ${hospitalLocation}`);
  if (address) lines.push(`🗺️ Adres: ${address}`);
  if (hospitalPhone) lines.push(`☎️ Hastane Tel: ${hospitalPhone}`);
  if (units) lines.push(`Ünite: ${units}`);
  if (patientName) lines.push(`Hasta: ${patientName}`);
  if (contactName) lines.push(`İrtibat: ${contactName}`);
  if (contactPhone) lines.push(`📞 İrtibat Tel: ${contactPhone}`);

  const content = `Yardım talebinize çok teşekkürler! 🙏 İşte kan talebinin detayları:\n\n${lines.join('\n')}\n\nLütfen en kısa sürede hastane veya irtibat kişisi ile iletişime geçin. İyilik için teşekkürler.`;

  try {
    await fs.collection(COLLECTIONS.messages).add({
      sender: { id: 'hangel-system', name: 'Hangel Acil', avatarUrl: '' },
      senderId: 'hangel-system',
      senderType: 'system',
      recipient: { id: caller.uid, name: caller.name, avatarUrl: '' },
      recipientId: caller.uid,
      subject: '🩸 Kan Talebi Detayları',
      content,
      timestamp: FieldValue.serverTimestamp(),
      status: 'sent',
      relatedRequestId: requestId,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('emergency/respond message error', err);
    return NextResponse.json({ errorCode: 'INTERNAL_ERROR', message: 'Detay mesajı iletilemedi.' }, { status: 500 });
  }
}
