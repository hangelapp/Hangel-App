/**
 * Backfill: gönüllülük ilanlarında bozuk organizatör bilgisini düzelt.
 *
 * Eski create form `?id` taşımadığında ngoId'yi admin user uid'sine düşürüyor ve
 * organization'ı 'Kuruluş' placeholder'ı yazıyordu (#8). Bu script her bozuk
 * ilan için: createdBy (admin uid) → users/{uid}.managedNgoId → gerçek NGO →
 * ngoId + organization (NGO adı) + organizerLogoUrl (NGO avatar/logo) düzeltir.
 *
 * Idempotent. Çalıştırma:
 *   node scripts/backfill-volunteer-org.mjs --dry   (aday listesi, yazmaz)
 *   node scripts/backfill-volunteer-org.mjs         (uygular)
 */
import admin from 'firebase-admin';
import { readFileSync } from 'fs';

const DRY = process.argv.includes('--dry');
const PROJECT_ID = 'hangel-new-v18-87297865-9bcc3';
const sa = JSON.parse(readFileSync(new URL('../.firebase-service-account.json', import.meta.url), 'utf8'));

admin.initializeApp({ credential: admin.credential.cert(sa), projectId: PROJECT_ID });
const db = admin.firestore();

const userCache = new Map();
const ngoCache = new Map();

async function getUser(uid) {
  if (userCache.has(uid)) return userCache.get(uid);
  const s = await db.collection('users').doc(uid).get();
  const d = s.exists ? s.data() : null;
  userCache.set(uid, d);
  return d;
}
async function getNgo(id) {
  if (ngoCache.has(id)) return ngoCache.get(id);
  const s = await db.collection('ngos').doc(id).get();
  const d = s.exists ? s.data() : null;
  ngoCache.set(id, d);
  return d;
}

async function run() {
  console.log(`[backfill-volunteer-org] dry=${DRY} project=${PROJECT_ID}`);
  const snap = await db.collection('volunteering').get();
  console.log(`toplam ilan: ${snap.size}`);

  let fixed = 0, skipped = 0, ok = 0;
  for (const doc of snap.docs) {
    const v = doc.data();
    const org = (v.organization || '').trim();
    const broken = !org || org === 'Kuruluş' || !v.organizerLogoUrl;
    if (!broken) { ok++; continue; }

    // admin uid: önce createdBy, yoksa ngoId (eski hatalı kayıt ngoId=uid).
    const adminUid = v.createdBy || v.ngoId;
    if (!adminUid) { console.log(`  SKIP ${doc.id}: createdBy/ngoId yok`); skipped++; continue; }

    const user = await getUser(adminUid);
    const realNgoId = user?.managedNgoId;
    if (!realNgoId) {
      // Belki ngoId zaten gerçek NGO'dur (sadece organization placeholder kalmış).
      const maybeNgo = await getNgo(v.ngoId);
      if (maybeNgo?.name) {
        const upd = { organization: maybeNgo.name, organizerLogoUrl: maybeNgo.avatarUrl || maybeNgo.logoUrl || v.organizerLogoUrl || '' };
        console.log(`  FIX ${doc.id}: org→"${maybeNgo.name}" (ngoId zaten gerçek)`);
        if (!DRY) await doc.ref.update(upd);
        fixed++;
        continue;
      }
      console.log(`  SKIP ${doc.id}: adminUid=${adminUid} managedNgoId yok, ngoId=${v.ngoId} NGO değil`);
      skipped++;
      continue;
    }
    const ngo = await getNgo(realNgoId);
    if (!ngo?.name) { console.log(`  SKIP ${doc.id}: ngos/${realNgoId} yok/adı yok`); skipped++; continue; }

    const upd = {
      ngoId: realNgoId,
      organization: ngo.name,
      organizerLogoUrl: ngo.avatarUrl || ngo.logoUrl || v.organizerLogoUrl || '',
    };
    console.log(`  FIX ${doc.id}: ngoId ${v.ngoId}→${realNgoId}, org "${org}"→"${ngo.name}"`);
    if (!DRY) await doc.ref.update(upd);
    fixed++;
  }
  console.log(`\nSonuç: düzeltilen=${fixed} atlanan=${skipped} zaten-ok=${ok}${DRY ? ' (DRY — yazılmadı)' : ''}`);
}
run().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
