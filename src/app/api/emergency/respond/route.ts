/**
 * Kan talebine "Yardım Edebilirim" yanıtı.
 *
 * Yanıtlayan kullanıcıya 2 farklı kanaldan bilgi iletir:
 *
 * 1. **Notification** (notifications collection) → Cloud Function trigger →
 *    push bildirim olarak telefon ekranına düşer.
 *    Başlık: "🩸 Kan Talebi — [Hastane]"
 *    Body: kısa özet (telefon banner'a sığar)
 *
 * 2. **Message** (messages collection) → /messages gelen kutusunda kalıcı.
 *    Tam template: hoş geldin + detaylar + bağış öncesi talimatlar.
 *
 * POST { requestId, data? } → oturum doğrula → emergencyRequests'ten yetkili
 *   detayı oku → her iki kayıt da Admin SDK ile yazılır (rules bypass).
 *
 * Hata formatı: { errorCode, message }.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminFirestore } from '@/lib/firebase-admin';
import { COLLECTIONS } from '@/firebase/collections';
import { FieldValue } from 'firebase-admin/firestore';

export const runtime = 'nodejs';

// ABO/Rh uyumluluk haritası — Patient blood type → Donor blood types that
// can give to that patient. 0- = universal donor, AB+ = universal receiver.
const BLOOD_COMPATIBILITY: Record<string, string[]> = {
  '0-': ['0-'],
  '0+': ['0-', '0+'],
  'A-': ['0-', 'A-'],
  'A+': ['0-', '0+', 'A-', 'A+'],
  'B-': ['0-', 'B-'],
  'B+': ['0-', '0+', 'B-', 'B+'],
  'AB-': ['0-', 'A-', 'B-', 'AB-'],
  'AB+': ['0-', '0+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
};

// Map "A Rh+" / "ARH+" / "A+" / "0 Rh-" varyantlarını standartlaştır.
function normalizeBloodType(raw: string): string {
  if (!raw) return '';
  const cleaned = raw
    .replace(/\s+/g, '')
    .replace(/RH/gi, '')
    .replace(/[Oo]/g, '0')
    .toUpperCase()
    .replace(/POZITIF|POS|POSITIVE/g, '+')
    .replace(/NEGATIF|NEG|NEGATIVE/g, '-');
  if (BLOOD_COMPATIBILITY[cleaned]) return cleaned;
  return raw; // fallback
}

function compatibleDonors(patientBloodType: string): string[] {
  const normalized = normalizeBloodType(patientBloodType);
  return BLOOD_COMPATIBILITY[normalized] || [];
}

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

  // Yetkili talep detayını oku.
  let d: Record<string, unknown> = (body?.data && typeof body.data === 'object') ? body.data : {};
  try {
    const snap = await fs.collection(COLLECTIONS.emergencyRequests).doc(requestId).get();
    if (snap.exists) d = { ...d, ...(snap.data() as Record<string, unknown>) };
  } catch { /* okunamazsa client data fallback */ }

  // Caller'ın gerçek displayName'ini al (Firebase Auth user record)
  let callerDisplayName = caller.name;
  try {
    const userRec = await getAdminAuth().getUser(caller.uid);
    if (userRec.displayName) callerDisplayName = userRec.displayName.split(' ')[0]; // ilk ad
  } catch { /* fallback caller.name */ }

  const s = (k: string): string => (typeof d[k] === 'string' ? (d[k] as string) : '');
  const hospital = s('hospitalName') || 'Hastane';
  const hospitalCity = s('hospitalCity');
  const hospitalDistrict = s('hospitalDistrict');
  const address = s('hospitalAddress');
  const hospitalPhone = s('hospitalPhone');
  const bloodType = s('bloodType');
  const patientName = s('patientName') || 'Hasta';
  const contactName = s('contactName') || s('requestedByName') || 'İrtibat kişisi';
  const contactPhone = s('contactPhone');
  const hospitalLocation = [hospitalDistrict, hospitalCity].filter(Boolean).join(', ');
  const fullAddress = [address, hospitalLocation].filter(Boolean).join(' — ');

  const compatibleList = compatibleDonors(bloodType);
  const compatibleStr = compatibleList.length > 0 ? compatibleList.join(', ') : 'belirsiz';

  // Telefonu `tel:` URI için E.164-yakını normalize et: sadece + ve rakam kalsın.
  // İlk + korunur; sonraki tüm + işaretleri atılır.
  const telUri = (raw: string): string => {
    if (!raw) return '';
    const trimmed = raw.trim();
    const hasPlus = trimmed.startsWith('+');
    const digits = trimmed.replace(/[^\d]/g, '');
    return digits ? `tel:${hasPlus ? '+' : ''}${digits}` : '';
  };

  // HTML escape (XSS önle — kullanıcı adı, hasta adı, hastane adı vs. raw).
  const esc = (s: string): string =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  const addressForMap = fullAddress || hospital;
  const mapsHref = addressForMap ? `https://maps.apple.com/?q=${encodeURIComponent(addressForMap)}` : '';
  const contactTelHref = telUri(contactPhone);
  const hospitalTelHref = telUri(hospitalPhone);

  // ── Mesaj template (plain text — fallback, ve eski client'lar için) ───────
  const messageContent = `Merhaba ${callerDisplayName},

"Yardım edebilirim" dediğin için teşekkürler. Kan, laboratuvarda üretilemeyen tek kaynak — yani şu an o hastanın tek umudu senin gibi birinin gelmesi.

İşte bilmen gerekenler:
🩸 Kan Grubu: ${bloodType} (kan verebilen gruplar: ${compatibleStr})
🏥 Hastane: ${hospital}
👤 Hasta: ${patientName}
📞 İrtibat: ${contactName}${contactPhone ? `\n☎️ Telefon: ${contactPhone}` : ''}${hospitalPhone ? `\n📞 Hastane Tel: ${hospitalPhone}` : ''}
📍 Adres: ${fullAddress || hospital}

Gitmeden önce:
Son 48 saatte alkol almamış olman gerekiyor. Aç gitme, biraz su iç ve bu süre zarfında sigara içme. Yola çıkmadan irtibat kişisini ara — seni bekliyor olacaklar.

Teşekkürler. 🙏`;

  // ── Rich HTML — message detail sayfası dangerouslySetInnerHTML + sanitize ─
  // Telefon `tel:` ile arama açar; adres Apple Maps'te konum açar (iOS native;
  // Android/web maps.apple.com → maps.google.com'a yönlendirir).
  const contactPhoneHtml = contactPhone
    ? (contactTelHref
        ? `<br/>☎️ Telefon: <a href="${esc(contactTelHref)}">${esc(contactPhone)}</a>`
        : `<br/>☎️ Telefon: ${esc(contactPhone)}`)
    : '';
  const hospitalPhoneHtml = hospitalPhone
    ? (hospitalTelHref
        ? `<br/>📞 Hastane Tel: <a href="${esc(hospitalTelHref)}">${esc(hospitalPhone)}</a>`
        : `<br/>📞 Hastane Tel: ${esc(hospitalPhone)}`)
    : '';
  const addressHtml = mapsHref
    ? `<a href="${esc(mapsHref)}" target="_blank" rel="noopener noreferrer">${esc(addressForMap)}</a>`
    : esc(addressForMap);

  const messageContentHtml = `<p>Merhaba ${esc(callerDisplayName)},</p>
<p>"Yardım edebilirim" dediğin için teşekkürler. Kan, laboratuvarda üretilemeyen tek kaynak — yani şu an o hastanın tek umudu senin gibi birinin gelmesi.</p>
<p><strong>İşte bilmen gerekenler:</strong><br/>
🩸 Kan Grubu: ${esc(bloodType)} (kan verebilen gruplar: ${esc(compatibleStr)})<br/>
🏥 Hastane: ${esc(hospital)}<br/>
👤 Hasta: ${esc(patientName)}<br/>
📞 İrtibat: ${esc(contactName)}${contactPhoneHtml}${hospitalPhoneHtml}<br/>
📍 Adres: ${addressHtml}</p>
<p><strong>Gitmeden önce:</strong><br/>
Son 48 saatte alkol almamış olman gerekiyor. Aç gitme, biraz su iç ve bu süre zarfında sigara içme. Yola çıkmadan irtibat kişisini ara — seni bekliyor olacaklar.</p>
<p>Teşekkürler. 🙏</p>`;

  // ── Notification body (push'a sığar) ──────────────────────────────────────
  const shortBody = `${hospital} • ${bloodType} • ${contactName}${contactPhone ? ` (${contactPhone})` : ''}`;

  try {
    // 1) Messages — kalıcı, /messages gelen kutusunda
    await fs.collection(COLLECTIONS.messages).add({
      sender: { id: 'hangel-system', name: 'Hangel Acil', avatarUrl: '' },
      senderId: 'hangel-system',
      senderType: 'system',
      recipient: { id: caller.uid, name: caller.name, avatarUrl: '' },
      recipientId: caller.uid,
      subject: `🩸 Kan Talebi Detayları — ${hospital}`,
      content: messageContent,
      // Rich HTML — render tarafı dangerouslySetInnerHTML + sanitizeHtml ile
      // basar. tel: ve maps:// linklerini içerir; sanitize bunlara izin verir.
      contentHtml: messageContentHtml,
      timestamp: FieldValue.serverTimestamp(),
      status: 'sent',
      relatedRequestId: requestId,
    });

    // 2) Notification — push trigger, telefon ekranına banner
    //    Cloud Function onNotificationCreated otomatik FCM push yollar.
    await fs.collection(COLLECTIONS.notifications).add({
      userId: caller.uid,
      type: 'emergency-blood-confirmation',
      title: `🩸 Kan Talebi — ${hospital}`,
      body: shortBody,
      data: {
        type: 'emergency_blood_confirmation',
        requestId,
        link: '/messages', // tıklayınca /messages'a yönlendirsin
        clickAction: '/messages',
      },
      read: false,
      pushSent: false, // Cloud Function gönderir
      createdAt: FieldValue.serverTimestamp(),
      createdBy: 'hangel-system',
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('emergency/respond error', err);
    return NextResponse.json({ errorCode: 'INTERNAL_ERROR', message: 'Detay iletilemedi.' }, { status: 500 });
  }
}
