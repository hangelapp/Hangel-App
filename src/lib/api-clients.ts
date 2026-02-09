
import type { Brand } from './types';

const FETCH_TIMEOUT = 10000; // 10 saniye timeout

async function fetchWithTimeout(url: string, options: RequestInit) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
    
    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal,
        });
        clearTimeout(id);
        return response;
    } catch (error) {
        clearTimeout(id);
        throw error;
    }
}

export async function fetchAllAgencyOffers(): Promise<Brand[]> {
    const GELIR_ORTAKLARI_KEY = process.env.GELIR_ORTAKLARI_KEY;
    const AFFOCEAN_KEY = process.env.AFFOCEAN_KEY;
    const REKLAMACTION_KEY = process.env.REKLAMACTION_KEY;

    /**
     * GELİR ORTAKLARI - POST Search API
     */
    const fetchGelirOrtaklari = async (): Promise<Brand[]> => {
        if (!GELIR_ORTAKLARI_KEY) return [];
        try {
            const response = await fetchWithTimeout("https://feed.gelirortaklari.com/api/v1/search", {
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
                    value: " " // Boşluk karakteri genellikle tüm sonuçları getirir
                }),
                cache: 'no-store'
            });

            if (!response.ok) return [];
            const data = await response.json();
            const results = data.results || [];

            return results.map((m: any) => {
                // Komisyon oranını temizle
                const rawComm = String(m.commission || "0");
                const cleanComm = parseFloat(rawComm.replace(/[^0-9.]/g, '') || "0");

                return {
                    id: `go-${m.id || Math.random().toString(36).substring(2, 9)}`,
                    name: m.name || "Marka",
                    category: m.category || "Genel",
                    type: 'brand' as const,
                    logoUrl: m.logo || "",
                    donationRate: cleanComm,
                    donationRateDisplay: `%${cleanComm}`,
                    followers: Math.floor(Math.random() * 5000) + 1000,
                    about: m.description || "Sosyal etki odaklı marka.",
                    link: m.tracking_url || "#"
                };
            });
        } catch (e) {
            console.error("Gelir Ortakları fetch hatası:", e);
            return [];
        }
    };

    /**
     * DİĞER AJANSLAR (AFFOCEAN, REKLAMACTION) - GET Offer API
     */
    const fetchAgency = async (key: string | undefined, domain: string, network: string): Promise<Brand[]> => {
        if (!key) return [];
        try {
            const response = await fetchWithTimeout(`https://${domain}/v1/offer?network=${network}`, {
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
                    id: `agency-${network}-${m.id || Math.random().toString(36).substring(2, 9)}`,
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
            console.error(`${network} fetch hatası:`, e);
            return [];
        }
    };

    try {
        const results = await Promise.allSettled([
            fetchGelirOrtaklari(),
            fetchAgency(AFFOCEAN_KEY, "api.affocean.com", "affocean"),
            fetchAgency(REKLAMACTION_KEY, "api.reklamaction.com", "reklamaction")
        ]);

        const allItems = results.flatMap(result => result.status === 'fulfilled' ? result.value : []);

        const uniqueItemsMap = new Map<string, Brand>();
        allItems.forEach((brand) => {
            const key = brand.name.toLowerCase().trim();
            if (!uniqueItemsMap.has(key)) {
                uniqueItemsMap.set(key, brand);
            } else {
                const existing = uniqueItemsMap.get(key)!;
                // Daha yüksek bağış oranı olan ajans teklifini tercih et
                if (brand.donationRate > (existing.donationRate || 0)) {
                    uniqueItemsMap.set(key, brand);
                }
            }
        });

        return Array.from(uniqueItemsMap.values());
    } catch (e) {
        console.error("Global API işleme hatası:", e);
        return [];
    }
}
