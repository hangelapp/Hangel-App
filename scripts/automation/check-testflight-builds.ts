/**
 * App Store Connect API'den son TestFlight build'leri çek.
 */
import { getJwt } from './_appstore-jwt';

const APP_ID = '6664058822';

async function main() {
  const { token } = getJwt();
  const url = `https://api.appstoreconnect.apple.com/v1/builds?filter[app]=${APP_ID}&sort=-version&limit=10&include=preReleaseVersion,buildBetaDetail`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) {
    console.error(await res.text());
    process.exit(1);
  }
  const data = await res.json() as any;
  const included = data.included || [];
  const versionMap = new Map<string, string>();
  const detailMap = new Map<string, any>();
  for (const inc of included) {
    if (inc.type === 'preReleaseVersions') versionMap.set(inc.id, inc.attributes.version);
    if (inc.type === 'buildBetaDetails') detailMap.set(inc.id, inc.attributes);
  }
  console.log('\n=== Son TestFlight Build\'leri (App Store Connect) ===\n');
  for (const b of data.data) {
    const a = b.attributes;
    const versionId = b.relationships?.preReleaseVersion?.data?.id;
    const version = versionId ? versionMap.get(versionId) : '?';
    const detailId = b.relationships?.buildBetaDetail?.data?.id;
    const detail = detailId ? detailMap.get(detailId) : null;
    const internalState = detail?.internalBuildState ?? '?';
    const externalState = detail?.externalBuildState ?? '?';
    console.log(`Build ${version} (${a.version})`);
    console.log(`  Processing:     ${a.processingState}`);
    console.log(`  Internal state: ${internalState}`);
    console.log(`  External state: ${externalState}`);
    console.log(`  Expired:        ${a.expired}`);
    console.log(`  Uploaded:       ${a.uploadedDate}`);
    console.log(`  Expires:        ${a.expirationDate}`);
    console.log(`  Min OS:         ${a.minOsVersion}`);
    console.log('');
  }
}
main().catch(e => { console.error(e); process.exit(1); });
