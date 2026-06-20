/**
 * scripts/sip-test.mjs
 *
 * SIP server'a hızlı sağlık + credentials testi:
 *  1. OPTIONS ping (auth gerekmez) — server canlı mı?
 *  2. REGISTER attempt (digest auth) — credentials çalışıyor mu?
 *
 * Hiçbir parolayı hardcoded barındırmaz — env ile geçer.
 *
 * Usage:
 *   SIP_HOST=185.77.91.103 \
 *   SIP_USER=902167080216 \
 *   SIP_PASS='XXX' \
 *   [SIP_PORT=5060] [SIP_TIMEOUT=5000] \
 *   node scripts/sip-test.mjs
 */
import dgram from 'node:dgram';
import { createHash } from 'node:crypto';
import { networkInterfaces } from 'node:os';

const HOST = process.env.SIP_HOST;
const PORT = parseInt(process.env.SIP_PORT || '5060', 10);
const USER = process.env.SIP_USER;
const PASS = process.env.SIP_PASS;
const TIMEOUT = parseInt(process.env.SIP_TIMEOUT || '5000', 10);

if (!HOST || !USER || !PASS) {
  console.error('Gerekli env: SIP_HOST, SIP_USER, SIP_PASS');
  process.exit(1);
}

const localIp = (() => {
  const ifs = networkInterfaces();
  for (const list of Object.values(ifs)) {
    for (const i of list || []) {
      if (i.family === 'IPv4' && !i.internal) return i.address;
    }
  }
  return '127.0.0.1';
})();

const localPort = 5070 + Math.floor(Math.random() * 100);
const callId = Math.random().toString(36).slice(2);
const tag = Math.random().toString(36).slice(2);
const branch = `z9hG4bK${Math.random().toString(36).slice(2)}`;
let cseq = 1;

const socket = dgram.createSocket('udp4');
let timedOut = false;
const t = setTimeout(() => {
  timedOut = true;
  console.error('⏱ Timeout — server cevap vermedi (5sn).');
  socket.close();
  process.exit(2);
}, TIMEOUT);

function buildOptions() {
  return [
    `OPTIONS sip:${HOST} SIP/2.0`,
    `Via: SIP/2.0/UDP ${localIp}:${localPort};branch=${branch};rport`,
    `From: <sip:${USER}@${HOST}>;tag=${tag}`,
    `To: <sip:${HOST}>`,
    `Call-ID: ${callId}@${localIp}`,
    `CSeq: ${cseq} OPTIONS`,
    `Contact: <sip:${USER}@${localIp}:${localPort}>`,
    `Max-Forwards: 70`,
    `User-Agent: hangel-sip-tester/1.0`,
    `Accept: application/sdp`,
    `Content-Length: 0`,
    '',
    '',
  ].join('\r\n');
}

function buildRegister(authHeader) {
  cseq++;
  const lines = [
    `REGISTER sip:${HOST} SIP/2.0`,
    `Via: SIP/2.0/UDP ${localIp}:${localPort};branch=${branch}-r;rport`,
    `From: <sip:${USER}@${HOST}>;tag=${tag}`,
    `To: <sip:${USER}@${HOST}>`,
    `Call-ID: ${callId}@${localIp}`,
    `CSeq: ${cseq} REGISTER`,
    `Contact: <sip:${USER}@${localIp}:${localPort}>;expires=60`,
    `Max-Forwards: 70`,
    `User-Agent: hangel-sip-tester/1.0`,
  ];
  if (authHeader) lines.push(`Authorization: ${authHeader}`);
  lines.push(`Expires: 60`, `Content-Length: 0`, '', '');
  return lines.join('\r\n');
}

function md5(s) { return createHash('md5').update(s).digest('hex'); }

