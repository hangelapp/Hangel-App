/**
 * Eski sertifikalara doğrulama kodu (H…) + yapısal alanları geriye dönük işler.
 *
 * Yeni sistem (api/events/[id]/complete) sertifikalara `code` + certCountry/certYear/
 * certActivityNo/certPersonNo yazıyor. Bu script, `code`'u OLMAYAN eski ETKİNLİK
 * sertifikalarına AYNI sıralı mantıkla kod üretir; böylece /c/{kod} doğrulaması
 * onlar için de DB'den eşleşir. complete route ile AYNI sayaçları (counters/
 * cert-act-event-{yıl}) kullanır → yeni sertifikalarla çakışmaz.
 *
 * Çalıştırma (ADC ile):
 *   gcloud auth application-default login
 *   node scripts/backfill-certificate-codes.mjs --dry     # önizleme (yazmaz)
 *   node scripts/backfill-certificate-codes.mjs           # uygular
 *
 * Yalnızca type==='event' + eventId olan, `code`'u olmayan sertifikaları işler.
 * (Gönüllülük başvurularından gelen sertifikalar `certificates` koleksiyonunda
 *  değil; onlar için ayrı sertifika-verme akışı gerekir.)
 */
import admin from 'firebase-admin';

const DRY = process.argv.includes('--dry');
const PROJECT_ID = 'hangel-new-v18-87297865-9bcc3';

admin.initializeApp({ credential: admin.credential.applicationDefault(), projectId: PROJECT_ID });
const db = admin.firestore();

const KIND_TO_CODE = { volunteer: '1', event: '2', blood: '3', ngo: '4', brand: '5', club: '6' };

function luhnCheckDigit(numStr) {
  let sum = 0, dbl = true;
  for (let i = numStr.length - 1; i >= 0; i--) {
    let d = numStr.charCodeAt(i) - 48;
    if (d < 0 || d > 9) continue;
    if (dbl) { d *= 2; if (d > 9) d -= 9; }
    sum += d; dbl = !dbl;
  }
  return (10 - (sum % 10)) % 10;
}
function buildCertCode({ country = '90', kind = 'event', year, activityNo, personNo }) {
  const cc = String(country).replace(/\D/g, '') || '90';
  const ty = KIND_TO_CODE[kind] || '2';
  const yy = String(((year % 100) + 100) % 100).padStart(2, '0');
  const act = String(Math.floor(activityNo));
  const pn = String(Math.floor(personNo)).padStart(3, '0');
  const payload = `${cc}${ty}${yy}${act}${pn}`;
  return `H${payload}${luhnCheckDigit(payload)}`;
}
async function nextSeq(name, start) {
  const ref = db.collection('counters').doc(name);
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const cur = snap.exists ? ((snap.data().next) ?? start) : start;
    tx.set(ref, { next: cur + 1 }, { merge: true });
    return cur;
  });
}
function yearOf(...candidates) {
  for (const c of candidates) {
    if (!c) continue;
    let d;
    if (typeof c === 'string') d = new Date(c);
    else if (typeof c === 'object' && typeof c.seconds === 'number') d = new Date(c.seconds * 1000);
    else if (c && typeof c.toDate === 'function') { try { d = c.toDate(); } catch { d = null; } }
    if (d && !Number.isNaN(d.getTime())) return d.getFullYear();
  }
  return new Date().getFullYear();
}

async function run() {
  console.log(`[backfill-cert-codes] dry=${DRY} project=${PROJECT_ID}`);
  const snap = await db.collection('certificates').get();
  console.log(`[backfill-cert-codes] toplam sertifika: ${snap.size}`);

  // code'u olmayan etkinlik sertifikalarını eventId'ye göre grupla.
  const groups = {};
  let skipNoCode = 0;
  for (const doc of snap.docs) {
    const d = doc.data();
    if (d.code) { skipNoCode++; continue; }
    const type = d.type || (doc.id.startsWith('evt-') ? 'event' : '');
    if (type !== 'event' || !d.eventId) continue;
    (groups[d.eventId] ||= []).push({ id: doc.id, data: d });
  }
  const eventIds = Object.keys(groups);
  const pending = eventIds.reduce((n, e) => n + groups[e].length, 0);
  console.log(`[backfill-cert-codes] kodu zaten var: ${skipNoCode} · kodlanacak etkinlik: ${eventIds.length} · sertifika: ${pending}`);

  if (DRY) {
    for (const eid of eventIds.slice(0, 10)) console.log(`  - ${eid}: ${groups[eid].length} sertifika`);
    console.log('[backfill-cert-codes] DRY — yazılmadı.');
    return;
  }

  let written = 0;
  for (const eventId of eventIds) {
    const certs = groups[eventId];
    const evRef = db.collection('events').doc(eventId);
    const evSnap = await evRef.get();
    const ev = evSnap.exists ? evSnap.data() : {};
    const year = yearOf(ev.startDate, certs[0].data.date, certs[0].data.completedAt);

    let activityNo = ev.certActivityNo;
    if (!(activityNo >= 1)) {
      activityNo = await nextSeq(`cert-act-event-${year}`, 1);
      if (evSnap.exists) await evRef.update({ certActivityNo: activityNo }).catch(() => {});
    }
    let personSeq = ev.certPersonSeq ?? 0;

    certs.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
    for (const c of certs) {
      personSeq += 1;
      const code = buildCertCode({ kind: 'event', country: '90', year, activityNo, personNo: personSeq });
      const patch = { code, certCountry: '90', certYear: year, certActivityNo: activityNo, certPersonNo: personSeq };
      await db.collection('certificates').doc(c.id).set(patch, { merge: true });
      if (c.data.userId) {
        await db.collection('users').doc(c.data.userId).collection('certificates').doc(c.id).set(patch, { merge: true }).catch(() => {});
      }
      written++;
    }
    if (evSnap.exists) await evRef.update({ certPersonSeq: personSeq }).catch(() => {});
    console.log(`  ✓ ${eventId} (yıl ${year}, faaliyet ${activityNo}): ${certs.length} sertifika kodlandı`);
  }
  console.log(`[backfill-cert-codes] BİTTİ — ${written} sertifikaya kod yazıldı.`);
}

run().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
