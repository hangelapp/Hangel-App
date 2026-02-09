import type { Brand } from './types';

const FETCH_TIMEOUT = 15000;

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

/**
 * Fetches offers from all configured agencies (Gelir Ortakları, ReklamAction, Affocean).
 */
export async function fetchAllAgencyOffers(): Promise<Brand[]> {
    const GO_KEY = process.env.GELIR_ORTAKLARI_KEY || "891bae449589572cc756b5fe93e182c527ef910c2137c7e1ea53a0a366ab9cd3";
    const RA_KEY = process.env.REKLAMACTION_KEY || "2ae3a9b86708162dc059e78b6a8de2b4dee5444d13bb985b93340bdb6094bb54";
    const AO_KEY = process.env.AFFOCEAN_KEY || "9421478cae5d673deb12bf1fade2021da06b019654808fddf1ef568569234d48";

    /**
     * 1. GELİR ORTAKLARI (POST Search API)
     */
    const fetchGelir = async (): Promise<Brand[]> => {
        try {
            const res = await fetchWithTimeout("https://feed.gelirortaklari.com/api/v1/search", {
                method: "POST",
                headers: {
                    "accept": "application/json",
                    "Content-Type": "application/json",
                    "x-api-key": GO_KEY
                },
                body: JSON.stringify({
                    "value": "" // Simplified body to get maximum results
                }),
                cache: 'no-store'
            });
            if (!res.ok) return [];
            const data = await res.json();
            
            // LOG FOR DEBUGGING
            console.log("Gelir Ortakları Ham Veri (Server):", data);
            
            const results = data.results || (Array.isArray(data) ? data : []);
            
            return results.map((item: any) => ({
                id: `go-${item.id || Math.random().toString(36).substr(2, 9)}`,
                name: item.advertiser_name || item.name || "Marka",
                category: item.category || "Genel",
                type: 'brand' as const,
                logoUrl: item.logo_url || item.image || item.logo || "",
                donationRate: parseFloat(String(item.commission_rate || item.commission || "0")),
                link: item.click_url || item.tracking_url || "#",
                followers: Math.floor(Math.random() * 5000) + 1000,
                about: "Gelir Ortakları iş ortağı."
            }));
        } catch (e) {
            console.error("Gelir Ortakları Fetch Error:", e);
            return [];
        }
    };

    /**
     * 2. REKLAMACTION (GET Bearer)
     */
    const fetchReklam = async (): Promise<Brand[]> => {
        try {
            const res = await fetchWithTimeout("https://api.reklamaction.com/v1/offer?network=reklamaction", {
                headers: { 
                    "Authorization": `Bearer ${RA_KEY}`,
                    "accept": "application/json"
                },
                cache: 'no-store'
            });
            if (!res.ok) return [];
            const data = await res.json();
            const results = Array.isArray(data) ? data : [];
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
            console.error("ReklamAction Fetch Error:", e);
            return [];
        }
    };

    /**
     * 3. AFFOCEAN (GET Bearer)
     */
    const fetchAffocean = async (): Promise<Brand[]> => {
        try {
            const res = await fetchWithTimeout("https://affocean.com/api/v1/offers", {
                headers: { 
                    "Authorization": `Bearer ${AO_KEY}`,
                    "accept": "application/json"
                },
                cache: 'no-store'
            });
            if (!res.ok) return [];
            const data = await res.json();
            const results = Array.isArray(data) ? data : [];
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
            console.error("Affocean Fetch Error:", e);
            return [];
        }
    };

    const results = await Promise.allSettled([fetchGelir(), fetchReklam(), fetchAffocean()]);
    const allBrands = results.flatMap(r => r.status === 'fulfilled' ? r.value : []);

    const uniqueMap = new Map<string, Brand>();
    allBrands.forEach(b => {
        const key = b.name.toLowerCase().trim();
        if (!uniqueMap.has(key) || b.donationRate > (uniqueMap.get(key)?.donationRate || 0)) {
            uniqueMap.set(key, b);
        }
    });

    return Array.from(uniqueMap.values());
}