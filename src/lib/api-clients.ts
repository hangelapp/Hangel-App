
import type { Brand } from './types';

const FETCH_TIMEOUT = 10000;

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
    const GO_KEY = process.env.GELIR_ORTAKLARI_KEY;
    const RA_KEY = process.env.REKLAMACTION_KEY;
    const AO_KEY = process.env.AFFOCEAN_KEY;

    /**
     * 1. GELİR ORTAKLARI (POST Search API)
     */
    const fetchGelir = async (): Promise<Brand[]> => {
        if (!GO_KEY) return [];
        try {
            const res = await fetchWithTimeout("https://feed.gelirortaklari.com/api/v1/search", {
                method: "POST",
                headers: {
                    "accept": "application/json",
                    "Content-Type": "application/json",
                    "x-api-key": GO_KEY
                },
                body: JSON.stringify({
                    limit: 100,
                    page: 1,
                    type: "text",
                    value: "a" // Broad search to get most brands
                }),
                cache: 'no-store'
            });
            if (!res.ok) return [];
            const data = await res.json();
            const results = data.results || [];
            return results.map((item: any) => ({
                id: `go-${item.id || Math.random().toString(36).substr(2, 9)}`,
                name: item.name || "Marka",
                category: item.category || "Genel",
                type: 'brand' as const,
                logoUrl: item.logo || "",
                donationRate: parseFloat(String(item.commission || "0")),
                link: item.tracking_url || "#",
                followers: Math.floor(Math.random() * 5000) + 1000,
                about: "Gelir Ortakları iş ortağı."
            }));
        } catch (e) {
            console.error("GO Fetch Error:", e);
            return [];
        }
    };

    /**
     * 2. REKLAMACTION (GET Bearer)
     */
    const fetchReklam = async (): Promise<Brand[]> => {
        if (!RA_KEY) return [];
        try {
            const res = await fetchWithTimeout("https://api.reklamaction.com/v1/offer?network=reklamaction", {
                headers: { "Authorization": `Bearer ${RA_KEY}` },
                cache: 'no-store'
            });
            if (!res.ok) return [];
            const data = await res.json();
            const results = Array.isArray(data) ? data : (data.results || data.offers || []);
            return results.map((item: any) => ({
                id: `ra-${item.id || Math.random().toString(36).substr(2, 9)}`,
                name: item.name || "Marka",
                category: item.category || "Genel",
                type: 'brand' as const,
                logoUrl: item.logo || "",
                donationRate: parseFloat(String(item.commission || "0")),
                link: item.tracking_url || item.link || "#",
                followers: Math.floor(Math.random() * 4000) + 800,
                about: "ReklamAction iş ortağı."
            }));
        } catch (e) {
            console.error("RA Fetch Error:", e);
            return [];
        }
    };

    /**
     * 3. AFFOCEAN (GET Bearer)
     */
    const fetchAffocean = async (): Promise<Brand[]> => {
        if (!AO_KEY) return [];
        try {
            const res = await fetchWithTimeout("https://affocean.com/api/v1/offers", {
                headers: { "Authorization": `Bearer ${AO_KEY}` },
                cache: 'no-store'
            });
            if (!res.ok) return [];
            const data = await res.json();
            const results = Array.isArray(data) ? data : (data.results || data.offers || []);
            return results.map((item: any) => ({
                id: `ao-${item.id || Math.random().toString(36).substr(2, 9)}`,
                name: item.name || "Marka",
                category: item.category || "Genel",
                type: 'brand' as const,
                logoUrl: item.logo || "",
                donationRate: parseFloat(String(item.commission || "0")),
                link: item.tracking_url || item.link || "#",
                followers: Math.floor(Math.random() * 3000) + 500,
                about: "Affocean iş ortağı."
            }));
        } catch (e) {
            console.error("AO Fetch Error:", e);
            return [];
        }
    };

    try {
        const responses = await Promise.allSettled([fetchGelir(), fetchReklam(), fetchAffocean()]);
        const allBrands = responses.flatMap(r => r.status === 'fulfilled' ? r.value : []);

        const uniqueMap = new Map<string, Brand>();
        allBrands.forEach(b => {
            const key = b.name.toLowerCase().trim();
            if (!uniqueMap.has(key) || b.donationRate > (uniqueMap.get(key)?.donationRate || 0)) {
                uniqueMap.set(key, b);
            }
        });

        return Array.from(uniqueMap.values());
    } catch (e) {
        return [];
    }
}
