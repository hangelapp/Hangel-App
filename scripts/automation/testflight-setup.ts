/**
 * App Store Connect API - TestFlight metadata + beta group setup.
 *
 * Hangel için TestFlight beta review için gereken meta verileri yükler:
 *   - Beta App Information (feedback email, description)
 *   - Beta App Review Information (kontak bilgileri)
 *   - 'Internal Testers' beta group oluştur
 *
 * Komut:
 *   npx tsx scripts/automation/testflight-setup.ts
 */
import { getJwt } from './_appstore-jwt';

const APP_ID = '6664058822'; // Hangel App
const BUNDLE_ID = 'com.hangel.ios.app';
const BASE = 'https://api.appstoreconnect.apple.com/v1';

const TEST_INFO = {
  feedbackEmail: 'ismailhilmi@hangel.org',
  marketingUrl: 'https://hangel.org.tr',
  privacyPolicyUrl: 'https://hangel.org.tr/privacy',
  contactFirstName: 'Ismail Hilmi',
  contactLastName: 'Adiguzel',
  contactEmail: 'ismailhilmi@hangel.org',
  contactPhone: '+905384009090',
  whatToTest: `Hangel TestFlight ${new Date().toISOString().slice(0, 10)} build.

Yeni özellikler:
- Welcome onboarding (9 amaç checkbox)
- Sign in with Apple desteği
- OTP 6-box giriş
- Settings: emergency (kan bağışı) + education tabs
- Personalized feeds: kan çağrıları, afet uyarıları, kulüp etkinlikleri
- iOS izinleri: Face ID, Camera, Mic, Contacts, Location, Calendar,
  Reminders, Bluetooth, Motion, Speech, ATT, Photo Library
- HealthKit + WeatherKit + Live Activities entitlement (UI bağlantı sonraki build'lerde)

Test edilecekler:
1. Login (WhatsApp OTP + Apple Sign In)
2. Welcome popup + permission prompts
3. Profile + 9 intent seçim akışı
4. Market + STK detay sayfaları
5. /alerts /blood /clubs /events feeds
`,
};

async function api<T>(method: string, path: string, body?: unknown): Promise<T> {
  const { token } = getJwt();
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${method} ${path} → HTTP ${res.status}\n${text}`);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

async function setBetaAppReviewDetail() {
  console.log('[1/3] Beta App Review Detail ayarlanıyor...');
  // Find existing detail or create
  const existing = await api<{ data: { id: string } | Array<{ id: string }> }>('GET', `/apps/${APP_ID}/betaAppReviewDetail`);
  const detailId = Array.isArray(existing.data) ? existing.data[0]?.id : existing.data?.id;
  if (!detailId) {
    console.log('  Beta App Review Detail bulunamadı; otomatik oluşturulmuş olmalı.');
    return;
  }
  await api('PATCH', `/betaAppReviewDetails/${detailId}`, {
    data: {
      type: 'betaAppReviewDetails',
      id: detailId,
      attributes: {
        contactFirstName: TEST_INFO.contactFirstName,
        contactLastName: TEST_INFO.contactLastName,
        contactEmail: TEST_INFO.contactEmail,
        contactPhone: TEST_INFO.contactPhone,
      },
    },
  });
  console.log('  ✅ Beta App Review Detail güncellendi.');
}

async function setBetaAppLocalization() {
  console.log('[2/3] Beta App Localization (tr) ayarlanıyor...');
  const locs = await api<{ data: Array<{ id: string; attributes: { locale: string } }> }>(
    'GET',
    `/apps/${APP_ID}/betaAppLocalizations`,
  );
  const tr = locs.data.find((l) => l.attributes.locale === 'tr' || l.attributes.locale === 'tr-TR');
  if (tr) {
    await api('PATCH', `/betaAppLocalizations/${tr.id}`, {
      data: {
        type: 'betaAppLocalizations',
        id: tr.id,
        attributes: {
          feedbackEmail: TEST_INFO.feedbackEmail,
          marketingUrl: TEST_INFO.marketingUrl,
          privacyPolicyUrl: TEST_INFO.privacyPolicyUrl,
          description: TEST_INFO.whatToTest.slice(0, 4000),
        },
      },
    });
    console.log('  ✅ Beta App Localization (tr) güncellendi.');
  } else {
    // Create new
    const result = await api<{ data: { id: string } }>('POST', '/betaAppLocalizations', {
      data: {
        type: 'betaAppLocalizations',
        attributes: {
          locale: 'tr',
          feedbackEmail: TEST_INFO.feedbackEmail,
          marketingUrl: TEST_INFO.marketingUrl,
          privacyPolicyUrl: TEST_INFO.privacyPolicyUrl,
          description: TEST_INFO.whatToTest.slice(0, 4000),
        },
        relationships: {
          app: { data: { type: 'apps', id: APP_ID } },
        },
      },
    });
    console.log(`  ✅ Beta App Localization (tr) oluşturuldu: ${result.data.id}`);
  }
}

async function createInternalTestersGroup() {
  console.log('[3/3] Internal Testers beta group oluşturuluyor...');
  // List existing groups
  const groups = await api<{ data: Array<{ id: string; attributes: { name: string; isInternalGroup: boolean } }> }>(
    'GET',
    `/apps/${APP_ID}/betaGroups`,
  );
  const existing = groups.data.find((g) => g.attributes.name === 'Internal Testers');
  if (existing) {
    console.log(`  ✅ Internal Testers zaten var: ${existing.id}`);
    return;
  }
  const result = await api<{ data: { id: string } }>('POST', '/betaGroups', {
    data: {
      type: 'betaGroups',
      attributes: {
        name: 'Internal Testers',
        publicLinkEnabled: false,
      },
      relationships: {
        app: { data: { type: 'apps', id: APP_ID } },
      },
    },
  });
  console.log(`  ✅ Internal Testers oluşturuldu: ${result.data.id}`);
}

async function main() {
  await setBetaAppReviewDetail();
  await setBetaAppLocalization();
  await createInternalTestersGroup();
  console.log('\n✅ TestFlight setup tamam. Sonraki build submit_to_testflight: true ile review\'a submit edebilir.');
}

main().catch((e) => {
  console.error('HATA:', e.message);
  process.exit(1);
});
