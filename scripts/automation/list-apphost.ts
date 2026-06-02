import { readFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
async function getToken() {
  const cfg = JSON.parse(readFileSync(join(homedir(), '.config/configstore/firebase-tools.json'), 'utf8'));
  const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ client_id: '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com', client_secret: 'j9iVZfS8kkCEFUPaAeJV0sAi', refresh_token: cfg.tokens.refresh_token, grant_type: 'refresh_token' }) });
  return (await r.json() as any).access_token;
}
(async () => {
  const t = await getToken();
  const r = await fetch('https://cloudbuild.googleapis.com/v1/projects/hangel-new-v18-87297865-9bcc3/locations/us-central1/builds?pageSize=5', { headers: { Authorization: `Bearer ${t}` } });
  const d = await r.json() as any;
  console.log('Latest builds:');
  for (const b of d.builds || []) {
    const sha = b.tags?.find((x: string) => /^[a-f0-9]{40}$/.test(x))?.slice(0,8) || '?';
    const dur = b.finishTime && b.startTime ? Math.round((new Date(b.finishTime).getTime() - new Date(b.startTime).getTime())/1000) + 's' : 'running';
    console.log(`  ${b.status.padEnd(10)} ${sha}  ${b.startTime?.slice(0,19)}  ${dur}`);
  }
})();
