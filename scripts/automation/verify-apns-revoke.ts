/**
 * App Store Connect API üzerinden APNs key durumunu doğrula.
 */
import { getJwt } from './_appstore-jwt';

async function main() {
  const { token } = getJwt();
  const r = await fetch('https://api.appstoreconnect.apple.com/v1/apiKeys?limit=20', {
    headers: { Authorization: `Bearer ${token}` },
  });
  // Bu endpoint App Store Connect API keys'i list eder, APNs auth keys'i değil.
  // APNs keys ayrı bir Apple Developer endpoint. Direct list mümkün değil API'siyle.
  // Sadece App Store Connect listesi.
  const data = await r.json() as any;
  console.log('App Store Connect API Keys (ASC, NOT APNs):');
  console.log(JSON.stringify(data, null, 2).slice(0, 1500));
}
main().catch(e => { console.error(e.message); process.exit(1); });
