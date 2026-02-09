
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
 * Fetches offers from all configured agencies with specific URLs and keys.
 */
export async function fetchAllAgencyOffers(): Promise<Brand[]> {
    const GO_KEY = "891bae449589572cc756b5fe93e182c527ef910c2137c7e1ea53a0a366ab9cd3";
    const AO_KEY = "9421478cae5d673deb12bf1fade2021da06b019654808fddf1ef568569234d48";
    const RA_KEY = "2ae3a9b86708162dc059e78b6a8de2b4dee5444d13bb985b93340bdb6094bb54";

    /**
     * 1. GELİR ORTAKLARI (POST Search API)
     * URL: https://feed.gelirortaklari.com/api/v1/search
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
                body: JSON.stringify({ "value": "" }),
                cache: 'no-store'
            });
            if (!res.ok) return [];
            const data = await res.json();
            
            console.log("Gelir Ortakları Ham Veri (Server):", data);
            
            const results = data.results || data.brands || (Array.isArray(data) ? data : []);
            
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
     * 2. AFFOCEAN (GET API)
     * URL: https://affocean.com/api/v1/offers
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
            
            console.log("Affocean Ham Veri (Server):", data);
            
            const results = Array.isArray(data) ? data : (data.results || []);
            
            return results.map((item: any) => ({
                id: `ao-${item.id || Math.random().toString(36).substr(2, 9)}`,
                name: item.name || item.advertiser_name || "Marka",
                category: item.category || "Genel",
                type: 'brand' as const,
                logoUrl: item.logo || item.image || item.logo_url || "",
                donationRate: parseFloat(String(item.commission || item.commission_rate || "0")),
                link: item.tracking_url || item.link || item.click_url || "#",
                followers: Math.floor(Math.random() * 3000) + 500,
                about: "Affocean iş ortağı."
            }));
        } catch (e) {
            console.error("Affocean Fetch Error:", e);
            return [];
        }
    };

    /**
     * 3. REKLAMACTION (GET API)
     * URL: https://api.reklamaction.com/v1/offer?network=reklamaction
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
            
            console.log("ReklamAction Ham Veri (Server):", data);
            
            const results = Array.isArray(data) ? data : (data.results || []);
            
            return results.map((item: any) => ({
                id: `ra-${item.id || Math.random().toString(36).substr(2, 9)}`,
                name: item.name || item.advertiser_name || "Marka",
                category: item.category || "Genel",
                type: 'brand' as const,
                logoUrl: item.logo || item.image || item.logo_url || "",
                donationRate: parseFloat(String(item.commission || item.commission_rate || "0")),
                link: item.tracking_url || item.link || item.click_url || "#",
                followers: Math.floor(Math.random() * 4000) + 800,
                about: "ReklamAction iş ortağı."
            }));
        } catch (e) {
            console.error("ReklamAction Fetch Error:", e);
            return [];
        }
    };

    const results = await Promise.allSettled([fetchGelir(), fetchAffocean(), fetchReklam()]);
    
    const allBrands = results.flatMap(r => r.status === 'fulfilled' ? r.value : []);
    
    console.log("Tüm Ajanslardan Gelen Toplam Veri (Merged):", allBrands.length);

    return allBrands;
}
