/**
 * generate-music-jingle.mjs — SÖZSÜZ (instrumental) hangel jingle'larını SAF KOD ile
 * üretir (DSP additive synthesis → WAV), Storage'a yükler, siteSettings/jingles'a yazar.
 *
 * Müzik modeli/AI YOK — bell/celesta tını (additive partial + ADSR) + yumuşak pad akoru
 * + Schroeder reverb. Sıcak, marka kimliğine uygun kısa çıngırak melodileri.
 *
 * Çalıştır:  node scripts/generate-music-jingle.mjs
 */
import admin from 'firebase-admin';
import fs from 'fs';

const SR = 44100;
const PROJECT_ID = 'hangel-new-v18-87297865-9bcc3';
const BUCKET = 'hangel-new-v18-87297865-9bcc3.firebasestorage.app';
const sa = JSON.parse(fs.readFileSync('./.firebase-service-account.json', 'utf8'));
admin.initializeApp({ credential: admin.credential.cert(sa), projectId: PROJECT_ID, storageBucket: BUCKET });
const db = admin.firestore();
const bucket = admin.storage().bucket();

// --- DSP yardımcıları ---
// Çan/celesta tını: hafif inharmonik partial seti + hızlı atak + üstel sönüm.
const PARTIALS = [[1, 1.0], [2, 0.55], [3, 0.28], [4.2, 0.14], [5.4, 0.07], [6.8, 0.035]];
function bell(buf, freq, t0, dur, gain) {
  const n0 = Math.floor(t0 * SR), len = Math.floor(dur * SR);
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    const env = Math.exp(-t * 3.0) * (1 - Math.exp(-t * 280)); // perküsif çan zarfı
    const vib = 1 + 0.0035 * Math.sin(2 * Math.PI * 5.2 * t);
    let s = 0;
    for (const [pm, pa] of PARTIALS) s += pa * Math.sin(2 * Math.PI * freq * pm * vib * t);
    const idx = n0 + i; if (idx < buf.length) buf[idx] += s * env * gain;
  }
}
// Sıcak pad akoru: yavaş swell + yavaş sönüm, hafif detune.
function pad(buf, freqs, t0, dur, gain) {
  const n0 = Math.floor(t0 * SR), len = Math.floor(dur * SR);
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    const env = (1 - Math.exp(-t * 1.8)) * Math.exp(-t * 0.55);
    let s = 0;
    for (const f of freqs) s += Math.sin(2 * Math.PI * f * t) + 0.3 * Math.sin(2 * Math.PI * f * 2.002 * t);
    const idx = n0 + i; if (idx < buf.length) buf[idx] += (s / freqs.length) * env * gain;
  }
}
// Schroeder reverb (4 comb + 2 allpass) — yumuşak kuyruk.
function reverb(dry, wetMix) {
  const comb = [[1557, 0.78], [1617, 0.77], [1491, 0.79], [1422, 0.76]];
  const allp = [[225, 0.7], [556, 0.7]];
  let wet = new Float32Array(dry.length);
  for (const [d, fb] of comb) {
    const z = new Float32Array(d);
    for (let i = 0; i < dry.length; i++) {
      const y = dry[i] + fb * z[i % d];
      z[i % d] = y; wet[i] += y / comb.length;
    }
  }
  for (const [d, g] of allp) {
    const z = new Float32Array(d); const out = new Float32Array(wet.length);
    for (let i = 0; i < wet.length; i++) {
      const buffered = z[i % d];
      const y = -g * wet[i] + buffered;
      z[i % d] = wet[i] + g * y; out[i] = y;
    }
    wet = out;
  }
  const mix = new Float32Array(dry.length);
  for (let i = 0; i < dry.length; i++) mix[i] = dry[i] * (1 - wetMix) + wet[i] * wetMix;
  return mix;
}
function normalize(buf, peak = 0.9) {
  let max = 1e-9; for (let i = 0; i < buf.length; i++) max = Math.max(max, Math.abs(buf[i]));
  const g = peak / max;
  for (let i = 0; i < buf.length; i++) buf[i] = Math.tanh(buf[i] * g * 1.1); // yumuşak limiter
  return buf;
}
function toWav(buf) {
  const n = buf.length, out = Buffer.alloc(44 + n * 2);
  out.write('RIFF', 0); out.writeUInt32LE(36 + n * 2, 4); out.write('WAVE', 8);
  out.write('fmt ', 12); out.writeUInt32LE(16, 16); out.writeUInt16LE(1, 20); out.writeUInt16LE(1, 22);
  out.writeUInt32LE(SR, 24); out.writeUInt32LE(SR * 2, 28); out.writeUInt16LE(2, 32); out.writeUInt16LE(16, 34);
  out.write('data', 36); out.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) out.writeInt16LE(Math.max(-32767, Math.min(32767, Math.round(buf[i] * 32767))), 44 + i * 2);
  return out;
}

// --- Jingle varyantları (sözsüz, ~3.5sn + reverb kuyruğu) ---
const VARIANTS = [
  { key: 'muzik0', name: 'hangel Jenerik — Karşılama (sözsüz)',
    chord: [261.63, 329.63, 392.00], // C majör — umutlu yükselen arpej
    notes: [[523.25, 0.00], [659.25, 0.18], [783.99, 0.36], [1046.50, 0.56], [783.99, 0.95]] },
  { key: 'muzik1', name: 'hangel Jenerik — Yumuşak (sözsüz)',
    chord: [349.23, 440.00, 523.25], // F majör — nazik iniş
    notes: [[698.46, 0.00], [523.25, 0.22], [440.00, 0.44], [698.46, 0.70]] },
  { key: 'muzik2', name: 'hangel Jenerik — Aydınlık (sözsüz)',
    chord: [392.00, 493.88, 587.33], // G majör — parlak koşu
    notes: [[587.33, 0.00], [659.25, 0.13], [783.99, 0.26], [987.77, 0.42], [783.99, 0.58]] },
];

function render(v) {
  const total = Math.floor(SR * 4.6);
  let buf = new Float32Array(total);
  pad(buf, [v.chord[0] / 2, ...v.chord], 0, 3.4, 0.15); // +sub-oktav kök → sıcak gövde
  for (const [f, t] of v.notes) bell(buf, f, t, 2.0, 0.5);
  buf = reverb(buf, 0.33);            // biraz daha mekân
  return normalize(buf, 0.86);        // yumuşak master (daha az sert)
}

async function main() {
  const updates = { muzik: [] };
  for (const v of VARIANTS) {
    const wav = toWav(render(v));
    fs.writeFileSync(`/tmp/${v.key}.wav`, wav); // yerel kopya (doğrulama)
    const path = `jingles/${v.key}.wav`;
    const file = bucket.file(path);
    await file.save(wav, { contentType: 'audio/wav', metadata: { cacheControl: 'public,max-age=31536000' } });
    await file.makePublic();
    const url = `https://storage.googleapis.com/${BUCKET}/${path}`;
    updates.muzik[Number(v.key.replace('muzik', ''))] = { url, name: `${v.name}.wav` };
    console.log(`✅ ${v.key} → ${(wav.length / 1024).toFixed(0)}KB → ${url}`);
  }
  await db.collection('siteSettings').doc('jingles').set(updates, { merge: true });
  console.log('\n🧡 siteSettings/jingles güncellendi — sözsüz jingleler sayfada çalar.');
  process.exit(0);
}
main().catch((e) => { console.error('❌', e.message); process.exit(1); });
