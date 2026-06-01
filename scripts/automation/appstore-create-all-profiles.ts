/**
 * 4 bundle (App, Clip, Widgets, Watch) için Distribution profile'lar yarat.
 * Capability'ler bundle'lardan otomatik dahil olur. Cert ID gerekir.
 */
import { getJwt } from './_appstore-jwt';

const BASE = 'https://api.appstoreconnect.apple.com/v1';

const BUNDLES = [
  { id: 'M35L72V95N', name: 'com.hangel.ios.app',          profileName: 'Hangel App Distribution' },
  { id: '83VT634MM4', name: 'com.hangel.ios.app.widgets',  profileName: 'Hangel Widgets Distribution' },
  { id: 'XVKY8F9R2H', name: 'com.hangel.ios.app.Clip',     profileName: 'Hangel App Clip Distribution' },
  { id: 'T22P5JXRNR', name: 'com.hangel.ios.app.watchapp', profileName: 'Hangel Watch Distribution' },
];

async function api<T>(method: string, path: string, body?: unknown): Promise<T> {
  const { token } = getJwt();
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`${method} ${path} → HTTP ${res.status}: ${t.slice(0, 400)}`);
  }
  return (await res.json()) as T;
}

async function getCertId(): Promise<string> {
  const r = await api<{ data: any[] }>('GET', '/certificates?limit=20');
  const dist = r.data.find(c => c.attributes.certificateType === 'DISTRIBUTION');
  if (!dist) throw new Error('No DISTRIBUTION cert');
  return dist.id;
}

async function createProfile(bundleResId: string, certId: string, name: string): Promise<{ id: string; uuid: string }> {
  const r = await api<{ data: any }>('POST', '/profiles', {
    data: {
      type: 'profiles',
      attributes: { name, profileType: 'IOS_APP_STORE' },
      relationships: {
        bundleId: { data: { type: 'bundleIds', id: bundleResId } },
        certificates: { data: [{ type: 'certificates', id: certId }] },
      },
    },
  });
  return { id: r.data.id, uuid: r.data.attributes.uuid };
}

async function main() {
  const certId = await getCertId();
  console.log(`Using cert: ${certId}\n`);
  for (const b of BUNDLES) {
    try {
      const ts = Math.floor(new Date('2026-06-01T22:00:00Z').getTime() / 1000);
      const result = await createProfile(b.id, certId, `${b.profileName} ${ts}`);
      console.log(`✅ ${b.name}: profile ${result.id} (uuid ${result.uuid})`);
    } catch (e: unknown) {
      console.log(`❌ ${b.name}: ${(e as Error).message.slice(0, 250)}`);
    }
  }
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
