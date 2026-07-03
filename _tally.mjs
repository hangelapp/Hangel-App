import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { execSync } from 'child_process';
initializeApp({ credential: cert(JSON.parse(readFileSync('.hangelorg-service-account.json','utf8'))) });
const db = getFirestore();
// crawler süreçleri bitene kadar bekle
while(true){ const n=Number(execSync(`ps aux|grep "[t]sx ./_crawler"|wc -l`).toString().trim()); if(n===0)break; await new Promise(r=>setTimeout(r,15000)); }
const keys={İdefix:'ao-2846','D&R':'ra-2541',Columbia:'ra-2487',Hotiç:'ra-60315',Taç:'ra-56601',Linens:'ra-5951',Yargıcı:'ao-2136',Colins:'ra-3678','Toyzz Shop':'ra-57791',Skechers:'go-6824',Zwilling:'ao-2831',SETUR:'ao-2883',Occasion:'ao-2040',Özdilekteyim:'ao-2889',Kayra:'ra-62430',Jacadi:'ra-62075',Vitaminler:'ra-60816',Supplementler:'go-5528',Doremusic:'ao-2794',Sportive:'ra-1603','Saat ve Saat':'ra-4363',Altınyıldız:'ao-2896',Casper:'ra-61607',Sosyopix:'ra-62411'};
console.log('=== ORTA ÇEKİM SONUÇ ===');
let done=[],miss=[];
for(const [n,k] of Object.entries(keys)){ const c=(await db.collection('products').where('brandId','==',k).count().get()).data().count; if(c>0){done.push(`${n}=${c}`);}else{miss.push(n);} }
console.log('✅ ÇEKİLEN ('+done.length+'):'); done.sort().forEach(x=>console.log('  '+x));
console.log('❌ ÇEKİLEMEYEN ('+miss.length+'): '+miss.join(', '));
process.exit(0);
