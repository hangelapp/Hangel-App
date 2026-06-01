import { initializeApp, cert } from 'firebase-admin/app';
import { Logging } from '@google-cloud/logging';

initializeApp({ credential: cert(process.env.GOOGLE_APPLICATION_CREDENTIALS!) });

const logging = new Logging({
  projectId: 'hangel-new-v18-87297865-9bcc3',
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});

async function main() {
  const filter = `resource.type="cloud_function" AND resource.labels.function_name="onEmergencyBloodUpdate" AND timestamp >= "${new Date(Date.now() - 5*60*1000).toISOString()}"`;
  const [entries] = await logging.getEntries({ filter, pageSize: 30, orderBy: 'timestamp desc' });
  for (const e of entries) {
    const sev = e.metadata.severity ?? 'INFO';
    const msg = (e.data as any)?.message || JSON.stringify(e.data);
    console.log(`[${sev}] ${e.metadata.timestamp} ${msg}`);
  }
  if (entries.length === 0) console.log('(no logs in last 5 min)');
}
main().catch(e => { console.error(e); process.exit(1); });
