const admin = require('firebase-admin');
admin.initializeApp({ credential: admin.credential.cert(require('./.firebase-service-account.json')) });
const db = admin.firestore();
const sleep = ms => new Promise(r=>setTimeout(r,ms));
const PATH = 'campaigns/XhNs1wOX0q2EDSRtdFSQ';
(async () => {
  for (let i=1;i<=6;i++){
    await sleep(60000);
    const recs = await db.collection(PATH+'/recipients').get();
    const r = recs.docs[0] ? recs.docs[0].data() : {};
    const f = t => t && t.toDate ? t.toDate().toLocaleString('tr-TR') : '—';
    console.log(`dk${i} → status:${r.status} | İletildi:${f(r.deliveredAt)} | Okundu:${f(r.openedAt)} | Tıkladı:${f(r.clickedAt)} | link:${r.clickedLink||'—'}`);
    if (r.deliveredAt) { console.log('>>> İLETİLDİ DOLDU — webhook çalışıyor ✓'); break; }
  }
})().catch(e=>console.log('ERR',e.message));
