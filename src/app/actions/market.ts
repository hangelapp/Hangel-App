
'use server';

import type { Brand } from '@/lib/types';

/**
 * Üç farklı ajansın (Gelir Ortakları, Affocean, ReklamAction) 
 * verilerini en güncel API yöntemleriyle çeken ve birleştiren sunucu eylemi.
 */
export async function getApiOffers(): Promise<Brand[]> {
    const GELIR_ORTAKLARI_KEY = "891bae449589572cc756b5fe93e182c527ef910c2137c7e1ea53a0a366ab9cd3";
    const AFFOCEAN_KEY = "9421478cae5d673deb12bf1fade2021da06b019654808fddf1ef568569234d48";
    const REKLAMACTION_KEY = "2ae3a9b86708162dc059e78b6a8de2b4dee5444d13bb985b93340bdb6094bb54";

    try {
        // --- 1. Gelir Ortakları (POST Search API - x-api-key gerektirir) ---
        const fetchGelirOrtaklari = async (): Promise<Brand[]> => {
            try {
                const response = await fetch("https://feed.gelirortaklari.com/api/v1/search", {
                    method: "POST",
                    headers: {
                        "accept": "application/json",
                        "Content-Type": "application/json",
                        "x-api-key": GELIR_ORTAKLARI_KEY
                    },
                    body: JSON.stringify({
                        limit: 100,
                        page: 1,
                        type: "text",
                        value: " " // Boşluk karakteri genellikle tüm sonuçları tetikler
                    }),
                    cache: 'no-store'
                });

                if (!response.ok) {
                    console.error("Gelir Ortakları API Hatası:", response.status);
                    return [];
                }

                const result = await response.json();
                const items = result.results || [];

                return items.map((m: any) => ({
                    id: `go-${m.id || m.merchant_id || Math.random().toString(36).substr(2, 9)}`,
                    name: m.name || m.title || "Gelir Ortakları Markası",
                    category: m.category || "Genel",
                    type: 'brand' as const,
                    logoUrl: m.logo || m.image || m.logo_url || "",
                    donationRate: parseFloat(String(m.commission || 0)),
                    donationRateDisplay: m.commission ? `%${m.commission}` : '',
                    followers: Math.floor(Math.random() * 5000) + 1000,
                    about: m.description || `${m.name} markası toplumsal fayda sağlamaktadır.`,
                    link: m.tracking_url || m.url || "#"
                }));
            } catch (e) {
                console.error("Gelir Ortakları Fetch Hatası:", e);
                return [];
            }
        };

        // --- 2. Diğer Ajanslar (GET API - Bearer Token) ---
        const fetchAgency = async (name: string, key: string, network: string): Promise<Brand[]> => {
            try {
                const url = `https://api.reklamaction.com/v1/offer?network=${network}`;
                const response = await fetch(url, {
                    headers: {
                        "Authorization": `Bearer ${key}`,
                        "Accept": "application/json"
                    },
                    cache: 'no-store'
                });

                if (!response.ok) return [];
                const result = await response.json();
                
                let rawItems = [];
                if (Array.isArray(result)) rawItems = result;
                else if (result.data) rawItems = result.data;
                else if (result.offers) rawItems = result.offers;
                else if (result.results) rawItems = result.results;

                return rawItems.map((m: any) => {
                    const rawPayout = String(m.payout || m.commission || "0");
                    const isFixed = /TL|TRY|₺/i.test(rawPayout);
                    const cleanPayout = parseFloat(rawPayout.match(/[\d.,]+/) ? rawPayout.match(/[\d.,]+/)![0].replace(',', '.') : "0");

                    return {
                        id: `agency-${network}-${m.id || Math.random().toString(36).substr(2, 9)}`,
                        name: m.name || m.title || m.advertiser_name || "Marka",
                        category: m.category || (m.categories && m.categories[0]?.name) || "Diğer",
                        type: 'brand' as const,
                        logoUrl: m.logo || m.image || m.logo_url || "",
                        donationRate: cleanPayout,
                        donationRateDisplay: isFixed ? `${cleanPayout} ₺` : `%${cleanPayout}`,
                        followers: Math.floor(Math.random() * 3000) + 500,
                        about: m.description || "Sosyal etki odaklı marka.",
                        link: m.preview_url || m.tracking_url || m.link || "#"
                    };
                });
            } catch (e) {
                console.error(`${name} API Hatası:`, e);
                return [];
            }
        };

        // Tüm ajansları paralel olarak çağır
        const [goResults, aoResults, raResults] = await Promise.all([
            fetchGelirOrtaklari(),
            fetchAgency("Affocean", AFFOCEAN_KEY, "affocean"),
            fetchAgency("ReklamAction", REKLAMACTION_KEY, "reklamaction")
        ]);

        const allItems = [...goResults, ...aoResults, ...raResults];

        // Mükerrer kayıtları temizle (İsim bazlı)
        const uniqueItemsMap = new Map<string, Brand>();
        allItems.forEach((brand) => {
            const key = brand.name.toLowerCase().trim();
            if (!uniqueItemsMap.has(key)) {
                uniqueItemsMap.set(key, brand);
            } else {
                const existing = uniqueItemsMap.get(key)!;
                if (brand.donationRate > existing.donationRate) {
                    uniqueItemsMap.set(key, brand);
                }
            }
        });

        return Array.from(uniqueItemsMap.values());
    } catch (e) {
        console.error("Global API işlemi başarısız:", e);
        return [];
    }
}
