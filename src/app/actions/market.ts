'use server';

import type { Brand } from '@/lib/types';

/**
 * Üç farklı ajansın (Gelir Ortakları, Affocean, ReklamAction) 
 * kendi ağ parametreleri ile verileri çeken sunucu eylemi.
 */
export async function getApiOffers() {
    const AGENCIES = [
        { 
            name: "Gelir Ortakları", 
            key: "891bae449589572cc756b5fe93e182c527ef910c2137c7e1ea53a0a366ab9cd3",
            network: "gelirortaklari" 
        },
        { 
            name: "Affocean", 
            key: "9421478cae5d673deb12bf1fade2021da06b019654808fddf1ef568569234d48",
            network: "affocean" 
        },
        { 
            name: "ReklamAction", 
            key: "2ae3a9b86708162dc059e78b6a8de2b4dee5444d13bb985b93340bdb6094bb54",
            network: "reklamaction" 
        }
    ];
    
    const baseUrl = "https://api.reklamaction.com/v1/offer";

    try {
        console.log(`API Fetching started for ${AGENCIES.length} agencies...`);
        
        // Tüm ajanslar için paralel ve bağımsız fetch işlemleri
        const fetchPromises = AGENCIES.map(async (agency) => {
            try {
                const url = `${baseUrl}?network=${agency.network}`;
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
                const offers = Array.isArray(result) ? result : (result.data || []);
                
                console.log(`${agency.name} returned ${offers.length} offers.`);

                return offers.map((m: any) => {
                    if (!m || !m.name) return null;

                    const rawPayout = m.payout || "0";
                    const isFixed = /TL|TRY|₺/i.test(rawPayout);
                    const cleanPayoutMatch = rawPayout.match(/[\d.,]+/);
                    const cleanPayout = cleanPayoutMatch ? parseFloat(cleanPayoutMatch[0].replace(',', '.')) : 0;

                    return {
                        id: `ra-${agency.network}-${m.id || Math.random().toString(36).substr(2, 9)}`,
                        name: m.name,
                        category: (m.categories && m.categories[0]?.name) || 'Diğer',
                        type: 'brand' as const,
                        logoUrl: m.logo,
                        donationRate: cleanPayout,
                        donationRateDisplay: isFixed ? `${cleanPayout} ₺` : `%${cleanPayout}`,
                        followers: Math.floor(Math.random() * 50000) + 500,
                        about: m.description || `${m.name} markası toplumsal fayda sağlamaktadır.`,
                        link: m.preview_url || m.link
                    };
                }).filter(Boolean);
            } catch (err) {
                console.error(`Fetch failed for ${agency.name}:`, err);
                return [];
            }
        });

        const results = await Promise.all(fetchPromises);
        const allOffers = results.flat();

        // Mükerrer kayıtları temizle (İsim bazlı)
        const uniqueOffersMap = new Map();
        allOffers.forEach((brand: any) => {
            const key = brand.name.toLowerCase().trim();
            // Eğer marka zaten varsa ama yeni gelenin oranı daha yüksekse güncelle
            if (!uniqueOffersMap.has(key)) {
                uniqueOffersMap.set(key, brand);
            } else {
                const existing = uniqueOffersMap.get(key);
                if (brand.donationRate > existing.donationRate) {
                    uniqueOffersMap.set(key, brand);
                }
            }
        });

        const finalOffers = Array.from(uniqueOffersMap.values());
        console.log(`API Fetch Complete: ${finalOffers.length} unique brands processed from all agencies.`);
        
        return finalOffers;
    } catch (e) {
        console.error("Global API fetch operation failed:", e);
        return [];
    }
}
