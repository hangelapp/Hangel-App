/**
 * generate-jingles.mjs — hangel KONUŞMA seslerini Google Cloud TTS ile üretir.
 *   • santral[0..4] = Çağrı Merkezi anonsları — umut veren/heyecanlandıran, Chirp3-HD
 *     (Google'ın en doğal nesli; SSML DEĞİL düz metin + speakingRate, pitch yok).
 *   • cocuk[0..4]   = Çocuk anonsları — Wavenet + yüksek pitch (çocuksu tını) +
 *     bilerek "dili dönmeyen" yazım (r→y vb.) ile sevimli telaffuz.
 * muzik[] (sözsüz) generate-music-jingle.mjs'de üretilir — buraya dokunmaz.
 *
 * ÖN KOŞUL: Cloud Text-to-Speech API açık. Çalıştır: node scripts/generate-jingles.mjs
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

// Tek IVR metni — kullanıcının son hâli (4 birim), AYNEN. ("hangel" küçük harf; sesli fark yok.)
const IVR_TEXT = `Merhaba, hangel'e hoş geldiniz. Sosyal sorunlarla kolektif bilinç ve iş birliğiyle mücadele etme yolculuğumuzda yanımızda olduğunuz, katkılarınız ve desteğiniz için teşekkür ederiz. Kullanıcı Destek Birimi için 1'i, Sivil Toplum Kuruluşları Destek Birimi için 2'yi, Marka İş Birlikleri Birimi için 3'ü, Kurumsal İş Birlikleri Birimi için 4'ü tuşlayınız. Kişisel Verilerin Korunması Politikamız ve diğer yasal bilgilendirmeler hakkında bilgi almak için web sitemizi ziyaret edebilirsiniz. Lütfen bekleyiniz, sizi en kısa sürede ilgili temsilcimize aktarıyoruz. hangel'i aradığınız için teşekkür ederiz.`;

// "Jazz/soul yıldızı" vibe — GERÇEK ünlü (Şakira/Kanye) klonlanamaz/yasaktır; TTS şarkı
// söyleyemez. En karakterli/sıcak Chirp3-HD sesler + yavaş smooth tempo (rahat "lounge").
const SANTRAL = [
  { voice: 'tr-TR-Chirp3-HD-Enceladus', rate: 0.90, text: IVR_TEXT },   // erkek, breathy "crooner"
  { voice: 'tr-TR-Chirp3-HD-Charon', rate: 0.91, text: IVR_TEXT },      // erkek, dolgun
  { voice: 'tr-TR-Chirp3-HD-Gacrux', rate: 0.92, text: IVR_TEXT },      // kadın, olgun/soul
  { voice: 'tr-TR-Chirp3-HD-Sulafat', rate: 0.92, text: IVR_TEXT },     // kadın, sıcak
  { voice: 'tr-TR-Chirp3-HD-Rasalgethi', rate: 0.91, text: IVR_TEXT },  // erkek, derin
];

// "Çocuk" slotları = doğal genç Chirp3 (sahte değil). Gerçek çocuk için kayıt/ElevenLabs.
const COCUK = [
  { voice: 'tr-TR-Chirp3-HD-Leda', rate: 1.0, text: IVR_TEXT },         // genç, doğal
  { voice: 'tr-TR-Chirp3-HD-Aoede', rate: 1.0, text: IVR_TEXT },        // genç, ferah
  { voice: 'tr-TR-Chirp3-HD-Callirrhoe', rate: 1.0, text: IVR_TEXT },   // genç, rahat
  { voice: 'tr-TR-Chirp3-HD-Zephyr', rate: 1.02, text: IVR_TEXT },      // parlak
  { voice: 'tr-TR-Chirp3-HD-Laomedeia', rate: 1.0, text: IVR_TEXT },    // ferah
];

async function synth(token, item) {
  const audioConfig = { audioEncoding: 'MP3', speakingRate: item.rate };
  if (typeof item.pitch === 'number') audioConfig.pitch = item.pitch; // yalnız Wavenet (çocuk); Chirp3-HD pitch desteklemez
  const res = await fetch('https://texttospeech.googleapis.com/v1/text:synthesize', {
    method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ input: { text: item.text }, voice: { languageCode: 'tr-TR', name: item.voice }, audioConfig }),
  });
  const j = await res.json();
  if (!j.audioContent) throw new Error(j.error?.message || 'audioContent yok');
  return Buffer.from(j.audioContent, 'base64');
}

async function renderList(token, list, prefix, displayName) {
  const out = [];
  for (let i = 0; i < list.length; i++) {
    const mp3 = await synth(token, list[i]);
    const path = `jingles/${prefix}${i}.mp3`;
    const file = bucket.file(path);
    await file.save(mp3, { contentType: 'audio/mpeg', metadata: { cacheControl: 'public,max-age=31536000' } });
    await file.makePublic();
    out[i] = { url: `https://storage.googleapis.com/${BUCKET}/${path}`, name: `${displayName} ${i + 1}.mp3` };
    console.log(`✅ ${prefix}${i} → ${mp3.length} bytes`);
  }
  return out;
}

async function main() {
  const { token } = await (await auth.getClient()).getAccessToken();
  const santral = await renderList(token, SANTRAL, 'santral', 'Çağrı Anonsu');
  const cocuk = await renderList(token, COCUK, 'cocuk', 'Çocuk Anonsu');
  await db.collection('siteSettings').doc('jingles').set({ santral, cocuk }, { merge: true });
  console.log('\n🧡 siteSettings/jingles güncellendi — santral(5) + çocuk(5) sayfada çalar.');
  process.exit(0);
}
main().catch((e) => { console.error('❌', e.message); process.exit(1); });
