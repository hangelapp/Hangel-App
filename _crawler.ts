/* Faz 2 crawler: mağaza sitemap → ürün sayfaları → JSON-LD/OG → products'a yaz.
   STORE_NAMES env (virgüllü) ile hangi mağazalar. brandId ile yazılır (affiliate). */
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { extractProductBrand, normKey } from './src/lib/market/brand-extract';
import { searchTokensFor } from './src/lib/feed/search';

process.on('unhandledRejection', (e)=>console.log('  [unhandledRejection]', e instanceof Error?e.message.slice(0,60):e));
if (!getApps().length) initializeApp({ credential: cert(JSON.parse(readFileSync('.hangelorg-service-account.json','utf8'))) });
const db = getFirestore();
const AG: Record<string,string> = { ao:'affocean', ra:'reklamaction', go:'gelirortaklari' };
const stores = JSON.parse(readFileSync('/tmp/store-domains.json','utf8')) as {key:string,name:string,domain:string,offerId:string}[];
const WANT = (process.env.STORE_NAMES||'').split(',').map(s=>s.trim()).filter(Boolean);
const CONC = Number(process.env.CONC||'12');
const MAXP = Number(process.env.MAXP||'20000');

function strip(o:any):any{ if(Array.isArray(o))return o.map(strip); if(o&&typeof o==='object'){const r:any={};for(const[k,v]of Object.entries(o))if(v!==undefined)r[k]=strip(v);return r;} return o; }
async function get(u:string,t=15000):Promise<string>{ try{const r=await fetch(u,{redirect:'follow',signal:AbortSignal.timeout(t),headers:{'User-Agent':'Mozilla/5.0 (compatible; hangel-crawler)'}}); return r.ok?await r.text():'';}catch{return '';} }
const locs=(x:string)=> (x.match(/<loc>\s*([^<]+?)\s*<\/loc>/gi)||[]).map(m=>m.replace(/<\/?loc>/gi,'').trim());
const isProd=(u:string)=>/\/(product|urun|p)\/|\/p-|-p-\d|\/pd\/|\/urun-/i.test(u);

async function productUrls(domain:string):Promise<string[]>{
  for(const p of ['/sitemap.xml','/sitemap_index.xml','/sitemap-index.xml']){
    const xml=await get(`https://${domain}${p}`)|| await get(`https://www.${domain}${p}`);
    if(!xml)continue;
    if(/<sitemapindex/i.test(xml)){
      const kids=locs(xml);
      // blog/kategori/sayfa sitemap'lerini ele; kalan hepsinden URL topla (ürün-adlı
      // olmasa da). JSON-LD çıkarımı ürün olmayanları zaten atlar.
      const skip=/blog|category|kategori|page|sayfa|brand|marka|content|store|magaza|combination/i;
      const prodKids=kids.filter(u=>/product|urun|catalog/i.test(u));
      const use=(prodKids.length?prodKids:kids.filter(u=>!skip.test(u)));
      const all:string[]=[];
      for(const k of use){ if(all.length>MAXP)break; const cx=await get(k); all.push(...locs(cx)); }
      return [...new Set(all)];
    }
    const ls=locs(xml); const pr=ls.filter(isProd); return [...new Set(pr.length?pr:ls)];
  }
  return [];
}
function extract(html:string){
  const blocks=[...html.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]);
  for(const b of blocks){ try{ const j=JSON.parse(b.trim()); const arr=Array.isArray(j)?j:(j['@graph']||[j]);
    for(const o of arr){ const t=o['@type']; if(t==='Product'||(Array.isArray(t)&&t.includes('Product'))){
      const off=Array.isArray(o.offers)?o.offers[0]:o.offers; const price=Number(off?.price||off?.lowPrice||0);
      if(o.name&&price>0) return {name:String(o.name),price,cur:off?.priceCurrency||'TRY',img:Array.isArray(o.image)?o.image[0]:o.image,avail:/InStock/i.test(off?.availability||'')?'in stock':'out of stock',sku:o.sku||o.mpn||''};
    }}
  }catch{} }
  const og=(p:string)=>{const m=html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${p}["'][^>]+content=["']([^"']+)["']`,'i'));return m?m[1]:'';};
  const price=Number((og('product:price:amount')||og('og:price:amount')||'').replace(/[^\d.,]/g,'').replace(',','.'));
  const name=og('og:title'); if(name&&price>0) return {name,price,cur:og('product:price:currency')||'TRY',img:og('og:image'),avail:'in stock',sku:''};
  return null;
}
async function pool<T,R>(items:T[],n:number,fn:(x:T)=>Promise<R>):Promise<R[]>{
  const out:R[]=[]; let i=0;
  async function worker(){ while(i<items.length){ const idx=i++; out[idx]=await fn(items[idx]); } }
  await Promise.all(Array.from({length:Math.min(n,items.length)},worker)); return out;
}
function hash(s:string){let h=0;for(let i=0;i<s.length;i++)h=(Math.imul(31,h)+s.charCodeAt(i))|0;return(h>>>0).toString(36);}

