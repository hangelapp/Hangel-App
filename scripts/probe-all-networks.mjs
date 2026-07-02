/**
 * 3 ağın (ReklamAction/Affocean/GelirOrtakları) listelenebilir markalarını çeker,
 * junk'ları eler, her markanın sitesini hızlıca yoklar (HTTP durumu + platform +
 * sitemap ürün sayısı) ve kolay/zor + katalog + süre tahminini üretir.
 */
const NETS = [
  { net: 'reklamaction', name: 'ReklamAction', key: '2ae3a9b86708162dc059e78b6a8de2b4dee5444d13bb985b93340bdb6094bb54', aff: '35329' },
  { net: 'affocean', name: 'Affocean', key: 'c908bda5f41405de7cbcb40a15db041e47a2fcc55358e8f44790db8ff2cfb35d', aff: '7873' },
  { net: 'gelirortaklari', name: 'GelirOrtaklari', key: '891bae449589572cc756b5fe93e182c527ef910c2137c7e1ea53a0a366ab9cd3', aff: '37081' },
];
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36';
const SCRAPED = new Set(['2783','2829','2804','2865','2866','2867','2892','2861','2845','2831','2794','2777','2745','2846']); // 14 done

const JUNK = /e-?kitap|e-?book|\bCPL\b|\bCOD\b|Advert Store|Vidyodan|Deneme|Landers?|Journey in Diet|Diyet|Zengin Olman|Secret to Being Rich|Freelanc|World of Freelanc|Air Cooly|Bomb Size|Cooling Bra|Coco Body|DiabaCore|Ketoburn|Kollagen|Fungus|JointFlex|Healthy Heart|QNix|Trimsher|Lumbar|Manuka|Flavus|Bomb Size|Promo/i;

function listable(o){if(String(o.status??'').toLowerCase()!=='active')return false;const ap=String(o.approval_status??'').toLowerCase()==='approved';const open=String(o.require_approval??'1')==='0';return ap||open;}
function clean(n){return String(n).replace(/\[.*?\]/g,'').replace(/\(.*?\)/g,'').replace(/\b(CPS|CPA|CPL|CPC|Satış|Sales|Satis|COD|TR|Influencer|Coupon|Attribution|Paused)\b/gi,'').replace(/[-|\/]/g,' ').replace(/\s+/g,' ').trim();}

