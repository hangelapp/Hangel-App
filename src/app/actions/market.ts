'use server';

/**
 * ReklamAction API'lerinden teklifleri (markaları) çeken sunucu eylemi.
 * Birden fazla API anahtarını destekleyecek ve verileri birleştirecek şekilde güncellendi.
 */
export async function getApiOffers() {
    const API_KEYS = [
        "2ae3a9b86708162dc059e78b6a8de2b4dee5444d13bb985b93340bdb6094bb54",
        "9421478cae5d673deb12bf1fade2021da06b019654808fddf1ef568569234d48"
    ];
    const url = "https://api.reklamaction.com/v1/offer?network=reklamaction";

    try {
        console.log(`API Fetching started for ${API_KEYS.length} keys...`);
        
        // Tüm anahtarlar için paralel fetch işlemleri başlatılıyor
        const fetchPromises = API_KEYS.map(async (key) => {
            try {
                const response = await fetch(url, {
                    headers: {
                        "Authorization": `Bearer ${key}`
                    },
                    cache: 'no-store'
                });

                if (!response.ok) {
                    console.error(`API Error for key ${key.substring(0, 8)}...: ${response.status}`);
                    return [];
                }

                const result = await response.json();
                // API bazen direkt dizi bazen { data: [] } döner
                const offers = result.data || result || [];
                return Array.isArray(offers) ? offers : [];
            } catch (err) {
                console.error(`Fetch failed for key ${key.substring(0, 8)}...:`, err);
                return [];
            }
        });

        // Tüm sonuçları bekle
        const results = await Promise.all(fetchPromises);
        
        // Tüm teklifleri tek bir dizide topla
        const allOffers = results.flat();

        // Aynı ID'ye veya isme sahip teklifleri temizle (Mükerrer kaydı önle)
        const uniqueOffersMap = new Map();
        allOffers.forEach((offer: any) => {
            if (offer && (offer.id || offer.name)) {
                const key = offer.id || offer.name.toLowerCase();
                if (!uniqueOffersMap.has(key)) {
                    uniqueOffersMap.set(key, offer);
                }
            }
        });

        const mergedOffers = Array.from(uniqueOffersMap.values());
        console.log(`API Fetch Complete: ${mergedOffers.length} unique offers found.`);
        
        return mergedOffers;
    } catch (e) {
        console.error("Global API fetch operation failed:", e);
        return null;
    }
}
