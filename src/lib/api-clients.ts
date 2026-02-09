
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
 * Server-side function to fetch offers from all configured agencies.
 * Uses environment variables for security.
 */
export async function fetchAllAgencyOffers(): Promise<Brand[]> {
    const GO_KEY = process.env.GELIR_ORTAKLARI_KEY;
    const AO_KEY = process.env.AFFOCEAN_KEY;
    const RA_KEY = process.env.REKLAMACTION_KEY;

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
                body: JSON.stringify({ "value": "" }),
                cache: 'no-store'
            });
            if (!res.ok) return [];
            const data = await res.json();
            
            console.log("Gelir Ortakları Ham Veri (Server):", Array.isArray(data.results) ? data.results.length : 0);
            
            const results = data.results || [];
            return results.map((item: any) => ({
                id: `go-${item.id || Math.random().toString(36).substr(2, 9)}`,
                name: item.advertiser_name || item.name || "Marka",
                category: item.category || "Genel",
                type: 'brand' as const,
                logoUrl: item.logo_url || item.image || "",
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
     */
    const fetchAffocean = async (): Promise<Brand[]> => {
        if (!AO_KEY) return [];
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
            
            const results = Array.isArray(data) ? data : (data.results || []);
            console.log("Affocean Ham Veri (Server):", results.length);

            return results.map((item: any) => ({
                id: `ao-${item.id || Math.random().toString(36).substr(2, 9)}`,
                name: item.name || "Marka",
                category: item.category || "Genel",
                type: 'brand' as const,
                logoUrl: item.logo || item.image || "",
                donationRate: parseFloat(String(item.commission || "0")),
                link: item.link || item.tracking_url || "#",
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
     */
    const fetchReklam = async (): Promise<Brand[]> => {
        if (!RA_KEY) return [];
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
            
            const results = Array.isArray(data) ? data : (data.results || []);
            console.log("ReklamAction Ham Veri (Server):", results.length);

            return results.map((item: any) => ({
                id: `ra-${item.id || Math.random().toString(36).substr(2, 9)}`,
                name: item.name || "Marka",
                category: item.category || "Genel",
                type: 'brand' as const,
                logoUrl: item.logo || item.image || "",
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

    const results = await Promise.allSettled([fetchGelir(), fetchAffocean(), fetchReklam()]);
    
    const combinedData = results.flatMap(r => r.status === 'fulfilled' ? r.value : []);
    console.log("Tüm Ajanslardan Gelen Toplam Veri (Server):", combinedData.length);

    return combinedData;
}
