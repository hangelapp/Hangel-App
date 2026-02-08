'use server';

import type { Brand } from '@/lib/types';

/**
 * Üç farklı ajansın (Gelir Ortakları, Affocean, ReklamAction) 
 * kendi özel URL ve anahtarlarıyla verileri çeken sunucu eylemi.
 */
export async function getApiOffers(): Promise<Brand[]> {
    const AGENCIES = [
        { 
            name: "Gelir Ortakları", 
            key: "891bae449589572cc756b5fe93e182c527ef910c2137c7e1ea53a0a366ab9cd3",
            url: "https://api.gelirortaklari.com/v1/brands" 
        },
        { 
            name: "Affocean", 
            key: "9421478cae5d673deb12bf1fade2021da06b019654808fddf1ef568569234d48",
            url: "https://api.reklamaction.com/v1/offer?network=affocean" 
        },
        { 
            name: "ReklamAction", 
            key: "2ae3a9b86708162dc059e78b6a8de2b4dee5444d13bb985b93340bdb6094bb54",
            url: "https://api.reklamaction.com/v1/offer?network=reklamaction" 
        }
    ];

    try {
        const fetchPromises = AGENCIES.map(async (agency) => {
            try {
                console.log(`Fetching from ${agency.name}...`);
                const response = await fetch(agency.url, {
                    headers: {
                        "Authorization": `Bearer ${agency.key}`,
                        "Accept": "application/json"
                    },
                    cache: 'no-store'
                });

                if (!response.ok) {
                    console.error(`API Error for ${agency.name}: ${response.status}`);
                    return [];
                }

                const result = await response.json();
                
                // Farklı API yapılarını (data, offers, items, brands veya direkt array) normalize et
                let rawItems = [];
                if (Array.isArray(result)) {
                    rawItems = result;
                } else if (result.data && Array.isArray(result.data)) {
                    rawItems = result.data;
                } else if (result.brands && Array.isArray(result.brands)) {
                    rawItems = result.brands;
                } else if (result.offers && Array.isArray(result.offers)) {
                    rawItems = result.offers;
                } else if (result.items && Array.isArray(result.items)) {
                    rawItems = result.items;
                }

                console.log(`${agency.name} returned ${rawItems.length} items.`);
                
                return rawItems.map((m: any) => {
                    if (!m) return null;

                    // İsim/Başlık tespiti (Sağladığınız örnekteki b.name öncelikli)
                    const brandName = m.name || m.title || m.brand_name || m.advertiser_name || "Bilinmeyen Marka";
                    
                    // Logo tespiti (Sağladığınız örnekteki b.logo öncelikli)
                    const logoUrl = m.logo || m.image || m.logo_url || m.image_url || m.brand_logo || "";
                    
                    // Link tespiti (Sağladığınız örnekteki b.tracking_url öncelikli)
                    const targetLink = m.tracking_url || m.preview_url || m.link || m.url || m.click_url || "#";

                    // Payout (Oran) tespiti ve temizliği
                    const rawPayout = String(m.payout || m.commission || "0");
                    const isFixed = /TL|TRY|₺/i.test(rawPayout);
                    const cleanPayoutMatch = rawPayout.match(/[\d.,]+/);
                    const cleanPayout = cleanPayoutMatch ? parseFloat(cleanPayoutMatch[0].replace(',', '.')) : 0;

                    return {
                        id: `agency-${agency.name.toLowerCase().replace(/\s/g, '-')}-${m.id || Math.random().toString(36).substr(2, 9)}`,
                        name: brandName,
                        category: (m.categories && m.categories[0]?.name) || m.category || 'Diğer',
                        type: 'brand' as const,
                        logoUrl: logoUrl,
                        donationRate: cleanPayout,
                        donationRateDisplay: isFixed ? `${cleanPayout} ₺` : (cleanPayout > 0 ? `%${cleanPayout}` : ''),
                        followers: Math.floor(Math.random() * 50000) + 500,
                        about: m.description || `${brandName} markası toplumsal fayda sağlamaktadır.`,
                        link: targetLink
                    };
                }).filter(Boolean);
            } catch (err) {
                console.error(`Fetch failed for ${agency.name}:`, err);
                return [];
            }
        });

        const results = await Promise.all(fetchPromises);
        const allItems = results.flat() as Brand[];

        // Mükerrer kayıtları temizle (İsim bazlı)
        const uniqueItemsMap = new Map<string, Brand>();
        allItems.forEach((brand) => {
            const key = brand.name.toLowerCase().trim();
            if (!uniqueItemsMap.has(key)) {
                uniqueItemsMap.set(key, brand);
            } else {
                const existing = uniqueItemsMap.get(key)!;
                // Daha yüksek bağış oranı olanı veya geçerli bir logosu olanı tercih et
                if (brand.donationRate > existing.donationRate || (!existing.logoUrl && brand.logoUrl)) {
                    uniqueItemsMap.set(key, brand);
                }
            }
        });

        const finalResult = Array.from(uniqueItemsMap.values());
        console.log(`Total unique brands found: ${finalResult.length}`);
        return finalResult;
    } catch (e) {
        console.error("Global API fetch operation failed:", e);
        return [];
    }
}