import { chromium } from 'playwright';
const UA='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15';
const urls=[
 'https://www.beko.com.tr/no-frost-buzdolabi/670475-ei-buzdolabi',
 'https://www.beko.com.tr/beyaz-esya-yedek-parca-ve-aksesuarlari/mikrofiltre-gr-alt-0-ral-7037-beyaz-esya-yedek-parca-ve-aksesuarlari',
];
const b=await chromium.launch({headless:true});
const ctx=await b.newContext({userAgent:UA, locale:'tr-TR', viewport:{width:1366,height:900}});
const p=await ctx.newPage();
for(const u of urls){
  try{
   const r=await p.goto(u,{waitUntil:'domcontentloaded',timeout:30000});
   const data=await p.evaluate(()=>{
     // find ecommerce.detail.products via dataLayer or inline
     let prod=null;
     try{
       for(const e of (window.dataLayer||[])){
         if(e && e.ecommerce && e.ecommerce.detail && e.ecommerce.detail.products) { prod=e.ecommerce.detail.products[0]; break;}
       }
     }catch{}
     const og=document.querySelector('meta[property="o'+'g:image"]');
     const desc=document.querySelector('meta[name="description"]');
     const title=document.querySelector('h1')?.innerText || document.title;
     // availability: add to cart button present & enabled vs Tükendi
     const bodyTxt=document.body.innerText;
     const soldOut=/Tükendi|Stokta yok|geçici olarak/i.test(bodyTxt);
     const addBtn=document.querySelector('.js-add-to-cart, .pdp-add-to-cart button, [data-se-anim="PDPPurchase"] button');
     // gallery first image element actual src
     const galImg=document.querySelector('.pdp-gallery img, .swiper-slide img, img[src*="/media/resize/"]');
     return {name:prod?.name, id:prod?.id, price:prod?.price, brand:prod?.brand, cat:prod?.category,
       og:og?.content, desc:desc?.content?.slice(0,120), title, soldOut, hasAddBtn:!!addBtn,
       galSrc: galImg?.getAttribute('src') || galImg?.currentSrc};
   });
   console.log('HTTP', r.status(), u.split('/').pop());
   console.log(JSON.stringify(data,null,1));
   // validate image via browser request (absolute)
   if(data.og){
     const abs = data.og.startsWith('http')? data.og : 'https://www.beko.com.tr'+data.og;
     const resp = await p.request.get(abs, {headers:{Referer:u}});
     console.log('IMG', resp.status(), resp.headers()['content-type'], '->', abs);
   }
  }catch(e){ console.log('ERR', u, e.message); }
  console.log('---');
}
await b.close();
