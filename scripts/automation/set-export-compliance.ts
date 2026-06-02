import { getJwt } from './_appstore-jwt';
async function main() {
  const { token } = getJwt();
  // Find latest build
  const r = await fetch('https://api.appstoreconnect.apple.com/v1/builds?filter[app]=6664058822&sort=-uploadedDate&limit=1', { headers: { Authorization: `Bearer ${token}` } });
  const d = await r.json() as any;
  const build = d.data[0];
  const buildId = build.id;
  console.log(`Latest build: ${build.attributes.version} id=${buildId}`);

  // Set usesNonExemptEncryption = false
  const upd = await fetch(`https://api.appstoreconnect.apple.com/v1/builds/${buildId}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      data: {
        type: 'builds',
        id: buildId,
        attributes: { usesNonExemptEncryption: false },
      },
    }),
  });
  console.log(`Export compliance PATCH: HTTP ${upd.status}`);
  if (!upd.ok) console.log(await upd.text());
  else console.log('✅ Build artık TestFlight\'tan install edilebilir');
}
main();
