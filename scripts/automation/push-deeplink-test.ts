/**
 * Push notification deep link gerçek test.
 *
 * Senin iPhone'una farklı route'lara giden test push'lar yollar.
 * Her birine tıklayınca doğru sayfaya yönlenmeli.
 *
 * Çalıştır:
 *   GOOGLE_APPLICATION_CREDENTIALS=./.firebase-service-account.json \
 *     npx tsx scripts/automation/push-deeplink-test.ts
 */
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import { getAuth } from 'firebase-admin/auth';

initializeApp({ credential: cert(process.env.GOOGLE_APPLICATION_CREDENTIALS!) });
const db = getFirestore();
const auth = getAuth();

const TEST_CASES = [
  { title: '🏠 Market test', body: 'Tıklayınca /market açılmalı', link: '/market' },
  { title: '🩸 Blood feed test', body: 'Tıklayınca /blood açılmalı', link: '/blood' },
  { title: '🔔 Alerts test', body: 'Tıklayınca /alerts açılmalı', link: '/alerts' },
  { title: '👤 Profile test', body: 'Tıklayınca /profile açılmalı', link: '/profile' },
  { title: '🎯 Settings/intents', body: 'Tıklayınca /settings/intents', link: '/settings/intents' },
];

function wait(ms: number) { return new Promise<void>((r) => setTimeout(r, ms)); }

async function main() {
  const userEmail = process.argv[2] || 'ismailhilmi@hangel.org';
  const user = await auth.getUserByEmail(userEmail);
  console.log(`[push-test] Target user: ${user.email} (${user.uid})`);

  const tokens = await db.collection('users').doc(user.uid).collection('fcmTokens').get();
  const tokenList = tokens.docs.map((d) => d.id);
  if (tokenList.length === 0) {
    console.error('❌ Kullanıcının FCM token yok. iPhone Hangel app aç, login ol.');
    process.exit(1);
  }
  console.log(`[push-test] ${tokenList.length} FCM token bulundu.`);

  const messaging = getMessaging();

  for (const tc of TEST_CASES) {
    console.log(`\n→ ${tc.title} (link: ${tc.link})`);
    const res = await messaging.sendEachForMulticast({
      tokens: tokenList,
      notification: { title: tc.title, body: tc.body },
      data: { link: tc.link, clickAction: tc.link },
      apns: {
        payload: { aps: { badge: 1, sound: 'default' } },
        fcmOptions: {},
      },
    });
    console.log(`  Sent. Success: ${res.successCount}, Failure: ${res.failureCount}`);
    if (res.failureCount > 0) {
      res.responses.forEach((r, i) => {
        if (!r.success) console.log(`    ${tokenList[i].slice(0, 8)}…: ${r.error?.code} - ${r.error?.message?.slice(0, 60)}`);
      });
    }
    console.log('  iPhone\'da bildirim geldi mi + tıklayınca doğru yere gitti mi kontrol et.');
    await wait(15000); // 15 sn ara — kullanıcı tıklayabilsin
  }

  console.log('\n[push-test] 5 test push gönderildi. Hepsi geldi + tıklama doğru çalıştı mı?');
}

main().then(() => process.exit(0)).catch((e) => {
  console.error('HATA:', e);
  process.exit(1);
});
