// Scrape ürünlerine marka→kategori atar (category boştu → kategori şeridine girmiyorlardı).
const admin = require('firebase-admin');
const fs = require('fs');
const sa = JSON.parse(fs.readFileSync('/Users/apple/new-app/.firebase-service-account.json', 'utf8'));
admin.initializeApp({ credential: admin.credential.cert(sa), projectId: sa.project_id });
const db = admin.firestore();

const MAP = {
  // Ayakkabı & Çanta
  'FLO': 'Ayakkabı', 'Hotiç': 'Ayakkabı', 'Divarese': 'Ayakkabı', 'Ayakkabidunyasi.com': 'Ayakkabı',
  'Sportive.com.tr': 'Ayakkabı', 'SuperStep': 'Ayakkabı', 'Houseofsuperstep': 'Ayakkabı', 'North Sails': 'Ayakkabı',
  // Giyim
  'Koton': 'Giyim', 'Kayra': 'Giyim', 'Mizalle': 'Giyim', 'Yargıcı': 'Giyim', 'Network': 'Giyim',
  'Gant': 'Giyim', 'Forever21': 'Giyim', 'GAP': 'Giyim', 'Marks & Spencer': 'Giyim', 'Mango': 'Giyim',
  'DAGİ': 'Giyim', 'JeansLab': 'Giyim', 'Hatemoğlu': 'Giyim', 'Kip': 'Giyim', 'Fitmoda': 'Giyim',
  'Nautica': 'Giyim', 'Jacadi': 'Giyim',
  // Spor & Outdoor
  'PUMA': 'Spor', 'Intersport': 'Spor', 'Sporthink': 'Spor', 'Sporpark': 'Spor', 'Slazenger': 'Spor', 'Columbia': 'Spor',
  // Ev & Yaşam
  'Koçtaş': 'Ev & Yaşam', 'Madame Coco': 'Ev & Yaşam', 'Linens': 'Ev & Yaşam', 'Kütahya Porselen': 'Ev & Yaşam',
  'Taç': 'Ev & Yaşam', 'Özdilekteyim': 'Ev & Yaşam', 'Mudo': 'Ev & Yaşam',
  // Elektronik
  'Casper': 'Elektronik', 'Reeder': 'Elektronik', 'General Mobile': 'Elektronik', 'Arçelik': 'Elektronik',
  'Homend': 'Elektronik', 'Banggood': 'Elektronik',
  // Diğer
  'Toyzz Shop': 'Oyuncak & Bebek', 'Flormar': 'Kozmetik',
  'D&R': 'Kitap & Kırtasiye', 'Tonguç Akademi': 'Kitap & Kırtasiye', 'Tonguç Mağaza': 'Kitap & Kırtasiye',
  'CarrefourSA': 'Market', 'A101': 'Market',
  'Bloom and Fresh': 'Çiçek & Hediye', 'Tazecicek': 'Çiçek & Hediye', 'havhav.com.tr': 'Evcil Hayvan',
};
const cr = async (bt) => { for (let i = 0; i < 5; i++) { try { await bt.commit(); return; } catch (e) { if (i === 4) throw e; await new Promise((r) => setTimeout(r, 2000 * (i + 1))); } } };

(async () => {
  let last = null, tot = 0, upd = 0;
  while (true) {
    let q = db.collection('products').where('source', '==', 'scrape-import').orderBy('__name__').limit(2000);
    if (last) q = q.startAfter(last);
    const snap = await q.get();
    if (snap.empty) break;
    let b = db.batch(), n = 0;
    for (const d of snap.docs) {
      const f = d.data();
      const cat = MAP[f.brandName];
      if (!cat || f.category === cat) continue;
      b.set(d.ref, { category: cat }, { merge: true });
      n++; upd++;
      if (n >= 400) { await cr(b); b = db.batch(); n = 0; }
    }
    if (n > 0) await cr(b);
    tot += snap.size;
    last = snap.docs[snap.docs.length - 1];
    if (tot % 40000 < 2000) console.log('taranan', tot, 'kategori atanan', upd);
  }
  console.log('BİTTİ — taranan', tot, 'kategori atanan', upd);
  process.exit(0);
})().catch((e) => { console.error('FATAL', e.message); process.exit(1); });
