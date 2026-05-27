/**
 * T.C. Sağlık Bakanlığı açık veri portalından hastane listesi çek + Firestore'a yaz.
 *
 * Veri kaynakları (denenecek sırası):
 *   1. https://veri.saglik.gov.tr açık veri (CSV/JSON endpoint)
 *   2. OpenStreetMap Overpass API (fallback — amenity=hospital + clinic)
 *
 * Kullanım:
 *   node .import-hospitals.mjs
 *
 * Firestore: hospitals/{slug}
 *   { name, city, district, neighborhood, address, category, phone, website, source, lat, lng }
 *
 * NOT: bu script Admin SDK kullanır → .firebase-service-account.json gerekli
 * veya GOOGLE_APPLICATION_CREDENTIALS env. Local dev için repo'da olabilir.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function fetchFromOpenStreetMap() {
    console.log('Trying OpenStreetMap Overpass API (Turkey hospitals + clinics)...');
    // Overpass QL: Türkiye sınırları içindeki hastane + klinik POI'leri
    const query = `[out:json][timeout:120];
area["ISO3166-1"="TR"]->.tr;
(
  node["amenity"="hospital"](area.tr);
  way["amenity"="hospital"](area.tr);
  node["amenity"="clinic"](area.tr);
  way["amenity"="clinic"](area.tr);
);
out center tags;`;
    // Why: Overpass API'nin daha az yoğun mirror'ı + zorunlu User-Agent
    // (overpass-api.de 406 dönüyor agent'sız çağrılarda)
    const url = 'https://overpass.kumi.systems/api/interpreter';
    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
            'User-Agent': 'HangelImportBot/1.0 (+https://hangel.org.tr)',
        },
        body: `data=${encodeURIComponent(query)}`,
    });
    if (!res.ok) {
        const errBody = await res.text().catch(() => '');
        throw new Error(`Overpass HTTP ${res.status} — ${errBody.slice(0, 200)}`);
    }
    const data = await res.json();
    const elements = data.elements || [];
    console.log(`OpenStreetMap: ${elements.length} hastane/klinik geldi.`);

    const slugify = (s) => s.toLowerCase()
        .replace(/[ığüşöç]/g, (c) => ({ı:'i',ğ:'g',ü:'u',ş:'s',ö:'o',ç:'c'}[c] || c))
        .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);

    return elements
        .filter(e => e.tags?.name)
        .map((e) => {
            const t = e.tags;
            const lat = e.lat ?? e.center?.lat;
            const lng = e.lon ?? e.center?.lon;
            const name = t.name;
            // Address: city, district from addr:* tags
            const city = t['addr:city'] || t['addr:province'] || '';
            const district = t['addr:district'] || t['addr:suburb'] || '';
            const neighborhood = t['addr:quarter'] || t['addr:neighbourhood'] || '';
            const street = t['addr:street'] || '';
            const houseNum = t['addr:housenumber'] || '';
            const postcode = t['addr:postcode'] || '';
            const address = [street, houseNum, neighborhood, district, city, postcode].filter(Boolean).join(', ');

            return {
                id: `osm-${slugify(name)}-${e.id}`,
                name,
                city,
                district,
                neighborhood,
                address,
                category: t.amenity === 'hospital' ? 'Hastane' : 'Klinik',
                phone: t['contact:phone'] || t.phone || '',
                website: t['contact:website'] || t.website || '',
                emergencyService: t.emergency === 'yes',
                source: 'openstreetmap',
                osmType: e.type,
                osmId: e.id,
                lat: lat ?? null,
                lng: lng ?? null,
            };
        });
}

async function writeToFirestore(hospitals) {
    // Dynamic import — firebase-admin
    const { initializeApp, cert, applicationDefault } = await import('firebase-admin/app');
    const { getFirestore } = await import('firebase-admin/firestore');

    const saPath = path.join(__dirname, '.firebase-service-account.json');
    let app;
    if (fs.existsSync(saPath)) {
        const sa = JSON.parse(fs.readFileSync(saPath, 'utf-8'));
        app = initializeApp({ credential: cert(sa), projectId: sa.project_id });
    } else {
        app = initializeApp({ credential: applicationDefault() });
    }
    const db = getFirestore(app);

    const BATCH = 400;
    let written = 0;
    for (let i = 0; i < hospitals.length; i += BATCH) {
        const slice = hospitals.slice(i, i + BATCH);
        const batch = db.batch();
        slice.forEach((h) => {
            const ref = db.collection('hospitals').doc(h.id);
            batch.set(ref, h, { merge: true });
        });
        await batch.commit();
        written += slice.length;
        console.log(`Wrote ${written}/${hospitals.length}`);
    }
}

async function main() {
    try {
        const hospitals = await fetchFromOpenStreetMap();
        console.log(`Toplam ${hospitals.length} kayıt Firestore'a yazılıyor...`);
        await writeToFirestore(hospitals);
        console.log('Bitti.');
    } catch (e) {
        console.error('Hata:', e);
        process.exit(1);
    }
}

main();
