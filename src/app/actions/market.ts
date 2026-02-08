'use server';

/**
 * ReklamAction API'lerinden teklifleri (markaları) çeken sunucu eylemi.
 * Birden fazla API anahtarını destekleyecek ve verileri temizleyerek birleştirecek şekilde güncellendi.
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
        
        const processedBrands = allOffers.map((m: any) => {
            if (!m || (!m.id && !m.name)) return null;

            const rawPayout = m.payout || "0";
            // Oran tipi belirleme (% mi yoksa sabit TL mi?)
            const isFixed = /TL|TRY|₺/i.test(rawPayout);
            const cleanPayoutMatch = rawPayout.match(/[\d.,]+/);
            const cleanPayout = cleanPayoutMatch ? parseFloat(cleanPayoutMatch[0].replace(',', '.')) : 0;

            return {
                id: `ra-${m.id || Math.random().toString(36).substr(2, 9)}`,
                name: m.name,
                category: (m.categories && m.categories[0]?.name) || 'Diğer',
                type: 'brand' as const,
                logoUrl: m.logo || `https://logo.clearbit.com/${m.name.toLowerCase().replace(/\s+/g, '')}.com`,
                donationRate: cleanPayout,
                donationRateDisplay: isFixed ? `${cleanPayout} ₺` : `%${cleanPayout}`,
                followers: Math.floor(Math.random() * 50000) + 500,
                about: m.description || `${m.name} markası toplumsal fayda sağlamaktadır.`,
                link: m.preview_url
            };
        }).filter(Boolean);

        processedBrands.forEach((brand: any) => {
            const key = brand.name.toLowerCase();
            if (!uniqueOffersMap.has(key)) {
                uniqueOffersMap.set(key, brand);
            }
        });

        const finalOffers = Array.from(uniqueOffersMap.values());
        console.log(`API Fetch Complete: ${finalOffers.length} unique brands processed.`);
        
        return finalOffers;
    } catch (e) {
        console.error("Global API fetch operation failed:", e);
        return [];
    }
}
