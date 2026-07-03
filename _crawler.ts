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
const locs=(x:string)=> (x.match(/<loc>\s*(?:<!\[CDATA\[)?\s*([^<\]]+?)\s*(?:\]\]>)?\s*<\/loc>/gi)||[]).map(m=>m.replace(/<\/?loc>|<!\[CDATA\[|\]\]>/gi,'').trim());
const isProd=(u:string)=>/\/(product|urun|p)\/|\/p-|-p-\d|\/pd\/|\/urun-/i.test(u);
const isXmlSitemap=(u:string)=>/\.xml($|\?)/i.test(u)||/sitemap/i.test(u.replace(/^https?:\/\/[^/]+/,''));

// Çok seviyeli sitemap ağacını gez (urlset/sitemapindex farketmez). İçindeki .xml/sitemap
// loc'ları alt-sitemap kabul edip kuyruğa atar; non-xml loc'ları ürün adayı sayar.
async function harvest(roots:string[]):Promise<string[]>{
  const seen=new Set<string>(); const out=new Set<string>(); const queue=[...new Set(roots)]; let fetched=0;
  const skip=/blog|category|kategori|\/page|sayfa|\/brand|\bmarka|content|\/store|magaza|combination|image_sitemap|images?_sitemap/i;
  while(queue.length && out.size<MAXP && fetched<500){
    const u=queue.shift()!; if(seen.has(u))continue; seen.add(u); fetched++;
    const xml=await get(u,45000); if(!xml)continue; // sitemap index bazı sitelerde yavaş (Altınyıldız ~18s)
    for(const l of locs(xml)){
      if(isXmlSitemap(l)){ if(!seen.has(l)&&!skip.test(l)) queue.push(l); }
      else out.add(l);
    }
  }
  return [...out];
}
async function productUrls(domain:string):Promise<string[]>{
  // robots.txt'teki Sitemap: satırları (standart-dışı yollar) + yaygın adaylar
  const robots=await get(`https://www.${domain}/robots.txt`)|| await get(`https://${domain}/robots.txt`);
  const robSm=(robots.match(/^\s*Sitemap:\s*(\S+)/gim)||[]).map(l=>l.replace(/^\s*Sitemap:\s*/i,'').trim());
  const seed=(process.env.SEED_SITEMAP||'').split(',').map(s=>s.trim()).filter(Boolean);
  const roots=[...seed,...robSm,
    `https://www.${domain}/sitemap.xml`, `https://${domain}/sitemap.xml`,
    `https://www.${domain}/sitemap_index.xml`, `https://www.${domain}/sitemap-index.xml`];
  const all=await harvest(roots);
  if(!all.length) return [];
  const pr=all.filter(isProd);
  // isProd yalnızca anlamlı bir oran eşleşince güvenilir; aksi halde tüm urlset'i kullan.
  const useAll=pr.length<Math.max(5,all.length*0.2);
  return [...new Set(useAll?all:pr)];
}
function extract(html:string){
  const blocks=[...html.matchAll(/<script[^>]*application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)].map(m=>m[1]);
  // JSON-LD graph'inde Product dugumunu (mainEntity/itemOffered gibi ic ice olsa da) bul. Sosyopix ic ice; kontrol karakteri temizlenir.
  const findProd=(node:any):any=>{ if(!node||typeof node!=='object') return null;
    if(Array.isArray(node)){ for(const x of node){ const r=findProd(x); if(r) return r; } return null; }
    const t=node['@type']; const isP=t==='Product'||(Array.isArray(t)&&t.includes('Product'));
    if(isP){ let off=node.offers; if(Array.isArray(off)) off=off[0];
      // bazı siteler (Skechers) offer alanlarını büyük harfle yazıyor: Price/PriceCurrency/Availability
      const price=Number((off&&(off.price||off.lowPrice||off.Price||off.LowPrice))||0);
      if(node.name&&price>0){ let img=node.image; if(Array.isArray(img)) img=img[0]; if(img&&typeof img==='object') img=img.contentUrl||img.url;
        return {name:String(node.name),price,cur:(off&&(off.priceCurrency||off.PriceCurrency))||'TRY',img,avail:/InStock/i.test((off&&(off.availability||off.Availability))||'')?'in stock':'out of stock',sku:node.sku||node.mpn||''}; } }
    for(const k of Object.keys(node)){ if(k==='@context') continue; const r=findProd(node[k]); if(r) return r; }
    return null; };
  for(const b of blocks){ try{ const j=JSON.parse(b.trim().replace(/[\u0000-\u001F]+/g,' ')); const r=findProd(j); if(r) return r;
  }catch{} }
  const og=(p:string)=>{const m=html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${p}["'][^>]+content=["']([^"']+)["']`,'i'));return m?m[1]:'';};
  const price=Number((og('product:price:amount')||og('og:price:amount')||'').replace(/[^\d.,]/g,'').replace(',','.'));
  const name=og('og:title'); if(name&&price>0) return {name,price,cur:og('product:price:currency')||'TRY',img:og('og:image'),avail:'in stock',sku:''};
  // COMER (usecomer.com) fallback: cartform-price hidden input + <title> + uf/ ürün görseli
  const cm=html.match(/id=["']cartform-price["'][^>]*value=["']([\d.,]+)["']/i)||html.match(/name=["']CartForm\[price\]["'][^>]*value=["']([\d.,]+)["']/i);
  if(cm){ const cp=Number(cm[1].replace(/\.(?=\d{3}\b)/g,'').replace(',','.'));
    const tt=(html.match(/<title>([^<]*)<\/title>/i)?.[1]||'').replace(/\s*[|\-–]\s*[^|\-–]+$/,'').trim();
    const im=html.match(/https?:\/\/static\.usecomer\.com\/[^"'\s&]+\/uf\/[^"'\s&]+\.(?:jpg|jpeg|png|webp)/i)?.[0]||'';
    if(tt&&cp>0) return {name:tt,price:cp,cur:'TRY',img:im,avail:'in stock',sku:''};
  }
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
    ok++; const ext=String(e.sku||hash(u)); const docId=`crawl-${st.key}-${ext}`.replace(/[/\\.#$\[\]]/g,'-');
    products.push({ id:docId, source:'crawl', feedId, offerId:'', brandId:st.key, brandName:st.name, externalId:ext,
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
