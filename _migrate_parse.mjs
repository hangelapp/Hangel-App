import admin from 'firebase-admin';import {readFileSync} from 'fs';
admin.initializeApp({credential:admin.credential.cert(JSON.parse(readFileSync('./.firebase-service-account.json','utf8')))});
const db=admin.firestore();const has=v=>!!(v&&v.toString().trim());
// route.ts ile BİREBİR AYNI parseAddress
function parseAddress(addr){if(!addr)return{};const a=addr.toUpperCase().replace(/İ/g,'I');const out={};
  const m=addr.match(/\b([A-ZÇĞİÖŞÜ][\wÇĞİÖŞÜçğıöşü.\-]+?)\s+MAH(ALLESİ|\.|ALLE)/i);if(m)out.neighborhood=m[1].trim().replace(/\.$/,'');
  const parts=addr.split('/').map(s=>s.trim()).filter(Boolean).filter(p=>!/^t[uü]rk[iİ]ye$/i.test(p));
  if(parts.length>=2){out.city=parts[parts.length-1].split(/\s+/).pop();const b=parts[parts.length-2];if(b)out.district=b.split(/\s+/).pop();}
  if(!out.city){const cities=['ANKARA','İSTANBUL','IZMIR','BURSA','ANTALYA','ADANA','KONYA','GAZIANTEP','MERSIN','KAYSERI','DIYARBAKIR','SAMSUN','ESKISEHIR','TRABZON','SAKARYA','MALATYA','VAN','ERZURUM','HATAY','MANISA'];const f=cities.find(c=>a.includes(c));if(f)out.city=f;}
  return out;}
// Türkçe başlık-büyük (KADIKÖY → Kadıköy)
const titleTr=s=>(s||'').toLocaleLowerCase('tr').replace(/(^|[\s.\-])([a-zçğıöşü0-9])/g,(m,p,c)=>p+c.toLocaleUpperCase('tr'));

async function migrate(col,fIl,fIlce,fMah,fAdr){
  const snap=await db.collection(col).get();
  let n=0,bIl=0,bIlce=0,bMah=0,fillIlce=0,fillMah=0,fillIl=0,noAddr=0;
  const bw=db.bulkWriter();bw.onWriteError(e=>e.failedAttempts<15);
  snap.forEach(d=>{const x=d.data();n++;
    const adr=x[fAdr];if(!has(adr))noAddr++;
    if(has(x[fIl]))bIl++;if(has(x[fIlce]))bIlce++;if(has(x[fMah]))bMah++;
    if(!has(adr))return;const p=parseAddress(adr);const u={};
    if(!has(x[fIl])&&p.city){u[fIl]=titleTr(p.city);fillIl++;}
    if(!has(x[fIlce])&&p.district){u[fIlce]=titleTr(p.district);fillIlce++;}
    if(!has(x[fMah])&&p.neighborhood){u[fMah]=titleTr(p.neighborhood);fillMah++;}
    if(Object.keys(u).length){u.addressParsed='2026-06-26';bw.update(d.ref,u).catch(()=>{});}
  });
  await bw.close().catch(()=>{});
  const pc=x=>Math.round(x/n*100);
  console.log(`\n=== ${col} (${n}) | adressiz: ${noAddr} ===`);
  console.log(`  İl    : ${bIl}(%${pc(bIl)}) → ${bIl+fillIl}(%${pc(bIl+fillIl)})  [+${fillIl}]`);
  console.log(`  İlçe  : ${bIlce}(%${pc(bIlce)}) → ${bIlce+fillIlce}(%${pc(bIlce+fillIlce)})  [+${fillIlce}]`);
  console.log(`  Mahalle: ${bMah}(%${pc(bMah)}) → ${bMah+fillMah}(%${pc(bMah+fillMah)})  [+${fillMah}]`);
}
await migrate('registryDernekler','il','ilce','mahalle','adres');
await migrate('registryVakiflar','il','ilce','mahalle','adres');
await migrate('outreachContacts','city','district','mahalle','address');
console.log('\nBİTTİ');
process.exit(0);
