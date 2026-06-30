import admin from 'firebase-admin';import {readFileSync,appendFileSync} from 'fs';
admin.initializeApp({credential:admin.credential.cert(JSON.parse(readFileSync('./.firebase-service-account.json','utf8')))});
const db=admin.firestore();
const IL='Tekirdağ';
const LOG='/tmp/deepscan.log';const log=m=>{appendFileSync(LOG,m+'\n');};
const has=v=>!!(v&&v.toString().trim());
const nk=s=>(s||'').toLocaleLowerCase('tr').trim();
const ILCELER=['Süleymanpaşa','Çorlu','Çerkezköy','Kapaklı','Ergene','Hayrabolu','Malkara','Marmaraereğlisi','Muratlı','Saray','Şarköy'];
const normTr=s=>(s||'').toLocaleLowerCase('tr').replace(/i̇/g,'i');
function parseIlce(addr){const a=normTr(addr);for(const i of ILCELER)if(a.includes(normTr(i)))return i;return '';}
function parseMahalle(addr){if(!addr)return '';const m=addr.match(/([A-Za-zğüşıöçĞÜŞİÖÇ0-9'.\s]{2,40}?)\s*(Mah\.?|Mahallesi|Mh\.?)\b/i);return m?m[1].trim().replace(/[,;]$/,'').replace(/\s+/g,' '):'';}
// e-posta kazıma
const EMAIL=/[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}/gi;
const badMail=/\.(png|jpe?g|gif|svg|webp|css|js|ico)$|example\.|sentry|wixpress|\.wix|@2x|godaddy|cloudflare|yourmail|user@|test@/i;
async function ff(u){try{const c=new AbortController();const t=setTimeout(()=>c.abort(),9000);const r=await fetch(u,{signal:c.signal,redirect:'follow',headers:{'User-Agent':'Mozilla/5.0'}});clearTimeout(t);if(!r.ok)return'';return(await r.text()).slice(0,400000);}catch{return''}}
function exMail(html){const t=html.replace(/<[^>]+>/g,' ');const s=new Set();(t.match(EMAIL)||[]).forEach(m=>{m=m.toLowerCase();if(!badMail.test(m))s.add(m)});(html.match(/mailto:([^"'>\s?]+)/gi)||[]).forEach(m=>{const e=m.replace(/mailto:/i,'').toLowerCase();if(!badMail.test(e))s.add(e)});return [...s].slice(0,3);}
function siteUrls(site){site=(site||'').trim();if(/^[^@\s]+@[^@\s]+\.[a-z]+$/i.test(site))return{email:site.toLowerCase()};let b=site.replace(/^https?:\/\//i,'').replace(/\/.*$/,'');if(!b.includes('.')||/\s/.test(b))return{};return{urls:['https://'+b,'https://'+b+'/iletisim','http://'+b]};}

log(`=== DEEP SCAN ${IL} BAŞLADI ${new Date().toISOString()} ===`);
// 1) registry
const ds=await db.collection('registryDernekler').where('il','==',IL).get();
const der=[];ds.forEach(d=>{const x=d.data();der.push({name:x.name||'',adres:x.adres||'',site:x.webSite||'',faal:x.faaliyetAlani||'',kutuk:x.kutukNo||''});});
const vs=await db.collection('registryVakiflar').where('il','==',IL).get();
const vak=[];vs.forEach(d=>{const x=d.data();vak.push({name:x.name||'',adres:x.adres||'',ilce:x.ilce||'',tel:x.telefon1||x.telefon2||'',mail:x.ePosta||x.eTebligat||''});});
log(`registry: ${der.length} dernek, ${vak.length} vakıf`);
// 2) mevcut toplananlar (places/web) — ada göre tel/web/adres/mail
const prev=new Map();
for(const src of ['places-tekirdag','web-scrape-tekirdag']){const s=await db.collection('outreachContacts').where('source','==',src).get();s.forEach(d=>{const x=d.data();const k=nk(x.name);const o=prev.get(k)||{};if(has(x.phone))o.phone=x.phone;if(has(x.website))o.website=x.website;if(has(x.email))o.email=x.email;if(has(x.placesAddress))o.padres=x.placesAddress;prev.set(k,o);});}
log(`önceki toplanan: ${prev.size} kayıt`);
// 3) e-posta kazınacak siteler (registry site + places website), maili olmayanlar
const toScrape=new Map();
for(const d of der){const k=nk(d.name);const p=prev.get(k)||{};const site=d.site||p.website;if(site&&!(p.email))toScrape.set(k,site);}
log(`e-posta kazınacak site: ${toScrape.size}`);
const scrapedMail=new Map();let sc=0,scF=0;
const ents=[...toScrape.entries()];const POOL=20;let i=0;
async function w(){while(i<ents.length){const [k,site]=ents[i++];const v=siteUrls(site);sc++;
  if(v.email){scrapedMail.set(k,[v.email]);scF++;continue;}
  if(!v.urls)continue;const m=new Set();for(const u of v.urls){const h=await ff(u);if(!h)continue;exMail(h).forEach(x=>m.add(x));if(m.size)break;}
  if(m.size){scrapedMail.set(k,[...m].slice(0,3));scF++;}
  if(sc%200===0)log(`  mail kazıma ${sc}/${ents.length} | bulunan ${scF}`);}}
await Promise.all(Array.from({length:POOL},w));
log(`e-posta kazıma bitti: ${scF} site'de mail bulundu`);
// 4) birleşik tam kayıtlar
const records=[];
for(const d of der){const k=nk(d.name);const p=prev.get(k)||{};const addr=p.padres||d.adres;
  records.push({name:d.name,type:/spor/i.test(d.faal)?'SporKulübü':'Dernek',il:IL,ilce:parseIlce(addr),mahalle:parseMahalle(addr),adres:addr,
    phone:p.phone||null,email:(scrapedMail.get(k)?.[0])||p.email||null,emailAll:scrapedMail.get(k)||(p.email?[p.email]:[]),
    website:d.site||p.website||null,faaliyetAlani:d.faal||null,kutukNo:d.kutuk||null});}
for(const v of vak){const addr=v.adres;
  records.push({name:v.name,type:'Vakıf',il:IL,ilce:v.ilce||parseIlce(addr),mahalle:parseMahalle(addr),adres:addr,
    phone:v.tel||null,email:v.mail||null,emailAll:v.mail?[v.mail]:[],website:null,faaliyetAlani:null,kutukNo:null});}
log(`birleşik kayıt: ${records.length}`);
// 5) eski tekirdağ scrape kayıtlarını sil, temiz seti yaz
for(const src of ['places-tekirdag','web-scrape-tekirdag']){while(true){const s=await db.collection('outreachContacts').where('source','==',src).limit(400).get();if(s.empty)break;const bw=db.bulkWriter();bw.onWriteError(()=>false);s.forEach(d=>bw.delete(d.ref));await bw.close();if(s.size<400)break;}}
const bw=db.bulkWriter();bw.onWriteError(e=>e.failedAttempts<5);
for(const r of records){const ref=db.collection('outreachContacts').doc();bw.set(ref,{...r,source:'deep-scan-tekirdag',source_batch:'2026-06-25',createdAt:admin.firestore.FieldValue.serverTimestamp()});}
await bw.close();
// 6) özet
const wTel=records.filter(r=>has(r.phone)).length,wMail=records.filter(r=>has(r.email)).length,wIlce=records.filter(r=>has(r.ilce)).length,wMah=records.filter(r=>has(r.mahalle)).length,wAdr=records.filter(r=>has(r.adres)).length;
const byType=t=>records.filter(r=>r.type===t);
log(`=== BİTTİ ${new Date().toISOString()} ===`);
log(`TOPLAM kayıt: ${records.length} (Dernek ${byType('Dernek').length}, SporKulübü ${byType('SporKulübü').length}, Vakıf ${byType('Vakıf').length})`);
log(`  telefonu olan: ${wTel} | maili olan: ${wMail} | ilçe dolu: ${wIlce} | mahalle dolu: ${wMah} | adres dolu: ${wAdr}`);
process.exit(0);
