
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
 * Acts as a proxy to bypass CORS and hide API keys from the browser.
 */
export async function fetchAllAgencyOffers(): Promise<Brand[]> {
    const GO_KEY = process.env.GELIR_ORTAKLARI_KEY;
    const AO_KEY = process.env.AFFOCEAN_KEY;
    const RA_KEY = process.env.REKLAMACTION_KEY;

    /**
     * 1. GELİR ORTAKLARI (POST Search API)
     * Deep Scan: results -> data
     */
    const fetchGelir = async (): Promise<Brand[]> => {
        try {
            const res = await fetchWithTimeout("https://feed.gelirortaklari.com/api/v1/search", {
                method: "POST",
                headers: {
                    "accept": "application/json",
                    "Content-Type": "application/json",
                    "x-api-key": GO_KEY || ""
                },
                body: JSON.stringify({ "value": "" }),
                cache: 'no-store'
            });
            
            console.log("Gelir Ortakları Status:", res.status);
            if (!res.ok) return [];

            const raw = await res.json();
            // Deep Scanning for results
            const items = raw.results || raw.data || (Array.isArray(raw) ? raw : []);
            
            if (items.length === 0) console.error("Hangi Ajans Boş Döndü: Gelir Ortakları");

            return items.map((item: any) => ({
                id: `go-${item.id || Math.random()}`,
                name: item.advertiser_name || item.name || "Bilinmeyen Marka",
                category: item.category || "Genel",
                type: 'brand' as const,
                logoUrl: item.logo_url || item.image || "",
                donationRate: parseFloat(String(item.commission_rate || item.commission || "0")),
                link: item.click_url || item.tracking_url || "#",
                followers: Math.floor(Math.random() * 5000) + 1000,
                about: "Gelir Ortakları sosyal fayda ortağı."
            }));
        } catch (e) {
            console.error("Gelir Ortakları Fetch Hatası:", e);
            return [];
        }
    };

    /**
     * 2. AFFOCEAN
     * Deep Scan: offers -> results -> data
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
            
            console.log("Affocean Status:", res.status);
            if (!res.ok) return [];

            const raw = await res.json();
            const items = raw.offers || raw.results || raw.data || (Array.isArray(raw) ? raw : []);

            return items.map((item: any) => ({
                id: `ao-${item.id || Math.random()}`,
                name: item.name || item.title || "Bilinmeyen Marka",
                category: item.category || "Genel",
                type: 'brand' as const,
                logoUrl: item.logo || item.image || "",
                donationRate: parseFloat(String(item.payout || item.commission || "0")),
                link: item.link || item.tracking_url || "#",
                followers: Math.floor(Math.random() * 3000) + 500,
                about: "Affocean sosyal fayda ortağı."
            }));
        } catch (e) {
            console.error("Affocean Fetch Hatası:", e);
            return [];
        }
    };

    /**
     * 3. REKLAMACTION
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
            
            console.log("ReklamAction Status:", res.status);
            if (!res.ok) return [];

            const raw = await res.json();
            const items = raw.results || raw.offers || raw.data || (Array.isArray(raw) ? raw : []);

            return items.map((item: any) => ({
                id: `ra-${item.id || Math.random()}`,
                name: item.name || item.title || "Bilinmeyen Marka",
                category: item.category || "Genel",
                type: 'brand' as const,
                logoUrl: item.image || item.logo || "",
                donationRate: parseFloat(String(item.commission || item.payout || "0")),
                link: item.tracking_url || item.link || "#",
                followers: Math.floor(Math.random() * 4000) + 800,
                about: "ReklamAction sosyal fayda ortağı."
            }));
        } catch (e) {
            console.error("ReklamAction Fetch Hatası:", e);
            return [];
        }
    };

    const results = await Promise.allSettled([fetchGelir(), fetchAffocean(), fetchReklam()]);
    const combined = results.flatMap(r => r.status === 'fulfilled' ? r.value : []);
    
    console.log("Sunucu: Toplam Birleştirilen Veri:", combined.length);
    return combined;
}
