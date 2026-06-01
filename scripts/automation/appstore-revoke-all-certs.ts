/**
 * App Store Connect API - TÜM signing cert'leri revoke et
 * (Distribution + Development + tüm tipler).
 *
 * Codemagic xcodebuild automatic signing'i clean slate gerektiriyor —
 * eski Apple Development cert'ler keychain'de private key olmadan
 * görünürse build fail eder. Bu script hepsini revoke eder, Xcode
 * fresh oluştursun.
 */
import { getJwt, ISSUER_ID } from './_appstore-jwt';

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

async function main() {
  const data = await api<{ data: Array<{ id: string; attributes: { certificateType: string; displayName: string } }> }>(
    'GET', '/certificates?limit=200',
  );
  console.log(`Found ${data.data.length} cert(s):`);
  for (const c of data.data) {
    console.log(`  [${c.attributes.certificateType.padEnd(20)}] ${c.attributes.displayName} (${c.id})`);
  }
  console.log('\nRevoking ALL...');
  for (const c of data.data) {
    process.stdout.write(`  ${c.id} ${c.attributes.certificateType}...`);
    await api('DELETE', `/certificates/${c.id}`);
    console.log(' ✅');
  }
  console.log(`\nTotal revoked: ${data.data.length}`);
}

main().catch((e) => {
  console.error('HATA:', e.message);
  process.exit(1);
});