async function crawlStore(st:{key:string,name:string,domain:string}){
  const t0=Date.now();
  const urls=(await productUrls(st.domain)).slice(0,MAXP);
  if(!urls.length){ console.log(`  ${st.name}: ürün URL YOK → atla`); return; }
  const pref=st.key.split('-')[0]; const feedId=st.key.split('-')[1]; const dr=await db.collection('brands').doc(st.key).get().then(d=>Number(d.data()?.donationRate)||3).catch(()=>3);
  let ok=0; const products:any[]=[];
  await pool(urls,CONC,async(u)=>{ const html=await get(u,15000); if(!html)return; const e=extract(html); if(!e)return;
    ok++; const ext=String(e.sku||hash(u));
    products.push({ id:`crawl-${st.key}-${ext}`, source:'crawl', feedId, offerId:'', brandId:st.key, brandName:st.name, externalId:ext,
      title:e.name, price:e.price, salePrice:null, currency:e.cur||'TRY', imageLink:e.img, productUrl:u, availability:e.avail, donationRate:dr, random:Math.random(), updatedAt:Date.now() });
  });
  if(!products.length){ console.log(`  ${st.name}: ${urls.length} URL ama 0 parse → atla (eski silinmez)`); return; }
  // eski kayıtları sil (source=agency+feedId) — Phase1 ile aynı 'değiştir'
  let del=0; const oldSrc=AG[pref];
  if(oldSrc){ while(true){ const s=await db.collection('products').where('source','==',oldSrc).where('feedId','==',feedId).limit(450).get(); if(s.empty)break; const b=db.batch(); s.docs.forEach(d=>b.delete(d.ref)); await b.commit(); del+=s.size; } }
  // taze yaz
  let wr=0; for(let i=0;i<products.length;i+=450){ const b=db.batch(); for(const p of products.slice(i,i+450)){ const pb=extractProductBrand(p.title||'',p.brandName||''); b.set(db.collection('products').doc(p.id),strip({...p,productBrand:pb,productBrandKey:pb?normKey(pb):null,searchTokens:searchTokensFor(p)}),{merge:true}); } await b.commit(); wr+=Math.min(450,products.length-i); }
  console.log(`  ✅ ${st.name}: URL=${urls.length} parse=${ok} eski-sil=${del} yaz=${wr} (${Math.round((Date.now()-t0)/1000)}s)`);
}
(async()=>{
  const targets=stores.filter(s=>WANT.includes(s.name)).filter((s,i,a)=>a.findIndex(x=>x.key===s.key)===i);
  console.log(`=== CRAWL ${targets.map(t=>t.name).join(', ')} ===`);
  for(const st of targets){ try{ await crawlStore(st); }catch(e){ console.log(`  ${st.name}: HATA ${e instanceof Error?e.message:e}`); } }
  console.log('=== BİTTİ ===');
  process.exit(0);
})();
