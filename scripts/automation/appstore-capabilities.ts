/**
 * App Store Connect API - Bundle ID Capability yönetimi.
 *
 * Komutlar:
 *   npx tsx scripts/automation/appstore-capabilities.ts list
 *   npx tsx scripts/automation/appstore-capabilities.ts enable HEALTHKIT
 *   npx tsx scripts/automation/appstore-capabilities.ts disable HEALTHKIT
 *
 * Capability tipleri Apple docs:
 *   https://developer.apple.com/documentation/appstoreconnectapi/capabilitytype
 */
import { getJwt } from './_appstore-jwt';

const BUNDLE_ID_STR = 'com.hangel.ios.app';
const BASE = 'https://api.appstoreconnect.apple.com/v1';

async function api<T>(method: string, path: string, body?: unknown): Promise<T> {
  const { token } = getJwt();
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${method} ${path} → HTTP ${res.status}\n${text}`);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

async function findBundleId(): Promise<string> {
  const data = await api<{ data: Array<{ id: string; attributes: { identifier: string; name: string } }> }>(
    'GET',
    `/bundleIds?filter[identifier]=${BUNDLE_ID_STR}&limit=10`,
  );
  const match = data.data.find((b) => b.attributes.identifier === BUNDLE_ID_STR);
  if (!match) throw new Error(`Bundle ID ${BUNDLE_ID_STR} not found`);
  return match.id;
}

async function listCapabilities() {
  const bundleId = await findBundleId();
  console.log(`Bundle: ${BUNDLE_ID_STR} (id: ${bundleId})\n`);
  const data = await api<{ data: Array<{ id: string; attributes: { capabilityType: string; settings: unknown[] | null } }> }>(
    'GET',
    `/bundleIds/${bundleId}/bundleIdCapabilities`,
  );
  if (!data.data.length) {
    console.log('Aktif capability yok (Apple defaultlari disinda).');
    return;
  }
  console.log(`${data.data.length} active capability:\n`);
  for (const cap of data.data) {
    const settings = cap.attributes.settings;
    const settingsStr = settings && settings.length ? ` [${JSON.stringify(settings).slice(0, 80)}]` : '';
    console.log(`  ✅ ${cap.attributes.capabilityType}${settingsStr}`);
  }
}

async function enable(capabilityType: string) {
  const bundleId = await findBundleId();
  console.log(`Enabling ${capabilityType} on ${BUNDLE_ID_STR}...`);
  const result = await api<{ data: { id: string } }>('POST', '/bundleIdCapabilities', {
    data: {
      type: 'bundleIdCapabilities',
      attributes: { capabilityType },
      relationships: {
        bundleId: { data: { type: 'bundleIds', id: bundleId } },
      },
    },
  });
  console.log(`✅ Enabled. Capability id: ${result.data.id}`);
}

async function disable(capabilityType: string) {
  const bundleId = await findBundleId();
  // Find capability ID
  const list = await api<{ data: Array<{ id: string; attributes: { capabilityType: string } }> }>(
    'GET',
    `/bundleIds/${bundleId}/bundleIdCapabilities`,
  );
  const cap = list.data.find((c) => c.attributes.capabilityType === capabilityType);
  if (!cap) {
    console.log(`Capability ${capabilityType} zaten yok / pasif.`);
    return;
  }
  console.log(`Disabling ${capabilityType} (id: ${cap.id})...`);
  await api('DELETE', `/bundleIdCapabilities/${cap.id}`);
  console.log(`✅ Disabled.`);
}

async function main() {
  const [cmd, arg] = process.argv.slice(2);
  switch (cmd) {
    case 'list':
      await listCapabilities();
      break;
    case 'enable':
      if (!arg) throw new Error('Usage: enable <CAPABILITY_TYPE>');
      await enable(arg);
      break;
    case 'disable':
      if (!arg) throw new Error('Usage: disable <CAPABILITY_TYPE>');
      await disable(arg);
      break;
    default:
      console.log(`Komutlar:
  list                            mevcut capability'leri göster
  enable <TYPE>                   capability aç (örn: HEALTHKIT, WEATHERKIT)
  disable <TYPE>                  capability kapat

Capability tipleri:
  HEALTHKIT, WEATHERKIT, ASSOCIATED_DOMAINS, PUSH_NOTIFICATIONS,
  NFC_TAG_READING, SIRIKIT, WALLET, NETWORK_EXTENSIONS,
  ICLOUD, IN_APP_PURCHASE, APP_GROUPS, BACKGROUND_MODES,
  USERNOTIFICATIONS_TIMESENSITIVE, USERNOTIFICATIONS_COMMUNICATION,
  AUTOFILL_CREDENTIAL_PROVIDER, INTER_APP_AUDIO, HOMEKIT, HOT_SPOT,
  MULTIPATH, ACCESS_WIFI_INFORMATION, COREMEDIA_HLS_LOW_LATENCY,
  SYSTEM_EXTENSION_INSTALL, ON_DEMAND_INSTALL_CAPABLE`);
  }
}

main().catch((e) => {
  console.error('HATA:', e.message);
  process.exit(1);
});
