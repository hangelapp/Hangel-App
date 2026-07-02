import admin from 'firebase-admin';
import { readFileSync } from 'fs';
const sa = JSON.parse(readFileSync(new URL('../.hangelorg-sa.json', import.meta.url)));
admin.initializeApp({ credential: admin.credential.cert(sa) });
const at = await admin.app().options.credential.getAccessToken();
const token = at.access_token;
const since = new Date(Date.now() - 30 * 60000).toISOString();
const res = await fetch('https://logging.googleapis.com/v2/entries:list', {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    resourceNames: ['projects/hangelorg'],
    filter: `severity>=ERROR AND timestamp>="${since}"`,
    orderBy: 'timestamp desc',
    pageSize: 15,
  }),
});
const j = await res.json();
if (j.error) {
  console.log('LOG API HATASI:', j.error.status, '-', j.error.message);
  process.exit(0);
}
const entries = j.entries || [];
console.log('Son 30dk hata log sayısı:', entries.length);
for (const e of entries) {
  const msg = e.textPayload || e.jsonPayload?.message || e.jsonPayload?.stack || JSON.stringify(e.jsonPayload || {});
  console.log('---', e.timestamp, '|', e.resource?.type || '');
  console.log(String(msg).slice(0, 500));
}
process.exit(0);
