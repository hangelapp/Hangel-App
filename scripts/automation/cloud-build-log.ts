/**
 * Firebase CLI refresh token üzerinden Cloud Build log oku.
 */
import { readFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

const PROJECT_ID = 'hangel-new-v18-87297865-9bcc3';
const BUILD_ID = process.argv[2] ?? '76e8eac4-d10a-4cbd-b5b8-24c5534fb1de';

const FB_CLI_CLIENT_ID = '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com';
const FB_CLI_CLIENT_SECRET = 'j9iVZfS8kkCEFUPaAeJV0sAi';

async function getAccessToken(): Promise<string> {
  const cfg = JSON.parse(readFileSync(join(homedir(), '.config/configstore/firebase-tools.json'), 'utf8'));
  const refresh = cfg.tokens.refresh_token;
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: FB_CLI_CLIENT_ID,
      client_secret: FB_CLI_CLIENT_SECRET,
      refresh_token: refresh,
      grant_type: 'refresh_token',
    }),
  });
  if (!res.ok) throw new Error(`Token refresh failed: ${await res.text()}`);
  return (await res.json() as { access_token: string }).access_token;
}

async function main() {
  const token = await getAccessToken();
  // Cloud Logging API ile build log entry'leri çek
  const filter = `"${BUILD_ID}" AND timestamp >= "2026-06-01T16:18:00Z" AND timestamp <= "2026-06-01T16:27:00Z"`;
  const body = {
    resourceNames: [`projects/${PROJECT_ID}`],
    filter,
    orderBy: 'timestamp asc',
    pageSize: 1000,
  };
  const res = await fetch('https://logging.googleapis.com/v2/entries:list', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    console.error(`HTTP ${res.status}: ${await res.text()}`);
    process.exit(1);
  }
  const data = await res.json() as { entries?: any[] };
  if (!data.entries || data.entries.length === 0) {
    console.log('(no entries)');
    return;
  }
  console.log(`=== ${data.entries.length} log entries ===\n`);
  for (const e of data.entries) {
    const t = e.timestamp;
    const sev = e.severity || 'INFO';
    const msg = e.textPayload || e.jsonPayload?.message || JSON.stringify(e.jsonPayload || e.protoPayload || '');
    console.log(`[${sev}] ${msg}`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
