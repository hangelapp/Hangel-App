
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
     * Mapping: advertiser_name -> name, logo_url -> logoUrl, commission_rate -> donationRate
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
            if (!res.ok) {
                console.error("Gelir Ortakları HTTP Hatası:", res.status);
                return [];
            }
            const rawResponse = await res.json();
            console.log("Gelir Ortakları Ham Yanıt:", JSON.stringify(rawResponse).slice(0, 500) + "...");

            // Deep mapping: Check results or data arrays
            const results = rawResponse.results || rawResponse.data || (Array.isArray(rawResponse) ? rawResponse : []);
            
            if (results.length === 0) {
                console.error("Hangi Ajans Boş Döndü: Gelir Ortakları");
            }

            return results.map((item: any) => ({
                id: `go-${item.id || Math.random().toString(36).substr(2, 9)}`,
                name: item.advertiser_name || item.name || item.title || "Bilinmeyen Marka",
                category: item.category || "Genel",
                type: 'brand' as const,
                logoUrl: item.logo_url || item.image || item.logo || "",
                donationRate: parseFloat(String(item.commission_rate || item.commission || "0")),
                link: item.click_url || item.tracking_url || "#",
                followers: Math.floor(Math.random() * 5000) + 1000,
                about: "Gelir Ortakları aracılığıyla sağlanan sosyal fayda ortağı."
            }));
        } catch (e) {
            console.error("Gelir Ortakları Fetch Hatası:", e);
            return [];
        }
    };

    /**
     * 2. AFFOCEAN (GET API)
     * Mapping: name -> name, logo -> logoUrl, payout/commission -> donationRate
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
            const rawResponse = await res.json();
            
            const results = rawResponse.results || rawResponse.offers || rawResponse.data || (Array.isArray(rawResponse) ? rawResponse : []);
            
            if (results.length === 0) {
                console.error("Hangi Ajans Boş Döndü: Affocean");
            }

            return results.map((item: any) => ({
                id: `ao-${item.id || Math.random().toString(36).substr(2, 9)}`,
                name: item.name || item.title || "Bilinmeyen Marka",
                category: item.category || "Genel",
                type: 'brand' as const,
                logoUrl: item.logo || item.image || item.logo_url || "",
                donationRate: parseFloat(String(item.payout || item.commission || "0")),
                link: item.link || item.tracking_url || "#",
                followers: Math.floor(Math.random() * 3000) + 500,
                about: "Affocean aracılığıyla sağlanan sosyal fayda ortağı."
            }));
        } catch (e) {
            console.error("Affocean Fetch Hatası:", e);
            return [];
        }
    };

    /**
     * 3. REKLAMACTION (GET API - Specific query network=reklamaction)
     * Mapping: name -> name, image -> logoUrl, commission -> donationRate
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
            const rawResponse = await res.json();
            
            const results = rawResponse.results || rawResponse.offers || rawResponse.data || (Array.isArray(rawResponse) ? rawResponse : []);
            
            if (results.length === 0) {
                console.error("Hangi Ajans Boş Döndü: ReklamAction");
            }

            return results.map((item: any) => ({
                id: `ra-${item.id || Math.random().toString(36).substr(2, 9)}`,
                name: item.name || item.title || "Bilinmeyen Marka",
                category: item.category || "Genel",
                type: 'brand' as const,
                logoUrl: item.image || item.logo || item.logo_url || "",
                donationRate: parseFloat(String(item.commission || item.payout || "0")),
                link: item.tracking_url || item.link || "#",
                followers: Math.floor(Math.random() * 4000) + 800,
                about: "ReklamAction aracılığıyla sağlanan sosyal fayda ortağı."
            }));
        } catch (e) {
            console.error("ReklamAction Fetch Hatası:", e);
            return [];
        }
    };

    // Execute all fetches in parallel, continuing even if some fail
    const settled = await Promise.allSettled([fetchGelir(), fetchAffocean(), fetchReklam()]);
    
    const combined = settled.flatMap(r => r.status === 'fulfilled' ? r.value : []);
    console.log("Sunucu: Toplam Birleştirilen Marka Sayısı:", combined.length);

    return combined;
}
