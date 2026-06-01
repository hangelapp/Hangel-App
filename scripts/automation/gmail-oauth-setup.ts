/**
 * Gmail OAuth setup — bir kere çalıştırılır, hangelapp@gmail.com
 * onayını alır, refresh token'i .gmail-token.json'a kaydeder.
 *
 * Çalıştır:  cd ~/new-app && npx tsx scripts/automation/gmail-oauth-setup.ts
 *
 * Sonraki kullanım için bkz: scripts/automation/gmail-read.ts
 */
import { readFileSync, writeFileSync } from 'fs';
import { google } from 'googleapis';
import * as http from 'http';
import { URL } from 'url';

const OAUTH_PATH = '.gmail-oauth.json';
const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];

function getArg(name: string, def?: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : def;
}

async function main() {
  const accountLabel = getArg('account', 'default')!;
  const TOKEN_PATH = `.gmail-token-${accountLabel}.json`;
  console.log(`[gmail-oauth] Hesap etiketi: ${accountLabel} → ${TOKEN_PATH}`);

  const creds = JSON.parse(readFileSync(OAUTH_PATH, 'utf8')).installed;
  const oauth2 = new google.auth.OAuth2(
    creds.client_id,
    creds.client_secret,
    'http://localhost:4123/oauth2callback',
  );

  const authUrl = oauth2.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent select_account', // force refresh_token + account picker
  });

  console.log('\n=================================================================');
  console.log('Browser otomatik açılacak. Onay ver, hangelapp@gmail.com ile giriş yap.');
  console.log('Eğer browser açılmazsa şu URL\'yi manuel aç:');
  console.log('\n' + authUrl + '\n');
  console.log('=================================================================\n');

  // open URL in Chrome incognito (forces sign-in)
  const { exec } = await import('child_process');
  exec(`open -na "Google Chrome" --args --incognito "${authUrl}"`);

  // local callback server
  const code = await new Promise<string>((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const u = new URL(req.url || '', 'http://localhost:4123');
      const c = u.searchParams.get('code');
      if (c) {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end('<h2>✅ Onay alındı. Bu sekmeyi kapatabilirsin.</h2>');
        server.close();
        resolve(c);
      } else {
        res.writeHead(400);
        res.end('No code');
      }
    });
    server.on('error', reject);
    server.listen(4123, () => console.log('[gmail-oauth] Callback server: http://localhost:4123/oauth2callback'));
  });

  const { tokens } = await oauth2.getToken(code);
  writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));
  console.log(`\n✅ Token kaydedildi: ${TOKEN_PATH}`);
  console.log(`   refresh_token mevcut: ${tokens.refresh_token ? 'YES' : 'NO ❌ (tekrar dene, prompt=consent eksik)'}`);
  process.exit(0);
}

main().catch((e) => {
  console.error('HATA:', e);
  process.exit(1);
});
