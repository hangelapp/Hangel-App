import admin from 'firebase-admin';import {readFileSync} from 'fs';
admin.initializeApp({credential:admin.credential.cert(JSON.parse(readFileSync('./.firebase-service-account.json','utf8')))});
const db=admin.firestore();const has=v=>!!(v&&v.toString().trim());
const isSpor=f=>/spor/i.test(f||'');
const norm=s=>(s||'').toLocaleLowerCase('tr').replace(/i̇/g,'i').replace(/â/g,'a').replace(/î/g,'i').replace(/û/g,'u').replace(/ı/g,'i').replace(/ğ/g,'g').replace(/ü/g,'u').replace(/ş/g,'s').replace(/ö/g,'o').replace(/ç/g,'c');
// branş anahtarı → federasyon (sıra: özel→genel)
const MAP=[
 ['masa tenisi','Türkiye Masa Tenisi Federasyonu'],['kick boks','Türkiye Kick Boks Federasyonu'],['kickboks','Türkiye Kick Boks Federasyonu'],
 ['buz hokey','Türkiye Buz Hokeyi Federasyonu'],['buz pateni','Türkiye Buz Pateni Federasyonu'],['kung fu','Türkiye Wushu Kung Fu Federasyonu'],
 ['muay thai','Türkiye Muay Thai Federasyonu'],['vucut gelistirme','Türkiye Vücut Geliştirme Fitness ve Bilek Güreşi Federasyonu'],['bilek guresi','Türkiye Vücut Geliştirme Fitness ve Bilek Güreşi Federasyonu'],['fitness','Türkiye Vücut Geliştirme Fitness ve Bilek Güreşi Federasyonu'],
 ['halk oyunlari','Türkiye Halk Oyunları Federasyonu'],['aticilik','Türkiye Atıcılık ve Avcılık Federasyonu'],['avcilik','Türkiye Atıcılık ve Avcılık Federasyonu'],
 ['yagli gures','Türkiye Geleneksel Güreşler Federasyonu'],['karakucak','Türkiye Geleneksel Güreşler Federasyonu'],['aba gures','Türkiye Geleneksel Güreşler Federasyonu'],['gures','Türkiye Geleneksel Güreşler Federasyonu'],
 ['atli spor','Türkiye Geleneksel Atlı Spor Dalları Federasyonu'],['cirit','Türkiye Geleneksel Atlı Spor Dalları Federasyonu'],['rahvan','Türkiye Geleneksel Atlı Spor Dalları Federasyonu'],
 ['okculuk','Türkiye Geleneksel Türk Okçuluk Federasyonu'],
 ['futbol','Türkiye Futbol Federasyonu'],['basketbol','Türkiye Basketbol Federasyonu'],['voleybol','Türkiye Voleybol Federasyonu'],['hentbol','Türkiye Hentbol Federasyonu'],
 ['badminton','Türkiye Badminton Federasyonu'],['atletizm','Türkiye Atletizm Federasyonu'],['yuzme','Türkiye Yüzme Federasyonu'],['su topu','Türkiye Sutopu Federasyonu'],['sutopu','Türkiye Sutopu Federasyonu'],
 ['kurek','Türkiye Kürek Federasyonu'],['kano','Türkiye Kano Federasyonu'],['judo','Türkiye Judo Federasyonu'],['karate','Türkiye Karate Federasyonu'],['taekwondo','Türkiye Taekwondo Federasyonu'],['tekvando','Türkiye Taekwondo Federasyonu'],
 ['wushu','Türkiye Wushu Kung Fu Federasyonu'],['boks','Türkiye Boks Federasyonu'],['halter','Türkiye Halter Federasyonu'],['cimnastik','Türkiye Cimnastik Federasyonu'],['jimnastik','Türkiye Cimnastik Federasyonu'],
 ['bisiklet','Türkiye Bisiklet Federasyonu'],['yelken','Türkiye Yelken Federasyonu'],['kayak','Türkiye Kayak Federasyonu'],['kaykay','Türkiye Kaykay Federasyonu'],['binicilik','Türkiye Binicilik Federasyonu'],
 ['modern pentatlon','Türkiye Modern Pentatlon Federasyonu'],['triatlon','Türkiye Triatlon Federasyonu'],['eskrim','Türkiye Eskrim Federasyonu'],['bocce','Türkiye Bocce Bowling ve Dart Federasyonu'],['bowling','Türkiye Bocce Bowling ve Dart Federasyonu'],['dart','Türkiye Bocce Bowling ve Dart Federasyonu'],
 ['bilardo','Türkiye Bilardo Federasyonu'],['golf','Türkiye Golf Federasyonu'],['satranc','Türkiye Satranç Federasyonu'],['bric','Türkiye Briç Federasyonu'],['dagcilik','Türkiye Dağcılık Federasyonu'],['dag spor','Türkiye Dağcılık Federasyonu'],
 ['sualti','Türkiye Sualtı Sporları Federasyonu'],['dalis','Türkiye Sualtı Sporları Federasyonu'],['hava spor','Türkiye Hava Sporları Federasyonu'],['yamac parasut','Türkiye Hava Sporları Federasyonu'],['havacilik','Türkiye Hava Sporları Federasyonu'],['parasut','Türkiye Hava Sporları Federasyonu'],
 ['otomobil','Türkiye Otomobil Sporları Federasyonu'],['motosiklet','Türkiye Motosiklet Federasyonu'],['motor spor','Türkiye Motosiklet Federasyonu'],['beyzbol','Türkiye Beyzbol Softbol Korumalı Futbol ve Ragbi Federasyonu'],['softbol','Türkiye Beyzbol Softbol Korumalı Futbol ve Ragbi Federasyonu'],['ragbi','Türkiye Beyzbol Softbol Korumalı Futbol ve Ragbi Federasyonu'],
 ['hokey','Türkiye Hokey Federasyonu'],['dans spor','Türkiye Dans Sporları Federasyonu'],['izci','Türkiye İzcilik Federasyonu'],['e-spor','Türkiye E-Spor Federasyonu'],['espor','Türkiye E-Spor Federasyonu'],['oryantiring','Türkiye Oryantiring Federasyonu'],
 ['bedensel engelli','Türkiye Bedensel Engelliler Spor Federasyonu'],['gorme engelli','Türkiye Görme Engelliler Spor Federasyonu'],['isitme engelli','Türkiye İşitme Engelliler Spor Federasyonu'],['ozel sporcu','Türkiye Özel Sporcular Spor Federasyonu'],['universite spor','Türkiye Üniversite Sporları Federasyonu'],
 ['gelenek','Türkiye Geleneksel Spor Dalları Federasyonu'],['herkes icin spor','Türkiye Herkes İçin Spor Federasyonu'],['tenis','Türkiye Tenis Federasyonu'],
];
function deriveFeds(text){const t=' '+norm(text)+' ';const set=new Set();for(const [kw,fed] of MAP){if(t.includes(' '+kw)||t.includes(kw+' ')||t.includes(kw)){set.add(fed);}}
  // alt-küme temizliği
  if(t.includes('kick boks'))set.delete('Türkiye Boks Federasyonu');
  if(t.includes('masa tenisi'))set.delete('Türkiye Tenis Federasyonu');
  if(t.includes('buz hokey'))set.delete('Türkiye Hokey Federasyonu');
  return [...set];}

