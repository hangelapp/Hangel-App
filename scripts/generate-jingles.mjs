/**
 * generate-jingles.mjs — hangel seslerini Google Cloud TTS ile ÜRETİR + Storage'a
 * yükler + siteSettings/jingles'a yazar (jingle yönetim sayfası bunları gösterir).
 *
 * ÖN KOŞUL: Cloud Text-to-Speech API açık olmalı:
 *   https://console.developers.google.com/apis/api/texttospeech.googleapis.com/overview?project=1082171206975
 *
 * Çalıştır:  node scripts/generate-jingles.mjs
 *
 * NOT: Bunlar PROFESYONEL KONUŞMA sesidir (çağrı merkezi anonsu + marka idents).
 * "Şarkı söyleyen çocuk korosu" bir MÜZİK modeli (Suno vb.) ister — TTS sentezleyemez.
 */
import { GoogleAuth } from 'google-auth-library';
import admin from 'firebase-admin';
import fs from 'fs';

const PROJECT_ID = 'hangel-new-v18-87297865-9bcc3';
const BUCKET = 'hangel-new-v18-87297865-9bcc3.firebasestorage.app';
const sa = JSON.parse(fs.readFileSync('./.firebase-service-account.json', 'utf8'));

admin.initializeApp({ credential: admin.credential.cert(sa), projectId: PROJECT_ID, storageBucket: BUCKET });
const db = admin.firestore();
const bucket = admin.storage().bucket();

const auth = new GoogleAuth({ credentials: sa, scopes: ['https://www.googleapis.com/auth/cloud-platform'] });

// jingle0/1/2 = SÖZSÜZ MÜZİK (generate-music-jingle.mjs ile üretildi) — DOKUNMA.
// Bu script yalnız konuşma anonsu (callCenter) + jingle3/4 sözlü ident üretir.
// Metinler hangel kurumsal söylemiyle: "umudu birlikte büyütüyoruz", "yalnız
// başına mücadele etmek yok", "toplumsal sorunlar için birlikte çalışıyoruz".
const ITEMS = [
  { key: 'callCenter', name: 'Çağrı Merkezi Karşılaması',
    voice: 'tr-TR-Wavenet-E', rate: 0.96, pitch: 1.0,
    ssml: `<speak>hangel'e hoş geldiniz.<break time="350ms"/> Burada hiçbir sorunla yalnız başına mücadele etmezsiniz;<break time="250ms"/> toplumsal sorunlar için birlikte çalışıyoruz.<break time="350ms"/> Çağrınız bizim için çok değerli, lütfen hatta kalın.</speak>` },
  { key: 'jingle3', name: 'Jenerik — Umudu Büyütüyoruz (sözlü)',
    voice: 'tr-TR-Wavenet-E', rate: 1.0, pitch: 1.5,
    ssml: `<speak>Umudu birlikte büyütüyoruz.<break time="250ms"/> <emphasis level="moderate">hangel.</emphasis></speak>` },
  { key: 'jingle4', name: 'Jenerik — Yalnız Değilsin (sözlü)',
    voice: 'tr-TR-Wavenet-D', rate: 1.0, pitch: 1.0,
    ssml: `<speak>Yalnız başına mücadele etmek yok;<break time="200ms"/> toplumsal sorunlar için birlikte çalışıyoruz.<break time="250ms"/> <emphasis level="moderate">hangel.</emphasis></speak>` },
];

async function synth(token, item) {
  const res = await fetch('https://texttospeech.googleapis.com/v1/text:synthesize', {
    method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      input: { ssml: item.ssml },
      voice: { languageCode: 'tr-TR', name: item.voice },
      audioConfig: { audioEncoding: 'MP3', speakingRate: item.rate, pitch: item.pitch },
    }),
  });
  const j = await res.json();
  if (!j.audioContent) throw new Error(j.error?.message || 'audioContent yok');
  return Buffer.from(j.audioContent, 'base64');
}

async function main() {
  const client = await auth.getClient();
  const { token } = await client.getAccessToken();
  const result = { jingles: [] };
  for (const item of ITEMS) {
    const mp3 = await synth(token, item);
    const path = `jingles/${item.key}.mp3`;
    const file = bucket.file(path);
    await file.save(mp3, { contentType: 'audio/mpeg', metadata: { cacheControl: 'public,max-age=31536000' } });
    await file.makePublic();
    const url = `https://storage.googleapis.com/${BUCKET}/${path}`;
    const entry = { url, name: `${item.name}.mp3` };
    if (item.key === 'callCenter') result.callCenter = entry;
    else result.jingles[Number(item.key.replace('jingle', ''))] = entry;
    console.log(`✅ ${item.key} → ${mp3.length} bytes → ${url}`);
  }
  await db.collection('siteSettings').doc('jingles').set(result, { merge: true });
  console.log('\n🧡 siteSettings/jingles güncellendi. Jingle sayfasında görünür + çalar.');
  process.exit(0);
}
main().catch((e) => { console.error('❌', e.message); process.exit(1); });
