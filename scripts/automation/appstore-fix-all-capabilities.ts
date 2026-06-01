/**
 * Tüm 4 bundle (App, Clip, Widgets, Watch) için gereken capability'leri
 * enable et + eski profile'ları sil. Bir sonraki Codemagic build'inde yeni
 * profile'lar oluşturulduğunda capability'ler dahil edilecek.
 *
 * Kullanım:
 *   npx tsx scripts/automation/appstore-fix-all-capabilities.ts
 */
import { getJwt } from './_appstore-jwt';

const BASE = 'https://api.appstoreconnect.apple.com/v1';

const REQUIRED: Record<string, string[]> = {
  'com.hangel.ios.app': [
    'APP_GROUPS',
    'ASSOCIATED_DOMAINS',
    'HEALTHKIT',
    'NFC_TAG_READING',
    'PUSH_NOTIFICATIONS',
    'APPLE_ID_AUTH',
    'WEATHERKIT',
    'USERNOTIFICATIONS_TIMESENSITIVE',
    'IN_APP_PURCHASE',
  ],
  'com.hangel.ios.app.Clip': [
    'APP_CLIPS',
    'APP_GROUPS',
    'ASSOCIATED_DOMAINS',
  ],
  'com.hangel.ios.app.widgets': [
    'APP_GROUPS',
  ],
  'com.hangel.ios.app.watchapp': [],
};

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
    throw new Error(`${method} ${path} → HTTP ${res.status}\n${text.slice(0, 300)}`);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

async function findBundleId(identifier: string): Promise<string | null> {
  const data = await api<{ data: Array<{ id: string; attributes: { identifier: string } }> }>(
    'GET',
    `/bundleIds?filter[identifier]=${identifier}&limit=10`,
  );
  const match = data.data.find((b) => b.attributes.identifier === identifier);
  return match?.id ?? null;
}

async function listCaps(bundleId: string): Promise<Set<string>> {
  const data = await api<{ data: Array<{ attributes: { capabilityType: string } }> }>(
    'GET',
    `/bundleIds/${bundleId}/bundleIdCapabilities`,
  );
  return new Set(data.data.map((c) => c.attributes.capabilityType));
}

async function enableCap(bundleId: string, cap: string): Promise<void> {
  try {
    await api('POST', '/bundleIdCapabilities', {
      data: {
        type: 'bundleIdCapabilities',
        attributes: { capabilityType: cap },
        relationships: {
          bundleId: { data: { type: 'bundleIds', id: bundleId } },
        },
      },
    });
    console.log(`    ✅ ${cap} eklendi`);
  } catch (e: unknown) {
    const msg = (e as Error).message;
    if (msg.includes('ENTITY_ERROR.ATTRIBUTE.INVALID') || msg.includes('already exists')) {
      console.log(`    ⏭  ${cap} zaten var (skip)`);
    } else {
      console.log(`    ❌ ${cap} eklenemedi: ${msg.slice(0, 120)}`);
    }
  }
}

async function deleteProfilesForBundle(bundleId: string, identifier: string): Promise<void> {
  const profiles = await api<{ data: Array<{ id: string; attributes: { name: string; profileType: string } }> }>(
    'GET',
    `/bundleIds/${bundleId}/profiles?limit=200`,
  );
  for (const p of profiles.data) {
    if (p.attributes.profileType !== 'IOS_APP_STORE') continue;
    console.log(`    🗑  Profile sil: ${p.attributes.name} (${p.id})`);
    try {
      await api('DELETE', `/profiles/${p.id}`);
    } catch (e: unknown) {
      console.log(`       hata: ${(e as Error).message.slice(0, 100)}`);
    }
  }
}

async function main() {
  for (const [identifier, required] of Object.entries(REQUIRED)) {
    console.log(`\n=== ${identifier} ===`);
    const bundleId = await findBundleId(identifier);
    if (!bundleId) {
      console.log(`  ❌ Bundle ID bulunamadı, skip.`);
      continue;
    }
    console.log(`  Bundle resource id: ${bundleId}`);

    const existing = await listCaps(bundleId);
    const missing = required.filter((c) => !existing.has(c));
    if (missing.length === 0) {
      console.log(`  ✅ Tüm capability'ler aktif.`);
    } else {
      console.log(`  Eksik: ${missing.join(', ')}`);
      for (const cap of missing) await enableCap(bundleId, cap);
    }

    console.log(`  Eski profile'ları temizle...`);
    await deleteProfilesForBundle(bundleId, identifier);
  }
  console.log('\n✅ Capability ayarlama + profile temizleme tamamlandı.');
  console.log('Sıradaki Codemagic build\'inde yeni profile\'lar capability\'lerle birlikte oluşturulacak.');
}

main().catch((e) => {
  console.error('FATAL:', e.message);
  process.exit(1);
});
