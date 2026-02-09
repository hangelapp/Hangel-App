
'use server';

import type { Brand } from '@/lib/types';

/**
 * Gelir Ortakları, Affocean ve ReklamAction ajanslarından 
 * gelen verileri birleştiren ve tekilleştiren sunucu eylemi.
 */
export async function getApiOffers(): Promise<Brand[]> {
    const GELIR_ORTAKLARI_KEY = "891bae449589572cc756b5fe93e182c527ef910c2137c7e1ea53a0a366ab9cd3";
    const AFFOCEAN_KEY = "9421478cae5d673deb12bf1fade2021da06b019654808fddf1ef568569234d48";
    const REKLAMACTION_KEY = "2ae3a9b86708162dc059e78b6a8de2b4dee5444d13bb985b93340bdb6094bb54";

    try {
        // --- 1. Gelir Ortakları (POST Search API) ---
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
                        value: "a" // 'a' karakteri genellikle en çok sonucu döndürür
                    }),
                    cache: 'no-store'
                });

                if (!response.ok) return [];
                const data = await response.json();
                const results = data.results || [];

                return results.map((m: any) => ({
                    id: `go-${m.id || Math.random().toString(36).substr(2, 9)}`,
                    name: m.name || "Gelir Ortakları Markası",
                    category: m.category || "Genel",
                    type: 'brand' as const,
                    logoUrl: m.logo || "",
                    donationRate: parseFloat(String(m.commission || 0)),
                    donationRateDisplay: m.commission ? `%${m.commission}` : '',
                    followers: Math.floor(Math.random() * 5000) + 1000,
                    about: m.description || "Sosyal etki odaklı marka.",
                    link: m.tracking_url || "#"
                }));
            } catch (e) {
                console.error("Gelir Ortakları hatası:", e);
                return [];
            }
        };

        // --- 2. Affocean & ReklamAction (GET API) ---
        const fetchAgency = async (key: string, network: string): Promise<Brand[]> => {
            try {
                const response = await fetch(`https://api.reklamaction.com/v1/offer?network=${network}`, {
                    headers: {
                        "Authorization": `Bearer ${key}`,
                        "Accept": "application/json"
                    },
                    cache: 'no-store'
                });

                if (!response.ok) return [];
                const data = await response.json();
                const items = Array.isArray(data) ? data : (data.data || data.offers || []);

                return items.map((m: any) => {
                    const rawPayout = String(m.payout || m.commission || "0");
                    const isFixed = /TL|TRY|₺/i.test(rawPayout);
                    const cleanPayout = parseFloat(rawPayout.replace(/[^0-9.]/g, '') || "0");

                    return {
                        id: `agency-${network}-${m.id || Math.random().toString(36).substr(2, 9)}`,
                        name: m.name || m.title || "Marka",
                        category: m.category || "Genel",
                        type: 'brand' as const,
                        logoUrl: m.logo || m.image || "",
                        donationRate: cleanPayout,
                        donationRateDisplay: isFixed ? `${cleanPayout} ₺` : `%${cleanPayout}`,
                        followers: Math.floor(Math.random() * 3000) + 500,
                        about: m.description || "Sosyal etki odaklı marka.",
                        link: m.tracking_url || m.preview_url || "#"
                    };
                });
            } catch (e) {
                console.error(`${network} hatası:`, e);
                return [];
            }
        };

        // Tüm ajansları paralel olarak çağır
        const [goResults, aoResults, raResults] = await Promise.all([
            fetchGelirOrtaklari(),
            fetchAgency(AFFOCEAN_KEY, "affocean"),
            fetchAgency(REKLAMACTION_KEY, "reklamaction")
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
