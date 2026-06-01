/**
 * App Hosting'in son N build'ini listele (status + commit hash).
 */
import { readFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

const PROJECT_ID = 'hangel-new-v18-87297865-9bcc3';
const REGION = 'us-central1';
const FB_CLI_CLIENT_ID = '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com';
const FB_CLI_CLIENT_SECRET = 'j9iVZfS8kkCEFUPaAeJV0sAi';

async function getAccessToken(): Promise<string> {
  const cfg = JSON.parse(readFileSync(join(homedir(), '.config/configstore/firebase-tools.json'), 'utf8'));
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: FB_CLI_CLIENT_ID,
      client_secret: FB_CLI_CLIENT_SECRET,
      refresh_token: cfg.tokens.refresh_token,
      grant_type: 'refresh_token',
    }),
  });
  return (await res.json() as { access_token: string }).access_token;
}

async function main() {
  const token = await getAccessToken();
  const url = `https://cloudbuild.googleapis.com/v1/projects/${PROJECT_ID}/locations/${REGION}/builds?pageSize=8`;
  const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  const data = await r.json() as { builds?: any[] };
  if (!data.builds) {
    console.log('No builds.');
    return;
  }
  console.log(`\n=== Son ${data.builds.length} App Hosting Build ===\n`);
  for (const b of data.builds) {
    const tag = b.tags?.find((t: string) => t.length === 40) || '?'; // 40-char git sha
    const isShortTag = b.tags?.find((t: string) => /^[a-f0-9]{40}$/.test(t)) || '';
    const sha = isShortTag.slice(0, 8) || '?';
    const startTime = b.startTime?.split('.')[0] || '?';
    const dur = b.finishTime && b.startTime
      ? Math.round((new Date(b.finishTime).getTime() - new Date(b.startTime).getTime()) / 1000) + 's'
      : 'running';
    console.log(`${b.status.padEnd(10)} ${sha}  ${startTime}  ${dur}`);
    if (b.failureInfo?.detail) {
      console.log(`           ↳ ${b.failureInfo.detail.slice(0, 120)}`);
    }
  }
}
main().catch(e => { console.error(e); process.exit(1); });