function buildAuthResponse(challenge) {
  const realm = challenge.match(/realm="([^"]+)"/)?.[1] || HOST;
  const nonce = challenge.match(/nonce="([^"]+)"/)?.[1] || '';
  const algorithm = challenge.match(/algorithm=([^,\s]+)/)?.[1] || 'MD5';
  const qop = challenge.match(/qop="([^"]+)"/)?.[1];
  const opaque = challenge.match(/opaque="([^"]+)"/)?.[1];
  const uri = `sip:${HOST}`;

  const ha1 = md5(`${USER}:${realm}:${PASS}`);
  const ha2 = md5(`REGISTER:${uri}`);

  let response;
  let authLine = `Digest username="${USER}", realm="${realm}", nonce="${nonce}", uri="${uri}", algorithm=${algorithm}`;

  if (qop) {
    const cnonce = Math.random().toString(36).slice(2);
    const nc = '00000001';
    response = md5(`${ha1}:${nonce}:${nc}:${cnonce}:${qop}:${ha2}`);
    authLine += `, qop=${qop}, nc=${nc}, cnonce="${cnonce}", response="${response}"`;
  } else {
    response = md5(`${ha1}:${nonce}:${ha2}`);
    authLine += `, response="${response}"`;
  }
  if (opaque) authLine += `, opaque="${opaque}"`;

  return authLine;
}

let step = 'options';
socket.on('message', (msg) => {
  const text = msg.toString();
  const firstLine = text.split('\r\n')[0];
  console.log(`\n← ${step.toUpperCase()} cevap: ${firstLine}`);

  if (step === 'options') {
    console.log('✓ Server canlı — SIP stack çalışıyor.');
    // Geç REGISTER'a — credentials testi
    step = 'register-1';
    console.log('\n→ REGISTER deneniyor (auth challenge alacağız)...');
    socket.send(buildRegister(null), PORT, HOST);
    return;
  }

  if (step === 'register-1') {
    if (text.startsWith('SIP/2.0 401') || text.startsWith('SIP/2.0 407')) {
      const wwwAuth = text.match(/(?:WWW-Authenticate|Proxy-Authenticate):\s*(.+?)(?:\r\n[A-Z]|\r\n\r\n)/i);
      if (!wwwAuth) {
        console.error('Auth challenge alınamadı (header yok)');
        clearTimeout(t);
        socket.close();
        process.exit(3);
      }
      console.log('✓ Auth challenge alındı, digest hesaplanıyor...');
      const authHeader = buildAuthResponse(wwwAuth[1]);
      step = 'register-2';
      socket.send(buildRegister(authHeader), PORT, HOST);
      return;
    }
    if (text.startsWith('SIP/2.0 200')) {
      console.log('✓ Anında 200 OK — bu server auth gerekmiyor (garip ama OK).');
      clearTimeout(t);
      socket.close();
      process.exit(0);
    }
    console.error(`Beklenmedik cevap: ${firstLine}`);
    clearTimeout(t);
    socket.close();
    process.exit(4);
  }

  if (step === 'register-2') {
    clearTimeout(t);
    if (text.startsWith('SIP/2.0 200')) {
      console.log('🎉 BAŞARILI — credentials doğru, kullanıcı login oldu.');
      socket.close();
      process.exit(0);
    } else if (text.startsWith('SIP/2.0 403') || text.startsWith('SIP/2.0 401')) {
      console.error('❌ FORBIDDEN/UNAUTHORIZED — kullanıcı kodu veya şifre yanlış.');
      socket.close();
      process.exit(5);
    } else {
      console.error(`Beklenmedik cevap: ${firstLine}`);
      console.error(text.slice(0, 500));
      socket.close();
      process.exit(6);
    }
  }
});

socket.on('error', (err) => {
  clearTimeout(t);
  console.error('Socket hata:', err.message);
  process.exit(7);
});

socket.bind(localPort, () => {
  console.log(`SIP test — local ${localIp}:${localPort} → ${HOST}:${PORT}`);
  console.log(`Kullanıcı: ${USER}`);
  console.log('\n→ OPTIONS gönderiliyor (ping)...');
  socket.send(buildOptions(), PORT, HOST);
});