async function tag(col,filterSpor,nameF,faalF){
  const snap=await db.collection(col).get();
  let n=0,tagged=0;const dist={};const bw=db.bulkWriter();bw.onWriteError(e=>e.failedAttempts<15);
  snap.forEach(d=>{const x=d.data();
    const sporRec=filterSpor==='registry'?isSpor(x.faaliyetAlani):(x.type==='SporKulübü');
    if(!sporRec)return;n++;
    if(Array.isArray(x.federations)&&x.federations.length)return; // zaten var
    const feds=deriveFeds((x[nameF]||'')+' '+(x[faalF]||''));
    if(feds.length){bw.update(d.ref,{federations:feds,federationSource:'branch-inference-2026-06-26'}).catch(()=>{});tagged++;feds.forEach(f=>dist[f]=(dist[f]||0)+1);}
  });
  await bw.close().catch(()=>{});
  console.log(`\n${col}: spor kaydı ${n} | federasyon etiketlenen ${tagged} (%${Math.round(tagged/n*100)})`);
  return dist;
}
const d1=await tag('registryDernekler','registry','name','detayliFaaliyetAlani');
const d2=await tag('outreachContacts','outreach','name','faaliyetAlani');
const merged={};for(const d of [d1,d2])for(const [k,v] of Object.entries(d))merged[k]=(merged[k]||0)+v;
console.log('\n=== Federasyon dağılımı (registry+outreach toplam) ===');
Object.entries(merged).sort((a,b)=>b[1]-a[1]).slice(0,25).forEach(([k,v])=>console.log('  '+k+': '+v));
console.log('\nBİTTİ');
process.exit(0);
