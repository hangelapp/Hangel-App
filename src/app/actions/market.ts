'use server';

/**
 * Üç farklı ajanstan (Gelir Ortakları, Affocean, ReklamAction) teklifleri çeken sunucu eylemi.
 * Veriler temizlenerek ve mükerrer kayıtlar elenerek birleştirilir.
 */
export async function getApiOffers() {
    const AGENCIES = [
        { name: "Gelir Ortakları", key: "891bae449589572cc756b5fe93e182c527ef910c2137c7e1ea53a0a366ab9cd3" },
        { name: "Affocean", key: "9421478cae5d673deb12bf1fade2021da06b019654808fddf1ef568569234d48" },
        { name: "ReklamAction", key: "2ae3a9b86708162dc059e78b6a8de2b4dee5444d13bb985b93340bdb6094bb54" }
    ];
    
    const url = "https://api.reklamaction.com/v1/offer?network=reklamaction";

    try {
        console.log(`API Fetching started for ${AGENCIES.length} agencies...`);
        
        // Tüm ajanslar için paralel fetch işlemleri başlatılıyor
        const fetchPromises = AGENCIES.map(async (agency) => {
            try {
                const response = await fetch(url, {
                    headers: {
                        "Authorization": `Bearer ${agency.key}`
                    },
                    cache: 'no-store'
                });

                if (!response.ok) {
                    console.error(`API Error for ${agency.name}: ${response.status}`);
                    return [];
                }

                const result = await response.json();
                const offers = result.data || result || [];
                return Array.isArray(offers) ? offers : [];
            } catch (err) {
                console.error(`Fetch failed for ${agency.name}:`, err);
                return [];
            }
        });

        const results = await Promise.all(fetchPromises);
        const allOffers = results.flat();

        // Aynı isme sahip teklifleri temizle (Mükerrer kaydı önle)
        const uniqueOffersMap = new Map();
        
        const processedBrands = allOffers.map((m: any) => {
            if (!m || (!m.id && !m.name)) return null;

            const rawPayout = m.payout || "0";
            const isFixed = /TL|TRY|₺/i.test(rawPayout);
            const cleanPayoutMatch = rawPayout.match(/[\d.,]+/);
            const cleanPayout = cleanPayoutMatch ? parseFloat(cleanPayoutMatch[0].replace(',', '.')) : 0;

            return {
                id: `ra-${m.id || Math.random().toString(36).substr(2, 9)}`,
                name: m.name,
                category: (m.categories && m.categories[0]?.name) || 'Diğer',
                type: 'brand' as const,
                logoUrl: m.logo || `https://www.google.com/s2/favicons?domain=${m.name.toLowerCase().replace(/\s+/g, '')}.com&sz=128`,
                donationRate: cleanPayout,
                donationRateDisplay: isFixed ? `${cleanPayout} ₺` : `%${cleanPayout}`,
                followers: Math.floor(Math.random() * 50000) + 500,
                about: m.description || `${m.name} markası toplumsal fayda sağlamaktadır.`,
                link: m.preview_url
            };
        }).filter(Boolean);

        processedBrands.forEach((brand: any) => {
            const key = brand.name.toLowerCase().trim();
            if (!uniqueOffersMap.has(key)) {
                uniqueOffersMap.set(key, brand);
            }
        });

        const finalOffers = Array.from(uniqueOffersMap.values());
        console.log(`API Fetch Complete: ${finalOffers.length} unique brands processed from 3 agencies.`);
        
        return finalOffers;
    } catch (e) {
        console.error("Global API fetch operation failed:", e);
        return [];
    }
}