async function pull(cfg){
  const base=`https://${cfg.net}.api.hasoffers.com/Apiv3/json`;let page=1,all=[];
  while(true){const p=new URLSearchParams({Target:'Affiliate_Offer',Method:'findAll',api_key:cfg.key,'fields[]':'id','fields[1]':'name','fields[2]':'approval_status','fields[3]':'status','fields[4]':'require_approval','fields[5]':'payout_type','fields[6]':'percent_payout','fields[7]':'preview_url',limit:'500',page:String(page)});
    const r=await fetch(`${base}?${p}`);const j=await r.json();if(j?.response?.status!==1)break;
    const d=j?.response?.data?.data;const e=Object.values(d||{});if(!e.length)break;for(const x of e){if(x.Offer?.id)all.push(x.Offer);}if(e.length<500)break;page++;}
  return all.filter(listable);
}
function domainOf(u){try{return new URL(u.startsWith('http')?u:'https://'+u).origin;}catch{return null;}}
function platform(html){
  if(/awswaf|challenge\.js/i.test(html))return['AWS-WAF','zor'];
  if(/_Incapsula_|akamai|Access Denied/i.test(html))return['Akamai/bot','zor'];
  if(/ticimax/i.test(html))return['Ticimax','kolay'];
  if(/akinon|a-cdn\.akinon/i.test(html))return['Akinon','kolay'];
  if(/__NEXT_DATA__/i.test(html))return['Next.js','kolay'];
  if(/ideasoft/i.test(html))return['ideasoft','kolay'];
  if(/__NUXT__/i.test(html))return['Nuxt','orta'];
  if(/demandware|dwstatic/i.test(html))return['SFCC','orta'];
  if(/application\/ld\+json/i.test(html)&&/"@type"\s*:\s*"?Product/i.test(html))return['JSON-LD','kolay'];
  if(/application\/ld\+json/i.test(html))return['JSON-LD(genel)','orta'];
  return['bilinmiyor','orta'];
}
async function probe(brand){
  const dom=domainOf(brand.preview_url);
  if(!dom)return{...brand,dom:'?',status:'no-url',plat:'?',diff:'?',catalog:'?'};
  let status='?',plat='?',diff='zor',html='';
  try{const r=await fetch(dom+'/',{headers:{'User-Agent':UA,'Accept-Language':'tr'},redirect:'follow',signal:AbortSignal.timeout(12000)});status=r.status;html=await r.text();[plat,diff]=platform(html);
    if(status>=400||status===202){diff='zor';if(plat==='bilinmiyor')plat='bot-wall '+status;}
  }catch(e){status='ERR';diff='zor';plat=(e.name==='TimeoutError'?'timeout':'erişilemedi');}
  // katalog: sitemap ürün sayısı (kaba)
  let catalog='?';
  try{
    let smUrl=dom+'/sitemap.xml';
    const rob=await fetch(dom+'/robots.txt',{headers:{'User-Agent':UA},signal:AbortSignal.timeout(8000)});
    if(rob.ok){const t=await rob.text();const m=t.match(/Sitemap:\s*(\S+)/i);if(m)smUrl=m[1];}
    const sm=await fetch(smUrl,{headers:{'User-Agent':UA},signal:AbortSignal.timeout(10000)});
    if(sm.ok){const xml=await sm.text();
      const locs=[...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)].map(m=>m[1]);
      const prodSm=locs.filter(u=>/product|urun|catalog/i.test(u)&&u.endsWith('.xml'));
      if(prodSm.length){const child=await fetch(prodSm[0],{headers:{'User-Agent':UA},signal:AbortSignal.timeout(10000)});if(child.ok){const cx=await child.text();const n=(cx.match(/<loc>/gi)||[]).length;catalog='~'+(n*prodSm.length).toLocaleString('tr-TR')+' (tahmini)';}}
      else{const n=locs.filter(u=>!u.endsWith('.xml')).length;if(n)catalog='~'+n.toLocaleString('tr-TR');}
    }
  }catch{}
  return{...brand,dom,status,plat,diff,catalog};
}
async function pMap(arr,fn,conc=10){const out=[];let i=0;const workers=Array.from({length:conc},async()=>{while(i<arr.length){const idx=i++;out[idx]=await fn(arr[idx]);}});await Promise.all(workers);return out;}

(async()=>{
  for(const cfg of NETS){
    const all=await pull(cfg);
    const real=all.filter(o=>!JUNK.test(o.name)&&o.payout_type!=='cpa_flat'||cfg.net==='gelirortaklari'&&!JUNK.test(o.name));
    const junkCount=all.length-real.length;
    console.log(`\n══════ ${cfg.name} — ${real.length} gerçek marka (${junkCount} junk elendi) ══════`);
    const res=await pMap(real,probe,10);
    res.sort((a,b)=>({kolay:0,orta:1,zor:2,'?':3}[a.diff]-{kolay:0,orta:1,zor:2,'?':3}[b.diff])||String(a.name).localeCompare(b.name,'tr'));
    for(const r of res){
      const done=SCRAPED.has(String(r.id))?'✅200':'—';
      const icon=r.diff==='kolay'?'🟢':r.diff==='orta'?'🟡':'🔴';
      console.log(`  ${icon} ${done.padEnd(5)} ${clean(r.name).slice(0,22).padEnd(23)} ${String(r.plat).padEnd(14)} kat:${String(r.catalog).padEnd(18)} ${r.dom||''}`);
    }
  }
})().catch(e=>console.error(e.message));
