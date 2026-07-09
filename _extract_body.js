() => {
  var dec = function(s){ var t=document.createElement('textarea'); t.innerHTML=s; return t.value; };
  var pp = function(s){ if(!s) return 0; var c=s.replace(/[^\d,.]/g,'').replace(/\./g,'').replace(',','.'); var n=parseFloat(c); return isNaN(n)?0:n; };
  var out=[];
  var arts=Array.prototype.slice.call(document.querySelectorAll('article.product-item, article.prd'));
  for(var i=0;i<arts.length;i++){
    var art=arts[i]; var gtm={}; var raw=art.getAttribute('data-gtm-impression');
    if(raw){ try{ gtm=JSON.parse(dec(raw)); }catch(e){} }
    var pcEl=art.querySelector('[data-product-code]');
    var code=gtm.id||(pcEl?pcEl.getAttribute('data-product-code'):'')||'';
    var nmEl=art.querySelector('[data-product-name]');
    var title=((nmEl?nmEl.getAttribute('data-product-name'):'')||gtm.name||'').trim();
    var href=''; var links=Array.prototype.slice.call(art.querySelectorAll('a[href]'));
    for(var j=0;j<links.length;j++){ var h=links[j].getAttribute('href')||''; if(h&&h.charAt(0)!=='#'&&!/\.pdf/i.test(h)&&!/^https?:/.test(h)&&h.length>5){ href=h; break; } }
    var url=href?('https://www.beko.com.tr'+href):'';
    var le=art.querySelector('.prc-last');
    var listP=pp(le?le.textContent:'');
    if(!listP&&gtm.price) listP=parseFloat(gtm.price);
    var thirds=Array.prototype.slice.call(art.querySelectorAll('.prc-third'));
    var thirdP=0;
    for(var k=0;k<thirds.length;k++){ var v=pp(thirds[k].textContent||''); if(v>thirdP) thirdP=v; }
    var price=listP, sale=null;
    if(thirdP>0){ if(thirdP<listP) sale=thirdP; else if(!listP){ price=thirdP; } }
    var img='';
    var imgs=Array.prototype.slice.call(art.querySelectorAll('img'));
    for(var m=0;m<imgs.length;m++){ var ds=imgs[m].getAttribute('data-srcset')||imgs[m].getAttribute('srcset')||imgs[m].getAttribute('src')||''; if(/media\/resize\/.*MDM/.test(ds)){ var mm=ds.match(/(\/media\/resize\/[^\s,]*530Wx530H\/image\.webp)/)||ds.match(/(\/media\/resize\/[^\s,]*image\.webp)/); if(mm){ img='https://www.beko.com.tr'+mm[1]; break; } } }
    if(!img&&code) img='https://www.beko.com.tr/media/resize/'+code+'_MDM2_LOW_1.png/530Wx530H/image.webp';
    if(!code||!title||!url||!price) continue;
    out.push({code:code,title:title,url:url,price:price,sale:sale,img:img});
  }
  return out;
}
