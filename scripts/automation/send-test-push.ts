/**
 * Cihazına test push gönder — bildirim + ses akışını doğrula.
 */
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';

initializeApp({ credential: cert(process.env.GOOGLE_APPLICATION_CREDENTIALS!) });
const db = getFirestore();
const messaging = getMessaging();

const UID = 'v7woPvqKAzSTSodVOJB702WJmJ93';
const TYPE = process.argv[2] ?? 'blood_emergency';

const TYPES: Record<string, { title: string; body: string; sound: string }> = {
  blood_emergency: { title: '🩸 Acil Kan İhtiyacı', body: 'A+ kan grubu acil — Hisar Hastanesi (5.2 km)', sound: 'hangel-blood.caf' },
  disaster_alert:  { title: '🚨 Afet Bildirimi',    body: 'Deprem alarmı — bulunduğun bölgede sarsıntı',  sound: 'hangel-disaster.caf' },
  volunteer_task:  { title: '🤝 Gönüllülük Çağrısı', body: 'Bayrampaşa Belediyesi: 5 gönüllüye ihtiyaç var', sound: 'hangel-volunteer.caf' },
  message:         { title: '💬 Yeni Mesaj',         body: 'Hangel ekibi sana mesaj gönderdi',              sound: 'hangel-alert.caf' },
};

const t = TYPES[TYPE] ?? TYPES.message;

(async () => {
  const tokensSnap = await db.collection(`users/${UID}/fcmTokens`).get();
  const tokens = tokensSnap.docs.map(d => d.id);
  console.log(`Token sayısı: ${tokens.length}`);
  if (tokens.length === 0) { console.log('Token yok'); return; }

  const res = await messaging.sendEachForMulticast({
    tokens,
    notification: { title: t.title, body: t.body },
    data: { type: TYPE, link: '/notifications' },
    apns: {
      headers: { 'apns-priority': '10' },
      payload: { aps: { sound: t.sound, 'mutable-content': 1, badge: 1 } },
    },
    android: { priority: 'high' as const },
  });
  console.log(`Success: ${res.successCount} / ${res.responses.length}`);
  res.responses.forEach((r, i) => {
    if (!r.success) console.log(`  ❌ ${tokens[i].slice(0,20)}... ${r.error?.code} ${r.error?.message?.slice(0,80)}`);
    else console.log(`  ✅ ${tokens[i].slice(0,20)}... messageId=${r.messageId?.slice(-20)}`);
  });
})();
