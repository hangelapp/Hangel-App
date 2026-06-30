import admin from 'firebase-admin';import {readFileSync,appendFileSync} from 'fs';
admin.initializeApp({credential:admin.credential.cert(JSON.parse(readFileSync('./.firebase-service-account.json','utf8')))});
const db=admin.firestore();
const list=JSON.parse(readFileSync('/tmp/all_dernek_sites.json','utf8'));
const LOG='/tmp/national_scrape.log';
const log=m=>{appendFileSync(LOG,m+'\n');};
const EMAIL=/[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}/gi;
const PHONE=/(?:\+?90[\s\-.]?)?(?:0[\s\-.]?)?\(?(?:5\d{2}|2\d{2}|3\d{2}|4\d{2})\)?[\s\-.]?\d{3}[\s\-.]?\d{2}[\s\-.]?\d{2}/g;
const badMail=/\.(png|jpe?g|gif|svg|webp|css|js|ico)$|example\.|sentry|wixpress|\.wix|@2x|godaddy|cloudflare|domain\.|yourmail|user@|test@|@sentry/i;
const digits=s=>s.replace(/\D/g,'');
function vp(s){let d=digits(s);if(d.startsWith('90'))d=d.slice(2);if(d.length===10)d='0'+d;if(d.length!==11||d[0]!=='0'||!/^0(5|2|3|4)/.test(d))return null;return d;}
function extract(html){const t=html.replace(/<[^>]+>/g,' ');const mails=new Set(),phones=new Set();
  (t.match(EMAIL)||[]).forEach(m=>{m=m.toLowerCase();if(!badMail.test(m))mails.add(m)});
  (html.match(/mailto:([^"'>\s?]+)/gi)||[]).forEach(m=>{const e=m.replace(/mailto:/i,'').toLowerCase();if(!badMail.test(e))mails.add(e)});
  (t.match(PHONE)||[]).forEach(p=>{const v=vp(p);if(v)phones.add(v)});
  (html.match(/tel:([^"'>\s]+)/gi)||[]).forEach(p=>{const v=vp(p);if(v)phones.add(v)});
  return {mails:[...mails].slice(0,3),phones:[...phones].slice(0,3)};}
async function fetchUrl(u){try{const c=new AbortController();const t=setTimeout(()=>c.abort(),8000);
  const r=await fetch(u,{signal:c.signal,redirect:'follow',headers:{'User-Agent':'Mozilla/5.0 (contact-collector)'}});clearTimeout(t);
  if(!r.ok)return '';const ct=r.headers.get('content-type')||'';if(!/html|text/.test(ct))return '';return (await r.text()).slice(0,500000);}catch{return ''}}
function variants(site){site=(site||'').trim();
  if(/^[^@\s]+@[^@\s]+\.[a-z]+$/i.test(site))return {email:site.toLowerCase()};
  let base=site.replace(/^https?:\/\//i,'').replace(/\/.*$/,'').replace(/\/$/,'');
  if(!base||/\s/.test(base)||!base.includes('.'))return {bad:true};
  return {urls:['https://'+base,'https://'+base+'/iletisim','http://'+base]};}
let done=0,foundN=0;const buf=[];
async function flush(){if(!buf.length)return;const bw=db.bulkWriter();const take=buf.splice(0,buf.length);
  for(const o of take){const ref=db.collection('outreachContacts').doc();bw.set(ref,{name:o.name,type:'Dernek',city:o.il||null,phone:o.phones[0]||null,phoneAll:o.phones,email:o.mails[0]||null,emailAll:o.mails,website:o.site,source:'web-scrape-national',source_batch:'2026-06-25',createdAt:admin.firestore.FieldValue.serverTimestamp()});}
  await bw.close();}
async function proc(d){const v=variants(d.site);done++;
  if(v.bad)return;
  if(v.email){buf.push({name:d.name,il:d.il,site:d.site,phones:[],mails:[v.email]});foundN++;return;}
  const mails=new Set(),phones=new Set();
  for(const u of v.urls){const h=await fetchUrl(u);if(!h)continue;const e=extract(h);e.mails.forEach(m=>mails.add(m));e.phones.forEach(p=>phones.add(p));if(mails.size&&phones.size)break;}
  if(mails.size||phones.size){buf.push({name:d.name,il:d.il,site:d.site,phones:[...phones].slice(0,3),mails:[...mails].slice(0,3)});foundN++;}
  if(buf.length>=200)await flush();
  if(done%500===0)log(`[${new Date().toISOString().slice(11,19)}] işlenen ${done}/${list.length} | bulunan ${foundN}`);}
const POOL=24;let i=0;
async function worker(){while(i<list.length){await proc(list[i++]);}}
log(`=== BAŞLADI ${new Date().toISOString()} | ${list.length} site, pool ${POOL} ===`);
await Promise.all(Array.from({length:POOL},worker));
await flush();
log(`=== BİTTİ ${new Date().toISOString()} | işlenen ${done} | iletişim bulunan ${foundN} ===`);
process.exit(0);
