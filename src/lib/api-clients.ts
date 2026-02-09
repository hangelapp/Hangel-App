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
 * Cleans brand names by removing common suffixes like CPS, Influencer, etc.
 */
function cleanBrandName(name: string): string {
    if (!name) return "Bilinmeyen Marka";
    return name
        .split('|')[0]
        .split('- CPS')[0]
        .split('- Influencer')[0]
        .split('CPS')[0]
        .split('CPA')[0]
        .split('CPL')[0]
        .trim();
}

/**
 * Server-side function to fetch offers from all configured agencies.
 */
export async function fetchAllAgencyOffers(): Promise<Brand[]> {
    const GO_KEY = (process.env.GELIR_ORTAKLARI_KEY || "891bae449589572cc756b5fe93e182c527ef910c2137c7e1ea53a0a366ab9cd3").trim();
    const AO_KEY = (process.env.AFFOCEAN_KEY || "9421478cae5d673deb12bf1fade2021da06b019654808fddf1ef568569234d48").trim();
    const RA_KEY = (process.env.REKLAMACTION_KEY || "2ae3a9b86708162dc059e78b6a8de2b4dee5444d13bb985b93340bdb6094bb54").trim();

    const standardHeaders = {
        "accept": "application/json",
        "Content-Type": "application/json",
        "Origin": "https://hangel.org",
        "Referer": "https://hangel.org"
    };

    /**
     * 1. GELİR ORTAKLARI (POST Search API)
     */
    const fetchGelir = async (): Promise<Brand[]> => {
        try {
            const res = await fetchWithTimeout("https://feed.gelirortaklari.com/api/v1/search", {
                method: "POST",
                headers: {
                    ...standardHeaders,
                    "x-api-key": GO_KEY
                },
                body: JSON.stringify({ "value": "" }),
                cache: 'no-store'
            });
            
            console.log("Gelir Ortakları Status:", res.status);
            if (!res.ok) return [];

            const raw = await res.json();
            const items = raw.results || raw.data || (Array.isArray(raw) ? raw : []);
            
            return items.map((item: any) => ({
                id: `go-${item.id || Math.random()}`,
                name: cleanBrandName(item.advertiser_name || item.name),
                category: item.category || "Genel",
                type: 'brand' as const,
                logoUrl: item.logo_url || item.image || "",
                donationRate: parseFloat(String(item.commission_rate || item.commission || "0")),
                link: item.click_url || item.tracking_url || "#",
                followers: Math.floor(Math.random() * 5000) + 1000,
                about: "Gelir Ortakları sosyal fayda ortağı."
            }));
        } catch (e) {
            console.error("Gelir Ortakları Fetch Error:", e);
            return [];
        }
    };

    /**
     * 2. AFFOCEAN
     */
    const fetchAffocean = async (): Promise<Brand[]> => {
        try {
            const res = await fetchWithTimeout("https://affocean.com/api/v1/offers", {
                headers: { 
                    ...standardHeaders,
                    "Authorization": `Bearer ${AO_KEY}`
                },
                cache: 'no-store'
            });
            
            if (!res.ok) return [];

            const raw = await res.json();
            const items = raw.offers || raw.results || raw.data || (Array.isArray(raw) ? raw : []);

            return items.map((item: any) => ({
                id: `ao-${item.id || Math.random()}`,
                name: cleanBrandName(item.name || item.title),
                category: item.category || "Genel",
                type: 'brand' as const,
                logoUrl: item.logo || item.image || "",
                donationRate: parseFloat(String(item.payout || item.commission || "0")),
                link: item.link || item.tracking_url || "#",
                followers: Math.floor(Math.random() * 3000) + 500,
                about: "Affocean sosyal fayda ortağı."
            }));
        } catch (e) {
            console.error("Affocean Fetch Error:", e);
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
                    ...standardHeaders,
                    "Authorization": `Bearer ${RA_KEY}`
                },
                cache: 'no-store'
            });
            
            if (!res.ok) return [];

            const raw = await res.json();
            const items = raw.results || raw.offers || raw.data || (Array.isArray(raw) ? raw : []);

            return items.map((item: any) => ({
                id: `ra-${item.id || Math.random()}`,
                name: cleanBrandName(item.name || item.title),
                category: item.category || "Genel",
                type: 'brand' as const,
                logoUrl: item.image || item.logo || "",
                donationRate: parseFloat(String(item.commission || item.payout || "0")),
                link: item.tracking_url || item.link || "#",
                followers: Math.floor(Math.random() * 4000) + 800,
                about: "ReklamAction sosyal fayda ortağı."
            }));
        } catch (e) {
            console.error("ReklamAction Fetch Error:", e);
            return [];
        }
    };

    const results = await Promise.allSettled([fetchGelir(), fetchAffocean(), fetchReklam()]);
    const combined = results.flatMap(r => r.status === 'fulfilled' ? r.value : []);
    
    return combined;
}
