import admin from 'firebase-admin';import {readFileSync} from 'fs';
admin.initializeApp({credential:admin.credential.cert(JSON.parse(readFileSync('./.firebase-service-account.json','utf8')))});
const db=admin.firestore();
// Türkçe-fold (diakritik + büyük/küçük duyarsız) — kullanıcı "ı/i" vb. yazmasa da eşleşsin.
const fold=s=>(s||'').toLocaleLowerCase('tr').replace(/i̇/g,'i').replace(/ı/g,'i').replace(/ğ/g,'g').replace(/ü/g,'u').replace(/ş/g,'s').replace(/ö/g,'o').replace(/ç/g,'c').replace(/â/g,'a').replace(/î/g,'i').replace(/û/g,'u');
function prefixes(text){
  const words=fold(text).replace(/[^a-z0-9\s]/g,' ').split(/\s+/).filter(Boolean);
  const set=new Set();
  for(const w of words){
    if(w.length<3){ set.add(w); continue; }
    for(let i=3;i<=Math.min(w.length,14);i++) set.add(w.slice(0,i));
  }
  return [...set].slice(0,90);
}
async function run(col,nameF,shortF){
  const snap=await db.collection(col).get();
  let n=0,w=0;const bw=db.bulkWriter();bw.onWriteError(e=>e.failedAttempts<15);
  snap.forEach(d=>{const x=d.data();n++;
    const pre=prefixes((x[nameF]||'')+' '+(x[shortF]||''));
    if(pre.length){bw.update(d.ref,{searchPrefixes:pre}).catch(()=>{});w++;}
  });
  await bw.close().catch(()=>{});
  console.log(`${col}: ${n} kayıt, ${w} searchPrefixes yazıldı`);
}
await run('registryDernekler','name','kisaAd');
await run('registryVakiflar','name','kisaAd');
await run('outreachContacts','name','shortName');
console.log('BİTTİ');
process.exit(0);
