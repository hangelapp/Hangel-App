import { getJwt } from './_appstore-jwt';
const APP_ID = '6664058822';
async function main() {
  const jwt = await getJwt();
  const headers = { Authorization: `Bearer ${jwt}` };
  
  const r = await fetch(`https://api.appstoreconnect.apple.com/v1/apps/${APP_ID}/appStoreVersions?limit=10&sort=-createdDate`, { headers });
  const data = await r.json();
  console.log('Versions:', data.data?.length || 0);
  
  for (const v of (data.data || []).slice(0, 5)) {
    console.log(`\n${v.attributes.versionString} | state=${v.attributes.appStoreState} | id=${v.id}`);
  }
  
  const v203 = (data.data || []).find((v: any) => v.attributes.versionString === '2.0.3');
  if (!v203) { console.log('\n[!] v2.0.3 yok'); return; }
  
  console.log(`\n=== v2.0.3 (${v203.id}) screenshots ===`);
  const locsRes = await fetch(`https://api.appstoreconnect.apple.com/v1/appStoreVersions/${v203.id}/appStoreVersionLocalizations`, { headers });
  const locs = await locsRes.json();
  
  for (const loc of locs.data || []) {
    const setsRes = await fetch(`https://api.appstoreconnect.apple.com/v1/appStoreVersionLocalizations/${loc.id}/appScreenshotSets`, { headers });
    const sets = await setsRes.json();
    const counts = [];
    for (const set of sets.data || []) {
      const shotsRes = await fetch(`https://api.appstoreconnect.apple.com/v1/appScreenshotSets/${set.id}/appScreenshots`, { headers });
      const shots = await shotsRes.json();
      counts.push(`${set.attributes.screenshotDisplayType}=${shots.data?.length || 0}`);
    }
    console.log(`  ${loc.attributes.locale}: ${counts.join(', ') || 'no sets'}`);
  }
}
main().catch(e => console.error('ERR:', e.message, e.stack));
