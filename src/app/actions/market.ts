
'use server';

import type { Brand } from '@/lib/types';

/**
 * Üç farklı ajansın (Gelir Ortakları, Affocean, ReklamAction) 
 * verilerini çeken ve birleştiren sunucu eylemi.
 * Kullanıcının sağladığı commission ve brands yapısını destekler.
 */
export async function getApiOffers(): Promise<Brand[]> {
    const AGENCIES = [
        { 
            id: 'gelir-ortaklari',
            name: "Gelir Ortakları", 
            key: process.env.GELIR_ORTAKLARI_KEY,
            url: "https://api.gelirortaklari.com/v1/brands" 
        },
        { 
            id: 'affocean',
            name: "Affocean", 
            key: process.env.AFFOCEAN_KEY,
            url: "https://api.reklamaction.com/v1/offer?network=affocean" 
        },
        { 
            id: 'reklamaction',
            name: "ReklamAction", 
            key: process.env.REKLAMACTION_KEY,
            url: "https://api.reklamaction.com/v1/offer?network=reklamaction" 
        }
    ];

    try {
        const fetchPromises = AGENCIES.map(async (agency) => {
            if (!agency.key) {
                console.error(`API Key missing for ${agency.name}`);
                return [];
            }

            try {
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
                
                // Farklı API yapılarını normalize et (brands, data, offers, items)
                let rawItems = [];
                if (Array.isArray(result)) {
                    rawItems = result;
                } else if (result.brands && Array.isArray(result.brands)) {
                    rawItems = result.brands;
                } else if (result.data && Array.isArray(result.data)) {
                    rawItems = result.data;
                } else if (result.offers && Array.isArray(result.offers)) {
                    rawItems = result.offers;
                } else if (result.items && Array.isArray(result.items)) {
                    rawItems = result.items;
                }

                return rawItems.map((m: any) => {
                    if (!m) return null;

                    const brandName = m.name || m.title || m.brand_name || m.advertiser_name || "Bilinmeyen Marka";
                    const logoUrl = m.logo || m.image || m.logo_url || m.image_url || m.brand_logo || "";
                    const targetLink = m.tracking_url || m.preview_url || m.link || m.url || m.click_url || "#";

                    // Komisyon / Payout tespiti (commission alanını önceliklendiriyoruz)
                    const rawPayout = String(m.commission || m.payout || m.payout_percent || "0");
                    const isFixed = /TL|TRY|₺/i.test(rawPayout);
                    const cleanPayoutMatch = rawPayout.match(/[\d.,]+/);
                    const cleanPayout = cleanPayoutMatch ? parseFloat(cleanPayoutMatch[0].replace(',', '.')) : 0;

                    return {
                        id: `agency-${agency.id}-${m.id || Math.random().toString(36).substr(2, 9)}`,
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

        // Mükerrer kayıtları temizle
        const uniqueItemsMap = new Map<string, Brand>();
        allItems.forEach((brand) => {
            const key = brand.name.toLowerCase().trim();
            if (!uniqueItemsMap.has(key)) {
                uniqueItemsMap.set(key, brand);
            } else {
                const existing = uniqueItemsMap.get(key)!;
                if (brand.donationRate > existing.donationRate || (!existing.logoUrl && brand.logoUrl)) {
                    uniqueItemsMap.set(key, brand);
                }
            }
        });

        return Array.from(uniqueItemsMap.values());
    } catch (e) {
        console.error("Global API fetch operation failed:", e);
        return [];
    }
}
