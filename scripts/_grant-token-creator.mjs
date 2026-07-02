import admin from 'firebase-admin';
import { readFileSync } from 'fs';
const sa = JSON.parse(readFileSync(new URL('../.hangelorg-sa.json', import.meta.url)));
admin.initializeApp({ credential: admin.credential.cert(sa) });
const token = (await admin.app().options.credential.getAccessToken()).access_token;
const PROJECT = 'hangelorg';
const H = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

const listJ = await (await fetch(`https://iam.googleapis.com/v1/projects/${PROJECT}/serviceAccounts`, { headers: H })).json();
if (listJ.error) { console.log('SA list HATASI:', listJ.error.status, listJ.error.message); process.exit(0); }
const accounts = (listJ.accounts || []).map((a) => a.email);
console.log('Servis hesapları:'); accounts.forEach((e) => console.log('  -', e));

const targets = accounts.filter((e) => e.includes('app-hosting') || e.includes('compute@') || e.includes('adminsdk'));
console.log('\nHedef SA(lar):', targets);
const role = 'roles/iam.serviceAccountTokenCreator';
for (const target of targets) {
  const resource = `projects/${PROJECT}/serviceAccounts/${target}`;
  const pol = await (await fetch(`https://iam.googleapis.com/v1/${resource}:getIamPolicy`, { method: 'POST', headers: H, body: '{}' })).json();
  if (pol.error) { console.log(`\n${target}: getIamPolicy HATASI ${pol.error.status} - ${pol.error.message}`); continue; }
  pol.bindings = pol.bindings || [];
  let b = pol.bindings.find((x) => x.role === role);
  if (!b) { b = { role, members: [] }; pol.bindings.push(b); }
  const member = `serviceAccount:${target}`;
  if (b.members.includes(member)) { console.log(`\n${target}: zaten Token Creator var ✅`); continue; }
  b.members.push(member);
  const setJ = await (await fetch(`https://iam.googleapis.com/v1/${resource}:setIamPolicy`, { method: 'POST', headers: H, body: JSON.stringify({ policy: pol }) })).json();
  if (setJ.error) console.log(`\n${target}: setIamPolicy HATASI ${setJ.error.status} - ${setJ.error.message}`);
  else console.log(`\n${target}: ✅ Token Creator GRANT edildi`);
}
process.exit(0);
