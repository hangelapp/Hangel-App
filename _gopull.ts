import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { listGelirOrtaklariFeeds } from './src/lib/feed/registry';
import { ingestProducts } from './src/lib/feed/registry';
import { extractProductBrand, normKey } from './src/lib/market/brand-extract';
import { searchTokensFor } from './src/lib/feed/search';
if(!getApps().length) initializeApp({ credential: cert(JSON.parse(readFileSync('.hangelorg-service-account.json','utf8'))) });
const db=getFirestore();
function strip(o:any):any{ if(Array.isArray(o))return o.map(strip); if(o&&typeof o==='object'){const r:any={};for(const[k,v]of Object.entries(o))if(v!==undefined)r[k]=strip(v);return r;} return o; }
(async()=>{
  const feeds=await listGelirOrtaklariFeeds();
  console.log('=== gelirortaklari canlı feed ('+feeds.length+') ===');
  for(const f of feeds){
    const brandId=`go-${f.feedId}`;
    const dr=await db.collection('brands').doc(brandId).get().then(d=>Number(d.data()?.donationRate)||3).catch(()=>3);
    let prods:any[]=[];
    try{ prods=await ingestProducts({kind:'gelirortaklari',feedId:f.feedId,offerId:f.offerId,name:f.name,brandId,donationRate:dr,limit:20000}); }
    catch(e){ console.log(`  ${f.name}: HATA ${e instanceof Error?e.message:e}`); continue; }
    if(!prods.length){ console.log(`  ${f.name} (go-${f.feedId}): 0 → atla`); continue; }
    let del=0; while(true){ const s=await db.collection('products').where('source','==','gelirortaklari').where('feedId','==',f.feedId).limit(450).get(); if(s.empty)break; const b=db.batch(); s.docs.forEach(d=>b.delete(d.ref)); await b.commit(); del+=s.size; }
    let wr=0; for(let i=0;i<prods.length;i+=450){ const b=db.batch(); for(const p of prods.slice(i,i+450)){ const pb=(p.productBrand||'').trim()||extractProductBrand(p.title||'',p.brandName||''); b.set(db.collection('products').doc(p.id),strip({...p,brandId,productBrand:pb,productBrandKey:pb?normKey(pb):null,searchTokens:searchTokensFor(p)}),{merge:true}); } await b.commit(); wr+=Math.min(450,prods.length-i); }
    console.log(`  ✅ ${f.name} (go-${f.feedId}): eski-sil=${del} yaz=${wr}`);
  }
  console.log('=== BİTTİ ===');
  process.exit(0);
})();
