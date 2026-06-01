/**
 * Gmail okuma helper — Apple, Codemagic, GitHub gibi göndericilerden
 * son N gün mailleri filtreleyip okuyabilir.
 *
 * Kullanım:
 *   npx tsx scripts/automation/gmail-read.ts --from "apple.com" --days 7
 *   npx tsx scripts/automation/gmail-read.ts --query "from:apple.com critical alerts"
 */
import { readFileSync } from 'fs';
import { google } from 'googleapis';

const OAUTH_PATH = '.gmail-oauth.json';

function getArg(name: string, def?: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : def;
}

async function main() {
  const account = getArg('account', 'ismailhilmi')!;
  const TOKEN_PATH = `.gmail-token-${account}.json`;
  const creds = JSON.parse(readFileSync(OAUTH_PATH, 'utf8')).installed;
  const tokens = JSON.parse(readFileSync(TOKEN_PATH, 'utf8'));
  const oauth2 = new google.auth.OAuth2(creds.client_id, creds.client_secret);
  oauth2.setCredentials(tokens);
  const gmail = google.gmail({ version: 'v1', auth: oauth2 });

  const from = getArg('from');
  const days = parseInt(getArg('days', '30') || '30');
  const explicitQuery = getArg('query');
  const max = parseInt(getArg('max', '20') || '20');

  let q: string;
  if (explicitQuery) {
    q = explicitQuery;
  } else if (from) {
    q = `from:${from} newer_than:${days}d`;
  } else {
    q = `newer_than:${days}d`;
  }

  console.log(`[gmail-read] Account: ${account} | Query: ${q}\n`);

  const list = await gmail.users.messages.list({ userId: 'me', q, maxResults: max });
  const messages = list.data.messages || [];
  console.log(`[gmail-read] ${messages.length} mesaj bulundu.\n`);

  for (const m of messages) {
    const msg = await gmail.users.messages.get({ userId: 'me', id: m.id!, format: 'metadata', metadataHeaders: ['From', 'Subject', 'Date'] });
    const headers = msg.data.payload?.headers || [];
    const from = headers.find((h) => h.name === 'From')?.value || '?';
    const subject = headers.find((h) => h.name === 'Subject')?.value || '?';
    const date = headers.find((h) => h.name === 'Date')?.value || '?';
    const snippet = msg.data.snippet || '';
    console.log(`📧 [${date.slice(0, 25)}]`);
    console.log(`   From:    ${from}`);
    console.log(`   Subject: ${subject}`);
    console.log(`   Snippet: ${snippet.slice(0, 120)}...`);
    console.log('');
  }
}

main().catch((e) => {
  console.error('HATA:', e);
  process.exit(1);
});
