/**
 * src/lib/santral/index.ts
 *
 * Public surface of the santral adapter katmanı.
 *
 * Re-exports + `getSantralProvider(providerId)` helper. Bu helper Firestore'dan
 * santralProviders/{providerId} config'ini okur ve uygun adapter'i instantiate
 * eder. Şu an sadece StubSantralProvider mevcut — gerçek sağlayıcı seçildiğinde
 * (NetGSM / Twilio / Plivo) yeni bir class eklenip burada switch'e bağlanacak.
 *
 * Bu modül **dynamic import**'a uyumlu — `src/app/api/ngo-admin/calls/originate`
 * route'u bunu try/catch içinde import ediyor; default export = StubSantralProvider
 * fallback olarak duruyor.
 */
import { getAdminFirestore } from '@/lib/firebase-admin';
import { StubSantralProvider } from './stub-provider';
import { SIPjsProvider } from './sipjs-provider';
import type { SantralProvider } from './types';

export * from './types';
export { StubSantralProvider } from './stub-provider';
export { SIPjsProvider } from './sipjs-provider';
export { logAuditEvent, clientIpFromRequest } from './audit';

const SANTRAL_PROVIDERS = 'santralProviders';
const SIPJS_PREFIX = 'sipjs-';

/**
 * santralProviders/{id} doc shape — provider-spesifik alanlar opsiyonel.
 * Firestore schema henüz strict-typed değil; defansif okuma yapıyoruz.
 */
interface SantralProviderConfig {
  name?: string;
  displayName?: string;
  status?: string;
  providerType?: string;
  sipServer?: string;
  wssUrl?: string;
  authorizationUsername?: string;
  authorizationPassword?: string;
}

/**
 * Provider config'ini Firestore'dan oku + uygun adapter'i instantiate et.
 *
 * @param providerId santralProviders/{providerId} doc id'si. Boş veya
 *   bulunamadıysa StubSantralProvider döner (fail-safe).
 * @returns SantralProvider implementasyonu.
 */
export async function getSantralProvider(providerId?: string | null): Promise<SantralProvider> {
  if (!providerId) {
    return new StubSantralProvider();
  }

  let config: SantralProviderConfig | undefined;
  try {
    const snap = await getAdminFirestore().collection(SANTRAL_PROVIDERS).doc(providerId).get();
    if (!snap.exists) {
      return new StubSantralProvider(providerId, `Stub (config not found: ${providerId})`);
    }
    config = snap.data() as SantralProviderConfig | undefined;
  } catch {
    return new StubSantralProvider(providerId, 'Stub (config read failed)');
  }

  const configName = config?.displayName || config?.name;
  const configStatus = config?.status;

  // Inactive / suspended provider — yine stub döner ki çağrı kuyrukta
  // patlamasın. originateCall response'unda hata mesajı net olur.
  if (configStatus && configStatus !== 'active') {
    return new StubSantralProvider(providerId, `Stub (inactive: ${configStatus})`);
  }

  // SIP.js (WebRTC) provider — Faz 3.
  //   Aktivasyon: santralProviders/{id} doc'unda providerType='sipjs' + wssUrl set
  //   edildiğinde otomatik döner. wssUrl yoksa SIPjsProvider kendi `originateCall`
  //   çağrısında fail-fast hata döner (config eksik mesajıyla).
  if (
    providerId.startsWith(SIPJS_PREFIX) ||
    config?.providerType === 'sipjs'
  ) {
    return new SIPjsProvider({
      id: providerId,
      name: configName ?? `SIPjs (${providerId})`,
      sipServer: config?.sipServer ?? '',
      wssUrl: config?.wssUrl ?? '',
      displayName: configName ?? providerId,
      authorizationUsername: config?.authorizationUsername,
      authorizationPassword: config?.authorizationPassword,
    });
  }

  // Gerçek provider switch yeri — diğer sağlayıcılar buraya eklenir.
  // switch (providerId) {
  //   case 'netgsm-sesli': return new NetGsmSesliProvider(...);
  //   case 'twilio': return new TwilioProvider(...);
  //   default: return new StubSantralProvider(providerId, configName);
  // }
  return new StubSantralProvider(providerId, configName ?? `Stub (${providerId})`);
}

/**
 * Default export — `import getSantralProvider from '@/lib/santral'`
 * desteklemese de, default'u StubSantralProvider class'i olarak bırakıyoruz
 * çünkü ngo-admin/calls/originate route'u dynamic import'ta
 * `mod.default ?? mod.StubSantralProvider` arıyor.
 */
export default StubSantralProvider;
