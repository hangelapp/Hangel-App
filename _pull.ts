import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { ingestProducts } from './src/lib/feed/registry';
import { extractProductBrand, normKey } from './src/lib/market/brand-extract';
import { searchTokensFor } from './src/lib/feed/search';
import { KNOWN_STORE_FEEDS } from './src/lib/feed/known-feeds';

initializeApp({ credential: cert(JSON.parse(readFileSync('.hangelorg-service-account.json','utf8'))) });
const db = getFirestore();
const AG: Record<string,string> = { ao:'affocean', ra:'reklamaction', go:'gelirortaklari' };
function strip(o:any):any{ if(Array.isArray(o))return o.map(strip); if(o&&typeof o==='object'){const r:any={};for(const[k,v]of Object.entries(o))if(v!==undefined)r[k]=strip(v);return r;} return o; }

async function pullStore(f: typeof KNOWN_STORE_FEEDS[number]){
  const fresh = await ingestProducts({ kind:f.kind, feedUrl:f.feedUrl, brandName:f.name, brandId:f.brandId, donationRate:f.donationRate, source:f.kind, limit:20000 });
  if(fresh.length===0){ console.log(`  ${f.name}: taze 0 → ATLA (eski silinmez)`); return; }
  // eski kayıtları sil (source=agency + feedId)
  const [pref, feedId] = [f.brandId.split('-')[0], f.brandId.split('-')[1]];
  const oldSource = AG[pref];
  let del=0;
  while(true){ const snap=await db.collection('products').where('source','==',oldSource).where('feedId','==',feedId).limit(450).get(); if(snap.empty)break; const b=db.batch(); snap.docs.forEach(d=>b.delete(d.ref)); await b.commit(); del+=snap.size; }
  // taze yaz (route ile birebir enrichment)
  let wr=0;
  for(let i=0;i<fresh.length;i+=450){ const b=db.batch();
    for(const p of fresh.slice(i,i+450)){ const pb=extractProductBrand(p.title||'',p.brandName||''); const doc={...p,productBrand:pb,productBrandKey:pb?normKey(pb):null,searchTokens:searchTokensFor(p as any)}; b.set(db.collection('products').doc(p.id), strip(doc), {merge:true}); }
    await b.commit(); wr+=Math.min(450,fresh.length-i);
  }
  console.log(`  ✅ ${f.name}: eski silindi=${del}  taze yazıldı=${wr}`);
}

(async()=>{
  const only = KNOWN_STORE_FEEDS.filter(f=>f.name==='Slazenger');
  for(const f of only) await pullStore(f);
  // doğrula
  const c = await db.collection('products').where('brandId','==','ra-61650').count().get();
  const old = await db.collection('products').where('source','==','reklamaction').where('feedId','==','61650').count().get();
  console.log(`DOĞRULAMA Slazenger: yeni(brandId=ra-61650)=${c.data().count}  eski kalan=${old.data().count}`);
  process.exit(0);
})();
