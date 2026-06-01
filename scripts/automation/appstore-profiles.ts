/**
 * App Store Connect API - Provisioning Profile yönetimi.
 *
 * Komutlar:
 *   npx tsx scripts/automation/appstore-profiles.ts list
 *   npx tsx scripts/automation/appstore-profiles.ts delete-all
 */
import { getJwt } from './_appstore-jwt';

const BUNDLE_ID = 'com.hangel.ios.app';
const BASE = 'https://api.appstoreconnect.apple.com/v1';

async function api<T>(method: string, path: string): Promise<T> {
  const { token } = getJwt();
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${method} ${path} → HTTP ${res.status}\n${text}`);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

async function list() {
  const data = await api<{ data: Array<{ id: string; attributes: { name: string; profileType: string; profileState: string; expirationDate: string } }> }>(
    'GET',
    '/profiles?limit=200',
  );
  console.log(`Total: ${data.data.length} profile(s)\n`);
  for (const p of data.data) {
    const a = p.attributes;
    console.log(`  [${a.profileState.padEnd(8)}] ${a.profileType.padEnd(25)} ${a.name} (id: ${p.id}, exp: ${a.expirationDate?.slice(0, 10)})`);
  }
}

async function deleteAll() {
  // Filter by bundle ID
  const all = await api<{ data: Array<{ id: string; attributes: { name: string }; relationships?: { bundleId?: { data?: { id: string } } } }> }>(
    'GET',
    `/profiles?limit=200&include=bundleId`,
  );
  console.log(`Profile count: ${all.data.length}`);
  // We need to know bundle ID first
  const bundleData = await api<{ data: Array<{ id: string; attributes: { identifier: string } }> }>(
    'GET',
    `/bundleIds?filter[identifier]=${BUNDLE_ID}`,
  );
  const bundleResourceId = bundleData.data[0]?.id;
  if (!bundleResourceId) throw new Error(`Bundle ${BUNDLE_ID} not found`);
  console.log(`Bundle resource id: ${bundleResourceId}`);

  // Get profiles linked to this bundle
  const linked = await api<{ data: Array<{ id: string; attributes: { name: string } }> }>(
    'GET',
    `/bundleIds/${bundleResourceId}/profiles?limit=200`,
  );
  console.log(`Found ${linked.data.length} profile(s) linked to ${BUNDLE_ID}:`);
  for (const p of linked.data) {
    console.log(`  Deleting ${p.attributes.name} (${p.id})...`);
    await api('DELETE', `/profiles/${p.id}`);
    console.log(`    ✅ Deleted.`);
  }
  console.log(`\nTotal deleted: ${linked.data.length}`);
}

async function main() {
  const [cmd] = process.argv.slice(2);
  switch (cmd) {
    case 'list':
      await list();
      break;
    case 'delete-all':
      await deleteAll();
      break;
    default:
      console.log('Komutlar: list, delete-all');
  }
}

main().catch((e) => {
  console.error('HATA:', e.message);
  process.exit(1);
});
