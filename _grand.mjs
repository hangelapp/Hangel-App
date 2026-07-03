import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { execSync } from 'child_process';
initializeApp({ credential: cert(JSON.parse(readFileSync('.hangelorg-service-account.json','utf8'))) });
const db=getFirestore();
const busy=()=>Number(execSync(`ps aux|grep -E "[_]gopull|[t]sx ./_crawler"|wc -l`).toString().trim());
while(busy()>0){ await new Promise(r=>setTimeout(r,20000)); }
await new Promise(r=>setTimeout(r,5000));
const total=(await db.collection('products').count().get()).data().count;
// yeni kaynaklı (bizim çektiğimiz) ürünler
let ours=0; for(const s of ['crawl','generic','shopify']){ ours+=(await db.collection('products').where('source','==',s).count().get()).data().count; }
// gelirortaklari (yeni brandId'li)
for(const [n,k] of [['Teknosa','go-631'],['MediaMarkt','go-716'],['Bella Maison','go-48']]){ const c=(await db.collection('products').where('brandId','==',k).count().get()).data().count; console.log(`  ${n}(${k})=${c}`);}
for(const [n,k] of [['İdefix','ao-2846'],['D&R','ra-2541'],['Hotiç','ra-60315'],['Taç','ra-56601']]){ const c=(await db.collection('products').where('brandId','==',k).count().get()).data().count; console.log(`  ${n}(${k})=${c}`);}
console.log(`\nGENEL: toplam ürün=${total} · bizim crawl/generic/shopify=${ours}`);
process.exit(0);
