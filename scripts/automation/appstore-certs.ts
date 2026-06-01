/**
 * App Store Connect API - Signing Certificate yönetimi.
 *
 * Komutlar:
 *   npx tsx scripts/automation/appstore-certs.ts list
 *   npx tsx scripts/automation/appstore-certs.ts revoke-distribution
 */
import { getJwt } from './_appstore-jwt';

const BASE = 'https://api.appstoreconnect.apple.com/v1';

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

async function list() {
  const data = await api<{ data: Array<{ id: string; attributes: { name: string; certificateType: string; displayName: string; expirationDate: string } }> }>(
    'GET', '/certificates?limit=200',
  );
  console.log(`Total: ${data.data.length} certificate(s)\n`);
  for (const c of data.data) {
    const a = c.attributes;
    console.log(`  [${a.certificateType.padEnd(20)}] ${a.displayName || a.name} (id: ${c.id}, exp: ${a.expirationDate?.slice(0, 10)})`);
  }
}

async function revokeDistribution() {
  const data = await api<{ data: Array<{ id: string; attributes: { certificateType: string; displayName: string } }> }>(
    'GET', '/certificates?limit=200',
  );
  const dist = data.data.filter((c) => c.attributes.certificateType.includes('DISTRIBUTION'));
  console.log(`Found ${dist.length} distribution cert(s) to revoke:`);
  for (const c of dist) {
    console.log(`  Revoking ${c.attributes.displayName} (${c.id})...`);
    await api('DELETE', `/certificates/${c.id}`);
    console.log(`    ✅ Revoked.`);
  }
  console.log(`\nTotal revoked: ${dist.length}`);
}

async function main() {
  const [cmd] = process.argv.slice(2);
  switch (cmd) {
    case 'list':
      await list();
      break;
    case 'revoke-distribution':
      await revokeDistribution();
      break;
    default:
      console.log('Komutlar: list, revoke-distribution');
  }
}

main().catch((e) => {
  console.error('HATA:', e.message);
  process.exit(1);
});
